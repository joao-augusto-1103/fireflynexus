import { format, startOfDay, endOfDay, eachDayOfInterval, subDays, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Utilitários para processar dados dos relatórios

// Formatar valores monetários
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Formatar números
export const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

// Formatar percentual
export const formatPercent = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

// Processar dados de vendas diárias
export const processVendasDiarias = (ordensVenda, dateRange) => {
  console.log('=== processVendasDiarias ===');
  console.log('ordensVenda:', ordensVenda);
  console.log('dateRange:', dateRange);
  
  if (!ordensVenda || ordensVenda.length === 0) {
    console.log('Nenhuma ordem de venda encontrada');
    return [];
  }

  const days = eachDayOfInterval({
    start: dateRange.from,
    end: dateRange.to
  });

  const vendasPorDia = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    const vendasDoDia = ordensVenda.filter(ov => {
      const vendaDate = new Date(ov.createdAt);
      return vendaDate >= dayStart && vendaDate <= dayEnd;
    });

    const totalVendas = vendasDoDia.reduce((sum, venda) => {
      // Verificar diferentes campos possíveis para valorTotal
      const valor = venda.valorTotal || venda.total || venda.valor || 0;
      return sum + (parseFloat(valor) || 0);
    }, 0);

    const quantidadeVendas = vendasDoDia.length;

    return {
      data: format(day, 'dd/MM', { locale: ptBR }),
      dataCompleta: format(day, 'dd/MM/yyyy', { locale: ptBR }),
      totalVendas,
      quantidadeVendas,
      ticketMedio: quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0
    };
  });

  console.log('vendasPorDia processado:', vendasPorDia);
  return vendasPorDia;
};

// Processar fluxo de caixa
export const processFluxoCaixa = (financeiro, dateRange) => {
  console.log('=== processFluxoCaixa ===');
  console.log('financeiro:', financeiro);
  console.log('dateRange:', dateRange);
  
  if (!financeiro || financeiro.length === 0) {
    console.log('Nenhuma movimentação financeira encontrada');
    return [];
  }

  const days = eachDayOfInterval({
    start: dateRange.from,
    end: dateRange.to
  });

  const fluxoPorDia = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    const movimentacoesDoDia = financeiro.filter(f => {
      const movDate = new Date(f.createdAt);
      return movDate >= dayStart && movDate <= dayEnd;
    });

    const entradas = movimentacoesDoDia
      .filter(f => f.tipo === 'entrada' || f.tipo === 'receber' || f.tipo === 'receita')
      .reduce((sum, f) => sum + (parseFloat(f.valor) || 0), 0);

    const saidas = movimentacoesDoDia
      .filter(f => f.tipo === 'saida' || f.tipo === 'pagar' || f.tipo === 'despesa')
      .reduce((sum, f) => sum + (parseFloat(f.valor) || 0), 0);

    const saldo = entradas - saidas;

    return {
      data: format(day, 'dd/MM', { locale: ptBR }),
      dataCompleta: format(day, 'dd/MM/yyyy', { locale: ptBR }),
      entradas,
      saidas,
      saldo
    };
  });

  console.log('fluxoCaixa processado:', fluxoPorDia);
  return fluxoPorDia;
};

// Processar produtos mais vendidos
export const processProdutosMaisVendidos = (ordensVenda, produtos) => {
  console.log('=== processProdutosMaisVendidos ===');
  console.log('ordensVenda:', ordensVenda);
  console.log('produtos:', produtos);
  
  if (!ordensVenda || ordensVenda.length === 0) {
    console.log('Nenhuma ordem de venda encontrada');
    return [];
  }

  const produtosVendidos = {};

  ordensVenda.forEach(ov => {
    console.log('Processando OV:', ov);
    if (ov.produtos && Array.isArray(ov.produtos)) {
      ov.produtos.forEach(produtoVenda => {
        console.log('Produto na venda:', produtoVenda);
        // Para dados de teste, vamos usar o nome do produto diretamente
        const nomeProduto = produtoVenda.nome || 'Produto sem nome';
        const quantidade = parseInt(produtoVenda.quantidade) || 0;
        const valorTotal = parseFloat(produtoVenda.total || produtoVenda.valorTotal) || 0;
        
        if (!produtosVendidos[nomeProduto]) {
          produtosVendidos[nomeProduto] = {
            id: nomeProduto,
            nome: nomeProduto,
            quantidade: 0,
            valorTotal: 0,
            categoria: 'Sem categoria'
          };
        }
        
        produtosVendidos[nomeProduto].quantidade += quantidade;
        produtosVendidos[nomeProduto].valorTotal += valorTotal;
      });
    }
  });

  const resultado = Object.values(produtosVendidos)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10); // Top 10
    
  console.log('produtosVendidos processado:', resultado);
  return resultado;
};

