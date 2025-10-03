import { useState, useEffect, useCallback } from 'react';
import { firebaseService } from '../firebaseService';

// Hook para gerenciar dados do Firebase
export const useFirebaseData = (collectionName, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { 
    enableRealtime = true,
    onError = null
  } = options;

  useEffect(() => {
    let unsubscribe = null;
    let retryCount = 0;
    const maxRetries = 3;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`[useFirebaseData] ===== INÍCIO CARREGAMENTO ${collectionName} =====`);
        console.log(`[useFirebaseData] enableRealtime: ${enableRealtime}`);
        console.log(`[useFirebaseData] Tentativa ${retryCount + 1}/${maxRetries + 1}`);

        // Verificar se Firebase está disponível
        if (!firebaseService.isFirebaseAvailable) {
          console.log(`[useFirebaseData] Firebase não disponível, tentando inicializar...`);
          try {
            await firebaseService.init();
            console.log(`[useFirebaseData] ✅ Firebase inicializado com sucesso`);
          } catch (initError) {
            console.error(`[useFirebaseData] ❌ Erro na inicialização do Firebase:`, initError);
            throw initError;
          }
        }

        if (enableRealtime) {
          // Usar escuta em tempo real
          console.log(`[useFirebaseData] Configurando escuta em tempo real para ${collectionName}`);
          try {
            unsubscribe = await firebaseService.subscribeToCollection(collectionName, (newData) => {
              console.log(`[useFirebaseData] ✅ Dados recebidos de ${collectionName}:`, newData);
              console.log(`[useFirebaseData] Tipo dos dados:`, typeof newData, Array.isArray(newData));
              setData(Array.isArray(newData) ? newData : []);
              setLoading(false);
            });
            console.log(`[useFirebaseData] ✅ Escuta configurada com sucesso para ${collectionName}`);
          } catch (subscribeError) {
            console.error(`[useFirebaseData] ❌ Erro ao configurar escuta para ${collectionName}:`, subscribeError);
            // Fallback para carregamento único
            console.log(`[useFirebaseData] Tentando carregamento único como fallback...`);
            const result = await firebaseService.getData(collectionName);
            console.log(`[useFirebaseData] Dados carregados (fallback) de ${collectionName}:`, result);
            setData(Array.isArray(result) ? result : []);
            setLoading(false);
          }
        } else {
          // Carregar dados uma única vez
          console.log(`[useFirebaseData] Carregando dados uma única vez para ${collectionName}`);
          const result = await firebaseService.getData(collectionName);
          console.log(`[useFirebaseData] Dados carregados de ${collectionName}:`, result);
          console.log(`[useFirebaseData] Tipo dos dados:`, typeof result, Array.isArray(result));
          setData(Array.isArray(result) ? result : []);
          setLoading(false);
        }
        console.log(`[useFirebaseData] ===== FIM CARREGAMENTO ${collectionName} =====`);
      } catch (err) {
        console.error(`[useFirebaseData] ❌ ERRO CRÍTICO ao carregar dados de ${collectionName}:`, err);
        console.error(`[useFirebaseData] Stack trace:`, err.stack);
        
        // Tentar novamente se não excedeu o limite
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`[useFirebaseData] Tentando novamente em 2 segundos... (${retryCount}/${maxRetries})`);
          setTimeout(() => {
            loadData();
          }, 2000);
          return;
        }
        
        setError(err);
        setLoading(false);
        // Garantir que sempre retorne um array vazio em caso de erro
        setData([]);
        if (onError) onError(err);
      }
    };

    loadData();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collectionName, enableRealtime, onError]);

  const save = async (item, id = null) => {
    try {
      console.log(`[useFirebaseData] Salvando item em ${collectionName}:`, item);
      
      const result = await firebaseService.saveData(collectionName, item, id);
      console.log(`[useFirebaseData] Item salvo com sucesso em ${collectionName}:`, result);
      return result;
    } catch (err) {
      console.error(`[useFirebaseData] Erro ao salvar em ${collectionName}:`, err);
      setError(err);
      throw err;
    }
  };

  const remove = async (id) => {
    try {
      console.log(`[useFirebaseData] Removendo item ${id} de ${collectionName}`);
      
      const result = await firebaseService.deleteDocument(collectionName, id);
      console.log(`[useFirebaseData] Item removido com sucesso de ${collectionName}`);
      return result;
    } catch (err) {
      console.error(`[useFirebaseData] Erro ao deletar de ${collectionName}:`, err);
      setError(err);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    save,
    remove,
    refresh: () => {
      setLoading(true);
      firebaseService.getData(collectionName).then(setData).finally(() => setLoading(false));
    }
  };
};

