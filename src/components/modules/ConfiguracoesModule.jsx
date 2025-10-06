import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Palette, 
  Users, 
  Shield, 
  Printer, 
  Database, 
  Save, 
  Upload, 
  X, 
  RotateCcw,
  Building2,
  MapPin,
  Monitor,
  Receipt,
  Repeat,
  Phone,
  MessageSquare,
  FileText,
  Mail,
  Globe,
  Camera,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Clock,
  Zap,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Package,
  Activity,
  BarChart3,
  Sun,
  Key,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Tag,
  Info,
  User,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Calculator,
  PieChart,
  UserPlus,
  Heart,
  Layers,
  Star,
  History,
  BookOpen,
  LineChart,
  Truck,
  Percent,
  Wrench,
  Timer
  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { t } from '@/lib/translations';
import CadastroUsuarioForm from './CadastroUsuarioForm';
import UsuariosListagem from './usuarios/UsuariosListagem';
import { AppContext } from '@/App';
import { 
  useConfiguracao, 
  useConfiguracoesLoja, 
  useConfiguracoesUsuarios,
  useConfiguracoesSeguranca,
  useConfiguracoesImpressao,
  useConfiguracoesSistema,
  useUsuarios 
} from '@/lib/hooks/useFirebase';

const ConfiguracoesModule = ({ usuarioLogado }) => {
  const { currentLanguage: appLanguage } = useContext(AppContext);
  const { toast } = useToast();
  
  // Hooks do Firebase
  const { config: configuracoesFirebase, loading: configLoading, saveConfig } = useConfiguracao();
  const { config: configLoja, saveConfig: saveConfigLoja } = useConfiguracoesLoja();
  const { config: configUsuarios, saveConfig: saveConfigUsuarios } = useConfiguracoesUsuarios();
  const { config: configSeguranca, saveConfig: saveConfigSeguranca } = useConfiguracoesSeguranca();
  const { config: configImpressao, saveConfig: saveConfigImpressao } = useConfiguracoesImpressao();
  const { config: configSistema, saveConfig: saveConfigSistema } = useConfiguracoesSistema();
  const { data: usuarios, loading: usuariosLoading, save: saveUsuario } = useUsuarios();
  
  // Estado para controlar aba interna de usuário
  const [abaUsuario, setAbaUsuario] = useState('usuarios');
  
  // Estado para controlar aba atual das configurações
  const [abaAtual, setAbaAtual] = useState('loja');
  
  // Estado local das configurações de personalização
  const [configuracoesPersonalizacao, setConfiguracoesPersonalizacao] = useState({
    tema: 'dark',
    idioma: 'pt-BR',
    // Funcionalidades do Estoque
    gruposEOpcoesAtivo: false,
    // Ações Rápidas do Dashboard
    acoesRapidas: {
      novaOS: true,
      novoLancamento: true,
      novoCliente: true,
      novoUsuario: true,
      novaOV: true,
      abrirCaixa: true,
      adicionarProduto: true,
      movimentacao: true,
      relatorios: true
    },
    // Relatórios do Sistema (71 implementados)
    relatorios: {
      'vendas-por-periodo': true,
      'vendas-por-cliente': true,
      'vendas-por-produto': true,
      'vendas-por-categoria': true,
      'vendas-por-vendedor': true,
      'receitas-periodo': true,
      'despesas-periodo': true,
      'fluxo-caixa-detalhado': true,
      'receitas-despesas': true,
      'contas-receber': true,
      'contas-pagar': true,
      'margem-lucro': true,
      'roi-produtos': true,
      'custo-venda': true,
      'lucratividade-categoria': true,
      'projecao-receitas': true,
      'estoque-atual': true,
      'produtos-baixo-estoque': true,
      'produtos-sem-estoque': true,
      'movimentacao-estoque': true,
      'giro-estoque': true,
      'valor-estoque': true,
      'produtos-vencidos': true,
      'produtos-proximos-vencimento': true,
      'entradas-estoque': true,
      'saidas-estoque': true,
      'clientes-cadastrados': true,
      'clientes-ativos': true,
      'clientes-inativos': true,
      'novos-clientes': true,
      'clientes-fidelidade': true,
      'segmentacao-clientes': true,
      'satisfacao-clientes': true,
      'clientes-potenciais': true,
      'historico-cliente': true,
      'geolocalizacao-clientes': true,
      'catalogo-produtos': true,
      'produtos-mais-vendidos': true,
      'produtos-menos-vendidos': true,
      'produtos-mais-lucrativos': true,
      'sazonalidade-produtos': true,
      'analise-precos': true,
      'margem-produto': true,
      'produtos-categoria': true,
      'produtos-fornecedor': true,
      'produtos-promocao': true,
      'ordens-servico': true,
      'servicos-concluidos': true,
      'servicos-pendentes': true,
      'tempo-medio-servico': true,
      'servicos-atrasados': true,
      'servicos-tecnico': true,
      'servicos-tipo': true,
      'satisfacao-servicos': true,
      'custos-servicos': true,
      'agendamentos': true,
      'performance-vendedores': true,
      'metas-vendas': true,
      'conversao-leads': true,
      'tempo-resposta': true,
      'produtividade-equipe': true,
      'eficiencia-processos': true,
      'qualidade-atendimento': true,
      'retencao-clientes': true,
      'crescimento-receita': true,
      'market-share': true,
      'vendas-por-regiao': true,
      'vendas-por-canal': true,
      'vendas-por-forma-pagamento': true,
      'ticket-medio-cliente': true,
      'frequencia-compra': true
    }
  });

  // Estado para configurações da loja
  const [configLojaLocal, setConfigLojaLocal] = useState({
    nomeEmpresa: '',
    descricao: '',
    endereco: '',
    telefone: '',
    whatsapp: '',
    cnpj: '',
    email: '',
    site: '',
    logo: '',
    imei: ''
  });

  // Estado para configurações de usuários
  const [configUsuariosLocal, setConfigUsuariosLocal] = useState({
    permitirCadastro: true,
    requerAprovacao: false,
    limiteUsuarios: 10,
    notificacaoNovosUsuarios: true,
    permissoes: {
      clientes: {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: false
      },
      os: {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: false
      },
      ov: {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: false
      },
      estoque: {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: false
      },
      caixa: {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: false
      },
      financeiro: {
        visualizar: true,
        criar: true,
        editar: true,
        excluir: false
      },
      relatorios: {
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false
      },
      configuracoes: {
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false
      }
    }
  });

  // Estado para permissões de usuários
  const [permissoesUsuarios, setPermissoesUsuarios] = useState({
    clientes: {
      visualizar: true,
      criar: true,
      editar: true,
      excluir: false
    },
    os: {
      visualizar: true,
      criar: true,
      editar: true,
      excluir: false
    },
    ov: {
      visualizar: true,
      criar: true,
      editar: true,
      excluir: false
    },
    estoque: {
      visualizar: true,
      criar: true,
      editar: true,
      excluir: false
    },
    caixa: {
      visualizar: true,
      criar: true,
      editar: true,
      excluir: false
    },
    financeiro: {
      visualizar: true,
      criar: true,
      editar: true,
      excluir: false
    },
    relatorios: {
      visualizar: true,
      criar: false,
      editar: false,
      excluir: false
    },
    configuracoes: {
      visualizar: false,
      criar: false,
      editar: false,
      excluir: false
    }
  });

  // Estado para configurações de segurança
  const [configSegurancaLocal, setConfigSegurancaLocal] = useState({
    autenticacaoDoisFatores: false,
    tempoSessao: 30,
    tentativasLogin: 3,
    bloqueioAutomatico: true,
    auditoriaAtivada: true
  });

  // Estado para configurações de impressão
  const [configImpressaoLocal, setConfigImpressaoLocal] = useState({
    formatoPadrao: 'A4',
    orientacaoPadrao: 'retrato',
    margemPadrao: 1,
    fontePadrao: 'Arial',
    tamanhoFonte: 12
  });

  // Estado para configurações do sistema
  const [configSistemaLocal, setConfigSistemaLocal] = useState({
    backupAutomatico: true,
    frequenciaBackup: 'diario',
    retencaoBackup: 30,
    logsAtivados: true,
    monitoramentoAtivo: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLoja, setIsSavingLoja] = useState(false);
  const [isSavingPersonalizacao, setIsSavingPersonalizacao] = useState(false);
  const [isSavingUsuarios, setIsSavingUsuarios] = useState(false);
  const [isSavingSeguranca, setIsSavingSeguranca] = useState(false);
  const [isSavingImpressao, setIsSavingImpressao] = useState(false);
  const [isSavingSistema, setIsSavingSistema] = useState(false);
  const [previewLogo, setPreviewLogo] = useState('');
  const [isPermissoesModalOpen, setIsPermissoesModalOpen] = useState(false);
  const [moduloSelecionado, setModuloSelecionado] = useState('clientes');


  // Carregar configurações quando disponíveis
  useEffect(() => {
    if (configuracoesFirebase) {
      setConfiguracoesPersonalizacao(prev => ({ ...prev, ...configuracoesFirebase }));
    }
  }, [configuracoesFirebase]);

  useEffect(() => {
    if (configLoja) {
      setConfigLojaLocal({
        nomeEmpresa: configLoja.nomeEmpresa || '',
        descricao: configLoja.descricao || '',
        endereco: configLoja.endereco || '',
        telefone: configLoja.telefone || '',
        whatsapp: configLoja.whatsapp || '',
        cnpj: configLoja.cnpj || '',
        email: configLoja.email || '',
        site: configLoja.site || '',
        logo: configLoja.logo || '',
        imei: configLoja.imei || ''
      });
    }
  }, [configLoja]);

  useEffect(() => {
    if (configUsuarios) {
      setConfigUsuariosLocal({
        permitirCadastro: configUsuarios.permitirCadastro ?? true,
        requerAprovacao: configUsuarios.requerAprovacao ?? false,
        limiteUsuarios: configUsuarios.limiteUsuarios ?? 10,
        notificacaoNovosUsuarios: configUsuarios.notificacaoNovosUsuarios ?? true,
        permissoes: configUsuarios.permissoes || {
          clientes: { visualizar: true, criar: true, editar: true, excluir: false },
          os: { visualizar: true, criar: true, editar: true, excluir: false },
          ov: { visualizar: true, criar: true, editar: true, excluir: false },
          estoque: { visualizar: true, criar: true, editar: true, excluir: false },
          caixa: { visualizar: true, criar: true, editar: true, excluir: false },
          financeiro: { visualizar: true, criar: true, editar: true, excluir: false },
          relatorios: { visualizar: true, criar: false, editar: false, excluir: false },
          configuracoes: { visualizar: false, criar: false, editar: false, excluir: false }
        }
      });
      
      // Sincronizar com o estado de permissões do modal
      if (configUsuarios.permissoes) {
        setPermissoesUsuarios(configUsuarios.permissoes);
      }
    }
  }, [configUsuarios]);

  useEffect(() => {
    if (configSeguranca) {
      setConfigSegurancaLocal({
        autenticacaoDoisFatores: configSeguranca.autenticacaoDoisFatores ?? false,
        tempoSessao: configSeguranca.tempoSessao ?? 30,
        tentativasLogin: configSeguranca.tentativasLogin ?? 3,
        bloqueioAutomatico: configSeguranca.bloqueioAutomatico ?? true,
        auditoriaAtivada: configSeguranca.auditoriaAtivada ?? true
      });
    }
  }, [configSeguranca]);

  useEffect(() => {
    if (configImpressao) {
      setConfigImpressaoLocal({
        formatoPadrao: configImpressao.formatoPadrao || 'A4',
        orientacaoPadrao: configImpressao.orientacaoPadrao || 'retrato',
        margemPadrao: configImpressao.margemPadrao || 1,
        fontePadrao: configImpressao.fontePadrao || 'Arial',
        tamanhoFonte: configImpressao.tamanhoFonte || 12
      });
    }
  }, [configImpressao]);

  useEffect(() => {
    if (configSistema) {
      setConfigSistemaLocal({
        backupAutomatico: configSistema.backupAutomatico ?? true,
        frequenciaBackup: configSistema.frequenciaBackup || 'diario',
        retencaoBackup: configSistema.retencaoBackup || 30,
        logsAtivados: configSistema.logsAtivados ?? true,
        monitoramentoAtivo: configSistema.monitoramentoAtivo ?? true
      });
    }
  }, [configSistema]);

  useEffect(() => {
    if (configuracoesFirebase) {
      setPreviewLogo(configuracoesFirebase.logo || '');
    }
  }, [configuracoesFirebase]);


  const handleConfigPersonalizacaoChange = (key, value) => {
    setConfiguracoesPersonalizacao(prev => ({ ...prev, [key]: value }));
  };

  const handleRelatorioChange = (relatorioId, enabled) => {
    setConfiguracoesPersonalizacao(prev => ({
      ...prev,
      relatorios: {
        ...prev.relatorios,
        [relatorioId]: enabled
      }
    }));
  };

  const handleConfigLojaChange = (key, value) => {
    setConfigLojaLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleConfigUsuariosChange = (key, value) => {
    setConfigUsuariosLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleConfigSegurancaChange = (key, value) => {
    setConfigSegurancaLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleConfigImpressaoChange = (key, value) => {
    setConfigImpressaoLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleConfigSistemaChange = (key, value) => {
    setConfigSistemaLocal(prev => ({ ...prev, [key]: value }));
  };

  const handlePermissaoChange = (modulo, acao, value) => {
    const novasPermissoes = {
      ...permissoesUsuarios,
      [modulo]: {
        ...permissoesUsuarios[modulo],
        [acao]: value
      }
    };
    
    setPermissoesUsuarios(novasPermissoes);
    
    // Atualizar também o estado local das configurações de usuários
    setConfigUsuariosLocal(prev => ({
      ...prev,
      permissoes: novasPermissoes
    }));
  };


  // Função para salvar configurações da Loja
  const handleSaveLoja = async () => {
    // Validar campos obrigatórios da loja
    if (!configLojaLocal.nomeEmpresa || !configLojaLocal.endereco || !configLojaLocal.telefone) {
      toast({
        title: "Erro",
        description: "Nome da empresa, endereço e telefone são obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    setIsSavingLoja(true);
    try {
      await saveConfigLoja(configLojaLocal);
      toast({
        title: "Sucesso!",
        description: "Configurações da loja salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações da loja:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações da loja. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSavingLoja(false);
    }
  };

  // Função para salvar configurações de Personalização
  const handleSavePersonalizacao = async () => {
    setIsSavingPersonalizacao(true);
    try {
      await saveConfig(configuracoesPersonalizacao);
      toast({
        title: "Sucesso!",
        description: "Configurações de personalização salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de personalização:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de personalização. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSavingPersonalizacao(false);
    }
  };

  // Função para salvar configurações de Usuários
  const handleSaveUsuarios = async () => {
    setIsSavingUsuarios(true);
    try {
      await saveConfigUsuarios(configUsuariosLocal);
      toast({
        title: "Sucesso!",
        description: "Configurações de usuários salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de usuários. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSavingUsuarios(false);
    }
  };

  // Função para salvar configurações de Segurança
  const handleSaveSeguranca = async () => {
    setIsSavingSeguranca(true);
    try {
      await saveConfigSeguranca(configSegurancaLocal);
      toast({
        title: "Sucesso!",
        description: "Configurações de segurança salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de segurança:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de segurança. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSavingSeguranca(false);
    }
  };

  // Função para salvar configurações de Impressão
  const handleSaveImpressao = async () => {
    setIsSavingImpressao(true);
    try {
      await saveConfigImpressao(configImpressaoLocal);
      toast({
        title: "Sucesso!",
        description: "Configurações de impressão salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de impressão:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de impressão. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSavingImpressao(false);
    }
  };

  // Função para salvar configurações do Sistema
  const handleSaveSistema = async () => {
    setIsSavingSistema(true);
    try {
      await saveConfigSistema(configSistemaLocal);
      toast({
        title: "Sucesso!",
        description: "Configurações do sistema salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações do sistema:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações do sistema. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSavingSistema(false);
    }
  };

  // Função para aprovar ou rejeitar usuário
  const handleAprovarUsuario = async (usuarioId, aprovado) => {
    try {
      const usuario = usuarios.find(u => u.id === usuarioId);
      if (!usuario) {
        toast({
          title: "Usuário não encontrado",
          description: "Não foi possível encontrar o usuário especificado.",
          variant: "destructive"
        });
        return;
      }

      const usuarioAtualizado = {
        ...usuario,
        status: aprovado ? 'ativo' : 'rejeitado',
        aprovadoPor: usuarioLogado?.nome || 'Administrador',
        dataAprovacao: new Date().toISOString()
      };

      // Corrigido: Passar apenas o objeto atualizado (saveUsuario gerencia o ID automaticamente)
      await saveUsuario(usuarioAtualizado);

      toast({
        title: aprovado ? "Usuário aprovado!" : "Usuário rejeitado!",
        description: aprovado 
          ? `${usuario.nome} foi aprovado e pode fazer login.`
          : `${usuario.nome} foi rejeitado.`,
      });
    } catch (error) {
      console.error('Erro ao aprovar/rejeitar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar aprovação. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const resetToDefaults = () => {
    setConfiguracoesPersonalizacao({
      tema: 'dark',
      idioma: 'pt-BR',
      acoesRapidas: {
        novaOS: true,
        novoLancamento: true,
        novoCliente: true,
        novoUsuario: true,
        novaOV: true,
        abrirCaixa: true,
        adicionarProduto: true,
        movimentacao: true,
        relatorios: true
      }
    });
    setConfigUsuariosLocal({
      permitirCadastro: true,
      requerAprovacao: false,
      limiteUsuarios: 10,
      notificacaoNovosUsuarios: true
    });
    setConfigSegurancaLocal({
      autenticacaoDoisFatores: false,
      tempoSessao: 30,
      tentativasLogin: 3,
      bloqueioAutomatico: true,
      auditoriaAtivada: true
    });
    setConfigImpressaoLocal({
      formatoPadrao: 'A4',
      orientacaoPadrao: 'retrato',
      margemPadrao: 1,
      fontePadrao: 'Arial',
      tamanhoFonte: 12
    });
    setConfigSistemaLocal({
      backupAutomatico: true,
      frequenciaBackup: 'diario',
      retencaoBackup: 30,
      logsAtivados: true,
      monitoramentoAtivo: true
    });
  };


  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-slate-600 dark:text-slate-400">Carregando configurações...</p>
    </div>
  );
  }

  return (
    <div className="space-y-8">
      {/* Header Turbinado */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 rounded-2xl p-8 text-white shadow-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Settings className="h-10 w-10" />
    </div>
          <div>
            <h1 className="text-4xl font-bold">Configurações do Sistema</h1>
            <p className="text-purple-100 text-lg">Gerencie todas as configurações e preferências</p>
    </div>
      </div>
      </motion.div>

      {/* Tabs Turbinadas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden w-full max-w-7xl mx-auto"
      >
        <Tabs value={abaAtual} onValueChange={setAbaAtual} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 bg-slate-100 dark:bg-slate-700/50 rounded-none border-b border-slate-200 dark:border-slate-600 p-1">
            <TabsTrigger value="loja" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Loja</span>
            </TabsTrigger>
            <TabsTrigger value="personalizacao" className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Personalização</span>
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="impressao" className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Impressão</span>
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center gap-2 data-[state=active]:bg-slate-600 data-[state=active]:text-white hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
          </TabsList>

          {/* Loja */}
          <TabsContent value="loja" className="p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações da Loja</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Configure os dados da sua empresa que aparecerão nos documentos impressos (ordens de serviço, orçamentos, etc.) e em outros locais do sistema.</p>
              </div>
            </div>

            <div className="space-y-8">
              
              
              {/* Informações Básicas */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Informações Básicas</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="loja-nomeEmpresa">Nome da Empresa *</Label>
                    <Input
                      id="loja-nomeEmpresa"
                      value={configLojaLocal.nomeEmpresa}
                      onChange={(e) => handleConfigLojaChange('nomeEmpresa', e.target.value)}
                      placeholder="Ex: MultiSmart"
                      className="h-12"
                      required
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Nome que aparecerá nos documentos impressos (ordens de serviço, orçamentos).</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loja-descricao">Descrição dos Serviços</Label>
                    <Input
                      id="loja-descricao"
                      value={configLojaLocal.descricao}
                      onChange={(e) => handleConfigLojaChange('descricao', e.target.value)}
                      placeholder="Ex: Manutenção e Comércio de Celulares e Tablets"
                      className="h-12"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Descrição que aparecerá abaixo do nome da empresa nos documentos impressos.</p>
                  </div>
                </div>
              </div>


              {/* Informações de Contato */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Informações de Contato</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="loja-telefone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone *
                    </Label>
                    <Input
                      id="loja-telefone"
                      value={configLojaLocal.telefone}
                      onChange={(e) => handleConfigLojaChange('telefone', e.target.value)}
                      placeholder="(17) 3345-1016"
                      className="h-12"
                      required
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Telefone que aparecerá nos documentos impressos.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loja-whatsapp" className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp
                    </Label>
                    <Input
                      id="loja-whatsapp"
                      value={configLojaLocal.whatsapp}
                      onChange={(e) => handleConfigLojaChange('whatsapp', e.target.value)}
                      placeholder="(17) 99157-1263"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loja-email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-mail
                    </Label>
                    <Input
                      id="loja-email"
                      type="email"
                      value={configLojaLocal.email}
                      onChange={(e) => handleConfigLojaChange('email', e.target.value)}
                      placeholder="contato@multismart.com"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loja-site" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Site/URL
                  </Label>
                  <Input
                    id="loja-site"
                    value={configLojaLocal.site}
                    onChange={(e) => handleConfigLojaChange('site', e.target.value)}
                    placeholder="https://www.multismart.com"
                    className="h-12"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <MapPin className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Endereço</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loja-endereco">Endereço Completo *</Label>
                  <Textarea
                    id="loja-endereco"
                    value={configLojaLocal.endereco}
                    onChange={(e) => handleConfigLojaChange('endereco', e.target.value)}
                    placeholder="Rua José Pedro dos Santos nº74 - JD das Lanjeiras, Bebedouro - SP"
                    rows={3}
                    className="resize-none"
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Endereço completo que aparecerá nos documentos impressos.</p>
                </div>
              </div>

              {/* Documentos */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Documentos</h3>
      </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="loja-cnpj">CNPJ</Label>
                    <Input
                      id="loja-cnpj"
                      value={configLojaLocal.cnpj}
                      onChange={(e) => handleConfigLojaChange('cnpj', e.target.value)}
                      placeholder="47.309.271/0001-97"
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="loja-imei">IMEI Padrão</Label>
                    <Input
                      id="loja-imei"
                      value={configLojaLocal.imei}
                      onChange={(e) => handleConfigLojaChange('imei', e.target.value)}
                      placeholder="123456789012345"
                      className="h-12"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">IMEI padrão que aparecerá nas ordens de serviço impressas.</p>
                  </div>
                </div>
              </div>

              {/* Botão de Salvar - Loja */}
              <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                  onClick={handleSaveLoja}
                  disabled={isSavingLoja}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 h-12 px-8"
                >
                  {isSavingLoja ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Salvar Configurações da Loja
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Personalização */}
          <TabsContent value="personalizacao" className="p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Personalização do Sistema</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Configure tema e idioma do sistema</p>
              </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                  Tema
              </CardTitle>
                  <CardDescription>Configure o tema visual do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <Select value={configuracoesPersonalizacao.tema} onValueChange={(value) => handleConfigPersonalizacaoChange('tema', value)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
        </SelectContent>
      </Select>
                  </div>
                </CardContent>
              </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                     Idioma
               </CardTitle>
                  <CardDescription>Configurações de idioma do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select value={configuracoesPersonalizacao.idioma} onValueChange={(value) => handleConfigPersonalizacaoChange('idioma', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas do Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                Ações Rápidas do Dashboard
              </CardTitle>
              <CardDescription>Configure quais ações rápidas aparecem no dashboard principal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <Label className="font-medium">Nova OS</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Criar nova ordem de serviço</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.acoesRapidas.novaOS}
                    onCheckedChange={(checked) => handleConfigPersonalizacaoChange('acoesRapidas', { ...configuracoesPersonalizacao.acoesRapidas, novaOS: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <Label className="font-medium">Novo Lançamento</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Criar novo lançamento financeiro</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.acoesRapidas.novoLancamento}
                    onCheckedChange={(checked) => handleConfigPersonalizacaoChange('acoesRapidas', { ...configuracoesPersonalizacao.acoesRapidas, novoLancamento: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <Label className="font-medium">Novo Cliente</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Cadastrar novo cliente</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.acoesRapidas.novoCliente}
                    onCheckedChange={(checked) => handleConfigPersonalizacaoChange('acoesRapidas', { ...configuracoesPersonalizacao.acoesRapidas, novoCliente: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    <div>
                      <Label className="font-medium">Novo Usuário</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Cadastrar novo usuário do sistema</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.acoesRapidas.novoUsuario}
                    onCheckedChange={(checked) => handleConfigPersonalizacaoChange('acoesRapidas', { ...configuracoesPersonalizacao.acoesRapidas, novoUsuario: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <Label className="font-medium">Nova OV</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Criar nova ordem de venda</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.acoesRapidas.novaOV}
                    onCheckedChange={(checked) => handleConfigPersonalizacaoChange('acoesRapidas', { ...configuracoesPersonalizacao.acoesRapidas, novaOV: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <Label className="font-medium">Abrir Caixa</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Abrir caixa do dia</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.acoesRapidas.abrirCaixa}
                    onCheckedChange={(checked) => handleConfigPersonalizacaoChange('acoesRapidas', { ...configuracoesPersonalizacao.acoesRapidas, abrirCaixa: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <Label className="font-medium">Adicionar Produto</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Cadastrar novo produto</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.acoesRapidas.adicionarProduto}
                    onCheckedChange={(checked) => handleConfigPersonalizacaoChange('acoesRapidas', { ...configuracoesPersonalizacao.acoesRapidas, adicionarProduto: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    <div>
                      <Label className="font-medium">Movimentação</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Entrada/Saída de estoque</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.acoesRapidas.movimentacao}
                    onCheckedChange={(checked) => handleConfigPersonalizacaoChange('acoesRapidas', { ...configuracoesPersonalizacao.acoesRapidas, movimentacao: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <Label className="font-medium">Relatórios</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Ver relatórios e análises</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.acoesRapidas.relatorios}
                    onCheckedChange={(checked) => handleConfigPersonalizacaoChange('acoesRapidas', { ...configuracoesPersonalizacao.acoesRapidas, relatorios: checked })}
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">Dica:</p>
                    <p>As ações desabilitadas não aparecerão no dashboard principal, mas ainda podem ser acessadas através dos módulos correspondentes na barra de navegação.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Funcionalidades do Estoque */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Funcionalidades do Estoque
              </CardTitle>
              <CardDescription>Configure funcionalidades avançadas do módulo de estoque</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <Label className="font-medium text-lg">Grupos e Opções</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Ativar sistema de grupos e opções para produtos</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Permite criar grupos de opções (ex: "Adicionais", "Tamanhos") e vinculá-las a produtos ou categorias
                    </p>
                  </div>
                </div>
                <Switch
                  checked={configuracoesPersonalizacao.gruposEOpcoesAtivo}
                  onCheckedChange={(checked) => handleConfigPersonalizacaoChange('gruposEOpcoesAtivo', checked)}
                  className="scale-110"
                />
              </div>

              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-emerald-800 dark:text-emerald-200">
                    <p className="font-medium">Como funciona:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Cria grupos de opções (ex: "Adicionais", "Tamanhos")</li>
                      <li>• Define opções dentro dos grupos (ex: "Queijo Extra", "Bacon")</li>
                      <li>• Vincula grupos a produtos ou categorias</li>
                      <li>• Clientes escolhem quantidades no módulo de vendas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relatórios do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Relatórios do Sistema
              </CardTitle>
              <CardDescription>Habilite ou desabilite relatórios específicos que aparecem na aba de relatórios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Vendas por Período */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Vendas por Período</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de vendas filtradas por período</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['vendas-por-periodo']}
                    onCheckedChange={(checked) => handleRelatorioChange('vendas-por-periodo', checked)}
                  />
                </div>

                {/* Vendas por Cliente */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Vendas por Cliente</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de vendas agrupadas por cliente</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['vendas-por-cliente']}
                    onCheckedChange={(checked) => handleRelatorioChange('vendas-por-cliente', checked)}
                  />
                </div>

                {/* Vendas por Produto */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Vendas por Produto</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de vendas agrupadas por produto</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['vendas-por-produto']}
                    onCheckedChange={(checked) => handleRelatorioChange('vendas-por-produto', checked)}
                  />
                </div>

                {/* Vendas por Categoria */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Tag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Vendas por Categoria</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de vendas agrupadas por categoria</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['vendas-por-categoria']}
                    onCheckedChange={(checked) => handleRelatorioChange('vendas-por-categoria', checked)}
                  />
                </div>

                {/* Vendas por Vendedor */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Vendas por Vendedor</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de vendas agrupadas por vendedor</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['vendas-por-vendedor']}
                    onCheckedChange={(checked) => handleRelatorioChange('vendas-por-vendedor', checked)}
                  />
                </div>

                {/* Receitas por Período */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Receitas por Período</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de receitas filtradas por período</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['receitas-periodo']}
                    onCheckedChange={(checked) => handleRelatorioChange('receitas-periodo', checked)}
                  />
                </div>

                {/* Despesas por Período */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Despesas por Período</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de despesas filtradas por período</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['despesas-periodo']}
                    onCheckedChange={(checked) => handleRelatorioChange('despesas-periodo', checked)}
                  />
                </div>

                {/* Fluxo de Caixa Detalhado */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Fluxo de Caixa Detalhado</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório detalhado do fluxo de caixa</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['fluxo-caixa-detalhado']}
                    onCheckedChange={(checked) => handleRelatorioChange('fluxo-caixa-detalhado', checked)}
                  />
                </div>

                {/* Receitas vs Despesas */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Receitas vs Despesas</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Comparativo entre receitas e despesas</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['receitas-despesas']}
                    onCheckedChange={(checked) => handleRelatorioChange('receitas-despesas', checked)}
                  />
                </div>

                {/* Contas a Receber */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Contas a Receber</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de contas a receber pendentes</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['contas-receber']}
                    onCheckedChange={(checked) => handleRelatorioChange('contas-receber', checked)}
                  />
                </div>

                {/* Contas a Pagar */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Contas a Pagar</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de contas a pagar pendentes</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['contas-pagar']}
                    onCheckedChange={(checked) => handleRelatorioChange('contas-pagar', checked)}
                  />
                </div>

                {/* Margem de Lucro */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Margem de Lucro</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de margem de lucro por produto/categoria</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['margem-lucro']}
                    onCheckedChange={(checked) => handleRelatorioChange('margem-lucro', checked)}
                  />
                </div>

                {/* ROI por Produto */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Label className="font-medium">ROI por Produto</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de retorno sobre investimento por produto</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['roi-produtos']}
                    onCheckedChange={(checked) => handleRelatorioChange('roi-produtos', checked)}
                  />
                </div>

                {/* Custo por Venda */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                      <Calculator className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Custo por Venda</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de custos associados a cada venda</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['custo-venda']}
                    onCheckedChange={(checked) => handleRelatorioChange('custo-venda', checked)}
                  />
                </div>

                {/* Lucratividade por Categoria */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                      <PieChart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Lucratividade por Categoria</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de lucratividade por categoria de produto</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['lucratividade-categoria']}
                    onCheckedChange={(checked) => handleRelatorioChange('lucratividade-categoria', checked)}
                  />
                </div>

                {/* Projeção de Receitas */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Projeção de Receitas</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de projeção de receitas futuras</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['projecao-receitas']}
                    onCheckedChange={(checked) => handleRelatorioChange('projecao-receitas', checked)}
                  />
                </div>

                {/* Estoque Atual */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Estoque Atual</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de estoque atual de produtos</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['estoque-atual']}
                    onCheckedChange={(checked) => handleRelatorioChange('estoque-atual', checked)}
                  />
                </div>

                {/* Produtos com Baixo Estoque */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Produtos com Baixo Estoque</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de produtos com estoque baixo ou zerado</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['produtos-baixo-estoque']}
                    onCheckedChange={(checked) => handleRelatorioChange('produtos-baixo-estoque', checked)}
                  />
                </div>

                {/* Produtos sem Estoque */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
                      <Package className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Produtos sem Estoque</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de produtos com estoque zerado</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['produtos-sem-estoque']}
                    onCheckedChange={(checked) => handleRelatorioChange('produtos-sem-estoque', checked)}
                  />
                </div>

                {/* Movimentação de Estoque */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Movimentação de Estoque</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de movimentações de entrada e saída do estoque</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['movimentacao-estoque']}
                    onCheckedChange={(checked) => handleRelatorioChange('movimentacao-estoque', checked)}
                  />
                </div>

                {/* Giro de Estoque */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <RotateCcw className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Giro de Estoque</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de velocidade de rotação do estoque</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['giro-estoque']}
                    onCheckedChange={(checked) => handleRelatorioChange('giro-estoque', checked)}
                  />
                </div>

                {/* Valor do Estoque */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Valor do Estoque</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de valor monetário total do estoque</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['valor-estoque']}
                    onCheckedChange={(checked) => handleRelatorioChange('valor-estoque', checked)}
                  />
                </div>

                {/* Produtos Vencidos */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Produtos Vencidos</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de produtos com data de validade vencida</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['produtos-vencidos']}
                    onCheckedChange={(checked) => handleRelatorioChange('produtos-vencidos', checked)}
                  />
                </div>

                {/* Produtos Próximos ao Vencimento */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Produtos Próximos ao Vencimento</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de produtos próximos da data de validade</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['produtos-proximos-vencimento']}
                    onCheckedChange={(checked) => handleRelatorioChange('produtos-proximos-vencimento', checked)}
                  />
                </div>

                {/* Entradas de Estoque */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Entradas de Estoque</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de entradas e compras de produtos no estoque</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['entradas-estoque']}
                    onCheckedChange={(checked) => handleRelatorioChange('entradas-estoque', checked)}
                  />
                </div>

                {/* Saídas de Estoque */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Saídas de Estoque</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de saídas e vendas de produtos do estoque</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['saidas-estoque']}
                    onCheckedChange={(checked) => handleRelatorioChange('saidas-estoque', checked)}
                  />
                </div>

                {/* Clientes Cadastrados */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Clientes Cadastrados</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de todos os clientes cadastrados no sistema</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['clientes-cadastrados']}
                    onCheckedChange={(checked) => handleRelatorioChange('clientes-cadastrados', checked)}
                  />
                </div>

                {/* Clientes Ativos */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Clientes Ativos</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de clientes com status ativo no sistema</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['clientes-ativos']}
                    onCheckedChange={(checked) => handleRelatorioChange('clientes-ativos', checked)}
                  />
                </div>

                {/* Clientes Inativos */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Clientes Inativos</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de clientes com status inativo no sistema</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['clientes-inativos']}
                    onCheckedChange={(checked) => handleRelatorioChange('clientes-inativos', checked)}
                  />
                </div>

                {/* Novos Clientes */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Novos Clientes</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de clientes cadastrados recentemente</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['novos-clientes']}
                    onCheckedChange={(checked) => handleRelatorioChange('novos-clientes', checked)}
                  />
                </div>

                {/* Clientes Fidelidade */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Clientes Fidelidade</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de clientes com maior fidelidade e recorrência</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['clientes-fidelidade']}
                    onCheckedChange={(checked) => handleRelatorioChange('clientes-fidelidade', checked)}
                  />
                </div>

                {/* Segmentação de Clientes */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Segmentação de Clientes</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de segmentação e categorização de clientes</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['segmentacao-clientes']}
                    onCheckedChange={(checked) => handleRelatorioChange('segmentacao-clientes', checked)}
                  />
                </div>

                {/* Satisfação dos Clientes */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Satisfação dos Clientes</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de avaliação e satisfação dos clientes</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['satisfacao-clientes']}
                    onCheckedChange={(checked) => handleRelatorioChange('satisfacao-clientes', checked)}
                  />
                </div>

                {/* Clientes Potenciais */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Clientes Potenciais</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de clientes com potencial de compra</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['clientes-potenciais']}
                    onCheckedChange={(checked) => handleRelatorioChange('clientes-potenciais', checked)}
                  />
                </div>

                {/* Histórico por Cliente */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <History className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Histórico por Cliente</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de histórico completo de compras por cliente</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['historico-cliente']}
                    onCheckedChange={(checked) => handleRelatorioChange('historico-cliente', checked)}
                  />
                </div>

                {/* Geolocalização de Clientes */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                      <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Geolocalização de Clientes</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de distribuição geográfica dos clientes</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['geolocalizacao-clientes']}
                    onCheckedChange={(checked) => handleRelatorioChange('geolocalizacao-clientes', checked)}
                  />
                </div>

                {/* Catálogo de Produtos */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <BookOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Catálogo de Produtos</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório completo do catálogo de produtos</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['catalogo-produtos']}
                    onCheckedChange={(checked) => handleRelatorioChange('catalogo-produtos', checked)}
                  />
                </div>

                {/* Produtos Mais Vendidos */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Produtos Mais Vendidos</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório dos produtos com maior volume de vendas</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['produtos-mais-vendidos']}
                    onCheckedChange={(checked) => handleRelatorioChange('produtos-mais-vendidos', checked)}
                  />
                </div>

                {/* Produtos Menos Vendidos */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Produtos Menos Vendidos</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório dos produtos com menor volume de vendas</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['produtos-menos-vendidos']}
                    onCheckedChange={(checked) => handleRelatorioChange('produtos-menos-vendidos', checked)}
                  />
                </div>

                {/* Produtos Mais Lucrativos */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Produtos Mais Lucrativos</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório dos produtos com maior margem de lucro</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['produtos-mais-lucrativos']}
                    onCheckedChange={(checked) => handleRelatorioChange('produtos-mais-lucrativos', checked)}
                  />
                </div>

                {/* Sazonalidade de Produtos */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Sazonalidade de Produtos</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de variação sazonal nas vendas de produtos</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['sazonalidade-produtos']}
                    onCheckedChange={(checked) => handleRelatorioChange('sazonalidade-produtos', checked)}
                  />
                </div>

                {/* Análise de Preços */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                      <LineChart className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Análise de Preços</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de análise comparativa de preços de produtos</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['analise-precos']}
                    onCheckedChange={(checked) => handleRelatorioChange('analise-precos', checked)}
                  />
                </div>

                {/* Margem por Produto */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Margem por Produto</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de margem de lucro individual por produto</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['margem-produto']}
                    onCheckedChange={(checked) => handleRelatorioChange('margem-produto', checked)}
                  />
                </div>

                {/* Produtos por Categoria */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Tag className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Produtos por Categoria</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de produtos organizados por categoria</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['produtos-categoria']}
                    onCheckedChange={(checked) => handleRelatorioChange('produtos-categoria', checked)}
                  />
                </div>

                {/* Produtos por Fornecedor */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                      <Truck className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Produtos por Fornecedor</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de produtos organizados por fornecedor</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['produtos-fornecedor']}
                    onCheckedChange={(checked) => handleRelatorioChange('produtos-fornecedor', checked)}
                  />
                </div>

                {/* Produtos em Promoção */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Percent className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Produtos em Promoção</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de produtos com desconto ou promoção ativa</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['produtos-promocao']}
                    onCheckedChange={(checked) => handleRelatorioChange('produtos-promocao', checked)}
                  />
                </div>

                {/* Ordens de Serviço */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Ordens de Serviço</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de ordens de serviço cadastradas</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['ordens-servico']}
                    onCheckedChange={(checked) => handleRelatorioChange('ordens-servico', checked)}
                  />
                </div>

                {/* Serviços Concluídos */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Serviços Concluídos</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de serviços finalizados e entregues</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['servicos-concluidos']}
                    onCheckedChange={(checked) => handleRelatorioChange('servicos-concluidos', checked)}
                  />
                </div>

                {/* Serviços Pendentes */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Serviços Pendentes</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de serviços aguardando conclusão</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['servicos-pendentes']}
                    onCheckedChange={(checked) => handleRelatorioChange('servicos-pendentes', checked)}
                  />
                </div>

                {/* Tempo Médio de Serviço */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Timer className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Tempo Médio de Serviço</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de tempo médio para conclusão de serviços</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['tempo-medio-servico']}
                    onCheckedChange={(checked) => handleRelatorioChange('tempo-medio-servico', checked)}
                  />
                </div>

                {/* Serviços Atrasados */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Serviços Atrasados</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de serviços com prazo de entrega vencido</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['servicos-atrasados']}
                    onCheckedChange={(checked) => handleRelatorioChange('servicos-atrasados', checked)}
                  />
                </div>

                {/* Serviços por Técnico */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Serviços por Técnico</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de serviços atribuídos por técnico</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['servicos-tecnico']}
                    onCheckedChange={(checked) => handleRelatorioChange('servicos-tecnico', checked)}
                  />
                </div>

                {/* Serviços por Tipo */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                      <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Serviços por Tipo</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de serviços categorizados por tipo</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['servicos-tipo']}
                    onCheckedChange={(checked) => handleRelatorioChange('servicos-tipo', checked)}
                  />
                </div>

                {/* Satisfação dos Serviços */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Satisfação dos Serviços</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de avaliação e satisfação dos serviços prestados</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['satisfacao-servicos']}
                    onCheckedChange={(checked) => handleRelatorioChange('satisfacao-servicos', checked)}
                  />
                </div>

                {/* Custos dos Serviços */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Custos dos Serviços</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de custos e despesas dos serviços prestados</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['custos-servicos']}
                    onCheckedChange={(checked) => handleRelatorioChange('custos-servicos', checked)}
                  />
                </div>

                {/* Agendamentos */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Agendamentos</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de agendamentos de serviços</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['agendamentos']}
                    onCheckedChange={(checked) => handleRelatorioChange('agendamentos', checked)}
                  />
                </div>

                {/* Performance dos Vendedores */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Performance dos Vendedores</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de desempenho e produtividade dos vendedores</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['performance-vendedores']}
                    onCheckedChange={(checked) => handleRelatorioChange('performance-vendedores', checked)}
                  />
                </div>

                {/* Metas de Vendas */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Metas de Vendas</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de cumprimento de metas de vendas</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['metas-vendas']}
                    onCheckedChange={(checked) => handleRelatorioChange('metas-vendas', checked)}
                  />
                </div>

                {/* Conversão de Leads */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Conversão de Leads</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de taxa de conversão de leads em vendas</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['conversao-leads']}
                    onCheckedChange={(checked) => handleRelatorioChange('conversao-leads', checked)}
                  />
                </div>

                {/* Tempo de Resposta */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                      <Timer className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Tempo de Resposta</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de tempo médio de resposta a clientes</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['tempo-resposta']}
                    onCheckedChange={(checked) => handleRelatorioChange('tempo-resposta', checked)}
                  />
                </div>

                {/* Produtividade da Equipe */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Produtividade da Equipe</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de produtividade e desempenho da equipe</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['produtividade-equipe']}
                    onCheckedChange={(checked) => handleRelatorioChange('produtividade-equipe', checked)}
                  />
                </div>

                {/* Eficiência dos Processos */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                      <Settings className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Eficiência dos Processos</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de eficiência e otimização dos processos</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['eficiencia-processos']}
                    onCheckedChange={(checked) => handleRelatorioChange('eficiencia-processos', checked)}
                  />
                </div>

                {/* Qualidade do Atendimento */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <Star className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Qualidade do Atendimento</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de qualidade e avaliação do atendimento</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['qualidade-atendimento']}
                    onCheckedChange={(checked) => handleRelatorioChange('qualidade-atendimento', checked)}
                  />
                </div>

                {/* Retenção de Clientes */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Retenção de Clientes</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de taxa de retenção e fidelização de clientes</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['retencao-clientes']}
                    onCheckedChange={(checked) => handleRelatorioChange('retencao-clientes', checked)}
                  />
                </div>

                {/* Crescimento da Receita */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Crescimento da Receita</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de crescimento e evolução da receita</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['crescimento-receita']}
                    onCheckedChange={(checked) => handleRelatorioChange('crescimento-receita', checked)}
                  />
                </div>

                {/* Market Share */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Market Share</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de participação no mercado</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['market-share']}
                    onCheckedChange={(checked) => handleRelatorioChange('market-share', checked)}
                  />
                </div>

                {/* Vendas por Região */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Vendas por Região</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de vendas segmentadas por região geográfica</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['vendas-por-regiao']}
                    onCheckedChange={(checked) => handleRelatorioChange('vendas-por-regiao', checked)}
                  />
                </div>

                {/* Vendas por Canal */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Monitor className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Vendas por Canal</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de vendas segmentadas por canal de vendas</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['vendas-por-canal']}
                    onCheckedChange={(checked) => handleRelatorioChange('vendas-por-canal', checked)}
                  />
                </div>

                {/* Vendas por Forma de Pagamento */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <CreditCard className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Vendas por Forma de Pagamento</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório de vendas segmentadas por forma de pagamento</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['vendas-por-forma-pagamento']}
                    onCheckedChange={(checked) => handleRelatorioChange('vendas-por-forma-pagamento', checked)}
                  />
                </div>

                {/* Ticket Médio por Cliente */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                      <Receipt className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Ticket Médio por Cliente</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório do valor médio gasto por cliente</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['ticket-medio-cliente']}
                    onCheckedChange={(checked) => handleRelatorioChange('ticket-medio-cliente', checked)}
                  />
                </div>

                {/* Frequência de Compra */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                      <Repeat className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Frequência de Compra</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Relatório da frequência de compras dos clientes</p>
                    </div>
                  </div>
                  <Switch
                    checked={configuracoesPersonalizacao.relatorios['frequencia-compra']}
                    onCheckedChange={(checked) => handleRelatorioChange('frequencia-compra', checked)}
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">Implementação em etapas:</p>
                    <p className="text-xs mt-1">
                      Todos os relatórios do sistema foram implementados! 
                      Atualmente: 71 de 71 relatórios configuráveis.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>

            {/* Botão de Salvar - Personalização */}
            <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={handleSavePersonalizacao}
                disabled={isSavingPersonalizacao}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 h-12 px-8"
              >
                {isSavingPersonalizacao ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Salvar Configurações de Personalização
                  </>
                )}
              </Button>
            </div>
        </TabsContent>

          {/* Usuários */}
          <TabsContent value="usuarios" className="p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciamento de Usuários</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Configure como novos usuários podem se cadastrar no sistema e gerencie usuários existentes</p>
            </div>
          </div>
          
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Usuários</CardTitle>
                  <CardDescription>Configure como os usuários interagem com o sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Permitir Cadastro</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Permite que novos usuários se cadastrem</p>
                    </div>
                    <Switch
                      checked={configUsuariosLocal.permitirCadastro}
                      onCheckedChange={(checked) => handleConfigUsuariosChange('permitirCadastro', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Requer Aprovação</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Novos cadastros precisam de aprovação</p>
                    </div>
                    <Switch
                      checked={configUsuariosLocal.requerAprovacao}
                      onCheckedChange={(checked) => handleConfigUsuariosChange('requerAprovacao', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Limite de Usuários</Label>
                    <Input
                      type="number"
                      value={configUsuariosLocal.limiteUsuarios}
                      onChange={(e) => handleConfigUsuariosChange('limiteUsuarios', parseInt(e.target.value))}
                      min="1"
                      max="100"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPermissoesModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Key className="h-4 w-4" />
                      Configurar Permissões de Usuários
                    </Button>
                  </div>
                </CardContent>
              </Card>
          
              <Card>
                <CardHeader>
                  <CardTitle>Usuários do Sistema</CardTitle>
                  <CardDescription>Gerencie usuários existentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={abaUsuario} onValueChange={setAbaUsuario}>
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                      <TabsTrigger value="usuarios">Usuários</TabsTrigger>
                      <TabsTrigger value="aprovações" className="relative">
                        Aprovações
                        {usuarios?.filter(u => u.status === 'pendente').length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {usuarios.filter(u => u.status === 'pendente').length}
                          </span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="cadastro">Novo Usuário</TabsTrigger>
                    </TabsList>
                    <TabsContent value="usuarios" className="mt-4">
                      <UsuariosListagem usuarioLogado={usuarioLogado} />
                    </TabsContent>
                    
                    <TabsContent value="aprovações" className="mt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              Usuários Pendentes de Aprovação
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Aprove ou rejeite novos cadastros
                            </p>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {usuarios?.filter(u => u.status === 'pendente').length || 0} pendentes
                          </Badge>
                        </div>
                        
                        {usuarios?.filter(u => u.status === 'pendente').length === 0 ? (
                          <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                              Nenhum usuário pendente
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                              Todos os usuários estão aprovados
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {usuarios?.filter(u => u.status === 'pendente').map((usuario) => (
                              <Card key={usuario.id} className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                      {usuario.nome?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-slate-900 dark:text-white">
                                        {usuario.nome}
                                      </h4>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {usuario.email}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        Cadastrado em: {new Date(usuario.dataCadastro).toLocaleDateString('pt-BR')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleAprovarUsuario(usuario.id, false)}
                                    >
                                      <UserX className="h-4 w-4 mr-2" />
                                      Rejeitar
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleAprovarUsuario(usuario.id, true)}
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Aprovar
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="cadastro" className="mt-4">
                  <CadastroUsuarioForm />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Botão de Salvar - Usuários */}
            <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={handleSaveUsuarios}
                disabled={isSavingUsuarios}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 h-12 px-8"
              >
                {isSavingUsuarios ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Salvar Configurações de Usuários
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Segurança */}
          <TabsContent value="seguranca" className="p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações de Segurança</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Configure autenticação de dois fatores, tempo de sessão, tentativas de login e monitoramento de atividades</p>
            </div>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-full">
              <Card>
                <CardHeader>
                  <CardTitle>Autenticação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>2FA (Dois Fatores)</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Autenticação de dois fatores</p>
                    </div>
                    <Switch
                      checked={configSegurancaLocal.autenticacaoDoisFatores}
                      onCheckedChange={(checked) => handleConfigSegurancaChange('autenticacaoDoisFatores', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tempo de Sessão (minutos)</Label>
                    <Input
                      type="number"
                      value={configSegurancaLocal.tempoSessao}
                      onChange={(e) => handleConfigSegurancaChange('tempoSessao', parseInt(e.target.value))}
                      min="5"
                      max="480"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tentativas de Login</Label>
                    <Input
                      type="number"
                      value={configSegurancaLocal.tentativasLogin}
                      onChange={(e) => handleConfigSegurancaChange('tentativasLogin', parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>
                </CardContent>
              </Card>

          <Card>
            <CardHeader>
                  <CardTitle>Monitoramento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bloqueio Automático</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Bloqueia após tentativas falhadas</p>
            </div>
                    <Switch
                      checked={configSegurancaLocal.bloqueioAutomatico}
                      onCheckedChange={(checked) => handleConfigSegurancaChange('bloqueioAutomatico', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auditoria Ativada</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Registra ações dos usuários</p>
                    </div>
                    <Switch
                      checked={configSegurancaLocal.auditoriaAtivada}
                      onCheckedChange={(checked) => handleConfigSegurancaChange('auditoriaAtivada', checked)}
                    />
                  </div>
            </CardContent>
          </Card>
            </div>

            {/* Botão de Salvar - Segurança */}
            <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={handleSaveSeguranca}
                disabled={isSavingSeguranca}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 h-12 px-8"
              >
                {isSavingSeguranca ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Salvar Configurações de Segurança
                  </>
                )}
              </Button>
            </div>
        </TabsContent>

          {/* Impressão */}
          <TabsContent value="impressao" className="p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <Printer className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações de Impressão</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Configure o formato, orientação, margens e fonte dos documentos que serão impressos (ordens de serviço, orçamentos, etc.)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-full">
          <Card>
            <CardHeader>
                  <CardTitle>Formato do Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Formato Padrão</Label>
                    <Select value={configImpressaoLocal.formatoPadrao} onValueChange={(value) => handleConfigImpressaoChange('formatoPadrao', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Orientação</Label>
                    <Select value={configImpressaoLocal.orientacaoPadrao} onValueChange={(value) => handleConfigImpressaoChange('orientacaoPadrao', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retrato">Retrato</SelectItem>
                        <SelectItem value="paisagem">Paisagem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Margem (cm)</Label>
                    <Input
                      type="number"
                      value={configImpressaoLocal.margemPadrao}
                      onChange={(e) => handleConfigImpressaoChange('margemPadrao', parseFloat(e.target.value))}
                      min="0.5"
                      max="5"
                      step="0.1"
                    />
                  </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                  <CardTitle>Fonte e Estilo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fonte Padrão</Label>
                    <Select value={configImpressaoLocal.fontePadrao} onValueChange={(value) => handleConfigImpressaoChange('fontePadrao', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Calibri">Calibri</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tamanho da Fonte</Label>
                    <Input
                      type="number"
                      value={configImpressaoLocal.tamanhoFonte}
                      onChange={(e) => handleConfigImpressaoChange('tamanhoFonte', parseInt(e.target.value))}
                      min="8"
                      max="24"
                    />
                  </div>
            </CardContent>
          </Card>
            </div>

            {/* Botão de Salvar - Impressão */}
            <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={handleSaveImpressao}
                disabled={isSavingImpressao}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-12 px-8"
              >
                {isSavingImpressao ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Salvar Configurações de Impressão
                  </>
                )}
              </Button>
            </div>
        </TabsContent>

          {/* Sistema */}
          <TabsContent value="sistema" className="p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <Database className="h-6 w-6 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações do Sistema</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Configure backup automático, frequência de backup, retenção de dados e monitoramento do sistema</p>
              </div>
      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-full">
          <Card>
            <CardHeader>
                  <CardTitle>Backup e Recuperação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Backup Automático</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Backup automático dos dados</p>
              </div>
                    <Switch
                      checked={configSistemaLocal.backupAutomatico}
                      onCheckedChange={(checked) => handleConfigSistemaChange('backupAutomatico', checked)}
                    />
            </div>
            
                  <div className="space-y-2">
                    <Label>Frequência do Backup</Label>
                    <Select value={configSistemaLocal.frequenciaBackup} onValueChange={(value) => handleConfigSistemaChange('frequenciaBackup', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hora">A cada hora</SelectItem>
                        <SelectItem value="diario">Diário</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Retenção (dias)</Label>
                    <Input
                      type="number"
                      value={configSistemaLocal.retencaoBackup}
                      onChange={(e) => handleConfigSistemaChange('retencaoBackup', parseInt(e.target.value))}
                      min="1"
                      max="365"
                    />
              </div>
            </CardContent>
          </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monitoramento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Logs Ativados</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Registra atividades do sistema</p>
              </div>
                    <Switch
                      checked={configSistemaLocal.logsAtivados}
                      onCheckedChange={(checked) => handleConfigSistemaChange('logsAtivados', checked)}
                    />
            </div>
            
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Monitoramento Ativo</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Monitora performance do sistema</p>
                    </div>
                    <Switch
                      checked={configSistemaLocal.monitoramentoAtivo}
                      onCheckedChange={(checked) => handleConfigSistemaChange('monitoramentoAtivo', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Botão de Salvar - Sistema */}
            <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={handleSaveSistema}
                disabled={isSavingSistema}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 h-12 px-8"
              >
                {isSavingSistema ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Salvar Configurações do Sistema
                  </>
                )}
              </Button>
            </div>
        </TabsContent>


        </Tabs>

        {/* Aviso sobre salvamento individual */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mx-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <p className="font-medium mb-1">💡 Dica:</p>
              <p>Cada aba possui seu próprio botão de salvar. As configurações são aplicadas imediatamente após o salvamento, sem necessidade de recarregar a página.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal de Permissões de Usuários - Versão Limpa */}
      <Dialog open={isPermissoesModalOpen} onOpenChange={setIsPermissoesModalOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[85vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full max-h-[85vh]">
            {/* HEADER */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                  <Key className="h-6 w-6 text-blue-600" />
                  Configurar Permissões de Usuários
                </DialogTitle>
                <DialogDescription>
                  Selecione um módulo e configure as permissões que os usuários comuns terão acesso.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                {/* SIDEBAR - MÓDULOS */}
                <div className="bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
                  <div className="p-4 space-y-2">
                    {Object.entries(permissoesUsuarios).map(([modulo, permissoes]) => {
                      const moduloLabels = {
                        clientes: { title: 'Clientes', icon: Users, color: 'blue' },
                        os: { title: 'Ordens de Serviço', icon: FileText, color: 'green' },
                        ov: { title: 'Ordens de Venda', icon: ShoppingCart, color: 'orange' },
                        estoque: { title: 'Estoque', icon: Package, color: 'purple' },
                        caixa: { title: 'Caixa', icon: CreditCard, color: 'emerald' },
                        financeiro: { title: 'Financeiro', icon: DollarSign, color: 'yellow' },
                        relatorios: { title: 'Relatórios', icon: BarChart3, color: 'indigo' },
                        configuracoes: { title: 'Configurações', icon: Settings, color: 'red' }
                      };

                      const { title, icon: Icon, color } = moduloLabels[modulo];
                      const isSelected = moduloSelecionado === modulo;
                      const activeCount = Object.values(permissoes).filter(Boolean).length;

                      return (
                        <button
                          key={modulo}
                          onClick={() => setModuloSelecionado(modulo)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : `text-${color}-600`}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{title}</p>
                            <p className="text-xs opacity-75">{activeCount}/4 permissões</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ÁREA DE PERMISSÕES */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 overflow-y-auto">
                  <div className="p-6">
                    {/* TÍTULO DO MÓDULO */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {moduloSelecionado === 'clientes' ? '👥 Clientes' :
                         moduloSelecionado === 'os' ? '📋 Ordens de Serviço' :
                         moduloSelecionado === 'ov' ? '🛒 Ordens de Venda' :
                         moduloSelecionado === 'estoque' ? '📦 Estoque' :
                         moduloSelecionado === 'caixa' ? '💳 Caixa' :
                         moduloSelecionado === 'financeiro' ? '💰 Financeiro' :
                         moduloSelecionado === 'relatorios' ? '📊 Relatórios' :
                         '⚙️ Configurações'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Configure as permissões que os usuários comuns terão para este módulo
                      </p>
                    </div>

                    {/* PERMISSÕES */}
                    <div className="space-y-4">
                      {Object.entries(permissoesUsuarios[moduloSelecionado])
                        .sort(([a], [b]) => {
                          const order = { visualizar: 0, criar: 1, editar: 2, excluir: 3 };
                          return order[a] - order[b];
                        })
                        .map(([acao, valor]) => {
                        const acaoLabels = {
                          visualizar: { title: 'Visualizar', desc: 'Ver dados e informações do módulo', icon: Eye },
                          criar: { title: 'Criar', desc: 'Criar novos registros e entradas', icon: Plus },
                          editar: { title: 'Editar', desc: 'Modificar registros existentes', icon: Edit },
                          excluir: { title: 'Excluir', desc: 'Remover registros permanentemente', icon: Trash2 }
                        };

                        // Definir cores baseadas no módulo selecionado
                        const moduloColors = {
                          clientes: {
                            bg: 'bg-blue-50 dark:bg-blue-900/20',
                            border: 'border-blue-200 dark:border-blue-800',
                            iconActive: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                            iconInactive: 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          },
                          os: {
                            bg: 'bg-green-50 dark:bg-green-900/20',
                            border: 'border-green-200 dark:border-green-800',
                            iconActive: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                            iconInactive: 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          },
                          ov: {
                            bg: 'bg-orange-50 dark:bg-orange-900/20',
                            border: 'border-orange-200 dark:border-orange-800',
                            iconActive: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
                            iconInactive: 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          },
                          estoque: {
                            bg: 'bg-purple-50 dark:bg-purple-900/20',
                            border: 'border-purple-200 dark:border-purple-800',
                            iconActive: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                            iconInactive: 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          },
                          caixa: {
                            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                            border: 'border-emerald-200 dark:border-emerald-800',
                            iconActive: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                            iconInactive: 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          },
                          financeiro: {
                            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                            border: 'border-yellow-200 dark:border-yellow-800',
                            iconActive: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
                            iconInactive: 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          },
                          relatorios: {
                            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
                            border: 'border-indigo-200 dark:border-indigo-800',
                            iconActive: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
                            iconInactive: 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          },
                          configuracoes: {
                            bg: 'bg-red-50 dark:bg-red-900/20',
                            border: 'border-red-200 dark:border-red-800',
                            iconActive: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                            iconInactive: 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          }
                        };

                        const { title: acaoTitle, desc: acaoDesc, icon: AcaoIcon } = acaoLabels[acao];
                        const colors = moduloColors[moduloSelecionado];

                        return (
                          <div key={acao} className={`flex items-center justify-between p-4 ${colors.bg} rounded-lg border ${colors.border}`}>
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-lg ${valor ? colors.iconActive : colors.iconInactive}`}>
                                <AcaoIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <Label className="font-semibold text-slate-900 dark:text-white">{acaoTitle}</Label>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{acaoDesc}</p>
                              </div>
                            </div>
                            <Switch
                              checked={valor}
                              onCheckedChange={(checked) => handlePermissaoChange(moduloSelecionado, acao, checked)}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* AVISO */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <p className="font-medium mb-1">💡 Importante:</p>
                          <p>Estas configurações se aplicam apenas aos usuários comuns. Usuários administradores sempre terão acesso completo a todos os módulos e funcionalidades.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsPermissoesModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setIsSavingUsuarios(true);
                      
                      // Salvar as permissões junto com as outras configurações de usuários
                      await saveConfigUsuarios(configUsuariosLocal);
                      
                      setIsPermissoesModalOpen(false);
                      toast({
                        title: "Sucesso!",
                        description: "Permissões configuradas e salvas com sucesso!",
                      });
                    } catch (error) {
                      console.error('Erro ao salvar permissões:', error);
                      toast({
                        title: "Erro",
                        description: "Erro ao salvar permissões. Tente novamente.",
                        variant: "destructive"
                      });
                    } finally {
                      setIsSavingUsuarios(false);
                    }
                  }}
                  disabled={isSavingUsuarios}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingUsuarios ? 'Salvando...' : 'Salvar Permissões'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfiguracoesModule;