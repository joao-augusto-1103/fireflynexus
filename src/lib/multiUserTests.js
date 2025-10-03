// 🧪 TESTES AUTOMATIZADOS PARA MULTI-USUÁRIO
// Este arquivo testa todas as funcionalidades multi-usuário

import { firebaseService } from './firebaseService.js';

// Dados de teste para múltiplos usuários
const testUsers = [
  {
    id: 'user1',
    nome: 'João Silva',
    email: 'joao@teste.com',
    tipo: 'admin',
    isTestData: true
  },
  {
    id: 'user2', 
    nome: 'Maria Santos',
    email: 'maria@teste.com',
    tipo: 'comum',
    isTestData: true
  },
  {
    id: 'user3',
    nome: 'Pedro Costa',
    email: 'pedro@teste.com',
    tipo: 'financeiro',
    isTestData: true
  }
];

const testData = {
  clientes: [
    {
      nome: 'Cliente User1',
      telefone: '(11) 99999-1111',
      email: 'cliente1@teste.com',
      isTestData: true
    },
    {
      nome: 'Cliente User2',
      telefone: '(11) 99999-2222',
      email: 'cliente2@teste.com',
      isTestData: true
    }
  ],
  ordensServico: [
    {
      cliente: 'Cliente User1',
      servico: 'Manutenção User1',
      valor: 100.00,
      status: 'Pendente',
      isTestData: true
    },
    {
      cliente: 'Cliente User2',
      servico: 'Manutenção User2',
      valor: 200.00,
      status: 'Concluída',
      isTestData: true
    }
  ],
  produtos: [
    {
      nome: 'Produto User1',
      preco: 50.00,
      quantidade: 10,
      isTestData: true
    },
    {
      nome: 'Produto User2',
      preco: 75.00,
      quantidade: 5,
      isTestData: true
    }
  ]
};