// Hooks específicos para cada entidade
export const useClientes = () => useFirebaseData('clientes');
export const useOS = () => useFirebaseData('ordensServico');
export const useOV = () => useFirebaseData('ordensVenda');
export const useProdutos = () => useFirebaseData('produtos');
export const useCategorias = () => useFirebaseData('categorias');
export const useMovimentacoes = () => useFirebaseData('movimentacoes');
export const useFinanceiro = () => useFirebaseData('financeiro');
export const useConfiguracoesLoja = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        console.log('[useConfiguracoesLoja] Carregando configurações da loja...');
        
        const result = await firebaseService.getData('configuracoes_loja');
        console.log('[useConfiguracoesLoja] Configurações carregadas:', result);
        
        // Se não existir configuração, usar padrão
        if (!result || result.length === 0) {
          const defaultConfig = {
            nomeEmpresa: 'MultiSmart',
            descricao: 'Manutenção e Comércio de Celulares e Tablets',
            endereco: 'Rua José Pedro dos Santos nº74 - JD das Lanjeiras, Bebedouro - SP',
            telefone: '(17)3345-1016',
            whatsapp: '(17)99157-1263',
            cnpj: '47.309.271/0001-97',
            email: '',
            site: '',
            logo: ''
          };
          setConfig(defaultConfig);
        } else {
          setConfig(result[0]); // Primeira (e única) configuração
        }
        
        setLoading(false);
      } catch (err) {
        console.error('[useConfiguracoesLoja] Erro ao carregar configurações:', err);
        setError(err);
        setLoading(false);
        
        // Configuração padrão em caso de erro
        setConfig({
          nomeEmpresa: 'MultiSmart',
          descricao: 'Manutenção e Comércio de Celulares e Tablets',
          endereco: 'Rua José Pedro dos Santos nº74 - JD das Lanjeiras, Bebedouro - SP',
          telefone: '(17)3345-1016',
          whatsapp: '(17)99157-1263',
          cnpj: '47.309.271/0001-97',
          email: '',
          site: '',
          logo: ''
        });
      }
    };

    loadConfig();
  }, []);

  const saveConfig = async (configData) => {
    try {
      console.log('[useConfiguracoesLoja] Salvando configurações:', configData);
      
      // Se já existe configuração, atualizar; senão criar nova
      if (config && config.id) {
        const result = await firebaseService.saveData('configuracoes_loja', configData, config.id);
        setConfig({ ...configData, id: config.id });
        return result;
      } else {
        const result = await firebaseService.saveData('configuracoes_loja', configData);
        setConfig({ ...configData, id: result.id });
        return result;
      }
    } catch (err) {
      console.error('[useConfiguracoesLoja] Erro ao salvar configurações:', err);
      setError(err);
      throw err;
    }
  };

  return {
    config,
    loading,
    error,
    saveConfig
  };
};

// Hook para caixa/PDV
export const useCaixa = () => {
  return useFirebaseData('caixa', { enableRealtime: true });
};

