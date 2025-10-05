import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

class FirebaseService {
  constructor() {
    this.collections = {
      clientes: 'clientes',
      ordensServico: 'ordens_servico',
      ordensVenda: 'ordens_venda',
      produtos: 'produtos',
      categorias: 'categorias',
      movimentacoes: 'movimentacoes',
      financeiro: 'financeiro',
      usuarios: 'usuarios',
      configuracoes: 'configuracoes',
      configuracoes_personalizacao: 'configuracoes_personalizacao',
      configuracoes_loja: 'configuracoes_loja',
      configuracoes_usuarios: 'configuracoes_usuarios',
      configuracoes_seguranca: 'configuracoes_seguranca',
      configuracoes_impressao: 'configuracoes_impressao',
      configuracoes_sistema: 'configuracoes_sistema',
      caixa: 'caixa',
      gruposOpcoes: 'grupos_opcoes',
      opcoes: 'opcoes'
    };
    
    // Mapeamento para localStorage (fallback)
    this.localStorageKeys = {
      clientes: 'crm_clientes',
      ordensServico: 'crm_os',
      ordensVenda: 'crm_ov',
      produtos: 'crm_produtos',
      categorias: 'crm_categorias',
      movimentacoes: 'crm_movimentacoes',
      financeiro: 'crm_financeiro',
      usuarios: 'crm_usuarios',
      configuracoes: 'crm_configuracoes',
      configuracoes_personalizacao: 'crm_config_personalizacao',
      configuracoes_loja: 'crm_config_loja',
      configuracoes_usuarios: 'crm_config_usuarios',
      configuracoes_seguranca: 'crm_config_seguranca',
      configuracoes_impressao: 'crm_config_impressao',
      configuracoes_sistema: 'crm_config_sistema',
      caixa: 'crm_caixa',
      gruposOpcoes: 'crm_grupos_opcoes',
      opcoes: 'crm_opcoes'
    };
    
    this.isFirebaseAvailable = false;
    this.initialized = false;
    this.currentUserId = null; // ID do usuário logado
    this.initPromise = this.init();
    
    // CONTROLE DE CONCORRÊNCIA para pré-cadastro de clientes
    this.customerPreRegisterInProgress = new Set(); // Telefones que estão sendo pré-cadastrados
    this.customerPreRegisterPromises = new Map(); // Cache de promessas de pré-cadastro por telefone
  }

  // Definir usuário atual para isolamento de dados
  setCurrentUser(userId) {
    console.log('[FirebaseService] Definindo usuário atual:', userId);
    this.currentUserId = userId;
  }

