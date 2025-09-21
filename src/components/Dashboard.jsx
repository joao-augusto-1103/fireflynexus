import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, ShoppingCart, Package, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { AppContext } from '@/App';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { openDialog, setActiveModule } = useContext(AppContext);
  const [stats, setStats] = useState({
    clientes: 0,
    os: 0,
    ov: 0,
    produtos: 0,
    contasReceber: 0,
    contasPagar: 0
  });

  useEffect(() => {
    const updateStats = () => {
      const clientes = JSON.parse(localStorage.getItem('crm_clientes') || '[]');
      const os = JSON.parse(localStorage.getItem('crm_os') || '[]');
      const ov = JSON.parse(localStorage.getItem('crm_ov') || '[]');
      const produtos = JSON.parse(localStorage.getItem('crm_produtos') || '[]');
      const financeiro = JSON.parse(localStorage.getItem('crm_financeiro') || '[]');

      const contasReceber = financeiro.filter(item => item.tipo === 'receber' && item.status === 'Pendente').reduce((sum, item) => sum + item.valor, 0);
      const contasPagar = financeiro.filter(item => item.tipo === 'pagar' && item.status === 'Pendente').reduce((sum, item) => sum + item.valor, 0);

      setStats({
        clientes: clientes.length,
        os: os.length,
        ov: ov.length,
        produtos: produtos.length,
        contasReceber,
        contasPagar
      });
    };
    
    updateStats();
    window.addEventListener('storage', updateStats);
    return () => window.removeEventListener('storage', updateStats);
  }, []);

  const cards = [
    {
      title: 'Clientes',
      value: stats.clientes,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Ordens de Serviço',
      value: stats.os,
      icon: FileText,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Ordens de Venda',
      value: stats.ov,
      icon: ShoppingCart,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Produtos',
      value: stats.produtos,
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Contas a Receber',
      value: `R$ ${stats.contasReceber.toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      title: 'Contas a Pagar',
      value: `R$ ${stats.contasPagar.toFixed(2)}`,
      icon: TrendingDown,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  const handleQuickAction = (module, dialog) => {
    setActiveModule(module);
    setTimeout(() => openDialog(dialog), 50);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">Visão geral do seu sistema CRM</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`${card.bgColor} rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Resumo Financeiro
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Total a Receber:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                R$ {stats.contasReceber.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Total a Pagar:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                R$ {stats.contasPagar.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900 dark:text-white">Saldo Previsto:</span>
                <span className={`font-bold ${stats.contasReceber - stats.contasPagar >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  R$ {(stats.contasReceber - stats.contasPagar).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Ações Rápidas
          </h3>
          <div className="space-y-3">
            <Button onClick={() => handleQuickAction('clientes', 'clientes')} variant="outline" className="w-full justify-start p-3 h-auto text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-900/30">
              <span className="font-medium">Novo Cliente</span>
            </Button>
            <Button onClick={() => handleQuickAction('os', 'os')} variant="outline" className="w-full justify-start p-3 h-auto text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-200 dark:border-green-900/30">
              <span className="font-medium">Nova OS</span>
            </Button>
            <Button onClick={() => handleQuickAction('ov', 'ov')} variant="outline" className="w-full justify-start p-3 h-auto text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-900/30">
              <span className="font-medium">Nova OV</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;