import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Processa dados dos top clientes para o relatório gráfico
 * @param {Array} ordensVenda - Array de ordens de venda
 * @param {Array} clientes - Array de clientes
 * @returns {Array} Dados processados para o gráfico
 */
export const processTopClientes = (ordensVenda, clientes) => {
  console.log('=== PROCESSANDO TOP CLIENTES ===');
  console.log('Ordens de venda recebidas:', ordensVenda?.length || 0);
  console.log('Clientes recebidos:', clientes?.length || 0);
  
  // Debug: mostrar estrutura dos dados
  if (ordensVenda && ordensVenda.length > 0) {
    console.log('Estrutura da primeira OV:', ordensVenda[0]);
  }
  
  if (clientes && clientes.length > 0) {
    console.log('Estrutura do primeiro cliente:', clientes[0]);
  }
  
  if (!ordensVenda || ordensVenda.length === 0) {
    console.log('Nenhuma ordem de venda encontrada');
    return [];
  }

  if (!clientes || clientes.length === 0) {
    console.log('Nenhum cliente encontrado');
    return [];
  }

  // Criar mapa de clientes por ID para busca rápida
  const clientesMap = {};
  clientes.forEach(cliente => {
    clientesMap[cliente.id] = cliente;
  });

  console.log('Clientes mapeados:', Object.keys(clientesMap).length);

  // Inicializar contadores por cliente
  const vendasPorCliente = {};

  // Processar cada ordem de venda
  ordensVenda.forEach(ov => {
    console.log(`Processando OV ${ov.numero}:`, ov);
    
    // Tentar identificar o cliente
    let clienteId = null;
    let clienteNome = 'Cliente não identificado';
    let clienteInfo = null;
    
    // Buscar cliente por diferentes campos
    if (ov.clienteId) {
      clienteId = ov.clienteId;
      clienteInfo = clientesMap[clienteId];
      if (clienteInfo) {
        clienteNome = clienteInfo.nome;
      }
    } else if (ov.cliente) {
      clienteNome = ov.cliente;
      // Tentar encontrar cliente pelo nome
      clienteInfo = clientes.find(c => 
        c.nome.toLowerCase().includes(ov.cliente.toLowerCase())
      );
      if (clienteInfo) {
        clienteId = clienteInfo.id;
      }
    } else if (ov.clienteNome) {
      clienteNome = ov.clienteNome;
      // Tentar encontrar cliente pelo nome
      clienteInfo = clientes.find(c => 
        c.nome.toLowerCase().includes(ov.clienteNome.toLowerCase())
      );
      if (clienteInfo) {
        clienteId = clienteInfo.id;
      }
    }
    
    // Se não encontrou cliente, usar nome genérico
    if (!clienteId) {
      clienteId = `sem_id_${clienteNome.replace(/\s+/g, '_').toLowerCase()}`;
    }
    
    console.log(`Cliente identificado: ${clienteNome} (ID: ${clienteId})`);
    
    // Inicializar cliente se não existir
    if (!vendasPorCliente[clienteId]) {
      vendasPorCliente[clienteId] = {
        clienteId: clienteId,
        nome: clienteNome,
        email: clienteInfo?.email || '',
        telefone: clienteInfo?.telefone || ov.clienteTelefone || '',
        endereco: clienteInfo?.endereco || '',
        categoria: clienteInfo?.categoria || 'normal',
        foto: clienteInfo?.foto || '',
        valorTotal: 0,
        quantidadeOrdens: 0,
        ticketMedio: 0,
        ultimaCompra: null,
        primeiraCompra: null,
        produtosComprados: 0,
        statusCliente: clienteInfo ? 'cadastrado' : 'nao_cadastrado'
      };
    }
    
    // Calcular valor da OV
    const valorOV = parseFloat(ov.total) || parseFloat(ov.valorTotal) || parseFloat(ov.valor) || 0;
    
    // Calcular produtos da OV
    const produtosDaOV = ov.produtos || ov.itens || [];
    const quantidadeProdutos = produtosDaOV.reduce((sum, item) => {
      return sum + (parseInt(item.quantidade) || 1);
    }, 0);
    
    // Data da OV
    let dataOV = null;
    try {
      if (ov.createdAt) {
        dataOV = new Date(ov.createdAt);
      } else if (ov.dataVenda) {
        dataOV = new Date(ov.dataVenda);
      } else if (ov.data) {
        dataOV = new Date(ov.data);
      }
    } catch (error) {
      console.warn('Erro ao processar data da OV:', ov, error);
    }
    
    // Atualizar dados do cliente
    vendasPorCliente[clienteId].valorTotal += valorOV;
    vendasPorCliente[clienteId].quantidadeOrdens += 1;
    vendasPorCliente[clienteId].produtosComprados += quantidadeProdutos;
    
    // Atualizar datas de primeira e última compra
    if (dataOV && !isNaN(dataOV.getTime())) {
      if (!vendasPorCliente[clienteId].ultimaCompra || dataOV > vendasPorCliente[clienteId].ultimaCompra) {
        vendasPorCliente[clienteId].ultimaCompra = dataOV;
      }
      if (!vendasPorCliente[clienteId].primeiraCompra || dataOV < vendasPorCliente[clienteId].primeiraCompra) {
        vendasPorCliente[clienteId].primeiraCompra = dataOV;
      }
    }
    
    console.log(`Atualizado cliente ${clienteNome}:`, {
      valorTotal: vendasPorCliente[clienteId].valorTotal,
      quantidadeOrdens: vendasPorCliente[clienteId].quantidadeOrdens,
      produtosComprados: vendasPorCliente[clienteId].produtosComprados
    });
  });

  // Calcular ticket médio para cada cliente
  Object.values(vendasPorCliente).forEach(cliente => {
    if (cliente.quantidadeOrdens > 0) {
      cliente.ticketMedio = cliente.valorTotal / cliente.quantidadeOrdens;
    }
  });

  // Converter para array e ordenar por valor total decrescente
  const resultado = Object.values(vendasPorCliente)
    .filter(cliente => cliente.valorTotal > 0)
    .sort((a, b) => b.valorTotal - a.valorTotal);

  console.log('=== RESULTADO TOP CLIENTES ===');
  resultado.forEach((cliente, index) => {
    console.log(`${index + 1}º ${cliente.nome}: R$ ${cliente.valorTotal.toFixed(2)} (${cliente.quantidadeOrdens} ordens, ticket médio: R$ ${cliente.ticketMedio.toFixed(2)})`);
  });
  console.log('====================================');
  
  return resultado;
};

