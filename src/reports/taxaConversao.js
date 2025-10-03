import { format, eachDayOfInterval, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Processa dados de taxa de conversão ao longo do tempo
 * @param {Array} ordensVenda - Array de ordens de venda
 * @param {Array} ordensServico - Array de ordens de serviço (OS)
 * @param {Object} dateRange - Período de análise {from, to}
 * @returns {Array} Dados processados por dia
 */
export const processTaxaConversao = (ordensVenda, ordensServico = [], dateRange) => {
  console.log('[TAXA CONVERSÃO] Iniciando processamento...');
  console.log('[TAXA CONVERSÃO] Ordens de Venda:', ordensVenda?.length || 0);
  console.log('[TAXA CONVERSÃO] Ordens de Serviço:', ordensServico?.length || 0);
  console.log('[TAXA CONVERSÃO] Período:', { from: dateRange.from, to: dateRange.to });

  if (!ordensVenda || ordensVenda.length === 0) {
    console.log('[TAXA CONVERSÃO] Nenhuma ordem encontrada');
    return [];
  }

  // Gerar todos os dias do período
  const days = eachDayOfInterval({
    start: dateRange.from,
    end: dateRange.to
  });

  console.log('[TAXA CONVERSÃO] Dias no período:', days.length);

  const conversaoPorDia = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    // Filtrar ordens de venda do dia (vendas concluídas)
    const vendasDoDia = ordensVenda.filter(ov => {
      if (!ov) return false;

      // Verificar se a venda está concluída
      const statusConcluido = ov.status && (
        ov.status.toLowerCase() === 'concluido' || 
        ov.status.toLowerCase() === 'concluída' || 
        ov.status.toLowerCase() === 'finalizada'
      );

      if (!statusConcluido) return false;

      // Tentar diferentes campos de data
      let vendaDate = null;
      if (ov.createdAt) {
        vendaDate = new Date(ov.createdAt);
      } else if (ov.dataVenda) {
        vendaDate = new Date(ov.dataVenda);
      } else if (ov.data) {
        vendaDate = new Date(ov.data);
      } else if (ov.timestamp) {
        vendaDate = new Date(ov.timestamp);
      }

      if (!vendaDate || isNaN(vendaDate.getTime())) return false;

      return vendaDate >= dayStart && vendaDate <= dayEnd;
    });

    // Filtrar ordens de serviço do dia (todas as OS - representam oportunidades)
    const osDoDia = ordensServico.filter(os => {
      if (!os) return false;

      // Tentar diferentes campos de data
      let osDate = null;
      if (os.createdAt) {
        osDate = new Date(os.createdAt);
      } else if (os.dataAbertura) {
        osDate = new Date(os.dataAbertura);
      } else if (os.data) {
        osDate = new Date(os.data);
      } else if (os.timestamp) {
        osDate = new Date(os.timestamp);
      }

      if (!osDate || isNaN(osDate.getTime())) return false;

      return osDate >= dayStart && osDate <= dayEnd;
    });

    // Filtrar todas as ordens do dia (OV + OS) para representar oportunidades totais
    const todasOrdensVenda = ordensVenda.filter(ov => {
      if (!ov) return false;

      // Tentar diferentes campos de data
      let vendaDate = null;
      if (ov.createdAt) {
        vendaDate = new Date(ov.createdAt);
      } else if (ov.dataVenda) {
        vendaDate = new Date(ov.dataVenda);
      } else if (ov.data) {
        vendaDate = new Date(ov.data);
      } else if (ov.timestamp) {
        vendaDate = new Date(ov.timestamp);
      }

      if (!vendaDate || isNaN(vendaDate.getTime())) return false;

      return vendaDate >= dayStart && vendaDate <= dayEnd;
    });

    // Calcular métricas
    const vendasConcluidas = vendasDoDia.length;
    const oportunidadesOS = osDoDia.length;
    const oportunidadesTotais = todasOrdensVenda.length; // Todas as OV (abertas + concluídas)
    
    // Total de oportunidades = OS + todas as OV
    const totalOportunidades = oportunidadesOS + oportunidadesTotais;
    
    // Taxa de conversão = vendas concluídas / total de oportunidades
    const taxaConversao = totalOportunidades > 0 ? (vendasConcluidas / totalOportunidades) * 100 : 0;

    // Valor total das vendas concluídas
    const valorVendas = vendasDoDia.reduce((sum, ov) => {
      const valor = parseFloat(ov.total || ov.valorTotal || ov.valor || ov.subtotal || 0);
      return sum + valor;
    }, 0);

    // Valor médio por oportunidade
    const valorMedioPorOportunidade = totalOportunidades > 0 ? valorVendas / totalOportunidades : 0;

    return {
      data: format(day, 'dd/MM', { locale: ptBR }),
      dataCompleta: format(day, 'dd/MM/yyyy', { locale: ptBR }),
      taxaConversao: taxaConversao,
      vendasConcluidas: vendasConcluidas,
      oportunidadesOS: oportunidadesOS,
      oportunidadesTotais: oportunidadesTotais,
      totalOportunidades: totalOportunidades,
      valorVendas: valorVendas,
      valorMedioPorOportunidade: valorMedioPorOportunidade,
      // Detalhes para análise
      vendasDetalhes: vendasDoDia.map(ov => ({
        numero: ov.numero,
        cliente: ov.cliente || ov.clienteNome || 'Cliente não informado',
        valor: parseFloat(ov.total || ov.valorTotal || ov.valor || ov.subtotal || 0),
        status: ov.status
      })),
      osDetalhes: osDoDia.map(os => ({
        numero: os.numero,
        cliente: os.cliente || os.clienteNome || 'Cliente não informado',
        status: os.status
      }))
    };
  });

  console.log('[TAXA CONVERSÃO] Dados processados:', conversaoPorDia.length, 'dias');
  console.log('[TAXA CONVERSÃO] Exemplo de dados:', conversaoPorDia.slice(0, 3));

  return conversaoPorDia;
};

