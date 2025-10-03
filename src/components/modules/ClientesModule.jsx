import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Users, Star, Calendar, CalendarIcon, ShoppingCart, TrendingUp, Filter, SortAsc, SortDesc, Eye, Copy, Download, BarChart3, UserPlus, Heart, Award, Clock, MessageCircle, Tag, Building, CreditCard, FileText, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useDropzone } from 'react-dropzone';
import { AppContext } from '@/App';
import { useClientes, useOV, useOS } from '@/lib/hooks/useFirebase';
import ConfirmDialog from '@/components/ui/confirm-dialog';

const ClientesModule = ({ userId }) => {
  const { dialogs, openDialog, closeDialog } = useContext(AppContext);
  const { data: clientes, loading, save, remove } = useClientes(userId);
  const { data: ordens } = useOV(userId);
  const { data: ordensServico } = useOS(userId);
  
  // Estados principais
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCliente, setEditingCliente] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('nome');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Estados para confirmação de exclusão
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [filterBy, setFilterBy] = useState('todos');
  const [tipoClienteFilter, setTipoClienteFilter] = useState('todos');
  const [showStats, setShowStats] = useState(true);
  const [clienteDetailsOpen, setClienteDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basico');
  
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    observacoes: '',
    categoria: 'cliente',
    dataNascimento: '',
    cpf: '',
    empresa: '',
    website: '',
    foto: null,
    redesSociais: {
      instagram: '',
      facebook: '',
      linkedin: ''
    },
    preferencias: {
      formaContato: 'telefone',
      horarioContato: 'comercial',
      newsletter: false
    }
  });
  const { toast } = useToast();

  const handleOpenDialog = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      // Garantir que todos os campos existam, mesmo se o cliente não tiver todos os dados
      setFormData({
        nome: cliente.nome || '',
        telefone: cliente.telefone || '',
        email: cliente.email || '',
        endereco: cliente.endereco || '',
        observacoes: cliente.observacoes || '',
        categoria: cliente.categoria || 'cliente',
        dataNascimento: cliente.dataNascimento || '',
        cpf: cliente.cpf || '',
        empresa: cliente.empresa || '',
        website: cliente.website || '',
        foto: cliente.foto || null,
        redesSociais: {
          instagram: cliente.redesSociais?.instagram || '',
          facebook: cliente.redesSociais?.facebook || '',
          linkedin: cliente.redesSociais?.linkedin || ''
        },
        preferencias: {
          formaContato: cliente.preferencias?.formaContato || 'telefone',
          horarioContato: cliente.preferencias?.horarioContato || 'comercial',
          newsletter: cliente.preferencias?.newsletter || false
        }
      });
      console.log('[Clientes] Editando cliente:', cliente);
    } else {
      setEditingCliente(null);
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        endereco: '',
        observacoes: '',
        categoria: 'cliente',
        dataNascimento: '',
        cpf: '',
        empresa: '',
        website: '',
        foto: null,
        redesSociais: {
          instagram: '',
          facebook: '',
          linkedin: ''
        },
        preferencias: {
          formaContato: 'telefone',
          horarioContato: 'comercial',
          newsletter: false
        }
      });
      console.log('[Clientes] Novo cliente, formulário limpo');
    }
    openDialog('clientes');
    console.log('[Clientes] Dialog de cliente aberto');
  };

  const handleCloseDialog = () => {
  closeDialog('clientes');
  console.log('[Clientes] Dialog de cliente fechado');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Clientes] Submissão do formulário de cliente:', formData, editingCliente);
    
    // Verificar se nome está preenchido
    if (!formData.nome) {
      toast({
        title: "Campo obrigatório",
        description: "Nome é obrigatório!",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar se telefone está preenchido - se não, navegar para aba contato
    if (!formData.telefone) {
      toast({
        title: "Campo obrigatório",
        description: "Telefone é obrigatório! Navegando para aba de contato...",
        variant: "destructive"
      });
      setActiveTab('contato');
      return;
    }

    try {
      const clienteData = {
        ...formData,
        createdAt: editingCliente ? editingCliente.createdAt : new Date().toISOString()
      };

      await save(clienteData, editingCliente?.id);
      
      if (editingCliente) {
        console.log('[Clientes] Cliente atualizado:', clienteData);
        toast({
          title: "Sucesso!",
          description: "Cliente atualizado com sucesso!"
        });
      } else {
        console.log('[Clientes] Cliente cadastrado:', clienteData);
        toast({
          title: "Sucesso!",
          description: "Cliente cadastrado com sucesso!"
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('[Clientes] Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (cliente) => {
    setClienteToDelete(cliente);
    setConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!clienteToDelete) return;
    
    try {
      await remove(clienteToDelete.id);
      console.log('[Clientes] Cliente removido:', clienteToDelete.id);
      toast({
        title: "Sucesso!",
        description: "Cliente removido com sucesso!"
      });
      setConfirmDeleteOpen(false);
      setClienteToDelete(null);
    } catch (error) {
      console.error('[Clientes] Erro ao remover cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover cliente. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Funções de análise e estatísticas
  const getClienteStats = (cliente) => {
    // Debug: verificar dados
    console.log('[ClientesModule] Calculando stats para cliente:', cliente.nome, 'ID:', cliente.id);
    
    // Ordens de venda do cliente
    const ordensVendaCliente = ordens.filter(ov => ov.clienteId === cliente.id);
    console.log('[ClientesModule] Ordens de venda encontradas:', ordensVendaCliente.length);
    
    // Ordens de serviço do cliente
    const ordensServicoCliente = ordensServico.filter(os => os.clienteId === cliente.id);
    console.log('[ClientesModule] Ordens de serviço encontradas:', ordensServicoCliente.length);
    
    // Debug: mostrar todas as ordens de serviço
    if (ordensServico.length > 0) {
      console.log('[ClientesModule] Todas as ordens de serviço:', ordensServico.map(os => ({
        id: os.id,
        clienteId: os.clienteId,
        total: os.total,
        valor: os.valor,
        numero: os.numero
      })));
    }
    
    // Combinar todas as ordens (vendas + serviços)
    const todasOrdens = [...ordensVendaCliente, ...ordensServicoCliente];
    
    const totalCompras = todasOrdens.length;
    const totalGasto = todasOrdens.reduce((sum, ordem) => sum + (ordem.total || 0), 0);
    const ultimaCompra = todasOrdens.length > 0 ? 
      new Date(Math.max(...todasOrdens.map(ordem => new Date(ordem.createdAt)))) : null;
    
    return {
      totalCompras,
      totalGasto,
      ultimaCompra,
      ticketMedio: totalCompras > 0 ? totalGasto / totalCompras : 0,
      status: totalCompras === 0 ? 'novo' : 
              cliente.categoria === 'vip' ? 'vip' :
              totalGasto > 1000 ? 'vip' : 
              ultimaCompra && (Date.now() - ultimaCompra.getTime()) < 30 * 24 * 60 * 60 * 1000 ? 'ativo' : 'inativo'
    };
  };

  const getClientesStats = () => {
    const total = clientes.length;
    const comCompras = clientes.filter(c => 
      ordens.some(ov => ov.clienteId === c.id) || 
      ordensServico.some(os => os.clienteId === c.id)
    ).length;
    const novos = clientes.filter(c => {
      const createdAt = new Date(c.createdAt);
      return (Date.now() - createdAt.getTime()) < 30 * 24 * 60 * 60 * 1000;
    }).length;
    const vip = clientes.filter(c => getClienteStats(c).status === 'vip').length;
    
    return { total, comCompras, novos, vip };
  };

  // Funções de filtro e ordenação
  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.telefone.includes(searchTerm) ||
                         (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const stats = getClienteStats(cliente);
    const matchesFilter = filterBy === 'todos' || 
                         (filterBy === 'novos' && stats.status === 'novo') ||
                         (filterBy === 'ativos' && stats.status === 'ativo') ||
                         (filterBy === 'inativos' && stats.status === 'inativo');
    
    const matchesTipoCliente = tipoClienteFilter === 'todos' ||
                              cliente.categoria === tipoClienteFilter;
    
    return matchesSearch && matchesFilter && matchesTipoCliente;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'nome':
        comparison = a.nome.localeCompare(b.nome);
        break;
      case 'data':
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
        break;
      case 'compras':
        comparison = getClienteStats(a).totalCompras - getClienteStats(b).totalCompras;
        break;
      case 'gasto':
        comparison = getClienteStats(a).totalGasto - getClienteStats(b).totalGasto;
        break;
      default:
        comparison = a.nome.localeCompare(b.nome);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Funções utilitárias
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Informação copiada para a área de transferência"
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  // ---------- UPLOAD DE FOTO ----------
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de arquivo inválido!",
        description: "Por favor, selecione apenas imagens.",
        variant: "destructive"
      });
      return;
    }

    // Verificar tamanho do arquivo (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande!",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // Redimensionar para máximo 1000x1000
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let { width, height } = img;
        const maxSize = 1000;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para base64 com qualidade alta
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.9);
        
        setFormData(prev => ({ ...prev, foto: compressedBase64 }));
        
        toast({
          title: "Foto adicionada!",
          description: "Foto do cliente carregada com sucesso."
        });
      };
      
      img.src = reader.result;
    };
    
    reader.onerror = () => {
      toast({
        title: "Erro ao carregar imagem!",
        description: "Tente novamente com outro arquivo.",
        variant: "destructive"
      });
    };
    
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false
  });

  const removeFoto = () => {
    setFormData(prev => ({ ...prev, foto: null }));
    toast({
      title: "Foto removida!",
      description: "Foto do cliente removida com sucesso."
    });
  };

  const stats = getClientesStats();

  return (
    <div className="space-y-6">
      {/* HEADER COM ESTATÍSTICAS */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
            <h1 className="text-4xl font-bold mb-2">👥 Clientes</h1>
            <p className="text-blue-100 text-lg">Gerencie sua base de clientes com inteligência</p>
        </div>
        
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
        <Dialog open={dialogs.clientes} onOpenChange={handleCloseDialog}>
              <Button 
                onClick={() => handleOpenDialog()} 
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
                size="lg"
              >
                <UserPlus className="h-5 w-5 mr-2" />
            Novo Cliente
          </Button>
              <DialogContent className="sm:max-w-2xl w-full max-w-[95vw] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 scrollbar-hide">
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
                  <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <UserPlus className="h-6 w-6" />
                    </motion.div>
                    {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 mt-2">
                    Preencha as informações do cliente. Campos obrigatórios marcados com *.
              </DialogDescription>
            </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 max-w-full">
                      <TabsTrigger value="basico">Básico</TabsTrigger>
                      <TabsTrigger value="contato">Contato</TabsTrigger>
                      <TabsTrigger value="preferencias">Preferências</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basico" className="space-y-4">
                      {/* Campo de Foto */}
                      <div className="flex flex-col items-center space-y-4">
                        <Label className="text-sm font-medium">Foto do Cliente</Label>
                        
                        {formData.foto ? (
                          <div className="relative">
                            <img
                              src={formData.foto}
                              alt="Foto do cliente"
                              className="w-32 h-32 rounded-full object-cover border-4 border-slate-200 dark:border-slate-700 shadow-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={removeFoto}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            {...getRootProps()}
                            className={`w-32 h-32 border-2 border-dashed rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                              isDragActive
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <input {...getInputProps()} />
                            <Camera className="h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-xs text-slate-500 text-center px-2">
                              {isDragActive ? '🎯 Solte a foto aqui' : '📷 Arraste uma foto ou clique para selecionar'}
                            </p>
                          </div>
                        )}
                        
                        <p className="text-xs text-slate-500 text-center">
                          PNG, JPG até 2MB • Redimensionada para 1000x1000px
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
              <div>
                          <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                            placeholder="João Silva"
                  required
                />
              </div>
                        <div>
                          <Label htmlFor="categoria">Categoria</Label>
                          <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cliente">Cliente</SelectItem>
                              <SelectItem value="fornecedor">Fornecedor</SelectItem>
                              <SelectItem value="parceiro">Parceiro</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
                        <div>
                          <Label htmlFor="cpf">CPF</Label>
                          <Input
                            id="cpf"
                            value={formData.cpf}
                            onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <Input
                              id="dataNascimento"
                              type="date"
                              value={formData.dataNascimento}
                              onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                              className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 transition-all duration-300"
                              placeholder="Selecione a data"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="empresa">Empresa</Label>
                        <Input
                          id="empresa"
                          value={formData.empresa}
                          onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                          placeholder="Nome da empresa"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea
                          id="observacoes"
                          value={formData.observacoes}
                          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                          placeholder="Informações adicionais sobre o cliente"
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="contato" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>
                      </div>
                      
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                        <Textarea
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  placeholder="Endereço completo"
                          rows={2}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData({...formData, website: e.target.value})}
                          placeholder="https://exemplo.com"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Redes Sociais</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-full">
                          <div>
                            <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                            <Input
                              id="instagram"
                              value={formData.redesSociais.instagram}
                              onChange={(e) => setFormData({
                                ...formData, 
                                redesSociais: {...formData.redesSociais, instagram: e.target.value}
                              })}
                              placeholder="@usuario"
                            />
                          </div>
                          <div>
                            <Label htmlFor="facebook" className="text-sm">Facebook</Label>
                            <Input
                              id="facebook"
                              value={formData.redesSociais.facebook}
                              onChange={(e) => setFormData({
                                ...formData, 
                                redesSociais: {...formData.redesSociais, facebook: e.target.value}
                              })}
                              placeholder="facebook.com/usuario"
                />
              </div>
              <div>
                            <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                            <Input
                              id="linkedin"
                              value={formData.redesSociais.linkedin}
                              onChange={(e) => setFormData({
                                ...formData, 
                                redesSociais: {...formData.redesSociais, linkedin: e.target.value}
                              })}
                              placeholder="linkedin.com/in/usuario"
                />
              </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="preferencias" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
                        <div>
                          <Label htmlFor="formaContato">Forma de Contato Preferida</Label>
                          <Select value={formData.preferencias.formaContato} onValueChange={(value) => setFormData({
                            ...formData, 
                            preferencias: {...formData.preferencias, formaContato: value}
                          })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="telefone">Telefone</SelectItem>
                              <SelectItem value="email">E-mail</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="horarioContato">Horário de Contato</Label>
                          <Select value={formData.preferencias.horarioContato} onValueChange={(value) => setFormData({
                            ...formData, 
                            preferencias: {...formData.preferencias, horarioContato: value}
                          })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="comercial">Comercial (9h-18h)</SelectItem>
                              <SelectItem value="manha">Manhã (6h-12h)</SelectItem>
                              <SelectItem value="tarde">Tarde (12h-18h)</SelectItem>
                              <SelectItem value="noite">Noite (18h-22h)</SelectItem>
                              <SelectItem value="livre">Qualquer horário</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="newsletter"
                          checked={formData.preferencias.newsletter}
                          onChange={(e) => setFormData({
                            ...formData, 
                            preferencias: {...formData.preferencias, newsletter: e.target.checked}
                          })}
                          className="rounded"
                        />
                        <Label htmlFor="newsletter">Receber newsletter e promoções</Label>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 w-full max-w-full">
                      {editingCliente ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          </motion.div>
      </div>

        {/* CARDS DE ESTATÍSTICAS */}
        {showStats && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 w-full max-w-full"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Total</p>
                  <p className="text-white text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-green-200" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Compraram</p>
                  <p className="text-white text-2xl font-bold">{stats.comCompras}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-200" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">VIP</p>
                  <p className="text-white text-2xl font-bold">{stats.vip}</p>
                </div>
              </div>
      </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <UserPlus className="h-5 w-5 text-purple-200" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Novos</p>
                  <p className="text-white text-2xl font-bold">{stats.novos}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* CONTROLES DE FILTRO E ORDENAÇÃO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
                placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
        />
      </div>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="novos">Novos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={tipoClienteFilter} onValueChange={setTipoClienteFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Tipos</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="fornecedor">Fornecedor</SelectItem>
                <SelectItem value="parceiro">Parceiro</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <BarChart3 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome">Nome</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="compras">Compras</SelectItem>
                <SelectItem value="gasto">Gasto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={sortOrder === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
            
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* LISTA DE CLIENTES */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando clientes...</p>
          </motion.div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full" 
              : "space-y-4"
            }
          >
            {filteredClientes.map((cliente, index) => {
              const stats = getClienteStats(cliente);
              const statusColors = {
                novo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                ativo: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                inativo: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
                vip: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
              };

              if (viewMode === 'grid') {
                return (
          <motion.div
            key={cliente.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {cliente.foto ? (
                          <img
                            src={cliente.foto}
                            alt={cliente.nome}
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {cliente.nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 transition-colors">
                {cliente.nome}
              </h3>
                          <Badge className={statusColors[stats.status]}>
                            {stats.status === 'novo' ? 'Novo' : 
                             stats.status === 'vip' ? 'VIP' : 
                             stats.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedCliente(cliente); setClienteDetailsOpen(true); }}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(cliente)}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(cliente)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{cliente.telefone}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(cliente.telefone)}
                          className="h-6 w-6 ml-auto"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
              </div>
                      
              {cliente.email && (
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <Mail className="h-4 w-4" />
                          <span className="text-sm truncate">{cliente.email}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(cliente.email)}
                            className="h-6 w-6 ml-auto"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                </div>
              )}
                      
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700 w-full max-w-full">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{stats.totalCompras}</p>
                          <p className="text-xs text-slate-500">Compras</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalGasto)}</p>
                          <p className="text-xs text-slate-500">Total Gasto</p>
                        </div>
                      </div>
                </div>
                  </motion.div>
                );
              } else {
                return (
                  <motion.div
                    key={cliente.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {cliente.foto ? (
                          <img
                            src={cliente.foto}
                            alt={cliente.nome}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {cliente.nome.charAt(0).toUpperCase()}
                </div>
              )}
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">{cliente.nome}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Phone className="h-3 w-3" />
                            {cliente.telefone}
                            {cliente.email && (
                              <>
                                <span>•</span>
                                <Mail className="h-3 w-3" />
                                {cliente.email}
                              </>
              )}
            </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{stats.totalCompras} compras</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{formatCurrency(stats.totalGasto)}</p>
                        </div>
                        <Badge className={statusColors[stats.status]}>
                          {stats.status === 'novo' ? 'Novo' : 
                           stats.status === 'vip' ? 'VIP' : 
                           stats.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedCliente(cliente); setClienteDetailsOpen(true); }}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(cliente)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(cliente)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && filteredClientes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchTerm ? 'Tente buscar com outros termos' : 'Comece cadastrando seu primeiro cliente'}
          </p>
          {!searchTerm && (
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Cliente
            </Button>
          )}
        </motion.div>
      )}

      {/* MODAL DE DETALHES DO CLIENTE */}
      <Dialog open={clienteDetailsOpen} onOpenChange={setClienteDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          {selectedCliente && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  {selectedCliente.foto ? (
                    <img
                      src={selectedCliente.foto}
                      alt={selectedCliente.nome}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {selectedCliente.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {selectedCliente.nome}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 w-full max-w-full">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-blue-500" />
                        Compras
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{getClienteStats(selectedCliente).totalCompras}</div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total de compras realizadas</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Total Gasto
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{formatCurrency(getClienteStats(selectedCliente).totalGasto)}</div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Valor total gasto</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      Informações de Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{selectedCliente.telefone}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(selectedCliente.telefone)}
                        className="h-6 w-6 ml-auto"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {selectedCliente.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span>{selectedCliente.email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(selectedCliente.email)}
                          className="h-6 w-6 ml-auto"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {selectedCliente.endereco && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{selectedCliente.endereco}</span>
        </div>
      )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir o cliente "${clienteToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="delete"
      />
    </div>
  );
};

export default ClientesModule;