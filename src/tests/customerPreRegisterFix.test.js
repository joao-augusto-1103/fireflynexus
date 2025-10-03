/**
 * Testes para validar a correção do bug de pré-cadastro cruzado OS/OV
 * Valida que criar OS não cria OV e vice-versa
 */

import { firebaseService } from '../lib/firebaseService';

// Mock do Firebase
const mockFirebaseFunctions = {
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn()
};

jest.mock('firebase/firestore', () => mockFirebaseFunctions);
jest.mock('../lib/firebase', () => ({ db: {} }));

describe('🔧 Correção Bug Pré-cadastro Cruzado OS/OV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Resetar estado interno do service
    firebaseService.customerPreRegisterInProgress.clear();
    firebaseService.customerPreRegisterPromises.clear();
    firebaseService.currentUserId = 'test-user-123';
    
    // Mock de configuração básica
    firebaseService.isFirebaseAvailable = true;
    firebaseService.initialized = true;
    firebaseService.collections = {
      clientes: 'clientes',
      ordensServico: 'ordens_servico',
      ordensVenda: 'ordens_venda'
    };
    
    // Mock de cliente existente
    mockFirebaseFunctions.getDocs.mockResolvedValue({
      docs: [{
        id: 'existing-customer-id',
        data: () => ({
          nome: 'João Silva',
          telefone: '11987654321',
          email: '',
          endereco: '',
          observacoes: 'Cliente de teste',
          createdAt: '2024-01-01T00:00:00.000Z'
        })
      }]
    });
  });

  describe('Teste 1: Criar OS não deve criar OV', () => {
    it('deve processar pré-cadastro de cliente apenas para ordem_servico', async () => {
      // Arrange
      const customerData = {
        nome: 'Maria Santos',
        telefone: '11999999999',
        email: '',
        endereco: ''
      };

      mockFirebaseFunctions.addDoc.mockResolvedValue({ id: 'new-customer-id' });

      // Act - Simular criação de OS
      const result = await firebaseService.createCustomerIfNotExists(customerData, 'ordem_servico');

      // Assert
      expect(result).toBeDefined();
      expect(result.fontePreCadastro).toBe('ordem_servico');
      expect(result.observacoes).toContain('via ordem_servico');
      
      // Verificar que não há nenhuma chamada para OV
      expect(mockFirebaseFunctions.collection).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('ordens_venda')
      );
    });
  });

  describe('Teste 2: Criar OV não deve criar OS', () => {
    it('deve processar pré-cadastro de cliente apenas para ordem_venda', async () => {
      // Arrange
      const customerData = {
        nome: 'Pedro Oliveira',
        telefone: '11888888888',
        email: '',
        endereco: ''
      };

      mockFirebaseFunctions.addDoc.mockResolvedValue({ id: 'new-customer-id' });

      // Act - Simular criação de OV
      const result = await firebaseService.createCustomerIfNotExists(customerData, 'ordem_venda');

      // Assert
      expect(result).toBeDefined();
      expect(result.fontePreCadastro).toBe('ordem_venda');
      expect(result.observacoes).toContain('via ordem_venda');
      
      // Verificar que não há nenhuma chamada para OS
      expect(mockFirebaseFunctions.collection).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('ordens_servico')
      );
    });
  });

  describe('Teste 3: Controle de concorrência', () => {
    it('deve impedir criação duplicada simultânea de cliente', async () => {
      // Arrange
      const customerData = {
        nome: 'Cliente Concorrente',
        telefone: '11777777777',
        email: '',
        endereco: ''
      };

      mockFirebaseFunctions.addDoc.mockResolvedValue({ id: 'concurrent-customer-id' });

      // Act - Chamar método simultaneamente
      const promise1 = firebaseService.createCustomerIfNotExists(customerData, 'ordem_servico');
      const promise2 = firebaseService.createCustomerIfNotExists(customerData, 'ordem_venda');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Assert - Deve retornar o mesmo cliente para ambas as chamadas
      expect(result1.id).toBe(result2.id);
      
      // Verificar que saveCliente foi chamado apenas uma vez
      expect(mockFirebaseFunctions.addDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('Teste 4: Validações de entrada', () => {
    it('deve lançar erro se dados de cliente estão incompletos', async () => {
      // Arrange
      const invalidData = { nome: 'Nome só' };

      // Act & Assert
      await expect(
        firebaseService.createCustomerIfNotExists(invalidData, 'ordem_servico')
      ).rejects.toThrow('Dados de cliente incompletos');
    });

    it('deve lançar erro se source é inválido', async () => {
      // Arrange
      const validData = { nome: 'Teste', telefone: '999' };

      // Act & Assert
      await expect(
        firebaseService.createCustomerIfNotExists(validData, 'source_invalido')
      ).rejects.toThrow();
    });
  });

  describe('Teste 5: Não deve gerar campos undefined no Firestore', () => {
    it('deve validar collectionName antes de salvar', async () => {
      // Arrange
      const invalidCollection = undefined;

      // Act & Assert
      await expect(
        firebaseService.saveData(invalidCollection, { test: 'data' })
      ).rejects.toThrow('CollectionName inválido');
    });

    it('deve validar campos de cliente antes de salvar', async () => {
      // Act & Assert
      await expect(
        firebaseService.saveCliente(undefined, null)
      ).rejects.toThrow('Cliente inválido: dados não fornecidos ou formato incorreto');
      
      await expect(
        firebaseService.saveCliente('string-not-object', null)
      ).rejects.toThrow('Cliente inválido: dados não fornecidos ou formato incorreto');
    });
  });

  describe('Teste 6: Rastreamento de origem', () => {
    it('deve marcar cliente criado via OS com origem correta', async () => {
      // Arrange
      const customerData = {
        nome: 'Cliente OS',
        telefone: '11666666666',
        email: '',
        endereco: ''
      };

      mockFirebaseFunctions.addDoc.mockResolvedValue({ id: 'os-customer-id' });

      // Act
      const result = await firebaseService.createCustomerIfNotExists(customerData, 'ordem_servico');

      // Assert
      expect(result.fontePreCadastro).toBe('ordem_servico');
      expect(result.observacoes).toContain('Cadastrado automaticamente via ordem_servico');
    });

    it('deve marcar cliente criado via OV com origem correta', async () => {
      // Arrange
      const customerData = {
        nome: 'Cliente OV',
        telefone: '11555555555',
        email: '',
        endereco: ''
      };

      mockFirebaseFunctions.addDoc.mockResolvedValue({ id: 'ov-customer-id' });

      // Act
      const result = await firebaseService.createCustomerIfNotExists(customerData, 'ordem_venda');

      // Assert
      expect(result.fontePreCadastro).toBe('ordem_venda');
      expect(result.observacoes).toContain('Cadastrado automaticamente via ordem_venda');
    });
  });
});

describe('🧪 Teste de Integração: Simulação Completa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    firebaseService.customerPreRegisterInProgress.clear();
    firebaseService.customerPreRegisterPromises.clear();
    firebaseService.currentUserId = 'integration-test-user';
  });

  it('Cenário: Usuário cria OS e OV simultaneamente com mesmo cliente - deve gerar apenas 1 cliente', async () => {
    // Simular dados do mesmo cliente usado em OS e OV
    const sameCustomerData = {
      nome: 'Cliente Duplicado Test',
      telefone: '11444444444',
      email: '',
      endereco: ''
    };

    mockFirebaseFunctions.addDoc.mockResolvedValue({ id: 'unique-customer-id' });

    // Simular criação simultânea
    const osPromise = firebaseService.createCustomerIfNotExists(sameCustomerData, 'ordem_servico');
    const ovPromise = firebaseService.createCustomerIfNotExists(sameCustomerData, 'ordem_venda');

    const [osCustomer, ovCustomer] = await Promise.all([osPromise, ovPromise]);

    // Verificações críticas
    expect(osCustomer.id).toBe(ovCustomer.id); // Mesmo cliente
    expect(mockFirebaseFunctions.addDoc).toHaveBeenCalledTimes(1); // Apenas 1 criação
    expect(firebaseService.customerPreRegisterInProgress.size).toBe(0); // Controle limpo
    
    console.log('✅ Teste de integração passou: Cliente único criado para ambas as origens');
  });
});
