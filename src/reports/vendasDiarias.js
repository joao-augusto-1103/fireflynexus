import { format, startOfDay, endOfDay, eachDayOfInterval, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Processa dados de vendas diárias para o relatório gráfico
 * @param {Array} ordensVenda - Array de ordens de venda
 * @param {Object} dateRange - Objeto com from e to (datas)
 * @returns {Array} Dados processados para o gráfico
 */
export const processVendasDiarias = (ordensVenda, dateRange) => {
  console.log('=== PROCESSANDO VENDAS DIÁRIAS ===');
  console.log('Ordens de venda recebidas:', ordensVenda?.length || 0);
  console.log('Período:', dateRange);
  
  // Debug: mostrar estrutura das primeiras OVs
  if (ordensVenda && ordensVenda.length > 0) {
    console.log('Estrutura da primeira OV:', ordensVenda[0]);
    console.log('Campos disponíveis:', Object.keys(ordensVenda[0]));
  }
  
  if (!ordensVenda || ordensVenda.length === 0) {
    console.log('Nenhuma ordem de venda encontrada');
    return [];
  }

  if (!dateRange || !dateRange.from || !dateRange.to) {
    console.log('Período inválido');
    return [];
  }

  // Gerar todos os dias do período
  const days = eachDayOfInterval({
    start: dateRange.from,
    end: dateRange.to
  });

  console.log('Dias no período:', days.length);

  // Processar cada dia
  const vendasPorDia = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    // Filtrar vendas do dia
    const vendasDoDia = ordensVenda.filter(ov => {
      try {
        // Tentar diferentes formatos de data
        let vendaDate;
        let campoDataUsado = '';
        
        if (ov.createdAt) {
          vendaDate = typeof ov.createdAt === 'string' ? parseISO(ov.createdAt) : new Date(ov.createdAt);
          campoDataUsado = 'createdAt';
        } else if (ov.dataVenda) {
          vendaDate = typeof ov.dataVenda === 'string' ? parseISO(ov.dataVenda) : new Date(ov.dataVenda);
          campoDataUsado = 'dataVenda';
        } else if (ov.data) {
          vendaDate = typeof ov.data === 'string' ? parseISO(ov.data) : new Date(ov.data);
          campoDataUsado = 'data';
        } else if (ov.timestamp) {
          vendaDate = new Date(ov.timestamp);
          campoDataUsado = 'timestamp';
        } else {
          console.warn('Nenhuma data encontrada para OV:', { numero: ov.numero, id: ov.id, campos: Object.keys(ov) });
          return false;
        }

        // Verificar se a data é válida
        if (isNaN(vendaDate.getTime())) {
          console.warn('Data inválida encontrada:', { ov: ov.numero, campo: campoDataUsado, valor: ov[campoDataUsado] });
          return false;
        }

        const pertenceAoDia = vendaDate >= dayStart && vendaDate <= dayEnd;
        
        // Debug específico para vendas que pertencem ao dia
        if (pertenceAoDia) {
          console.log(`✅ OV ${ov.numero} pertence ao dia ${format(day, 'dd/MM/yyyy')}:`, {
            campo: campoDataUsado,
            dataOV: format(vendaDate, 'dd/MM/yyyy HH:mm'),
            total: ov.total,
            status: ov.status
          });
        }

        return pertenceAoDia;
      } catch (error) {
        console.warn('Erro ao processar data da venda:', ov, error);
        return false;
      }
    });

    // Calcular métricas do dia
    const quantidadeVendas = vendasDoDia.length;
    
    const totalVendas = vendasDoDia.reduce((sum, venda) => {
      // Tentar diferentes campos para o valor total
      const valor = venda.total || 
                   venda.valorTotal || 
                   venda.valor || 
                   venda.subtotal || 
                   0;
      
      const valorNumerico = parseFloat(valor) || 0;
      return sum + valorNumerico;
    }, 0);

    const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;

    // Calcular produtos vendidos
    const produtosVendidos = vendasDoDia.reduce((sum, venda) => {
      if (venda.produtos && Array.isArray(venda.produtos)) {
        return sum + venda.produtos.reduce((prodSum, produto) => {
          return prodSum + (parseInt(produto.quantidade) || 0);
        }, 0);
      } else if (venda.itens && Array.isArray(venda.itens)) {
        return sum + venda.itens.reduce((itemSum, item) => {
          return itemSum + (parseInt(item.quantidade) || 0);
        }, 0);
      }
      return sum;
    }, 0);

    return {
      data: format(day, 'dd/MM', { locale: ptBR }),
      dataCompleta: format(day, 'dd/MM/yyyy', { locale: ptBR }),
      diaSemana: format(day, 'EEEE', { locale: ptBR }),
      totalVendas,
      quantidadeVendas,
      ticketMedio,
      produtosVendidos,
      // Dados adicionais para análise
      crescimento: 0, // Será calculado depois
      meta: totalVendas * 1.1, // Meta 10% acima do realizado (exemplo)
      timestamp: day.getTime()
    };
  });

  // Calcular crescimento dia a dia
  vendasPorDia.forEach((dia, index) => {
    if (index > 0) {
      const diaAnterior = vendasPorDia[index - 1];
      if (diaAnterior.totalVendas > 0) {
        dia.crescimento = ((dia.totalVendas - diaAnterior.totalVendas) / diaAnterior.totalVendas) * 100;
      }
    }
  });

  console.log('Vendas por dia processadas:', vendasPorDia.length);
  console.log('Exemplo do primeiro dia:', vendasPorDia[0]);
  
  // Debug: resumo dos dados processados
  const totalVendasPeriodo = vendasPorDia.reduce((sum, dia) => sum + dia.totalVendas, 0);
  const totalQuantidadePeriodo = vendasPorDia.reduce((sum, dia) => sum + dia.quantidadeVendas, 0);
  const diasComVendas = vendasPorDia.filter(dia => dia.quantidadeVendas > 0).length;
  
  console.log('=== RESUMO PROCESSAMENTO ===');
  console.log(`Total em vendas no período: R$ ${totalVendasPeriodo.toFixed(2)}`);
  console.log(`Total de vendas (quantidade): ${totalQuantidadePeriodo}`);
  console.log(`Dias com vendas: ${diasComVendas} de ${vendasPorDia.length}`);
  console.log('================================');
  
  return vendasPorDia;
};