// Processar vendas por categoria
export const processVendasPorCategoria = (ordensVenda, produtos, categorias) => {
  if (!ordensVenda || ordensVenda.length === 0) return [];

  const vendasPorCategoria = {};

  ordensVenda.forEach(ov => {
    if (ov.produtos && Array.isArray(ov.produtos)) {
      ov.produtos.forEach(produtoVenda => {
        const produtoId = produtoVenda.produtoId || produtoVenda.id;
        const produto = produtos.find(p => p.id === produtoId);
        
        if (produto) {
          const categoriaId = produto.categoriaId || produto.categoria;
          const categoria = categorias.find(c => c.id === categoriaId);
          const categoriaNome = categoria ? categoria.nome : 'Sem categoria';
          
          if (!vendasPorCategoria[categoriaNome]) {
            vendasPorCategoria[categoriaNome] = {
              categoria: categoriaNome,
              quantidade: 0,
              valorTotal: 0,
              quantidadeVendas: 0
            };
          }
          
          vendasPorCategoria[categoriaNome].quantidade += parseInt(produtoVenda.quantidade) || 0;
          vendasPorCategoria[categoriaNome].valorTotal += parseFloat(produtoVenda.valorTotal) || 0;
          vendasPorCategoria[categoriaNome].quantidadeVendas += 1;
        }
      });
    }
  });

  return Object.values(vendasPorCategoria)
    .sort((a, b) => b.valorTotal - a.valorTotal);
};

// Processar top clientes
export const processTopClientes = (ordensVenda, clientes) => {
  console.log('=== processTopClientes ===');
  console.log('ordensVenda:', ordensVenda);
  console.log('clientes:', clientes);
  
  if (!ordensVenda || ordensVenda.length === 0) {
    console.log('Nenhuma ordem de venda encontrada');
    return [];
  }

  const clientesVendas = {};

  ordensVenda.forEach(ov => {
    console.log('Processando OV para cliente:', ov);
    // Para dados de teste, vamos usar o nome do cliente diretamente
    const nomeCliente = ov.clienteNome || 'Cliente sem nome';
    const valorTotal = parseFloat(ov.valorTotal || ov.total) || 0;
    
    if (!clientesVendas[nomeCliente]) {
      clientesVendas[nomeCliente] = {
        id: nomeCliente,
        nome: nomeCliente,
        email: '',
        telefone: '',
        quantidadeCompras: 0,
        valorTotal: 0,
        ticketMedio: 0
      };
    }
    
    clientesVendas[nomeCliente].quantidadeCompras += 1;
    clientesVendas[nomeCliente].valorTotal += valorTotal;
  });

  // Calcular ticket médio
  Object.values(clientesVendas).forEach(cliente => {
    cliente.ticketMedio = cliente.quantidadeCompras > 0 
      ? cliente.valorTotal / cliente.quantidadeCompras 
      : 0;
  });

  const resultado = Object.values(clientesVendas)
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 10); // Top 10
    
  console.log('topClientes processado:', resultado);
  return resultado;
};

