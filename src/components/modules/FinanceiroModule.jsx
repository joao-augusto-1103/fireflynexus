import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, Calendar, Filter, Download, Eye, BarChart3, CreditCard, Banknote, Wallet, Receipt, Target, AlertCircle, CheckCircle, Clock, X, User, Tag, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/App';
import { useFinanceiro, useOS, useOV, useClientes, usePermissions } from '@/lib/hooks/useFirebase';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import CustomerAvatar from '@/components/ui/customer-avatar';

const FinanceiroModule = ({ userId }) => {
  const { dialogs, openDialog, closeDialog } = useContext(AppContext);
  const { data: financeiro, loading, save, remove } = useFinanceiro(userId);
  const { data: ordens } = useOS(userId);
  const { data: vendas } = useOV(userId);
  const { data: clientes, save: saveCliente } = useClientes(userId);
  const { canCreate, canEdit, canDelete } = usePermissions();
  
  // Estados principais
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('data');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [filtroOrigem, setFiltroOrigem] = useState('todos');
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState('todos');
  const [showStats, setShowStats] = useState(true);
  const [itemDetailsOpen, setItemDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basico');
  const [currentView, setCurrentView] = useState('receber'); // 'receber' ou 'pagar'
  const [parcelasCalendarOpen, setParcelasCalendarOpen] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [parcelamento, setParcelamento] = useState({
    ativo: false,
    parcelas: 1,
    intervalo: 'mensal'
  });
  
  // Estados para confirmação de exclusão
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    dataVencimento: '',
    tipo: 'receber',
    status: 'Pendente',
    observacoes: '',
    categoria: 'vendas',
    formaPagamento: 'dinheiro',
    cliente: '',
    telefone: '',
    clienteId: '', // ID do cliente selecionado
    origemId: '',
    parcelamento: {
      ativo: false,
      parcelas: 1,
      intervalo: 'mensal',
      valorParcela: 0,
      parcelasGeradas: [],
      parcelasPagas: 0
    }
  });
  const { toast } = useToast();

  const handleOpenDialog = (item = null) => {
    // Verificar permissões
    if (item) {
      if (!canEdit('financeiro')) return;
      setEditingItem(item);
    } else {
      if (!canCreate('financeiro')) return;
    }
    
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        valor: item.valor ? item.valor.toString() : '',
        dataVencimento: item.dataVencimento ? item.dataVencimento.split('T')[0] : '',
        telefone: item.telefone || '',
        clienteId: item.clienteId || '',
        parcelamento: item.parcelamento || {
          ativo: false,
          parcelas: 1,
          intervalo: 'mensal',
          valorParcela: 0,
          parcelasGeradas: [],
          parcelasPagas: 0
        }
      });
      console.log('[Financeiro] Editando item:', item);
    } else {
      setEditingItem(null);
      setFormData({
        descricao: '',
        valor: '',
        dataVencimento: '',
        tipo: currentView,
        status: 'Pendente',
        observacoes: '',
        categoria: 'vendas',
        formaPagamento: 'dinheiro',
        cliente: '',
        telefone: '',
        clienteId: '',
        origemId: '',
        parcelamento: {
          ativo: false,
          parcelas: 1,
          intervalo: 'mensal',
          valorParcela: 0,
          parcelasGeradas: [],
          parcelasPagas: 0
        }
      });
      console.log('[Financeiro] Novo item, formulário limpo');
    }
    openDialog('financeiro');
    console.log('[Financeiro] Dialog de financeiro aberto');
  };

  const handleCloseDialog = () => {
    closeDialog('financeiro');
    console.log('[Financeiro] Dialog de financeiro fechado');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar permissões
    if (editingItem) {
      if (!canEdit('financeiro')) return;
    } else {
      if (!canCreate('financeiro')) return;
    }
    
    console.log('[Financeiro] Submissão do formulário:', formData, editingItem);
    
    // Verificar campos obrigatórios
    if (!formData.descricao || !formData.valor || !formData.dataVencimento) {
      toast({
        title: "Campos obrigatórios",
        description: "Descrição, valor e data de vencimento são obrigatórios!",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Corrigir timezone da data de vencimento
      const dataVencimentoCorrigida = new Date(formData.dataVencimento + 'T12:00:00');
      
      // Preparar dados do lançamento
      let itemData = {
        ...formData,
        valor: parseFloat(formData.valor),
        dataVencimento: dataVencimentoCorrigida.toISOString().split('T')[0],
        createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Variável para controlar se cliente foi cadastrado ou encontrado
      let clienteExistente = null;
      let clienteFoiCadastrado = false;

      // Se é um novo lançamento e tem cliente, verificar se precisa cadastrar
      if (!editingItem && formData.cliente.trim()) {
        // Buscar cliente existente
        clienteExistente = clientes.find(c => 
          c.nome.toLowerCase().includes(formData.cliente.toLowerCase()) ||
          (c.telefone && formData.telefone && c.telefone.includes(formData.telefone))
        );

        if (clienteExistente) {
          // Cliente encontrado, vincular
          itemData.clienteId = clienteExistente.id;
          itemData.cliente = clienteExistente.nome;
          itemData.telefone = clienteExistente.telefone || formData.telefone;
        } else {
          // Cliente não encontrado, cadastrar automaticamente
          try {
            const novoCliente = {
              nome: formData.cliente.trim(),
              telefone: formData.telefone.trim(),
              email: '',
              endereco: '',
              observacoes: 'Cadastrado automaticamente via financeiro',
              createdAt: new Date().toISOString()
            };
            
            const clienteSalvo = await saveCliente(novoCliente);
            itemData.clienteId = clienteSalvo.id || Date.now();
            clienteFoiCadastrado = true;
          } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);
            // Mesmo com erro, salvar no lançamento
            itemData.clienteId = '';
          }
        }
      }

      await save(itemData, editingItem?.id);
      
      if (editingItem) {
        console.log('[Financeiro] Item atualizado:', itemData);
        toast({
          title: "Sucesso!",
          description: "Item financeiro atualizado com sucesso!"
        });
      } else {
        console.log('[Financeiro] Item cadastrado:', itemData);
        let description = "Item financeiro cadastrado com sucesso!";
        
        // Adicionar informação sobre cliente se foi cadastrado
        if (itemData.clienteId && clienteFoiCadastrado) {
          description += ` Cliente "${itemData.cliente}" foi cadastrado automaticamente.`;
        } else if (itemData.clienteId && clienteExistente) {
          description += ` Cliente "${itemData.cliente}" vinculado da base.`;
        }
        
        toast({
          title: "Sucesso!",
          description: description
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('[Financeiro] Erro ao salvar item:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar item financeiro. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (item) => {
    if (!canDelete('financeiro')) return;
    setItemToDelete(item);
    setConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await remove(itemToDelete.id);
      console.log('[Financeiro] Item removido:', itemToDelete.id);
      toast({
        title: "Sucesso!",
        description: "Item financeiro removido com sucesso!"
      });
      setConfirmDeleteOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('[Financeiro] Erro ao remover item:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover item financeiro. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para sincronizar com OS (baseada na integração original)
  const syncWithOS = (os, action) => {
    const financeiro = JSON.parse(localStorage.getItem('crm_financeiro') || '[]');
    let updatedFinanceiro = financeiro;

    if (action === 'add') {
      const existingEntry = financeiro.find(entry => entry.origemId === `os-${os.id}`);
      if (!existingEntry) {
        const newEntry = {
          id: Date.now(),
          descricao: `Recebimento da OS: ${os.numero}`,
          valor: parseFloat(os.valor),
          dataVencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Amanhã
          tipo: 'receber',
          status: 'Pendente',
          origemId: `os-${os.id}`,
          createdAt: new Date().toISOString()
        };
        updatedFinanceiro = [...financeiro, newEntry];
      }
    } else if (action === 'remove') {
      updatedFinanceiro = financeiro.filter(entry => entry.origemId !== `os-${os.id}`);
    }
    
    localStorage.setItem('crm_financeiro', JSON.stringify(updatedFinanceiro));
    window.dispatchEvent(new Event('storage'));
  };

  // Função para sincronizar com OV (baseada na integração original)
  const syncWithOV = (ov, action) => {
    const financeiro = JSON.parse(localStorage.getItem('crm_financeiro') || '[]');
    let updatedFinanceiro = financeiro;

    if (action === 'add') {
      const existingEntry = financeiro.find(entry => entry.origemId === `ov-${ov.id}`);
      if (!existingEntry) {
        const newEntry = {
          id: Date.now(),
          descricao: `Recebimento da OV: ${ov.numero}`,
          valor: ov.total,
          dataVencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Amanhã
          tipo: 'receber',
          status: 'Pendente',
          origemId: `ov-${ov.id}`,
          createdAt: new Date().toISOString()
        };
        updatedFinanceiro = [...financeiro, newEntry];
      }
    } else if (action === 'remove') {
      updatedFinanceiro = financeiro.filter(entry => entry.origemId !== `ov-${ov.id}`);
    }
    
    localStorage.setItem('crm_financeiro', JSON.stringify(updatedFinanceiro));
    window.dispatchEvent(new Event('storage'));
  };

  // Sincronizar automaticamente com OS e OV existentes
  useEffect(() => {
    console.log('[Financeiro] Sincronizando com OS e OV existentes...');
    
    // Sincronizar OS concluídas
    ordens?.forEach(os => {
      if (os.status === 'Concluída') {
        syncWithOS(os, 'add');
      }
    });

    // Sincronizar OV concluídas
    vendas?.forEach(ov => {
      if (ov.status === 'Concluída') {
        syncWithOV(ov, 'add');
      }
    });
  }, [ordens, vendas]);

  // Funções de análise e estatísticas
  const getFinanceiroStats = () => {
    const total = financeiro.filter(f => f.tipo === currentView).length;
    const receber = financeiro.filter(f => f.tipo === 'receber').reduce((sum, f) => sum + (f.valor || 0), 0);
    const pagar = financeiro.filter(f => f.tipo === 'pagar').reduce((sum, f) => sum + (f.valor || 0), 0);
    const pendentes = financeiro.filter(f => f.tipo === currentView && f.status === 'Pendente').length;
    const vencidos = financeiro.filter(f => {
      if (f.tipo === currentView && f.status === 'Pendente' && f.dataVencimento) {
        // Se não é parcelado, usa a lógica normal
        if (!f.parcelamento?.ativo || f.parcelamento?.parcelas <= 1) {
          return new Date(f.dataVencimento) < new Date();
        }
        
        // Se é parcelado, verifica se tem parcelas vencidas
        return isParcelaVencida(f, 1); // Verifica se a primeira parcela está vencida
      }
      return false;
    }).length;
    
    const valorTotal = currentView === 'receber' ? receber : pagar;
    
    return { total, receber, pagar, pendentes, vencidos, valorTotal, saldo: receber - pagar };
  };

  // Funções de filtro e ordenação
  const filteredFinanceiro = financeiro.filter(item => {
    const matchesSearch = item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por view atual (receber/pagar)
    const matchesView = item.tipo === currentView;
    
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    
    // Filtro por origem
    const matchesOrigem = filtroOrigem === 'todos' || 
      (filtroOrigem === 'vendas' && item.origemId?.startsWith('ov-')) ||
      (filtroOrigem === 'servicos' && item.origemId?.startsWith('os-')) ||
      (filtroOrigem === 'outros' && !item.origemId?.startsWith('ov-') && !item.origemId?.startsWith('os-'));
    
    // Filtro por forma de pagamento
    const matchesFormaPagamento = filtroFormaPagamento === 'todos' || item.formaPagamento === filtroFormaPagamento;
    
    return matchesSearch && matchesView && matchesStatus && matchesOrigem && matchesFormaPagamento;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'data':
        comparison = new Date(a.dataVencimento) - new Date(b.dataVencimento);
        break;
      case 'valor':
        comparison = (a.valor || 0) - (b.valor || 0);
        break;
      case 'descricao':
        comparison = a.descricao.localeCompare(b.descricao);
        break;
      default:
        comparison = new Date(a.dataVencimento) - new Date(b.dataVencimento);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Funções utilitárias
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Funções para navegação do calendário
  const goToPreviousMonth = () => {
    setCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentCalendarDate(new Date());
  };

  // Função para filtrar clientes enquanto digita
  const filtrarClientes = (termo) => {
    if (!termo.trim()) {
      setClientesFiltrados([]);
      setShowClientesDropdown(false);
      return;
    }

    const filtrados = clientes.filter(cliente => 
      cliente.nome.toLowerCase().includes(termo.toLowerCase()) ||
      (cliente.telefone && cliente.telefone.includes(termo)) ||
      (cliente.email && cliente.email.toLowerCase().includes(termo.toLowerCase()))
    );
    
    setClientesFiltrados(filtrados.slice(0, 5)); // Limitar a 5 resultados
    setShowClientesDropdown(filtrados.length > 0);
  };

  // Função para selecionar cliente do dropdown
  const selecionarCliente = (cliente) => {
    setFormData(prev => ({
      ...prev,
      cliente: cliente.nome,
      telefone: cliente.telefone || '',
      clienteId: cliente.id
    }));
    setShowClientesDropdown(false);
    setClientesFiltrados([]);
  };

  // Função para lidar com seleção/cadastro de cliente
  const handleClienteChange = async (nome, telefone = '') => {
    if (!nome.trim()) {
      setFormData(prev => ({ ...prev, cliente: '', telefone: '', clienteId: '' }));
      return;
    }

    // Buscar cliente existente
    const clienteExistente = clientes.find(c => 
      c.nome.toLowerCase().includes(nome.toLowerCase()) ||
      (c.telefone && c.telefone.includes(telefone))
    );

    if (clienteExistente) {
      // Cliente encontrado - sempre atualizar dados
      setFormData(prev => ({
        ...prev,
        cliente: clienteExistente.nome,
        telefone: clienteExistente.telefone || '',
        clienteId: clienteExistente.id
      }));
      toast({
        title: "Cliente encontrado!",
        description: `${clienteExistente.nome} selecionado.`
      });
    } else if (nome.trim() && !editingItem) {
      // Cliente não encontrado - cadastrar automaticamente APENAS para novos lançamentos
      try {
        const novoCliente = {
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: '',
          endereco: '',
          observacoes: 'Cadastrado automaticamente via financeiro',
          createdAt: new Date().toISOString()
        };
        
        const clienteSalvo = await saveCliente(novoCliente);
        setFormData(prev => ({
          ...prev,
          cliente: nome.trim(),
          telefone: telefone.trim(),
          clienteId: clienteSalvo.id || Date.now()
        }));
        
        toast({
          title: "Cliente cadastrado!",
          description: `${nome} foi cadastrado automaticamente.`
        });
      } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
        toast({
          title: "Erro ao cadastrar cliente",
          description: "Cliente será salvo apenas no lançamento.",
          variant: "destructive"
        });
        // Mesmo com erro, salvar no lançamento
        setFormData(prev => ({
          ...prev,
          cliente: nome.trim(),
          telefone: telefone.trim(),
          clienteId: ''
        }));
      }
    } else if (nome.trim() && editingItem) {
      // Editando lançamento existente - apenas salvar no lançamento, não cadastrar na base
      setFormData(prev => ({
        ...prev,
        cliente: nome.trim(),
        telefone: telefone.trim(),
        clienteId: '' // Não vincular com base de clientes
      }));
      toast({
        title: "Cliente atualizado!",
        description: "Dados do cliente atualizados no lançamento.",
        variant: "default"
      });
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const getTipoColor = (tipo) => {
    return tipo === 'receber' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
           'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Concluído': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Vencido': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const isVencido = (dataVencimento, status) => {
    return status === 'Pendente' && new Date(dataVencimento) < new Date();
  };

  // Função para verificar se uma parcela específica está vencida
  const isParcelaVencida = (item, numeroParcela) => {
    if (!item.parcelamento?.ativo || item.parcelamento?.parcelas <= 1) {
      // Se não é parcelado, usa a lógica normal
      return isVencido(item.dataVencimento, item.status);
    }

    // Se é parcelado, calcula a data de vencimento da parcela específica
    const dataBase = new Date(item.dataVencimento + 'T12:00:00');
    const dataParcela = new Date(dataBase);
    
    // Calcular data baseada no intervalo
    switch (item.parcelamento.intervalo) {
      case 'semanal':
        dataParcela.setDate(dataParcela.getDate() + ((numeroParcela - 1) * 7));
        break;
      case 'quinzenal':
        dataParcela.setDate(dataParcela.getDate() + ((numeroParcela - 1) * 15));
        break;
      case 'mensal':
      default:
        dataParcela.setMonth(dataParcela.getMonth() + (numeroParcela - 1));
        break;
    }

    // Verifica se a parcela está vencida (data passou e não foi paga)
    const hoje = new Date();
    const parcelasPagas = item.parcelamento.parcelasPagas || 0;
    const parcelaFoiPaga = numeroParcela <= parcelasPagas;
    
    return !parcelaFoiPaga && dataParcela < hoje;
  };

  // Função para obter origem do item (OS ou OV)
  const getOrigemInfo = (origemId) => {
    if (origemId?.startsWith('os-')) {
      const osId = origemId.replace('os-', '');
      const os = ordens?.find(o => o.id === osId);
      return os ? { tipo: 'OS', numero: os.numero, cliente: os.clienteNome } : null;
    } else if (origemId?.startsWith('ov-')) {
      const ovId = origemId.replace('ov-', '');
      const ov = vendas?.find(v => v.id === ovId);
      return ov ? { tipo: 'OV', numero: ov.numero, cliente: ov.clienteNome } : null;
    }
    return null;
  };

  const stats = getFinanceiroStats();

  return (
    <div className="space-y-6">
      {/* HEADER COM ESTATÍSTICAS */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl p-4 sm:p-6 text-white"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">💰 Financeiro</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Controle completo do seu fluxo de caixa</p>
            
            {/* Tabs para alternar entre Receber e Pagar */}
            <div className="mt-3 sm:mt-4 flex bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
              <button
                onClick={() => setCurrentView('receber')}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                  currentView === 'receber'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-2" />
                Contas a Receber
              </button>
              <button
                onClick={() => setCurrentView('pagar')}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                  currentView === 'pagar'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <TrendingDown className="h-4 w-4 inline mr-2" />
                Contas a Pagar
              </button>
            </div>
          </div>
          
          <div className="flex gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => setParcelasCalendarOpen(true)} 
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
                size="lg"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Calendário de Parcelas
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Dialog open={dialogs.financeiro} onOpenChange={handleCloseDialog}>
            <Button 
              onClick={() => handleOpenDialog()} 
              className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Lançamento
            </Button>
                <DialogContent className="sm:max-w-2xl w-full max-w-[95vw] max-h-[95vh] bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-y-auto scrollbar-hide">
                <DialogHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
                  <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <DollarSign className="h-6 w-6" />
                    </motion.div>
                    {editingItem ? 'Editar Item Financeiro' : 'Novo Item Financeiro'}
                  </DialogTitle>
                  <DialogDescription className="text-green-100 mt-2">
                    {editingItem ? 'Atualize as informações do item financeiro' : 'Cadastre um novo item no seu fluxo de caixa'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* SEÇÃO BÁSICA */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Informações Básicas</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <Label htmlFor="descricao" className="text-sm font-medium">Descrição *</Label>
                        <Input
                          id="descricao"
                          value={formData.descricao}
                          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                          placeholder="Ex: Venda de produto, Pagamento fornecedor"
                          className="mt-2 h-11"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="valor" className="text-sm font-medium">Valor (R$) *</Label>
                        <Input
                          id="valor"
                          type="number"
                          step="0.01"
                          value={formData.valor}
                          onChange={(e) => {
                            const valor = e.target.value;
                            const parcelas = formData.parcelamento.parcelas || 1;
                            setFormData({
                              ...formData, 
                              valor,
                              parcelamento: {
                                ...formData.parcelamento,
                                valorParcela: parseFloat(valor) / parcelas || 0
                              }
                            });
                          }}
                          placeholder="0.00"
                          className="mt-2 h-11"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div>
                        <Label htmlFor="tipo" className="text-sm font-medium">Tipo *</Label>
                        <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
                          <SelectTrigger className="mt-2 h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="receber">💰 Receber</SelectItem>
                            <SelectItem value="pagar">💸 Pagar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                          <SelectTrigger className="mt-2 h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendente">⏳ Pendente</SelectItem>
                            <SelectItem value="Concluído">✅ Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dataVencimento" className="text-sm font-medium">Data de Vencimento *</Label>
                        <Input
                          id="dataVencimento"
                          type="date"
                          value={formData.dataVencimento}
                          onChange={(e) => setFormData({...formData, dataVencimento: e.target.value})}
                          className="mt-2 h-11"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO DE PARCELAMENTO - DESIGN MELHORADO */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="p-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Parcelamento</h3>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-slate-800/30 dark:via-slate-700/30 dark:to-slate-600/30 rounded-2xl p-8 border border-orange-200 dark:border-slate-600 shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="parcelamentoAtivo"
                            checked={formData.parcelamento.ativo}
                            onChange={(e) => {
                              const ativo = e.target.checked;
                              const parcelas = ativo ? formData.parcelamento.parcelas : 1;
                              const valorTotal = parseFloat(formData.valor) || 0;
                              setFormData({
                                ...formData,
                                parcelamento: {
                                  ...formData.parcelamento,
                                  ativo,
                                  parcelas,
                                  valorParcela: valorTotal / parcelas
                                }
                              });
                            }}
                            className="w-5 h-5 rounded border-2 border-orange-400 text-orange-500 focus:ring-orange-500"
                          />
                          <Label htmlFor="parcelamentoAtivo" className="text-lg font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            Ativar parcelamento
                          </Label>
                        </div>
                        {formData.parcelamento.ativo && (
                          <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Parcelado</span>
                          </div>
                        )}
                      </div>
                      
                      {formData.parcelamento.ativo && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                              <Label htmlFor="parcelas" className="text-sm font-medium text-slate-700 dark:text-slate-300">Número de Parcelas</Label>
                              <Input
                                id="parcelas"
                                type="number"
                                min="1"
                                max="60"
                                value={formData.parcelamento.parcelas}
                                onChange={(e) => {
                                  const parcelas = parseInt(e.target.value) || 1;
                                  const valorTotal = parseFloat(formData.valor) || 0;
                                  setFormData({
                                    ...formData,
                                    parcelamento: {
                                      ...formData.parcelamento,
                                      parcelas,
                                      valorParcela: valorTotal / parcelas
                                    }
                                  });
                                }}
                                className="mt-2 h-11 text-lg font-semibold"
                                placeholder="1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="intervalo" className="text-sm font-medium text-slate-700 dark:text-slate-300">Intervalo</Label>
                              <Select value={formData.parcelamento.intervalo} onValueChange={(value) => setFormData({
                                ...formData,
                                parcelamento: { ...formData.parcelamento, intervalo: value }
                              })}>
                                <SelectTrigger id="intervalo" className="mt-2 h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mensal">📅 Mensal</SelectItem>
                                  <SelectItem value="quinzenal">📆 Quinzenal</SelectItem>
                                  <SelectItem value="semanal">📊 Semanal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {formData.valor && formData.parcelamento.parcelas > 1 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 dark:border-slate-600/50 shadow-lg"
                            >
                              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <div className="p-1 bg-blue-500 rounded">
                                  <Target className="h-4 w-4 text-white" />
                                </div>
                                Resumo do Parcelamento
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                      <DollarSign className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Valor Total</div>
                                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400 break-all">
                                        {formatCurrency(parseFloat(formData.valor))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-green-500 rounded-lg">
                                      <CreditCard className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-green-800 dark:text-green-200">Valor por Parcela</div>
                                      <div className="text-lg font-bold text-green-600 dark:text-green-400 break-all">
                                        {formatCurrency(formData.parcelamento.valorParcela)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-purple-500 rounded-lg">
                                      <Target className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-purple-800 dark:text-purple-200">Total de Parcelas</div>
                                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {formData.parcelamento.parcelas}x
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-orange-500 rounded-lg">
                                      <Calendar className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-orange-800 dark:text-orange-200">Intervalo</div>
                                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400 capitalize">
                                        {formData.parcelamento.intervalo}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Barra de Progresso das Parcelas */}
                              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progresso das Parcelas</span>
                                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                    {formData.parcelamento.parcelasPagas || 0} / {formData.parcelamento.parcelas} pagas
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ 
                                      width: `${((formData.parcelamento.parcelasPagas || 0) / formData.parcelamento.parcelas) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                                  <span>0%</span>
                                  <span className="font-medium">
                                    {Math.round(((formData.parcelamento.parcelasPagas || 0) / formData.parcelamento.parcelas) * 100)}% concluído
                                  </span>
                                  <span>100%</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* SEÇÃO DE DETALHES */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Detalhes Adicionais</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <Label htmlFor="categoria" className="text-sm font-medium">Categoria</Label>
                        <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                          <SelectTrigger className="mt-2 h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vendas">🛒 Vendas</SelectItem>
                            <SelectItem value="servicos">🔧 Serviços</SelectItem>
                            <SelectItem value="fornecedores">🏭 Fornecedores</SelectItem>
                            <SelectItem value="impostos">📊 Impostos</SelectItem>
                            <SelectItem value="salarios">👥 Salários</SelectItem>
                            <SelectItem value="outros">📋 Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="formaPagamento" className="text-sm font-medium">Forma de Pagamento</Label>
                        <Select value={formData.formaPagamento} onValueChange={(value) => setFormData({...formData, formaPagamento: value})}>
                          <SelectTrigger id="formaPagamento" className="mt-2 h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                            <SelectItem value="pix">📱 PIX</SelectItem>
                            <SelectItem value="cartao_credito">💳 Cartão de Crédito</SelectItem>
                            <SelectItem value="cartao_debito">💳 Cartão de Débito</SelectItem>
                            <SelectItem value="transferencia">🏦 Transferência</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="cliente" className="text-sm font-medium">Cliente</Label>
                      <div className="relative flex gap-2 mt-2">
                        <div className="flex-1 relative">
                          <div className="relative">
                            <Input
                              id="cliente"
                              value={formData.cliente}
                              onChange={(e) => {
                                const nome = e.target.value;
                                setFormData(prev => ({ ...prev, cliente: nome, clienteId: '' }));
                                filtrarClientes(nome);
                              }}
                              onFocus={() => {
                                if (formData.cliente.trim()) {
                                  filtrarClientes(formData.cliente);
                                }
                              }}
                              onBlur={() => {
                                // Delay para permitir clique no dropdown
                                setTimeout(() => setShowClientesDropdown(false), 200);
                              }}
                              placeholder="Nome do cliente..."
                              className="w-full h-11 pl-10"
                            />
                            
                            {/* Customer Avatar inside input */}
                            {formData.clienteId && (
                              <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                                <CustomerAvatar 
                                  customer={clientes.find(c => c.id === formData.clienteId)} 
                                  size="xs"
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* Dropdown de clientes */}
                          {showClientesDropdown && clientesFiltrados.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto scrollbar-hide">
                              {clientesFiltrados.map(cliente => (
                                <div
                                  key={cliente.id}
                                  className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                                  onClick={() => selecionarCliente(cliente)}
                                >
                                  <CustomerAvatar 
                                    customer={cliente} 
                                    size="sm" 
                                    showName={true} 
                                    showPhone={true}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <Input
                          value={formData.telefone}
                          onChange={(e) => {
                            const telefone = e.target.value;
                            setFormData(prev => ({ ...prev, telefone }));
                          }}
                          placeholder="Telefone..."
                          className="w-32 h-11"
                        />
                      </div>
                      {formData.clienteId && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✓ Cliente selecionado da base
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="observacoes" className="text-sm font-medium">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                        placeholder="Observações adicionais..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 w-full max-w-full">
                      {editingItem ? 'Atualizar Item' : 'Cadastrar Item'}
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
        </div>

        {/* CARDS DE ESTATÍSTICAS */}
        {showStats && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-4 sm:mt-6 w-full max-w-full"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Total {currentView === 'receber' ? 'a Receber' : 'a Pagar'}</p>
                  <p className="text-white text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentView === 'receber' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {currentView === 'receber' ? 
                    <TrendingUp className="h-5 w-5 text-green-200" /> : 
                    <TrendingDown className="h-5 w-5 text-red-200" />
                  }
                </div>
                <div>
                  <p className="text-white/80 text-sm">Valor Total</p>
                  <p className="text-white text-2xl font-bold">{formatCurrency(stats.valorTotal)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-200" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Pendentes</p>
                  <p className="text-white text-2xl font-bold">{stats.pendentes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-200" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Vencidos</p>
                  <p className="text-white text-2xl font-bold">{stats.vencidos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Target className="h-5 w-5 text-purple-200" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Saldo Geral</p>
                  <p className={`text-white text-2xl font-bold ${stats.saldo >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {formatCurrency(stats.saldo)}
                  </p>
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
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar itens financeiros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
              <SelectTrigger className="w-full sm:w-40">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Origens</SelectItem>
                <SelectItem value="vendas">🛒 Vendas</SelectItem>
                <SelectItem value="servicos">🔧 Serviços</SelectItem>
                <SelectItem value="outros">📝 Outros</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroFormaPagamento} onValueChange={setFiltroFormaPagamento}>
              <SelectTrigger className="w-full sm:w-40">
                <CreditCard className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Formas</SelectItem>
                <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                <SelectItem value="pix">📱 PIX</SelectItem>
                <SelectItem value="cartao_credito">💳 Cartão de Crédito</SelectItem>
                <SelectItem value="cartao_debito">💳 Cartão de Débito</SelectItem>
                <SelectItem value="transferencia">🏦 Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
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
                <Receipt className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* LISTA DE ITENS FINANCEIROS */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando itens financeiros...</p>
          </motion.div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full" 
              : "space-y-3 sm:space-y-4"
            }
          >
            {filteredFinanceiro.map((item, index) => {
              const vencido = isParcelaVencida(item, 1);

              if (viewMode === 'grid') {
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.tipo === 'receber' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {item.tipo === 'receber' ? 
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /> : 
                            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                          }
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white text-lg group-hover:text-green-600 transition-colors">
                            {item.descricao}
                          </h3>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getTipoColor(item.tipo)}>
                              {item.tipo === 'receber' ? 'Receber' : 'Pagar'}
                            </Badge>
                            <Badge className={vencido ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : getStatusColor(item.status)}>
                              {vencido ? 'Vencido' : item.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedItem(item); setItemDetailsOpen(true); }}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(item)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {item.parcelamento?.ativo && item.parcelamento?.parcelas > 1 && (item.parcelamento.parcelasPagas || 0) < item.parcelamento.parcelas && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const novasParcelasPagas = (item.parcelamento.parcelasPagas || 0) + 1;
                              const todasParcelasPagas = novasParcelasPagas >= item.parcelamento.parcelas;
                              
                              const itemAtualizado = {
                                ...item,
                                status: todasParcelasPagas ? 'Pago' : item.status,
                                parcelamento: {
                                  ...item.parcelamento,
                                  parcelasPagas: novasParcelasPagas
                                }
                              };
                              save(itemAtualizado, item.id);
                              toast({
                                title: todasParcelasPagas ? "Todas as parcelas pagas!" : "Parcela paga!",
                                description: todasParcelasPagas 
                                  ? "Item marcado como pago automaticamente."
                                  : `Parcela ${novasParcelasPagas}/${item.parcelamento.parcelas} marcada como paga.`
                              });
                            }}
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {item.parcelamento?.ativo && item.parcelamento?.parcelas > 1 && (item.parcelamento.parcelasPagas || 0) > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const novasParcelasPagas = Math.max(0, (item.parcelamento.parcelasPagas || 0) - 1);
                              const itemAtualizado = {
                                ...item,
                                status: item.status === 'Pago' && novasParcelasPagas < item.parcelamento.parcelas ? 'Pendente' : item.status,
                                parcelamento: {
                                  ...item.parcelamento,
                                  parcelasPagas: novasParcelasPagas
                                }
                              };
                              save(itemAtualizado, item.id);
                              toast({
                                title: "Parcela desfeita!",
                                description: `Parcela ${novasParcelasPagas + 1}/${item.parcelamento.parcelas} desmarcada.`
                              });
                            }}
                            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(item)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">{formatDate(item.dataVencimento)}</span>
                      </div>
                      
                      {item.cliente && (
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                          <CustomerAvatar 
                            customer={{
                              nome: item.cliente,
                              telefone: item.telefone,
                              foto: clientes.find(c => c.id === item.clienteId)?.foto
                            }} 
                            size="xs" 
                            showName={true}
                          />
                        </div>
                      )}

                      {item.origemId && (
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                          <Tag className="h-4 w-4" />
                          <span className="text-sm">
                            {(() => {
                              const origem = getOrigemInfo(item.origemId);
                              return origem ? `${origem.tipo}: ${origem.numero}` : 'Origem desconhecida';
                            })()}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-sm text-slate-500">Valor:</span>
                        <span className={`text-2xl font-bold ${item.tipo === 'receber' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(item.valor)}
                        </span>
                      </div>
                      
                      {/* Barra de Progresso para Parcelas */}
                      {item.parcelamento?.ativo && item.parcelamento?.parcelas > 1 && (
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-500">Parcelas</span>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {item.parcelamento.parcelasPagas || 0}/{item.parcelamento.parcelas}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((item.parcelamento.parcelasPagas || 0) / item.parcelamento.parcelas) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              } else {
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${item.tipo === 'receber' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {item.tipo === 'receber' ? 
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /> : 
                            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                          }
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">{item.descricao}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.dataVencimento)}
                            {item.cliente && (
                              <>
                                <span>•</span>
                                <CustomerAvatar 
                                  customer={{
                                    nome: item.cliente,
                                    telefone: item.telefone,
                                    foto: clientes.find(c => c.id === item.clienteId)?.foto
                                  }} 
                                  size="xs" 
                                  showName={true}
                                />
                              </>
                            )}
                            {item.origemId && (
                              <>
                                <span>•</span>
                                <Tag className="h-3 w-3" />
                                {(() => {
                                  const origem = getOrigemInfo(item.origemId);
                                  return origem ? `${origem.tipo}: ${origem.numero}` : 'Origem desconhecida';
                                })()}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                        <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${item.tipo === 'receber' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(item.valor)}
                          </p>
                          <div className="flex gap-2 mb-2">
                            <Badge className={getTipoColor(item.tipo)}>
                              {item.tipo === 'receber' ? 'Receber' : 'Pagar'}
                            </Badge>
                            <Badge className={vencido ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : getStatusColor(item.status)}>
                              {vencido ? 'Vencido' : item.status}
                            </Badge>
                          </div>
                          
                          {/* Barra de Progresso para Parcelas na Lista */}
                          {item.parcelamento?.ativo && item.parcelamento?.parcelas > 1 && (
                            <div className="w-32">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-500">Parcelas</span>
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {item.parcelamento.parcelasPagas || 0}/{item.parcelamento.parcelas}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${((item.parcelamento.parcelasPagas || 0) / item.parcelamento.parcelas) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedItem(item); setItemDetailsOpen(true); }}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(item)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {item.parcelamento?.ativo && item.parcelamento?.parcelas > 1 && (item.parcelamento.parcelasPagas || 0) < item.parcelamento.parcelas && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const novasParcelasPagas = (item.parcelamento.parcelasPagas || 0) + 1;
                                const todasParcelasPagas = novasParcelasPagas >= item.parcelamento.parcelas;
                                
                                const itemAtualizado = {
                                  ...item,
                                  status: todasParcelasPagas ? 'Pago' : item.status,
                                  parcelamento: {
                                    ...item.parcelamento,
                                    parcelasPagas: novasParcelasPagas
                                  }
                                };
                                save(itemAtualizado, item.id);
                                toast({
                                  title: todasParcelasPagas ? "Todas as parcelas pagas!" : "Parcela paga!",
                                  description: todasParcelasPagas 
                                    ? "Item marcado como pago automaticamente."
                                    : `Parcela ${novasParcelasPagas}/${item.parcelamento.parcelas} marcada como paga.`
                                });
                              }}
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {item.parcelamento?.ativo && item.parcelamento?.parcelas > 1 && (item.parcelamento.parcelasPagas || 0) > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const novasParcelasPagas = Math.max(0, (item.parcelamento.parcelasPagas || 0) - 1);
                                const itemAtualizado = {
                                  ...item,
                                  status: item.status === 'Pago' && novasParcelasPagas < item.parcelamento.parcelas ? 'Pendente' : item.status,
                                  parcelamento: {
                                    ...item.parcelamento,
                                    parcelasPagas: novasParcelasPagas
                                  }
                                };
                                save(itemAtualizado, item.id);
                                toast({
                                  title: "Parcela desfeita!",
                                  description: `Parcela ${novasParcelasPagas + 1}/${item.parcelamento.parcelas} desmarcada.`
                                });
                              }}
                              className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(item)}
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

      {!loading && filteredFinanceiro.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {searchTerm ? 'Nenhum item encontrado' : 'Nenhum item financeiro cadastrado'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchTerm ? 'Tente buscar com outros termos' : 'Comece cadastrando seu primeiro item financeiro'}
          </p>
          {!searchTerm && (
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-green-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Item
            </Button>
          )}
        </motion.div>
      )}

      {/* MODAL DE DETALHES DO ITEM */}
      <Dialog open={itemDetailsOpen} onOpenChange={setItemDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedItem.tipo === 'receber' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {selectedItem.tipo === 'receber' ? 
                      <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" /> : 
                      <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                    }
                  </div>
                  {selectedItem.descricao}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-full">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        Valor
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${selectedItem.tipo === 'receber' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(selectedItem.valor)}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{selectedItem.tipo === 'receber' ? 'Valor a receber' : 'Valor a pagar'}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        Vencimento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatDate(selectedItem.dataVencimento)}</div>
                      <p className={`text-sm ${isParcelaVencida(selectedItem, 1) ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {isParcelaVencida(selectedItem, 1) ? 'Vencido' : 'Data de vencimento'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-purple-500" />
                      Informações Detalhadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getTipoColor(selectedItem.tipo)}>
                        {selectedItem.tipo === 'receber' ? 'Receber' : 'Pagar'}
                      </Badge>
                      <Badge className={isParcelaVencida(selectedItem, 1) ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : getStatusColor(selectedItem.status)}>
                        {isParcelaVencida(selectedItem, 1) ? 'Vencido' : selectedItem.status}
                      </Badge>
                    </div>
                    
                    {selectedItem.cliente && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-slate-400" />
                        <span><strong>Cliente:</strong> {selectedItem.cliente}</span>
                        {selectedItem.telefone && (
                          <span className="text-slate-500">• {selectedItem.telefone}</span>
                        )}
                      </div>
                    )}
                    
                    {selectedItem.categoria && (
                      <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 text-slate-400" />
                        <span><strong>Categoria:</strong> {selectedItem.categoria}</span>
                      </div>
                    )}
                    
                    {selectedItem.formaPagamento && (
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        <span><strong>Forma de Pagamento:</strong> {selectedItem.formaPagamento}</span>
                      </div>
                    )}
                    
                    {selectedItem.origemId && (
                      <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 text-slate-400" />
                        <span>
                          <strong>Origem:</strong> {(() => {
                            const origem = getOrigemInfo(selectedItem.origemId);
                            return origem ? `${origem.tipo} ${origem.numero} - ${origem.cliente}` : 'Origem desconhecida';
                          })()}
                        </span>
                      </div>
                    )}
                    
                    {selectedItem.observacoes && (
                      <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <strong>Observações:</strong> {selectedItem.observacoes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Seção de Parcelamento */}
                {selectedItem.parcelamento?.ativo && selectedItem.parcelamento?.parcelas > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        Detalhes do Parcelamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <DollarSign className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Valor Total</div>
                              <div className="text-lg font-bold text-blue-600 dark:text-blue-400 break-all">
                                {formatCurrency(selectedItem.valor)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-500 rounded-lg">
                              <CreditCard className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-green-800 dark:text-green-200">Valor por Parcela</div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400 break-all">
                                {formatCurrency(selectedItem.parcelamento.valorParcela)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                              <Target className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-purple-800 dark:text-purple-200">Total de Parcelas</div>
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {selectedItem.parcelamento.parcelas}x
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-orange-500 rounded-lg">
                              <Calendar className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-orange-800 dark:text-orange-200">Intervalo</div>
                              <div className="text-lg font-bold text-orange-600 dark:text-orange-400 capitalize">
                                {selectedItem.parcelamento.intervalo}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progresso das Parcelas</span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {selectedItem.parcelamento.parcelasPagas || 0} / {selectedItem.parcelamento.parcelas} pagas
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                            style={{ 
                              width: `${((selectedItem.parcelamento.parcelasPagas || 0) / selectedItem.parcelamento.parcelas) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                          <span>0%</span>
                          <span className="font-medium">
                            {Math.round(((selectedItem.parcelamento.parcelasPagas || 0) / selectedItem.parcelamento.parcelas) * 100)}% concluído
                          </span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Resumo das Parcelas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-800 dark:text-green-200">Parcelas Pagas</span>
                          </div>
                          <div className="text-2xl font-bold text-green-600">{selectedItem.parcelamento.parcelasPagas || 0}</div>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            Valor pago: {formatCurrency((selectedItem.parcelamento.parcelasPagas || 0) * selectedItem.parcelamento.valorParcela)}
                          </div>
                        </div>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            <span className="font-semibold text-orange-800 dark:text-orange-200">Parcelas Pendentes</span>
                          </div>
                          <div className="text-2xl font-bold text-orange-600">
                            {selectedItem.parcelamento.parcelas - (selectedItem.parcelamento.parcelasPagas || 0)}
                          </div>
                          <div className="text-sm text-orange-700 dark:text-orange-300">
                            Valor pendente: {formatCurrency((selectedItem.parcelamento.parcelas - (selectedItem.parcelamento.parcelasPagas || 0)) * selectedItem.parcelamento.valorParcela)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Informações sobre Parcelas Vencidas */}
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="font-semibold text-red-800 dark:text-red-200">Status das Parcelas</span>
                        </div>
                        <div className="space-y-2">
                          {Array.from({ length: selectedItem.parcelamento.parcelas }, (_, i) => {
                            const numeroParcela = i + 1;
                            const parcelaVencida = isParcelaVencida(selectedItem, numeroParcela);
                            const parcelaPaga = numeroParcela <= (selectedItem.parcelamento.parcelasPagas || 0);
                            
                            // Calcular data da parcela
                            const dataBase = new Date(selectedItem.dataVencimento + 'T12:00:00');
                            const dataParcela = new Date(dataBase);
                            
                            switch (selectedItem.parcelamento.intervalo) {
                              case 'semanal':
                                dataParcela.setDate(dataParcela.getDate() + ((numeroParcela - 1) * 7));
                                break;
                              case 'quinzenal':
                                dataParcela.setDate(dataParcela.getDate() + ((numeroParcela - 1) * 15));
                                break;
                              case 'mensal':
                              default:
                                dataParcela.setMonth(dataParcela.getMonth() + (numeroParcela - 1));
                                break;
                            }
                            
                            return (
                              <div key={numeroParcela} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-slate-700 dark:text-slate-300">
                                    Parcela {numeroParcela}
                                  </span>
                                  <span className="text-sm text-slate-500">
                                    Vence em {formatDate(dataParcela.toISOString().split('T')[0])}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {parcelaPaga ? (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Paga
                                    </Badge>
                                  ) : parcelaVencida ? (
                                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Vencida
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pendente
                                    </Badge>
                                  )}
                                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    {formatCurrency(selectedItem.parcelamento.valorParcela)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DO CALENDÁRIO DE PARCELAS */}
      <Dialog open={parcelasCalendarOpen} onOpenChange={setParcelasCalendarOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-500" />
              Calendário de Parcelas
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Filtros */}
            <div className="flex gap-4 items-center">
              <Select value={currentView} onValueChange={setCurrentView}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receber">Contas a Receber</SelectItem>
                  <SelectItem value="pagar">Contas a Pagar</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendentes">Pendentes</SelectItem>
                  <SelectItem value="concluidos">Concluídos</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Origens</SelectItem>
                  <SelectItem value="vendas">🛒 Vendas</SelectItem>
                  <SelectItem value="servicos">🔧 Serviços</SelectItem>
                  <SelectItem value="outros">📝 Outros</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroFormaPagamento} onValueChange={setFiltroFormaPagamento}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Formas</SelectItem>
                  <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                  <SelectItem value="pix">📱 PIX</SelectItem>
                  <SelectItem value="cartao_credito">💳 Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">💳 Cartão de Débito</SelectItem>
                  <SelectItem value="transferencia">🏦 Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Navegação do Calendário */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Mês Anterior
              </Button>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentCalendarDate.toLocaleDateString('pt-BR', { 
                    month: 'long', 
                    year: 'numeric' 
                  }).replace(/^\w/, c => c.toUpperCase())}
                </h3>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="text-xs"
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                  className="flex items-center gap-2"
                >
                  Próximo Mês
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendário Real */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center font-semibold text-slate-600 dark:text-slate-400 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - firstDay.getDay() + i);
                  
                  const dayParcelas = filteredFinanceiro
                    .filter(item => item.parcelamento?.ativo && item.parcelamento?.parcelas > 1)
                    .flatMap(item => {
                      const parcelas = [];
                      const dataBase = new Date(item.dataVencimento + 'T12:00:00'); // Fix timezone issue
                      
                      for (let i = 0; i < item.parcelamento.parcelas; i++) {
                        const dataParcela = new Date(dataBase);
                        
                        // Calcular data baseada no intervalo
                        switch (item.parcelamento.intervalo) {
                          case 'semanal':
                            dataParcela.setDate(dataParcela.getDate() + (i * 7));
                            break;
                          case 'quinzenal':
                            dataParcela.setDate(dataParcela.getDate() + (i * 15));
                            break;
                          case 'mensal':
                          default:
                            dataParcela.setMonth(dataParcela.getMonth() + i);
                            break;
                        }
                        
                        parcelas.push({
                          ...item,
                          dataParcela: dataParcela,
                          numeroParcela: i + 1
                        });
                      }
                      
                      return parcelas;
                    })
                    .filter(parcela => {
                      return parcela.dataParcela.getDate() === startDate.getDate() && 
                             parcela.dataParcela.getMonth() === startDate.getMonth() && 
                             parcela.dataParcela.getFullYear() === startDate.getFullYear();
                    });

                  const isCurrentMonth = startDate.getMonth() === currentCalendarDate.getMonth();
                  const isToday = startDate.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={i}
                      className={`
                        min-h-[80px] p-2 border border-slate-200 dark:border-slate-600 rounded-lg
                        ${isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900/50'}
                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                      `}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isCurrentMonth ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                      } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                        {startDate.getDate()}
                      </div>
                      
                  <div className="space-y-1">
                    {dayParcelas.slice(0, 3).map((parcela, idx) => (
                      <div
                        key={`${parcela.id}-${parcela.numeroParcela}`}
                        className={`
                          text-xs p-1 rounded truncate cursor-pointer
                          ${parcela.tipo === 'receber' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }
                        `}
                        onClick={() => { setSelectedItem(parcela); setItemDetailsOpen(true); setParcelasCalendarOpen(false); }}
                        title={`${parcela.descricao} - Parcela ${parcela.numeroParcela}/${parcela.parcelamento.parcelas} - ${formatCurrency(parcela.parcelamento.valorParcela)}`}
                      >
                        {parcela.descricao.length > 8 ? parcela.descricao.substring(0, 8) + '...' : parcela.descricao}
                        <span className="block text-xs opacity-75">
                          {parcela.numeroParcela}/{parcela.parcelamento.parcelas}
                        </span>
                      </div>
                    ))}
                        {dayParcelas.length > 3 && (
                          <div className="text-xs text-slate-500 text-center">
                            +{dayParcelas.length - 3} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legenda */}
            <div className="flex gap-6 items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 rounded"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Contas a Receber</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 rounded"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Contas a Pagar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-blue-500 rounded"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Hoje</span>
              </div>
            </div>

            {filteredFinanceiro.filter(item => item.parcelamento?.ativo && item.parcelamento?.parcelas > 1).length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Nenhuma parcela encontrada
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Não há itens parcelados com os filtros selecionados.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir Item Financeiro"
        description={`Tem certeza que deseja excluir "${itemToDelete?.descricao}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="delete"
      />
    </div>
  );
};

export default FinanceiroModule;
