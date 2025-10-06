import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  LineChart as LineChartIcon,
  Users,
  FileText,
  Download,
  Filter,
  Search,
  Eye,
  Printer,
  Share2,
  RefreshCw,
  Settings,
  Star,
  Award,
  Target,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Building2,
  CreditCard,
  Truck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Tag,
  Layers,
  Activity,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Minus,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Grid,
  List,
  BookOpen,
  Calculator,
  Database,
  Globe,
  Lock,
  Unlock,
  Shield,
  Heart,
  ThumbsUp,
  MessageSquare,
  Bell,
  Bookmark,
  Flag,
  Home,
  Store,
  ShoppingBag,
  Receipt,
  Wallet,
  Banknote,
  Coins,
  PiggyBank,
  X,
  Trophy,
  AreaChart,
  Table
} from 'lucide-react';
import { addDays, format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/App';
import { firebaseService } from '@/lib/firebaseService';
import { 
  useClientes, 
  useOS, 
  useOV, 
  useProdutos, 
  useCategorias, 
  useFinanceiro,
  useCaixa,
  usePermissions,
  useConfiguracao
} from '@/lib/hooks/useFirebase';

// Importar componentes de gráficos
import {
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
  AreaChartComponent,
  ComposedChartComponent,
  HorizontalBarChartComponent
} from '@/components/charts/ChartComponents';

// Importar utilitários de relatórios
import {
  processFluxoCaixa,
  processProdutosMaisVendidos,
  calculateStats,
  formatCurrency,
  formatNumber,
  formatPercent
} from '@/lib/reportUtils';

// Importar lógica específica de vendas diárias
import {
  processVendasDiarias,
  calcularEstatisticasVendasDiarias,
  formatarDadosParaGrafico
} from '@/reports/vendasDiarias';

// Importar lógica específica de vendas por categoria
import {
  processVendasPorCategoria,
  calcularEstatisticasVendasPorCategoria,
  formatarDadosParaGrafico as formatarDadosCategoria
} from '@/reports/vendasPorCategoria';

// Importar lógica específica de top clientes
import {
  processTopClientes,
  calcularEstatisticasTopClientes,
  formatarDadosParaGrafico as formatarDadosClientes,
  formatDate,
  diasDesdeUltimaCompra
} from '@/reports/topClientes';

// Importar lógica específica de produtos mais vendidos
import {
  processProdutosMaisVendidos as processProdutosMaisVendidosNovo,
  calcularEstatisticasProdutosMaisVendidos,
  formatarDadosParaGrafico as formatarDadosProdutos,
  diasDesdeUltimaVenda,
  calcularPerformance
} from '@/reports/produtosMaisVendidos';

// Importar lógica específica de fluxo de caixa
import {
  processFluxoCaixa as processFluxoCaixaNovo,
  calcularEstatisticasFluxoCaixa,
  formatarDadosParaGrafico as formatarDadosFluxoCaixa
} from '@/reports/fluxoCaixa';
import {
  processReceitasDespesas,
  calcularEstatisticasReceitasDespesas,
  formatarDadosParaGrafico as formatarDadosReceitasDespesas,
  calcularIndicadoresPerformance,
  calcularTendenciasEAlertas,
  analisarCategorias,
  compararComPeriodoAnterior
} from '@/reports/receitasDespesas';

// Importar lógica específica de ticket médio
import {
  processTicketMedio as processTicketMedioNovo,
  calcularEstatisticasTicketMedio,
  formatarDadosParaGrafico as formatarDadosTicketMedio
} from '@/reports/ticketMedio';

// Importar lógica específica de taxa de conversão
import {
  processTaxaConversao as processTaxaConversaoNovo,
  calcularEstatisticasTaxaConversao,
  formatarDadosParaGrafico as formatarDadosTaxaConversao
} from '@/reports/taxaConversao';

const RelatoriosModule = () => {
  const { t } = useContext(AppContext);
  const { toast } = useToast();
  const { canView } = usePermissions();
  
  // Verificar permissão de visualização
  if (!canView('relatorios')) {
    return null;
  }
  
  // Função para formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };
  
  // Debug inicial
  console.log('=== RELATÓRIOS MODULE INICIADO ===');
  console.log('Firebase Service disponível:', typeof firebaseService);
  
  // Verificar se há um usuário logado
  useEffect(() => {
    console.log('=== VERIFICANDO ESTADO INICIAL ===');
    console.log('Context:', { t });
    console.log('Toast:', typeof toast);
  }, []);
  
  // Hooks do Firebase
  const clientesHook = useClientes();
  const osHook = useOS();
  const ovHook = useOV();
  const produtosHook = useProdutos();
  const categoriasHook = useCategorias();
  const financeiroHook = useFinanceiro();
  const caixaHook = useCaixa();
  const { config: configuracoes } = useConfiguracao();
  
  const { data: clientes = [] } = clientesHook;
  const { data: ordensServico = [] } = osHook;
  const { data: ordensVenda = [] } = ovHook;
  const { data: produtos = [] } = produtosHook;
  const { data: categorias = [] } = categoriasHook;
  const { data: financeiro = [] } = financeiroHook;
  const { data: caixaData = [] } = caixaHook;
  
  // Debug dos hooks
  console.log('=== DEBUG HOOKS FIREBASE ===');
  console.log('clientesHook:', clientesHook);
  console.log('ovHook:', ovHook);
  console.log('financeiroHook:', financeiroHook);
  console.log('Dados extraídos:');
  console.log('- clientes:', clientes);
  console.log('- ordensVenda:', ordensVenda);
  console.log('- financeiro:', financeiro);
  console.log('================================');
  

  // Estados principais
  const [activeTab, setActiveTab] = useState('graficos');
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [startDate, setStartDate] = useState(addDays(new Date(), -30));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid ou list
  const [isLoading, setIsLoading] = useState(false);

  // Função para atualizar o dateRange quando as datas separadas mudarem
  useEffect(() => {
    if (startDate && endDate) {
      setDateRange({ from: startDate, to: endDate });
    }
  }, [startDate, endDate]);

  // Períodos pré-definidos
  const periodosPredefinidos = [
    { label: 'Últimos 7 dias', value: '7d', from: addDays(new Date(), -7), to: new Date() },
    { label: 'Últimos 30 dias', value: '30d', from: addDays(new Date(), -30), to: new Date() },
    { label: 'Últimos 90 dias', value: '90d', from: addDays(new Date(), -90), to: new Date() },
    { label: 'Este mês', value: 'month', from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    { label: 'Mês passado', value: 'lastMonth', from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) },
    { label: 'Este ano', value: 'year', from: startOfYear(new Date()), to: endOfYear(new Date()) },
    { label: 'Ano passado', value: 'lastYear', from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) },
  ];

  // Dados reais do Firebase para os relatórios
  const reportData = {
    ordensVenda,
    financeiro,
    produtos,
    clientes,
    categorias,
    caixaData
  };
  
  console.log('=== DADOS USADOS NO RELATÓRIO ===');
  console.log('Dados finais:', {
    ordensVenda: reportData.ordensVenda?.length || 0,
    clientes: reportData.clientes?.length || 0,
    produtos: reportData.produtos?.length || 0,
    financeiro: reportData.financeiro?.length || 0
  });

  // Debug: Log dos dados brutos
  console.log('=== DEBUG RELATÓRIOS ===');
  console.log('ordensVenda:', reportData.ordensVenda);
  console.log('financeiro:', reportData.financeiro);
  console.log('produtos:', reportData.produtos);
  console.log('clientes:', reportData.clientes);
  console.log('categorias:', reportData.categorias);
  console.log('dateRange:', dateRange);

  // Dados filtrados por período
  const filteredData = {
    ordensVenda: reportData.ordensVenda.filter(ov => {
      const date = new Date(ov.createdAt);
      return date >= dateRange.from && date <= dateRange.to;
    }),
    ordensServico: ordensServico.filter(os => {
      const date = new Date(os.createdAt);
      return date >= dateRange.from && date <= dateRange.to;
    }),
    financeiro: reportData.financeiro.filter(f => {
      const date = new Date(f.createdAt);
      return date >= dateRange.from && date <= dateRange.to;
    }),
  };

  console.log('filteredData:', filteredData);

  // Processar dados para os gráficos
  const vendasDiariasData = processVendasDiarias(filteredData.ordensVenda, dateRange);
  const estatisticasVendasDiarias = calcularEstatisticasVendasDiarias(vendasDiariasData);
  
  const vendasPorCategoriaData = processVendasPorCategoria(filteredData.ordensVenda, reportData.produtos, reportData.categorias);
  const estatisticasVendasPorCategoria = calcularEstatisticasVendasPorCategoria(vendasPorCategoriaData);
  
  const topClientesData = processTopClientes(filteredData.ordensVenda, reportData.clientes);
  const estatisticasTopClientes = calcularEstatisticasTopClientes(topClientesData);
  
  const produtosMaisVendidosData = processProdutosMaisVendidosNovo(filteredData.ordensVenda, reportData.produtos);
  const estatisticasProdutosMaisVendidos = calcularEstatisticasProdutosMaisVendidos(produtosMaisVendidosData);
  
  const fluxoCaixaData = processFluxoCaixaNovo(reportData.caixaData, filteredData.financeiro, filteredData.ordensVenda, dateRange);
  const estatisticasFluxoCaixa = calcularEstatisticasFluxoCaixa(fluxoCaixaData);
  
  // Processar dados de Receitas vs Despesas
  const receitasDespesasData = processReceitasDespesas(filteredData.financeiro, dateRange);
  const estatisticasReceitasDespesas = calcularEstatisticasReceitasDespesas(receitasDespesasData);
  const indicadoresPerformance = calcularIndicadoresPerformance(estatisticasReceitasDespesas);
  const tendenciasEAlertas = calcularTendenciasEAlertas(receitasDespesasData);
  const analiseCategoriasData = analisarCategorias(filteredData.financeiro, dateRange);
  const comparacaoPeriodoAnterior = compararComPeriodoAnterior(receitasDespesasData, filteredData.financeiro, dateRange);
  
  const chartData = {
    vendasDiarias: vendasDiariasData,
    vendasDiariasStats: estatisticasVendasDiarias,
    vendasPorCategoria: vendasPorCategoriaData,
    vendasPorCategoriaStats: estatisticasVendasPorCategoria,
    topClientes: topClientesData,
    topClientesStats: estatisticasTopClientes,
    produtosMaisVendidos: produtosMaisVendidosData,
    produtosMaisVendidosStats: estatisticasProdutosMaisVendidos,
    fluxoCaixa: fluxoCaixaData,
    fluxoCaixaStats: estatisticasFluxoCaixa,
    receitasDespesas: receitasDespesasData,
    receitasDespesasStats: estatisticasReceitasDespesas,
    indicadoresPerformance: indicadoresPerformance,
    tendenciasEAlertas: tendenciasEAlertas,
    analiseCategoriasData: analiseCategoriasData,
    comparacaoPeriodoAnterior: comparacaoPeriodoAnterior,
    ticketMedio: processTicketMedioNovo(filteredData.ordensVenda, dateRange),
    taxaConversao: processTaxaConversaoNovo(filteredData.ordensVenda, reportData.os || [], dateRange)
  };

  // Calcular estatísticas específicas dos novos relatórios
  const estatisticasTicketMedio = calcularEstatisticasTicketMedio(chartData.ticketMedio);
  const estatisticasTaxaConversao = calcularEstatisticasTaxaConversao(chartData.taxaConversao);

  // Adicionar estatísticas ao chartData
  chartData.ticketMedioStats = estatisticasTicketMedio;
  chartData.taxaConversaoStats = estatisticasTaxaConversao;

  console.log('chartData:', chartData);

  // Calcular estatísticas gerais
  const stats = calculateStats(filteredData.ordensVenda, filteredData.financeiro, dateRange);
  console.log('stats:', stats);

  // Relatórios gráficos
  const relatoriosGraficos = [
    {
      id: 'vendas-diarias',
      title: 'Vendas Diárias',
      description: 'Evolução das vendas por dia',
      icon: BarChart3,
      color: 'bg-blue-500',
      type: 'bar'
    },
    {
      id: 'fluxo-caixa',
      title: 'Fluxo de Caixa',
      description: 'Entradas e saídas de dinheiro',
      icon: TrendingUp,
      color: 'bg-green-500',
      type: 'line'
    },
    {
      id: 'produtos-vendidos',
      title: 'Produtos Mais Vendidos',
      description: 'Ranking dos produtos por quantidade',
      icon: Package,
      color: 'bg-purple-500',
      type: 'horizontalBar'
    },
    {
      id: 'categorias-vendas',
      title: 'Vendas por Categoria',
      description: 'Distribuição de vendas por categoria',
      icon: PieChart,
      color: 'bg-orange-500',
      type: 'pie'
    },
    {
      id: 'clientes-top',
      title: 'Top Clientes',
      description: 'Clientes que mais compraram',
      icon: Users,
      color: 'bg-indigo-500',
      type: 'bar'
    },
    {
      id: 'receitas-despesas',
      title: 'Receitas vs Despesas',
      description: 'Comparativo mensal de receitas e despesas',
      icon: DollarSign,
      color: 'bg-emerald-500',
      type: 'composed'
    },
    {
      id: 'ticket-medio',
      title: 'Ticket Médio',
      description: 'Valor médio por venda ao longo do tempo',
      icon: Calculator,
      color: 'bg-cyan-500',
      type: 'line'
    },
    {
      id: 'conversao-vendas',
      title: 'Taxa de Conversão',
      description: 'Percentual de conversão de propostas em vendas',
      icon: Target,
      color: 'bg-pink-500',
      type: 'area'
    }
  ];

  // Relatórios em lista (mais de 50)
  const relatoriosLista = [
    // Relatórios de Vendas
    { id: 'vendas-por-periodo', title: 'Vendas por Período', category: 'Vendas', icon: Calendar, color: 'bg-blue-500' },
    { id: 'vendas-por-cliente', title: 'Vendas por Cliente', category: 'Vendas', icon: Users, color: 'bg-indigo-500' },
    { id: 'vendas-por-produto', title: 'Vendas por Produto', category: 'Vendas', icon: Package, color: 'bg-purple-500' },
    { id: 'vendas-por-categoria', title: 'Vendas por Categoria', category: 'Vendas', icon: Tag, color: 'bg-orange-500' },
    { id: 'vendas-por-vendedor', title: 'Vendas por Vendedor', category: 'Vendas', icon: User, color: 'bg-green-500' },
    { id: 'vendas-por-regiao', title: 'Vendas por Região', category: 'Vendas', icon: MapPin, color: 'bg-red-500' },
    { id: 'vendas-por-canal', title: 'Vendas por Canal', category: 'Vendas', icon: Globe, color: 'bg-cyan-500' },
    { id: 'vendas-por-forma-pagamento', title: 'Vendas por Forma de Pagamento', category: 'Vendas', icon: CreditCard, color: 'bg-yellow-500' },
    { id: 'ticket-medio-cliente', title: 'Ticket Médio por Cliente', category: 'Vendas', icon: Calculator, color: 'bg-pink-500' },
    { id: 'frequencia-compra', title: 'Frequência de Compra', category: 'Vendas', icon: Clock, color: 'bg-teal-500' },

    // Relatórios Financeiros
    { id: 'receitas-periodo', title: 'Receitas por Período', category: 'Financeiro', icon: TrendingUp, color: 'bg-emerald-500' },
    { id: 'despesas-periodo', title: 'Despesas por Período', category: 'Financeiro', icon: TrendingDown, color: 'bg-red-500' },
    { id: 'fluxo-caixa-detalhado', title: 'Fluxo de Caixa Detalhado', category: 'Financeiro', icon: DollarSign, color: 'bg-green-500' },
    { id: 'receitas-despesas', title: 'Receitas vs Despesas', category: 'Financeiro', icon: BarChart3, color: 'bg-indigo-500' },
    { id: 'contas-receber', title: 'Contas a Receber', category: 'Financeiro', icon: Clock, color: 'bg-yellow-500' },
    { id: 'contas-pagar', title: 'Contas a Pagar', category: 'Financeiro', icon: AlertTriangle, color: 'bg-orange-500' },
    { id: 'margem-lucro', title: 'Margem de Lucro', category: 'Financeiro', icon: Target, color: 'bg-purple-500' },
    { id: 'roi-produtos', title: 'ROI por Produto', category: 'Financeiro', icon: BarChart3, color: 'bg-indigo-500' },
    { id: 'custo-venda', title: 'Custo por Venda', category: 'Financeiro', icon: Calculator, color: 'bg-cyan-500' },
    { id: 'lucratividade-categoria', title: 'Lucratividade por Categoria', category: 'Financeiro', icon: PieChart, color: 'bg-pink-500' },
    { id: 'projecao-receitas', title: 'Projeção de Receitas', category: 'Financeiro', icon: TrendingUp, color: 'bg-teal-500' },

    // Relatórios de Estoque
    { id: 'estoque-atual', title: 'Estoque Atual', category: 'Estoque', icon: Package, color: 'bg-blue-500' },
    { id: 'produtos-baixo-estoque', title: 'Produtos com Baixo Estoque', category: 'Estoque', icon: AlertTriangle, color: 'bg-red-500' },
    { id: 'produtos-sem-estoque', title: 'Produtos sem Estoque', category: 'Estoque', icon: X, color: 'bg-red-600' },
    { id: 'movimentacao-estoque', title: 'Movimentação de Estoque', category: 'Estoque', icon: Activity, color: 'bg-green-500' },
    { id: 'giro-estoque', title: 'Giro de Estoque', category: 'Estoque', icon: RefreshCw, color: 'bg-purple-500' },
    { id: 'valor-estoque', title: 'Valor do Estoque', category: 'Estoque', icon: DollarSign, color: 'bg-yellow-500' },
    { id: 'produtos-vencidos', title: 'Produtos Vencidos', category: 'Estoque', icon: Calendar, color: 'bg-orange-500' },
    { id: 'produtos-proximo-vencimento', title: 'Produtos Próximos ao Vencimento', category: 'Estoque', icon: Clock, color: 'bg-yellow-600' },
    { id: 'entradas-estoque', title: 'Entradas de Estoque', category: 'Estoque', icon: ArrowDown, color: 'bg-green-600' },
    { id: 'saidas-estoque', title: 'Saídas de Estoque', category: 'Estoque', icon: ArrowUp, color: 'bg-red-600' },

    // Relatórios de Clientes
    { id: 'clientes-cadastrados', title: 'Clientes Cadastrados', category: 'Clientes', icon: Users, color: 'bg-indigo-500' },
    { id: 'clientes-ativos', title: 'Clientes Ativos', category: 'Clientes', icon: CheckCircle, color: 'bg-green-500' },
    { id: 'clientes-inativos', title: 'Clientes Inativos', category: 'Clientes', icon: X, color: 'bg-red-500' },
    { id: 'novos-clientes', title: 'Novos Clientes', category: 'Clientes', icon: Plus, color: 'bg-blue-500' },
    { id: 'clientes-fidelidade', title: 'Clientes Fidelidade', category: 'Clientes', icon: Star, color: 'bg-yellow-500' },
    { id: 'segmentacao-clientes', title: 'Segmentação de Clientes', category: 'Clientes', icon: Layers, color: 'bg-purple-500' },
    { id: 'satisfacao-clientes', title: 'Satisfação dos Clientes', category: 'Clientes', icon: Heart, color: 'bg-pink-500' },
    { id: 'clientes-potenciais', title: 'Clientes Potenciais', category: 'Clientes', icon: Target, color: 'bg-cyan-500' },
    { id: 'historico-cliente', title: 'Histórico por Cliente', category: 'Clientes', icon: FileText, color: 'bg-teal-500' },
    { id: 'geolocalizacao-clientes', title: 'Geolocalização de Clientes', category: 'Clientes', icon: MapPin, color: 'bg-orange-500' },

    // Relatórios de Produtos
    { id: 'catalogo-produtos', title: 'Catálogo de Produtos', category: 'Produtos', icon: Package, color: 'bg-blue-500' },
    { id: 'produtos-mais-vendidos', title: 'Produtos Mais Vendidos', category: 'Produtos', icon: TrendingUp, color: 'bg-green-500' },
    { id: 'produtos-menos-vendidos', title: 'Produtos Menos Vendidos', category: 'Produtos', icon: TrendingDown, color: 'bg-red-500' },
    { id: 'produtos-lucrativos', title: 'Produtos Mais Lucrativos', category: 'Produtos', icon: DollarSign, color: 'bg-yellow-500' },
    { id: 'produtos-sazonalidade', title: 'Sazonalidade de Produtos', category: 'Produtos', icon: Calendar, color: 'bg-purple-500' },
    { id: 'preco-produtos', title: 'Análise de Preços', category: 'Produtos', icon: Tag, color: 'bg-indigo-500' },
    { id: 'margem-produtos', title: 'Margem por Produto', category: 'Produtos', icon: Calculator, color: 'bg-cyan-500' },
    { id: 'produtos-categoria', title: 'Produtos por Categoria', category: 'Produtos', icon: Layers, color: 'bg-orange-500' },
    { id: 'produtos-fornecedor', title: 'Produtos por Fornecedor', category: 'Produtos', icon: Truck, color: 'bg-teal-500' },
    { id: 'produtos-promocao', title: 'Produtos em Promoção', category: 'Produtos', icon: Zap, color: 'bg-pink-500' },

    // Relatórios de Serviços
    { id: 'ordens-servico', title: 'Ordens de Serviço', category: 'Serviços', icon: FileText, color: 'bg-blue-500' },
    { id: 'servicos-concluidos', title: 'Serviços Concluídos', category: 'Serviços', icon: CheckCircle, color: 'bg-green-500' },
    { id: 'servicos-pendentes', title: 'Serviços Pendentes', category: 'Serviços', icon: Clock, color: 'bg-yellow-500' },
    { id: 'servicos-atrasados', title: 'Serviços Atrasados', category: 'Serviços', icon: AlertTriangle, color: 'bg-red-500' },
    { id: 'tempo-medio-servico', title: 'Tempo Médio de Serviço', category: 'Serviços', icon: Clock, color: 'bg-purple-500' },
    { id: 'servicos-tecnico', title: 'Serviços por Técnico', category: 'Serviços', icon: User, color: 'bg-indigo-500' },
    { id: 'servicos-tipo', title: 'Serviços por Tipo', category: 'Serviços', icon: Tag, color: 'bg-orange-500' },
    { id: 'satisfacao-servicos', title: 'Satisfação dos Serviços', category: 'Serviços', icon: Star, color: 'bg-yellow-500' },
    { id: 'custos-servicos', title: 'Custos dos Serviços', category: 'Serviços', icon: DollarSign, color: 'bg-green-500' },
    { id: 'agendamentos', title: 'Agendamentos', category: 'Serviços', icon: Calendar, color: 'bg-cyan-500' },

    // Relatórios de Performance
    { id: 'performance-vendedores', title: 'Performance dos Vendedores', category: 'Performance', icon: Award, color: 'bg-yellow-600' },
    { id: 'metas-vendas', title: 'Metas de Vendas', category: 'Performance', icon: Target, color: 'bg-purple-500' },
    { id: 'conversao-leads', title: 'Conversão de Leads', category: 'Performance', icon: TrendingUp, color: 'bg-green-500' },
    { id: 'tempo-resposta', title: 'Tempo de Resposta', category: 'Performance', icon: Clock, color: 'bg-blue-500' },
    { id: 'produtividade-equipe', title: 'Produtividade da Equipe', category: 'Performance', icon: Activity, color: 'bg-indigo-500' },
    { id: 'eficiencia-processos', title: 'Eficiência dos Processos', category: 'Performance', icon: Zap, color: 'bg-yellow-500' },
    { id: 'qualidade-atendimento', title: 'Qualidade do Atendimento', category: 'Performance', icon: Star, color: 'bg-pink-500' },
    { id: 'retencao-clientes', title: 'Retenção de Clientes', category: 'Performance', icon: Heart, color: 'bg-red-500' },
    { id: 'crescimento-receita', title: 'Crescimento da Receita', category: 'Performance', icon: TrendingUp, color: 'bg-emerald-500' },
    { id: 'market-share', title: 'Market Share', category: 'Performance', icon: PieChart, color: 'bg-cyan-500' }
  ];

  // Filtrar relatórios baseado nas configurações de personalização
  const relatoriosHabilitados = relatoriosLista.filter(relatorio => {
    // Se não há configurações carregadas, mostrar todos os relatórios
    if (!configuracoes?.relatorios) {
      return true;
    }
    
    // Verificar se o relatório está habilitado nas configurações
    return configuracoes.relatorios[relatorio.id] === true;
  });

  // Função para aplicar período pré-definido
  const aplicarPeriodo = (periodo) => {
    setDateRange({
      from: periodo.from,
      to: periodo.to
    });
    setStartDate(periodo.from);
    setEndDate(periodo.to);
  };

  // Função para gerar relatório
  const gerarRelatorio = async (relatorioId) => {
    setIsLoading(true);
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Relatório gerado!",
        description: "O relatório foi processado com sucesso.",
      });
      
      setSelectedReport(relatorioId);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para renderizar gráfico específico
  const renderChart = (relatorioId) => {
    console.log(`Renderizando gráfico: ${relatorioId}`);
    
    switch (relatorioId) {
      case 'vendas-diarias':
        console.log('Dados para vendas diárias:', chartData.vendasDiarias);
        console.log('Estatísticas vendas diárias:', chartData.vendasDiariasStats);
        
        const { vendasDiariasStats } = chartData;
        
        return (
          <div className="space-y-6">
            {/* Estatísticas Resumidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Vendas</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(vendasDiariasStats.totalVendas)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Quantidade de Vendas</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatNumber(vendasDiariasStats.totalQuantidade)}
                      </p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Ticket Médio</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(vendasDiariasStats.ticketMedio)}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Crescimento Médio</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 flex items-center">
                        {vendasDiariasStats.crescimentoMedio >= 0 ? (
                          <TrendingUp className="h-5 w-5 mr-1 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 mr-1 text-red-500" />
                        )}
                        {Math.abs(vendasDiariasStats.crescimentoMedio).toFixed(1)}%
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações Adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Melhor Dia</p>
                    {vendasDiariasStats.melhorDia ? (
                      <>
                        <p className="text-lg font-bold">{vendasDiariasStats.melhorDia.dataCompleta}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {formatCurrency(vendasDiariasStats.melhorDia.totalVendas)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem dados</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Produtos Vendidos</p>
                    <p className="text-lg font-bold">{formatNumber(vendasDiariasStats.produtosTotais)}</p>
                    <p className="text-sm text-muted-foreground">unidades</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Dias com Vendas</p>
                    <p className="text-lg font-bold">{vendasDiariasStats.diasComVendas}</p>
                    <p className="text-sm text-muted-foreground">
                      de {vendasDiariasStats.diasAnalisados} dias
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Vendas Diárias
                </CardTitle>
                <CardDescription>
                  Evolução das vendas por dia no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
          <BarChartComponent
            data={chartData.vendasDiarias}
                  title=""
                  description=""
            xKey="data"
            yKey="totalVendas"
            color="#3B82F6"
            formatter={formatCurrency}
                  height={400}
                />
              </CardContent>
            </Card>

            {/* Gráfico de Quantidade de Vendas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  Quantidade de Vendas por Dia
                </CardTitle>
                <CardDescription>
                  Número de transações realizadas por dia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  data={chartData.vendasDiarias}
                  title=""
                  description=""
                  xKey="data"
                  yKey="quantidadeVendas"
                  color="#10B981"
                  formatter={formatNumber}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        );
      
      case 'fluxo-caixa':
        console.log('Dados para fluxo de caixa:', chartData.fluxoCaixa);
        console.log('Estatísticas fluxo de caixa:', chartData.fluxoCaixaStats);
        
        const { fluxoCaixaStats } = chartData;
        
        return (
          <div className="space-y-6">
            {/* Estatísticas Resumidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Entradas</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(fluxoCaixaStats.totalEntradas)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Saídas</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                        {formatCurrency(fluxoCaixaStats.totalSaidas)}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-r ${fluxoCaixaStats.saldoFinal >= 0 ? 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800' : 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${fluxoCaixaStats.saldoFinal >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Saldo Final</p>
                      <p className={`text-2xl font-bold ${fluxoCaixaStats.saldoFinal >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-orange-900 dark:text-orange-100'}`}>
                        {formatCurrency(fluxoCaixaStats.saldoFinal)}
                      </p>
                    </div>
                    <DollarSign className={`h-8 w-8 ${fluxoCaixaStats.saldoFinal >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Dias Positivos</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {fluxoCaixaStats.diasPositivos}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações dos Melhores/Piores Dias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Melhor Dia</p>
                    {fluxoCaixaStats.melhorDia ? (
                      <>
                        <p className="text-lg font-bold">{fluxoCaixaStats.melhorDia.dataCompleta}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {formatCurrency(fluxoCaixaStats.melhorDia.saldo)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Entradas: {formatCurrency(fluxoCaixaStats.melhorDia.entradas)} • 
                          Saídas: {formatCurrency(fluxoCaixaStats.melhorDia.saidas)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem dados</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <TrendingDown className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Pior Dia</p>
                    {fluxoCaixaStats.piorDia ? (
                      <>
                        <p className="text-lg font-bold">{fluxoCaixaStats.piorDia.dataCompleta}</p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {formatCurrency(fluxoCaixaStats.piorDia.saldo)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Entradas: {formatCurrency(fluxoCaixaStats.piorDia.entradas)} • 
                          Saídas: {formatCurrency(fluxoCaixaStats.piorDia.saidas)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem dados</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Principal - Fluxo de Caixa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Fluxo de Caixa Diário
                </CardTitle>
                <CardDescription>
                  Entradas, saídas e saldo acumulado por dia
                </CardDescription>
              </CardHeader>
              <CardContent>
          <ComposedChartComponent
                  data={formatarDadosFluxoCaixa(chartData.fluxoCaixa, 'composed')}
                  title=""
                  description=""
            xKey="data"
            bars={[
              { dataKey: 'entradas', name: 'Entradas', color: '#10B981' },
              { dataKey: 'saidas', name: 'Saídas', color: '#EF4444' }
            ]}
            lines={[
                    { dataKey: 'saldoAcumulado', name: 'Saldo Acumulado', color: '#3B82F6' }
            ]}
            formatter={formatCurrency}
                  height={400}
                />
              </CardContent>
            </Card>

            {/* Gráfico de Linha - Saldo Diário */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  Evolução do Saldo
                </CardTitle>
                <CardDescription>
                  Saldo diário e saldo acumulado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LineChartComponent
                  data={formatarDadosFluxoCaixa(chartData.fluxoCaixa, 'line')}
                  title=""
                  description=""
                  xKey="data"
                  lines={[
                    { dataKey: 'saldo', name: 'Saldo Diário', color: '#8B5CF6' },
                    { dataKey: 'saldoAcumulado', name: 'Saldo Acumulado', color: '#3B82F6' }
                  ]}
                  formatter={formatCurrency}
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Detalhamento Diário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Data</th>
                        <th className="text-right p-2">Entradas</th>
                        <th className="text-right p-2">Saídas</th>
                        <th className="text-right p-2">Saldo Dia</th>
                        <th className="text-right p-2">Saldo Acumulado</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.fluxoCaixa.slice(0, 15).map((dia, index) => (
                        <tr key={dia.dataISO} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{dia.dataCompleta}</p>
                                <p className="text-xs text-muted-foreground">{dia.data}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-right p-2 font-semibold text-green-600">
                            {formatCurrency(dia.entradas)}
                          </td>
                          <td className="text-right p-2 font-semibold text-red-600">
                            {formatCurrency(dia.saidas)}
                          </td>
                          <td className={`text-right p-2 font-semibold ${dia.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {formatCurrency(dia.saldo)}
                          </td>
                          <td className={`text-right p-2 font-semibold ${dia.saldoAcumulado >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(dia.saldoAcumulado)}
                          </td>
                          <td className="text-center p-2">
                            <Badge 
                              className={`text-xs ${
                                dia.saldo > 0 ? 'bg-green-500 text-white' :
                                dia.saldo < 0 ? 'bg-red-500 text-white' :
                                'bg-gray-500 text-white'
                              }`}
                            >
                              {dia.saldo > 0 ? 'Positivo' : dia.saldo < 0 ? 'Negativo' : 'Neutro'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'produtos-vendidos':
        console.log('Dados para produtos mais vendidos:', chartData.produtosMaisVendidos);
        console.log('Estatísticas produtos mais vendidos:', chartData.produtosMaisVendidosStats);
        
        const { produtosMaisVendidosStats } = chartData;
        
        return (
          <div className="space-y-6">
            {/* Estatísticas Resumidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Total de Produtos</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatNumber(produtosMaisVendidosStats.totalProdutos)}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Qtd. Total Vendida</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatNumber(produtosMaisVendidosStats.quantidadeTotalVendida)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Valor Total</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(produtosMaisVendidosStats.valorTotalVendas)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Preço Médio</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {formatCurrency(produtosMaisVendidosStats.precoMedioGeral)}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações dos Produtos Top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Produto Mais Vendido</p>
                    {produtosMaisVendidosStats.produtoMaisVendido ? (
                      <>
                        <p className="text-lg font-bold">{produtosMaisVendidosStats.produtoMaisVendido.nome}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {formatNumber(produtosMaisVendidosStats.produtoMaisVendido.quantidadeVendida)} unidades
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(produtosMaisVendidosStats.produtoMaisVendido.valorTotalVendas)} • 
                          {produtosMaisVendidosStats.produtoMaisVendido.numeroVendas} vendas
                        </p>
                        {produtosMaisVendidosStats.produtoMaisVendido.categoria && (
                          <Badge className="mt-1 bg-green-500 text-white">
                            {produtosMaisVendidosStats.produtoMaisVendido.categoria}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem dados</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Estatísticas Gerais</p>
                    <div className="space-y-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Cadastrados:</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {produtosMaisVendidosStats.produtosCadastrados}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-orange-600">Manuais:</span>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          {produtosMaisVendidosStats.produtosManuais}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600">Categorias:</span>
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          {produtosMaisVendidosStats.categorias}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-600">Total Vendas:</span>
                        <Badge variant="outline" className="text-purple-600 border-purple-600">
                          {formatNumber(produtosMaisVendidosStats.totalVendas)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Barras Horizontais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top 10 Produtos por Quantidade
                </CardTitle>
                <CardDescription>
                  Ranking dos produtos mais vendidos em unidades
                </CardDescription>
              </CardHeader>
              <CardContent>
          <BarChartComponent
                  data={formatarDadosProdutos(chartData.produtosMaisVendidos, 'bar', 10)}
                  title=""
                  description=""
            xKey="nome"
                  yKey="quantidadeVendida"
                  color="#10B981"
            formatter={formatNumber}
                  height={400}
                />
              </CardContent>
            </Card>

            {/* Gráfico de Pizza */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição de Vendas por Produto
                </CardTitle>
                <CardDescription>
                  Participação dos top 8 produtos nas vendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PieChartComponent
                  data={formatarDadosProdutos(chartData.produtosMaisVendidos, 'pie', 8)}
                  title=""
                  description=""
                  nameKey="name"
                  valueKey="value"
                  formatter={formatNumber}
                  height={400}
                />
              </CardContent>
            </Card>

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Detalhamento dos Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Produto</th>
                        <th className="text-right p-2">Qtd. Vendida</th>
                        <th className="text-right p-2">Valor Total</th>
                        <th className="text-right p-2">Nº Vendas</th>
                        <th className="text-right p-2">Preço Médio</th>
                        <th className="text-center p-2">Última Venda</th>
                        <th className="text-center p-2">Performance</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.produtosMaisVendidos.slice(0, 15).map((produto, index) => {
                        const diasUltimaVenda = diasDesdeUltimaVenda(produto.ultimaVenda);
                        const performance = calcularPerformance(produto);
                        
                        return (
                          <tr key={produto.produtoId} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{produto.nome}</p>
                                  {produto.codigo && (
                                    <p className="text-xs text-muted-foreground">Cód: {produto.codigo}</p>
                                  )}
                                  {produto.categoria && produto.categoria !== 'Sem categoria' && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {produto.categoria}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-right p-2 font-semibold text-green-600">
                              {formatNumber(produto.quantidadeVendida)}
                            </td>
                            <td className="text-right p-2 font-semibold text-purple-600">
                              {formatCurrency(produto.valorTotalVendas)}
                            </td>
                            <td className="text-right p-2">
                              {formatNumber(produto.numeroVendas)}
                            </td>
                            <td className="text-right p-2">
                              {formatCurrency(produto.precoMedio)}
                            </td>
                            <td className="text-center p-2">
                              {produto.ultimaVenda ? (
                                <div>
                                  <p className="text-xs">{formatDate(produto.ultimaVenda)}</p>
                                  {diasUltimaVenda && (
                                    <p className="text-xs text-muted-foreground">
                                      {diasUltimaVenda} dias atrás
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </td>
                            <td className="text-center p-2">
                              <Badge 
                                className={`text-xs ${
                                  performance === 'Excelente' ? 'bg-green-500 text-white' :
                                  performance === 'Boa' ? 'bg-blue-500 text-white' :
                                  performance === 'Regular' ? 'bg-yellow-500 text-white' :
                                  performance === 'Baixa' ? 'bg-orange-500 text-white' :
                                  'bg-red-500 text-white'
                                }`}
                              >
                                {performance}
                              </Badge>
                            </td>
                            <td className="text-center p-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  produto.statusProduto === 'cadastrado' 
                                    ? 'text-green-600 border-green-600' 
                                    : 'text-orange-600 border-orange-600'
                                }`}
                              >
                                {produto.statusProduto === 'cadastrado' ? 'Cadastrado' : 'Manual'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'categorias-vendas':
        console.log('Dados para vendas por categoria:', chartData.vendasPorCategoria);
        console.log('Estatísticas vendas por categoria:', chartData.vendasPorCategoriaStats);
        
        const { vendasPorCategoriaStats } = chartData;
        
        return (
          <div className="space-y-6">
            {/* Estatísticas Resumidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Vendas</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(vendasPorCategoriaStats.totalVendas)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Categorias Ativas</p>
                      <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                        {vendasPorCategoriaStats.numeroCategoriasComVendas}
                      </p>
                    </div>
                    <Tag className="h-8 w-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Produtos Vendidos</p>
                      <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                        {formatNumber(vendasPorCategoriaStats.totalQuantidade)}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Ticket Médio/Cat.</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {formatCurrency(vendasPorCategoriaStats.ticketMedioPorCategoria)}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações das Categorias Top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Categoria Mais Vendida</p>
                    {vendasPorCategoriaStats.categoriasMaisVendidas ? (
                      <>
                        <p className="text-lg font-bold">{vendasPorCategoriaStats.categoriasMaisVendidas.categoria}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {formatCurrency(vendasPorCategoriaStats.categoriasMaisVendidas.valorTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vendasPorCategoriaStats.categoriasMaisVendidas.quantidade} produtos vendidos
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem dados</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Layers className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Categoria Menos Vendida</p>
                    {vendasPorCategoriaStats.categoriaMenosVendida ? (
                      <>
                        <p className="text-lg font-bold">{vendasPorCategoriaStats.categoriaMenosVendida.categoria}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {formatCurrency(vendasPorCategoriaStats.categoriaMenosVendida.valorTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vendasPorCategoriaStats.categoriaMenosVendida.quantidade} produtos vendidos
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem dados</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Pizza */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição de Vendas por Categoria
                </CardTitle>
                <CardDescription>
                  Percentual de vendas por categoria de produtos
                </CardDescription>
              </CardHeader>
              <CardContent>
          <PieChartComponent
                  data={formatarDadosCategoria(chartData.vendasPorCategoria, 'pie')}
                  title=""
                  description=""
                  nameKey="name"
                  valueKey="value"
            formatter={formatCurrency}
                  height={400}
                />
              </CardContent>
            </Card>

            {/* Gráfico de Barras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ranking de Vendas por Categoria
                </CardTitle>
                <CardDescription>
                  Comparativo de valores vendidos por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  data={formatarDadosCategoria(chartData.vendasPorCategoria, 'bar')}
                  title=""
                  description=""
                  xKey="categoria"
                  yKey="valorTotal"
                  color="#8B5CF6"
                  formatter={formatCurrency}
                  height={350}
                />
              </CardContent>
            </Card>

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Detalhamento por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Categoria</th>
                        <th className="text-right p-2">Valor Total</th>
                        <th className="text-right p-2">Qtd. Produtos</th>
                        <th className="text-right p-2">Nº Ordens</th>
                        <th className="text-right p-2">Participação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.vendasPorCategoria.map((categoria, index) => {
                        const participacao = vendasPorCategoriaStats.totalVendas > 0 
                          ? ((categoria.valorTotal / vendasPorCategoriaStats.totalVendas) * 100).toFixed(1)
                          : '0';
                        
                        return (
                          <tr key={categoria.categoriaId} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: categoria.cor }}
                                ></div>
                                <span className="font-medium">{categoria.categoria}</span>
                              </div>
                            </td>
                            <td className="text-right p-2 font-semibold text-green-600">
                              {formatCurrency(categoria.valorTotal)}
                            </td>
                            <td className="text-right p-2">
                              {formatNumber(categoria.quantidade)}
                            </td>
                            <td className="text-right p-2">
                              {categoria.ordensCount}
                            </td>
                            <td className="text-right p-2">
                              <Badge variant="outline">
                                {participacao}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'clientes-top':
        console.log('Dados para top clientes:', chartData.topClientes);
        console.log('Estatísticas top clientes:', chartData.topClientesStats);
        
        const { topClientesStats } = chartData;
        
        return (
          <div className="space-y-6">
            {/* Estatísticas Resumidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Clientes</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatNumber(topClientesStats.totalClientes)}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Vendas</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(topClientesStats.totalVendas)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Ticket Médio Geral</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(topClientesStats.ticketMedioGeral)}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Clientes VIP</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                        {formatNumber(topClientesStats.clientesVIP)}
                      </p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações dos Clientes Top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Cliente Mais Valioso</p>
                    {topClientesStats.clientesMaisValiosos ? (
                      <>
                        <p className="text-lg font-bold">{topClientesStats.clientesMaisValiosos.nome}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {formatCurrency(topClientesStats.clientesMaisValiosos.valorTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {topClientesStats.clientesMaisValiosos.quantidadeOrdens} ordens • 
                          Ticket médio: {formatCurrency(topClientesStats.clientesMaisValiosos.ticketMedio)}
                        </p>
                        {topClientesStats.clientesMaisValiosos.categoria === 'vip' && (
                          <Badge className="mt-1 bg-yellow-500 text-white">VIP</Badge>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem dados</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Status dos Clientes</p>
                    <div className="space-y-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Cadastrados:</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {topClientesStats.clientesCadastrados}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-orange-600">Não Cadastrados:</span>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          {topClientesStats.clientesNaoCadastrados}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-yellow-600">VIP:</span>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          {topClientesStats.clientesVIP}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Barras Horizontais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top 10 Clientes por Valor
                </CardTitle>
                <CardDescription>
                  Ranking dos clientes que mais compraram
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const dadosGrafico = formatarDadosClientes(chartData.topClientes, 'horizontal', 10);
                  console.log('=== DEBUG TOP CLIENTES GRÁFICO ===');
                  console.log('Dados originais:', chartData.topClientes);
                  console.log('Dados formatados para gráfico:', dadosGrafico);
                  console.log('Quantidade de clientes:', dadosGrafico.length);
                  
                  if (dadosGrafico.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Users className="h-16 w-16 text-gray-400 mb-4" />
                        <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                          Nenhum cliente encontrado
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          Não há dados de vendas para o período selecionado
                        </p>
                      </div>
                    );
                  }
                  
        return (
          <BarChartComponent
                      data={dadosGrafico}
                      title=""
                      description=""
            xKey="nome"
            yKey="valorTotal"
            color="#6366F1"
            formatter={formatCurrency}
                      height={400}
                    />
                  );
                })()}
              </CardContent>
            </Card>

            {/* Gráfico de Pizza */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição de Vendas por Cliente
                </CardTitle>
                <CardDescription>
                  Participação dos top 8 clientes no faturamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PieChartComponent
                  data={formatarDadosClientes(chartData.topClientes, 'pie', 8)}
                  title=""
                  description=""
                  nameKey="name"
                  valueKey="value"
            formatter={formatCurrency}
                  height={400}
                />
              </CardContent>
            </Card>

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Detalhamento dos Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Cliente</th>
                        <th className="text-right p-2">Valor Total</th>
                        <th className="text-right p-2">Nº Ordens</th>
                        <th className="text-right p-2">Ticket Médio</th>
                        <th className="text-right p-2">Produtos</th>
                        <th className="text-center p-2">Última Compra</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.topClientes.slice(0, 15).map((cliente, index) => {
                        const diasUltimaCompra = diasDesdeUltimaCompra(cliente.ultimaCompra);
                        
                        return (
                          <tr key={cliente.clienteId} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{cliente.nome}</p>
                                  {cliente.telefone && (
                                    <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-right p-2 font-semibold text-green-600">
                              {formatCurrency(cliente.valorTotal)}
                            </td>
                            <td className="text-right p-2">
                              {formatNumber(cliente.quantidadeOrdens)}
                            </td>
                            <td className="text-right p-2">
                              {formatCurrency(cliente.ticketMedio)}
                            </td>
                            <td className="text-right p-2">
                              {formatNumber(cliente.produtosComprados)}
                            </td>
                            <td className="text-center p-2">
                              {cliente.ultimaCompra ? (
                                <div>
                                  <p className="text-xs">{formatDate(cliente.ultimaCompra)}</p>
                                  {diasUltimaCompra && (
                                    <p className="text-xs text-muted-foreground">
                                      {diasUltimaCompra} dias atrás
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </td>
                            <td className="text-center p-2">
                              <div className="flex flex-col gap-1">
                                {cliente.categoria === 'vip' && (
                                  <Badge className="bg-yellow-500 text-white text-xs">VIP</Badge>
                                )}
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    cliente.statusCliente === 'cadastrado' 
                                      ? 'text-green-600 border-green-600' 
                                      : 'text-orange-600 border-orange-600'
                                  }`}
                                >
                                  {cliente.statusCliente === 'cadastrado' ? 'Cadastrado' : 'Não Cadastrado'}
                                </Badge>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'ticket-medio':
        const { ticketMedioStats } = chartData;
        return (
          <div className="space-y-6">
            {/* Cards de Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-cyan-700 dark:text-cyan-300 flex items-center">
                    <Calculator className="h-4 w-4 mr-2" />
                    Ticket Médio Geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                    {formatCurrency(ticketMedioStats?.ticketMedioGeral || 0)}
                  </div>
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                    Valor médio por venda
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Total de Vendas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(ticketMedioStats?.totalVendas || 0)}
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatNumber(ticketMedioStats?.quantidadeTotalVendas || 0)} vendas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Maior Ticket
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {formatCurrency(ticketMedioStats?.maiorTicket || 0)}
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Ticket médio mais alto
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Crescimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(ticketMedioStats?.crescimentoTicket || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(ticketMedioStats?.crescimentoTicket || 0) >= 0 ? '+' : ''}{(ticketMedioStats?.crescimentoTicket || 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Primeira vs última semana
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Cards de Informações Adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Melhor Dia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {ticketMedioStats?.melhorDia?.dataCompleta || 'N/A'}
                  </div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(ticketMedioStats?.melhorDia?.ticketMedio || 0)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {ticketMedioStats?.melhorDia?.quantidadeVendas || 0} vendas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Produtos Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatNumber(ticketMedioStats?.totalProdutosVendidos || 0)}
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {formatCurrency(ticketMedioStats?.ticketMedioPorProduto || 0)} por produto
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Ticket médio por produto
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dias com Vendas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {ticketMedioStats?.diasComVendas || 0}
                  </div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {formatCurrency(ticketMedioStats?.ticketMedioMedio || 0)} médio/dia
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Ticket médio dos dias ativos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                  <LineChart className="h-5 w-5 mr-2 text-cyan-500" />
                  Evolução do Ticket Médio
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Valor médio por venda ao longo do tempo
                </p>
              </CardHeader>
              <CardContent>
                <LineChartComponent
                  data={formatarDadosTicketMedio(chartData.ticketMedio, 'line')}
                  title=""
                  description=""
                  xKey="name"
                  yKey="value"
                  color="#06B6D4"
                  formatter={formatCurrency}
                />
              </CardContent>
            </Card>

            {/* Gráfico de Barras para Comparação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                  <BarChart3 className="h-5 w-5 mr-2 text-cyan-500" />
                  Ticket Médio por Período
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Comparação do ticket médio apenas nos dias com vendas
                </p>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  data={formatarDadosTicketMedio(chartData.ticketMedio, 'bar')}
                  title=""
                  description=""
                  xKey="name"
                  yKey="value"
                  color="#06B6D4"
                  formatter={formatCurrency}
                />
              </CardContent>
            </Card>
          </div>
        );
      
      case 'conversao-vendas':
        const { taxaConversaoStats } = chartData;
        return (
          <div className="space-y-6">
            {/* Cards de Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-pink-700 dark:text-pink-300 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                    {(taxaConversaoStats?.taxaConversaoMedia || 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                    Taxa média geral
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Vendas Concluídas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {formatNumber(taxaConversaoStats?.totalVendasConcluidas || 0)}
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(taxaConversaoStats?.valorTotalVendas || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Total Oportunidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatNumber(taxaConversaoStats?.totalOportunidades || 0)}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    OV + OS criadas
                  </p>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-br ${
                taxaConversaoStats?.eficienciaConversao === 'Excelente' ? 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-700' :
                taxaConversaoStats?.eficienciaConversao === 'Boa' ? 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700' :
                taxaConversaoStats?.eficienciaConversao === 'Regular' ? 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700' :
                'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-700'
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-medium flex items-center ${
                    taxaConversaoStats?.eficienciaConversao === 'Excelente' ? 'text-emerald-700 dark:text-emerald-300' :
                    taxaConversaoStats?.eficienciaConversao === 'Boa' ? 'text-blue-700 dark:text-blue-300' :
                    taxaConversaoStats?.eficienciaConversao === 'Regular' ? 'text-yellow-700 dark:text-yellow-300' :
                    'text-red-700 dark:text-red-300'
                  }`}>
                    <Activity className="h-4 w-4 mr-2" />
                    Eficiência
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    taxaConversaoStats?.eficienciaConversao === 'Excelente' ? 'text-emerald-900 dark:text-emerald-100' :
                    taxaConversaoStats?.eficienciaConversao === 'Boa' ? 'text-blue-900 dark:text-blue-100' :
                    taxaConversaoStats?.eficienciaConversao === 'Regular' ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-red-900 dark:text-red-100'
                  }`}>
                    {taxaConversaoStats?.eficienciaConversao || 'N/A'}
                  </div>
                  <p className={`text-xs mt-1 ${
                    taxaConversaoStats?.eficienciaConversao === 'Excelente' ? 'text-emerald-600 dark:text-emerald-400' :
                    taxaConversaoStats?.eficienciaConversao === 'Boa' ? 'text-blue-600 dark:text-blue-400' :
                    taxaConversaoStats?.eficienciaConversao === 'Regular' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    Classificação geral
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Cards de Informações Adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Melhor Dia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {taxaConversaoStats?.melhorDia?.dataCompleta || 'N/A'}
                  </div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {(taxaConversaoStats?.melhorDia?.taxaConversao || 0).toFixed(1)}% conversão
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {taxaConversaoStats?.melhorDia?.vendasConcluidas || 0}/{taxaConversaoStats?.melhorDia?.totalOportunidades || 0} oportunidades
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Valor Médio por Venda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(taxaConversaoStats?.valorMedioPorVenda || 0)}
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Por venda concluída
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Ticket médio das conversões
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Tendência
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-lg font-bold ${(taxaConversaoStats?.tendenciaConversao || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(taxaConversaoStats?.tendenciaConversao || 0) >= 0 ? '+' : ''}{(taxaConversaoStats?.tendenciaConversao || 0).toFixed(1)}%
                  </div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Primeira vs última semana
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {taxaConversaoStats?.diasComOportunidades || 0} dias com atividade
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Breakdown de Oportunidades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                  <PieChart className="h-5 w-5 mr-2 text-pink-500" />
                  Breakdown de Oportunidades
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Distribuição entre Ordens de Venda (OV) e Ordens de Serviço (OS)
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatNumber(taxaConversaoStats?.totalOV || 0)}
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Ordens de Venda</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {formatNumber(taxaConversaoStats?.totalOS || 0)}
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">Ordens de Serviço</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatNumber(taxaConversaoStats?.totalVendasConcluidas || 0)}
                    </div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">Convertidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                  <AreaChart className="h-5 w-5 mr-2 text-pink-500" />
                  Evolução da Taxa de Conversão
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Percentual de conversão de oportunidades em vendas ao longo do tempo
                </p>
              </CardHeader>
              <CardContent>
                <AreaChartComponent
                  data={formatarDadosTaxaConversao(chartData.taxaConversao, 'area')}
                  title=""
                  description=""
                  xKey="name"
                  yKey="value"
                  color="#EC4899"
                  formatter={(value) => `${(value || 0).toFixed(1)}%`}
                />
              </CardContent>
            </Card>

            {/* Gráfico Composto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                  <BarChart3 className="h-5 w-5 mr-2 text-pink-500" />
                  Oportunidades vs Conversões
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Comparação entre total de oportunidades e vendas convertidas
                </p>
              </CardHeader>
              <CardContent>
                <ComposedChartComponent
                  data={formatarDadosTaxaConversao(chartData.taxaConversao, 'composed')}
                  title=""
                  description=""
                  xKey="name"
                  yKey1="oportunidades"
                  yKey2="vendas"
                  lineKey="taxaConversao"
                  color1="#3B82F6"
                  color2="#10B981"
                  lineColor="#EC4899"
                  formatter1={formatNumber}
                  formatter2={formatNumber}
                  lineFormatter={(value) => `${(value || 0).toFixed(1)}%`}
                />
              </CardContent>
            </Card>
          </div>
        );
      
      case 'receitas-despesas':
      console.log('Renderizando gráfico: receitas-despesas');
      console.log('Dados para receitas vs despesas:', chartData.receitasDespesas);
      console.log('Estatísticas receitas vs despesas:', chartData.receitasDespesasStats);
      console.log('Indicadores de performance:', chartData.indicadoresPerformance);

        return (
        <div className="space-y-6">
          {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(chartData.receitasDespesasStats.totalReceitas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Média: {formatCurrency(chartData.receitasDespesasStats.receitaMedia)}/mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(chartData.receitasDespesasStats.totalDespesas)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Média: {formatCurrency(chartData.receitasDespesasStats.despesaMedia)}/mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
                <DollarSign className={`h-4 w-4 ${chartData.receitasDespesasStats.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${chartData.receitasDespesasStats.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(chartData.receitasDespesasStats.saldoLiquido)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Margem: {chartData.receitasDespesasStats.margemLiquidaMedia.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Target className="h-4 w-4" style={{ color: chartData.indicadoresPerformance.cor }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: chartData.indicadoresPerformance.cor }}>
                  {chartData.indicadoresPerformance.performance}
                </div>
                <p className="text-xs text-muted-foreground">
                  Eficiência: {chartData.indicadoresPerformance.eficienciaFinanceira.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Seção de Alertas e Tendências */}
          {chartData.tendenciasEAlertas.alertas.length > 0 && (
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Alertas Financeiros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chartData.tendenciasEAlertas.alertas.map((alerta, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div 
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: alerta.cor }}
                      ></div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: alerta.cor }}>
                          {alerta.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alerta.descricao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cards de Tendências */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tendência Receitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`text-lg font-bold ${
                    chartData.tendenciasEAlertas.tendenciaReceitas === 'Crescente' ? 'text-green-600' :
                    chartData.tendenciasEAlertas.tendenciaReceitas === 'Decrescente' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {chartData.tendenciasEAlertas.tendenciaReceitas}
                  </div>
                  {chartData.tendenciasEAlertas.tendenciaReceitas === 'Crescente' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {chartData.tendenciasEAlertas.tendenciaReceitas === 'Decrescente' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  {chartData.tendenciasEAlertas.tendenciaReceitas === 'Estável' && <Minus className="h-4 w-4 text-gray-600" />}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Tendência Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`text-lg font-bold ${
                    chartData.tendenciasEAlertas.tendenciaDespesas === 'Crescente' ? 'text-red-600' :
                    chartData.tendenciasEAlertas.tendenciaDespesas === 'Decrescente' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {chartData.tendenciasEAlertas.tendenciaDespesas}
                  </div>
                  {chartData.tendenciasEAlertas.tendenciaDespesas === 'Crescente' && <TrendingUp className="h-4 w-4 text-red-600" />}
                  {chartData.tendenciasEAlertas.tendenciaDespesas === 'Decrescente' && <TrendingDown className="h-4 w-4 text-green-600" />}
                  {chartData.tendenciasEAlertas.tendenciaDespesas === 'Estável' && <Minus className="h-4 w-4 text-gray-600" />}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Situação Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${
                  chartData.tendenciasEAlertas.situacaoFinanceira === 'Excelente' ? 'text-green-600' :
                  chartData.tendenciasEAlertas.situacaoFinanceira === 'Boa' ? 'text-blue-600' :
                  chartData.tendenciasEAlertas.situacaoFinanceira === 'Crítica' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {chartData.tendenciasEAlertas.situacaoFinanceira}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparação com Período Anterior */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Comparação com Período Anterior
              </CardTitle>
              <CardDescription>
                Período anterior: {chartData.comparacaoPeriodoAnterior.periodoAnterior.inicio} a {chartData.comparacaoPeriodoAnterior.periodoAnterior.fim}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Variação Receitas</p>
                  <p className={`text-2xl font-bold ${
                    chartData.comparacaoPeriodoAnterior.variacoes.receitas >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {chartData.comparacaoPeriodoAnterior.variacoes.receitas >= 0 ? '+' : ''}
                    {chartData.comparacaoPeriodoAnterior.variacoes.receitas.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Variação Despesas</p>
                  <p className={`text-2xl font-bold ${
                    chartData.comparacaoPeriodoAnterior.variacoes.despesas <= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {chartData.comparacaoPeriodoAnterior.variacoes.despesas >= 0 ? '+' : ''}
                    {chartData.comparacaoPeriodoAnterior.variacoes.despesas.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Variação Saldo</p>
                  <p className={`text-2xl font-bold ${
                    chartData.comparacaoPeriodoAnterior.variacoes.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {chartData.comparacaoPeriodoAnterior.variacoes.saldo >= 0 ? '+' : ''}
                    {chartData.comparacaoPeriodoAnterior.variacoes.saldo.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projeção do Próximo Mês */}
          {chartData.tendenciasEAlertas.projecaoProximoMes && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Projeção Próximo Mês
                </CardTitle>
                <CardDescription>
                  Baseado na média dos últimos meses (Confiança: {chartData.tendenciasEAlertas.projecaoProximoMes.confianca})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Receitas Previstas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(chartData.tendenciasEAlertas.projecaoProximoMes.receitas)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Despesas Previstas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(chartData.tendenciasEAlertas.projecaoProximoMes.despesas)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Saldo Previsto</p>
                    <p className={`text-2xl font-bold ${
                      chartData.tendenciasEAlertas.projecaoProximoMes.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(chartData.tendenciasEAlertas.projecaoProximoMes.saldoLiquido)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cards de Informações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Melhor Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.receitasDespesasStats.melhorMes ? (
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {chartData.receitasDespesasStats.melhorMes.mesCompleto}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Saldo: {formatCurrency(chartData.receitasDespesasStats.melhorMes.saldoLiquido)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Receitas: {formatCurrency(chartData.receitasDespesasStats.melhorMes.receitas)} | 
                      Despesas: {formatCurrency(chartData.receitasDespesasStats.melhorMes.despesas)}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sem dados</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Estatísticas Gerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Meses Positivos:</span>
                    <span className="text-sm font-semibold text-green-600">
                      {chartData.receitasDespesasStats.mesesPositivos}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Meses Negativos:</span>
                    <span className="text-sm font-semibold text-red-600">
                      {chartData.receitasDespesasStats.mesesNegativos}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Crescimento Receitas:</span>
                    <span className={`text-sm font-semibold ${chartData.receitasDespesasStats.crescimentoReceitas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {chartData.receitasDespesasStats.crescimentoReceitas >= 0 ? '+' : ''}{chartData.receitasDespesasStats.crescimentoReceitas.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Crescimento Despesas:</span>
                    <span className={`text-sm font-semibold ${chartData.receitasDespesasStats.crescimentoDespesas <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {chartData.receitasDespesasStats.crescimentoDespesas >= 0 ? '+' : ''}{chartData.receitasDespesasStats.crescimentoDespesas.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico do Saldo Líquido - DESTAQUE PRINCIPAL */}
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardTitle className="text-2xl flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-blue-600" />
                Evolução do Saldo Líquido
              </CardTitle>
              <CardDescription className="text-base">
                Acompanhe a evolução do seu saldo mês a mês - o que realmente importa!
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <LineChartComponent
                data={formatarDadosReceitasDespesas(chartData.receitasDespesas, 'line')}
                title=""
                description=""
                xKey="mes"
                lines={[
                  { 
                    dataKey: 'saldoLiquido', 
                    name: 'Saldo Líquido', 
                    color: '#3B82F6',
                    strokeWidth: 4
                  }
                ]}
                formatter={formatCurrency}
                height={350}
              />
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Saldo Atual</p>
                    <p className={`text-3xl font-bold ${
                      chartData.receitasDespesasStats.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(chartData.receitasDespesasStats.saldoLiquido)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Tendência</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${
                        chartData.tendenciasEAlertas.tendenciaSaldo === 'Melhorando' ? 'text-green-600' :
                        chartData.tendenciasEAlertas.tendenciaSaldo === 'Piorando' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {chartData.tendenciasEAlertas.tendenciaSaldo}
                      </span>
                      {chartData.tendenciasEAlertas.tendenciaSaldo === 'Melhorando' && <TrendingUp className="h-5 w-5 text-green-600" />}
                      {chartData.tendenciasEAlertas.tendenciaSaldo === 'Piorando' && <TrendingDown className="h-5 w-5 text-red-600" />}
                      {chartData.tendenciasEAlertas.tendenciaSaldo === 'Estável' && <Minus className="h-5 w-5 text-gray-600" />}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico Comparativo Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
                Receitas vs Despesas por Mês
              </CardTitle>
              <CardDescription>
                Comparativo mensal de receitas e despesas
              </CardDescription>
            </CardHeader>
            <CardContent>
          <ComposedChartComponent
                data={formatarDadosReceitasDespesas(chartData.receitasDespesas, 'composed')}
                title=""
                description=""
            xKey="mes"
            bars={[
              { dataKey: 'receitas', name: 'Receitas', color: '#10B981' },
              { dataKey: 'despesas', name: 'Despesas', color: '#EF4444' }
            ]}
            lines={[
                  { dataKey: 'saldo', name: 'Saldo Líquido', color: '#8B5CF6' }
            ]}
            formatter={formatCurrency}
                height={400}
              />
            </CardContent>
          </Card>

          {/* Gráficos de Pizza */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-green-600" />
                  Distribuição de Receitas
                </CardTitle>
                <CardDescription>
                  Receitas por mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PieChartComponent
                  data={formatarDadosReceitasDespesas(chartData.receitasDespesas, 'pie-receitas')}
                  title=""
                  description=""
            formatter={formatCurrency}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-red-600" />
                  Distribuição de Despesas
                </CardTitle>
                <CardDescription>
                  Despesas por mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PieChartComponent
                  data={formatarDadosReceitasDespesas(chartData.receitasDespesas, 'pie-despesas')}
                  title=""
                  description=""
                  formatter={formatCurrency}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Área - Evolução */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <AreaChart className="h-6 w-6 text-blue-600" />
                Evolução Temporal
              </CardTitle>
              <CardDescription>
                Evolução das receitas e despesas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
          <AreaChartComponent
                data={formatarDadosReceitasDespesas(chartData.receitasDespesas, 'area')}
                title=""
                description=""
                xKey="mes"
                areas={[
                  { dataKey: 'receitas', name: 'Receitas', color: '#10B981', fillOpacity: 0.6 },
                  { dataKey: 'despesas', name: 'Despesas', color: '#EF4444', fillOpacity: 0.6 }
                ]}
                formatter={formatCurrency}
                height={350}
              />
            </CardContent>
          </Card>

          {/* Tabela Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Table className="h-6 w-6 text-gray-600" />
                Detalhamento por Mês
              </CardTitle>
              <CardDescription>
                Análise detalhada de receitas e despesas mensais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Mês</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">Receitas</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">Despesas</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">Saldo</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">Margem %</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">Movimentações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.receitasDespesas.slice(0, 12).map((mes, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium">
                          {mes.mesCompleto}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-green-600 font-semibold">
                          {formatCurrency(mes.receitas)}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-red-600 font-semibold">
                          {formatCurrency(mes.despesas)}
                        </td>
                        <td className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-bold ${mes.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(mes.saldoLiquido)}
                        </td>
                        <td className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold ${mes.margemLiquida >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {mes.margemLiquida.toFixed(1)}%
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                            {mes.totalMovimentacoes}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        );
      
      default:
        return (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-slate-500">
                Gráfico não encontrado
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  // Função para exportar relatório
  const exportarRelatorio = (formato) => {
    toast({
      title: "Exportando...",
      description: `Relatório sendo exportado em formato ${formato}`,
    });
  };

  // Filtrar relatórios por categoria e busca (baseado nos relatórios habilitados)
  const relatoriosFiltrados = relatoriosHabilitados.filter(relatorio => {
    const matchesCategory = categoryFilter === 'all' || relatorio.category === categoryFilter;
    const matchesSearch = relatorio.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Obter categorias únicas (baseado nos relatórios habilitados)
  const categoriasDisponiveis = ['all', ...new Set(relatoriosHabilitados.map(r => r.category))];

  return (
    <div className="space-y-8">
      {/* Header Turbinado */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 lg:p-8 text-white shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-2 lg:gap-3">
              <BarChart3 className="h-8 w-8 lg:h-10 lg:w-10" />
              Relatórios Gráficos
            </h1>
            <p className="text-indigo-100 text-base lg:text-lg">
              Análise completa e detalhada do seu negócio em tempo real
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm text-indigo-100">Firebase</p>
              <p className="text-xl font-bold text-green-200">Conectado</p>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm text-indigo-100">Dados</p>
              <p className="text-xl font-bold text-blue-200">Tempo Real</p>
            </div>
          </div>
        </div>
      </motion.div>
          
      {/* Filtros de Período Turbinados */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 p-6 border-b border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Filtros de Período</h2>
              <p className="text-slate-600 dark:text-slate-400">Selecione o período para análise dos dados</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Períodos Rápidos - Botões Turbinados */}
            <div className="flex flex-wrap gap-3">
              {periodosPredefinidos.map(periodo => (
                <motion.div
                  key={periodo.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => aplicarPeriodo(periodo)}
                    className="h-9 px-4 text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 dark:border-blue-600 dark:hover:border-blue-500 dark:text-blue-300 dark:hover:text-blue-200 transition-all duration-300"
                  >
                    {periodo.label}
                  </Button>
                </motion.div>
              ))}
            </div>
            
            {/* Separador Visual */}
            <div className="hidden sm:flex items-center">
              <div className="w-px h-8 bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500"></div>
            </div>
            
            {/* Campos de Data Separados */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              
              {/* Campo Data Início */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Data Início:
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-[140px] justify-start text-left font-normal bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700",
                        !startDate && "text-slate-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(date);
                          // Se a data de fim for anterior à data de início, ajustar automaticamente
                          if (endDate && date > endDate) {
                            setEndDate(date);
                          }
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Separador */}
              <div className="text-slate-400 dark:text-slate-500">até</div>

              {/* Campo Data Fim */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Data Fim:
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-[140px] justify-start text-left font-normal bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700",
                        !endDate && "text-slate-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        if (date) {
                          setEndDate(date);
                          // Se a data de início for posterior à data de fim, ajustar automaticamente
                          if (startDate && date < startDate) {
                            setStartDate(date);
                          }
                        }
                      }}
                      disabled={(date) => startDate ? date < startDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          {/* Período Atual Selecionado Turbinado */}
          {dateRange?.from && dateRange?.to && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="p-1 bg-green-500 rounded-full">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Período selecionado:</span>
                  <span className="font-semibold text-slate-900 dark:text-white ml-2">
                    {format(dateRange.from, 'dd/MM/yyyy')} até {format(dateRange.to, 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Resumo Executivo */}
          {dateRange?.from && dateRange?.to && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 space-y-6"
            >
              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total de Vendas</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(stats.totalVendas)}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {stats.quantidadeVendas} vendas realizadas
                    </span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ticket Médio</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(stats.ticketMedio)}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Valor médio por venda
                    </span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Receitas</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(stats.receitas)}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      Total de entradas
                    </span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Lucro</p>
                      <p className={`text-3xl font-bold ${stats.lucro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(stats.lucro)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stats.lucro >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
                      {stats.lucro >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-white" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {formatPercent(stats.margemLucro)} de margem
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Tabs principais Turbinadas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 p-4 border-b border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tipos de Relatórios</h2>
                  <p className="text-slate-600 dark:text-slate-400">Escolha entre gráficos interativos ou listas detalhadas</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                <TabsTrigger 
                  value="graficos" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-indigo-400 transition-all duration-300"
                >
                  <BarChart3 className="h-4 w-4" />
                  Relatórios Gráficos
                </TabsTrigger>
                <TabsTrigger 
                  value="lista" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-indigo-400 transition-all duration-300"
                >
                  <List className="h-4 w-4" />
                  Relatórios em Lista
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        
          {/* Aba de Relatórios Gráficos Turbinada */}
          <TabsContent value="graficos" className="space-y-8 pt-8">
            {/* Status e Informações Turbinadas */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-emerald-50 via-blue-50 to-indigo-50 dark:from-emerald-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 shadow-lg"
            >
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl shadow-lg">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Dados em Tempo Real</h3>
                    <p className="text-slate-600 dark:text-slate-400">Conectado ao Firebase • Atualização automática</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div className="text-sm">
                      <p className="text-slate-500 dark:text-slate-400">Período</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">Conectado</span>
                  </div>
                </div>
              </div>
            </motion.div>


            {/* Gráfico Selecionado Turbinado */}
            {selectedReport && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Relatório Ativo</h3>
                      <p className="text-slate-600 dark:text-slate-400">Visualização em tempo real • Dados do Firebase</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Ativo</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReport(null)}
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:border-red-600 dark:hover:text-red-400 transition-all duration-300"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Fechar
                    </Button>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                  {renderChart(selectedReport)}
                </div>
              </motion.div>
            )}

            {/* Lista de Relatórios Gráficos Turbinada */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios Disponíveis</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {relatoriosGraficos.map((relatorio, index) => {
                  const Icon = relatorio.icon;
                  return (
                    <motion.div
                      key={relatorio.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="group cursor-pointer"
                    >
                      <Card className="h-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-4 rounded-2xl ${relatorio.color} shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110`}>
                              <Icon className="h-7 w-7 text-white" />
                            </div>
                            <Badge variant="outline" className="text-xs font-medium border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700">
                              {relatorio.type}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {relatorio.title}
                          </CardTitle>
                          <CardDescription className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {relatorio.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button 
                            onClick={() => gerarRelatorio(relatorio.id)}
                            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 h-11"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Eye className="h-4 w-4 mr-2" />
                            )}
                            Visualizar Relatório
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </TabsContent>
        
          {/* Aba de Relatórios em Lista Turbinada */}
          <TabsContent value="lista" className="space-y-8 pt-8">
            {/* Filtros e Controles Turbinados */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 p-6 border-b border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg">
                    <Filter className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Filtros e Controles</h2>
                    <p className="text-slate-600 dark:text-slate-400">Busque e organize os relatórios disponíveis</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    {/* Busca Turbinada */}
                    <div className="relative flex-1 max-w-sm">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        placeholder="Buscar relatórios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-11 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 transition-all duration-300"
                      />
                    </div>

                    {/* Filtro por Categoria Turbinado */}
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-auto sm:min-w-[220px] h-11 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                        <Filter className="h-4 w-4 mr-2 text-slate-500" />
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasDisponiveis.map(categoria => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria === 'all' ? 'Todas as Categorias' : categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Controles de Visualização Turbinados */}
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-9 px-4 transition-all duration-300 ${
                        viewMode === 'grid' 
                          ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600 dark:text-blue-400' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Grid className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-9 px-4 transition-all duration-300 ${
                        viewMode === 'list' 
                          ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600 dark:text-blue-400' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <List className="h-4 w-4 mr-2" />
                      Lista
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Lista de Relatórios Turbinada */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-lg">
                  <List className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios em Lista</h2>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  {relatoriosFiltrados.length} relatórios
                </Badge>
              </div>
              
              <div className={cn(
                "gap-6",
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "space-y-4"
              )}>
                <AnimatePresence>
                  {relatoriosFiltrados.map((relatorio, index) => {
                    const Icon = relatorio.icon;
                    return (
                      <motion.div
                        key={relatorio.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                      >
                        {viewMode === 'grid' ? (
                          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer h-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-lg">
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${relatorio.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                                  <Icon className="h-6 w-6 text-white" />
                                </div>
                                <Badge variant="outline" className="text-xs font-medium bg-slate-100 dark:bg-slate-700">
                                  {relatorio.category}
                                </Badge>
                              </div>
                              <CardTitle className="text-lg font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {relatorio.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  onClick={() => gerarRelatorio(relatorio.id)}
                                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <Eye className="h-3 w-3 mr-1" />
                                  )}
                                  Ver
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => exportarRelatorio('PDF')}
                                  className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:border-red-600 dark:hover:text-red-400 transition-all duration-300"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-md">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-xl ${relatorio.color} shadow-lg`}>
                                    <Icon className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {relatorio.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{relatorio.category}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Button 
                                    size="sm"
                                    onClick={() => gerarRelatorio(relatorio.id)}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                    disabled={isLoading}
                                  >
                                    {isLoading ? (
                                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <Eye className="h-3 w-3 mr-1" />
                                    )}
                                    Visualizar
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => exportarRelatorio('PDF')}
                                    className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:border-red-600 dark:hover:text-red-400 transition-all duration-300"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => exportarRelatorio('Excel')}
                                    className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:border-green-600 dark:hover:text-green-400 transition-all duration-300"
                                  >
                                    <FileText className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Estatísticas Turbinadas */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-600"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-slate-600 dark:text-slate-400">Total de relatórios: <span className="font-semibold text-slate-900 dark:text-white">{relatoriosFiltrados.length}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-slate-600 dark:text-slate-400">Categoria: <span className="font-semibold text-slate-900 dark:text-white">{categoryFilter === 'all' ? 'Todas' : categoryFilter}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Database className="h-4 w-4" />
                    <span>Dados do Firebase</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default RelatoriosModule;