// Processar receitas vs despesas
export const processReceitasDespesas = (financeiro, dateRange) => {
  console.log('=== processReceitasDespesas ===');
  console.log('financeiro:', financeiro);
  console.log('dateRange:', dateRange);
  
  if (!financeiro || financeiro.length === 0) {
    console.log('Nenhuma movimentação financeira encontrada');
    return [];
  }

  const months = [];
  const currentDate = new Date();
  
  // Gerar últimos 12 meses
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(currentDate, i);
    months.push({
      mes: format(monthDate, 'MMM/yyyy', { locale: ptBR }),
      mesCompleto: format(monthDate, 'MMMM/yyyy', { locale: ptBR }),
      receitas: 0,
      despesas: 0,
      saldo: 0
    });
  }

  financeiro.forEach(f => {
    console.log('Processando movimentação financeira:', f);
    const movDate = new Date(f.createdAt);
    const monthIndex = months.findIndex(m => {
      const monthDate = new Date(m.mesCompleto.split('/')[1], 
        new Date(m.mesCompleto.split('/')[0] + ' 1, 2000').getMonth());
      return movDate.getMonth() === monthDate.getMonth() && 
             movDate.getFullYear() === monthDate.getFullYear();
    });

    if (monthIndex !== -1) {
      const valor = parseFloat(f.valor) || 0;
      
      if (f.tipo === 'entrada' || f.tipo === 'receber' || f.tipo === 'receita') {
        months[monthIndex].receitas += valor;
      } else if (f.tipo === 'saida' || f.tipo === 'pagar' || f.tipo === 'despesa') {
        months[monthIndex].despesas += valor;
      }
    }
  });

  // Calcular saldo
  months.forEach(month => {
    month.saldo = month.receitas - month.despesas;
  });

  console.log('receitasDespesas processado:', months);
  return months;
};

// Processar ticket médio ao longo do tempo
export const processTicketMedio = (ordensVenda, dateRange) => {
  if (!ordensVenda || ordensVenda.length === 0) return [];

  const days = eachDayOfInterval({
    start: dateRange.from,
    end: dateRange.to
  });

  const ticketPorDia = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    const vendasDoDia = ordensVenda.filter(ov => {
      const vendaDate = new Date(ov.createdAt);
      return vendaDate >= dayStart && vendaDate <= dayEnd;
    });

    const totalVendas = vendasDoDia.reduce((sum, venda) => {
      return sum + (parseFloat(venda.valorTotal) || 0);
    }, 0);

    const quantidadeVendas = vendasDoDia.length;
    const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;

    return {
      data: format(day, 'dd/MM', { locale: ptBR }),
      dataCompleta: format(day, 'dd/MM/yyyy', { locale: ptBR }),
      ticketMedio,
      quantidadeVendas,
      totalVendas
    };
  });

  return ticketPorDia;
};

// Processar taxa de conversão (simulado - seria baseado em leads/propostas)
export const processTaxaConversao = (ordensVenda, dateRange) => {
  if (!ordensVenda || ordensVenda.length === 0) return [];

  const days = eachDayOfInterval({
    start: dateRange.from,
    end: dateRange.to
  });

  const conversaoPorDia = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    const vendasDoDia = ordensVenda.filter(ov => {
      const vendaDate = new Date(ov.createdAt);
      return vendaDate >= dayStart && vendaDate <= dayEnd;
    });

    // Simular leads baseado nas vendas (multiplicar por um fator)
    const leadsSimulados = vendasDoDia.length * 3; // 3 leads para cada venda
    const conversao = leadsSimulados > 0 ? (vendasDoDia.length / leadsSimulados) * 100 : 0;

    return {
      data: format(day, 'dd/MM', { locale: ptBR }),
      dataCompleta: format(day, 'dd/MM/yyyy', { locale: ptBR }),
      taxaConversao: conversao,
      vendas: vendasDoDia.length,
      leads: leadsSimulados
    };
  });

  return conversaoPorDia;
};

