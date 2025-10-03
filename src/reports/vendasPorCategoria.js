import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Processa dados de vendas por categoria para o relatório gráfico
 * @param {Array} ordensVenda - Array de ordens de venda
 * @param {Array} produtos - Array de produtos
 * @param {Array} categorias - Array de categorias
 * @returns {Array} Dados processados para o gráfico
 */
export const processVendasPorCategoria = (ordensVenda, produtos, categorias) => {
  console.log('=== PROCESSANDO VENDAS POR CATEGORIA ===');
  console.log('Ordens de venda recebidas:', ordensVenda?.length || 0);
  console.log('Produtos recebidos:', produtos?.length || 0);
  console.log('Categorias recebidas:', categorias?.length || 0);
  
  // Debug: mostrar estrutura dos dados
  if (ordensVenda && ordensVenda.length > 0) {
    console.log('Estrutura da primeira OV:', ordensVenda[0]);
    if (ordensVenda[0].produtos && ordensVenda[0].produtos.length > 0) {
      console.log('Estrutura do primeiro produto da OV:', ordensVenda[0].produtos[0]);
    }
  }
  
  if (produtos && produtos.length > 0) {
    console.log('Estrutura do primeiro produto:', produtos[0]);
  }
  
  if (categorias && categorias.length > 0) {
    console.log('Estrutura da primeira categoria:', categorias[0]);
  }
  
  if (!ordensVenda || ordensVenda.length === 0) {
    console.log('Nenhuma ordem de venda encontrada');
    return [];
  }

  if (!produtos || produtos.length === 0) {
    console.log('Nenhum produto encontrado');
    return [];
  }

  if (!categorias || categorias.length === 0) {
    console.log('Nenhuma categoria encontrada');
    return [];
  }

  // Criar mapa de produtos por ID para busca rápida
  const produtosMap = {};
  produtos.forEach(produto => {
    produtosMap[produto.id] = produto;
  });

  // Criar mapa de categorias por ID para busca rápida
  const categoriasMap = {};
  categorias.forEach(categoria => {
    categoriasMap[categoria.id] = categoria;
  });

  console.log('Produtos mapeados:', Object.keys(produtosMap).length);
  console.log('Categorias mapeadas:', Object.keys(categoriasMap).length);

  // Inicializar contadores por categoria
  const vendasPorCategoria = {};
  
  // Inicializar todas as categorias com zero
  categorias.forEach(categoria => {
    vendasPorCategoria[categoria.id] = {
      categoriaId: categoria.id,
      categoria: categoria.nome,
      cor: categoria.cor || '#8B5CF6',
      valorTotal: 0,
      quantidade: 0,
      produtosVendidos: 0,
      ordensCount: 0
    };
  });

  // Adicionar categoria "Sem Categoria" para produtos sem categoria
  vendasPorCategoria['sem_categoria'] = {
    categoriaId: 'sem_categoria',
    categoria: 'Sem Categoria',
    cor: '#6B7280',
    valorTotal: 0,
    quantidade: 0,
    produtosVendidos: 0,
    ordensCount: 0
  };

  // Processar cada ordem de venda
  ordensVenda.forEach(ov => {
    console.log(`Processando OV ${ov.numero}:`, ov);
    
    // Verificar se a OV tem produtos
    const produtosDaOV = ov.produtos || ov.itens || [];
    
    if (produtosDaOV.length === 0) {
      console.log(`OV ${ov.numero} não tem produtos`);
      return;
    }

    produtosDaOV.forEach(itemOV => {
      console.log('Processando item da OV:', itemOV);
      
      // Tentar encontrar o produto
      let produto = null;
      let categoriaId = 'sem_categoria';
      
      // Buscar produto por diferentes campos
      if (itemOV.produtoId) {
        produto = produtosMap[itemOV.produtoId];
      } else if (itemOV.codigo) {
        produto = produtos.find(p => p.codigo === itemOV.codigo);
      } else if (itemOV.nome) {
        produto = produtos.find(p => p.nome === itemOV.nome);
      }
      
      // Se encontrou o produto, pegar sua categoria
      if (produto && produto.categoriaId) {
        categoriaId = produto.categoriaId;
        console.log(`Produto ${produto.nome} pertence à categoria ${categoriaId}`);
      } else {
        console.log(`Produto não encontrado ou sem categoria:`, itemOV);
      }
      
      // Calcular valores do item
      const quantidade = parseInt(itemOV.quantidade) || 1;
      const preco = parseFloat(itemOV.preco) || 0;
      const valorItem = quantidade * preco;
      
      // Verificar se a categoria existe, senão usar "sem_categoria"
      if (!vendasPorCategoria[categoriaId]) {
        console.log(`Categoria ${categoriaId} não encontrada, usando 'sem_categoria'`);
        categoriaId = 'sem_categoria';
      }
      
      // Atualizar contadores da categoria
      vendasPorCategoria[categoriaId].valorTotal += valorItem;
      vendasPorCategoria[categoriaId].quantidade += quantidade;
      vendasPorCategoria[categoriaId].produtosVendidos += quantidade;
      
      console.log(`Adicionado à categoria ${categoriaId}:`, {
        valor: valorItem,
        quantidade: quantidade
      });
    });
    
    // Contar a ordem para cada categoria que teve produtos vendidos
    const categoriasComVendas = new Set();
    produtosDaOV.forEach(itemOV => {
      let produto = null;
      let categoriaId = 'sem_categoria';
      
      if (itemOV.produtoId) {
        produto = produtosMap[itemOV.produtoId];
      } else if (itemOV.codigo) {
        produto = produtos.find(p => p.codigo === itemOV.codigo);
      } else if (itemOV.nome) {
        produto = produtos.find(p => p.nome === itemOV.nome);
      }
      
      if (produto && produto.categoriaId) {
        categoriaId = produto.categoriaId;
      }
      
      if (!vendasPorCategoria[categoriaId]) {
        categoriaId = 'sem_categoria';
      }
      
      categoriasComVendas.add(categoriaId);
    });
    
    // Incrementar contador de ordens para cada categoria
    categoriasComVendas.forEach(catId => {
      vendasPorCategoria[catId].ordensCount++;
    });
  });

  // Converter para array e filtrar categorias com vendas
  const resultado = Object.values(vendasPorCategoria)
    .filter(categoria => categoria.valorTotal > 0)
    .sort((a, b) => b.valorTotal - a.valorTotal); // Ordenar por valor total decrescente

  console.log('=== RESULTADO VENDAS POR CATEGORIA ===');
  resultado.forEach(cat => {
    console.log(`${cat.categoria}: R$ ${cat.valorTotal.toFixed(2)} (${cat.quantidade} produtos em ${cat.ordensCount} ordens)`);
  });
  console.log('==========================================');
  
  return resultado;
};