/**
 * Calcula estatísticas gerais da taxa de conversão
 * @param {Array} taxaConversaoData - Dados processados da taxa de conversão
 * @returns {Object} Estatísticas calculadas
 */
export const calcularEstatisticasTaxaConversao = (taxaConversaoData) => {
  console.log('[TAXA CONVERSÃO] Calculando estatísticas...');

  if (!taxaConversaoData || taxaConversaoData.length === 0) {
    return {
      taxaConversaoMedia: 0,
      totalVendasConcluidas: 0,
      totalOportunidades: 0,
      maiorTaxaConversao: 0,
      menorTaxaConversao: 0,
      diasComOportunidades: 0,
      valorTotalVendas: 0,
      valorMedioPorVenda: 0,
      eficienciaConversao: 'Baixa',
      melhorDia: null,
      piorDia: null,
      tendenciaConversao: 0,
      totalOS: 0,
      totalOV: 0
    };
  }

  // Filtrar apenas dias com oportunidades
  const diasComOportunidades = taxaConversaoData.filter(dia => dia.totalOportunidades > 0);
  
  const totalVendasConcluidas = taxaConversaoData.reduce((sum, dia) => sum + dia.vendasConcluidas, 0);
  const totalOportunidades = taxaConversaoData.reduce((sum, dia) => sum + dia.totalOportunidades, 0);
  const valorTotalVendas = taxaConversaoData.reduce((sum, dia) => sum + dia.valorVendas, 0);
  const totalOS = taxaConversaoData.reduce((sum, dia) => sum + dia.oportunidadesOS, 0);
  const totalOV = taxaConversaoData.reduce((sum, dia) => sum + dia.oportunidadesTotais, 0);

  // Taxa de conversão geral
  const taxaConversaoMedia = totalOportunidades > 0 ? (totalVendasConcluidas / totalOportunidades) * 100 : 0;

  // Valor médio por venda
  const valorMedioPorVenda = totalVendasConcluidas > 0 ? valorTotalVendas / totalVendasConcluidas : 0;

  // Maior e menor taxa de conversão diária
  const taxasDiarias = diasComOportunidades.map(dia => dia.taxaConversao).filter(taxa => taxa > 0);
  const maiorTaxaConversao = taxasDiarias.length > 0 ? Math.max(...taxasDiarias) : 0;
  const menorTaxaConversao = taxasDiarias.length > 0 ? Math.min(...taxasDiarias) : 0;

  // Melhor e pior dia
  const melhorDia = diasComOportunidades.reduce((melhor, dia) => 
    dia.taxaConversao > (melhor?.taxaConversao || 0) ? dia : melhor, null);
  
  const piorDia = diasComOportunidades.reduce((pior, dia) => 
    dia.taxaConversao < (pior?.taxaConversao || Infinity) && dia.taxaConversao > 0 ? dia : pior, null);

  // Calcular tendência (comparar primeira e última semana)
  let tendenciaConversao = 0;
  if (diasComOportunidades.length >= 7) {
    const primeiraSemana = diasComOportunidades.slice(0, 7);
    const ultimaSemana = diasComOportunidades.slice(-7);
    
    const taxaPrimeiraSemana = primeiraSemana.reduce((sum, dia) => sum + dia.taxaConversao, 0) / primeiraSemana.length;
    const taxaUltimaSemana = ultimaSemana.reduce((sum, dia) => sum + dia.taxaConversao, 0) / ultimaSemana.length;
    
    if (taxaPrimeiraSemana > 0) {
      tendenciaConversao = ((taxaUltimaSemana - taxaPrimeiraSemana) / taxaPrimeiraSemana) * 100;
    }
  }

  // Classificar eficiência da conversão
  let eficienciaConversao = 'Baixa';
  if (taxaConversaoMedia >= 80) {
    eficienciaConversao = 'Excelente';
  } else if (taxaConversaoMedia >= 60) {
    eficienciaConversao = 'Boa';
  } else if (taxaConversaoMedia >= 40) {
    eficienciaConversao = 'Regular';
  } else if (taxaConversaoMedia >= 20) {
    eficienciaConversao = 'Baixa';
  } else {
    eficienciaConversao = 'Muito Baixa';
  }

  const estatisticas = {
    taxaConversaoMedia,
    totalVendasConcluidas,
    totalOportunidades,
    maiorTaxaConversao,
    menorTaxaConversao,
    diasComOportunidades: diasComOportunidades.length,
    valorTotalVendas,
    valorMedioPorVenda,
    eficienciaConversao,
    melhorDia,
    piorDia,
    tendenciaConversao,
    totalOS,
    totalOV
  };

  console.log('[TAXA CONVERSÃO] Estatísticas calculadas:', estatisticas);
  return estatisticas;
};

