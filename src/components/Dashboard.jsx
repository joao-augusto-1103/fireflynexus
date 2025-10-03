import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileText, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Plus, 
  BarChart3, 
  Settings, 
  Calendar, 
  FileText as FileTextIcon,
  Zap,
  Star,
  Target,
  Clock,
  ExternalLink,
  UserPlus,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { AppContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClientes, useOS, useOV, useProdutos, useFinanceiro, useCategorias, useCaixa, useConfiguracao } from '@/lib/hooks/useFirebase';

const Dashboard = ({ userId }) => {
  const { openDialog, setActiveModule, definirProdutoParaReporEstoque, darkMode } = useContext(AppContext);
  
  // Hook para obter configurações do Firebase
  const { config: configuracoesFirebase } = useConfiguracao();
  
  // Usar hooks do Firebase para obter dados em tempo real
  const { data: clientes, loading: clientesLoading } = useClientes(userId);
  const { data: os, loading: osLoading } = useOS(userId);
  const { data: ov, loading: ovLoading } = useOV(userId);
  const { data: produtos, loading: produtosLoading } = useProdutos(userId);
  const { data: categorias, loading: categoriasLoading } = useCategorias(userId);
  const { data: financeiro, loading: financeiroLoading } = useFinanceiro(userId);
  const { data: caixa, loading: caixaLoading } = useCaixa();
  
  const [stats, setStats] = useState({
    clientes: 0,
    os: 0,
    ov: 0,
    produtos: 0,
    contasReceber: 0,
    contasPagar: 0,
    estoqueCritico: 0,
    osPendentes: 0,
    osConcluidas: 0,
    osEmAndamento: 0,
    faturamentoMes: 0,
    caixaAberto: false,
    saldoCaixa: 0
  });

  const [isEstoqueCriticoModalOpen, setIsEstoqueCriticoModalOpen] = useState(false);
  
  // Estado para controlar se deve ocultar o botão de consulta de estoque
  const [ocultarConsultaEstoque, setOcultarConsultaEstoque] = useState(() => {
    const saved = localStorage.getItem('ocultarConsultaEstoque');
    return saved !== null ? saved === 'true' : true; // Padrão: oculto (true)
  });

  // Escutar mudanças na configuração de ocultar consulta de estoque
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('ocultarConsultaEstoque');
      setOcultarConsultaEstoque(saved !== null ? saved === 'true' : true);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Escutar mudanças nas configurações de ações rápidas
  useEffect(() => {
    // Forçar re-render quando as configurações mudarem
    setStats(prev => ({ ...prev }));
  }, [configuracoesFirebase]);

  // Calcular estatísticas quando os dados mudarem
  useEffect(() => {
    console.log('[Dashboard] ===== ATUALIZANDO ESTATÍSTICAS =====');
    console.log('[Dashboard] Dados recebidos:', {
      clientes: clientes?.length || 0,
      os: os?.length || 0,
      ov: ov?.length || 0,
      produtos: produtos?.length || 0,
      financeiro: financeiro?.length || 0
    });

    if (!clientesLoading && !osLoading && !ovLoading && !produtosLoading && !financeiroLoading && !caixaLoading) {
      const contasReceber = financeiro
        ?.filter(item => item.tipo === 'receber' && item.status === 'Pendente')
        ?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;
        
      const contasPagar = financeiro
        ?.filter(item => item.tipo === 'pagar' && item.status === 'Pendente')
        ?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;

      const estoqueCritico = produtos?.filter(produto => 
        produto.quantidade <= (produto.estoqueMinimo || 5)
      ).length || 0;

      const osPendentes = os?.filter(os => os.status === 'Pendente').length || 0;
      const osConcluidas = os?.filter(os => os.status === 'Concluída').length || 0;
      const osEmAndamento = os?.filter(os => os.status === 'Em Andamento' || os.status === 'Processando').length || 0;
      
      // Faturamento do mês (OS concluídas)
      const faturamentoMes = os?.filter(os => {
        const dataOS = new Date(os.createdAt);
        const mesAtual = new Date().getMonth();
        const anoAtual = new Date().getFullYear();
        return os.status === 'Concluída' && 
               dataOS.getMonth() === mesAtual && 
               dataOS.getFullYear() === anoAtual;
      }).reduce((sum, os) => sum + (os.valor || 0), 0) || 0;

      // Calcular estatísticas do caixa
      const caixaAberto = caixa?.find(c => c.status === 'aberto') || null;
      const saldoCaixa = caixaAberto ? (caixaAberto.transacoes || []).reduce((sum, trans) => {
        return sum + (trans.tipo === 'entrada' ? trans.valor : -trans.valor);
      }, caixaAberto.valorInicial || 0) : 0;

      setStats({
        clientes: clientes?.length || 0,
        os: os?.length || 0,
        ov: ov?.length || 0,
        produtos: produtos?.length || 0,
        contasReceber,
        contasPagar,
        estoqueCritico,
        osPendentes,
        osConcluidas,
        osEmAndamento,
        faturamentoMes,
        caixaAberto: !!caixaAberto,
        saldoCaixa
      });

      console.log('[Dashboard] Estatísticas calculadas:', {
        clientes: clientes?.length || 0,
        os: os?.length || 0,
        ov: ov?.length || 0,
        produtos: produtos?.length || 0,
        contasReceber,
        contasPagar,
        estoqueCritico,
        osPendentes,
        osConcluidas,
        osEmAndamento,
        faturamentoMes
      });
    }
  }, [clientes, os, ov, produtos, categorias, financeiro, caixa, clientesLoading, osLoading, ovLoading, produtosLoading, categoriasLoading, financeiroLoading, caixaLoading]);

  // Cards de estatísticas principais
  const mainStats = [
    {
      title: 'Clientes',
      value: stats.clientes,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: stats.clientes > 0 ? '+12%' : '0%',
      changeType: stats.clientes > 0 ? 'positive' : 'neutral'
    },
    {
      title: 'Ordens de Serviço',
      value: stats.os,
      icon: FileText,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: stats.os > 0 ? '+8%' : '0%',
      changeType: stats.os > 0 ? 'positive' : 'neutral'
    },
    {
      title: 'Ordens de Venda',
      value: stats.ov,
      icon: ShoppingCart,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      change: stats.ov > 0 ? '+15%' : '0%',
      changeType: stats.ov > 0 ? 'positive' : 'neutral'
    },
    {
      title: 'Produtos',
      value: stats.produtos,
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      change: stats.produtos > 0 ? '+5%' : '0%',
      changeType: stats.produtos > 0 ? 'positive' : 'neutral'
    },
  ];

  // Cards financeiros
  const financialStats = [
    {
      title: 'Contas a Receber',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.contasReceber),
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      change: stats.contasReceber > 0 ? '+R$ 2.500' : 'R$ 0',
      changeType: stats.contasReceber > 0 ? 'positive' : 'neutral'
    },
    {
      title: 'Contas a Pagar',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.contasPagar),
      icon: TrendingDown,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      change: stats.contasPagar > 0 ? '-R$ 1.200' : 'R$ 0',
      changeType: stats.contasPagar > 0 ? 'negative' : 'neutral'
    },
    {
      title: 'Faturamento do Mês',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.faturamentoMes),
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      change: stats.faturamentoMes > 0 ? '+R$ 5.800' : 'R$ 0',
      changeType: stats.faturamentoMes > 0 ? 'positive' : 'neutral'
    }
  ];

  // Cards de alertas
  const alertStats = [
    {
      title: 'OS Pendentes',
      value: stats.osPendentes,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      isAlert: stats.osPendentes > 5,
      alertMessage: 'Muitas OS pendentes!'
    },
    {
      title: 'OS Em Andamento',
      value: stats.osEmAndamento || 0,
      icon: Activity,
      color: 'from-slate-500 to-slate-600',
      bgColor: 'bg-slate-50 dark:bg-slate-900/20',
      isAlert: false,
      alertMessage: 'Ordens de serviço em processamento'
    },
    {
      title: 'Estoque Crítico',
      value: stats.estoqueCritico,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      isAlert: stats.estoqueCritico > 0,
      alertMessage: 'Produtos com estoque baixo!'
    }
  ];

  // Ações rápidas destacadas
  const quickActionsBase = [
    {
      title: 'Nova OS',
      description: 'Criar nova ordem de serviço',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      action: () => handleQuickAction('os', 'os')
    },
    {
      title: 'Novo Lançamento',
      description: 'Criar novo lançamento financeiro',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      action: () => handleQuickAction('financeiro', 'financeiro')
    },
    {
      title: 'Novo Cliente',
      description: 'Cadastrar novo cliente',
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      action: () => handleQuickAction('clientes', 'clientes')
    },
    {
      title: 'Novo Usuário',
      description: 'Cadastrar novo usuário do sistema',
      icon: UserPlus,
      color: 'from-violet-500 to-violet-600',
      action: () => handleQuickAction('usuarios', 'usuarios')
    },
    {
      title: 'Consulta Estoque MaxCell',
      description: 'Consultar estoque de produtos MaxCell online',
      icon: ExternalLink,
      color: 'from-purple-500 to-purple-600',
      action: () => window.open('https://consultaestoque.app.br', '_blank'),
      badge: 'EXCLUSIVO'
    },
    {
      title: 'Nova Venda',
      description: 'Criar nova ordem de venda',
      icon: ShoppingCart,
      color: 'from-purple-500 to-purple-600',
      action: () => handleQuickAction('ov', 'ov')
    },
    {
      title: 'Adicionar Produto',
      description: 'Cadastrar novo produto',
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      action: () => handleQuickAction('estoque', 'produto')
    },
    {
      title: 'Movimentação',
      description: 'Entrada/Saída de estoque',
      icon: Activity,
      color: 'from-teal-500 to-teal-600',
      action: () => handleQuickAction('estoque', 'movimentacao')
    },
    {
      title: 'Relatórios',
      description: 'Ver relatórios e análises',
      icon: BarChart3,
      color: 'from-indigo-500 to-indigo-600',
      action: () => handleQuickAction('relatorios')
    },
    {
      title: 'Abrir Caixa',
      description: 'Abrir caixa com valor inicial',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      action: () => handleQuickAction('caixa', 'caixa')
    }
  ];

  // Filtrar ações rápidas baseado na configuração
  const quickActions = quickActionsBase.filter(action => {
    // Filtrar Consulta Estoque MaxCell (configuração existente)
    if (action.title === 'Consulta Estoque MaxCell' && ocultarConsultaEstoque) {
      return false;
    }
    
    // Filtrar baseado nas configurações de personalização
    const configAcoesRapidas = configuracoesFirebase?.acoesRapidas || {};
    
    switch (action.title) {
      case 'Nova OS':
        return configAcoesRapidas.novaOS !== false;
      case 'Novo Lançamento':
        return configAcoesRapidas.novoLancamento !== false;
      case 'Novo Cliente':
        return configAcoesRapidas.novoCliente !== false;
      case 'Novo Usuário':
        return configAcoesRapidas.novoUsuario !== false;
      case 'Nova Venda':
        return configAcoesRapidas.novaOV !== false;
      case 'Abrir Caixa':
        return configAcoesRapidas.abrirCaixa !== false;
      case 'Adicionar Produto':
        return configAcoesRapidas.adicionarProduto !== false;
      case 'Movimentação':
        return configAcoesRapidas.movimentacao !== false;
      case 'Relatórios':
        return configAcoesRapidas.relatorios !== false;
      default:
        return true;
    }
  });

  // Verificar se deve mostrar a seção de ações rápidas
  const shouldShowQuickActions = quickActions.length > 0;

  const handleQuickAction = (module, dialog) => {
    setActiveModule(module);
    if (dialog) {
      setTimeout(() => openDialog(dialog), 50);
    }
    console.log('[Dashboard] Ação rápida:', module, dialog);
  };

  const handleReporEstoque = (produto) => {
    // Definir o produto no contexto para o EstoqueModule acessar
    definirProdutoParaReporEstoque(produto);
    // Navegar para o módulo de estoque e abrir movimentação
    setActiveModule('estoque');
    setTimeout(() => {
      openDialog('movimentacao');
    }, 50);
    setIsEstoqueCriticoModalOpen(false);
  };

  // Verificar se ainda está carregando dados
  const isLoading = clientesLoading || osLoading || ovLoading || produtosLoading || categoriasLoading || financeiroLoading;

  return (
    <div className="space-y-8">
      {/* Header Turbinado */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 lg:gap-3">
              <BarChart3 className="h-8 w-8 lg:h-10 lg:w-10" />
              Dashboard
            </h1>
            <p className="text-blue-100 text-base lg:text-lg">
              {isLoading ? 'Carregando dados...' : 'Visão geral do seu sistema CRM'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-100">Hoje</p>
              <p className="text-xl font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-100">Status</p>
              <p className="text-xl font-bold text-green-200">Online</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ações Rápidas Destacadas */}
      {shouldShowQuickActions && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden w-full max-w-full"
        >
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Ações Rápidas</h2>
              <p className="text-slate-600 dark:text-slate-400">Acesse rapidamente as funcionalidades mais utilizadas</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full max-w-full">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
                  onClick={action.action}
                  className="group relative bg-white dark:bg-slate-700 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left"
                >
                  {action.badge && (
                    <div className={`absolute -top-2 -right-2 text-white text-xs font-bold px-2 py-1 rounded-full ${
                      action.badge === 'EXCLUSIVO' 
                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                        : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                    }`}>
                      {action.badge}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {action.description}
                      </p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
        </motion.div>
      )}

      {/* Estatísticas Principais */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Estatísticas Principais</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full max-w-full">
          {mainStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                className={`${stat.bgColor} rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : stat.changeType === 'negative' ? (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-slate-400" />
                    )}
                    <span className={`font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-slate-500'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Estatísticas Financeiras */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Financeiro</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full max-w-full">
          {financialStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className={`${stat.bgColor} rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : stat.changeType === 'negative' ? (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-slate-400" />
                    )}
                    <span className={`font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-slate-500'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Alertas e Status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Alertas e Status</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full max-w-full">
          {alertStats.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <motion.div
                key={alert.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                className={`${alert.bgColor} rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 ${
                  alert.isAlert ? 'ring-2 ring-amber-400 ring-opacity-50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${alert.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {alert.isAlert && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                        Atenção
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {alert.value}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {alert.title}
                  </p>
                  {alert.isAlert && alert.value > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {alert.alertMessage}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Modal de Estoque Crítico */}
      <Dialog open={isEstoqueCriticoModalOpen} onOpenChange={setIsEstoqueCriticoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Estoque Crítico
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Os seguintes produtos estão com estoque baixo:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
              {produtos?.filter(produto => 
                produto.quantidade <= (produto.estoqueMinimo || 5)
              ).map((produto) => (
                <div key={produto.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{produto.nome}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Estoque: {produto.quantidade} | Mínimo: {produto.estoqueMinimo || 5}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleReporEstoque(produto)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Repor
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;