/**
 * Calcula estatísticas resumidas dos top clientes
 * @param {Array} topClientes - Dados processados dos top clientes
 * @returns {Object} Estatísticas resumidas
 */
export const calcularEstatisticasTopClientes = (topClientes) => {
  if (!topClientes || topClientes.length === 0) {
    return {
      totalClientes: 0,
      clientesMaisValiosos: null,
      clienteMenosValioso: null,
      ticketMedioGeral: 0,
      totalVendas: 0,
      totalOrdens: 0,
      clientesVIP: 0,
      clientesCadastrados: 0,
      clientesNaoCadastrados: 0
    };
  }

  const totalClientes = topClientes.length;
  const clientesMaisValiosos = topClientes[0]; // Já está ordenado por valor
  const clienteMenosValioso = topClientes[topClientes.length - 1];
  
  const totalVendas = topClientes.reduce((sum, cliente) => sum + cliente.valorTotal, 0);
  const totalOrdens = topClientes.reduce((sum, cliente) => sum + cliente.quantidadeOrdens, 0);
  const ticketMedioGeral = totalOrdens > 0 ? totalVendas / totalOrdens : 0;
  
  const clientesVIP = topClientes.filter(cliente => cliente.categoria === 'vip').length;
  const clientesCadastrados = topClientes.filter(cliente => cliente.statusCliente === 'cadastrado').length;
  const clientesNaoCadastrados = topClientes.filter(cliente => cliente.statusCliente === 'nao_cadastrado').length;

  return {
    totalClientes,
    clientesMaisValiosos,
    clienteMenosValioso,
    ticketMedioGeral,
    totalVendas,
    totalOrdens,
    clientesVIP,
    clientesCadastrados,
    clientesNaoCadastrados
  };
};

/**
 * Formata dados para diferentes tipos de gráfico
 * @param {Array} topClientes - Dados processados dos top clientes
 * @param {string} tipo - Tipo do gráfico ('bar', 'horizontal', 'pie')
 * @param {number} limite - Número máximo de clientes a mostrar
 * @returns {Array} Dados formatados para o gráfico
 */
export const formatarDadosParaGrafico = (topClientes, tipo = 'bar', limite = 10) => {
  if (!topClientes || topClientes.length === 0) {
    return [];
  }

  const clientesLimitados = topClientes.slice(0, limite);

  switch (tipo) {
    case 'horizontal':
      return clientesLimitados.map(cliente => ({
        nome: cliente.nome.length > 20 ? cliente.nome.substring(0, 20) + '...' : cliente.nome,
        valorTotal: cliente.valorTotal,
        quantidadeOrdens: cliente.quantidadeOrdens,
        ticketMedio: cliente.ticketMedio,
        categoria: cliente.categoria
      }));
    
    case 'pie':
      return clientesLimitados.map(cliente => ({
        name: cliente.nome.length > 15 ? cliente.nome.substring(0, 15) + '...' : cliente.nome,
        value: cliente.valorTotal,
        quantidadeOrdens: cliente.quantidadeOrdens,
        fill: cliente.categoria === 'vip' ? '#F59E0B' : '#6366F1'
      }));
    
    case 'bar':
    default:
      return clientesLimitados.map(cliente => ({
        nome: cliente.nome.length > 15 ? cliente.nome.substring(0, 15) + '...' : cliente.nome,
        valorTotal: cliente.valorTotal,
        quantidadeOrdens: cliente.quantidadeOrdens,
        ticketMedio: cliente.ticketMedio,
        produtosComprados: cliente.produtosComprados,
        categoria: cliente.categoria
      }));
  }
};

/**
 * Utilitário para formatar moeda
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado em moeda brasileira
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

/**
 * Utilitário para formatar números
 * @param {number} value - Valor a ser formatado
 * @returns {string} Número formatado
 */
export const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};

/**
 * Utilitário para formatar data
 * @param {Date} date - Data a ser formatada
 * @returns {string} Data formatada
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

/**
 * Utilitário para calcular dias desde a última compra
 * @param {Date} ultimaCompra - Data da última compra
 * @returns {number} Número de dias
 */
export const diasDesdeUltimaCompra = (ultimaCompra) => {
  if (!ultimaCompra) return null;
  const hoje = new Date();
  const diffTime = Math.abs(hoje - ultimaCompra);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default {
  processTopClientes,
  calcularEstatisticasTopClientes,
  formatarDadosParaGrafico,
  formatCurrency,
  formatNumber,
  formatDate,
  diasDesdeUltimaCompra
};