/**
 * Formata os dados para diferentes tipos de gráfico
 * @param {Array} data - Dados processados
 * @param {string} type - Tipo de gráfico (line, bar, area)
 * @returns {Array} Dados formatados para o gráfico
 */
export const formatarDadosParaGrafico = (data, type = 'area') => {
  if (!data || data.length === 0) return [];

  switch (type) {
    case 'line':
    case 'area':
      return data.map(item => ({
        name: item.data,
        value: item.taxaConversao,
        taxaConversao: item.taxaConversao,
        vendas: item.vendasConcluidas,
        oportunidades: item.totalOportunidades
      }));

    case 'bar':
      return data
        .filter(item => item.totalOportunidades > 0)
        .map(item => ({
          name: item.data,
          value: item.taxaConversao,
          vendas: item.vendasConcluidas,
          oportunidades: item.totalOportunidades
        }));

    case 'composed':
      return data.map(item => ({
        name: item.data,
        taxaConversao: item.taxaConversao,
        vendas: item.vendasConcluidas,
        oportunidades: item.totalOportunidades,
        valor: item.valorVendas
      }));

    default:
      return data;
  }
};

/**
 * Formata valor como moeda
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

/**
 * Formata número
 * @param {number} value - Número a ser formatado
 * @returns {string} Número formatado
 */
export const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};

/**
 * Formata percentual
 * @param {number} value - Valor percentual
 * @returns {string} Percentual formatado
 */
export const formatPercent = (value) => {
  return `${(value || 0).toFixed(1)}%`;
};
