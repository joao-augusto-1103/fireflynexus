import { firebaseService } from './firebaseService';

class MigrationService {
  constructor() {
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
      configuracoesLoja: 'crm_configuracoes_loja'
    };
  }

  // Verificar se há dados no localStorage para migrar
  async checkLocalStorageData() {
    const dadosEncontrados = {};
    
    for (const [collection, key] of Object.entries(this.localStorageKeys)) {
      const dados = localStorage.getItem(key);
      if (dados) {
        try {
          const parsed = JSON.parse(dados);
          dadosEncontrados[collection] = {
            key,
            dados: parsed,
            quantidade: Array.isArray(parsed) ? parsed.length : 1
          };
        } catch (error) {
          console.error(`Erro ao parsear ${key}:`, error);
        }
      }
    }

    return dadosEncontrados;
  }

  // Migrar dados específicos do localStorage para Firebase
  async migrarCollection(collectionName) {
    const key = this.localStorageKeys[collectionName];
    if (!key) {
      throw new Error(`Chave não encontrada para ${collectionName}`);
    }

    const dados = localStorage.getItem(key);
    if (!dados) {
      console.log(`[Migration] Nenhum dado encontrado para ${collectionName}`);
      return { migrados: 0, erros: 0 };
    }

    try {
      const parsed = JSON.parse(dados);
      let migrados = 0;
      let erros = 0;

      console.log(`[Migration] Migrando ${collectionName}...`);

      // Para configurações (objeto único)
      if (collectionName === 'configuracoes' || collectionName === 'configuracoesLoja') {
        try {
          await firebaseService.saveData(collectionName, parsed);
          migrados = 1;
          console.log(`[Migration] ✅ ${collectionName} migrado com sucesso`);
        } catch (error) {
          console.error(`[Migration] ❌ Erro ao migrar ${collectionName}:`, error);
          erros = 1;
        }
      } 
      // Para outras coleções (arrays)
      else if (Array.isArray(parsed)) {
        for (const item of parsed) {
          try {
            await firebaseService.saveData(collectionName, item, item.id);
            migrados++;
          } catch (error) {
            console.error(`[Migration] ❌ Erro ao migrar item de ${collectionName}:`, error);
            erros++;
          }
        }
        console.log(`[Migration] ✅ ${collectionName}: ${migrados} itens migrados, ${erros} erros`);
      }

      return { migrados, erros };
    } catch (error) {
      console.error(`[Migration] ❌ Erro geral ao migrar ${collectionName}:`, error);
      return { migrados: 0, erros: 1 };
    }
  }

  // Migrar todos os dados do localStorage para Firebase
  async migrarTudoParaFirebase() {
    console.log('[Migration] 🔄 Iniciando migração completa do localStorage para Firebase...');
    
    const dadosEncontrados = await this.checkLocalStorageData();
    const collections = Object.keys(dadosEncontrados);
    
    if (collections.length === 0) {
      console.log('[Migration] ✅ Nenhum dado encontrado no localStorage para migrar');
      return { sucesso: true, resumo: {} };
    }

    console.log(`[Migration] 📊 Dados encontrados em ${collections.length} coleções:`, dadosEncontrados);

    const resumo = {};
    let totalMigrados = 0;
    let totalErros = 0;

    for (const collection of collections) {
      const resultado = await this.migrarCollection(collection);
      resumo[collection] = resultado;
      totalMigrados += resultado.migrados;
      totalErros += resultado.erros;
    }

    console.log('[Migration] 📈 Resumo da migração:', resumo);
    console.log(`[Migration] ✅ Migração concluída: ${totalMigrados} itens migrados, ${totalErros} erros`);

    return {
      sucesso: totalErros === 0,
      resumo,
      totalMigrados,
      totalErros
    };
  }

  // Limpar dados do localStorage após migração bem-sucedida
  async limparLocalStorageAposMigracao() {
    console.log('[Migration] 🧹 Limpando dados do localStorage após migração...');
    
    let removidos = 0;
    for (const [collection, key] of Object.entries(this.localStorageKeys)) {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        removidos++;
        console.log(`[Migration] 🗑️ Removido ${key}`);
      }
    }

    // Remover também chaves específicas do sistema
    const chavesSistema = [
      'crm_usuario_logado',
      'crm_email_salvo', 
      'crm_lembrar_email',
      'crm_config_cache'
    ];

    for (const chave of chavesSistema) {
      if (localStorage.getItem(chave)) {
        localStorage.removeItem(chave);
        removidos++;
        console.log(`[Migration] 🗑️ Removido ${chave}`);
      }
    }

    console.log(`[Migration] ✅ ${removidos} chaves removidas do localStorage`);
    return removidos;
  }

  // Executar migração completa
  async executarMigracaoCompleta() {
    try {
      console.log('[Migration] 🚀 Iniciando migração completa...');
      
      // 1. Verificar dados no localStorage
      const dadosEncontrados = await this.checkLocalStorageData();
      if (Object.keys(dadosEncontrados).length === 0) {
        console.log('[Migration] ✅ Nenhum dado para migrar');
        return { sucesso: true, mensagem: 'Nenhum dado encontrado para migrar' };
      }

      // 2. Migrar para Firebase
      const resultadoMigracao = await this.migrarTudoParaFirebase();
      
      if (!resultadoMigracao.sucesso) {
        console.log('[Migration] ⚠️ Migração concluída com erros');
        return { 
          sucesso: false, 
          mensagem: `Migração concluída com ${resultadoMigracao.totalErros} erros`,
          detalhes: resultadoMigracao.resumo
        };
      }

      // 3. Limpar localStorage
      const removidos = await this.limparLocalStorageAposMigracao();
      
      console.log('[Migration] 🎉 Migração completa bem-sucedida!');
      return {
        sucesso: true,
        mensagem: `Migração completa! ${resultadoMigracao.totalMigrados} itens migrados, ${removidos} chaves removidas do localStorage`,
        detalhes: {
          migrados: resultadoMigracao.totalMigrados,
          removidos,
          resumo: resultadoMigracao.resumo
        }
      };

    } catch (error) {
      console.error('[Migration] ❌ Erro durante migração completa:', error);
      return {
        sucesso: false,
        mensagem: `Erro durante migração: ${error.message}`,
        erro: error
      };
    }
  }

  // Verificar se há dados no localStorage (para exibir no UI)
  async verificarStatusMigracao() {
    const dadosEncontrados = await this.checkLocalStorageData();
    const temDados = Object.keys(dadosEncontrados).length > 0;
    
    return {
      temDadosLocalStorage: temDados,
      dadosEncontrados,
      precisaMigrar: temDados
    };
  }
}

export const migrationService = new MigrationService();
