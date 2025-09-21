import React, { useState, createContext, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, ShoppingCart, Package, DollarSign, Moon, Sun, Menu, X, AreaChart, LayoutDashboard, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ClientesModule from '@/components/modules/ClientesModule';
import OSModule from '@/components/modules/OSModule';
import OVModule from '@/components/modules/OVModule';
import EstoqueModule from '@/components/modules/EstoqueModule';
import FinanceiroModule from '@/components/modules/FinanceiroModule';
import RelatoriosModule from '@/components/modules/RelatoriosModule';
import Dashboard from '@/components/Dashboard';
export const AppContext = createContext();
function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dialogs, setDialogs] = useState({
    clientes: false,
    os: false,
    ov: false
  });
  const openDialog = dialog => setDialogs(prev => ({
    ...prev,
    [dialog]: true
  }));
  const closeDialog = dialog => setDialogs(prev => ({
    ...prev,
    [dialog]: false
  }));
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const modules = [{
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard
  }, {
    id: 'clientes',
    name: 'Clientes',
    icon: Users
  }, {
    id: 'os',
    name: 'Ordens de Serviço',
    icon: FileText
  }, {
    id: 'ov',
    name: 'Ordens de Venda',
    icon: ShoppingCart
  }, {
    id: 'estoque',
    name: 'Estoque',
    icon: Package
  }, {
    id: 'financeiro',
    name: 'Financeiro',
    icon: DollarSign
  }, {
    id: 'relatorios',
    name: 'Relatórios',
    icon: AreaChart
  }];
  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'clientes':
        return <ClientesModule />;
      case 'os':
        return <OSModule />;
      case 'ov':
        return <OVModule />;
      case 'estoque':
        return <EstoqueModule />;
      case 'financeiro':
        return <FinanceiroModule />;
      case 'relatorios':
        return <RelatoriosModule />;
      default:
        return <Dashboard />;
    }
  };
  return <AppContext.Provider value={{
    dialogs,
    openDialog,
    closeDialog,
    setActiveModule
  }}>
      <TooltipProvider>
        <div className={darkMode ? 'dark' : ''}>
          <Helmet>
            <title>Sistema CRM Completo - Gestão Empresarial</title>
            <meta name="description" content="Sistema completo de CRM com gestão de clientes, ordens de serviço, vendas, estoque e financeiro" />
          </Helmet>
          
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 transition-colors duration-300">
            <div className="lg:hidden fixed top-4 left-4 z-50">
              <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>

            <motion.div initial={false} animate={{
            width: sidebarCollapsed ? '5rem' : '17.5rem',
            x: sidebarOpen || window.innerWidth >= 1024 ? 0 : '-100%'
          }} transition={{
            type: 'tween',
            ease: 'easeInOut',
            duration: 0.3
          }} className="fixed left-0 top-0 h-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-r border-slate-200 dark:border-slate-800 z-40 lg:translate-x-0">
              <div className="flex flex-col h-full">
                <div className={`p-6 flex items-center justify-between mb-8 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                  <AnimatePresence>
                    {!sidebarCollapsed && <motion.h1 initial={{
                    opacity: 0,
                    x: -20
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} exit={{
                    opacity: 0,
                    x: -20
                  }} transition={{
                    duration: 0.2
                  }} className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CRM
Multismart</motion.h1>}
                  </AnimatePresence>
                  <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="hover:bg-slate-100 dark:hover:bg-slate-800">
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </div>

                <nav className="flex-1 space-y-2 px-4">
                  {modules.map(module => {
                  const Icon = module.icon;
                  return <Tooltip key={module.id}>
                        <TooltipTrigger asChild>
                          <motion.button whileHover={{
                        scale: 1.02
                      }} whileTap={{
                        scale: 0.98
                      }} onClick={() => {
                        setActiveModule(module.id);
                        setSidebarOpen(false);
                      }} className={`w-full flex items-center space-x-3 py-3 rounded-lg text-left transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'} ${activeModule === module.id ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <AnimatePresence>
                              {!sidebarCollapsed && <motion.span initial={{
                            opacity: 0,
                            width: 0
                          }} animate={{
                            opacity: 1,
                            width: 'auto'
                          }} exit={{
                            opacity: 0,
                            width: 0
                          }} transition={{
                            duration: 0.2
                          }} className="font-medium whitespace-nowrap overflow-hidden">
                                  {module.name}
                                </motion.span>}
                            </AnimatePresence>
                          </motion.button>
                        </TooltipTrigger>
                        {sidebarCollapsed && <TooltipContent side="right">
                            <p>{module.name}</p>
                          </TooltipContent>}
                      </Tooltip>;
                })}
                </nav>

                <div className="hidden lg:flex p-4 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="ghost" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full">
                    <motion.div animate={{
                    rotate: sidebarCollapsed ? 180 : 0
                  }} transition={{
                    duration: 0.3
                  }}>
                      <ChevronLeft className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.main animate={{
            marginLeft: window.innerWidth >= 1024 ? sidebarCollapsed ? '5rem' : '17.5rem' : '0rem'
          }} transition={{
            type: 'tween',
            ease: 'easeInOut',
            duration: 0.3
          }} className="min-h-screen">
              <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
                <motion.div key={activeModule} initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.4,
                ease: 'easeInOut'
              }}>
                  {renderActiveModule()}
                </motion.div>
              </div>
            </motion.main>

            {sidebarOpen && <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setSidebarOpen(false)} />}

            <Toaster />
          </div>
        </div>
      </TooltipProvider>
    </AppContext.Provider>;
}
export default App;