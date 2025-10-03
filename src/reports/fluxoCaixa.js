import { format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Processa dados do fluxo de caixa integrando dados do caixa, financeiro e vendas
 * @param {Array} caixaData - Array de dados do caixa
 * @param {Array} financeiro - Array de movimentações financeiras
 * @param {Array} ordensVenda - Array de ordens de venda
 * @param {Object} dateRange - Período para análise
 * @returns {Array} Dados processados para o gráfico
 */
export const processFluxoCaixa = (caixaData, financeiro, ordensVenda, dateRange) => {
  console.log('=== PROCESSANDO FLUXO DE CAIXA COMPLETO ===');
  console.log('Dados do caixa:', caixaData?.length || 0);
  console.log('Movimentações financeiras:', financeiro?.length || 0);
  console.log('Ordens de venda:', ordensVenda?.length || 0);
  console.log('Período:', dateRange);
  
  if (!dateRange || !dateRange.from || !dateRange.to) {
    console.log('Período não definido');
    return [];
  }

  const days = eachDayOfInterval({
    start: dateRange.from,
    end: dateRange.to
  });

  let saldoAcumulado = 0;

  const fluxoPorDia = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const dataFormatada = format(day, 'yyyy-MM-dd');
    
    console.log(`Processando dia ${dataFormatada}`);
    
    // 1. ENTRADAS DO CAIXA (transações de entrada)
    let entradasCaixa = 0;
    if (caixaData && caixaData.length > 0) {
      caixaData.forEach(caixa => {
        if (caixa.transacoes && caixa.transacoes.length > 0) {
          caixa.transacoes.forEach(transacao => {
            const transacaoDate = new Date(transacao.data);
            if (transacaoDate >= dayStart && transacaoDate <= dayEnd && transacao.tipo === 'entrada') {
              entradasCaixa += parseFloat(transacao.valor) || 0;
            }
          });
        }
      });
    }
    
    // 2. SAÍDAS DO CAIXA (transações de saída)
    let saidasCaixa = 0;
    if (caixaData && caixaData.length > 0) {
      caixaData.forEach(caixa => {
        if (caixa.transacoes && caixa.transacoes.length > 0) {
          caixa.transacoes.forEach(transacao => {
            const transacaoDate = new Date(transacao.data);
            if (transacaoDate >= dayStart && transacaoDate <= dayEnd && transacao.tipo === 'saida') {
              saidasCaixa += parseFloat(transacao.valor) || 0;
            }
          });
        }
      });
    }
    
    // 3. VENDAS DIRETAS (OVs vinculadas ao caixa)
    let vendasDiretas = 0;
    if (ordensVenda && ordensVenda.length > 0) {
      ordensVenda.forEach(ov => {
        const ovDate = new Date(ov.createdAt || ov.data || ov.dataVenda);
        if (ovDate >= dayStart && ovDate <= dayEnd && ov.caixaId && (ov.status === 'concluido' || ov.status === 'concluída')) {
          vendasDiretas += parseFloat(ov.total || ov.valorTotal) || 0;
        }
      });
    }
    
    // 4. MOVIMENTAÇÕES FINANCEIRAS (módulo financeiro)
    let entradasFinanceiras = 0;
    let saidasFinanceiras = 0;
    if (financeiro && financeiro.length > 0) {
      financeiro.forEach(mov => {
        const movDate = new Date(mov.createdAt || mov.data);
        if (movDate >= dayStart && movDate <= dayEnd) {
          if (mov.tipo === 'entrada' || mov.tipo === 'receber' || mov.tipo === 'receita') {
            entradasFinanceiras += parseFloat(mov.valor) || 0;
          } else if (mov.tipo === 'saida' || mov.tipo === 'pagar' || mov.tipo === 'despesa') {
            saidasFinanceiras += parseFloat(mov.valor) || 0;
          }
        }
      });
    }
    
    // TOTAIS DO DIA
    const totalEntradas = entradasCaixa + vendasDiretas + entradasFinanceiras;
    const totalSaidas = saidasCaixa + saidasFinanceiras;
    const saldoDia = totalEntradas - totalSaidas;
    
    // Saldo acumulado
    saldoAcumulado += saldoDia;
    
    console.log(`Dia ${dataFormatada}:`, {
      entradasCaixa,
      saidasCaixa,
      vendasDiretas,
      entradasFinanceiras,
      saidasFinanceiras,
      totalEntradas,
      totalSaidas,
      saldoDia,
      saldoAcumulado
    });
    
    return {
      data: format(day, 'dd/MM', { locale: ptBR }),
      dataCompleta: format(day, 'dd/MM/yyyy', { locale: ptBR }),
      dataISO: dataFormatada,
      entradas: totalEntradas,
      saidas: totalSaidas,
      saldo: saldoDia,
      saldoAcumulado: saldoAcumulado,
      detalhes: {
        entradasCaixa,
        saidasCaixa,
        vendasDiretas,
        entradasFinanceiras,
        saidasFinanceiras
      }
    };
  });

  console.log('=== RESULTADO FLUXO DE CAIXA ===');
  console.log('Total de dias processados:', fluxoPorDia.length);
  console.log('Saldo final acumulado:', saldoAcumulado);
  console.log('Primeiros 3 dias:', fluxoPorDia.slice(0, 3));
  console.log('====================================');
  
  return fluxoPorDia;
};

