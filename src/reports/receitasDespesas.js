import { format, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Processa dados de receitas e despesas por período
 * @param {Array} financeiro - Dados financeiros (contas a receber e pagar)
 * @param {Object} dateRange - Período de análise
 * @returns {Array} Dados processados por mês
 */
export const processReceitasDespesas = (financeiro, dateRange) => {
  console.log('=== PROCESSANDO RECEITAS vs DESPESAS ===');
  console.log('Dados financeiros recebidos:', financeiro.length);
  console.log('Período:', dateRange);

  if (!financeiro || financeiro.length === 0) {
    console.log('Nenhum dado financeiro encontrado');
    return [];
  }

  // Gerar meses do período
  const meses = eachMonthOfInterval({
    start: startOfMonth(dateRange.from),
    end: endOfMonth(dateRange.to)
  });

  console.log('Meses a processar:', meses.length);

  const dadosPorMes = meses.map(mes => {
    const nomeDoMes = format(mes, 'MMM/yyyy', { locale: ptBR });
    const mesCompleto = format(mes, 'MMMM yyyy', { locale: ptBR });

    console.log(`Processando mês: ${nomeDoMes}`);

    let receitas = 0;
    let despesas = 0;
    let receitasPendentes = 0;
    let despesasPendentes = 0;
    let receitasConcluidas = 0;
    let despesasConcluidas = 0;
    let contadorReceitas = 0;
    let contadorDespesas = 0;

    // Filtrar movimentações do mês
    const movimentacoesMes = financeiro.filter(mov => {
      // Verificar múltiplos campos de data
      const dataMovimentacao = mov.dataVencimento || mov.data || mov.createdAt || mov.dataLancamento;
      
      if (!dataMovimentacao) {
        console.log('Movimentação sem data:', mov);
        return false;
      }

      const dataMov = new Date(dataMovimentacao);
      return isSameMonth(dataMov, mes);
    });

    console.log(`Movimentações em ${nomeDoMes}:`, movimentacoesMes.length);

    movimentacoesMes.forEach(mov => {
      const valor = parseFloat(mov.valor || 0);
      const tipo = (mov.tipo || '').toLowerCase();
      const status = (mov.status || '').toLowerCase();

      console.log(`Processando: ${mov.descricao || 'Sem descrição'} - Tipo: ${tipo} - Valor: ${valor} - Status: ${status}`);

      // Classificar como receita ou despesa
      const isReceita = tipo === 'receita' || 
                       tipo === 'entrada' || 
                       tipo === 'recebimento' ||
                       mov.descricao?.toLowerCase().includes('recebimento') ||
                       mov.descricao?.toLowerCase().includes('venda') ||
                       mov.descricao?.toLowerCase().includes('ov');

      const isDespesa = tipo === 'despesa' || 
                       tipo === 'saida' || 
                       tipo === 'pagamento' ||
                       tipo === 'gasto' ||
                       (!isReceita && valor > 0); // Se não é receita e tem valor, considera despesa

      if (isReceita && valor > 0) {
        receitas += valor;
        contadorReceitas++;

        if (status === 'concluído' || status === 'concluida' || status === 'pago') {
          receitasConcluidas += valor;
        } else {
          receitasPendentes += valor;
        }

        console.log(`  ✅ Receita: R$ ${valor.toFixed(2)}`);
      } else if (isDespesa && valor > 0) {
        despesas += valor;
        contadorDespesas++;

        if (status === 'concluído' || status === 'concluida' || status === 'pago') {
          despesasConcluidas += valor;
        } else {
          despesasPendentes += valor;
        }

        console.log(`  ❌ Despesa: R$ ${valor.toFixed(2)}`);
      }
    });

    const saldoLiquido = receitas - despesas;
    const margemLiquida = receitas > 0 ? ((saldoLiquido / receitas) * 100) : 0;

    const resultado = {
      mes: nomeDoMes,
      mesCompleto,
      receitas,
      despesas,
      saldoLiquido,
      margemLiquida,
      receitasPendentes,
      despesasPendentes,
      receitasConcluidas,
      despesasConcluidas,
      contadorReceitas,
      contadorDespesas,
      totalMovimentacoes: contadorReceitas + contadorDespesas
    };

    console.log(`Resultado ${nomeDoMes}:`, resultado);
    return resultado;
  });

  console.log('=== RESUMO RECEITAS vs DESPESAS ===');
  const totalReceitas = dadosPorMes.reduce((sum, mes) => sum + mes.receitas, 0);
  const totalDespesas = dadosPorMes.reduce((sum, mes) => sum + mes.despesas, 0);
  console.log(`Total Receitas: R$ ${totalReceitas.toFixed(2)}`);
  console.log(`Total Despesas: R$ ${totalDespesas.toFixed(2)}`);
  console.log(`Saldo Líquido: R$ ${(totalReceitas - totalDespesas).toFixed(2)}`);
  console.log('==========================================');

  return dadosPorMes;
};

/**
 * Calcula estatísticas gerais de receitas e despesas
 * @param {Array} receitasDespesas - Dados processados
 * @returns {Object} Estatísticas calculadas
 */
export const calcularEstatisticasReceitasDespesas = (receitasDespesas) => {
  if (!receitasDespesas || receitasDespesas.length === 0) {
    return {
      totalReceitas: 0,
      totalDespesas: 0,
      saldoLiquido: 0,
      margemLiquidaMedia: 0,
      melhorMes: null,
      piorMes: null,
      mesesPositivos: 0,
      mesesNegativos: 0,
      receitaMedia: 0,
      despesaMedia: 0,
      crescimentoReceitas: 0,
      crescimentoDespesas: 0
    };
  }

  const totalReceitas = receitasDespesas.reduce((sum, mes) => sum + mes.receitas, 0);
  const totalDespesas = receitasDespesas.reduce((sum, mes) => sum + mes.despesas, 0);
  const saldoLiquido = totalReceitas - totalDespesas;
  
  const receitaMedia = totalReceitas / receitasDespesas.length;
  const despesaMedia = totalDespesas / receitasDespesas.length;
  
  const margemLiquidaMedia = totalReceitas > 0 ? ((saldoLiquido / totalReceitas) * 100) : 0;

  // Encontrar melhor e pior mês
  const melhorMes = receitasDespesas.reduce((melhor, atual) => 
    atual.saldoLiquido > melhor.saldoLiquido ? atual : melhor
  );

  const piorMes = receitasDespesas.reduce((pior, atual) => 
    atual.saldoLiquido < pior.saldoLiquido ? atual : pior
  );

  // Contar meses positivos e negativos
  const mesesPositivos = receitasDespesas.filter(mes => mes.saldoLiquido > 0).length;
  const mesesNegativos = receitasDespesas.filter(mes => mes.saldoLiquido < 0).length;

  // Calcular crescimento (primeiro vs último mês)
  const primeiroMes = receitasDespesas[0];
  const ultimoMes = receitasDespesas[receitasDespesas.length - 1];
  
  const crescimentoReceitas = primeiroMes.receitas > 0 
    ? (((ultimoMes.receitas - primeiroMes.receitas) / primeiroMes.receitas) * 100) 
    : 0;

  const crescimentoDespesas = primeiroMes.despesas > 0 
    ? (((ultimoMes.despesas - primeiroMes.despesas) / primeiroMes.despesas) * 100) 
    : 0;

  return {
    totalReceitas,
    totalDespesas,
    saldoLiquido,
    margemLiquidaMedia,
    melhorMes,
    piorMes,
    mesesPositivos,
    mesesNegativos,
    receitaMedia,
    despesaMedia,
    crescimentoReceitas,
    crescimentoDespesas
  };
};

/**
 * Formata dados para diferentes tipos de gráficos
 * @param {Array} data - Dados processados
 * @param {string} type - Tipo do gráfico
 * @returns {Array} Dados formatados
 */
export const formatarDadosParaGrafico = (data, type) => {
  if (!data || data.length === 0) return [];

  switch (type) {
    case 'bar':
    case 'composed':
      return data.map(item => ({
        mes: item.mes,
        receitas: item.receitas,
        despesas: item.despesas,
        saldo: item.saldoLiquido
      }));

    case 'area':
      return data.map(item => ({
        mes: item.mes,
        receitas: item.receitas,
        despesas: item.despesas
      }));

    case 'pie-receitas':
      const totalReceitas = data.reduce((sum, item) => sum + item.receitas, 0);
      return data
        .filter(item => item.receitas > 0)
        .map(item => ({
          name: item.mes,
          value: item.receitas,
          percentage: ((item.receitas / totalReceitas) * 100).toFixed(1)
        }));

    case 'pie-despesas':
      const totalDespesas = data.reduce((sum, item) => sum + item.despesas, 0);
      return data
        .filter(item => item.despesas > 0)
        .map(item => ({
          name: item.mes,
          value: item.despesas,
          percentage: ((item.despesas / totalDespesas) * 100).toFixed(1)
        }));

    case 'line':
      return data.map(item => ({
        mes: item.mes,
        saldoLiquido: item.saldoLiquido,
        margemLiquida: item.margemLiquida
      }));

    default:
      return data;
  }
};

/**
 * Calcula indicadores de performance financeira
 * @param {Object} estatisticas - Estatísticas calculadas
 * @returns {Object} Indicadores de performance
 */
export const calcularIndicadoresPerformance = (estatisticas) => {
  const { totalReceitas, totalDespesas, saldoLiquido, margemLiquidaMedia } = estatisticas;

  let performance = 'Neutro';
  let cor = '#6B7280';

  if (saldoLiquido > 0) {
    if (margemLiquidaMedia >= 20) {
      performance = 'Excelente';
      cor = '#10B981';
    } else if (margemLiquidaMedia >= 10) {
      performance = 'Bom';
      cor = '#3B82F6';
    } else {
      performance = 'Regular';
      cor = '#F59E0B';
    }
  } else {
    performance = 'Crítico';
    cor = '#EF4444';
  }

  // Calcular eficiência financeira
  const eficienciaFinanceira = totalReceitas > 0 
    ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 
    : 0;

  return {
    performance,
    cor,
    eficienciaFinanceira: Math.max(0, eficienciaFinanceira),
    indicadorSaude: saldoLiquido >= 0 ? 'Saudável' : 'Atenção'
  };
};

/**
 * Calcula tendências e alertas financeiros
 * @param {Array} receitasDespesas - Dados processados por mês
 * @returns {Object} Tendências e alertas
 */
export const calcularTendenciasEAlertas = (receitasDespesas) => {
  if (!receitasDespesas || receitasDespesas.length < 2) {
    return {
      tendenciaReceitas: 'Estável',
      tendenciaDespesas: 'Estável',
      tendenciaSaldo: 'Estável',
      situacaoFinanceira: 'Regular',
      alertas: [],
      projecaoProximoMes: null
    };
  }

  // Calcular tendências
  const ultimosMeses = receitasDespesas.slice(-3); // Últimos 3 meses
  const penultimosMeses = receitasDespesas.slice(-6, -3); // 3 meses anteriores

  const mediaReceitasRecente = ultimosMeses.reduce((sum, mes) => sum + mes.receitas, 0) / ultimosMeses.length;
  const mediaReceitasAnterior = penultimosMeses.length > 0 
    ? penultimosMeses.reduce((sum, mes) => sum + mes.receitas, 0) / penultimosMeses.length 
    : mediaReceitasRecente;

  const mediaDespesasRecente = ultimosMeses.reduce((sum, mes) => sum + mes.despesas, 0) / ultimosMeses.length;
  const mediaDespesasAnterior = penultimosMeses.length > 0 
    ? penultimosMeses.reduce((sum, mes) => sum + mes.despesas, 0) / penultimosMeses.length 
    : mediaDespesasRecente;

  const mediaSaldoRecente = ultimosMeses.reduce((sum, mes) => sum + mes.saldoLiquido, 0) / ultimosMeses.length;
  const mediaSaldoAnterior = penultimosMeses.length > 0 
    ? penultimosMeses.reduce((sum, mes) => sum + mes.saldoLiquido, 0) / penultimosMeses.length 
    : mediaSaldoRecente;

  // Determinar tendências
  const tendenciaReceitas = mediaReceitasRecente > mediaReceitasAnterior * 1.05 ? 'Crescente' :
                           mediaReceitasRecente < mediaReceitasAnterior * 0.95 ? 'Decrescente' : 'Estável';

  const tendenciaDespesas = mediaDespesasRecente > mediaDespesasAnterior * 1.05 ? 'Crescente' :
                           mediaDespesasRecente < mediaDespesasAnterior * 0.95 ? 'Decrescente' : 'Estável';

  const tendenciaSaldo = mediaSaldoRecente > mediaSaldoAnterior * 1.1 ? 'Melhorando' :
                        mediaSaldoRecente < mediaSaldoAnterior * 0.9 ? 'Piorando' : 'Estável';

  // Determinar situação financeira geral
  let situacaoFinanceira = 'Regular';
  if (tendenciaReceitas === 'Crescente' && tendenciaDespesas !== 'Crescente' && mediaSaldoRecente > 0) {
    situacaoFinanceira = 'Excelente';
  } else if (mediaSaldoRecente > 0 && tendenciaSaldo !== 'Piorando') {
    situacaoFinanceira = 'Boa';
  } else if (mediaSaldoRecente < 0 || tendenciaSaldo === 'Piorando') {
    situacaoFinanceira = 'Crítica';
  }

  // Gerar alertas
  const alertas = [];
  
  if (tendenciaDespesas === 'Crescente' && tendenciaReceitas !== 'Crescente') {
    alertas.push({
      titulo: 'Despesas Crescendo Rapidamente',
      descricao: 'As despesas estão aumentando mais rápido que as receitas. Considere revisar os gastos.',
      cor: '#EF4444',
      prioridade: 'alta'
    });
  }

  if (mediaSaldoRecente < 0) {
    alertas.push({
      titulo: 'Saldo Negativo',
      descricao: 'O saldo líquido médio dos últimos meses está negativo. Ação imediata necessária.',
      cor: '#DC2626',
      prioridade: 'crítica'
    });
  }

  if (tendenciaReceitas === 'Decrescente') {
    alertas.push({
      titulo: 'Queda nas Receitas',
      descricao: 'As receitas estão em tendência de queda. Considere estratégias para aumentar vendas.',
      cor: '#F59E0B',
      prioridade: 'média'
    });
  }

  const ultimoMes = ultimosMeses[ultimosMeses.length - 1];
  if (ultimoMes && ultimoMes.margemLiquida < 5) {
    alertas.push({
      titulo: 'Margem Líquida Baixa',
      descricao: `Margem líquida de ${ultimoMes.margemLiquida.toFixed(1)}% está abaixo do recomendado (>10%).`,
      cor: '#F59E0B',
      prioridade: 'média'
    });
  }

  // Projeção para o próximo mês
  let projecaoProximoMes = null;
  if (ultimosMeses.length >= 3) {
    const projecaoReceitas = mediaReceitasRecente * (tendenciaReceitas === 'Crescente' ? 1.1 : 
                                                   tendenciaReceitas === 'Decrescente' ? 0.9 : 1.0);
    const projecaoDespesas = mediaDespesasRecente * (tendenciaDespesas === 'Crescente' ? 1.1 : 
                                                   tendenciaDespesas === 'Decrescente' ? 0.9 : 1.0);
    
    projecaoProximoMes = {
      receitas: projecaoReceitas,
      despesas: projecaoDespesas,
      saldoLiquido: projecaoReceitas - projecaoDespesas,
      confianca: ultimosMeses.length >= 6 ? 'Alta' : ultimosMeses.length >= 3 ? 'Média' : 'Baixa'
    };
  }

  return {
    tendenciaReceitas,
    tendenciaDespesas,
    tendenciaSaldo,
    situacaoFinanceira,
    alertas,
    projecaoProximoMes
  };
};

/**
 * Analisa categorias de receitas e despesas
 * @param {Array} financeiro - Dados financeiros
 * @param {Object} dateRange - Período de análise
 * @returns {Object} Análise por categorias
 */
export const analisarCategorias = (financeiro, dateRange) => {
  if (!financeiro || financeiro.length === 0) {
    return { receitas: [], despesas: [] };
  }

  const categorias = {
    receitas: {},
    despesas: {}
  };

  financeiro.forEach(mov => {
    const dataMovimentacao = mov.dataVencimento || mov.data || mov.createdAt || mov.dataLancamento;
    if (!dataMovimentacao) return;

    const dataMov = new Date(dataMovimentacao);
    if (dataMov < dateRange.from || dataMov > dateRange.to) return;

    const valor = parseFloat(mov.valor || 0);
    const tipo = (mov.tipo || '').toLowerCase();
    const categoria = mov.categoria || mov.descricao || 'Outros';

    const isReceita = tipo === 'receita' || 
                     tipo === 'entrada' || 
                     tipo === 'recebimento' ||
                     mov.descricao?.toLowerCase().includes('recebimento') ||
                     mov.descricao?.toLowerCase().includes('venda') ||
                     mov.descricao?.toLowerCase().includes('ov');

    if (isReceita && valor > 0) {
      if (!categorias.receitas[categoria]) {
        categorias.receitas[categoria] = { valor: 0, quantidade: 0 };
      }
      categorias.receitas[categoria].valor += valor;
      categorias.receitas[categoria].quantidade += 1;
    } else if (valor > 0) {
      if (!categorias.despesas[categoria]) {
        categorias.despesas[categoria] = { valor: 0, quantidade: 0 };
      }
      categorias.despesas[categoria].valor += valor;
      categorias.despesas[categoria].quantidade += 1;
    }
  });

  // Converter para arrays ordenados
  const receitasArray = Object.entries(categorias.receitas)
    .map(([nome, dados]) => ({ nome, ...dados }))
    .sort((a, b) => b.valor - a.valor);

  const despesasArray = Object.entries(categorias.despesas)
    .map(([nome, dados]) => ({ nome, ...dados }))
    .sort((a, b) => b.valor - a.valor);

  return {
    receitas: receitasArray,
    despesas: despesasArray
  };
};

/**
 * Compara com período anterior
 * @param {Array} receitasDespesasAtual - Dados do período atual
 * @param {Array} financeiro - Todos os dados financeiros
 * @param {Object} dateRange - Período atual
 * @returns {Object} Comparação com período anterior
 */
export const compararComPeriodoAnterior = (receitasDespesasAtual, financeiro, dateRange) => {
  // Calcular período anterior (mesmo tamanho)
  const diasPeriodo = Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24));
  const dataInicioAnterior = new Date(dateRange.from);
  dataInicioAnterior.setDate(dataInicioAnterior.getDate() - diasPeriodo);
  const dataFimAnterior = new Date(dateRange.from);
  dataFimAnterior.setDate(dataFimAnterior.getDate() - 1);

  const dateRangeAnterior = {
    from: dataInicioAnterior,
    to: dataFimAnterior
  };

  const receitasDespesasAnterior = processReceitasDespesas(financeiro, dateRangeAnterior);
  const estatisticasAnterior = calcularEstatisticasReceitasDespesas(receitasDespesasAnterior);
  const estatisticasAtual = calcularEstatisticasReceitasDespesas(receitasDespesasAtual);

  // Calcular variações percentuais
  const variacaoReceitas = estatisticasAnterior.totalReceitas > 0 
    ? (((estatisticasAtual.totalReceitas - estatisticasAnterior.totalReceitas) / estatisticasAnterior.totalReceitas) * 100)
    : 0;

  const variacaoDespesas = estatisticasAnterior.totalDespesas > 0 
    ? (((estatisticasAtual.totalDespesas - estatisticasAnterior.totalDespesas) / estatisticasAnterior.totalDespesas) * 100)
    : 0;

  const variacaoSaldo = estatisticasAnterior.saldoLiquido !== 0 
    ? (((estatisticasAtual.saldoLiquido - estatisticasAnterior.saldoLiquido) / Math.abs(estatisticasAnterior.saldoLiquido)) * 100)
    : 0;

  return {
    periodoAnterior: {
      inicio: format(dataInicioAnterior, 'dd/MM/yyyy'),
      fim: format(dataFimAnterior, 'dd/MM/yyyy'),
      estatisticas: estatisticasAnterior
    },
    variacoes: {
      receitas: variacaoReceitas,
      despesas: variacaoDespesas,
      saldo: variacaoSaldo
    }
  };
};
