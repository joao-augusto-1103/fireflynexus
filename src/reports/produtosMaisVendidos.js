import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Processa dados dos produtos mais vendidos para o relatório gráfico
 * @param {Array} ordensVenda - Array de ordens de venda
 * @param {Array} produtos - Array de produtos cadastrados
 * @returns {Array} Dados processados para o gráfico
 */
export const processProdutosMaisVendidos = (ordensVenda, produtos) => {
  console.log('=== PROCESSANDO PRODUTOS MAIS VENDIDOS ===');
  console.log('Ordens de venda recebidas:', ordensVenda?.length || 0);
  console.log('Produtos cadastrados:', produtos?.length || 0);
  
  // Debug: mostrar estrutura dos dados
  if (ordensVenda && ordensVenda.length > 0) {
    console.log('Estrutura da primeira OV:', ordensVenda[0]);
    if (ordensVenda[0].produtos || ordensVenda[0].itens) {
      console.log('Estrutura dos produtos da OV:', ordensVenda[0].produtos || ordensVenda[0].itens);
    }
  }
  
  if (produtos && produtos.length > 0) {
    console.log('Estrutura do primeiro produto:', produtos[0]);
  }
  
  if (!ordensVenda || ordensVenda.length === 0) {
    console.log('Nenhuma ordem de venda encontrada');
    return [];
  }

  // Criar mapa de produtos por ID para busca rápida
  const produtosMap = {};
  if (produtos && produtos.length > 0) {
    produtos.forEach(produto => {
      produtosMap[produto.id] = produto;
    });
  }

  console.log('Produtos mapeados:', Object.keys(produtosMap).length);

  // Inicializar contadores por produto
  const vendasPorProduto = {};

  // Processar cada ordem de venda
  ordensVenda.forEach(ov => {
    console.log(`Processando OV ${ov.numero}:`, ov);
    
    // Buscar produtos da OV
    const produtosDaOV = ov.produtos || ov.itens || [];
    
    if (produtosDaOV.length === 0) {
      console.log(`OV ${ov.numero} não possui produtos`);
      return;
    }

    console.log(`OV ${ov.numero} possui ${produtosDaOV.length} produtos:`, produtosDaOV);

    // Processar cada produto da OV
    produtosDaOV.forEach(item => {
      console.log('Processando item:', item);
      
      // Tentar identificar o produto
      let produtoId = null;
      let produtoNome = 'Produto não identificado';
      let produtoInfo = null;
      let precoUnitario = 0;
      let categoria = 'Sem categoria';
      let codigo = '';
      
      // Buscar produto por diferentes campos
      if (item.produtoId) {
        produtoId = item.produtoId;
        produtoInfo = produtosMap[produtoId];
        if (produtoInfo) {
          produtoNome = produtoInfo.nome;
          categoria = produtoInfo.categoria || 'Sem categoria';
          codigo = produtoInfo.codigo || '';
        }
      } else if (item.id) {
        produtoId = item.id;
        produtoInfo = produtosMap[produtoId];
        if (produtoInfo) {
          produtoNome = produtoInfo.nome;
          categoria = produtoInfo.categoria || 'Sem categoria';
          codigo = produtoInfo.codigo || '';
        }
      }
      
      // Se não encontrou produto cadastrado, usar dados do item
      if (!produtoInfo) {
        produtoNome = item.nome || item.produto || item.descricao || 'Produto não identificado';
        produtoId = `manual_${produtoNome.replace(/\s+/g, '_').toLowerCase()}`;
        categoria = 'Produto manual';
        codigo = item.codigo || '';
      }
      
      // Preço unitário
      precoUnitario = parseFloat(item.precoUnitario) || parseFloat(item.preco) || parseFloat(item.valor) || 0;
      
      // Quantidade
      const quantidade = parseInt(item.quantidade) || 1;
      
      // Valor total do item
      const valorTotal = precoUnitario * quantidade;
      
      console.log(`Produto identificado: ${produtoNome} (ID: ${produtoId}) - Qtd: ${quantidade} - Valor: R$ ${valorTotal.toFixed(2)}`);
      
      // Inicializar produto se não existir
      if (!vendasPorProduto[produtoId]) {
        vendasPorProduto[produtoId] = {
          produtoId: produtoId,
          nome: produtoNome,
          codigo: codigo,
          categoria: categoria,
          precoMedio: precoUnitario,
          quantidadeVendida: 0,
          valorTotalVendas: 0,
          numeroVendas: 0,
          precoMinimo: precoUnitario,
          precoMaximo: precoUnitario,
          ultimaVenda: null,
          primeiraVenda: null,
          statusProduto: produtoInfo ? 'cadastrado' : 'manual',
          estoque: produtoInfo?.estoque || 0,
          foto: produtoInfo?.foto || ''
        };
      }
      
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
      
      // Atualizar dados do produto
      vendasPorProduto[produtoId].quantidadeVendida += quantidade;
      vendasPorProduto[produtoId].valorTotalVendas += valorTotal;
      vendasPorProduto[produtoId].numeroVendas += 1;
      
      // Atualizar preços mínimo e máximo
      if (precoUnitario > 0) {
        if (precoUnitario < vendasPorProduto[produtoId].precoMinimo) {
          vendasPorProduto[produtoId].precoMinimo = precoUnitario;
        }
        if (precoUnitario > vendasPorProduto[produtoId].precoMaximo) {
          vendasPorProduto[produtoId].precoMaximo = precoUnitario;
        }
      }
      
      // Atualizar datas de primeira e última venda
      if (dataOV && !isNaN(dataOV.getTime())) {
        if (!vendasPorProduto[produtoId].ultimaVenda || dataOV > vendasPorProduto[produtoId].ultimaVenda) {
          vendasPorProduto[produtoId].ultimaVenda = dataOV;
        }
        if (!vendasPorProduto[produtoId].primeiraVenda || dataOV < vendasPorProduto[produtoId].primeiraVenda) {
          vendasPorProduto[produtoId].primeiraVenda = dataOV;
        }
      }
      
      console.log(`Atualizado produto ${produtoNome}:`, {
        quantidadeVendida: vendasPorProduto[produtoId].quantidadeVendida,
        valorTotalVendas: vendasPorProduto[produtoId].valorTotalVendas,
        numeroVendas: vendasPorProduto[produtoId].numeroVendas
      });
    });
  });

  // Calcular preço médio para cada produto
  Object.values(vendasPorProduto).forEach(produto => {
    if (produto.quantidadeVendida > 0) {
      produto.precoMedio = produto.valorTotalVendas / produto.quantidadeVendida;
    }
  });

  // Converter para array e ordenar por quantidade vendida decrescente
  const resultado = Object.values(vendasPorProduto)
    .filter(produto => produto.quantidadeVendida > 0)
    .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);

  console.log('=== RESULTADO PRODUTOS MAIS VENDIDOS ===');
  resultado.forEach((produto, index) => {
    console.log(`${index + 1}º ${produto.nome}: ${produto.quantidadeVendida} unidades (R$ ${produto.valorTotalVendas.toFixed(2)}, ${produto.numeroVendas} vendas)`);
  });
  console.log('===============================================');
  
  return resultado;
};