/**
 * Calcula estatísticas resumidas das vendas por categoria
 * @param {Array} vendasPorCategoria - Dados processados das vendas por categoria
 * @returns {Object} Estatísticas resumidas
 */
export const calcularEstatisticasVendasPorCategoria = (vendasPorCategoria) => {
  if (!vendasPorCategoria || vendasPorCategoria.length === 0) {
    return {
      totalVendas: 0,
      totalQuantidade: 0,
      categoriasMaisVendidas: null,
      categoriaMenosVendida: null,
      numeroCategoriasComVendas: 0,
      ticketMedioPorCategoria: 0
    };
  }

  const totalVendas = vendasPorCategoria.reduce((sum, cat) => sum + cat.valorTotal, 0);
  const totalQuantidade = vendasPorCategoria.reduce((sum, cat) => sum + cat.quantidade, 0);
  
  const categoriasMaisVendidas = vendasPorCategoria[0]; // Já está ordenado por valor
  const categoriaMenosVendida = vendasPorCategoria[vendasPorCategoria.length - 1];
  
  const numeroCategoriasComVendas = vendasPorCategoria.length;
  const ticketMedioPorCategoria = numeroCategoriasComVendas > 0 ? totalVendas / numeroCategoriasComVendas : 0;

  return {
    totalVendas,
    totalQuantidade,
    categoriasMaisVendidas,
    categoriaMenosVendida,
    numeroCategoriasComVendas,
    ticketMedioPorCategoria
  };
};

/**
 * Formata dados para diferentes tipos de gráfico
 * @param {Array} vendasPorCategoria - Dados processados das vendas por categoria
 * @param {string} tipo - Tipo do gráfico ('pie', 'bar', 'donut')
 * @returns {Array} Dados formatados para o gráfico
 */
export const formatarDadosParaGrafico = (vendasPorCategoria, tipo = 'pie') => {
  if (!vendasPorCategoria || vendasPorCategoria.length === 0) {
    return [];
  }

  switch (tipo) {
    case 'bar':
      return vendasPorCategoria.map(cat => ({
        categoria: cat.categoria,
        valorTotal: cat.valorTotal,
        quantidade: cat.quantidade,
        produtosVendidos: cat.produtosVendidos,
        ordensCount: cat.ordensCount,
        cor: cat.cor
      }));
    
    case 'donut':
      return vendasPorCategoria.map(cat => ({
        name: cat.categoria,
        value: cat.valorTotal,
        quantidade: cat.quantidade,
        fill: cat.cor
      }));
    
    case 'pie':
    default:
      return vendasPorCategoria.map(cat => ({
        name: cat.categoria,
        value: cat.valorTotal,
        quantidade: cat.quantidade,
        percentual: 0, // Será calculado pelo componente
        fill: cat.cor
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
 * Utilitário para calcular percentual
 * @param {number} valor - Valor da categoria
 * @param {number} total - Total geral
 * @returns {string} Percentual formatado
 */
export const calcularPercentual = (valor, total) => {
  if (!total || total === 0) return '0%';
  const percentual = (valor / total) * 100;
  return `${percentual.toFixed(1)}%`;
};

export default {
  processVendasPorCategoria,
  calcularEstatisticasVendasPorCategoria,
  formatarDadosParaGrafico,
  formatCurrency,
  formatNumber,
  calcularPercentual
};
