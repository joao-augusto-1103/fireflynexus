import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Minus, 
  Eye,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Settings,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ShoppingCart,
  CreditCard as CardIcon,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calculator,
  Smartphone,
  Banknote,
  Grid3X3,
  List,
  Zap,
  Link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/App';
import { useCaixa, useOV, useFinanceiro, usePermissions } from '@/lib/hooks/useFirebase';

// Função para formatar moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

const CaixaModule = ({ userId }) => {
  const { dialogs, openDialog, closeDialog } = useContext(AppContext);
  
  // Hooks do Firebase
  const { data: caixaData, loading: caixaLoading, save: saveCaixa } = useCaixa();
  const { data: ordensVenda, save: saveOV } = useOV();
  const { data: financeiro } = useFinanceiro();
  const { canCreate, canEdit, canDelete } = usePermissions();
  
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, transacoes, historico
  const [editingTransacao, setEditingTransacao] = useState(null);
  
  // Estados para filtros
  const [filtroDataTransacoes, setFiltroDataTransacoes] = useState('');
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState('Todos');
  const [filtroOrigem, setFiltroOrigem] = useState('Todos');
  const [filtroDataHistorico, setFiltroDataHistorico] = useState('');
  const [filtroTipoHistorico, setFiltroTipoHistorico] = useState('Todos');
  const [pesquisaHistorico, setPesquisaHistorico] = useState('');
  
  // Estados para calculadora
  const [calculadoraOpen, setCalculadoraOpen] = useState(false);
  const [displayCalculadora, setDisplayCalculadora] = useState('0');
  const [operacaoCalculadora, setOperacaoCalculadora] = useState(null);
  const [valorAnteriorCalculadora, setValorAnteriorCalculadora] = useState(null);
  
  // Estados para visualizar transações do histórico
  const [transacoesHistoricoOpen, setTransacoesHistoricoOpen] = useState(false);
  const [caixaSelecionado, setCaixaSelecionado] = useState(null);
  const [searchTermHistorico, setSearchTermHistorico] = useState('');
  const [filtroOrigemHistorico, setFiltroOrigemHistorico] = useState('Todos');
  
  // Estado para visualização do histórico
  const [historicoViewMode, setHistoricoViewMode] = useState('lista'); // cards, lista
  
  // Estado para observações do histórico
  const [observacoesHistoricoOpen, setObservacoesHistoricoOpen] = useState(false);
  const [observacoesSelecionadas, setObservacoesSelecionadas] = useState('');
  
  // Estados para abertura/fechamento de caixa
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [valorInicial, setValorInicial] = useState('');
  const [observacoesAbertura, setObservacoesAbertura] = useState('');
  
  // Estados para fechamento de caixa
  const [valorInformadoFechamento, setValorInformadoFechamento] = useState('');
  const [observacoesFechamento, setObservacoesFechamento] = useState('');
  
  // Estados para vincular vendas
  const [vincularVendasOpen, setVincularVendasOpen] = useState(false);
  const [vendasSelecionadas, setVendasSelecionadas] = useState([]);
  const [vendasNaoVinculadas, setVendasNaoVinculadas] = useState([]);
  
  // Estados para transações
  const [formData, setFormData] = useState({
    tipo: 'entrada', // entrada, saida
    valor: '',
    descricao: '',
    formaPagamento: 'dinheiro', // dinheiro, cartao_debito, cartao_credito, pix, transferencia
    observacoes: ''
  });
  
  const { toast } = useToast();

  console.log('[CAIXA] ===== DADOS CARREGADOS =====');
  console.log('[CAIXA] Caixa:', caixaData);
  console.log('[CAIXA] Ordens de Venda:', ordensVenda);
  console.log('[CAIXA] Financeiro:', financeiro);

  // Verificar se há caixa aberto
  useEffect(() => {
    console.log('[CAIXA] Verificando estado do caixa...', caixaData);
    
    if (caixaData && caixaData.length > 0) {
      const caixaAtual = caixaData.find(c => c.status === 'aberto');
      const temCaixaAberto = !!caixaAtual;
      
      console.log('[CAIXA] Caixa encontrado:', caixaAtual);
      console.log('[CAIXA] Status atual do caixa:', temCaixaAberto);
      
      setCaixaAberto(temCaixaAberto);
    } else {
      // Se não há dados ou array vazio, garantir que caixaAberto seja false
      console.log('[CAIXA] Nenhum caixa encontrado, definindo como fechado');
      setCaixaAberto(false);
    }
  }, [caixaData]);

  // Calcular estatísticas do caixa
  const calcularEstatisticas = () => {
    if (!caixaData || caixaData.length === 0) return {
      totalVendas: 0,
      totalEntradas: 0,
      totalSaidas: 0,
      saldoAtual: 0,
      transacoesHoje: 0
    };

    const hoje = new Date().toISOString().split('T')[0];
    
    // Encontrar caixa aberto
    const caixaAberto = caixaData.find(caixa => caixa.status === 'aberto');
    
    // Se não há caixa aberto, zerar todas as estatísticas
    if (!caixaAberto) {
      return {
        totalVendas: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        saldoAtual: 0,
        valorInicial: 0,
        transacoesHoje: 0
      };
    }
    
    // Usar apenas transações do caixa aberto
    const transacoesCaixaAberto = caixaAberto.transacoes || [];
    
    // Filtrar transações de hoje do caixa aberto
    const transacoesHoje = transacoesCaixaAberto.filter(trans => 
      trans.data && trans.data.startsWith(hoje)
    );

    const totalVendas = transacoesHoje
      .filter(trans => trans.categoria === 'venda')
      .reduce((sum, trans) => sum + (parseFloat(trans.valor) || 0), 0);

    const totalEntradas = transacoesHoje
      .filter(trans => trans.tipo === 'entrada')
      .reduce((sum, trans) => sum + (parseFloat(trans.valor) || 0), 0);

    const totalSaidas = transacoesHoje
      .filter(trans => trans.tipo === 'saida')
      .reduce((sum, trans) => sum + (parseFloat(trans.valor) || 0), 0);

    const valorInicialCaixa = caixaAberto.valorInicial || 0;
    const saldoAtual = valorInicialCaixa + totalEntradas - totalSaidas;

    return {
      totalVendas,
      totalEntradas,
      totalSaidas,
      saldoAtual,
      valorInicial: valorInicialCaixa,
      transacoesHoje: transacoesHoje.length
    };
  };

  const stats = calcularEstatisticas();

  // Função para abrir caixa
  const handleAbrirCaixa = async () => {
    try {
      if (!valorInicial || parseFloat(valorInicial) < 0) {
        toast({
          title: "Erro",
          description: "Valor inicial deve ser maior ou igual a zero",
          variant: "destructive"
        });
        return;
      }

      const novoCaixa = {
        dataAbertura: new Date().toISOString(),
        valorInicial: parseFloat(valorInicial),
        observacoesAbertura: observacoesAbertura.trim(),
        status: 'aberto',
        transacoes: [],
        createdAt: new Date().toISOString(),
        userId: userId
      };

      await saveCaixa(novoCaixa);
      
      console.log('[CAIXA] ✅ Caixa aberto e salvo no Firebase');
      
      // Limpar formulário
      setValorInicial('');
      setObservacoesAbertura('');
      
      // O estado será atualizado automaticamente pelo useEffect quando caixaData mudar
      // Não precisamos forçar setCaixaAberto aqui
      
      toast({
        title: "Sucesso!",
        description: "Caixa aberto com sucesso"
      });
      
      closeDialog('caixa');
    } catch (error) {
      console.error('[CAIXA] ❌ Erro ao abrir caixa:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir caixa. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para fechar caixa
  const handleFecharCaixa = async () => {
    try {
      const caixaAtual = caixaData.find(c => c.status === 'aberto');
      if (!caixaAtual) return;

      if (!valorInformadoFechamento) {
        toast({
          title: "Erro",
          description: "Informe o valor encontrado no caixa",
          variant: "destructive"
        });
        return;
      }

      const valorEsperado = stats.saldoAtual;
      const valorInformado = parseFloat(valorInformadoFechamento);
      const diferenca = valorInformado - valorEsperado;

      const caixaFechado = {
        ...caixaAtual,
        dataFechamento: new Date().toISOString(),
        status: 'fechado',
        valorFinal: stats.saldoAtual,
        valorEsperado: valorEsperado,
        valorInformado: valorInformado,
        diferenca: diferenca,
        observacoesFechamento: observacoesFechamento.trim()
      };

      await saveCaixa(caixaFechado, caixaAtual.id);
      
      console.log('[CAIXA] ✅ Caixa fechado e salvo no Firebase');
      
      // Limpar formulários
      setValorInformadoFechamento('');
      setObservacoesFechamento('');
      setValorInicial('');
      setObservacoesAbertura('');
      
      // O estado será atualizado automaticamente pelo useEffect quando caixaData mudar
      // Não precisamos forçar setCaixaAberto aqui
      
      // Determinar tipo de mensagem baseado na diferença
      let mensagem = "Caixa fechado com sucesso.";
      
      if (diferenca !== 0) {
        mensagem += ` Diferença encontrada: R$ ${diferenca.toFixed(2)}. ${diferenca > 0 ? 'Sobra' : 'Falta'} registrada no histórico.`;
      } else {
        mensagem += " Valores conferem perfeitamente!";
      }
      
      toast({
        title: "Caixa Fechado!",
        description: mensagem
      });
      
      // Fechar o modal após sucesso
      closeDialog('fecharCaixa');
      
    } catch (error) {
      console.error('[CAIXA] ❌ Erro ao fechar caixa:', error);
      toast({
        title: "Erro",
        description: "Erro ao fechar caixa. Tente novamente.",
        variant: "destructive"
      });
      // Não fechar o modal em caso de erro
    }
  };

  // Função para adicionar transação
  const handleAdicionarTransacao = async () => {
    try {
      if (!formData.valor || !formData.descricao) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }

      const caixaAtual = caixaData.find(c => c.status === 'aberto');
      if (!caixaAtual) {
        toast({
          title: "Erro",
          description: "Nenhum caixa aberto encontrado",
          variant: "destructive"
        });
        return;
      }

      const novaTransacao = {
        ...formData,
        valor: parseFloat(formData.valor),
        data: new Date().toISOString(),
        caixaId: caixaAtual.id
      };

      // Adicionar transação ao caixa
      const caixaAtualizado = {
        ...caixaAtual,
        transacoes: [...(caixaAtual.transacoes || []), novaTransacao]
      };

      await saveCaixa(caixaAtualizado, caixaAtual.id);
      
      // Limpar formulário
      setFormData({
        tipo: 'entrada',
        valor: '',
        descricao: '',
        formaPagamento: 'dinheiro',
        observacoes: ''
      });
      
      toast({
        title: "Sucesso!",
        description: "Transação adicionada com sucesso"
      });
      
      closeDialog('transacao');
    } catch (error) {
      console.error('[CAIXA] ❌ Erro ao adicionar transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar transação. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para abrir diálogo
  const handleOpenDialog = (dialogName) => {
    openDialog(dialogName);
  };

  // Função para fechar diálogo
  const handleCloseDialog = () => {
    closeDialog('caixa');
    closeDialog('transacao');
    closeDialog('fecharCaixa');
  };

  // Filtrar transações (apenas do caixa aberto)
  const caixaAbertoParaTransacoes = caixaData?.find(caixa => caixa.status === 'aberto');
  const transacoesCaixaAberto = caixaAbertoParaTransacoes?.transacoes || [];
  const transacoesFiltradas = transacoesCaixaAberto.filter(trans => {
    const matchesSearch = trans.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trans.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || trans.tipo === statusFilter.toLowerCase();
    
    // Filtro por data
    if (filtroDataTransacoes) {
      const transDate = new Date(trans.data).toISOString().split('T')[0];
      const filterDate = filtroDataTransacoes;
      if (transDate !== filterDate) return false;
    }
    
    // Filtro por forma de pagamento
    if (filtroFormaPagamento !== 'Todos') {
      if (trans.formaPagamento !== filtroFormaPagamento) return false;
    }
    
    // Filtro por origem
    if (filtroOrigem !== 'Todos') {
      if (filtroOrigem === 'Vendas' && trans.categoria !== 'venda') return false;
      if (filtroOrigem === 'Serviços' && trans.categoria !== 'servico') return false;
      if (filtroOrigem === 'Outros' && (trans.categoria === 'venda' || trans.categoria === 'servico')) return false;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Filtrar histórico de caixas
  const caixasFechados = caixaData?.filter(caixa => caixa.status === 'fechado') || [];
  const historicoFiltrado = caixasFechados.filter(caixa => {
    // Filtro por data
    if (filtroDataHistorico) {
      const caixaDate = new Date(caixa.dataFechamento).toISOString().split('T')[0];
      const filterDate = filtroDataHistorico;
      if (caixaDate !== filterDate) return false;
    }
    
    // Filtro por tipo (diferença)
    if (filtroTipoHistorico !== 'Todos') {
      if (filtroTipoHistorico === 'Conferido' && caixa.diferenca !== 0) return false;
      if (filtroTipoHistorico === 'Divergente' && caixa.diferenca === 0) return false;
    }
    
    // Pesquisa
    if (pesquisaHistorico) {
      const searchLower = pesquisaHistorico.toLowerCase();
      const matchesObservacoes = caixa.observacoesFechamento?.toLowerCase().includes(searchLower);
      const matchesData = caixa.dataFechamento?.includes(searchLower);
      if (!matchesObservacoes && !matchesData) return false;
    }
    
    return true;
  });

  // Verificar permissões do usuário
  const { usuarioLogado } = useContext(AppContext);
  const podeVerValoresReais = usuarioLogado?.tipo === 'administrador';
  const podeAcessarHistorico = usuarioLogado?.tipo === 'administrador';

  // Função para buscar vendas não vinculadas ao caixa atual
  const buscarVendasNaoVinculadas = () => {
    console.log('=== BUSCANDO VENDAS NÃO VINCULADAS ===');
    console.log('ordensVenda:', ordensVenda);
    console.log('caixaAberto:', caixaAberto);
    console.log('caixaData:', caixaData);
    
    if (!ordensVenda || !caixaAberto) {
      console.log('Condições não atendidas - retornando array vazio');
      return [];
    }
    
    // Buscar o caixa atual (aberto)
    const caixaAtualAberto = caixaData?.find(caixa => caixa.status === 'aberto');
    if (!caixaAtualAberto) {
      console.log('Nenhum caixa aberto encontrado');
      return [];
    }
    
    console.log('Caixa aberto encontrado:', caixaAtualAberto);
    const caixaId = caixaAtualAberto.id;
    
    // Filtrar APENAS as OVs que NUNCA foram vinculadas a NENHUM caixa
    const vendasNaoVinculadas = ordensVenda.filter(ov => {
      const temCaixaId = ov.caixaId !== undefined && ov.caixaId !== null && ov.caixaId !== '';
      const temValor = parseFloat(ov.total || ov.valorTotal || 0) > 0;
      const statusConcluido = ov.status && (
        ov.status.toLowerCase() === 'concluido' || 
        ov.status.toLowerCase() === 'concluída' || 
        ov.status.toLowerCase() === 'finalizada'
      );
      
      // Verificar se a venda foi feita ANTES do caixa atual ser aberto
      let feitaAntesDoCaixa = false;
      if (ov.createdAt || ov.data || ov.dataVenda) {
        const dataVenda = new Date(ov.createdAt || ov.data || ov.dataVenda);
        const dataAberturaCaixa = new Date(caixaAtualAberto.dataAbertura);
        feitaAntesDoCaixa = dataVenda < dataAberturaCaixa;
      }
      
      console.log(`OV ${ov.numero}:`, {
        caixaId: ov.caixaId,
        temCaixaId,
        valor: ov.total || ov.valorTotal,
        temValor,
        status: ov.status,
        statusConcluido,
        dataVenda: ov.createdAt || ov.data || ov.dataVenda,
        dataAberturaCaixa: caixaAtualAberto.dataAbertura,
        feitaAntesDoCaixa,
        incluir: !temCaixaId && temValor && statusConcluido && feitaAntesDoCaixa
      });
      
      // Incluir APENAS vendas que:
      // 1. NÃO têm caixaId (undefined, null ou vazio - NUNCA foram vinculadas)
      // 2. Têm valor > 0
      // 3. Estão concluídas
      // 4. Foram feitas ANTES do caixa atual ser aberto
      return !temCaixaId && temValor && statusConcluido && feitaAntesDoCaixa;
    });
    
    console.log('Vendas não vinculadas encontradas:', vendasNaoVinculadas);
    console.log('Caixa atual:', caixaAtualAberto);
    return vendasNaoVinculadas;
  };

  // Função para abrir modal de vincular vendas
  const handleVincularVendas = () => {
    const vendas = buscarVendasNaoVinculadas();
    setVendasNaoVinculadas(vendas);
    setVendasSelecionadas([]);
    setVincularVendasOpen(true);
  };

  // Função para selecionar/deselecionar venda
  const toggleVendaSelecionada = (vendaId) => {
    setVendasSelecionadas(prev => {
      if (prev.includes(vendaId)) {
        return prev.filter(id => id !== vendaId);
      } else {
        return [...prev, vendaId];
      }
    });
  };

  // Função para vincular vendas selecionadas ao caixa
  const handleConfirmarVinculacao = async () => {
    if (vendasSelecionadas.length === 0) {
      toast({
        title: "Nenhuma venda selecionada",
        description: "Selecione pelo menos uma venda para vincular ao caixa.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Buscar o caixa atual (aberto)
      const caixaAtualAberto = caixaData?.find(caixa => caixa.status === 'aberto');
      if (!caixaAtualAberto) {
        toast({
          title: "Erro",
          description: "Nenhum caixa aberto encontrado.",
          variant: "destructive"
        });
        return;
      }

      let valorTotalVinculado = 0;

      // Atualizar cada OV selecionada e criar transações
      const novasTransacoes = [];
      
      for (const vendaId of vendasSelecionadas) {
        const venda = vendasNaoVinculadas.find(v => v.id === vendaId);
        if (venda) {
          console.log(`Vinculando OV ${venda.numero} ao caixa ${caixaAtualAberto.id}`);
          
          const vendaAtualizada = {
            ...venda,
            caixaId: caixaAtualAberto.id
          };
          
          console.log('Venda antes da atualização:', venda);
          console.log('Venda após atualização:', vendaAtualizada);
          
          const resultado = await saveOV(vendaAtualizada, vendaId);
          console.log('Resultado do save:', resultado);
          
          const valorVenda = parseFloat(venda.total || venda.valorTotal || 0);
          valorTotalVinculado += valorVenda;
          
          // Criar transação para a venda vinculada
          const transacaoVenda = {
            tipo: 'entrada',
            valor: valorVenda,
            descricao: `Venda Vinculada - OV ${venda.numero}`,
            categoria: 'venda',
            formaPagamento: venda.formaPagamento || 'dinheiro',
            data: new Date().toISOString(),
            observacoes: `Cliente: ${venda.cliente || venda.clienteNome || 'Não informado'}`,
            origem: 'Vendas',
            ovId: venda.id,
            ovNumero: venda.numero
          };
          
          novasTransacoes.push(transacaoVenda);
          console.log('Transação criada para venda:', transacaoVenda);
        }
      }

      // Atualizar saldo do caixa e adicionar transações
      console.log('Atualizando caixa com valor total:', valorTotalVinculado);
      console.log('Caixa antes da atualização:', caixaAtualAberto);
      console.log('Novas transações a serem adicionadas:', novasTransacoes);
      
      const caixaAtualizado = {
        ...caixaAtualAberto,
        saldoAtual: caixaAtualAberto.saldoAtual + valorTotalVinculado,
        totalEntradas: caixaAtualAberto.totalEntradas + valorTotalVinculado,
        transacoes: [...(caixaAtualAberto.transacoes || []), ...novasTransacoes]
      };

      console.log('Caixa após atualização:', caixaAtualizado);
      
      const resultadoCaixa = await saveCaixa(caixaAtualizado, caixaAtualAberto.id);
      console.log('Resultado do save do caixa:', resultadoCaixa);

      toast({
        title: "Vendas vinculadas com sucesso!",
        description: `${vendasSelecionadas.length} vendas foram vinculadas ao caixa. Valor total: ${formatCurrency(valorTotalVinculado)}`,
      });

      setVincularVendasOpen(false);
      setVendasSelecionadas([]);
      setVendasNaoVinculadas([]);
      
    } catch (error) {
      console.error('Erro ao vincular vendas:', error);
      toast({
        title: "Erro ao vincular vendas",
        description: "Ocorreu um erro ao vincular as vendas ao caixa.",
        variant: "destructive"
      });
    }
  };

  // Funções da calculadora
  const handleCalculadoraInput = (valor) => {
    if (displayCalculadora === '0') {
      setDisplayCalculadora(valor);
    } else {
      setDisplayCalculadora(displayCalculadora + valor);
    }
  };

  const handleCalculadoraOperacao = (op) => {
    setValorAnteriorCalculadora(parseFloat(displayCalculadora));
    setOperacaoCalculadora(op);
    setDisplayCalculadora('0');
  };

  const handleCalculadoraIgual = () => {
    const valorAtual = parseFloat(displayCalculadora);
    const valorAnterior = valorAnteriorCalculadora;
    
    if (operacaoCalculadora && valorAnterior !== null) {
      let resultado;
      switch (operacaoCalculadora) {
        case '+':
          resultado = valorAnterior + valorAtual;
          break;
        case '-':
          resultado = valorAnterior - valorAtual;
          break;
        case '*':
          resultado = valorAnterior * valorAtual;
          break;
        case '/':
          resultado = valorAnterior / valorAtual;
          break;
        default:
          return;
      }
      setDisplayCalculadora(resultado.toString());
      setOperacaoCalculadora(null);
      setValorAnteriorCalculadora(null);
    }
  };

  const handleCalculadoraLimpar = () => {
    setDisplayCalculadora('0');
    setOperacaoCalculadora(null);
    setValorAnteriorCalculadora(null);
  };

  const handleCalculadoraPonto = () => {
    if (!displayCalculadora.includes('.')) {
      setDisplayCalculadora(displayCalculadora + '.');
    }
  };

  const handleCalculadoraBackspace = () => {
    if (displayCalculadora.length > 1) {
      setDisplayCalculadora(displayCalculadora.slice(0, -1));
    } else {
      setDisplayCalculadora('0');
    }
  };

  // Função para abrir transações do histórico
  const handleVerTransacoesHistorico = (caixa) => {
    setCaixaSelecionado(caixa);
    setTransacoesHistoricoOpen(true);
  };

  // Função para abrir observações do histórico
  const handleVerObservacoesHistorico = (observacoes) => {
    setObservacoesSelecionadas(observacoes);
    setObservacoesHistoricoOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F111A]">
      {/* HEADER COM GRADIENTE */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white p-4 sm:p-6 rounded-2xl shadow-xl mx-2 sm:mx-4"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8" />
              Caixa
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">Gerencie o caixa e transações</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {!caixaAberto ? (
              <Button
                onClick={() => handleOpenDialog('caixa')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                Abrir Caixa
              </Button>
            ) : (
              <Button
                onClick={() => handleOpenDialog('fecharCaixa')}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-3"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Fechar Caixa
              </Button>
            )}
            
            <Button
              onClick={handleVincularVendas}
              disabled={!caixaAberto}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Link className="h-5 w-5 mr-2" />
              Vincular Vendas
            </Button>
            
            <Button
              onClick={() => handleOpenDialog('transacao')}
              disabled={!caixaAberto}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              Nova Transação
            </Button>
            
            <Button
              onClick={() => setCalculadoraOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-4 py-3"
            >
              <Calculator className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Mini Dashboard de Estatísticas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-4 mt-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Status do Caixa */}
          <Card className={`${caixaAberto ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'} shadow-lg hover:shadow-xl transition-all duration-200`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {caixaAberto ? 'Caixa Aberto' : 'Caixa Fechado'}
                  </p>
                  <p className={`text-2xl font-bold ${podeVerValoresReais ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600 line-through'}`}>
                    {podeVerValoresReais ? `R$ ${(stats.saldoAtual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ ***,***'}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${caixaAberto ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {caixaAberto ? (
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [1, 0.7, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </motion.div>
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total de Vendas */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Vendas Hoje</p>
                  <p className={`text-2xl font-bold ${podeVerValoresReais ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600 line-through'}`}>
                    {podeVerValoresReais ? `R$ ${(stats.totalVendas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ ***,***'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total de Entradas */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Entradas</p>
                  <p className={`text-2xl font-bold ${podeVerValoresReais ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600 line-through'}`}>
                    {podeVerValoresReais ? `R$ ${(stats.totalEntradas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ ***,***'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total de Saídas */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Saídas</p>
                  <p className={`text-2xl font-bold ${podeVerValoresReais ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600 line-through'}`}>
                    {podeVerValoresReais ? `R$ ${(stats.totalSaidas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ ***,***'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <Minus className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valor Inicial */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Valor Inicial</p>
                  <p className={`text-2xl font-bold ${podeVerValoresReais ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600 line-through'}`}>
                    {podeVerValoresReais ? `R$ ${(stats.valorInicial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ ***,***'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-4 mt-6"
      >
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="transacoes" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Transações</TabsTrigger>
            <TabsTrigger 
              value="historico" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
              disabled={!podeAcessarHistorico}
            >
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Resumo do Dia */}
              <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Resumo do Dia
                  </CardTitle>
                  <CardDescription>
                    Estatísticas de hoje
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Transações Hoje</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">
                            {stats.transacoesHoje}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                          <DollarSign className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ticket Médio</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">
                            {stats.transacoesHoje > 0 ? `R$ ${((stats.totalEntradas + stats.totalSaidas) / stats.transacoesHoje).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                          <Clock className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tempo Aberto</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">
                            {caixaAberto ? 'Ativo' : 'Fechado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formas de Pagamento */}
              <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                    <CardIcon className="h-5 w-5 text-emerald-600" />
                    Formas de Pagamento
                  </CardTitle>
                  <CardDescription>
                    Distribuição por tipo
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {(() => {
                      const formasPagamento = {};
                      transacoesFiltradas.forEach(trans => {
                        if (trans.formaPagamento) {
                          formasPagamento[trans.formaPagamento] = (formasPagamento[trans.formaPagamento] || 0) + 1;
                        }
                      });
                      
                      const formasArray = Object.entries(formasPagamento).map(([forma, count]) => ({
                        forma,
                        count,
                        valor: transacoesFiltradas
                          .filter(trans => trans.formaPagamento === forma)
                          .reduce((sum, trans) => sum + (trans.valor || 0), 0)
                      }));
                      
                      return formasArray.length > 0 ? formasArray.map((item, index) => (
                        <motion.div 
                          key={item.forma}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-600">
                              {item.forma === 'dinheiro' && <Banknote className="h-4 w-4 text-slate-600" />}
                              {item.forma === 'cartao_debito' && <CardIcon className="h-4 w-4 text-slate-600" />}
                              {item.forma === 'cartao_credito' && <CardIcon className="h-4 w-4 text-slate-600" />}
                              {item.forma === 'pix' && <Smartphone className="h-4 w-4 text-slate-600" />}
                              {item.forma === 'transferencia' && <Building2 className="h-4 w-4 text-slate-600" />}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {item.forma === 'dinheiro' && 'Dinheiro'}
                                {item.forma === 'cartao_debito' && 'Cartão Débito'}
                                {item.forma === 'cartao_credito' && 'Cartão Crédito'}
                                {item.forma === 'pix' && 'PIX'}
                                {item.forma === 'transferencia' && 'Transferência'}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {item.count} transação{item.count !== 1 ? 'ões' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900 dark:text-white">
                              R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="text-center py-8">
                          <CardIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">Nenhuma transação com forma de pagamento</p>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Status do Caixa */}
              <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                    <CheckCircle className="h-5 w-5 text-amber-600" />
                    Status do Caixa
                  </CardTitle>
                  <CardDescription>
                    Informações do caixa atual
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className="p-2 rounded-full bg-green-100 dark:bg-green-900/30"
                          animate={caixaAberto ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {caixaAberto ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </motion.div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</p>
                          <p className={`text-xl font-bold ${caixaAberto ? 'text-green-600' : 'text-red-600'}`}>
                            {caixaAberto ? 'Aberto' : 'Fechado'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {caixaAberto && (
                      <>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                              <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Aberto desde</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {caixaAbertoParaTransacoes ? new Date(caixaAbertoParaTransacoes.dataAbertura).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                              <DollarSign className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Valor Inicial</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">
                                R$ {(stats.valorInicial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ações Rápidas */}
              <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                    <Zap className="h-5 w-5 text-violet-600" />
                    Ações Rápidas
                  </CardTitle>
                  <CardDescription>
                    Operações frequentes
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleOpenDialog('transacao')}
                      disabled={!caixaAberto}
                      className="h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <div className="text-center">
                        <Plus className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">Nova Transação</span>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => setCalculadoraOpen(true)}
                      className="h-16 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <div className="text-center">
                        <Calculator className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">Calculadora</span>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => handleOpenDialog('fecharCaixa')}
                      disabled={!caixaAberto}
                      className="h-16 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <div className="text-center">
                        <XCircle className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">Fechar Caixa</span>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => setViewMode('transacoes')}
                      className="h-16 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <div className="text-center">
                        <Receipt className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">Ver Transações</span>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
        </TabsContent>

          {/* Transações */}
          <TabsContent value="transacoes" className="space-y-6 mt-6">
            {/* Filtros */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search" className="text-sm font-medium text-slate-700 dark:text-slate-300">Buscar</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Buscar por descrição ou observações..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="md:w-48">
                    <Label htmlFor="status" className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        <SelectItem value="Entrada">Entrada</SelectItem>
                        <SelectItem value="Saída">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:w-48">
                    <Label htmlFor="data" className="text-sm font-medium text-slate-700 dark:text-slate-300">Data</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        id="data"
                        type="date"
                        value={filtroDataTransacoes}
                        onChange={(e) => setFiltroDataTransacoes(e.target.value)}
                        className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="md:w-48">
                    <Label htmlFor="forma-pagamento" className="text-sm font-medium text-slate-700 dark:text-slate-300">Forma de Pagamento</Label>
                    <Select value={filtroFormaPagamento} onValueChange={setFiltroFormaPagamento}>
                      <SelectTrigger id="forma-pagamento" className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                        <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:w-48">
                    <Label htmlFor="origem" className="text-sm font-medium text-slate-700 dark:text-slate-300">Origem</Label>
                    <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
                      <SelectTrigger className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todas</SelectItem>
                        <SelectItem value="Vendas">🛒 Vendas</SelectItem>
                        <SelectItem value="Serviços">🔧 Serviços</SelectItem>
                        <SelectItem value="Outros">📝 Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Transações */}
            <div className="space-y-4">
              {transacoesFiltradas.map((trans, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.div 
                            className={`p-3 rounded-full ${trans.tipo === 'entrada' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            {trans.tipo === 'entrada' ? (
                              <ArrowUpRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 text-red-600" />
                            )}
                          </motion.div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                              {trans.descricao}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {new Date(trans.data).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {trans.formaPagamento && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <div className="flex items-center gap-1">
                                    {trans.formaPagamento === 'dinheiro' && <Banknote className="h-3 w-3 text-slate-400" />}
                                    {trans.formaPagamento === 'cartao_debito' && <CardIcon className="h-3 w-3 text-slate-400" />}
                                    {trans.formaPagamento === 'cartao_credito' && <CardIcon className="h-3 w-3 text-slate-400" />}
                                    {trans.formaPagamento === 'pix' && <Smartphone className="h-3 w-3 text-slate-400" />}
                                    {trans.formaPagamento === 'transferencia' && <Building2 className="h-3 w-3 text-slate-400" />}
                                    <span className="text-xs text-slate-500">
                                      {trans.formaPagamento === 'dinheiro' && 'Dinheiro'}
                                      {trans.formaPagamento === 'cartao_debito' && 'Débito'}
                                      {trans.formaPagamento === 'cartao_credito' && 'Crédito'}
                                      {trans.formaPagamento === 'pix' && 'PIX'}
                                      {trans.formaPagamento === 'transferencia' && 'Transferência'}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                            {trans.observacoes && (
                              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                {trans.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <motion.div 
                            className={`text-2xl font-bold ${trans.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {trans.tipo === 'entrada' ? '+' : '-'}R$ {(trans.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </motion.div>
                          <Badge 
                            variant="outline" 
                            className={`mt-2 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 ${trans.tipo === 'entrada' ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}`}
                          >
                            {trans.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            
              {transacoesFiltradas.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-12 text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Receipt className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        Nenhuma transação encontrada
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Comece adicionando transações ao caixa
                      </p>
                      <Button
                        onClick={() => handleOpenDialog('transacao')}
                        disabled={!caixaAberto}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Nova Transação
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
          </div>
        </TabsContent>

          {/* Histórico */}
          <TabsContent value="historico" className="space-y-6 mt-6">
            {!podeAcessarHistorico ? (
              <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Acesso Restrito
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Você não tem permissão para acessar o histórico do caixa. Apenas usuários com perfil financeiro ou administrador podem visualizar esta seção.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
            {/* Filtros do Histórico */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Filtros do Histórico
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="pesquisa-historico" className="text-sm font-medium text-slate-700 dark:text-slate-300">Pesquisar</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        id="pesquisa-historico"
                        placeholder="Observações, data..."
                        value={pesquisaHistorico}
                        onChange={(e) => setPesquisaHistorico(e.target.value)}
                        className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="data-historico" className="text-sm font-medium text-slate-700 dark:text-slate-300">Data</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        id="data-historico"
                        type="date"
                        value={filtroDataHistorico}
                        onChange={(e) => setFiltroDataHistorico(e.target.value)}
                        className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tipo-historico" className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</Label>
                    <Select value={filtroTipoHistorico} onValueChange={setFiltroTipoHistorico}>
                      <SelectTrigger className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        <SelectItem value="Conferido">Conferido</SelectItem>
                        <SelectItem value="Divergente">Divergente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        setPesquisaHistorico('');
                        setFiltroDataHistorico('');
                        setFiltroTipoHistorico('Todos');
                      }}
                      variant="outline"
                      className="w-full bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controles de Visualização */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Visualização:</span>
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                  <Button
                    variant={historicoViewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setHistoricoViewMode('cards')}
                    className={`px-3 py-1 h-8 ${historicoViewMode === 'cards' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={historicoViewMode === 'lista' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setHistoricoViewMode('lista')}
                    className={`px-3 py-1 h-8 ${historicoViewMode === 'lista' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {historicoFiltrado.length} caixa{historicoFiltrado.length !== 1 ? 's' : ''} encontrado{historicoFiltrado.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Lista do Histórico */}
            <div className={historicoViewMode === 'cards' ? 'space-y-4' : 'space-y-2'}>
              {historicoFiltrado.map((caixa, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {historicoViewMode === 'cards' ? (
                    <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <motion.div 
                              className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
                              whileHover={{ scale: 1.05, rotate: 2 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <CreditCard className="h-6 w-6 text-white" />
                            </motion.div>
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white text-xl">
                                Caixa #{index + 1}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                  Fechado em {new Date(caixa.dataFechamento).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={caixa.diferenca === 0 ? "default" : "destructive"}
                              className="mb-2 text-sm font-semibold px-3 py-1"
                            >
                              {caixa.diferenca === 0 ? '✓ Conferido' : '⚠ Divergente'}
                            </Badge>
                            {caixa.diferenca !== 0 && (
                              <p className="text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                Diferença: R$ {Math.abs(caixa.diferenca).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-600">
                          <div className="text-center p-4 bg-white dark:bg-slate-600 rounded-lg shadow-sm">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Valor Inicial</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              R$ {(caixa.valorInicial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          {podeVerValoresReais ? (
                            <div className="text-center p-4 bg-white dark:bg-slate-600 rounded-lg shadow-sm">
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Valor Esperado</p>
                              <p className="text-2xl font-bold text-blue-600">
                                R$ {(caixa.valorEsperado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          ) : (
                            <div className="text-center p-4 bg-white dark:bg-slate-600 rounded-lg shadow-sm">
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Valor Esperado</p>
                              <p className="text-2xl font-bold text-slate-400">
                                ***
                              </p>
                            </div>
                          )}
                          <div className="text-center p-4 bg-white dark:bg-slate-600 rounded-lg shadow-sm">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Valor Informado</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                              R$ {(caixa.valorInformado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        
                        {caixa.observacoesFechamento && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">📝 Observações:</p>
                            <p className="text-sm text-amber-800 dark:text-amber-200 italic leading-relaxed">
                              {caixa.observacoesFechamento}
                            </p>
                          </div>
                        )}
                        
                        {/* Botões de ação */}
                        <div className="mt-6 flex justify-end gap-3">
                          {caixa.observacoesFechamento && (
                            <Button
                              onClick={() => handleVerObservacoesHistorico(caixa.observacoesFechamento)}
                              variant="outline"
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Observações
                            </Button>
                          )}
                          <Button
                            onClick={() => handleVerTransacoesHistorico(caixa)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            Ver Transações ({caixa.transacoes?.length || 0})
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // Visualização em lista
                    <div className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-200 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <motion.div 
                            className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md group-hover:shadow-lg transition-all duration-200"
                            whileHover={{ scale: 1.05 }}
                          >
                            <CreditCard className="h-5 w-5 text-white" />
                          </motion.div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                              Caixa #{index + 1}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4 text-slate-500" />
                              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                {new Date(caixa.dataFechamento).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm min-w-[100px]">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Inicial</p>
                            <p className="font-bold text-slate-900 dark:text-white text-lg">
                              R$ {(caixa.valorInicial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          {podeVerValoresReais ? (
                            <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm min-w-[100px]">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Esperado</p>
                              <p className="font-bold text-blue-600 text-lg">
                                R$ {(caixa.valorEsperado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          ) : (
                            <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm min-w-[100px]">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Esperado</p>
                              <p className="font-bold text-slate-400 text-lg">***</p>
                            </div>
                          )}
                          <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm min-w-[100px]">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Informado</p>
                            <p className="font-bold text-slate-900 dark:text-white text-lg">
                              R$ {(caixa.valorInformado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <Badge 
                            variant={caixa.diferenca === 0 ? "default" : "destructive"}
                            className="px-3 py-1 font-semibold"
                          >
                            {caixa.diferenca === 0 ? '✓ Conferido' : '⚠ Divergente'}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {caixa.observacoesFechamento && (
                              <Button
                                onClick={() => handleVerObservacoesHistorico(caixa.observacoesFechamento)}
                                variant="outline"
                                size="sm"
                                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 p-2"
                                title="Ver observações"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => handleVerTransacoesHistorico(caixa)}
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Ver ({caixa.transacoes?.length || 0})
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {historicoFiltrado.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-12 text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        Nenhum histórico encontrado
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Nenhum caixa foi fechado ainda ou não há registros que correspondam aos filtros
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Dialog: Abrir Caixa */}
      <Dialog open={dialogs.caixa} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <DialogHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Plus className="h-6 w-6" />
              </motion.div>
              Abrir Caixa
            </DialogTitle>
            <DialogDescription className="text-green-100">
              Defina o valor inicial para abrir o caixa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="valorInicial" className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor Inicial (R$)</Label>
              <Input
                id="valorInicial"
                type="number"
                step="0.01"
                min="0"
                value={valorInicial}
                onChange={(e) => setValorInicial(e.target.value)}
                placeholder="0,00"
                className="mt-2 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            
            <div>
              <Label htmlFor="observacoes" className="text-sm font-medium text-slate-700 dark:text-slate-300">Observações (opcional)</Label>
              <Input
                id="observacoes"
                value={observacoesAbertura}
                onChange={(e) => setObservacoesAbertura(e.target.value)}
                placeholder="Observações sobre a abertura..."
                className="mt-2 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleCloseDialog} className="border-slate-300 dark:border-slate-600">
              Cancelar
            </Button>
            <Button onClick={handleAbrirCaixa} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              Abrir Caixa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nova Transação */}
      <Dialog open={dialogs.transacao} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <DollarSign className="h-6 w-6" />
              </motion.div>
              Nova Transação
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              Adicione uma nova entrada ou saída no caixa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData({...formData, valor: e.target.value})}
                placeholder="0,00"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descrição da movimentação..."
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
              <Select value={formData.formaPagamento} onValueChange={(value) => setFormData({...formData, formaPagamento: value})}>
                <SelectTrigger id="formaPagamento" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                  <SelectItem value="cartao_debito">💳 Cartão de Débito</SelectItem>
                  <SelectItem value="cartao_credito">💳 Cartão de Crédito</SelectItem>
                  <SelectItem value="pix">📱 PIX</SelectItem>
                  <SelectItem value="transferencia">🏦 Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Input
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações adicionais..."
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleCloseDialog} className="border-slate-300 dark:border-slate-600">
              Cancelar
            </Button>
            <Button onClick={handleAdicionarTransacao} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Calculadora */}
      <Dialog open={calculadoraOpen} onOpenChange={setCalculadoraOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-800 border-slate-700">
          <DialogHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Calculator className="h-6 w-6" />
              </motion.div>
              Calculadora
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Faça seus cálculos do caixa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Display */}
            <div className="p-4 bg-slate-700 dark:bg-slate-800 rounded-lg border-2 border-slate-600 dark:border-slate-600">
              <div className="text-right text-3xl font-mono font-bold text-white dark:text-white min-h-[2rem]">
                {displayCalculadora}
              </div>
            </div>
            
            {/* Botões */}
            <div className="grid grid-cols-4 gap-3">
              {/* Primeira linha */}
              <Button onClick={handleCalculadoraLimpar} variant="outline" className="col-span-2 bg-red-600 hover:bg-red-700 border-red-500 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:border-red-500">
                C
              </Button>
              <Button onClick={handleCalculadoraBackspace} variant="outline" className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                ⌫
              </Button>
              <Button onClick={() => handleCalculadoraOperacao('/')} variant="outline" className="bg-blue-600 hover:bg-blue-700 border-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:border-blue-500">
                ÷
              </Button>
              
              {/* Segunda linha */}
              <Button onClick={() => handleCalculadoraInput('7')} variant="outline" className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                7
              </Button>
              <Button onClick={() => handleCalculadoraInput('8')} variant="outline" className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                8
              </Button>
              <Button onClick={() => handleCalculadoraInput('9')} variant="outline" className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                9
              </Button>
              <Button onClick={() => handleCalculadoraOperacao('*')} variant="outline" className="bg-blue-600 hover:bg-blue-700 border-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:border-blue-500">
                ×
              </Button>
              
              {/* Terceira linha */}
              <Button onClick={() => handleCalculadoraInput('4')} variant="outline" className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                4
              </Button>
              <Button onClick={() => handleCalculadoraInput('5')} variant="outline" className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                5
              </Button>
              <Button onClick={() => handleCalculadoraInput('6')} variant="outline" className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                6
              </Button>
              <Button onClick={() => handleCalculadoraOperacao('-')} variant="outline" className="bg-blue-600 hover:bg-blue-700 border-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:border-blue-500">
                −
              </Button>
              
              {/* Quarta linha */}
              <Button onClick={() => handleCalculadoraInput('1')} variant="outline" className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                1
              </Button>
              <Button onClick={() => handleCalculadoraInput('2')} variant="outline" className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                2
              </Button>
              <Button onClick={() => handleCalculadoraInput('3')} variant="outline" className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                3
              </Button>
              <Button onClick={() => handleCalculadoraOperacao('+')} variant="outline" className="bg-blue-600 hover:bg-blue-700 border-blue-500 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:border-blue-500">
                +
              </Button>
              
              {/* Quinta linha */}
              <Button onClick={() => handleCalculadoraInput('0')} variant="outline" className="col-span-2 bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                0
              </Button>
              <Button onClick={handleCalculadoraPonto} variant="outline" className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
                .
              </Button>
              <Button onClick={handleCalculadoraIgual} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                =
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setCalculadoraOpen(false)} className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-slate-500">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Fechar Caixa */}
      <Dialog open={dialogs['fecharCaixa']} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <DialogHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <XCircle className="h-6 w-6" />
              </motion.div>
              Fechar Caixa
            </DialogTitle>
            <DialogDescription className="text-red-100">
              Confirme o valor encontrado no caixa para finalizar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Valor Esperado (apenas para admin/financeiro) */}
            {podeVerValoresReais && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Valor Esperado no Caixa</Label>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  R$ {(stats.saldoAtual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Valor calculado com base nas transações
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="valorInformado" className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor Encontrado no Caixa (R$)</Label>
              <Input
                id="valorInformado"
                type="number"
                step="0.01"
                min="0"
                value={valorInformadoFechamento}
                onChange={(e) => setValorInformadoFechamento(e.target.value)}
                placeholder="0,00"
                className="mt-2 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-red-500 focus:ring-red-500"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="observacoesFechamento" className="text-sm font-medium text-slate-700 dark:text-slate-300">Observações (opcional)</Label>
              <Input
                id="observacoesFechamento"
                value={observacoesFechamento}
                onChange={(e) => setObservacoesFechamento(e.target.value)}
                placeholder="Observações sobre o fechamento..."
                className="mt-2 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleCloseDialog} className="border-slate-300 dark:border-slate-600">
              Cancelar
            </Button>
            <Button onClick={handleFecharCaixa} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              Fechar Caixa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Transações do Histórico */}
      <Dialog open={transacoesHistoricoOpen} onOpenChange={setTransacoesHistoricoOpen}>
        <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Receipt className="h-6 w-6" />
              </motion.div>
              Transações do Caixa
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              {caixaSelecionado && (
                <>
                  Caixa fechado em {new Date(caixaSelecionado.dataFechamento).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {/* Filtros para transações do histórico */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search-historico" className="text-sm font-medium text-slate-700 dark:text-slate-300">Buscar</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    id="search-historico"
                    placeholder="Buscar por descrição ou observações..."
                    value={searchTermHistorico}
                    onChange={(e) => setSearchTermHistorico(e.target.value)}
                    className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="origem-historico" className="text-sm font-medium text-slate-700 dark:text-slate-300">Origem</Label>
                <Select value={filtroOrigemHistorico} onValueChange={setFiltroOrigemHistorico}>
                  <SelectTrigger className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todas</SelectItem>
                    <SelectItem value="Vendas">🛒 Vendas</SelectItem>
                    <SelectItem value="Serviços">🔧 Serviços</SelectItem>
                    <SelectItem value="Outros">📝 Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {(() => {
              // Filtrar transações do histórico
              const transacoesFiltradasHistorico = caixaSelecionado?.transacoes?.filter(trans => {
                const matchesSearch = trans.descricao?.toLowerCase().includes(searchTermHistorico.toLowerCase()) ||
                                     trans.observacoes?.toLowerCase().includes(searchTermHistorico.toLowerCase());
                
                // Filtro por origem
                if (filtroOrigemHistorico !== 'Todos') {
                  if (filtroOrigemHistorico === 'Vendas' && trans.categoria !== 'venda') return false;
                  if (filtroOrigemHistorico === 'Serviços' && trans.categoria !== 'servico') return false;
                  if (filtroOrigemHistorico === 'Outros' && (trans.categoria === 'venda' || trans.categoria === 'servico')) return false;
                }
                
                return matchesSearch;
              }) || [];

              return transacoesFiltradasHistorico.length > 0 ? (
                transacoesFiltradasHistorico.map((trans, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600"
                >
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`p-3 rounded-full ${trans.tipo === 'entrada' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {trans.tipo === 'entrada' ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      )}
                    </motion.div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {trans.descricao}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(trans.data).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {trans.formaPagamento && (
                          <>
                            <span className="text-slate-400">•</span>
                            <div className="flex items-center gap-1">
                              {trans.formaPagamento === 'dinheiro' && <Banknote className="h-3 w-3 text-slate-400" />}
                              {trans.formaPagamento === 'cartao_debito' && <CardIcon className="h-3 w-3 text-slate-400" />}
                              {trans.formaPagamento === 'cartao_credito' && <CardIcon className="h-3 w-3 text-slate-400" />}
                              {trans.formaPagamento === 'pix' && <Smartphone className="h-3 w-3 text-slate-400" />}
                              {trans.formaPagamento === 'transferencia' && <Building2 className="h-3 w-3 text-slate-400" />}
                              <span className="text-xs text-slate-500">
                                {trans.formaPagamento === 'dinheiro' && 'Dinheiro'}
                                {trans.formaPagamento === 'cartao_debito' && 'Débito'}
                                {trans.formaPagamento === 'cartao_credito' && 'Crédito'}
                                {trans.formaPagamento === 'pix' && 'PIX'}
                                {trans.formaPagamento === 'transferencia' && 'Transferência'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      {trans.observacoes && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 italic">
                          {trans.observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <motion.p 
                      className={`font-bold text-xl ${trans.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {trans.tipo === 'entrada' ? '+' : '-'}R$ {(trans.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </motion.p>
                    <Badge 
                      variant={trans.tipo === 'entrada' ? 'default' : 'destructive'} 
                      className="text-xs mt-1 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600"
                    >
                      {trans.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </Badge>
                  </div>
                </motion.div>
              ))
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {searchTermHistorico || filtroOrigemHistorico !== 'Todos' 
                      ? 'Nenhuma transação encontrada com os filtros selecionados' 
                      : 'Nenhuma transação encontrada neste caixa'
                    }
                  </p>
                </div>
              )
            })()}
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setTransacoesHistoricoOpen(false)} className="border-slate-300 dark:border-slate-600">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Observações do Histórico */}
      <Dialog open={observacoesHistoricoOpen} onOpenChange={setObservacoesHistoricoOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Eye className="h-6 w-6" />
              </motion.div>
              Observações do Caixa
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              Observações registradas no fechamento do caixa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Observações:</p>
              <p className="text-slate-900 dark:text-white italic leading-relaxed">
                {observacoesSelecionadas}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setObservacoesHistoricoOpen(false)} className="border-slate-300 dark:border-slate-600">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Vincular Vendas */}
      <Dialog open={vincularVendasOpen} onOpenChange={setVincularVendasOpen}>
        <DialogContent className="sm:max-w-4xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 max-h-[90vh] overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Link className="h-6 w-6" />
              </motion.div>
              Vincular Vendas ao Caixa
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              Selecione as vendas concluídas que ainda não foram vinculadas a nenhum caixa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {vendasNaoVinculadas.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                  Nenhuma venda não vinculada encontrada
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  Todas as vendas concluídas já estão vinculadas a algum caixa ou não há vendas para vincular.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {vendasNaoVinculadas.length} vendas encontradas • {vendasSelecionadas.length} selecionadas
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVendasSelecionadas(vendasNaoVinculadas.map(v => v.id))}
                      className="text-xs"
                    >
                      Selecionar Todas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVendasSelecionadas([])}
                      className="text-xs"
                    >
                      Limpar Seleção
                    </Button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                  {vendasNaoVinculadas.map((venda) => {
                    const isSelected = vendasSelecionadas.includes(venda.id);
                    const valor = parseFloat(venda.total || venda.valorTotal || 0);
                    
                    return (
                      <motion.div
                        key={venda.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                        onClick={() => toggleVendaSelecionada(venda.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                OV #{venda.numero}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {venda.cliente || venda.clienteNome || 'Cliente não informado'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500">
                                {new Date(venda.createdAt || venda.data || venda.dataVenda).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-green-600 dark:text-green-400">
                              {formatCurrency(valor)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {venda.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {venda.produtos && venda.produtos.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                              {venda.produtos.length} produto(s):
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {venda.produtos.slice(0, 3).map((produto, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {produto.nome || produto.produto} ({produto.quantidade || 1})
                                </Badge>
                              ))}
                              {venda.produtos.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{venda.produtos.length - 3} mais
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {vendasSelecionadas.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">
                          Resumo da Vinculação
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {vendasSelecionadas.length} vendas selecionadas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Valor total:
                        </p>
                        <p className="font-bold text-xl text-blue-900 dark:text-blue-100">
                          {formatCurrency(
                            vendasSelecionadas.reduce((total, vendaId) => {
                              const venda = vendasNaoVinculadas.find(v => v.id === vendaId);
                              return total + parseFloat(venda?.total || venda?.valorTotal || 0);
                            }, 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setVincularVendasOpen(false)} 
              className="border-slate-300 dark:border-slate-600"
            >
              Cancelar
            </Button>
            {vendasNaoVinculadas.length > 0 && (
              <Button 
                onClick={handleConfirmarVinculacao}
                disabled={vendasSelecionadas.length === 0}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Link className="h-4 w-4 mr-2" />
                Vincular {vendasSelecionadas.length} Vendas
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaixaModule;
