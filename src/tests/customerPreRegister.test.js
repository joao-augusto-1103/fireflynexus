/**
 * Testes para validação da correção do bug de pré-cadastro cruzado
 * entre OS e OV
 */

import { firebaseService } from '../lib/firebaseService';

// Mock do Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn()
}));

// Mock do contexto Firebase
jest.mock('../lib/firebase', () => ({
  db: {}
}));

describe('Correção do Bug de Pré-cadastro Cruzado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Resetar estado interno do service
    firebaseService.customerPreRegisterInProgress.clear();
    firebaseService.customerPreRegisterPromises.clear();
    firebaseService.currentUserId = 'test-user-123';
    
    // Mock de configuração básica
    firebaseService.isFirebaseAvailable = true;
    firebaseService.initialized = true;
  });

  describe('createCustomerIfNotExists', () => {
    test('deve criar cliente novo quando não existe', async () => {
      // Verificar se função existe
      expect(typeof firebaseService.createCustomerIfNotExists).toBe('function');
      
      const customerData = {
        nome: 'João Silva',
        telefone: '11999887766',
        email: '',
        endereco: ''
      };

      const source = 'ordem_servico';
      
      // Mock para simular cliente não encontrado
      firebaseService._findCustomerByPhone = jest.fn().mockResolvedValue(null);
      
      // Mock para simular criação bem-sucedida
      firebaseService.saveData = jest.fn().mockResolvedValue('new-customer-id');
      
      const result = await firebaseService.createCustomerIfNotExists(customerData, source);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('new-customer-id');
      expect(result.fontePreCadastro).toBe(source);
      expect(result.observacoes).toContain(`Cadastrado automaticamente via ${source}`);
    });

    test('deve retornar cliente existente quando encontra', async () => {
      const existingCustomer = {
        id: 'existing-customer-id',
        nome: 'João Silva',
        telefone: '11999887766',
        fontePreCadastro: 'ordem_venda'
      };

      // Mock para simular cliente encontrado
      firebaseService._findCustomerByPhone = jest.fn().mockResolvedValue(existingCustomer);

      const customerData = {
        nome: 'João Silva',
        telefone: '11999887766'
      };

      const result = await firebaseService.createCustomerIfNotExists(customerData, 'ordem_servico');
      
      expect(result).toEqual(existingCustomer);
      expect(firebaseService.saveData).not.toHaveBeenCalled();
    });

    test('deve evitar cadastros duplicados quando chamado concorrentemente', async () => {
      const customerData = {
        nome: 'João Silva',
        telefone: '11999887766'
      };

      // Mock para simular cliente não encontrado
      firebaseService._findCustomerByPhone = jest.fn().mockResolvedValue(null);
      
      // Mock para simular criação bem-sucedida
      firebaseService.saveData = jest.fn().mockResolvedValue('new-customer-id');
      
      // Chamadas concorrentes simulando OS e OV simultâneas
      const promise1 = firebaseService.createCustomerIfNotExists(customerData, 'ordem_servico');
      const promise2 = firebaseService.createCustomerIfNotExists(customerData, 'ordem_venda');
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // Ambos devem retornar o mesmo cliente
      expect(result1.id).toBe(result2.id);
      
      // SaveData deve ser chamado apenas uma vez (evitando duplicação)
      expect(firebaseService.saveData).toHaveBeenCalledTimes(1);
      
      // Verificar que o controle de concorrência funcionou
      expect(firebaseService.customerPreRegisterInProgress.size).toBe(0);
      expect(firebaseService.customerPreRegisterPromises.size).toBe(0);
    });

    test('deve validar entrada de dados', async () => {
      // Testar dados incompletos
      const incompleteData = {
        nome: 'João Silva',
        // telefone ausente
      };

      await expect(
        firebaseService.createCustomerIfNotExists(incompleteData, 'ordem_servico')
      ).rejects.toThrow('Dados de cliente incompletos');

      // Testar dados nulos
      await expect(
        firebaseService.createCustomerIfNotExists(null, 'ordem_servico')
      ).rejects.toThrow('Dados de cliente incompletos');
    });

    test('deve registrar origem corretamente', async () => {
      const customerData = {
        nome: 'João Silva',
        telefone: '11999887766'
      };

      // Mock para simular cliente não encontrado
      firebaseService._findCustomerByPhone = jest.fn().mockResolvedValue(null);
      
      // Mock para simular criação bem-sucedida
      firebaseService.saveData = jest.fn().mockResolvedValue('new-customer-id');

      // Testar origem OS
      const resultOS = await firebaseService.createCustomerIfNotExists(customerData, 'ordem_servico');
      expect(resultOS.fontePreCadastro).toBe('ordem_servico');

      // Reset mocks
      jest.clearAllMocks();
      firebaseService._findCustomerByPhone = jest.fn().mockResolvedValue(null);
      firebaseService.saveData = jest.fn().mockResolvedValue('new-customer-id-2');

      // Testar origem OV
      const resultOV = await firebaseService.createCustomerIfNotExists(customerData, 'ordem_venda');
      expect(resultOV.fontePreCadastro).toBe('ordem_venda');
    });
  });

  describe('Validações de Campo Undefined', () => {
    test('saveData deve validar collectionName', async () => {
      const invalidCollection = undefined;
      const data = { nome: 'Teste' };

      await expect(
        firebaseService.saveData(invalidCollection, data)
      ).rejects.toThrow('Nome de coleção inválido');

      // Testar collectionName que não existe no mapeamento
      await expect(
        firebaseService.saveData('colecao_inexistente', data[])
      ).rejects.toThrow('Nome de coleção inválido');
    });

    test('getCollectionPath deve evitar undefined', () => {
      // Testar com collectionName válido
      const validPath = firebaseService.getCollectionPath('clientes');
      expect(validPath).toBeDefined();
      expect(validPath).not.toContain('undefined');
      expect(validPath).toContain('clientes');

      // Testar com collectionName inválido
      expect(() => {
        firebaseService.getCollectionPath(undefined);
      }).not.toThrow(); // Deve ter fallback, mas vamos verificar o resultado esperado
    });
  });

  describe('Fluxo Completo OS', () => {
    test('OS deve usar função centralizada corretamente', async () => {
      const customerData = {
        nome: 'Cliente OS',
        telefone: '11999887766'
      };

      // Mock para simular novo cliente
      firebaseService._findCustomerByPhone = jest.fn().mockResolvedValue(null);
      firebaseService.saveData = jest.fn().mockResolvedValue('client-os-id');

      const result = await firebaseService.createCustomerIfNotExists(customerData, 'ordem_servico');
      
      expect(result.id).toBe('client-os-id');
      expect(result.fontePreCadastro).toBe('ordem_servico');
      
      // Verificar que foi salvo com dados corretos
      expect(firebaseService.saveData).toHaveBeenCalledWith('clientes', expect.objectContaining({
        nome: 'Cliente OS',
        telefone: '11999887766',
        fontePreCadastro: 'ordem_servico',
        observacoes: 'Cadastrado automaticamente via ordem_servico'
      }));
    });
  });

  describe('Fluxo Completo OV', () => {
    test('OV deve usar função centralizada corretamente', async () => {
      const customerData = {
        nome: 'Cliente OV',
        telefone: '11999885544'
      };

      // Mock para simular novo cliente
      firebaseService._findCustomerByPhone = jest.fn().mockResolvedValue(null);
      firebaseService.saveData = jest.fn().mockResolvedValue('client-ov-id');

      const result = await firebaseService.createCustomerIfNotExists(customerData, 'ordem_venda');
      
      expect(result.id).toBe('client-ov-id');
      expect(result.fontePreCadastro).toBe('ordem_venda');
      
      // Verificar que foi salvo com dados corretos
      expect(firebaseService.saveData).toHaveBeenCalledWith('clientes', expect.objectContaining({
        nome: 'Cliente OV',
        telefone: '11999885544',
        fontePreCadastro: 'ordem_venda',
        observacoes: 'Cadastrado automaticamente via ordem_venda'
      }));
    });
  });
});