// Calcular estatísticas gerais
export const calculateStats = (ordensVenda, financeiro, dateRange) => {
  const vendasFiltradas = ordensVenda.filter(ov => {
    const vendaDate = new Date(ov.createdAt);
    return vendaDate >= dateRange.from && vendaDate <= dateRange.to;
  });

  const financeiroFiltrado = financeiro.filter(f => {
    const movDate = new Date(f.createdAt);
    return movDate >= dateRange.from && movDate <= dateRange.to;
  });

  const totalVendas = vendasFiltradas.reduce((sum, venda) => {
    return sum + (parseFloat(venda.valorTotal) || 0);
  }, 0);

  const quantidadeVendas = vendasFiltradas.length;
  const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;

  const receitas = financeiroFiltrado
    .filter(f => f.tipo === 'entrada' || f.tipo === 'receita')
    .reduce((sum, f) => sum + (parseFloat(f.valor) || 0), 0);

  const despesas = financeiroFiltrado
    .filter(f => f.tipo === 'saida' || f.tipo === 'despesa')
    .reduce((sum, f) => sum + (parseFloat(f.valor) || 0), 0);

  const lucro = receitas - despesas;
  const margemLucro = receitas > 0 ? (lucro / receitas) * 100 : 0;

  return {
    totalVendas,
    quantidadeVendas,
    ticketMedio,
    receitas,
    despesas,
    lucro,
    margemLucro
  };
};

// Gerar dados de exemplo para demonstração
export const generateSampleData = () => {
  const sampleVendas = [];
  const sampleFinanceiro = [];
  const sampleProdutos = [];
  const sampleClientes = [];
  const sampleCategorias = [];

  // Categorias de exemplo
  const categoriasExemplo = [
    { id: 'cat1', nome: 'Smartphones' },
    { id: 'cat2', nome: 'Tablets' },
    { id: 'cat3', nome: 'Acessórios' },
    { id: 'cat4', nome: 'Manutenção' }
  ];

  // Produtos de exemplo
  const produtosExemplo = [
    { id: 'prod1', nome: 'iPhone 15', categoriaId: 'cat1', preco: 5000 },
    { id: 'prod2', nome: 'Samsung Galaxy S24', categoriaId: 'cat1', preco: 4000 },
    { id: 'prod3', nome: 'iPad Pro', categoriaId: 'cat2', preco: 6000 },
    { id: 'prod4', nome: 'Capa Protetora', categoriaId: 'cat3', preco: 50 },
    { id: 'prod5', nome: 'Reparo Tela', categoriaId: 'cat4', preco: 200 }
  ];

  // Clientes de exemplo
  const clientesExemplo = [
    { id: 'cli1', nome: 'João Silva', email: 'joao@email.com' },
    { id: 'cli2', nome: 'Maria Santos', email: 'maria@email.com' },
    { id: 'cli3', nome: 'Pedro Costa', email: 'pedro@email.com' }
  ];

  // Gerar vendas dos últimos 30 dias
  for (let i = 0; i < 30; i++) {
    const data = subDays(new Date(), i);
    const quantidadeVendas = Math.floor(Math.random() * 5) + 1;
    
    for (let j = 0; j < quantidadeVendas; j++) {
      const produto = produtosExemplo[Math.floor(Math.random() * produtosExemplo.length)];
      const cliente = clientesExemplo[Math.floor(Math.random() * clientesExemplo.length)];
      const quantidade = Math.floor(Math.random() * 3) + 1;
      const valorTotal = produto.preco * quantidade;

      sampleVendas.push({
        id: `venda_${i}_${j}`,
        clienteId: cliente.id,
        produtos: [{
          produtoId: produto.id,
          quantidade,
          valorTotal
        }],
        valorTotal,
        createdAt: data.toISOString()
      });
    }
  }

  // Gerar movimentações financeiras
  for (let i = 0; i < 30; i++) {
    const data = subDays(new Date(), i);
    
    // Receitas
    const receitas = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < receitas; j++) {
      sampleFinanceiro.push({
        id: `rec_${i}_${j}`,
        tipo: 'entrada',
        valor: Math.floor(Math.random() * 1000) + 100,
        descricao: 'Venda de produtos',
        createdAt: data.toISOString()
      });
    }

    // Despesas
    const despesas = Math.floor(Math.random() * 2) + 1;
    for (let j = 0; j < despesas; j++) {
      sampleFinanceiro.push({
        id: `desp_${i}_${j}`,
        tipo: 'saida',
        valor: Math.floor(Math.random() * 500) + 50,
        descricao: 'Despesa operacional',
        createdAt: data.toISOString()
      });
    }
  }

  return {
    vendas: sampleVendas,
    financeiro: sampleFinanceiro,
    produtos: produtosExemplo,
    clientes: clientesExemplo,
    categorias: categoriasExemplo
  };
};