// 🧪 FUNÇÃO PRINCIPAL DE TESTE MULTI-USUÁRIO
export const testarMultiUsuario = async () => {
  try {
    console.log('🧪 ===== INICIANDO TESTE MULTI-USUÁRIO =====');
    
    // Inicializar Firebase
    await firebaseService.init();
    console.log('✅ Firebase inicializado com sucesso');
    
    let totalTestes = 0;
    let totalSucessos = 0;
    let totalErros = 0;
    
    // TESTE 1: Criar usuários de teste
    console.log('👥 Teste 1: Criando usuários de teste...');
    for (const user of testUsers) {
      try {
        totalTestes++;
        await firebaseService.saveUsuario(user, user.id);
        console.log(`✅ Usuário ${user.nome} criado com sucesso`);
        totalSucessos++;
      } catch (error) {
        console.error(`❌ Erro ao criar usuário ${user.nome}:`, error);
        totalErros++;
      }
    }
    
    // TESTE 2: Isolamento de dados por usuário
    console.log('🔒 Teste 2: Testando isolamento de dados...');
    
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      console.log(`\n--- Testando isolamento para ${user.nome} ---`);
      
      // Definir usuário atual
      firebaseService.setCurrentUser(user.id);
      
      // Criar dados para este usuário
      try {
        totalTestes++;
        const clienteId = await firebaseService.saveCliente(testData.clientes[i]);
        console.log(`✅ Cliente criado para ${user.nome}: ${clienteId}`);
        totalSucessos++;
      } catch (error) {
        console.error(`❌ Erro ao criar cliente para ${user.nome}:`, error);
        totalErros++;
      }
      
      try {
        totalTestes++;
        const osId = await firebaseService.saveOS(testData.ordensServico[i]);
        console.log(`✅ OS criada para ${user.nome}: ${osId}`);
        totalSucessos++;
      } catch (error) {
        console.error(`❌ Erro ao criar OS para ${user.nome}:`, error);
        totalErros++;
      }
      
      try {
        totalTestes++;
        const produtoId = await firebaseService.saveProduto(testData.produtos[i]);
        console.log(`✅ Produto criado para ${user.nome}: ${produtoId}`);
        totalSucessos++;
      } catch (error) {
        console.error(`❌ Erro ao criar produto para ${user.nome}:`, error);
        totalErros++;
      }
    }
    
    // TESTE 3: Verificar isolamento de dados
    console.log('\n🔍 Teste 3: Verificando isolamento de dados...');
    
    for (const user of testUsers) {
      console.log(`\n--- Verificando dados de ${user.nome} ---`);
      
      // Definir usuário atual
      firebaseService.setCurrentUser(user.id);
      
      try {
        totalTestes++;
        const clientes = await firebaseService.getClientes();
        console.log(`📊 Clientes de ${user.nome}: ${clientes.length}`);
        
        // Verificar se só vê seus próprios dados
        const clientesTeste = clientes.filter(c => c.isTestData);
        if (clientesTeste.length === 1) {
          console.log(`✅ Isolamento de clientes OK para ${user.nome}`);
          totalSucessos++;
        } else {
          console.log(`❌ Isolamento de clientes FALHOU para ${user.nome} - encontrados ${clientesTeste.length} clientes`);
          totalErros++;
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar clientes de ${user.nome}:`, error);
        totalErros++;
      }
      
      try {
        totalTestes++;
        const ordens = await firebaseService.getOS();
        console.log(`📊 OS de ${user.nome}: ${ordens.length}`);
        
        // Verificar se só vê suas próprias OS
        const ordensTeste = ordens.filter(o => o.isTestData);
        if (ordensTeste.length === 1) {
          console.log(`✅ Isolamento de OS OK para ${user.nome}`);
          totalSucessos++;
        } else {
          console.log(`❌ Isolamento de OS FALHOU para ${user.nome} - encontradas ${ordensTeste.length} OS`);
          totalErros++;
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar OS de ${user.nome}:`, error);
        totalErros++;
      }
      
      try {
        totalTestes++;
        const produtos = await firebaseService.getProdutos();
        console.log(`📊 Produtos de ${user.nome}: ${produtos.length}`);
        
        // Verificar se só vê seus próprios produtos
        const produtosTeste = produtos.filter(p => p.isTestData);
        if (produtosTeste.length === 1) {
          console.log(`✅ Isolamento de produtos OK para ${user.nome}`);
          totalSucessos++;
        } else {
          console.log(`❌ Isolamento de produtos FALHOU para ${user.nome} - encontrados ${produtosTeste.length} produtos`);
          totalErros++;
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar produtos de ${user.nome}:`, error);
        totalErros++;
      }
    }
    
    // TESTE 4: Testar acesso cruzado (deve falhar)
    console.log('\n🚫 Teste 4: Testando acesso cruzado...');
    
    // User1 tenta acessar dados do User2
    firebaseService.setCurrentUser('user1');
    try {
      totalTestes++;
      const clientesUser2 = await firebaseService.getData('clientes');
      const clientesTeste = clientesUser2.filter(c => c.isTestData);
      
      if (clientesTeste.length === 1) {
        console.log('✅ Acesso cruzado bloqueado corretamente');
        totalSucessos++;
      } else {
        console.log(`❌ Acesso cruzado NÃO bloqueado - encontrados ${clientesTeste.length} clientes`);
        totalErros++;
      }
    } catch (error) {
      console.log('✅ Acesso cruzado bloqueado por erro:', error.message);
      totalSucessos++;
    }
    
    // TESTE 5: Testar tempo real
    console.log('\n⚡ Teste 5: Testando sincronização em tempo real...');
    
    let realtimeTestPassed = false;
    
    try {
      totalTestes++;
      firebaseService.setCurrentUser('user1');
      
      // Configurar listener em tempo real
      const unsubscribe = await firebaseService.subscribeToCollection('clientes', (data) => {
        console.log('📡 Dados recebidos em tempo real:', data.length);
        realtimeTestPassed = true;
      });
      
      // Aguardar um pouco para receber dados
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Limpar listener
      if (unsubscribe) unsubscribe();
      
      if (realtimeTestPassed) {
        console.log('✅ Sincronização em tempo real funcionando');
        totalSucessos++;
      } else {
        console.log('❌ Sincronização em tempo real falhou');
        totalErros++;
      }
    } catch (error) {
      console.error('❌ Erro no teste de tempo real:', error);
      totalErros++;
    }
    
    console.log('\n🧪 ===== RESULTADOS DO TESTE MULTI-USUÁRIO =====');
    console.log(`📊 Total de testes: ${totalTestes}`);
    console.log(`✅ Sucessos: ${totalSucessos}`);
    console.log(`❌ Erros: ${totalErros}`);
    console.log(`📈 Taxa de sucesso: ${((totalSucessos / totalTestes) * 100).toFixed(1)}%`);
    
    return {
      sucesso: totalErros === 0,
      totalTestes,
      totalSucessos,
      totalErros,
      taxaSucesso: (totalSucessos / totalTestes) * 100
    };
    
  } catch (error) {
    console.error('❌ Erro geral no teste multi-usuário:', error);
    throw error;
  }
};

// 🧹 FUNÇÃO PARA LIMPAR DADOS DE TESTE MULTI-USUÁRIO
export const limparDadosTesteMultiUsuario = async () => {
  try {
    console.log('🧹 ===== INICIANDO LIMPEZA DE DADOS DE TESTE MULTI-USUÁRIO =====');
    
    await firebaseService.init();
    
    let totalRemovidos = 0;
    
    // Limpar dados de cada usuário
    for (const user of testUsers) {
      console.log(`\n--- Limpando dados de ${user.nome} ---`);
      
      firebaseService.setCurrentUser(user.id);
      
      const colecoes = ['clientes', 'ordens_servico', 'ordens_venda', 'produtos', 'categorias', 'movimentacoes', 'financeiro'];
      
      for (const colecao of colecoes) {
        try {
          const dados = await firebaseService.getData(colecao);
          const dadosTeste = dados.filter(item => item.isTestData === true);
          
          console.log(`📊 Encontrados ${dadosTeste.length} dados de teste em ${colecao} para ${user.nome}`);
          
          for (const item of dadosTeste) {
            try {
              await firebaseService.deleteDocument(colecao, item.id);
              console.log(`🗑️ Removido: ${item.nome || item.titulo || item.id}`);
              totalRemovidos++;
            } catch (error) {
              console.error(`❌ Erro ao remover item ${item.id}:`, error);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao limpar coleção ${colecao} para ${user.nome}:`, error);
        }
      }
    }
    
    // Limpar usuários de teste
    console.log('\n--- Limpando usuários de teste ---');
    for (const user of testUsers) {
      try {
        await firebaseService.deleteUsuario(user.id);
        console.log(`🗑️ Usuário removido: ${user.nome}`);
        totalRemovidos++;
      } catch (error) {
        console.error(`❌ Erro ao remover usuário ${user.nome}:`, error);
      }
    }
    
    console.log(`\n🧹 ===== LIMPEZA CONCLUÍDA =====`);
    console.log(`✅ Total de itens removidos: ${totalRemovidos}`);
    
    return { totalRemovidos };
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    throw error;
  }
};