  // Obter caminho da coleção (comportamento original - sem isolamento por usuário)
  getCollectionPath(collectionName, userId = null) {
    // console.log(`[FirebaseService] getCollectionPath chamado para: ${collectionName}`);
    
    // VALIDAÇÃO CRÍTICA: Verificar se collectionName existe
    if (!collectionName || !this.collections[collectionName]) {
      const availableCollections = Object.keys(this.collections).join(', ');
      const error = `Nome de coleção inválido: ${collectionName}. Coleções disponíveis: ${availableCollections}`;
      console.error(`[FirebaseService] ❌ ${error}`);
      throw new Error(error);
    }

    const firestoreCollectionName = this.collections[collectionName];
    // console.log(`[FirebaseService] Mapeando ${collectionName} -> ${firestoreCollectionName}`);
    
    // Comportamento original: todos os dados compartilhados (sem isolamento por usuário)
    // console.log(`[FirebaseService] Usando coleção global: ${firestoreCollectionName}`);
    return firestoreCollectionName;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      await this.checkFirebaseAvailability();
      this.initialized = true;
      console.log('[FirebaseService] ✅ Inicialização concluída - APENAS FIREBASE');
    } catch (error) {
      console.error('[FirebaseService] ❌ Erro na inicialização:', error);
      this.initialized = false;
      // NÃO usar localStorage como fallback - forçar erro
      throw new Error('Firebase não disponível - sistema requer Firebase');
    }
  }
  
  // Método para limpar valores undefined dos dados
  cleanUndefinedValues(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanUndefinedValues(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanUndefinedValues(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  // Verificar se Firebase está disponível
  async checkFirebaseAvailability() {
    try {
      console.log('[FirebaseService] ===== VERIFICANDO FIREBASE =====');
      console.log('[FirebaseService] Verificando disponibilidade do Firebase...');
      console.log('[FirebaseService] db object:', db);
      
      // Verificar se db está disponível
      if (!db) {
        throw new Error('Firebase db não está disponível');
      }
      
      // Teste simples de conectividade - tentar acessar uma collection
      console.log('[FirebaseService] Testando acesso à collection...');
      const testCollection = collection(db, 'test_connectivity');
      console.log('[FirebaseService] Collection criada:', testCollection);
      
      // Tentar fazer uma query simples (sem orderBy para evitar problemas de índice)
      const testQuery = query(testCollection);
      const testSnapshot = await getDocs(testQuery);
      console.log('[FirebaseService] Query executada com sucesso, docs encontrados:', testSnapshot.size);
      
      this.isFirebaseAvailable = true;
      console.log('[FirebaseService] ✅ Firebase disponível - APENAS FIREBASE');
      console.log('[FirebaseService] ===== FIREBASE OK =====');
    } catch (error) {
      console.log('[FirebaseService] ❌ Firebase não disponível - SISTEMA FALHARÁ');
      console.log('[FirebaseService] Erro:', error.message);
      console.log('[FirebaseService] Stack:', error.stack);
      this.isFirebaseAvailable = false;
      console.log('[FirebaseService] ===== FIREBASE FALHOU - SEM FALLBACK =====');
      // NÃO usar localStorage - forçar erro
      throw new Error(`Firebase não disponível: ${error.message}`);
    }
  }


  // Método genérico para salvar dados - APENAS FIREBASE
  async saveData(collectionName, data, id = null) {
    console.log(`[FirebaseService] ===== SALVANDO EM ${collectionName} - APENAS FIREBASE =====`);
    console.log(`[FirebaseService] CollectionName recebido:`, collectionName);
    console.log(`[FirebaseService] CollectionName mapeado:`, this.collections[collectionName]);
    console.log(`[FirebaseService] Dados:`, data);
    console.log(`[FirebaseService] Usuário atual:`, this.currentUserId);

    // VALIDAÇÃO: Verificar se collectionName é válido
    if (!collectionName || !this.collections[collectionName]) {
      const error = `Nome de coleção inválido: ${collectionName}. Coleções disponíveis: ${Object.keys(this.collections).join(', ')}`;
      console.error(`[FirebaseService] ❌ ${error}`);
      throw new Error(error);
    }

    // VALIDAÇÃO: Verificar se data é válido
    if (!data || typeof data !== 'object') {
      const error = `Dados inválidos para salvar em ${collectionName}: ${data}`;
      console.error(`[FirebaseService] ❌ ${error}`);
      throw new Error(error);
    }

    // Aguardar inicialização se necessário
    if (!this.initialized) {
      console.log(`[FirebaseService] Aguardando inicialização...`);
      await this.initPromise;
    }

    console.log(`[FirebaseService] Firebase disponível:`, this.isFirebaseAvailable);
    console.log(`[FirebaseService] Inicializado:`, this.initialized);

    if (!this.isFirebaseAvailable) {
      console.error(`[FirebaseService] ❌ Firebase não disponível - SISTEMA FALHARÁ`);
      throw new Error('Firebase não disponível - sistema requer Firebase');
    }

    try {
      // Obter caminho da coleção com isolamento por usuário
      const collectionPath = this.getCollectionPath(collectionName);
      console.log(`[FirebaseService] Caminho da coleção:`, collectionPath);
      console.log(`[FirebaseService] VERIFICAÇÃO CRÍTICA - Deve ser ordens_servico para OS e ordens_venda para OV`);

      // VALIDAÇÃO ADICIONAL: Verificar se caminho da coleção é válido
      if (!collectionPath || collectionPath.length === 0 || collectionPath.includes('undefined')) {
        const error = `Caminho de coleção inválido: ${collectionPath}`;
        console.error(`[FirebaseService] ❌ ${error}`);
        throw new Error(error);
      }

      // Limpar dados undefined antes de salvar
      const cleanData = this.cleanUndefinedValues(data);
      console.log(`[FirebaseService] Dados limpos:`, cleanData);

      if (id) {
        // Atualizar documento existente
        const docRef = doc(db, collectionPath, id);
        await updateDoc(docRef, {
          ...cleanData,
          updatedAt: cleanData.updatedAt || new Date().toISOString()
        });
        console.log(`[FirebaseService] ✅ DOCUMENTO ATUALIZADO - ID: ${id}`);
        return id;
      } else {
        // Criar novo documento
        const docRef = await addDoc(collection(db, collectionPath), {
          ...cleanData,
          createdAt: cleanData.createdAt || new Date().toISOString(),
          updatedAt: cleanData.updatedAt || new Date().toISOString()
        });
        console.log(`[FirebaseService] ✅ NOVO DOCUMENTO CRIADO - ID: ${docRef.id}`);
        console.log(`[FirebaseService] ===== SALVAMENTO CONCLUÍDO =====`);
        return docRef.id;
      }
    } catch (error) {
      console.error(`[FirebaseService] ❌ Erro ao salvar dados em ${collectionName}:`, error);
      // NÃO usar localStorage - forçar erro
      throw new Error(`Erro ao salvar no Firebase: ${error.message}`);
    }
  }
  
  // Método para salvar no localStorage (fallback)
  saveToLocalStorage(collectionName, data, id = null) {
    try {
      console.log(`[FirebaseService] saveToLocalStorage chamado para ${collectionName}:`, data);
      const key = this.localStorageKeys[collectionName];
      if (!key) {
        throw new Error(`Chave localStorage não encontrada para ${collectionName}`);
      }
      
      console.log(`[FirebaseService] Chave localStorage: ${key}`);
      
      // Para configurações, tratar como objeto único
      if (collectionName === 'configuracoes') {
        const configData = { ...data, id: id || 'config', updatedAt: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(configData));
        window.dispatchEvent(new Event('storage'));
        return id || 'config';
      }
      
      // Para outras coleções, tratar como array
      const existingData = JSON.parse(localStorage.getItem(key) || '[]');
      console.log(`[FirebaseService] Dados existentes em ${key}:`, existingData);
      
      if (id) {
        // Atualizar item existente
        const index = existingData.findIndex(item => item.id === id);
        if (index !== -1) {
          existingData[index] = { ...data, id, updatedAt: new Date().toISOString() };
        }
      } else {
        // Adicionar novo item
        const newId = id || Date.now().toString();
        const newItem = { ...data, id: newId, createdAt: new Date().toISOString() };
        existingData.push(newItem);
        console.log(`[FirebaseService] Novo item adicionado:`, newItem);
      }
      
      console.log(`[FirebaseService] Salvando dados finais em ${key}:`, existingData);
      localStorage.setItem(key, JSON.stringify(existingData));
      
      // Disparar evento customizado para notificar mudanças
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key, data: existingData } 
      }));
      
      console.log(`[FirebaseService] Evento localStorageChange disparado para ${key}`);
      
      return id || Date.now().toString();
    } catch (error) {
      console.error(`[FirebaseService] Erro ao salvar no localStorage:`, error);
      throw error;
    }
  }

  // Método genérico para buscar todos os dados
  async getData(collectionName) {
    console.log(`[FirebaseService] getData chamado para ${collectionName}`);
    console.log(`[FirebaseService] Usuário atual:`, this.currentUserId);
    
    // Aguardar inicialização se necessário
    if (!this.initialized) {
      console.log(`[FirebaseService] Aguardando inicialização para ${collectionName}`);
      await this.initPromise;
    }

    console.log(`[FirebaseService] Firebase disponível para ${collectionName}: ${this.isFirebaseAvailable}`);

    if (!this.isFirebaseAvailable) {
      console.error(`[FirebaseService] ❌ Firebase não disponível - SISTEMA FALHARÁ`);
      throw new Error('Firebase não disponível - sistema requer Firebase');
    }
    
    try {
      // Obter caminho da coleção com isolamento por usuário
      const collectionPath = this.getCollectionPath(collectionName);
      console.log(`[FirebaseService] Caminho da coleção:`, collectionPath);

      // Timeout rápido para evitar delay
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );
      
      const queryPromise = (async () => {
        try {
          // Tentar com orderBy primeiro
          const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const data = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          console.log(`[FirebaseService] Query com orderBy funcionou para ${collectionName}: ${data.length} documentos`);
          return data;
        } catch (orderByError) {
          console.warn(`[FirebaseService] orderBy falhou para ${collectionName}, tentando sem orderBy:`, orderByError.message);
          // Tentar sem orderBy
          const qSimple = collection(db, collectionPath);
          const querySnapshot = await getDocs(qSimple);
          const data = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          console.log(`[FirebaseService] Query sem orderBy funcionou para ${collectionName}: ${data.length} documentos`);
          return data;
        }
      })();
      
      const data = await Promise.race([queryPromise, timeoutPromise]);
      console.log(`[FirebaseService] Dados carregados do Firebase para ${collectionName}:`, data.length);
      return data;
    } catch (error) {
      console.error(`[FirebaseService] ❌ Erro ao buscar dados de ${collectionName}:`, error);
      // NÃO usar localStorage - forçar erro
      throw new Error(`Erro ao buscar no Firebase: ${error.message}`);
    }
  }
  
  // Método para buscar do localStorage (fallback)
  getFromLocalStorage(collectionName) {
    try {
      const key = this.localStorageKeys[collectionName];
      if (!key) {
        console.warn(`Chave localStorage não encontrada para ${collectionName}`);
        return collectionName === 'configuracoes' ? null : [];
      }
      
      console.log(`[FirebaseService] getFromLocalStorage para ${collectionName}, chave: ${key}`);
      const rawData = localStorage.getItem(key);
      console.log(`[FirebaseService] Dados brutos do localStorage:`, rawData);
      
      const data = JSON.parse(rawData || (collectionName === 'configuracoes' ? 'null' : '[]'));
      console.log(`[FirebaseService] Dados parseados:`, data);
      
      // Para configurações, retornar o objeto diretamente
      if (collectionName === 'configuracoes') {
        return data;
      }
      
      // Para outras coleções, retornar array
      const result = Array.isArray(data) ? data : [];
      console.log(`[FirebaseService] Retornando array para ${collectionName}:`, result);
      return result;
    } catch (error) {
      console.error(`[FirebaseService] Erro ao buscar do localStorage:`, error);
      return collectionName === 'configuracoes' ? null : [];
    }
  }

  // Método genérico para buscar um documento específico
  async getDocument(collectionName, id) {
    try {
      const collectionPath = this.getCollectionPath(collectionName);
      const docRef = doc(db, collectionPath, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error(`Erro ao buscar documento ${id} de ${collectionName}:`, error);
      return null;
    }
  }

  // Método genérico para deletar documento
  async deleteDocument(collectionName, id) {
    console.log(`[FirebaseService] ===== DELETANDO DOCUMENTO ${id} DE ${collectionName} - APENAS FIREBASE =====`);
    console.log(`[FirebaseService] Usuário atual:`, this.currentUserId);
    
    if (!this.isFirebaseAvailable) {
      console.error(`[FirebaseService] ❌ Firebase não disponível - SISTEMA FALHARÁ`);
      throw new Error('Firebase não disponível - sistema requer Firebase');
    }
    
    try {
      const collectionPath = this.getCollectionPath(collectionName);
      await deleteDoc(doc(db, collectionPath, id));
      console.log(`[FirebaseService] ✅ Documento ${id} deletado com sucesso do Firebase`);
      return true;
    } catch (error) {
      console.error(`[FirebaseService] ❌ Erro ao deletar documento ${id} de ${collectionName}:`, error);
      // NÃO usar localStorage - forçar erro
      throw new Error(`Erro ao deletar no Firebase: ${error.message}`);
    }
  }
  
  // Método para deletar do localStorage (fallback)
  deleteFromLocalStorage(collectionName, id) {
    try {
      const key = this.localStorageKeys[collectionName];
      if (!key) {
        console.warn(`Chave localStorage não encontrada para ${collectionName}`);
        return false;
      }
      
      const existingData = JSON.parse(localStorage.getItem(key) || '[]');
      const filteredData = existingData.filter(item => item.id !== id);
      
      localStorage.setItem(key, JSON.stringify(filteredData));
      // Disparar evento customizado para notificar mudanças
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key, data: filteredData } 
      }));
      
      return true;
    } catch (error) {
      console.error(`[FirebaseService] Erro ao deletar do localStorage:`, error);
      return false;
    }
  }

  // Método para escutar mudanças em tempo real
  async subscribeToCollection(collectionName, callback) {
    console.log(`[FirebaseService] ===== SUBSCRIBE TO COLLECTION ${collectionName} =====`);
    console.log(`[FirebaseService] Usuário atual:`, this.currentUserId);
    
    // Aguardar inicialização se necessário
    if (!this.initialized) {
      console.log(`[FirebaseService] Aguardando inicialização para ${collectionName}`);
      await this.initPromise;
    }

    console.log(`[FirebaseService] subscribeToCollection para ${collectionName}, Firebase disponível: ${this.isFirebaseAvailable}`);
    
    if (!this.isFirebaseAvailable) {
      console.error(`[FirebaseService] ❌ Firebase não disponível - SISTEMA FALHARÁ`);
      throw new Error('Firebase não disponível - sistema requer Firebase');
    }
    
    console.log(`[FirebaseService] Firebase disponível, configurando onSnapshot para ${collectionName}`);
    
    // Obter caminho da coleção com isolamento por usuário
    const collectionPath = this.getCollectionPath(collectionName);
    console.log(`[FirebaseService] Caminho da coleção:`, collectionPath);
    
    // Tentar com orderBy primeiro, se falhar, usar sem orderBy
    try {
      const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (querySnapshot) => {
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        console.log(`[FirebaseService] onSnapshot recebido para ${collectionName}:`, data);
        callback(data);
      }, (error) => {
        console.error(`[FirebaseService] Erro no onSnapshot com orderBy para ${collectionName}:`, error);
        // Tentar sem orderBy
        console.log(`[FirebaseService] Tentando sem orderBy para ${collectionName}`);
        const qSimple = collection(db, collectionPath);
        return onSnapshot(qSimple, (querySnapshot) => {
          const data = [];
          querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
          });
          console.log(`[FirebaseService] onSnapshot sem orderBy recebido para ${collectionName}:`, data);
          callback(data);
        }, (error2) => {
          console.error(`[FirebaseService] ❌ Erro no onSnapshot sem orderBy para ${collectionName}:`, error2);
          // NÃO usar localStorage - forçar erro
          throw new Error(`Erro no onSnapshot: ${error2.message}`);
        });
      });
    } catch (error) {
      console.error(`[FirebaseService] Erro ao criar query com orderBy para ${collectionName}:`, error);
      // Usar query simples sem orderBy
      const qSimple = collection(db, collectionPath);
      return onSnapshot(qSimple, (querySnapshot) => {
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        console.log(`[FirebaseService] onSnapshot simples recebido para ${collectionName}:`, data);
        callback(data);
      }, (error2) => {
        console.error(`[FirebaseService] ❌ Erro no onSnapshot simples para ${collectionName}:`, error2);
        // NÃO usar localStorage - forçar erro
        throw new Error(`Erro no onSnapshot simples: ${error2.message}`);
      });
    }
  }

  // Métodos específicos para cada entidade

  /**
   * FUNÇÃO CENTRALIZADA DE PRÉ-CADASTRO DE CLIENTES
   * Evita cadastros duplicados em OS/OV concorrentes
   * 
   * @param {Object} customerData - { nome, telefone, email?, endereco? }
   * @param {string} source - 'ordem_servico' ou 'ordem_venda' para rastreamento
   * @returns {Promise<Object>} Cliente (existente ou novo)
   */
  async createCustomerIfNotExists(customerData, source = 'unknown') {
    // VALIDAÇÃO DE ENTRADA
    if (!customerData?.nome || !customerData?.telefone) {
      const error = `Dados de cliente incompletos: nome=${customerData?.nome}, telefone=${customerData?.telefone}`;
      console.error(`[FirebaseService] ❌ ${error}`);
      throw new Error(error);
    }

    if (!['ordem_servico', 'ordem_venda'].includes(source)) {
      console.warn(`[FirebaseService] ⚠️ Fonte desconhecida para pré-cadastro: ${source}`);
    }

    const phoneKey = customerData.telefone.trim();
    console.log(`[FirebaseService] 🔍 Pré-cadastro solicitado via ${source} para telefone: ${phoneKey}`);

    // CONTROLE DE CONCORRÊNCIA: Se já está sendo processado, aguardar
    if (this.customerPreRegisterPromises.has(phoneKey)) {
      console.log(`[FirebaseService] ⏳ Pré-cadastro já em progresso para ${phoneKey}, aguardando...`);
      return await this.customerPreRegisterPromises.get(phoneKey);
    }

    // Marcar como em progresso
    this.customerPreRegisterInProgress.add(phoneKey);

    const promise = new Promise(async (resolve, reject) => {
      try {
        // Iniciar promise com cache
        this.customerPreRegisterPromises.set(phoneKey, promise);

        // Verificar se cliente já existe
        console.log(`[FirebaseService] 🔍 Verificando se cliente já existe: ${phoneKey}`);
        const existingCustomer = await this._findCustomerByPhone(phoneKey);
        
        if (existingCustomer) {
          console.log(`[FirebaseService] ✅ Cliente encontrado existente: ${existingCustomer.id}`);
          resolve(existingCustomer);
          return;
        }

        // Criar novo cliente se não encontrado
        console.log(`[FirebaseService] 🆕 Criando novo cliente via ${source}...`);
        const newCustomer = {
          nome: customerData.nome.trim(),
          telefone: phoneKey,
          email: customerData.email || '',
          endereco: customerData.endereco || '',
          observacoes: `Cadastrado automaticamente via ${source}`,
          fontePreCadastro: source, // Campo específico para rastreamento
          createdAt: new Date().toISOString(),
          userId: this.currentUserId || null
        };

        const customerId = await this.saveData('clientes', newCustomer);
        console.log(`[FirebaseService] ✅ Novo cliente criado com ID: ${customerId}`);
        
        // Retornar cliente completo para os componentes
        resolve({
          id: customerId,
          ...newCustomer
        });
        
        // Limpar flags de progresso
        this.customerPreRegisterInProgress.delete(phoneKey);
      } catch (error) {
        console.error(`[FirebaseService] ❌ Erro na criação interna de cliente:`, error);
        // Limpar flags em caso de erro
        this.customerPreRegisterInProgress.delete(phoneKey);
        this.customerPreRegisterPromises.delete(phoneKey);
        reject(error);
      }
    });

    return promise;
  }

  // Método auxiliar para buscar cliente por telefone
  async _findCustomerByPhone(phone) {
    try {
      const collectionPath = this.getCollectionPath('clientes');
      const querySnapshot = await getDocs(collection(db, collectionPath));
      
      for (const doc of querySnapshot.docs) {
        const customer = { id: doc.id, ...doc.data() };
        if (customer.telefone?.trim() === phone) {
          console.log(`[FirebaseService] ✅ Cliente encontrado por telefone ${phone}:`, customer.id);
          return customer;
        }
      }
      
      console.log(`[FirebaseService] ❌ Cliente não encontrado para telefone ${phone}`);
      return null;
    } catch (error) {
      console.error(`[FirebaseService] ❌ Erro ao buscar cliente por telefone:`, error);
      return null;
    }
  }

  // CLIENTES
  async saveCliente(cliente, id = null) {
    // VALIDAÇÃO CRÍTICA: Verificar se cliente tem dados válidos
    if (!cliente || typeof cliente !== 'object') {
      const error = 'Cliente inválido: dados não fornecidos ou formato incorreto';
      console.error(`[FirebaseService] ❌ ${error}`, cliente);
      throw new Error(error);
    }

    // VALIDAÇÃO: Verificar se collectionName está definido
    const collectionData = this.collections;
    if (!collectionData || !collectionData.clientes) {
      const error = 'collectionData inválido: dados não inicializados';
      console.error(`[FirebaseService] ❌ ${error}`, collectionData);
      throw new Error(error);
    }

    console.log(`[FirebaseService] 📝 Salvando cliente - ID: ${id || 'novo'}`);
    console.log(`[FirebaseService] Collection clientes:`, collectionData.clientes);
    console.log(`[FirebaseService] Cliente data:`, cliente);

    return await this.saveData('clientes', cliente, id);
  }

  async getClientes() {
    return await this.getData('clientes');
  }

  async deleteCliente(id) {
    return await this.deleteDocument('clientes', id);
  }

  subscribeToClientes(callback) {
    return this.subscribeToCollection('clientes', callback);
  }

  // ORDENS DE SERVIÇO
  async saveOS(os, id = null) {
    return await this.saveData('ordensServico', os, id);
  }

  async getOS() {
    return await this.getData('ordensServico');
  }

  async deleteOS(id) {
    return await this.deleteDocument('ordensServico', id);
  }

  subscribeToOS(callback) {
    return this.subscribeToCollection('ordensServico', callback);
  }

  // ORDENS DE VENDA
  async saveOV(ov, id = null) {
    return await this.saveData('ordensVenda', ov, id);
  }

  async getOV() {
    return await this.getData('ordensVenda');
  }

  async deleteOV(id) {
    return await this.deleteDocument('ordensVenda', id);
  }

  subscribeToOV(callback) {
    return this.subscribeToCollection('ordensVenda', callback);
  }

  // PRODUTOS
  async saveProduto(produto, id = null) {
    return await this.saveData('produtos', produto, id);
  }

  async getProdutos() {
    return await this.getData('produtos');
  }

  async deleteProduto(id) {
    return await this.deleteDocument('produtos', id);
  }

  subscribeToProdutos(callback) {
    return this.subscribeToCollection('produtos', callback);
  }

  // CATEGORIAS
  async saveCategoria(categoria, id = null) {
    return await this.saveData('categorias', categoria, id);
  }

  async getCategorias() {
    return await this.getData('categorias');
  }

  async deleteCategoria(id) {
    return await this.deleteDocument('categorias', id);
  }

  subscribeToCategorias(callback) {
    return this.subscribeToCollection('categorias', callback);
  }

  // MOVIMENTAÇÕES
  async saveMovimentacao(movimentacao, id = null) {
    return await this.saveData('movimentacoes', movimentacao, id);
  }

  async getMovimentacoes() {
    return await this.getData('movimentacoes');
  }

  async deleteMovimentacao(id) {
    return await this.deleteDocument('movimentacoes', id);
  }

  subscribeToMovimentacoes(callback) {
    return this.subscribeToCollection('movimentacoes', callback);
  }

  // FINANCEIRO
  async saveFinanceiro(financeiro, id = null) {
    return await this.saveData('financeiro', financeiro, id);
  }

  async getFinanceiro() {
    return await this.getData('financeiro');
  }

  async deleteFinanceiro(id) {
    return await this.deleteDocument('financeiro', id);
  }

  subscribeToFinanceiro(callback) {
    return this.subscribeToCollection('financeiro', callback);
  }

  // USUÁRIOS
  async saveUsuario(usuario, id = null) {
    // IMPEDIR SALVAMENTO DO DEV USER
    if (usuario && (usuario.nome === 'Dev User' || usuario.email === 'dev@test.com')) {
      console.warn('[FirebaseService] ⚠️ Tentativa de salvar Dev User bloqueada');
      throw new Error('Dev User não pode ser salvo no banco de produção');
    }
    
    return await this.saveData('usuarios', usuario, id);
  }

  async getUsuarios() {
    return await this.getData('usuarios');
  }

  async deleteUsuario(id) {
    // Verificar se é Dev User antes de deletar
    try {
      const usuario = await this.getDocument('usuarios', id);
      if (usuario && (usuario.nome === 'Dev User' || usuario.email === 'dev@test.com')) {
        console.warn('[FirebaseService] ⚠️ Tentativa de deletar Dev User bloqueada');
        throw new Error('Dev User não pode ser deletado');
      }
    } catch (error) {
      console.warn('[FirebaseService] Erro ao verificar usuário antes de deletar:', error);
    }
    
    return await this.deleteDocument('usuarios', id);
  }

  subscribeToUsuarios(callback) {
    return this.subscribeToCollection('usuarios', callback);
  }

  // CONFIGURAÇÕES - MÉTODOS ESPECÍFICOS PARA CADA TIPO

  // CONFIGURAÇÕES DE PERSONALIZAÇÃO
  async saveConfiguracaoPersonalizacao(configuracao, id = null) {
    try {
      console.log('[FirebaseService] 🚀 Salvando configuração de personalização:', configuracao);
      
      if (!id) {
        try {
          const existingConfigs = await this.getData('configuracoes_personalizacao');
          if (existingConfigs.length > 0) {
            id = existingConfigs[0].id;
            console.log('[FirebaseService] ✅ Configuração de personalização existente encontrada, ID:', id);
          }
        } catch (error) {
          console.warn('[FirebaseService] ⚠️ Erro ao buscar configuração existente:', error);
        }
      }
      
      const result = await this.saveData('configuracoes_personalizacao', configuracao, id);
      localStorage.removeItem('crm_config_cache');
      
      console.log('[FirebaseService] ✅ Configuração de personalização salva com sucesso:', result);
      return result;
    } catch (error) {
      console.error('[FirebaseService] ❌ Erro ao salvar configuração de personalização:', error);
      throw error;
    }
  }

  async getConfiguracaoPersonalizacao() {
    const configs = await this.getData('configuracoes_personalizacao');
    return configs.length > 0 ? configs[0] : null;
  }

  // CONFIGURAÇÕES DA LOJA
  async saveConfiguracaoLoja(configuracao, id = null) {
    try {
      console.log('[FirebaseService] 🚀 Salvando configuração da loja:', configuracao);
      
      if (!id) {
        try {
          const existingConfigs = await this.getData('configuracoes_loja');
          if (existingConfigs.length > 0) {
            id = existingConfigs[0].id;
            console.log('[FirebaseService] ✅ Configuração da loja existente encontrada, ID:', id);
          }
        } catch (error) {
          console.warn('[FirebaseService] ⚠️ Erro ao buscar configuração da loja existente:', error);
        }
      }
      
      const result = await this.saveData('configuracoes_loja', configuracao, id);
      console.log('[FirebaseService] ✅ Configuração da loja salva com sucesso:', result);
      return result;
    } catch (error) {
      console.error('[FirebaseService] ❌ Erro ao salvar configuração da loja:', error);
      throw error;
    }
  }

  async getConfiguracaoLoja() {
    const configs = await this.getData('configuracoes_loja');
    return configs.length > 0 ? configs[0] : null;
  }

  // CONFIGURAÇÕES DE USUÁRIOS
  async saveConfiguracaoUsuarios(configuracao, id = null) {
    try {
      console.log('[FirebaseService] 🚀 Salvando configuração de usuários:', configuracao);
      
      if (!id) {
        try {
          const existingConfigs = await this.getData('configuracoes_usuarios');
          if (existingConfigs.length > 0) {
            id = existingConfigs[0].id;
            console.log('[FirebaseService] ✅ Configuração de usuários existente encontrada, ID:', id);
          }
        } catch (error) {
          console.warn('[FirebaseService] ⚠️ Erro ao buscar configuração de usuários existente:', error);
        }
      }
      
      const result = await this.saveData('configuracoes_usuarios', configuracao, id);
      console.log('[FirebaseService] ✅ Configuração de usuários salva com sucesso:', result);
      return result;
    } catch (error) {
      console.error('[FirebaseService] ❌ Erro ao salvar configuração de usuários:', error);
      throw error;
    }
  }

  async getConfiguracaoUsuarios() {
    const configs = await this.getData('configuracoes_usuarios');
    return configs.length > 0 ? configs[0] : null;
  }

  // CONFIGURAÇÕES DE SEGURANÇA
  async saveConfiguracaoSeguranca(configuracao, id = null) {
    try {
      console.log('[FirebaseService] 🚀 Salvando configuração de segurança:', configuracao);
      
      if (!id) {
        try {
          const existingConfigs = await this.getData('configuracoes_seguranca');
          if (existingConfigs.length > 0) {
            id = existingConfigs[0].id;
            console.log('[FirebaseService] ✅ Configuração de segurança existente encontrada, ID:', id);
          }
        } catch (error) {
          console.warn('[FirebaseService] ⚠️ Erro ao buscar configuração de segurança existente:', error);
        }
      }
      
      const result = await this.saveData('configuracoes_seguranca', configuracao, id);
      console.log('[FirebaseService] ✅ Configuração de segurança salva com sucesso:', result);
      return result;
    } catch (error) {
      console.error('[FirebaseService] ❌ Erro ao salvar configuração de segurança:', error);
      throw error;
    }
  }

  async getConfiguracaoSeguranca() {
    const configs = await this.getData('configuracoes_seguranca');
    return configs.length > 0 ? configs[0] : null;
  }

  // CONFIGURAÇÕES DE IMPRESSÃO
  async saveConfiguracaoImpressao(configuracao, id = null) {
    try {
      console.log('[FirebaseService] 🚀 Salvando configuração de impressão:', configuracao);
      
      if (!id) {
        try {
          const existingConfigs = await this.getData('configuracoes_impressao');
          if (existingConfigs.length > 0) {
            id = existingConfigs[0].id;
            console.log('[FirebaseService] ✅ Configuração de impressão existente encontrada, ID:', id);
          }
        } catch (error) {
          console.warn('[FirebaseService] ⚠️ Erro ao buscar configuração de impressão existente:', error);
        }
      }
      
      const result = await this.saveData('configuracoes_impressao', configuracao, id);
      console.log('[FirebaseService] ✅ Configuração de impressão salva com sucesso:', result);
      return result;
    } catch (error) {
      console.error('[FirebaseService] ❌ Erro ao salvar configuração de impressão:', error);
      throw error;
    }
  }

  async getConfiguracaoImpressao() {
    const configs = await this.getData('configuracoes_impressao');
    return configs.length > 0 ? configs[0] : null;
  }

  // CONFIGURAÇÕES DO SISTEMA
  async saveConfiguracaoSistema(configuracao, id = null) {
    try {
      console.log('[FirebaseService] 🚀 Salvando configuração do sistema:', configuracao);
      
      if (!id) {
        try {
          const existingConfigs = await this.getData('configuracoes_sistema');
          if (existingConfigs.length > 0) {
            id = existingConfigs[0].id;
            console.log('[FirebaseService] ✅ Configuração do sistema existente encontrada, ID:', id);
          }
        } catch (error) {
          console.warn('[FirebaseService] ⚠️ Erro ao buscar configuração do sistema existente:', error);
        }
      }
      
      const result = await this.saveData('configuracoes_sistema', configuracao, id);
      console.log('[FirebaseService] ✅ Configuração do sistema salva com sucesso:', result);
      return result;
    } catch (error) {
      console.error('[FirebaseService] ❌ Erro ao salvar configuração do sistema:', error);
      throw error;
    }
  }

  async getConfiguracaoSistema() {
    const configs = await this.getData('configuracoes_sistema');
    return configs.length > 0 ? configs[0] : null;
  }

  // MÉTODO COMPATIBILIDADE - PARA MANTÊ-LO FUNCIONANDO
  async saveConfiguracao(configuracao, id = null) {
    try {
      console.log('[FirebaseService] 🚀 Salvando configuração (compatibilidade):', configuracao);
      
      // Se não há ID, buscar configuração existente
      if (!id) {
        try {
          const existingConfigs = await this.getData('configuracoes_personalizacao');
          if (existingConfigs.length > 0) {
            id = existingConfigs[0].id;
            console.log('[FirebaseService] ✅ Configuração existente encontrada, ID:', id);
          } else {
            console.log('[FirebaseService] 📝 Criando nova configuração');
          }
        } catch (error) {
          console.warn('[FirebaseService] ⚠️ Erro ao buscar configuração existente:', error);
        }
      }
      
      const result = await this.saveData('configuracoes_personalizacao', configuracao, id);
      
      // Limpar cache
      localStorage.removeItem('crm_config_cache');
      
      console.log('[FirebaseService] ✅ Configuração salva com sucesso:', result);
      return result;
    } catch (error) {
      console.error('[FirebaseService] ❌ Erro ao salvar configuração:', error);
      
      // Fallback: salvar no localStorage
      try {
        localStorage.setItem('crm_configuracoes', JSON.stringify(configuracao));
        localStorage.setItem('crm_idioma', configuracao.idioma || 'pt-BR');
        console.log('[FirebaseService] ✅ Fallback: Configuração salva no localStorage');
        return 'localStorage';
      } catch (localError) {
        console.error('[FirebaseService] ❌ Erro no fallback localStorage:', localError);
        throw error;
      }
    }
  }

  async getConfiguracao() {
    // Verificar cache primeiro
    const cachedConfig = localStorage.getItem('crm_config_cache');
    if (cachedConfig) {
      try {
        const parsed = JSON.parse(cachedConfig);
        const cacheTime = parsed.timestamp;
        const now = Date.now();
        // Cache válido por 5 minutos
        if (now - cacheTime < 5 * 60 * 1000) {
          console.log('[FirebaseService] Usando configuração do cache');
          return parsed.config;
        }
      } catch (error) {
        console.warn('[FirebaseService] Erro ao ler cache de configuração:', error);
      }
    }
    
    const configs = await this.getData('configuracoes_personalizacao');
    const result = configs.length > 0 ? configs[0] : null;
    
    // Salvar no cache
    if (result) {
      localStorage.setItem('crm_config_cache', JSON.stringify({
        config: result,
        timestamp: Date.now()
      }));
    }
    
    return result;
  }

  // MÉTODO PARA MIGRAÇÃO DO LOCALSTORAGE
  async migrateFromLocalStorage() {
    console.log('Iniciando migração do localStorage para Firebase...');
    
    const migrations = [
      { key: 'crm_clientes', collection: 'clientes' },
      { key: 'crm_os', collection: 'ordensServico' },
      { key: 'crm_ov', collection: 'ordensVenda' },
      { key: 'crm_produtos', collection: 'produtos' },
      { key: 'crm_categorias', collection: 'categorias' },
      { key: 'crm_movimentacoes', collection: 'movimentacoes' },
      { key: 'crm_financeiro', collection: 'financeiro' },
      { key: 'crm_usuarios', collection: 'usuarios' }
    ];

    for (const migration of migrations) {
      try {
        const data = JSON.parse(localStorage.getItem(migration.key) || '[]');
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Migrando ${data.length} itens de ${migration.key}...`);
          
          for (const item of data) {
            // Remove o id do localStorage e deixa o Firebase gerar um novo
            const { id, ...itemData } = item;
            await this.saveData(migration.collection, itemData);
          }
          
          console.log(`Migração de ${migration.key} concluída!`);
        }
      } catch (error) {
        console.error(`Erro ao migrar ${migration.key}:`, error);
      }
    }

    // Migrar configurações
    try {
      const config = localStorage.getItem('crm_configuracoes');
      if (config) {
        const configData = JSON.parse(config);
        await this.saveConfiguracao(configData);
        console.log('Configurações migradas!');
      }
    } catch (error) {
      console.error('Erro ao migrar configurações:', error);
    }

    console.log('Migração concluída!');
  }
}

// Instância única do serviço
export const firebaseService = new FirebaseService();
export default firebaseService;

