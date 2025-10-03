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
    Sun
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
import { useToast } from '@/components/ui/use-toast';
import { t } from '@/lib/translations';
import CadastroUsuarioForm from './CadastroUsuarioForm';
import UsuariosListagem from './usuarios/UsuariosListagem';
import { AppContext } from '@/App';
import { useConfiguracao, useConfiguracoesLoja, useUsuarios } from '@/lib/hooks/useFirebase';

const ConfiguracoesModule = ({ usuarioLogado }) => {
  const { currentLanguage: appLanguage } = useContext(AppContext);
  const { toast } = useToast();
  
  // Hooks do Firebase
  const { config: configuracoesFirebase, loading: configLoading, saveConfig } = useConfiguracao();
  const { config: configLoja, saveConfig: saveConfigLoja } = useConfiguracoesLoja();
  const { data: usuarios, loading: usuariosLoading, save: saveUsuario } = useUsuarios();
  
  // Estado para controlar aba interna de usuário
  const [abaUsuario, setAbaUsuario] = useState('usuarios');
  
  // Estado para controlar aba atual das configurações
  const [abaAtual, setAbaAtual] = useState('loja');
  
  // Estado local das configurações do sistema
  const [configuracoes, setConfiguracoes] = useState({
    // Personalização
    tema: 'dark',
    corPrimaria: '#3b82f6',
    corSecundaria: '#8b5cf6',
    nomeEmpresa: 'Sistema',
    logoUrl: '',
    logo: '',
    idioma: 'pt-BR',

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

    // Usuários
    permitirCadastro: true,
    requerAprovacao: false,
    limiteUsuarios: 10,
    notificacaoNovosUsuarios: true,

    // Segurança
    autenticacaoDoisFatores: false,
    tempoSessao: 30,
    tentativasLogin: 3,
    bloqueioAutomatico: true,
    auditoriaAtivada: true,

    // Impressão
    formatoPadrao: 'A4',
    orientacaoPadrao: 'retrato',
    margemPadrao: 1,
    fontePadrao: 'Arial',
    tamanhoFonte: 12,

    // Sistema
    backupAutomatico: true,
    frequenciaBackup: 'diario',
    retencaoBackup: 30,
    logsAtivados: true,
    monitoramentoAtivo: true
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

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLoja, setIsSavingLoja] = useState(false);
  const [isSavingPersonalizacao, setIsSavingPersonalizacao] = useState(false);
  const [isSavingUsuarios, setIsSavingUsuarios] = useState(false);
  const [isSavingSeguranca, setIsSavingSeguranca] = useState(false);
  const [isSavingImpressao, setIsSavingImpressao] = useState(false);
  const [isSavingSistema, setIsSavingSistema] = useState(false);
  const [previewLogo, setPreviewLogo] = useState('');


  // Carregar configurações quando disponíveis
  useEffect(() => {
    if (configuracoesFirebase) {
      setConfiguracoes(prev => ({ ...prev, ...configuracoesFirebase }));
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
    if (configuracoesFirebase) {
      setPreviewLogo(configuracoesFirebase.logo || '');
    }
  }, [configuracoesFirebase]);


  const handleConfigChange = (key, value) => {
    setConfiguracoes(prev => ({ ...prev, [key]: value }));
  };

  const handleConfigLojaChange = (key, value) => {
    setConfigLojaLocal(prev => ({ ...prev, [key]: value }));
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
      await saveConfig(configuracoes);
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
      await saveConfig(configuracoes);
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
      await saveConfig(configuracoes);
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
      await saveConfig(configuracoes);
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
      await saveConfig(configuracoes);
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
    setConfiguracoes({
      tema: 'dark',
      corPrimaria: '#3b82f6',
      corSecundaria: '#8b5cf6',
      nomeEmpresa: 'Sistema',
      logoUrl: '',
      logo: '',
      idioma: 'pt-BR',
      permitirCadastro: true,
      requerAprovacao: false,
      limiteUsuarios: 10,
      notificacaoNovosUsuarios: true,
      autenticacaoDoisFatores: false,
      tempoSessao: 30,
      tentativasLogin: 3,
      bloqueioAutomatico: true,
      auditoriaAtivada: true,
      formatoPadrao: 'A4',
      orientacaoPadrao: 'retrato',
      margemPadrao: 1,
      fontePadrao: 'Arial',
      tamanhoFonte: 12,
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
                <p className="text-slate-600 dark:text-slate-400 mt-1">Configure os dados da sua empresa que aparecerão <strong>APENAS nos documentos impressos</strong> (ordens de serviço, orçamentos, etc.). Estes dados NÃO afetam o nome que aparece no cabeçalho da interface do sistema.</p>
              </div>
            </div>

            <div className="space-y-8">
              
              {/* Aviso Importante */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">⚠️ Importante:</p>
                    <p>As configurações desta aba são usadas <strong>APENAS para documentos impressos</strong> (ordens de serviço, orçamentos, etc.). Para alterar o nome que aparece no cabeçalho da interface do sistema, use a aba <strong>"Personalização"</strong>.</p>
                  </div>
                </div>
              </div>
              
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">Nome que aparecerá <strong>APENAS</strong> nos documentos impressos (ordens de serviço, orçamentos). Para alterar o nome no cabeçalho da interface, use a aba "Personalização".</p>
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">Descrição que aparecerá abaixo do nome da empresa <strong>APENAS</strong> nos documentos impressos</p>
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">Telefone que aparecerá <strong>APENAS</strong> nos documentos impressos</p>
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">Endereço completo que aparecerá <strong>APENAS</strong> nos documentos impressos</p>
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">IMEI padrão que aparecerá <strong>APENAS</strong> nas ordens de serviço impressas</p>
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
                    <Select value={configuracoes.tema} onValueChange={(value) => handleConfigChange('tema', value)}>
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
                    <Select value={configuracoes.idioma} onValueChange={(value) => handleConfigChange('idioma', value)}>
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
                    checked={configuracoes.acoesRapidas.novaOS}
                    onCheckedChange={(checked) => handleConfigChange('acoesRapidas', { ...configuracoes.acoesRapidas, novaOS: checked })}
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
                    checked={configuracoes.acoesRapidas.novoLancamento}
                    onCheckedChange={(checked) => handleConfigChange('acoesRapidas', { ...configuracoes.acoesRapidas, novoLancamento: checked })}
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
                    checked={configuracoes.acoesRapidas.novoCliente}
                    onCheckedChange={(checked) => handleConfigChange('acoesRapidas', { ...configuracoes.acoesRapidas, novoCliente: checked })}
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
                    checked={configuracoes.acoesRapidas.novoUsuario}
                    onCheckedChange={(checked) => handleConfigChange('acoesRapidas', { ...configuracoes.acoesRapidas, novoUsuario: checked })}
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
                    checked={configuracoes.acoesRapidas.novaOV}
                    onCheckedChange={(checked) => handleConfigChange('acoesRapidas', { ...configuracoes.acoesRapidas, novaOV: checked })}
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
                    checked={configuracoes.acoesRapidas.abrirCaixa}
                    onCheckedChange={(checked) => handleConfigChange('acoesRapidas', { ...configuracoes.acoesRapidas, abrirCaixa: checked })}
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
                    checked={configuracoes.acoesRapidas.adicionarProduto}
                    onCheckedChange={(checked) => handleConfigChange('acoesRapidas', { ...configuracoes.acoesRapidas, adicionarProduto: checked })}
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
                    checked={configuracoes.acoesRapidas.movimentacao}
                    onCheckedChange={(checked) => handleConfigChange('acoesRapidas', { ...configuracoes.acoesRapidas, movimentacao: checked })}
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
                    checked={configuracoes.acoesRapidas.relatorios}
                    onCheckedChange={(checked) => handleConfigChange('acoesRapidas', { ...configuracoes.acoesRapidas, relatorios: checked })}
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
                      checked={configuracoes.permitirCadastro}
                      onCheckedChange={(checked) => handleConfigChange('permitirCadastro', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Requer Aprovação</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Novos cadastros precisam de aprovação</p>
                    </div>
                    <Switch
                      checked={configuracoes.requerAprovacao}
                      onCheckedChange={(checked) => handleConfigChange('requerAprovacao', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Limite de Usuários</Label>
                    <Input
                      type="number"
                      value={configuracoes.limiteUsuarios}
                      onChange={(e) => handleConfigChange('limiteUsuarios', parseInt(e.target.value))}
                      min="1"
                      max="100"
                    />
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
                      checked={configuracoes.autenticacaoDoisFatores}
                      onCheckedChange={(checked) => handleConfigChange('autenticacaoDoisFatores', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tempo de Sessão (minutos)</Label>
                    <Input
                      type="number"
                      value={configuracoes.tempoSessao}
                      onChange={(e) => handleConfigChange('tempoSessao', parseInt(e.target.value))}
                      min="5"
                      max="480"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tentativas de Login</Label>
                    <Input
                      type="number"
                      value={configuracoes.tentativasLogin}
                      onChange={(e) => handleConfigChange('tentativasLogin', parseInt(e.target.value))}
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
                      checked={configuracoes.bloqueioAutomatico}
                      onCheckedChange={(checked) => handleConfigChange('bloqueioAutomatico', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auditoria Ativada</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Registra ações dos usuários</p>
                    </div>
                    <Switch
                      checked={configuracoes.auditoriaAtivada}
                      onCheckedChange={(checked) => handleConfigChange('auditoriaAtivada', checked)}
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
                    <Select value={configuracoes.formatoPadrao} onValueChange={(value) => handleConfigChange('formatoPadrao', value)}>
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
                    <Select value={configuracoes.orientacaoPadrao} onValueChange={(value) => handleConfigChange('orientacaoPadrao', value)}>
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
                      value={configuracoes.margemPadrao}
                      onChange={(e) => handleConfigChange('margemPadrao', parseFloat(e.target.value))}
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
                    <Select value={configuracoes.fontePadrao} onValueChange={(value) => handleConfigChange('fontePadrao', value)}>
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
                      value={configuracoes.tamanhoFonte}
                      onChange={(e) => handleConfigChange('tamanhoFonte', parseInt(e.target.value))}
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
                      checked={configuracoes.backupAutomatico}
                      onCheckedChange={(checked) => handleConfigChange('backupAutomatico', checked)}
                    />
            </div>
            
                  <div className="space-y-2">
                    <Label>Frequência do Backup</Label>
                    <Select value={configuracoes.frequenciaBackup} onValueChange={(value) => handleConfigChange('frequenciaBackup', value)}>
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
                      value={configuracoes.retencaoBackup}
                      onChange={(e) => handleConfigChange('retencaoBackup', parseInt(e.target.value))}
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
                      checked={configuracoes.logsAtivados}
                      onCheckedChange={(checked) => handleConfigChange('logsAtivados', checked)}
                    />
            </div>
            
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Monitoramento Ativo</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Monitora performance do sistema</p>
                    </div>
                    <Switch
                      checked={configuracoes.monitoramentoAtivo}
                      onCheckedChange={(checked) => handleConfigChange('monitoramentoAtivo', checked)}
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
    </div>
  );
};

export default ConfiguracoesModule;