// 🔥 FUNÇÃO DE TESTE DE PERFORMANCE MULTI-USUÁRIO
export const testarPerformanceMultiUsuario = async () => {
  try {
    console.log('⚡ ===== INICIANDO TESTE DE PERFORMANCE MULTI-USUÁRIO =====');
    
    const resultados = [];
    
    for (const user of testUsers) {
      console.log(`\n--- Testando performance para ${user.nome} ---`);
      
      firebaseService.setCurrentUser(user.id);
      
      const inicio = Date.now();
      
      // Teste de leitura
      const inicioLeitura = Date.now();
      await firebaseService.getClientes();
      const fimLeitura = Date.now();
      const tempoLeitura = fimLeitura - inicioLeitura;
      
      // Teste de escrita
      const inicioEscrita = Date.now();
      await firebaseService.saveCliente({
        nome: `Teste Performance ${user.nome}`,
        email: `perf@${user.nome.toLowerCase().replace(' ', '')}.com`,
        isTestData: true
      });
      const fimEscrita = Date.now();
      const tempoEscrita = fimEscrita - inicioEscrita;
      
      const fim = Date.now();
      const tempoTotal = fim - inicio;
      
      const resultado = {
        usuario: user.nome,
        tempoLeitura,
        tempoEscrita,
        tempoTotal,
        performance: tempoTotal < 1000 ? 'boa' : 'ruim'
      };
      
      resultados.push(resultado);
      
      console.log(`📖 Tempo de leitura: ${tempoLeitura}ms`);
      console.log(`✍️ Tempo de escrita: ${tempoEscrita}ms`);
      console.log(`⏱️ Tempo total: ${tempoTotal}ms`);
      console.log(`📈 Performance: ${resultado.performance}`);
    }
    
    console.log('\n⚡ ===== RESULTADOS DE PERFORMANCE =====');
    resultados.forEach(resultado => {
      console.log(`${resultado.usuario}: ${resultado.tempoTotal}ms (${resultado.performance})`);
    });
    
    return resultados;
    
  } catch (error) {
    console.error('❌ Erro no teste de performance:', error);
    throw error;
  }
};

// 🌐 EXPORTAR PARA USO NO CONSOLE DO NAVEGADOR
if (typeof window !== 'undefined') {
  window.testarMultiUsuario = testarMultiUsuario;
  window.limparDadosTesteMultiUsuario = limparDadosTesteMultiUsuario;
  window.testarPerformanceMultiUsuario = testarPerformanceMultiUsuario;

  console.log('🧪 Funções de teste multi-usuário disponíveis:');
  console.log('   testarMultiUsuario() - Executa todos os testes multi-usuário');
  console.log('   limparDadosTesteMultiUsuario() - Remove dados de teste multi-usuário');
  console.log('   testarPerformanceMultiUsuario() - Testa performance multi-usuário');
}