/**
 * Calcula estatísticas resumidas do fluxo de caixa
 * @param {Array} fluxoCaixa - Dados processados do fluxo de caixa
 * @returns {Object} Estatísticas resumidas
 */
export const calcularEstatisticasFluxoCaixa = (fluxoCaixa) => {
  if (!fluxoCaixa || fluxoCaixa.length === 0) {
    return {
      totalEntradas: 0,
      totalSaidas: 0,
      saldoFinal: 0,
      melhorDia: null,
      piorDia: null,
      diasPositivos: 0,
      diasNegativos: 0,
      mediaEntradas: 0,
      mediaSaidas: 0,
      maiorEntrada: 0,
      maiorSaida: 0
    };
  }

  const totalEntradas = fluxoCaixa.reduce((sum, dia) => sum + dia.entradas, 0);
  const totalSaidas = fluxoCaixa.reduce((sum, dia) => sum + dia.saidas, 0);
  const saldoFinal = fluxoCaixa[fluxoCaixa.length - 1]?.saldoAcumulado || 0;
  
  const melhorDia = fluxoCaixa.reduce((melhor, dia) => 
    dia.saldo > (melhor?.saldo || -Infinity) ? dia : melhor, null);
  
  const piorDia = fluxoCaixa.reduce((pior, dia) => 
    dia.saldo < (pior?.saldo || Infinity) ? dia : pior, null);
  
  const diasPositivos = fluxoCaixa.filter(dia => dia.saldo > 0).length;
  const diasNegativos = fluxoCaixa.filter(dia => dia.saldo < 0).length;
  
  const mediaEntradas = totalEntradas / fluxoCaixa.length;
  const mediaSaidas = totalSaidas / fluxoCaixa.length;
  
  const maiorEntrada = Math.max(...fluxoCaixa.map(dia => dia.entradas));
  const maiorSaida = Math.max(...fluxoCaixa.map(dia => dia.saidas));

  return {
    totalEntradas,
    totalSaidas,
    saldoFinal,
    melhorDia,
    piorDia,
    diasPositivos,
    diasNegativos,
    mediaEntradas,
    mediaSaidas,
    maiorEntrada,
    maiorSaida
  };
};

/**
 * Formata dados para diferentes tipos de gráfico
 * @param {Array} fluxoCaixa - Dados processados do fluxo de caixa
 * @param {string} tipo - Tipo do gráfico ('composed', 'bar', 'line')
 * @returns {Array} Dados formatados para o gráfico
 */
export const formatarDadosParaGrafico = (fluxoCaixa, tipo = 'composed') => {
  if (!fluxoCaixa || fluxoCaixa.length === 0) {
    return [];
  }

  switch (tipo) {
    case 'bar':
      return fluxoCaixa.map(dia => ({
        data: dia.data,
        entradas: dia.entradas,
        saidas: dia.saidas
      }));
    
    case 'line':
      return fluxoCaixa.map(dia => ({
        data: dia.data,
        saldo: dia.saldo,
        saldoAcumulado: dia.saldoAcumulado
      }));
    
    case 'composed':
    default:
      return fluxoCaixa.map(dia => ({
        data: dia.data,
        dataCompleta: dia.dataCompleta,
        entradas: dia.entradas,
        saidas: dia.saidas,
        saldo: dia.saldo,
        saldoAcumulado: dia.saldoAcumulado
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

export default {
  processFluxoCaixa,
  calcularEstatisticasFluxoCaixa,
  formatarDadosParaGrafico,
  formatCurrency,
  formatNumber
};