/**
 * Calcula estatísticas resumidas dos produtos mais vendidos
 * @param {Array} produtosMaisVendidos - Dados processados dos produtos mais vendidos
 * @returns {Object} Estatísticas resumidas
 */
export const calcularEstatisticasProdutosMaisVendidos = (produtosMaisVendidos) => {
  if (!produtosMaisVendidos || produtosMaisVendidos.length === 0) {
    return {
      totalProdutos: 0,
      produtoMaisVendido: null,
      produtoMenosVendido: null,
      quantidadeTotalVendida: 0,
      valorTotalVendas: 0,
      precoMedioGeral: 0,
      totalVendas: 0,
      produtosCadastrados: 0,
      produtosManuais: 0,
      categorias: 0
    };
  }

  const totalProdutos = produtosMaisVendidos.length;
  const produtoMaisVendido = produtosMaisVendidos[0]; // Já está ordenado por quantidade
  const produtoMenosVendido = produtosMaisVendidos[produtosMaisVendidos.length - 1];
  
  const quantidadeTotalVendida = produtosMaisVendidos.reduce((sum, produto) => sum + produto.quantidadeVendida, 0);
  const valorTotalVendas = produtosMaisVendidos.reduce((sum, produto) => sum + produto.valorTotalVendas, 0);
  const totalVendas = produtosMaisVendidos.reduce((sum, produto) => sum + produto.numeroVendas, 0);
  const precoMedioGeral = quantidadeTotalVendida > 0 ? valorTotalVendas / quantidadeTotalVendida : 0;
  
  const produtosCadastrados = produtosMaisVendidos.filter(produto => produto.statusProduto === 'cadastrado').length;
  const produtosManuais = produtosMaisVendidos.filter(produto => produto.statusProduto === 'manual').length;
  
  // Contar categorias únicas
  const categoriasUnicas = new Set(produtosMaisVendidos.map(produto => produto.categoria));
  const categorias = categoriasUnicas.size;

  return {
    totalProdutos,
    produtoMaisVendido,
    produtoMenosVendido,
    quantidadeTotalVendida,
    valorTotalVendas,
    precoMedioGeral,
    totalVendas,
    produtosCadastrados,
    produtosManuais,
    categorias
  };
};

