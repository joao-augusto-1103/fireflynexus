import { format, eachDayOfInterval, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Processa dados de ticket médio ao longo do tempo
 * @param {Array} ordensVenda - Array de ordens de venda
 * @param {Object} dateRange - Período de análise {from, to}
 * @returns {Array} Dados processados por dia
 */
export const processTicketMedio = (ordensVenda, dateRange) => {
  console.log('[TICKET MÉDIO] Iniciando processamento...');
  console.log('[TICKET MÉDIO] Ordens recebidas:', ordensVenda?.length || 0);
  console.log('[TICKET MÉDIO] Período:', { from: dateRange.from, to: dateRange.to });

  if (!ordensVenda || ordensVenda.length === 0) {
    console.log('[TICKET MÉDIO] Nenhuma ordem de venda encontrada');
    return [];
  }

  // Gerar todos os dias do período
  const days = eachDayOfInterval({
    start: dateRange.from,
    end: dateRange.to
  });

  console.log('[TICKET MÉDIO] Dias no período:', days.length);

  const ticketPorDia = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    // Filtrar vendas do dia - verificar múltiplos campos de data
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

    // Calcular valores do dia
    const totalVendas = vendasDoDia.reduce((sum, ov) => {
      const valor = parseFloat(ov.total || ov.valorTotal || ov.valor || ov.subtotal || 0);
      return sum + valor;
    }, 0);

    const quantidadeVendas = vendasDoDia.length;
    const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;

    // Calcular produtos vendidos
    const produtosVendidos = vendasDoDia.reduce((sum, ov) => {
      if (ov.itens && Array.isArray(ov.itens)) {
        return sum + ov.itens.reduce((itemSum, item) => itemSum + (parseInt(item.quantidade) || 0), 0);
      }
      return sum;
    }, 0);

    return {
      data: format(day, 'dd/MM', { locale: ptBR }),
      dataCompleta: format(day, 'dd/MM/yyyy', { locale: ptBR }),
      ticketMedio: ticketMedio,
      totalVendas: totalVendas,
      quantidadeVendas: quantidadeVendas,
      produtosVendidos: produtosVendidos,
      vendasDetalhes: vendasDoDia.map(ov => ({
        numero: ov.numero,
        cliente: ov.cliente || ov.clienteNome || 'Cliente não informado',
        valor: parseFloat(ov.total || ov.valorTotal || ov.valor || ov.subtotal || 0)
      }))
    };
  });

  console.log('[TICKET MÉDIO] Dados processados:', ticketPorDia.length, 'dias');
  console.log('[TICKET MÉDIO] Exemplo de dados:', ticketPorDia.slice(0, 3));

  return ticketPorDia;
};

/**
 * Calcula estatísticas gerais do ticket médio
 * @param {Array} ticketMedioData - Dados processados do ticket médio
 * @returns {Object} Estatísticas calculadas
 */
export const calcularEstatisticasTicketMedio = (ticketMedioData) => {
  console.log('[TICKET MÉDIO] Calculando estatísticas...');

  if (!ticketMedioData || ticketMedioData.length === 0) {
    return {
      ticketMedioGeral: 0,
      totalVendas: 0,
      quantidadeTotalVendas: 0,
      maiorTicket: 0,
      menorTicket: 0,
      diasComVendas: 0,
      ticketMedioMedio: 0,
      crescimentoTicket: 0,
      melhorDia: null,
      piorDia: null,
      totalProdutosVendidos: 0,
      ticketMedioPorProduto: 0
    };
  }

  // Filtrar apenas dias com vendas
  const diasComVendas = ticketMedioData.filter(dia => dia.quantidadeVendas > 0);
  
  const totalVendas = ticketMedioData.reduce((sum, dia) => sum + dia.totalVendas, 0);
  const quantidadeTotalVendas = ticketMedioData.reduce((sum, dia) => sum + dia.quantidadeVendas, 0);
  const totalProdutosVendidos = ticketMedioData.reduce((sum, dia) => sum + dia.produtosVendidos, 0);

  // Ticket médio geral (total vendas / quantidade vendas)
  const ticketMedioGeral = quantidadeTotalVendas > 0 ? totalVendas / quantidadeTotalVendas : 0;

  // Ticket médio dos tickets médios diários
  const ticketMedioMedio = diasComVendas.length > 0 
    ? diasComVendas.reduce((sum, dia) => sum + dia.ticketMedio, 0) / diasComVendas.length 
    : 0;

  // Maior e menor ticket médio diário
  const ticketsDiarios = diasComVendas.map(dia => dia.ticketMedio).filter(ticket => ticket > 0);
  const maiorTicket = ticketsDiarios.length > 0 ? Math.max(...ticketsDiarios) : 0;
  const menorTicket = ticketsDiarios.length > 0 ? Math.min(...ticketsDiarios) : 0;

  // Melhor e pior dia
  const melhorDia = diasComVendas.reduce((melhor, dia) => 
    dia.ticketMedio > (melhor?.ticketMedio || 0) ? dia : melhor, null);
  
  const piorDia = diasComVendas.reduce((pior, dia) => 
    dia.ticketMedio < (pior?.ticketMedio || Infinity) && dia.ticketMedio > 0 ? dia : pior, null);

  // Calcular crescimento (comparar primeira e última semana)
  let crescimentoTicket = 0;
  if (diasComVendas.length >= 7) {
    const primeiraSemana = diasComVendas.slice(0, 7);
    const ultimaSemana = diasComVendas.slice(-7);
    
    const ticketPrimeiraSemana = primeiraSemana.reduce((sum, dia) => sum + dia.ticketMedio, 0) / primeiraSemana.length;
    const ticketUltimaSemana = ultimaSemana.reduce((sum, dia) => sum + dia.ticketMedio, 0) / ultimaSemana.length;
    
    if (ticketPrimeiraSemana > 0) {
      crescimentoTicket = ((ticketUltimaSemana - ticketPrimeiraSemana) / ticketPrimeiraSemana) * 100;
    }
  }

  // Ticket médio por produto
  const ticketMedioPorProduto = totalProdutosVendidos > 0 ? totalVendas / totalProdutosVendidos : 0;

  const estatisticas = {
    ticketMedioGeral,
    totalVendas,
    quantidadeTotalVendas,
    maiorTicket,
    menorTicket,
    diasComVendas: diasComVendas.length,
    ticketMedioMedio,
    crescimentoTicket,
    melhorDia,
    piorDia,
    totalProdutosVendidos,
    ticketMedioPorProduto
  };

  console.log('[TICKET MÉDIO] Estatísticas calculadas:', estatisticas);
  return estatisticas;
};

/**
 * Formata os dados para diferentes tipos de gráfico
 * @param {Array} data - Dados processados
 * @param {string} type - Tipo de gráfico (line, bar, area)
 * @returns {Array} Dados formatados para o gráfico
 */
export const formatarDadosParaGrafico = (data, type = 'line') => {
  if (!data || data.length === 0) return [];

  switch (type) {
    case 'line':
    case 'area':
      return data.map(item => ({
        name: item.data,
        value: item.ticketMedio,
        ticketMedio: item.ticketMedio,
        vendas: item.quantidadeVendas,
        total: item.totalVendas
      }));

    case 'bar':
      return data
        .filter(item => item.quantidadeVendas > 0)
        .map(item => ({
          name: item.data,
          value: item.ticketMedio,
          vendas: item.quantidadeVendas,
          total: item.totalVendas
        }));

    case 'composed':
      return data.map(item => ({
        name: item.data,
        ticketMedio: item.ticketMedio,
        vendas: item.quantidadeVendas,
        total: item.totalVendas
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
