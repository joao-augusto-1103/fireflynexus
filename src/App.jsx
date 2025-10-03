import React, { useState, createContext, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, ShoppingCart, Package, DollarSign, Moon, Sun, Menu, X, AreaChart, LayoutDashboard, ChevronLeft, Settings, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ClientesModule from '@/components/modules/ClientesModule';
import OSModule from '@/components/modules/OSModule';
import OVModule from '@/components/modules/OVModule';
import EstoqueModule from '@/components/modules/EstoqueModule';
import FinanceiroModule from '@/components/modules/FinanceiroModule';
import RelatoriosModule from '@/components/modules/RelatoriosModule';
import ConfiguracoesModule from '@/components/modules/ConfiguracoesModule';
import CaixaModule from '@/components/modules/CaixaModule';
import Dashboard from '@/components/Dashboard';
import { t } from '@/lib/translations';
import Login from '@/components/Login';
import { toast } from '@/components/ui/use-toast';
import { useConfiguracao } from '@/lib/hooks/useFirebase';

export const AppContext = createContext();

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('pt-BR');
  const [dialogs, setDialogs] = useState({
    clientes: false,
    os: false,
    ov: false
  });
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [produtoParaReporEstoque, setProdutoParaReporEstoque] = useState(null);

  // Usar hook do Firebase para configurações
  const { config: configuracoesRaw, loading: configLoading, saveConfig } = useConfiguracao();
  
  // Estado para configurações locais (atualização imediata)
  const [configuracoesLocais, setConfiguracoesLocais] = useState(null);
  
  // Garantir que configuracoes sempre tenha um valor padrão
  const configuracoes = configuracoesLocais || configuracoesRaw || {
    nomeEmpresa: 'Firefly Nexus',
    tema: 'dark',
    idioma: 'pt-BR'
  };

  const openDialog = dialog => setDialogs(prev => ({
    ...prev,
    [dialog]: true
  }));

  const closeDialog = dialog => setDialogs(prev => ({
    ...prev,
    [dialog]: false
  }));

  const definirProdutoParaReporEstoque = (produto) => {
    setProdutoParaReporEstoque(produto);
  };

  const limparProdutoParaReporEstoque = () => {
    setProdutoParaReporEstoque(null);
  };

  // Carregar configurações e verificar migração
  useEffect(() => {
    console.log('[App] Carregando configurações iniciais...');
    const usuario = localStorage.getItem('crm_usuario_logado');
    
    if (usuario) {
      setUsuarioLogado(JSON.parse(usuario));
      console.log('[App] Usuário logado carregado:', JSON.parse(usuario));
    }
  }, []);

  // Escuta atualizações de configuração para atualizar sidebar imediatamente
  useEffect(() => {
    const handleConfigUpdate = (event) => {
      console.log('[App] 🔄 Configuração atualizada, forçando re-render');
      // Pequena pausa para garantir que o estado foi atualizado
      setTimeout(() => {
        setConfiguracoesLocais(null);
      }, 50);
    };

    window.addEventListener('configUpdated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('configUpdated', handleConfigUpdate);
    };
  }, []);

  // Atualizar configurações locais quando configurações do Firebase mudam
  useEffect(() => {
    if (configuracoesRaw) {
      setConfiguracoesLocais(configuracoesRaw);
    }
  }, [configuracoesRaw]);

  // Aplicar configurações quando carregadas do Firebase
  useEffect(() => {
    if (configuracoes && !configLoading) {
      console.log('[App] Configurações carregadas do Firebase:', configuracoes);
      setCurrentLanguage(configuracoes.idioma || 'pt-BR');
      aplicarConfiguracoes(configuracoes);
    }
  }, [configuracoes, configLoading]);
  // Função para login
  const handleLogin = (usuario) => {
    console.log('[App] handleLogin chamado com usuário:', usuario);
    setUsuarioLogado(usuario);
    localStorage.setItem('crm_usuario_logado', JSON.stringify(usuario));
    console.log('[App] Login realizado e estado atualizado:', usuario);
  };

  // Função para logout
  const handleLogout = () => {
    console.log('[App] Logout realizado:', usuarioLogado);
    setUsuarioLogado(null);
    localStorage.removeItem('crm_usuario_logado');
    setActiveModule('dashboard');
  };

  // Listener para configurações atualizadas
  useEffect(() => {
    const handleConfiguracoesAtualizadas = (event) => {
      const novasConfiguracoes = event.detail;
      console.log('[App] 🔄 Evento configuracoesAtualizadas recebido:', novasConfiguracoes);
      
      // Aplicar mudanças imediatamente
      if (novasConfiguracoes.idioma) {
        setCurrentLanguage(novasConfiguracoes.idioma);
        console.log('[App] ✅ Idioma atualizado:', novasConfiguracoes.idioma);
      }
      
      aplicarConfiguracoes(novasConfiguracoes);
      
      // As configurações já foram salvas no Firebase pelo ConfiguracoesModule
      // Aqui apenas aplicamos as mudanças visuais
    };

    window.addEventListener('configuracoesAtualizadas', handleConfiguracoesAtualizadas);
    console.log('[App] ✅ Listener configuracoesAtualizadas registrado');
    
    return () => {
      window.removeEventListener('configuracoesAtualizadas', handleConfiguracoesAtualizadas);
      console.log('[App] ✅ Listener configuracoesAtualizadas removido');
    };
  }, []);

  // Ensure DOM elements exist before accessing them
  const aplicarConfiguracoes = (config) => {
    console.log('[App] Aplicando configurações:', config);

    // Aplicar tema
    if (config.tema) {
      const newDarkMode = config.tema === 'dark';
      setDarkMode(newDarkMode);
      document.documentElement.className = config.tema === 'dark' ? 'dark' : config.tema === 'light' ? '' : 'system';
      console.log('[App] Tema aplicado:', config.tema);
    }

    // Aplicar cores CSS dinamicamente
    if (config.corPrimaria) {
      document.documentElement.style.setProperty('--primary-color', config.corPrimaria);
      document.documentElement.style.setProperty('--primary-500', config.corPrimaria);
      document.documentElement.style.setProperty('--primary-600', ajustarCor(config.corPrimaria, -20));
      console.log('[App] Cor primária aplicada:', config.corPrimaria);
    }
    if (config.corSecundaria) {
      document.documentElement.style.setProperty('--secondary-color', config.corSecundaria);
      document.documentElement.style.setProperty('--secondary-500', config.corSecundaria);
      document.documentElement.style.setProperty('--secondary-600', ajustarCor(config.corSecundaria, -20));
      console.log('[App] Cor secundária aplicada:', config.corSecundaria);
    }

    // Atualizar logo e nome da empresa no header
    if (config.logo) {
      const logoElement = document.querySelector('img[alt="Logo da empresa"]');
      if (logoElement) {
        logoElement.src = config.logo;
      } else {
        console.warn('[App] Elemento de logo não encontrado no DOM.');
      }
    }
    if (config.nomeEmpresa) {
      document.title = config.nomeEmpresa;
      const headerElement = document.querySelector('h1.text-xl');
      if (headerElement) {
        headerElement.textContent = config.nomeEmpresa;
      } else {
        console.warn('[App] Elemento de nome da empresa não encontrado no DOM.');
      }
    }

    // Configurações aplicadas visualmente (sem toast para evitar duplicação)
  };

  // Função para ajustar cor (escurecer/clarear)
  const ajustarCor = (hex, percent) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
        setSidebarOpen(false);
        console.log('[App] Sidebar recolhida por responsividade (window < 1024px)');
      } else {
        setSidebarOpen(true);
        console.log('[App] Sidebar expandida por responsividade (window >= 1024px)');
      }
    };
    
    // Verificar tamanho inicial
    handleResize();
    
    window.addEventListener('resize', handleResize);
    console.log('[App] Listener de resize registrado');
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Permissões por tipo de usuário
  // Adicionei um fallback para o tipo de usuário caso esteja undefined
  const getModulesByTipo = (tipo) => {
    console.log('[App] ===== DETERMINANDO MÓDULOS =====');
    console.log('[App] Tipo do usuário recebido:', tipo);
    
    const all = [
      { id: 'dashboard', name: 'nav.dashboard', icon: LayoutDashboard },
      { id: 'clientes', name: 'nav.clientes', icon: Users },
      { id: 'os', name: 'nav.os', icon: FileText },
      { id: 'ov', name: 'nav.ov', icon: ShoppingCart },
      { id: 'estoque', name: 'nav.estoque', icon: Package },
      { id: 'caixa', name: 'nav.caixa', icon: CreditCard },
      { id: 'financeiro', name: 'nav.financeiro', icon: DollarSign },
      { id: 'relatorios', name: 'nav.relatorios', icon: AreaChart },
      { id: 'configuracoes', name: 'nav.configuracoes', icon: Settings }
    ];


    // Tratar 'administrador' como 'admin'
    const userType = tipo === 'administrador' ? 'admin' : tipo || 'comum';
    console.log('[App] Tipo de usuário processado:', userType);

    const result =
      userType === 'admin' ? all :
      userType === 'financeiro' ? all.filter(m => ['dashboard','clientes','os','ov','estoque','caixa','financeiro','configuracoes'].includes(m.id)) :
      userType === 'comum' ? all.filter(m => ['dashboard','clientes','os','ov','estoque','caixa','configuracoes'].includes(m.id)) :
      all.filter(m => m.id === 'dashboard');

    console.log('[App] Módulos permitidos para tipo', userType, ':', result.map(m => m.id));
    console.log('[App] ===== FIM DETERMINAÇÃO MÓDULOS =====');
    return result;
  };

  const modules = getModulesByTipo(usuarioLogado?.tipo);

  const renderActiveModule = () => {
    console.log('[App] Renderizando módulo ativo:', activeModule);
    const moduleProps = { userId: usuarioLogado?.id };
    
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard {...moduleProps} />;
      case 'clientes':
        return <ClientesModule {...moduleProps} />;
      case 'os':
        return <OSModule {...moduleProps} />;
      case 'ov':
        return <OVModule {...moduleProps} />;
      case 'estoque':
        return <EstoqueModule {...moduleProps} />;
      case 'caixa':
        return <CaixaModule {...moduleProps} />;
      case 'financeiro':
        return <FinanceiroModule {...moduleProps} />;
      case 'relatorios':
        return <RelatoriosModule {...moduleProps} />;
      case 'configuracoes':
        return <ConfiguracoesModule {...moduleProps} />;
      default:
        return <Dashboard {...moduleProps} />;
    }
  };

  // Função para renderizar o logo/nome da empresa
  const renderCompanyHeader = () => {
    const nomeEmpresa = configuracoes.nomeEmpresa || 'Firefly Nexus';

    return (
      <div className="flex items-center justify-center w-full">
        {/* Texto como logo - moderno e centralizado */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight" 
              style={{ 
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 900,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))'
              }}>
            Firefly Nexus
          </h1>
          <span className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400 tracking-wide mt-1"
                style={{ 
                  letterSpacing: '0.1em',
                  color: '#6b7280'
                }}>
            Bem-vindo
          </span>
        </div>
      </div>
    );
  };

  // Função para renderizar o logo/nome da empresa quando colapsado
  const renderCompanyHeaderCollapsed = () => {
    return (
      <div className="flex flex-col items-center gap-1">
        {/* Texto compacto FN centralizado */}
        <div className="text-center">
          <div className="text-lg font-bold tracking-tight flex items-center justify-center"
               style={{ 
                 background: 'linear-gradient(135deg, #10b981, #047857)',
                 backgroundClip: 'text',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 fontWeight: '900',
                 fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
               }}>
            FN
          </div>
        </div>
      </div>
    );
  };

  // Se não estiver logado, renderiza tela de login
  if (!usuarioLogado) {
    console.log('[App] Usuário não logado, mostrando tela de login');
    return <Login onLogin={handleLogin} />;
  }

  console.log('[App] Usuário logado, mostrando dashboard:', usuarioLogado);
  console.log('[App] Tipo do usuário:', usuarioLogado?.tipo);
  console.log('[App] Módulos disponíveis:', modules);

  // Se ainda está carregando configurações, mostrar loading (mas não bloquear login)
  if (configLoading && !configuracoes) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: darkMode ? '#0F111A' : '#F8FAFC' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      activeModule,
      setActiveModule,
      darkMode,
      setDarkMode,
      sidebarOpen,
      setSidebarOpen,
      sidebarCollapsed,
      setSidebarCollapsed,
      configuracoes,
      currentLanguage,
      setCurrentLanguage,
      dialogs,
      openDialog,
      closeDialog,
      usuarioLogado,
      produtoParaReporEstoque,
      definirProdutoParaReporEstoque,
      limparProdutoParaReporEstoque
    }}>
      <>
        <Helmet>
          <title>{configuracoes.nomeEmpresa || 'Firefly Nexus'}</title>
        </Helmet>
        {/* Layout principal com sidebar e conteúdo */}
        <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:text-slate-50 transition-colors duration-300" style={{ backgroundColor: darkMode ? '#0F111A' : '#F8FAFC' }}>
          {/* Botão de menu para mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed top-2 left-2 sm:top-4 sm:left-4 z-50 lg:hidden p-2 rounded-md bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Overlay para mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* Sidebar */}
          <aside className={`fixed left-0 top-0 h-full bg-white/90 backdrop-blur-lg border-r border-slate-200 dark:border-slate-800 z-40 ${sidebarCollapsed ? 'w-16 sm:w-20' : 'w-64 sm:w-72'} transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ backgroundColor: darkMode ? 'rgba(15, 17, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)' }}>
            <div className="flex flex-col h-full">
              {/* Cabeçalho da Sidebar - Separado */}
              <div className={`
                p-3 sm:p-6 
                bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50
                border-b border-slate-200/50 dark:border-slate-700/50
                mb-4 sm:mb-8
                ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
                flex items-center
              `}>
                {sidebarCollapsed ? renderCompanyHeaderCollapsed() : renderCompanyHeader()}
              </div>
              
              {/* Separador Visual */}
              <div className="border-t border-slate-200 dark:border-slate-700 mx-4 mb-4 sm:mb-6"></div>
              
              {/* Menu de Navegação */}
              <nav className="flex-1 space-y-1 sm:space-y-2 px-2 sm:px-4">
                {modules.map(module => {
                  const Icon = module.icon;
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        setActiveModule(module.id);
                        // Fechar sidebar em mobile após clicar
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }}
                      className={`w-full flex items-center space-x-2 sm:space-x-3 py-2 sm:py-3 rounded-lg text-left transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-0' : 'px-2 sm:px-4'} ${activeModule === module.id ? '' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      style={activeModule === module.id ? {
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                        color: '#ffffff',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      } : {}}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!sidebarCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden">{t(module.name, currentLanguage)}</span>}
                    </button>
                  );
                })}
              </nav>
              
              {/* Separador Visual - Área do Usuário */}
              <div className="border-t border-slate-200 dark:border-slate-700 mx-4 mb-4"></div>
              
              {/* Avatar, nome e botão sair acima da seta */}
              {usuarioLogado && (
                <div className={`flex items-center gap-2 sm:gap-3 mb-4 px-2 sm:px-4 w-full ${sidebarCollapsed ? 'justify-center' : ''}`} style={{ minHeight: '48px' }}>
                  {usuarioLogado.foto && usuarioLogado.foto.trim() !== '' ? (
                    <img 
                      src={usuarioLogado.foto} 
                      alt={usuarioLogado.nome} 
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-blue-400 dark:border-blue-600 shadow-md"
                      onError={(e) => {
                        console.warn('[App] Erro ao carregar foto do usuário:', e);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="inline-block h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm sm:text-base">
                      {usuarioLogado.nome?.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">{usuarioLogado.nome}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          const newTheme = darkMode ? 'light' : 'dark';
                          setDarkMode(!darkMode);
                          const novasConfiguracoes = { ...configuracoes, tema: newTheme };
                          aplicarConfiguracoes(novasConfiguracoes);
                          // Não disparar evento aqui - apenas aplicar visualmente
                          console.log('[App] Tema alterado via botão:', newTheme);
                        }}
                        className="hover:bg-slate-100 dark:hover:bg-slate-800 ml-1 h-8 w-8 sm:h-10 sm:w-10"
                      >
                        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                      </Button>
                      <Button size="sm" variant="outline" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-2 sm:px-3 py-1 rounded-lg shadow-md transition-colors ml-auto text-xs sm:text-sm" onClick={handleLogout}>Sair</Button>
                    </>
                  )}
                </div>
              )}
              <div className="hidden lg:flex p-2 sm:p-4 border-t border-slate-200 dark:border-slate-800">
                <Button variant="ghost" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400">
                  <ChevronLeft className="h-5 w-5" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                </Button>
              </div>
            </div>
          </aside>
          {/* Conteúdo principal */}
          <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16 sm:ml-20' : 'ml-64 sm:ml-72'} p-2 sm:p-4 lg:p-6 pt-12 sm:pt-16 lg:pt-12`}>
            {renderActiveModule()}
          </main>
        </div>
      </>
      <Toaster />
    </AppContext.Provider>
  );

}

export default App;