/**
 * Formata dados para diferentes tipos de gráfico
 * @param {Array} produtosMaisVendidos - Dados processados dos produtos mais vendidos
 * @param {string} tipo - Tipo do gráfico ('bar', 'horizontal', 'pie')
 * @param {number} limite - Número máximo de produtos a mostrar
 * @returns {Array} Dados formatados para o gráfico
 */
export const formatarDadosParaGrafico = (produtosMaisVendidos, tipo = 'bar', limite = 10) => {
  if (!produtosMaisVendidos || produtosMaisVendidos.length === 0) {
    return [];
  }

  const produtosLimitados = produtosMaisVendidos.slice(0, limite);

  switch (tipo) {
    case 'horizontal':
      return produtosLimitados.map(produto => ({
        nome: produto.nome.length > 20 ? produto.nome.substring(0, 20) + '...' : produto.nome,
        quantidadeVendida: produto.quantidadeVendida,
        valorTotalVendas: produto.valorTotalVendas,
        numeroVendas: produto.numeroVendas,
        precoMedio: produto.precoMedio,
        categoria: produto.categoria
      }));
    
    case 'pie':
      return produtosLimitados.map(produto => ({
        name: produto.nome.length > 15 ? produto.nome.substring(0, 15) + '...' : produto.nome,
        value: produto.quantidadeVendida,
        valorTotal: produto.valorTotalVendas,
        fill: produto.statusProduto === 'cadastrado' ? '#10B981' : '#F59E0B'
      }));
    
    case 'bar':
    default:
      return produtosLimitados.map(produto => ({
        nome: produto.nome.length > 15 ? produto.nome.substring(0, 15) + '...' : produto.nome,
        quantidadeVendida: produto.quantidadeVendida,
        valorTotalVendas: produto.valorTotalVendas,
        numeroVendas: produto.numeroVendas,
        precoMedio: produto.precoMedio,
        categoria: produto.categoria
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
 * Utilitário para calcular dias desde a última venda
 * @param {Date} ultimaVenda - Data da última venda
 * @returns {number} Número de dias
 */
export const diasDesdeUltimaVenda = (ultimaVenda) => {
  if (!ultimaVenda) return null;
  const hoje = new Date();
  const diffTime = Math.abs(hoje - ultimaVenda);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Utilitário para calcular performance do produto
 * @param {Object} produto - Dados do produto
 * @returns {string} Classificação da performance
 */
export const calcularPerformance = (produto) => {
  if (!produto.quantidadeVendida) return 'Sem vendas';
  
  if (produto.quantidadeVendida >= 50) return 'Excelente';
  if (produto.quantidadeVendida >= 20) return 'Boa';
  if (produto.quantidadeVendida >= 10) return 'Regular';
  if (produto.quantidadeVendida >= 5) return 'Baixa';
  return 'Muito baixa';
};

export default {
  processProdutosMaisVendidos,
  calcularEstatisticasProdutosMaisVendidos,
  formatarDadosParaGrafico,
  formatCurrency,
  formatNumber,
  formatDate,
  diasDesdeUltimaVenda,
  calcularPerformance
};