// Hook específico e robusto para gerenciar usuários
export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar usuários do Firebase
  const loadUsuarios = useCallback(async () => {
    try {
      console.log('[useUsuarios] Carregando usuários...');
      setLoading(true);
      setError(null);

      const result = await firebaseService.getData('usuarios');
      console.log('[useUsuarios] Usuários carregados:', result);
      
      const usuariosArray = Array.isArray(result) ? result : [];
      setUsuarios(usuariosArray);
      
    } catch (err) {
      console.error('[useUsuarios] Erro ao carregar usuários:', err);
      setError(err);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Configurar escuta em tempo real
  useEffect(() => {
    let unsubscribe = null;

    const setupRealtimeListener = async () => {
      try {
        console.log('[useUsuarios] Configurando escuta em tempo real...');
        
        unsubscribe = await firebaseService.subscribeToCollection('usuarios', (newData) => {
          console.log('[useUsuarios] Dados recebidos em tempo real:', newData);
          const usuariosArray = Array.isArray(newData) ? newData : [];
          setUsuarios(usuariosArray);
          setLoading(false);
        });
        
        console.log('[useUsuarios] Escuta em tempo real configurada com sucesso');
      } catch (err) {
        console.error('[useUsuarios] Erro ao configurar escuta em tempo real:', err);
        // Fallback para carregamento único
        await loadUsuarios();
      }
    };

    setupRealtimeListener();

    // Cleanup
    return () => {
      if (unsubscribe) {
        console.log('[useUsuarios] Removendo escuta em tempo real');
        unsubscribe();
      }
    };
  }, [loadUsuarios]);

  // Salvar usuário
  const saveUsuario = useCallback(async (usuarioData) => {
    try {
      console.log('[useUsuarios] Salvando usuário:', usuarioData);
      
      // Se não tem ID, é um novo usuário - não passar ID para criar novo documento
      const isNewUser = !usuarioData.id;
      
      if (isNewUser) {
        console.log('[useUsuarios] Novo usuário - criando documento');
        // Adicionar timestamps para novo usuário
        usuarioData.dataCriacao = new Date().toISOString();
        usuarioData.createdAt = new Date().toISOString();
      } else {
        console.log('[useUsuarios] Usuário existente - atualizando documento:', usuarioData.id);
      }
      
      usuarioData.ultimaAtualizacao = new Date().toISOString();
      usuarioData.updatedAt = new Date().toISOString();

      // Para novos usuários, não passar ID (null)
      // Para usuários existentes, passar o ID
      const idToUse = isNewUser ? null : usuarioData.id;
      const result = await firebaseService.saveData('usuarios', usuarioData, idToUse);
      
      console.log('[useUsuarios] Usuário salvo com sucesso:', result);
      
      return result;
    } catch (err) {
      console.error('[useUsuarios] Erro ao salvar usuário:', err);
      throw err;
    }
  }, []);

  // Remover usuário
  const removeUsuario = useCallback(async (usuarioId) => {
    try {
      console.log('[useUsuarios] Removendo usuário:', usuarioId);
      
      await firebaseService.deleteDocument('usuarios', usuarioId);
      console.log('[useUsuarios] Usuário removido com sucesso');
      
      return true;
    } catch (err) {
      console.error('[useUsuarios] Erro ao remover usuário:', err);
      throw err;
    }
  }, []);

  // Buscar usuário por email
  const findUsuarioByEmail = useCallback((email) => {
    return usuarios.find(u => u.email === email);
  }, [usuarios]);

  // Buscar usuário por ID
  const findUsuarioById = useCallback((id) => {
    return usuarios.find(u => u.id === id);
  }, [usuarios]);

  // Verificar se email já existe
  const emailExists = useCallback((email, excludeId = null) => {
    return usuarios.some(u => u.email === email && u.id !== excludeId);
  }, [usuarios]);

  // Contar usuários por status
  const countUsuariosByStatus = useCallback((status) => {
    return usuarios.filter(u => u.status === status).length;
  }, [usuarios]);

  // Contar usuários ativos e pendentes (para limite)
  const countUsuariosAtivos = useCallback(() => {
    return usuarios.filter(u => u.status === 'ativo' || u.status === 'pendente').length;
  }, [usuarios]);

  // Refresh manual
  const refresh = useCallback(() => {
    console.log('[useUsuarios] Refresh manual solicitado');
    loadUsuarios();
  }, [loadUsuarios]);

  return {
    // Dados
    usuarios,
    loading,
    error,
    
    // Operações CRUD
    saveUsuario,
    removeUsuario,
    
    // Utilitários
    findUsuarioByEmail,
    findUsuarioById,
    emailExists,
    countUsuariosByStatus,
    countUsuariosAtivos,
    refresh,
    
    // Aliases para compatibilidade
    data: usuarios,
    save: saveUsuario,
    remove: removeUsuario
  };
};

// Hook para configurações (sempre retorna um objeto único)
export const useConfiguracao = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        
        // Timeout muito rápido para não bloquear o login
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 500)
        );
        
        const configPromise = firebaseService.getConfiguracao();
        
        const result = await Promise.race([configPromise, timeoutPromise]);
        setConfig(result);
        setLoading(false);
        console.log('[useConfiguracao] Configuração carregada:', result);
      } catch (err) {
        console.warn('[useConfiguracao] Erro ao carregar configuração, usando padrão:', err.message);
        // Usar configuração padrão em caso de erro
        setConfig({
          nomeEmpresa: 'Firefly Nexus',
          tema: 'dark',
          idioma: 'pt-BR',
          permitirCadastro: true,
          requerAprovacao: false,
          limiteUsuarios: 10
        });
        setError(err);
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const saveConfig = async (configData) => {
    try {
      // Limpar caches para forçar atualização imediata
      localStorage.removeItem('crm_config_cache');
      
      const result = await firebaseService.saveConfiguracao(configData);
      setConfig(configData);
      
      // Forçar re-render da sidebar imediatamente
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('configUpdated'));
      }, 100);
      
      return result;
    } catch (err) {
      console.error('Erro ao salvar configuração:', err);
      setError(err);
      throw err;
    }
  };

  return {
    config,
    loading,
    error,
    saveConfig
  };
};

// Hook para migração do localStorage
export const useMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  const migrate = async () => {
    setIsMigrating(true);
    try {
      await firebaseService.migrateFromLocalStorage();
      setMigrationComplete(true);
    } catch (error) {
      console.error('Erro na migração:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  return {
    migrate,
    isMigrating,
    migrationComplete
  };
};