/**
 * Calcula estatísticas resumidas das vendas diárias
 * @param {Array} vendasDiarias - Dados processados das vendas diárias
 * @returns {Object} Estatísticas resumidas
 */
export const calcularEstatisticasVendasDiarias = (vendasDiarias) => {
  if (!vendasDiarias || vendasDiarias.length === 0) {
    return {
      totalVendas: 0,
      totalQuantidade: 0,
      ticketMedio: 0,
      melhorDia: null,
      piorDia: null,
      crescimentoMedio: 0,
      diasComVendas: 0,
      produtosTotais: 0
    };
  }

  const totalVendas = vendasDiarias.reduce((sum, dia) => sum + dia.totalVendas, 0);
  const totalQuantidade = vendasDiarias.reduce((sum, dia) => sum + dia.quantidadeVendas, 0);
  const produtosTotais = vendasDiarias.reduce((sum, dia) => sum + dia.produtosVendidos, 0);
  
  const ticketMedio = totalQuantidade > 0 ? totalVendas / totalQuantidade : 0;
  
  const diasComVendas = vendasDiarias.filter(dia => dia.quantidadeVendas > 0).length;
  
  const melhorDia = vendasDiarias.reduce((melhor, dia) => 
    dia.totalVendas > (melhor?.totalVendas || 0) ? dia : melhor, null
  );
  
  const piorDia = vendasDiarias.reduce((pior, dia) => 
    dia.quantidadeVendas > 0 && dia.totalVendas < (pior?.totalVendas || Infinity) ? dia : pior, null
  );
  
  const crescimentos = vendasDiarias
    .filter(dia => dia.crescimento !== 0)
    .map(dia => dia.crescimento);
  
  const crescimentoMedio = crescimentos.length > 0 
    ? crescimentos.reduce((sum, c) => sum + c, 0) / crescimentos.length 
    : 0;

  return {
    totalVendas,
    totalQuantidade,
    ticketMedio,
    melhorDia,
    piorDia,
    crescimentoMedio,
    diasComVendas,
    produtosTotais,
    diasAnalisados: vendasDiarias.length
  };
};

/**
 * Formata dados para diferentes tipos de gráfico
 * @param {Array} vendasDiarias - Dados processados das vendas diárias
 * @param {string} tipo - Tipo do gráfico ('bar', 'line', 'area')
 * @returns {Array} Dados formatados para o gráfico
 */
export const formatarDadosParaGrafico = (vendasDiarias, tipo = 'bar') => {
  if (!vendasDiarias || vendasDiarias.length === 0) {
    return [];
  }

  switch (tipo) {
    case 'line':
      return vendasDiarias.map(dia => ({
        x: dia.data,
        y: dia.totalVendas,
        label: `${dia.dataCompleta}: ${formatCurrency(dia.totalVendas)}`,
        vendas: dia.quantidadeVendas,
        ticketMedio: dia.ticketMedio
      }));
    
    case 'area':
      return vendasDiarias.map(dia => ({
        data: dia.data,
        vendas: dia.totalVendas,
        quantidade: dia.quantidadeVendas,
        meta: dia.meta
      }));
    
    case 'bar':
    default:
      return vendasDiarias.map(dia => ({
        data: dia.data,
        totalVendas: dia.totalVendas,
        quantidadeVendas: dia.quantidadeVendas,
        ticketMedio: dia.ticketMedio,
        produtosVendidos: dia.produtosVendidos,
        crescimento: dia.crescimento,
        diaSemana: dia.diaSemana
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
 * Utilitário para formatar percentual
 * @param {number} value - Valor a ser formatado (já em percentual)
 * @returns {string} Percentual formatado
 */
export const formatPercent = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format((value || 0) / 100);
};

export default {
  processVendasDiarias,
  calcularEstatisticasVendasDiarias,
  formatarDadosParaGrafico,
  formatCurrency,
  formatNumber,
  formatPercent
};
