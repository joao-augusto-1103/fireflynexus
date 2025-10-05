import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, ShoppingCart, User, DollarSign, X, Minus, Package, Tag, Clock, Settings, CheckCircle, Eye, Calendar, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/App';
import { useClientes, useProdutos, useCategorias, useOV, useMovimentacoes, useCaixa, useFinanceiro, usePermissions } from '@/lib/hooks/useFirebase';
import { firebaseService } from '@/lib/firebaseService';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import CustomerAvatar from '@/components/ui/customer-avatar';

const OVModule = ({ userId }) => {
  const { dialogs, openDialog, closeDialog, setActiveModule } = useContext(AppContext);
  const { toast } = useToast();
  
  // Hooks do Firebase
  const { data: ordens, save: saveOV, remove: removeOV } = useOV();
  const { data: clientes, save: saveCliente } = useClientes();
  const { data: produtos, save: saveProduto } = useProdutos();
  const { data: categorias } = useCategorias();
  const { save: saveMovimentacao } = useMovimentacoes();
  const { data: caixaData, save: saveCaixa } = useCaixa();
  const { data: financeiro, save: saveFinanceiro } = useFinanceiro();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [searchTermOVs, setSearchTermOVs] = useState('');
  
  // Estados do carrinho de venda
  const [carrinho, setCarrinho] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [clienteDigitado, setClienteDigitado] = useState('');
  const [modoCliente, setModoCliente] = useState('selecionar'); // 'selecionar' ou 'digitar'
  
  // Estados para autocomplete de clientes
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [mostrarSugestoesCliente, setMostrarSugestoesCliente] = useState(false);
  
  // Estados para autocomplete de produtos no carrinho
  const [buscaProdutoCarrinho, setBuscaProdutoCarrinho] = useState('');
  const [produtosFiltradosCarrinho, setProdutosFiltradosCarrinho] = useState([]);
  const [mostrarSugestoesProduto, setMostrarSugestoesProduto] = useState(false);
  
  // Estados para confirmação de exclusão
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [ovToDelete, setOvToDelete] = useState(null);
  
  // Estados para modal de estoque insuficiente
  const [estoqueModalOpen, setEstoqueModalOpen] = useState(false);
  const [estoqueModalData, setEstoqueModalData] = useState({ 
    produto: '', 
    disponivel: 0, 
    solicitado: 0, 
    contexto: 'carrinho', // 'carrinho' ou 'manual'
    produtoId: null
  });

  // Função para abrir modal de estoque insuficiente
  const abrirModalEstoque = (produto, disponivel, solicitado, contexto = 'carrinho', produtoId = null) => {
    setEstoqueModalData({ produto, disponivel, solicitado, contexto, produtoId });
    setEstoqueModalOpen(true);
  };

  // Função para atualizar entrada financeira existente (OV)
  const updateExistingFinanceiroEntryOV = async (existingEntry, ov) => {
    try {
      // Determinar forma de pagamento (múltiplas formas ou única)
      const formasPagamentoDetalhadas = ov.formasPagamento && ov.formasPagamento.length > 0 
        ? ov.formasPagamento 
        : [{ tipo: ov.formaPagamento || 'dinheiro', valor: parseFloat(ov.total) }];
      
      // Forma de pagamento principal para compatibilidade
      const formaPagamentoPrincipal = formasPagamentoDetalhadas[0].tipo;

      // Determinar cliente
      const clienteNome = ov.cliente || ov.clienteNome || 'Cliente não informado';
      const clienteTelefone = ov.telefone || ov.clienteTelefone || '';
      const clienteId = ov.clienteId || '';

      // Criar entrada financeira atualizada (com ou sem parcelamento)
      const valorParcela = ov.parcelamento && ov.parcelamento.ativo && ov.parcelamento.parcelas > 1 
        ? parseFloat(ov.total) / ov.parcelamento.parcelas 
        : parseFloat(ov.total);

      const updatedEntry = {
        ...existingEntry,
        descricao: `Recebimento da OV: ${ov.numero}`,
        valor: parseFloat(ov.total),
        status: ov.parcelamento && ov.parcelamento.ativo && ov.parcelamento.parcelas > 1 ? 'Pendente' : 'Concluído',
        formaPagamento: formaPagamentoPrincipal,
        cliente: clienteNome,
        telefone: clienteTelefone,
        clienteId: clienteId,
        observacoes: `Ordem de Venda ${ov.numero} - ${clienteNome}${formasPagamentoDetalhadas.length > 1 ? ` - Pagamento: ${formasPagamentoDetalhadas.map(fp => `${fp.tipo} (R$ ${fp.valor.toFixed(2)})`).join(', ')}` : ''}`,
        parcelamento: ov.parcelamento && ov.parcelamento.ativo && ov.parcelamento.parcelas > 1 ? {
          ativo: true,
          parcelas: ov.parcelamento.parcelas,
          intervalo: ov.parcelamento.intervalo,
          valorParcela: valorParcela,
          parcelasGeradas: existingEntry.parcelamento?.parcelasGeradas || [],
          parcelasPagas: existingEntry.parcelamento?.parcelasPagas || 0
        } : {
          ativo: false,
          parcelas: 1,
          intervalo: 'mensal',
          valorParcela: parseFloat(ov.total),
          parcelasGeradas: [],
          parcelasPagas: 0
        },
        formasPagamento: formasPagamentoDetalhadas,
        updatedAt: new Date().toISOString()
      };
      
      await saveFinanceiro(updatedEntry, existingEntry.id);
      
    } catch (error) {
      console.error('[OV] ❌ Erro ao atualizar entrada financeira existente:', error);
      throw error;
    }
  };
  
  // Estados para autocomplete no modal de nova OV
  const [buscaProdutoModal, setBuscaProdutoModal] = useState({});
  const [produtosFiltradosModal, setProdutosFiltradosModal] = useState({});
  const [mostrarSugestoesProdutoModal, setMostrarSugestoesProdutoModal] = useState({});
  const [modalPagamento, setModalPagamento] = useState(false);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [desconto, setDesconto] = useState({ tipo: 'porcentagem', valor: 0 });
  const [parcelamento, setParcelamento] = useState({
    ativo: false,
    parcelas: 1,
    intervalo: 'mensal'
  });
  const [modalOVsDia, setModalOVsDia] = useState(false);
  const [ordenacaoOVs, setOrdenacaoOVs] = useState('recentes');
  
  // Estados do modal de visualização do produto
  const [modalProdutoOpen, setModalProdutoOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [imagemZoom, setImagemZoom] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Estados do modal de nova OV (mantido para compatibilidade)
  const [vendaProdutoOpen, setVendaProdutoOpen] = useState(false);
  const [editingOV, setEditingOV] = useState(null);
  const [formData, setFormData] = useState({
    clienteId: '',
    clienteNome: '',
    clienteTelefone: '',
    produtos: [{ produtoId: '', nome: '', preco: 0, quantidade: 1 }],
    status: 'Pendente',
    total: 0,
    formaPagamento: 'dinheiro',
    formasPagamento: [{ id: Date.now(), tipo: 'dinheiro', valor: 0, observacao: '' }]
  });

  // Logs para debug
  useEffect(() => {
  }, [clientes, produtos, categorias, ordens]);

  // Função para salvar OV no Firebase
  const salvarOV = async (ovData) => {
    try {
      
      
      const result = await saveOV(ovData);
      
      toast({
        title: "Sucesso!",
        description: "Ordem de Venda criada com sucesso!",
      });
    } catch (error) {
      console.error('[OV] Erro ao salvar OV:', error);
      toast({
        title: "Erro!",
        description: "Erro ao criar Ordem de Venda.",
        variant: "destructive",
      });
    }
  };

  // Função para abrir dialog de OV
  const handleOpenDialog = (ov = null) => {
    try {
      
      // Verificar permissões
      if (ov) {
        if (!canEdit('ov')) return;
      } else {
        if (!canCreate('ov')) return;
      }
      
      setEditingOV(ov);
      
      if (ov) {
        // Mapear dados da OV para o formato esperado pelo formulário
        const produtosFormatados = ov.produtos ? ov.produtos.map(item => ({
          produtoId: item.produtoId || item.codigo || '',
          nome: item.nome || item.produto || '',
          preco: item.preco || 0,
          quantidade: item.quantidade || 1,
          total: item.total || (item.preco * item.quantidade) || 0
        })) : (ov.itens ? ov.itens.map(item => ({
          produtoId: item.codigo || '',
          nome: item.produto || '',
          preco: item.preco || 0,
          quantidade: item.quantidade || 1,
          total: item.total || 0
        })) : [{ produtoId: '', nome: '', preco: 0, quantidade: 1 }]);
        
        setFormData({
          clienteId: ov.clienteId || '',
          clienteNome: ov.cliente || ov.clienteNome || '',
          clienteTelefone: ov.clienteTelefone || '',
          produtos: produtosFormatados,
          status: ov.status || 'Pendente',
          total: ov.total || 0,
          formaPagamento: ov.formaPagamento || 'dinheiro',
          formasPagamento: ov.formasPagamento || [{ id: Date.now(), tipo: ov.formaPagamento || 'dinheiro', valor: ov.total || 0, observacao: '' }],
          parcelamento: ov.parcelamento || { ativo: false, parcelas: 1, intervalo: 'mensal' }
        });
      } else {
        setFormData({
          clienteId: '',
          clienteNome: '',
          clienteTelefone: '',
          produtos: [{ produtoId: '', nome: '', preco: 0, quantidade: 1 }],
          status: 'Pendente',
          total: 0,
          formaPagamento: 'dinheiro',
          formasPagamento: [{ id: Date.now(), tipo: 'dinheiro', valor: 0, observacao: '' }],
          parcelamento: { ativo: false, parcelas: 1, intervalo: 'mensal' }
        });
      }
      
      openDialog('ov');
    } catch (error) {
      console.error('[OV] Erro ao abrir dialog:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir formulário de edição. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para fechar o dialog de OV
  const handleCloseDialog = () => {
    setEditingOV(null);
    // Limpar formData ao fechar
    setFormData({
      clienteId: '',
      clienteNome: '',
      clienteTelefone: '',
      produtos: [{ produtoId: '', nome: '', preco: 0, quantidade: 1 }],
      status: 'Pendente',
      total: 0,
      formaPagamento: 'dinheiro',
      formasPagamento: [{ id: Date.now(), tipo: 'dinheiro', valor: 0, observacao: '' }],
      parcelamento: { ativo: false, parcelas: 1, intervalo: 'mensal' }
    });
    closeDialog('ov');
  };

  const calculateTotal = (produtos) => {
    return produtos.reduce((sum, produto) => sum + (produto.preco * produto.quantidade), 0);
  };

  const handleProdutoChange = (index, field, value) => {
    const newProdutos = [...formData.produtos];
    
    if (field === 'produtoId') {
      const produto = produtos.find(p => p.id === value);
      if (produto) {
        newProdutos[index] = {
          ...newProdutos[index],
          produtoId: value,
          nome: produto.nome,
          preco: produto.preco
        };
      }
    } else if (field === 'quantidade') {
      const quantidade = parseInt(value) || 0;
      const produto = produtos.find(p => p.id === newProdutos[index].produtoId);
      
      // Validar estoque se o produto foi selecionado
      if (produto && quantidade > produto.quantidade) {
        abrirModalEstoque(produto.nome, produto.quantidade, quantidade, 'manual', produto.id);
        return; // Não permite a alteração
      }
      
      newProdutos[index][field] = quantidade;
    } else {
      newProdutos[index][field] = field === 'preco' ? parseFloat(value) || 0 : value;
    }
    
    const total = calculateTotal(newProdutos);
    setFormData({ ...formData, produtos: newProdutos, total });
  };

  const addProduto = () => {
    setFormData({
      ...formData,
      produtos: [...formData.produtos, { produtoId: '', nome: '', preco: 0, quantidade: 1 }]
    });
  };

  const removeProduto = (index) => {
    const newProdutos = formData.produtos.filter((_, i) => i !== index);
    const total = calculateTotal(newProdutos);
    setFormData({ ...formData, produtos: newProdutos, total });
  };

  const updateFinanceiro = async (ov, action) => {
    try {
      
      if (action === 'add' || action === 'update') {
        // Verificar se já existe uma entrada financeira para esta OV
        const existingEntry = financeiro.find(entry => entry.origemId === `ov-${ov.id}`);
        
        
        if (existingEntry && action === 'add') {
          return;
        }
        
        if (existingEntry && action === 'update') {
          // Atualizar entrada existente
          await updateExistingFinanceiroEntryOV(existingEntry, ov);
          return;
        }
        // Determinar forma de pagamento (múltiplas formas ou única)
        const formasPagamentoDetalhadas = ov.formasPagamento && ov.formasPagamento.length > 0 
          ? ov.formasPagamento 
          : [{ tipo: ov.formaPagamento || 'dinheiro', valor: parseFloat(ov.total) }];
        
        // Forma de pagamento principal para compatibilidade
        const formaPagamentoPrincipal = formasPagamentoDetalhadas[0].tipo;

        // Determinar cliente
        const clienteNome = ov.cliente || ov.clienteNome || 'Cliente não informado';
        const clienteTelefone = ov.telefone || ov.clienteTelefone || '';
        const clienteId = ov.clienteId || '';

        // Criar entrada financeira única (com ou sem parcelamento)
        const valorParcela = ov.parcelamento && ov.parcelamento.ativo && ov.parcelamento.parcelas > 1 
          ? parseFloat(ov.total) / ov.parcelamento.parcelas 
          : parseFloat(ov.total);

        const newEntry = {
          descricao: `Recebimento da OV: ${ov.numero}`,
          valor: parseFloat(ov.total),
          dataVencimento: new Date().toISOString().split('T')[0],
          tipo: 'receber',
          status: ov.parcelamento && ov.parcelamento.ativo && ov.parcelamento.parcelas > 1 ? 'Pendente' : 'Concluído',
          categoria: 'vendas',
          formaPagamento: formaPagamentoPrincipal,
          cliente: clienteNome,
          telefone: clienteTelefone,
          clienteId: clienteId,
          origemId: `ov-${ov.id}`,
          observacoes: `Ordem de Venda ${ov.numero} - ${clienteNome}${formasPagamentoDetalhadas.length > 1 ? ` - Pagamento: ${formasPagamentoDetalhadas.map(fp => `${fp.tipo} (R$ ${fp.valor.toFixed(2)})`).join(', ')}` : ''}`,
          parcelamento: ov.parcelamento && ov.parcelamento.ativo && ov.parcelamento.parcelas > 1 ? {
            ativo: true,
            parcelas: ov.parcelamento.parcelas,
            intervalo: ov.parcelamento.intervalo,
            valorParcela: valorParcela,
            parcelasGeradas: [],
            parcelasPagas: 0
          } : {
            ativo: false,
            parcelas: 1,
            intervalo: 'mensal',
            valorParcela: parseFloat(ov.total),
            parcelasGeradas: [],
            parcelasPagas: 0
          },
          formasPagamento: formasPagamentoDetalhadas,
          createdAt: new Date().toISOString()
        };
        
        await saveFinanceiro(newEntry);
        
      } else if (action === 'remove') {
        // Para remover, seria necessário implementar uma função específica no hook
      }
      
    } catch (error) {
      console.error('[OV] ❌ Erro ao atualizar financeiro:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar registro financeiro. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const updateCaixa = async (ov) => {
    try {
      
      // Verificar se há caixa aberto
      const caixaAberto = caixaData?.find(caixa => caixa.status === 'aberto');
      
      if (!caixaAberto) {
        return;
      }
      
      
      // Criar transação de entrada no caixa
      const novaTransacao = {
        id: Date.now(),
        tipo: 'entrada',
        descricao: `Venda OV #${ov.numero}`,
        valor: ov.total,
        data: new Date().toISOString(),
        observacoes: `Cliente: ${ov.clienteNome}`,
        formaPagamento: ov.formaPagamento || 'dinheiro',
        categoria: 'venda'
      };


      // Atualizar caixa com nova transação
      const caixaAtualizado = {
        ...caixaAberto,
        transacoes: [...(caixaAberto.transacoes || []), novaTransacao]
      };

      await saveCaixa(caixaAtualizado, caixaAberto.id);
      
    } catch (error) {
      console.error('[OV] ❌ Erro ao atualizar caixa:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar transação no caixa. Verifique se o caixa está aberto.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar dados obrigatórios
    if (!formData.clienteNome?.trim()) {
      toast({
        title: "Erro",
        description: "Nome do cliente é obrigatório!",
        variant: "destructive"
      });
      return;
    }

    if (formData.produtos.length === 0 || formData.produtos.some(p => !p.nome?.trim())) {
      toast({
        title: "Erro",
        description: "Pelo menos um produto é obrigatório!",
        variant: "destructive"
      });
      return;
    }

    // Variável para controlar se cliente foi cadastrado ou encontrado
    let clienteExistente = null;
    let clienteFoiCadastrado = false;

    // Preparar dados da OV
    let newOV = {
      numero: editingOV ? editingOV.numero : `OV${String(ordens.length + 1).padStart(4, '0')}`,
      ...formData,
      total: calculateTotal(formData.produtos),
      parcelamento: formData.parcelamento || { ativo: false, parcelas: 1, intervalo: 'mensal' },
      createdAt: editingOV ? editingOV.createdAt : new Date().toISOString()
    };

    // Se não está editando e tem cliente, verificar se precisa cadastrar
    
    if (!editingOV && formData.clienteNome.trim()) {
      // Buscar cliente existente
      clienteExistente = clientes.find(c => 
        c.nome.toLowerCase().includes(formData.clienteNome.toLowerCase()) ||
        (c.telefone && formData.clienteTelefone && c.telefone.includes(formData.clienteTelefone))
      );

      if (clienteExistente) {
        // Cliente encontrado, vincular
        newOV.clienteId = clienteExistente.id;
        newOV.clienteNome = clienteExistente.nome;
        newOV.clienteTelefone = clienteExistente.telefone || formData.clienteTelefone;
      } else {
        // Cliente não encontrado, cadastrar automaticamente
        try {
          const novoCliente = {
            nome: formData.clienteNome.trim(),
            telefone: formData.clienteTelefone.trim(),
            email: '',
            endereco: '',
            observacoes: 'Cadastrado automaticamente via ordem de venda',
            createdAt: new Date().toISOString()
          };
          
          const clienteSalvo = await saveCliente(novoCliente);
          
          newOV.clienteId = clienteSalvo.id || Date.now();
          newOV.clienteNome = formData.clienteNome.trim();
          newOV.clienteTelefone = formData.clienteTelefone.trim();
          clienteFoiCadastrado = true;
        } catch (error) {
          console.error('[OV] ❌ Erro ao cadastrar cliente:', error);
          // Mesmo com erro, salvar na OV sem cliente
          newOV.clienteId = '';
        }
      }
    }

    try {
      
      if (editingOV) {
        // Atualizar OV existente
        await saveOV(newOV, editingOV.id);
        toast({
          title: "Sucesso!",
          description: "OV atualizada com sucesso!"
        });
      } else {
        // Criar nova OV
        await saveOV(newOV);
        let description = "OV criada com sucesso!";
        
        // Adicionar informação sobre cliente se foi cadastrado
        if (newOV.clienteId && clienteFoiCadastrado) {
          description += ` Cliente "${newOV.clienteNome}" foi cadastrado automaticamente.`;
        } else if (newOV.clienteId && clienteExistente) {
          description += ` Cliente "${newOV.clienteNome}" vinculado da base.`;
        }
        
        toast({
          title: "Sucesso!",
          description: description
        });
      }

      // Atualizar financeiro baseado no status e se está editando
      if (newOV.status === 'Concluída') {
        if (editingOV) {
          // Se está editando uma OV existente, atualizar o registro financeiro
          await updateFinanceiro(newOV, 'update');
        } else {
          // Se é uma nova OV, criar registro financeiro
          await updateFinanceiro(newOV, 'add');
        }
        // Adicionar ao caixa se estiver aberto
        await updateCaixa(newOV);
      } else {
        await updateFinanceiro(newOV, 'remove');
      }

      handleCloseDialog();
    } catch (error) {
      console.error('[OV] Erro ao salvar OV:', error);
      toast({
        title: "Erro!",
        description: "Erro ao salvar OV.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (ov) => {
    // Verificar permissão de exclusão
    if (!canDelete('ov')) return;
    
    setOvToDelete(ov);
    setConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!ovToDelete) return;
    
    try {
      // Remover do financeiro se existir
      await updateFinanceiro(ovToDelete, 'remove');
      
      // Deletar do Firebase
      await removeOV(ovToDelete.id);
      
      toast({
        title: "Sucesso!",
        description: "OV removida com sucesso!"
      });
      
      setConfirmDeleteOpen(false);
      setOvToDelete(null);
      
    } catch (error) {
      console.error('❌ Erro ao excluir OV:', error);
      toast({
        title: "Erro!",
        description: "Erro ao excluir a OV. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // ---------- AUTОCOMPLETE ----------
  const handleBuscaCliente = (termo) => {
    setBuscaCliente(termo);
    if (termo.length > 0) {
      const filtrados = clientes.filter(c => 
        c.nome.toLowerCase().includes(termo.toLowerCase()) ||
        c.telefone.includes(termo) ||
        c.email?.toLowerCase().includes(termo.toLowerCase())
      );
      setClientesFiltrados(filtrados);
      setMostrarSugestoesCliente(true);
    } else {
      setClientesFiltrados([]);
      setMostrarSugestoesCliente(false);
    }
  };

  const selecionarCliente = (cliente) => {
    setClienteSelecionado(cliente);
    setBuscaCliente(cliente.nome);
    setMostrarSugestoesCliente(false);
  };

  const handleBuscaProdutoCarrinho = (termo) => {
    setBuscaProdutoCarrinho(termo);
    if (termo.length > 0) {
      const filtrados = produtos.filter(p => {
        const matchSearch = p.nome.toLowerCase().includes(termo.toLowerCase()) ||
                           p.codigo.toLowerCase().includes(termo.toLowerCase());
        const naoOculto = !p.oculto; // Excluir produtos ocultos
        
        // Verificar se a categoria do produto não está oculta
        const categoriaProduto = categorias.find(cat => cat.id === p.categoriaId);
        const categoriaNaoOculta = !categoriaProduto?.oculto;
        
        return matchSearch && naoOculto && categoriaNaoOculta;
      });
      setProdutosFiltradosCarrinho(filtrados);
      setMostrarSugestoesProduto(true);
    } else {
      setProdutosFiltradosCarrinho([]);
      setMostrarSugestoesProduto(false);
    }
  };

  const selecionarProdutoCarrinho = (produto) => {
    // Verificar se o produto já está no carrinho
    const produtoExistente = carrinho.find(item => item.id === produto.id);
    
    // Calcular a quantidade que seria adicionada
    const quantidadeAtual = produtoExistente ? produtoExistente.quantidade : 0;
    const novaQuantidade = quantidadeAtual + 1;
    
    // Verificar se há estoque suficiente
    if (novaQuantidade > produto.quantidade) {
      abrirModalEstoque(produto.nome, produto.quantidade, novaQuantidade, 'carrinho', produto.id);
      return;
    }
    
    if (produtoExistente) {
      // Se já existe, aumentar a quantidade
      setCarrinho(carrinho.map(item => 
        item.id === produto.id 
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      // Se não existe, adicionar ao carrinho
      setCarrinho([...carrinho, {
        id: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        quantidade: 1
      }]);
    }
    
    setBuscaProdutoCarrinho('');
    setProdutosFiltradosCarrinho([]);
    setMostrarSugestoesProduto(false);
    
    toast({
      title: "Produto adicionado!",
      description: `${produto.nome} foi adicionado ao carrinho`,
    });
  };

  // Funções para autocomplete no modal
  const handleBuscaProdutoModal = (index, termo) => {
    setBuscaProdutoModal(prev => ({ ...prev, [index]: termo }));
    if (termo.length > 0) {
      const filtrados = produtos.filter(p => {
        const matchSearch = p.nome.toLowerCase().includes(termo.toLowerCase()) ||
                           p.codigo.toLowerCase().includes(termo.toLowerCase());
        const naoOculto = !p.oculto; // Excluir produtos ocultos
        
        // Verificar se a categoria do produto não está oculta
        const categoriaProduto = categorias.find(cat => cat.id === p.categoriaId);
        const categoriaNaoOculta = !categoriaProduto?.oculto;
        
        return matchSearch && naoOculto && categoriaNaoOculta;
      });
      setProdutosFiltradosModal(prev => ({ ...prev, [index]: filtrados }));
      setMostrarSugestoesProdutoModal(prev => ({ ...prev, [index]: true }));
    } else {
      setProdutosFiltradosModal(prev => ({ ...prev, [index]: [] }));
      setMostrarSugestoesProdutoModal(prev => ({ ...prev, [index]: false }));
    }
  };

  const selecionarProdutoModal = (index, produto) => {
    handleProdutoChange(index, 'produtoId', produto.id);
    setBuscaProdutoModal(prev => ({ ...prev, [index]: produto.nome }));
    setMostrarSugestoesProdutoModal(prev => ({ ...prev, [index]: false }));
  };

  // Limpar busca quando mudar de modo
  useEffect(() => {
    if (modoCliente !== 'selecionar') {
      setBuscaCliente('');
      setClientesFiltrados([]);
      setMostrarSugestoesCliente(false);
    }
  }, [modoCliente]);

  // Limpar busca quando modal fechar
  useEffect(() => {
    if (!dialogs.ov) {
      setBuscaCliente('');
      setClientesFiltrados([]);
      setMostrarSugestoesCliente(false);
      setBuscaProdutoModal({});
      setProdutosFiltradosModal({});
      setMostrarSugestoesProdutoModal({});
    }
  }, [dialogs.ov]);

  const handleClienteSelect = (clienteId) => {
    const cliente = clientes.find(c => c.id.toString() === clienteId);
    if (cliente) {
      setFormData({
        ...formData,
        clienteId,
        clienteNome: cliente.nome
      });
    }
  };

  // ===== FUNÇÕES DO CARRINHO DE VENDA =====
  
  // Adicionar produto ao carrinho
  const adicionarAoCarrinho = (produto) => {
    const produtoExistente = carrinho.find(item => item.id === produto.id);
    
    if (produtoExistente) {
      setCarrinho(carrinho.map(item => 
        item.id === produto.id 
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
    }
    
    toast({
      title: "Produto adicionado!",
      description: `${produto.nome} foi adicionado ao carrinho`
    });
  };

  // Remover produto do carrinho
  const removerDoCarrinho = (produtoId) => {
    setCarrinho(carrinho.filter(item => item.id !== produtoId));
    toast({
      title: "Produto removido!",
      description: "Produto removido do carrinho"
    });
  };

  // Abrir modal de visualização do produto
  const abrirModalProduto = (produto) => {
    // Buscar a categoria do produto
    const categoriaProduto = categorias.find(cat => cat.id === produto.categoriaId);
    const produtoComCategoria = {
      ...produto,
      categoriaNome: categoriaProduto?.nome || 'Sem categoria'
    };
    
    setProdutoSelecionado(produtoComCategoria);
    setModalProdutoOpen(true);
    setImagemZoom(false);
  };

  // Fechar modal de visualização do produto
  const fecharModalProduto = () => {
    setModalProdutoOpen(false);
    setProdutoSelecionado(null);
    setImagemZoom(false);
    setMousePosition({ x: 0, y: 0 });
  };

  // Função para lidar com o movimento do mouse na imagem (otimizada)
  const handleMouseMove = (e) => {
    if (!imagemZoom) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Usar requestAnimationFrame para melhor performance
    requestAnimationFrame(() => {
      setMousePosition({ 
        x: Math.max(0, Math.min(100, x)), 
        y: Math.max(0, Math.min(100, y)) 
      });
    });
  };

  // Alterar quantidade no carrinho
  const alterarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
      return;
    }
    
    // Encontrar o produto no estoque para validar
    const produtoEstoque = produtos.find(p => p.id === produtoId);
    const itemCarrinho = carrinho.find(item => item.id === produtoId);
    
    // Verificar se há estoque suficiente
    if (produtoEstoque && novaQuantidade > produtoEstoque.quantidade) {
      abrirModalEstoque(itemCarrinho?.nome || produtoEstoque.nome, produtoEstoque.quantidade, novaQuantidade, 'carrinho', produtoId);
      return; // Não permite a alteração
    }
    
    setCarrinho(carrinho.map(item => 
      item.id === produtoId 
        ? { ...item, quantidade: novaQuantidade }
        : item
    ));
  };

  // Calcular total do carrinho
  const calcularTotalCarrinho = () => {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };

  // Finalizar venda
  const finalizarVenda = () => {
    if (carrinho.length === 0) {
      toast({
        title: "Carrinho vazio!",
        description: "Adicione produtos ao carrinho antes de finalizar",
        variant: "destructive"
      });
      return;
    }

    if (!clienteSelecionado) {
      toast({
        title: "Cliente não informado!",
        description: "Selecione um cliente antes de finalizar",
        variant: "destructive"
      });
      return;
    }

    // Abrir modal de pagamento
    setModalPagamento(true);
  };

  // Cancelar venda
  const cancelarVenda = () => {
    setCarrinho([]);
    setClienteSelecionado(null);
    setClienteDigitado('');
    setModoCliente('selecionar');
    setFormasPagamento([]);
    setDesconto({ tipo: 'porcentagem', valor: 0 });
    setParcelamento({ ativo: false, parcelas: 1, intervalo: 'mensal' });
    toast({
      title: "Venda cancelada",
      description: "Carrinho limpo"
    });
  };

  // ===== FUNÇÕES DE PAGAMENTO =====
  
  // Adicionar forma de pagamento
  const adicionarFormaPagamento = () => {
    const totalComDesconto = calcularTotalComDesconto();
    const totalPago = formasPagamento.reduce((sum, fp) => sum + fp.valor, 0);
    const valorRestante = totalComDesconto - totalPago;
    
    // Auto-preenchimento inteligente: se for a primeira forma de pagamento, usar o valor total
    const valorInicial = formasPagamento.length === 0 ? totalComDesconto : (valorRestante > 0 ? valorRestante : 0);
    
    setFormasPagamento([...formasPagamento, { 
      id: Date.now(), 
      tipo: 'dinheiro', 
      valor: valorInicial, 
      observacao: '' 
    }]);
  };

  // Remover forma de pagamento
  const removerFormaPagamento = (id) => {
    setFormasPagamento(formasPagamento.filter(fp => fp.id !== id));
  };

  // Atualizar forma de pagamento
  const atualizarFormaPagamento = (id, campo, valor) => {
    setFormasPagamento(formasPagamento.map(fp => 
      fp.id === id ? { ...fp, [campo]: valor } : fp
    ));
  };

  // Calcular valor restante para uma forma de pagamento específica
  const calcularValorRestante = (formaId) => {
    const totalComDesconto = calcularTotalComDesconto();
    const totalPago = formasPagamento.reduce((sum, fp) => sum + (fp.id === formaId ? 0 : fp.valor), 0);
    return Math.max(0, totalComDesconto - totalPago);
  };

  // Calcular total com desconto
  const calcularTotalComDesconto = () => {
    const totalOriginal = calcularTotalCarrinho();
    if (desconto.tipo === 'porcentagem') {
      return totalOriginal * (1 - desconto.valor / 100);
    } else {
      return Math.max(0, totalOriginal - desconto.valor);
    }
  };

  // Calcular total das formas de pagamento
  const calcularTotalPagamentos = () => {
    return formasPagamento.reduce((total, fp) => total + fp.valor, 0);
  };

  // Validar status do pagamento
  const validarPagamento = () => {
    const totalComDesconto = calcularTotalComDesconto();
    const totalPago = calcularTotalPagamentos();
    const diferenca = totalPago - totalComDesconto;
    
    if (totalPago === 0) {
      return { status: 'vazio', mensagem: 'Adicione uma forma de pagamento', cor: 'text-slate-500' };
    } else if (totalPago < totalComDesconto) {
      return { 
        status: 'incompleto', 
        mensagem: `Faltam R$ ${(totalComDesconto - totalPago).toFixed(2)}`, 
        cor: 'text-red-500' 
      };
    } else if (diferenca === 0) {
      return { 
        status: 'completo', 
        mensagem: 'Pagamento completo!', 
        cor: 'text-green-500' 
      };
    } else {
      return { 
        status: 'troco', 
        mensagem: `Troco: R$ ${diferenca.toFixed(2)}`, 
        cor: 'text-blue-500' 
      };
    }
  };

  // Função para dar baixa no estoque
  const darBaixaEstoque = async (produtosVendidos) => {
    try {
      
      for (const item of produtosVendidos) {
        // Encontrar o produto no estoque
        const produtoEstoque = produtos.find(p => p.id === item.id);
        
        if (produtoEstoque) {
          // Calcular nova quantidade
          const novaQuantidade = produtoEstoque.quantidade - item.quantidade;
          
          // Atualizar produto no estoque
          await saveProduto({
            ...produtoEstoque,
            quantidade: novaQuantidade
          }, produtoEstoque.id);
          
          // Criar movimentação de saída
          await saveMovimentacao({
            produtoId: item.id,
            produto: item.nome,
            tipo: 'saida',
            quantidade: item.quantidade,
            observacao: `Venda - OV ${ordens.length + 1}`,
            data: new Date().toISOString(),
            usuario: 'Sistema',
            createdAt: new Date().toISOString()
          });
          
        }
      }
      
      toast({
        title: "Estoque atualizado!",
        description: "Baixa realizada com sucesso no estoque",
      });
      
    } catch (error) {
      console.error('❌ Erro ao dar baixa no estoque:', error);
      toast({
        title: "Erro no estoque!",
        description: "Erro ao atualizar o estoque. Verifique manualmente.",
        variant: "destructive"
      });
    }
  };

  // Finalizar pagamento
  const finalizarPagamento = async () => {
    const totalComDesconto = calcularTotalComDesconto();
    const totalPagamentos = calcularTotalPagamentos();
    
    if (totalPagamentos < totalComDesconto) {
      toast({
        title: "Valor insuficiente!",
        description: `Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalComDesconto)} | Pago: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPagamentos)}`,
        variant: "destructive"
      });
      return;
    }

    // VALIDAÇÃO CRÍTICA: Verificar se cliente foi selecionado
    if (!clienteSelecionado?.nome) {
      toast({
        title: "Cliente necessário!",
        description: "Selecione um cliente antes de finalizar a venda",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // PRÉ-CADASTRO CENTRALIZADO OBRIGATÓRIO via finalizarPagamento
      let clienteResult = clienteSelecionado;
      
      if (!clienteSelecionado.id) {
        
        const customerData = {
          nome: clienteSelecionado.nome.trim(),
          telefone: clienteSelecionado.telefone?.trim() || '',
          email: '',
          endereco: ''
        };

        // Usar função centralizada que controla concorrência
        clienteResult = await firebaseService.createCustomerIfNotExists(customerData, 'ordem_venda');
      }
      
      
      const novaOV = {
        numero: `OV${String(ordens.length + 1).padStart(4, '0')}`,
        clienteId: clienteResult.id || clienteSelecionado.id,
        clienteNome: clienteResult.nome || clienteSelecionado.nome,
        clienteTelefone: clienteResult.telefone || clienteSelecionado.telefone || '',
        produtos: carrinho.map(item => ({
          produtoId: item.id,
          nome: item.nome,
          preco: item.preco,
          quantidade: item.quantidade
        })),
        status: 'Concluída',
        total: totalComDesconto,
        desconto: desconto,
        formasPagamento: formasPagamento,
        parcelamento: parcelamento,
        troco: totalPagamentos - totalComDesconto,
        createdAt: new Date().toISOString(),
        _source: 'finalizarPagamento_carrinho' // CONTROLE DE ORIGEM
      };
      

      // Salvar no Firebase
      await salvarOV(novaOV);
      
      // Dar baixa no estoque
      await darBaixaEstoque(carrinho);
      
      // Atualizar financeiro (se necessário)
      await updateFinanceiro(novaOV, 'add');
      
      // Adicionar ao caixa se estiver aberto
      await updateCaixa(novaOV);

      // Limpar tudo
      setCarrinho([]);
      setClienteSelecionado(null);
      setClienteDigitado('');
      setModoCliente('selecionar');
      setFormasPagamento([]);
      setParcelamento({ ativo: false, parcelas: 1, intervalo: 'mensal' });
      setDesconto({ tipo: 'porcentagem', valor: 0 });
      setModalPagamento(false);

      toast({
        title: "Venda finalizada!",
        description: `OV criada com sucesso. Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalComDesconto)}. Estoque atualizado.`
      });
    } catch (error) {
      console.error('[OV] Erro ao finalizar pagamento:', error);
      toast({
        title: "Erro!",
        description: "Erro ao finalizar a venda.",
        variant: "destructive"
      });
    }
  };

  // Filtrar produtos por categoria e busca (excluindo produtos e categorias ocultos)
  const produtosFiltrados = produtos.filter(produto => {
    const matchSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       produto.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaFiltro === 'todas' || produto.categoriaId === categoriaFiltro;
    const naoOculto = !produto.oculto; // Excluir produtos ocultos
    
    // Verificar se a categoria do produto não está oculta
    const categoriaProduto = categorias.find(cat => cat.id === produto.categoriaId);
    const categoriaNaoOculta = !categoriaProduto?.oculto;
    
    return matchSearch && matchCategoria && naoOculto && categoriaNaoOculta;
  });

  // Ordenar categorias pela ordem personalizada (mesma lógica do estoque)
  const categoriasOrdenadas = [...categorias]
    .filter(cat => !cat.oculto) // Excluir categorias ocultas
    .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999)); // Ordenar por ordem

  // Filtrar OVs do dia atual
  const hoje = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const ordensDoDia = (ordens || []).filter(ov => {
    const dataOV = ov.createdAt?.toDate ? ov.createdAt.toDate().toISOString().slice(0, 10) : ov.createdAt?.slice(0, 10);
    return dataOV === hoje;
  }).sort((a, b) => {
    const dataA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dataB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    
    if (ordenacaoOVs === 'recentes') {
      return dataB - dataA; // Mais recentes primeiro
    } else {
      return dataA - dataB; // Mais antigas primeiro
    }
  });
  
  // Estatísticas para o dashboard
  const statsOV = {
    total: ordens?.length || 0,
    pendentes: ordens?.filter(o => o.status === 'Pendente').length || 0,
    processando: ordens?.filter(o => o.status === 'Processando').length || 0,
    concluidas: ordens?.filter(o => o.status === 'Concluída').length || 0,
    valorTotal: ordens?.reduce((acc, o) => acc + (o.total || 0), 0) || 0,
    hoje: ordensDoDia.length
  };
  
  const filteredOrdens = ordensDoDia.filter(ov =>
    (ov.clienteNome || '').toLowerCase().includes(searchTermOVs.toLowerCase()) ||
    (ov.numero || '').toLowerCase().includes(searchTermOVs.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Processando': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Concluída': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
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
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8" />
              Ordens de Venda
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">Catálogo de produtos e carrinho de vendas</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={dialogs.ov} onOpenChange={handleCloseDialog}>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-3">
                <Plus className="h-5 w-5 mr-2" />
                Nova OV Manual
              </Button>
            <DialogContent className="sm:max-w-2xl w-full max-w-[95vw] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 scrollbar-hide">
              <DialogHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ShoppingCart className="h-6 w-6" />
                  </motion.div>
                  {editingOV ? 'Editar Ordem de Venda' : 'Nova Ordem de Venda'}
                </DialogTitle>
                <p className="text-orange-100 mt-2">
                  {editingOV ? 'Atualize as informações da ordem de venda' : 'Cadastre uma nova ordem de venda para seus clientes'}
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seção: Informações do Cliente */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl p-6 border border-blue-200 dark:border-slate-600">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Informações do Cliente</h3>
                  </div>
                  
                  {/* Busca dinâmica de clientes */}
                  <div className="mb-4 relative">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Buscar Cliente Existente</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={buscaCliente}
                        onChange={(e) => handleBuscaCliente(e.target.value)}
                        placeholder="Digite o nome ou telefone do cliente..."
                        className="mt-1 pl-10 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                      />
                        
                      {/* Sugestões de clientes */}
                      {mostrarSugestoesCliente && clientesFiltrados.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto scrollbar-hide">
                          {clientesFiltrados.map(cliente => (
                            <button
                              key={cliente.id}
                              type="button"
                              onClick={() => {
                                setFormData({ 
                                  ...formData, 
                                  clienteId: cliente.id.toString(), 
                                  clienteNome: cliente.nome,
                                  clienteTelefone: cliente.telefone || ''
                                });
                                setBuscaCliente(cliente.nome);
                                setMostrarSugestoesCliente(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-600 last:border-b-0"
                            >
                            <div className="flex items-center justify-between">
                              <CustomerAvatar 
                                customer={cliente} 
                                size="sm" 
                                showName={true} 
                                showPhone={true}
                              />
                            </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="clienteNome" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Cliente *</Label>
                      <Input 
                        id="clienteNome" 
                        value={formData.clienteNome} 
                        onChange={(e) => setFormData({...formData, clienteNome: e.target.value})} 
                        placeholder="Nome completo do cliente" 
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                        required 
                      />
                      {formData.clienteId && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✓ Cliente selecionado da base
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="clienteTelefone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone do Cliente *</Label>
                      <Input 
                        id="clienteTelefone" 
                        value={formData.clienteTelefone || ''} 
                        onChange={(e) => setFormData({...formData, clienteTelefone: e.target.value})} 
                        placeholder="(11) 99999-9999" 
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                        required 
                      />
                    </div>
                  </div>

                </div>
                  
                {/* Seção: Detalhes dos Produtos */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl p-6 border border-green-200 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Detalhes dos Produtos</h3>
                    </div>
                    <Button type="button" onClick={addProduto} className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Produto
                    </Button>
                  </div>
                  
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-hide">
                    {formData.produtos.map((produto, index) => (
                      <div key={index} className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-slate-900 dark:text-white">Produto {index + 1}</h4>
                          {formData.produtos.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeProduto(index)} 
                              className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Campo de busca de produto - separado */}
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Produto Cadastrado</Label>
                          <div className="relative mt-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              value={buscaProdutoModal[index] || ''}
                              onChange={(e) => handleBuscaProdutoModal(index, e.target.value)}
                              placeholder="Buscar produto..."
                              className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                            />
                            
                            {/* Dropdown de sugestões */}
                            {mostrarSugestoesProdutoModal[index] && produtosFiltradosModal[index]?.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto max-w-full scrollbar-hide">
                                {produtosFiltradosModal[index].map(produtoItem => (
                                  <div
                                    key={produtoItem.id}
                                    onClick={() => selecionarProdutoModal(index, produtoItem)}
                                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-600 last:border-b-0"
                                  >
                                    <div className="flex items-center gap-3">
                                      {produtoItem.imagem && (
                                        <img
                                          src={produtoItem.imagem}
                                          alt={produtoItem.nome}
                                          className="w-8 h-8 object-cover rounded border"
                                        />
                                      )}
                                      <div className="flex-1">
                                        <p className="font-medium text-slate-900 dark:text-white">{produtoItem.nome}</p>
                                        <p className="text-xs text-slate-500">
                                          Código: {produtoItem.codigo} | Estoque: {produtoItem.quantidade} | {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produtoItem.preco)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            💡 Busque por nome ou código
                          </p>
                          {produtos.length === 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                              ⚠️ Cadastre produtos no módulo Estoque primeiro
                            </p>
                          )}
                        </div>

                        {/* Campos principais do produto - em linha */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Produto</Label>
                            <Input 
                              value={produto.nome} 
                              onChange={(e) => handleProdutoChange(index, 'nome', e.target.value)} 
                              placeholder="Nome do produto" 
                              className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Preço Unitário</Label>
                            <Input 
                              type="number" 
                              step="0.01" 
                              value={produto.preco} 
                              onChange={(e) => handleProdutoChange(index, 'preco', e.target.value)} 
                              placeholder="0.00" 
                              className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quantidade</Label>
                            <Input 
                              type="number" 
                              min="1" 
                              value={produto.quantidade} 
                              onChange={(e) => handleProdutoChange(index, 'quantidade', e.target.value)} 
                              className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                            />
                        </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Subtotal:</span>
                            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco * produto.quantidade)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seção: Status e Total */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl p-6 border border-purple-200 dark:border-slate-600">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Status e Total</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status" className="text-sm font-medium text-slate-700 dark:text-slate-300">Status da OV</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger id="status" className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendente">🟡 Pendente</SelectItem>
                          <SelectItem value="Processando">🟠 Processando</SelectItem>
                          <SelectItem value="Concluída">🟢 Concluída</SelectItem>
                          <SelectItem value="Cancelada">🔴 Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Sistema de Múltiplas Formas de Pagamento */}
                    <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-800/30 dark:via-slate-700/30 dark:to-slate-600/30 rounded-xl p-4 border border-green-200 dark:border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Formas de Pagamento</h3>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const total = calculateTotal(formData.produtos);
                            const totalPago = (formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0);
                            const valorRestante = total - totalPago;
                            const valorInicial = (formData.formasPagamento || []).length === 0 ? total : (valorRestante > 0 ? valorRestante : 0);
                            
                            setFormData({
                              ...formData,
                              formasPagamento: [...(formData.formasPagamento || []), { 
                                id: Date.now(), 
                                tipo: 'dinheiro', 
                                valor: valorInicial, 
                                observacao: '' 
                              }]
                            });
                          }}
                          className="h-7 px-2 text-xs"
                          disabled={(formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0) >= calculateTotal(formData.produtos)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      
                      {/* Indicador de Valor Restante */}
                      {(() => {
                        const total = calculateTotal(formData.produtos);
                        const totalPago = (formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0);
                        const valorRestante = total - totalPago;
                        
                        if (valorRestante > 0) {
                          return (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                    Valor Restante
                                  </span>
                                </div>
                                <span className="text-lg font-bold text-amber-900 dark:text-amber-100">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorRestante)}
                                </span>
                              </div>
                            </div>
                          );
                        } else if (totalPago > total) {
                          return (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    Troco
                                  </span>
                                </div>
                                <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPago - total)}
                                </span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Pagamento Completo
                                  </span>
                                </div>
                                <span className="text-lg font-bold text-green-900 dark:text-green-100">
                                  ✓
                                </span>
                              </div>
                            </div>
                          );
                        }
                      })()}
                      
                      <div className="space-y-3">
                        {(formData.formasPagamento || []).map((forma, index) => (
                          <div key={forma.id} className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Label className="text-xs text-slate-600 dark:text-slate-400">Tipo</Label>
                              <Select 
                                value={forma.tipo} 
                                onValueChange={(value) => {
                                  const newFormas = [...(formData.formasPagamento || [])];
                                  newFormas[index].tipo = value;
                                  setFormData({...formData, formasPagamento: newFormas});
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
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
                            <div className="flex-1">
                              <Label className="text-xs text-slate-600 dark:text-slate-400">Valor</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={forma.valor || ''}
                                onChange={(e) => {
                                  const newFormas = [...(formData.formasPagamento || [])];
                                  newFormas[index].valor = parseFloat(e.target.value) || 0;
                                  setFormData({...formData, formasPagamento: newFormas});
                                }}
                                className="h-8 text-xs"
                                placeholder="0.00"
                              />
                            </div>
                            {(formData.formasPagamento || []).length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const newFormas = (formData.formasPagamento || []).filter((_, i) => i !== index);
                                  setFormData({...formData, formasPagamento: newFormas});
                                }}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        
                        {/* Resumo do Pagamento */}
                        {(formData.formasPagamento || []).length > 0 && (
                          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 dark:border-slate-600/50">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Total da OV:</span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal(formData.produtos))}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Total Pago:</span>
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0))}
                              </span>
                            </div>
                            {(formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0) > calculateTotal(formData.produtos) && (
                              <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                                <span>Troco:</span>
                                <span className="font-bold">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0) - calculateTotal(formData.produtos))}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Sistema de Parcelamento */}
                    <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-slate-800/30 dark:via-slate-700/30 dark:to-slate-600/30 rounded-xl p-4 border border-orange-200 dark:border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="parcelamentoAtivoManual"
                            checked={formData.parcelamento?.ativo || false}
                            onChange={(e) => {
                              const ativo = e.target.checked;
                              const parcelas = ativo ? (formData.parcelamento?.parcelas || 1) : 1;
                              setFormData({
                                ...formData,
                                parcelamento: {
                                  ...formData.parcelamento,
                                  ativo,
                                  parcelas
                                }
                              });
                            }}
                            className="w-4 h-4 rounded border-2 border-orange-400 text-orange-500 focus:ring-orange-500"
                          />
                          <Label htmlFor="parcelamentoAtivoManual" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            Ativar parcelamento
                          </Label>
                        </div>
                        {formData.parcelamento?.ativo && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <Calendar className="h-3 w-3" />
                            <span className="font-medium">Parcelado</span>
                          </div>
                        )}
                      </div>
                      
                      {formData.parcelamento?.ativo && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="parcelasManual" className="text-xs font-medium text-slate-700 dark:text-slate-300">Parcelas</Label>
                              <Input
                                id="parcelasManual"
                                type="number"
                                min="1"
                                max="60"
                                value={formData.parcelamento?.parcelas || 1}
                                onChange={(e) => {
                                  const parcelas = parseInt(e.target.value) || 1;
                                  setFormData({
                                    ...formData,
                                    parcelamento: {
                                      ...formData.parcelamento,
                                      parcelas
                                    }
                                  });
                                }}
                                className="mt-1 h-8 text-sm"
                                placeholder="1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="intervaloManual" className="text-xs font-medium text-slate-700 dark:text-slate-300">Intervalo</Label>
                              <Select 
                                value={formData.parcelamento?.intervalo || 'mensal'} 
                                onValueChange={(value) => setFormData({
                                  ...formData,
                                  parcelamento: { 
                                    ...formData.parcelamento, 
                                    intervalo: value 
                                  }
                                })}
                              >
                                <SelectTrigger id="intervaloManual" className="mt-1 h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="semanal">📅 Semanal</SelectItem>
                                  <SelectItem value="quinzenal">📆 Quinzenal</SelectItem>
                                  <SelectItem value="mensal">🗓️ Mensal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {formData.parcelamento?.parcelas > 1 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 dark:border-slate-600/50"
                            >
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="text-slate-600 dark:text-slate-400">Valor por Parcela</div>
                                  <div className="font-bold text-blue-600 dark:text-blue-400">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.total / (formData.parcelamento?.parcelas || 1))}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-slate-600 dark:text-slate-400">Total de Parcelas</div>
                                  <div className="font-bold text-purple-600 dark:text-purple-400">
                                    {formData.parcelamento?.parcelas || 1}x
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Informações de Pagamento (somente leitura ao editar) */}
                    {editingOV && editingOV.formasPagamento && editingOV.formasPagamento.length > 1 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Formas de Pagamento Utilizadas</h4>
                        <div className="space-y-1">
                          {editingOV.formasPagamento.map((forma, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="text-blue-700 dark:text-blue-300 capitalize">{forma.tipo}:</span>
                              <span className="font-semibold text-blue-800 dark:text-blue-200">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(forma.valor)}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-blue-200 dark:border-blue-700 pt-1 mt-2">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-blue-800 dark:text-blue-200">Total:</span>
                              <span className="text-blue-900 dark:text-blue-100">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(editingOV.formasPagamento.reduce((sum, fp) => sum + fp.valor, 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total da OV</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {editingOV ? 'Atualizar OV' : 'Criar OV'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseDialog} 
                    className="flex-1 sm:flex-none border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </Button>
                </div>
            </form>
          </DialogContent>
        </Dialog>
        
              <Button 
                onClick={() => setModalOVsDia(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-3"
              >
                Ver OVs do Dia ({ordensDoDia.length})
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Mini Dashboard de Estatísticas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-4 mt-6 sm:mt-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{statsOV.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statsOV.pendentes}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Processando</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statsOV.processando}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Concluídas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statsOV.concluidas}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Faturamento</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(statsOV.valorTotal)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          </div>
        </motion.div>

        {/* LAYOUT PRINCIPAL - CARRINHO FIXO NA DIREITA */}
        <div className="flex gap-6 p-6 mt-2">
          {/* CATÁLOGO DE PRODUTOS - LADO ESQUERDO */}
          <div className="flex-1">
            {/* CONTROLES E FILTROS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar produtos..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-10 h-12 text-lg" 
                  />
                </div>
                <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                  <SelectTrigger className="w-full lg:w-64 h-12">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as categorias</SelectItem>
                    {categoriasOrdenadas.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.cor }}></div>
                          {cat.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

          {/* PRODUTOS POR CATEGORIA */}
          <div className="space-y-8">
            {categoriasOrdenadas.map(categoria => {
              const produtosDaCategoria = produtosFiltrados
                .filter(p => p.categoriaId === categoria.id)
                .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999)); // Ordenar produtos pela ordem personalizada
              if (produtosDaCategoria.length === 0) return null;
              
              return (
                <motion.div
                  key={categoria.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  {/* BARRA DE CATEGORIA */}
                  <div className={`bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl p-4 border-2 shadow-lg`} style={{ borderColor: categoria.cor }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: categoria.cor }}></div>
                        <h2 className="font-bold text-slate-900 dark:text-white text-xl">{categoria.nome}</h2>
                        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm px-3 py-1 rounded-full font-medium">
                          {produtosDaCategoria.length} produtos
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* GRID DE PRODUTOS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {produtosDaCategoria.map((produto, index) => (
                      <motion.div 
                        key={produto.id} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group"
                      >
                        <div className="flex gap-3">
                          {/* IMAGEM */}
                          {produto.imagem && (
                            <div className="flex-shrink-0 flex flex-col items-center">
                              <img
                                src={produto.imagem}
                                alt={produto.nome}
                                className="w-20 h-20 object-cover rounded-lg shadow-md border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-all duration-200"
                              />
                              <Button
                                size="sm"
                                onClick={() => abrirModalProduto(produto)}
                                className="w-20 mt-4 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {produto.nome}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Código: {produto.codigo}</p>
                            
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                                <DollarSign className="h-3 w-3" />
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                                <Package className="h-3 w-3" />
                                <span className={`text-xs font-semibold ${produto.quantidade <= 5 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                  {produto.quantidade} {produto.quantidade <= 5 && '(Baixo)'}
                                </span>
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => adicionarAoCarrinho(produto)}
                              className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                              disabled={produto.quantidade <= 0}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar ao Carrinho
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* MENSAGEM QUANDO NÃO HÁ PRODUTOS */}
          {produtosFiltrados.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {searchTerm ? 'Tente buscar com outros termos' : 'Cadastre produtos no módulo de Estoque'}
              </p>
              {!searchTerm && (
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setActiveModule('estoque')}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    Ir para Estoque
                  </Button>
                  <Button
                    onClick={() => handleOpenDialog()}
                    variant="outline"
                    className="border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold px-6 py-3"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Criar OV Manual
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* CARRINHO FIXO - LADO DIREITO */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 h-fit sticky top-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
              <ShoppingCart className="h-6 w-6 text-blue-500" />
              Carrinho
            </h3>
            {carrinho.length > 0 && (
              <Button size="sm" variant="outline" onClick={cancelarVenda} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* SELEÇÃO DE CLIENTE */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Cliente {clientes.length > 0 && `(${clientes.length} cadastrados)`}
            </Label>
            
            {/* Status dos clientes */}
            <div className="mb-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {clientes.length === 0 ? 'Nenhum cliente encontrado' : `${clientes.length} cliente(s) disponível(is)`}
              </span>
            </div>
            
            {/* Campo de busca de cliente */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  value={buscaCliente}
                  onChange={(e) => handleBuscaCliente(e.target.value)}
                  placeholder="Digite o nome, telefone ou email do cliente..."
                  className="pr-10 h-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                
                {/* Dropdown de sugestões */}
                {mostrarSugestoesCliente && clientesFiltrados.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto scrollbar-hide">
                    {clientesFiltrados.map(cliente => (
                      <div
                        key={cliente.id}
                        onClick={() => selecionarCliente(cliente)}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-600 last:border-b-0"
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
              
              <p className="text-xs text-slate-500 dark:text-slate-400">
                💡 Digite o nome, telefone ou email do cliente para buscar
              </p>
              
              {clienteSelecionado && (
                <div className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2">
                    <span>✅ Cliente selecionado:</span>
                    <CustomerAvatar 
                      customer={clienteSelecionado} 
                      size="xs" 
                      showName={true}
                    />
                  </div>
                </div>
              )}
              
              {clientes.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700">
                  ⚠️ Nenhum cliente cadastrado. Digite o nome do cliente abaixo.
                </p>
              )}
            </div>
          </div>


          {/* ITENS DO CARRINHO */}
          <div className="space-y-3 mb-6 max-h-60 overflow-y-auto scrollbar-hide">
            {carrinho.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Seu carrinho está vazio</p>
                <p className="text-xs text-slate-400 mt-1">Adicione produtos do catálogo</p>
              </div>
            ) : (
              carrinho.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.nome}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                      className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm w-8 text-center font-medium">{item.quantidade}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                      className="h-7 w-7 p-0 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removerDoCarrinho(item.id)}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* TOTAL E FINALIZAR VENDA */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-lg text-slate-900 dark:text-white">Total:</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcularTotalCarrinho())}
              </span>
            </div>
            <Button 
              onClick={finalizarVenda} 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={carrinho.length === 0 || !clienteSelecionado}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Finalizar Venda
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Modal de OVs do Dia */}
      <Dialog open={modalOVsDia} onOpenChange={setModalOVsDia}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[98vh] h-[98vh] flex flex-col bg-white dark:bg-slate-900">
          <DialogHeader className="pb-4 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-blue-500" />
              Ordens de Venda do Dia
              <span className="text-lg font-normal text-slate-500">({ordensDoDia.length} OVs)</span>
            </DialogTitle>
            <p className="text-slate-600 dark:text-slate-400">
              Todas as ordens de venda criadas hoje ({new Date().toLocaleDateString('pt-BR')})
            </p>
          </DialogHeader>
          
          {/* Barra de Busca e Filtros - Fixa no topo */}
          <div className="mb-6 space-y-4 flex-shrink-0">
            <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar OVs por cliente ou número..." 
                value={searchTermOVs} 
                onChange={(e) => setSearchTermOVs(e.target.value)} 
                className="pl-10" 
              />
        </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium">Ordenar por:</Label>
                <Select value={ordenacaoOVs} onValueChange={setOrdenacaoOVs}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recentes">Mais Recentes</SelectItem>
                    <SelectItem value="antigas">Mais Antigas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {filteredOrdens.length} OV(s) encontrada(s)
              </div>
            </div>
          </div>

          {/* Área de Conteúdo com Rolagem - Separada */}
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide" style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            maxHeight: 'calc(95vh - 200px)'
          }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
              {filteredOrdens.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
                    {searchTermOVs ? 'Nenhuma OV encontrada' : 'Nenhuma OV criada hoje'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {searchTermOVs ? 'Tente buscar com outros termos' : 'As OVs criadas hoje aparecerão aqui'}
                  </p>
                </div>
              ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredOrdens.map((ov, index) => (
            <motion.div
              key={ov.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 w-full max-w-full p-6"
                    >
                      <div className="p-2">
                        {/* Header do Card */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{ov.numero}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ov.status)}`}>
                              {ov.status}
                            </span>
                </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenDialog(ov)}
                              className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteClick(ov)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                </div>
              </div>
              
                        {/* Informações Principais */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <CustomerAvatar 
                              customer={{
                                nome: ov.clienteNome,
                                telefone: ov.clienteTelefone,
                                foto: clientes.find(c => c.id === ov.clienteId)?.foto
                              }} 
                              size="xs" 
                              showName={true}
                            />
                </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <ShoppingCart className="h-4 w-4" />
                              <span>{ov.produtos?.length || 0} produto(s)</span>
              </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ov.total || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(ov.createdAt?.toDate ? ov.createdAt.toDate() : ov.createdAt).toLocaleString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </div>
        </div>

                        {/* Produtos - Layout Compacto */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                          <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {(ov.produtos || []).map((produto, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                                <span className="font-medium truncate flex-1 mr-2">{produto.nome}</span>
                                <span className="text-slate-500 break-words">
                                  {produto.quantidade}x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
                                </span>
          </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
      </div>
      )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Finalização de Pagamento */}
      <Dialog open={modalPagamento} onOpenChange={setModalPagamento}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 scrollbar-hide">
          <DialogHeader>
            <DialogTitle>Finalizar Venda - Formas de Pagamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Resumo da Venda */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Resumo da Venda</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-medium">
                    {clienteSelecionado?.nome}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Original:</span>
                  <span>R$ {calcularTotalCarrinho().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Desconto:</span>
                  <span className="text-red-600">
                    {desconto.valor > 0 ? (
                      desconto.tipo === 'porcentagem' 
                        ? `${desconto.valor}% (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcularTotalCarrinho() * desconto.valor / 100)})`
                        : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(desconto.valor)
                    ) : (
                      <span className="text-slate-500">Nenhum desconto</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total Final:</span>
                  <span className="text-green-600">R$ {calcularTotalComDesconto().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Sistema de Parcelamento */}
            <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-slate-800/30 dark:via-slate-700/30 dark:to-slate-600/30 rounded-2xl p-6 border border-orange-200 dark:border-slate-600 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="parcelamentoAtivo"
                    checked={parcelamento.ativo}
                    onChange={(e) => {
                      const ativo = e.target.checked;
                      const parcelas = ativo ? parcelamento.parcelas : 1;
                      setParcelamento({
                        ...parcelamento,
                        ativo,
                        parcelas
                      });
                    }}
                    className="w-5 h-5 rounded border-2 border-orange-400 text-orange-500 focus:ring-orange-500"
                  />
                  <Label htmlFor="parcelamentoAtivo" className="text-lg font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Ativar parcelamento
                  </Label>
                </div>
                {parcelamento.ativo && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Parcelado</span>
                  </div>
                )}
              </div>
              
              {parcelamento.ativo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="parcelas" className="text-sm font-medium text-slate-700 dark:text-slate-300">Número de Parcelas</Label>
                      <Input
                        id="parcelas"
                        type="number"
                        min="1"
                        max="60"
                        value={parcelamento.parcelas}
                        onChange={(e) => {
                          const parcelas = parseInt(e.target.value) || 1;
                          setParcelamento({
                            ...parcelamento,
                            parcelas
                          });
                        }}
                        className="mt-2 h-11 text-lg font-semibold"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="intervalo" className="text-sm font-medium text-slate-700 dark:text-slate-300">Intervalo</Label>
                      <Select value={parcelamento.intervalo} onValueChange={(value) => setParcelamento({...parcelamento, intervalo: value})}>
                        <SelectTrigger id="intervalo" className="mt-2 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="semanal">📅 Semanal</SelectItem>
                          <SelectItem value="quinzenal">📆 Quinzenal</SelectItem>
                          <SelectItem value="mensal">🗓️ Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {parcelamento.parcelas > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 dark:border-slate-600/50 shadow-lg"
                    >
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <div className="p-1 bg-blue-500 rounded">
                          <Target className="h-4 w-4 text-white" />
                        </div>
                        Resumo do Parcelamento
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Valor por Parcela</div>
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcularTotalComDesconto() / parcelamento.parcelas)}
                          </div>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="text-sm font-medium text-purple-800 dark:text-purple-200">Total de Parcelas</div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {parcelamento.parcelas}x
                          </div>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="text-sm font-medium text-orange-800 dark:text-orange-200">Intervalo</div>
                          <div className="text-lg font-bold text-orange-600 dark:text-orange-400 capitalize">
                            {parcelamento.intervalo}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sistema de Desconto */}
            <div className="space-y-3">
              <h3 className="font-semibold">Desconto</h3>
              <div className="flex gap-3">
                <Select value={desconto.tipo} onValueChange={(value) => setDesconto({...desconto, tipo: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porcentagem">%</SelectItem>
                    <SelectItem value="valor">R$</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step={desconto.tipo === 'porcentagem' ? '1' : '0.01'}
                  min="0"
                  max={desconto.tipo === 'porcentagem' ? '100' : calcularTotalCarrinho()}
                  value={desconto.valor === 0 ? '' : desconto.valor}
                  onChange={(e) => setDesconto({...desconto, valor: parseFloat(e.target.value) || 0})}
                  placeholder={desconto.tipo === 'porcentagem' ? 'Ex: 10' : 'Ex: 50.00'}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Formas de Pagamento */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Formas de Pagamento</h3>
                <Button size="sm" onClick={adicionarFormaPagamento}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {/* Atalhos para formas de pagamento comuns */}
              {formasPagamento.length === 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      const totalComDesconto = calcularTotalComDesconto();
                      setFormasPagamento([{ 
                        id: Date.now(), 
                        tipo: 'dinheiro', 
                        valor: totalComDesconto, 
                        observacao: '' 
                      }]);
                    }}
                    className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                  >
                    💵 Dinheiro
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      const totalComDesconto = calcularTotalComDesconto();
                      setFormasPagamento([{ 
                        id: Date.now(), 
                        tipo: 'pix', 
                        valor: totalComDesconto, 
                        observacao: '' 
                      }]);
                    }}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400"
                  >
                    📱 PIX
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      const totalComDesconto = calcularTotalComDesconto();
                      setFormasPagamento([{ 
                        id: Date.now(), 
                        tipo: 'cartao_credito', 
                        valor: totalComDesconto, 
                        observacao: '' 
                      }]);
                    }}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:border-purple-700 dark:text-purple-400"
                  >
                    💳 Crédito
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      const totalComDesconto = calcularTotalComDesconto();
                      setFormasPagamento([{ 
                        id: Date.now(), 
                        tipo: 'cartao_debito', 
                        valor: totalComDesconto, 
                        observacao: '' 
                      }]);
                    }}
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-400"
                  >
                    💳 Débito
                  </Button>
                </div>
              )}
              
              <div className="space-y-3">
                {formasPagamento.map((forma, index) => (
                  <div key={forma.id} className="flex gap-3 items-center p-3 border rounded-lg">
                    <Select 
                      value={forma.tipo} 
                      onValueChange={(value) => atualizarFormaPagamento(forma.id, 'tipo', value)}
                    >
                      <SelectTrigger className="w-32">
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
                    
                    <div className="flex-1 relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={forma.valor === 0 ? '' : forma.valor}
                        onChange={(e) => atualizarFormaPagamento(forma.id, 'valor', parseFloat(e.target.value) || 0)}
                        placeholder="Valor"
                        className={`w-full ${forma.valor > 0 && Math.abs(forma.valor - calcularValorRestante(forma.id)) < 0.01 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : forma.valor > 0 && forma.valor > calcularValorRestante(forma.id) ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                      />
                      {/* Sugestão de valor restante */}
                      {(forma.valor === 0 || forma.valor === '') && formasPagamento.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const valorRestante = calcularValorRestante(forma.id);
                            if (valorRestante > 0) {
                              atualizarFormaPagamento(forma.id, 'valor', valorRestante);
                            }
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
                        >
                          Usar restante
                        </button>
                      )}
                      
                      {/* Indicador de valor correto */}
                      {forma.valor > 0 && Math.abs(forma.valor - calcularValorRestante(forma.id)) < 0.01 && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500">
                          ✓
                        </div>
                      )}
                    </div>
                    
                    <Input
                      value={forma.observacao}
                      onChange={(e) => atualizarFormaPagamento(forma.id, 'observacao', e.target.value)}
                      placeholder="Observação"
                      className="flex-1"
                    />
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removerFormaPagamento(forma.id)}
                      className="text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Pago e Status */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Pago:</span>
                  <span className="font-semibold">R$ {calcularTotalPagamentos().toFixed(2)}</span>
                </div>
                
                {/* Status do Pagamento */}
                <div className={`text-center py-2 px-3 rounded-lg border ${validarPagamento().status === 'completo' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : validarPagamento().status === 'incompleto' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : validarPagamento().status === 'troco' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}>
                  <span className={`font-medium ${validarPagamento().cor}`}>
                    {validarPagamento().mensagem}
                  </span>
                </div>

                {calcularTotalPagamentos() > calcularTotalComDesconto() && (
                  <div className="flex justify-between text-green-600">
                    <span>Troco:</span>
                    <span className="font-semibold">R$ {(calcularTotalPagamentos() - calcularTotalComDesconto()).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button 
                onClick={finalizarPagamento}
                className={`flex-1 ${validarPagamento().status === 'completo' || validarPagamento().status === 'troco' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                disabled={validarPagamento().status === 'vazio' || validarPagamento().status === 'incompleto'}
              >
                {validarPagamento().status === 'completo' ? '✅ Finalizar Pagamento' : 
                 validarPagamento().status === 'troco' ? '💰 Finalizar Pagamento' :
                 validarPagamento().status === 'incompleto' ? '❌ Pagamento Incompleto' :
                 'Adicione Pagamento'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setModalPagamento(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE VISUALIZAÇÃO DO PRODUTO */}
      <Dialog open={modalProdutoOpen} onOpenChange={setModalProdutoOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Package className="h-7 w-7 text-blue-600" />
              Informações Completas do Produto
            </DialogTitle>
          </DialogHeader>
          
          {produtoSelecionado && (
            <div className="space-y-8">
              {/* CABEÇALHO DO PRODUTO */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
                      {produtoSelecionado.nome}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full border">
                        <strong>Código:</strong> {produtoSelecionado.codigo}
                      </span>
                      <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full border">
                        <strong>Categoria:</strong> {produtoSelecionado.categoriaNome || 'Sem categoria'}
                      </span>
                      <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full border">
                        <strong>ID:</strong> {produtoSelecionado.id?.slice(-8) || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produtoSelecionado.preco)}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Preço de venda
                    </div>
                  </div>
                </div>
              </div>

              {/* LAYOUT PRINCIPAL */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* COLUNA ESQUERDA - IMAGEM E AÇÕES */}
                <div className="lg:col-span-1 space-y-6">
                  {/* IMAGEM PRINCIPAL */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                    {!imagemZoom ? (
                      // IMAGEM NORMAL
                      <div 
                        className="relative cursor-pointer transition-all duration-300 hover:scale-105"
                        onClick={() => setImagemZoom(true)}
                      >
                        <img
                          src={produtoSelecionado.imagem}
                          alt={produtoSelecionado.nome}
                          className="w-full h-80 object-cover rounded-xl shadow-xl border-2 border-slate-200 dark:border-slate-600"
                        />
                        <div className="absolute top-3 right-3 bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg">
                          <Eye className="h-4 w-4 text-slate-600" />
                        </div>
                      </div>
                    ) : (
                      // IMAGEM COM ZOOM AVANÇADO
                      <div className="relative">
                        <div 
                          className="relative w-full h-80 overflow-hidden rounded-xl shadow-xl border-2 border-slate-200 dark:border-slate-600 cursor-move"
                          onMouseMove={handleMouseMove}
                          onClick={() => setImagemZoom(false)}
                        >
                          <img
                            src={produtoSelecionado.imagem}
                            alt={produtoSelecionado.nome}
                            className="w-full h-full object-cover"
                            style={{
                              transform: `scale(2.5) translate(${-mousePosition.x + 50}%, ${-mousePosition.y + 50}%)`,
                              transformOrigin: 'center center',
                              imageRendering: 'crisp-edges',
                              willChange: 'transform'
                            }}
                          />
                          {/* OVERLAY COM LENTE DE ZOOM */}
                          <div 
                            className="absolute pointer-events-none border-2 border-blue-500 bg-blue-500 bg-opacity-20 rounded-full"
                            style={{
                              width: '80px',
                              height: '80px',
                              left: `${mousePosition.x}%`,
                              top: `${mousePosition.y}%`,
                              transform: 'translate(-50%, -50%)',
                              willChange: 'left, top'
                            }}
                          />
                        </div>
                        <div className="absolute top-3 right-3 bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg">
                          <X className="h-4 w-4 text-slate-600" />
                        </div>
                      </div>
                    )}
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
                      {imagemZoom ? 'Mova o mouse para explorar • Clique para sair' : 'Clique na imagem para ampliar'}
                    </p>
                  </div>

                  {/* AÇÕES RÁPIDAS */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        adicionarAoCarrinho(produtoSelecionado);
                        fecharModalProduto();
                      }}
                      className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={produtoSelecionado.quantidade <= 0}
                    >
                      <Plus className="h-6 w-6 mr-3" />
                      Adicionar ao Carrinho
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full h-12 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={fecharModalProduto}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Fechar
                    </Button>
                  </div>
                </div>

                {/* COLUNA DIREITA - INFORMAÇÕES DETALHADAS */}
                <div className="lg:col-span-2 space-y-6">
                  {/* ESTOQUE E DISPONIBILIDADE */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Estoque e Disponibilidade
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <div className={`text-3xl font-bold mb-1 ${produtoSelecionado.quantidade <= 5 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                          {produtoSelecionado.quantidade}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Unidades em estoque</div>
                        {produtoSelecionado.quantidade <= 5 && (
                          <div className="text-xs text-red-500 mt-1 font-semibold">⚠️ Estoque baixo</div>
                        )}
                      </div>
                      <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <div className={`text-3xl font-bold mb-1 ${produtoSelecionado.quantidade > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {produtoSelecionado.quantidade > 0 ? '✓' : '✗'}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {produtoSelecionado.quantidade > 0 ? 'Disponível' : 'Indisponível'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* INFORMAÇÕES FINANCEIRAS */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Informações Financeiras
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produtoSelecionado.preco)}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Preço de venda</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produtoSelecionado.preco * produtoSelecionado.quantidade)}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Valor total em estoque</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {produtoSelecionado.quantidade > 0 ? 'Ativo' : 'Inativo'}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Status comercial</div>
                      </div>
                    </div>
                  </div>

                  {/* METADADOS DO PRODUTO */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-slate-600" />
                      Metadados do Produto
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">ID do Produto:</span>
                          <span className="text-sm font-mono text-slate-900 dark:text-white">{produtoSelecionado.id || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Código:</span>
                          <span className="text-sm font-mono text-slate-900 dark:text-white">{produtoSelecionado.codigo}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Categoria:</span>
                          <span className="text-sm text-slate-900 dark:text-white">{produtoSelecionado.categoriaNome || 'Sem categoria'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Criado em:</span>
                          <span className="text-sm text-slate-900 dark:text-white">
                            {produtoSelecionado.createdAt ? new Date(produtoSelecionado.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Atualizado em:</span>
                          <span className="text-sm text-slate-900 dark:text-white">
                            {produtoSelecionado.updatedAt ? new Date(produtoSelecionado.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status:</span>
                          <Badge variant={produtoSelecionado.quantidade > 0 ? "default" : "destructive"}>
                            {produtoSelecionado.quantidade > 0 ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ESTATÍSTICAS DE VENDA */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-orange-600" />
                      Estatísticas de Venda
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">0</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Vendas hoje</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">0</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Vendas esta semana</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">0</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Vendas este mês</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">0</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Total de vendas</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir Ordem de Venda"
        description={`Tem certeza que deseja excluir a OV #${ovToDelete?.numero} do cliente "${ovToDelete?.clienteNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="delete"
      />

      {/* Modal de Estoque Insuficiente - Unificado */}
      <Dialog open={estoqueModalOpen} onOpenChange={setEstoqueModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border-0 p-0 overflow-hidden">
          <DialogHeader className={`bg-gradient-to-r ${estoqueModalData.contexto === 'carrinho' ? 'from-blue-500 to-purple-500' : 'from-orange-500 to-red-500'} text-white p-6`}>
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {estoqueModalData.contexto === 'carrinho' ? (
                  <ShoppingCart className="h-6 w-6" />
                ) : (
                  <Package className="h-6 w-6" />
                )}
              </div>
              Estoque Insuficiente
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className={`w-16 h-16 ${estoqueModalData.contexto === 'carrinho' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {estoqueModalData.contexto === 'carrinho' ? (
                  <ShoppingCart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Package className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                )}
              </div>
              
              <div className="mb-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  estoqueModalData.contexto === 'carrinho' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' 
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                }`}>
                  {estoqueModalData.contexto === 'carrinho' ? '🛒 Carrinho de Vendas' : '📝 Ordem de Venda Manual'}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Produto: {estoqueModalData.produto}
              </h3>
              
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Disponível em estoque:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {estoqueModalData.disponivel} unidades
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Quantidade solicitada:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {estoqueModalData.solicitado} unidades
                  </span>
                </div>
                
                <div className="border-t border-slate-200 dark:border-slate-600 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Diferença:</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      -{(estoqueModalData.solicitado - estoqueModalData.disponivel)} unidades
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                {estoqueModalData.contexto === 'carrinho' 
                  ? 'Não é possível adicionar esta quantidade ao carrinho pois excederia o estoque disponível.'
                  : 'Não é possível definir esta quantidade na ordem de venda pois excederia o estoque disponível.'
                }
              </p>
              
              {estoqueModalData.disponivel > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    💡 <strong>Dica:</strong> Você pode adicionar até {estoqueModalData.disponivel} unidades deste produto.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-700 p-4 flex justify-end">
            <Button
              onClick={() => setEstoqueModalOpen(false)}
              className={`${estoqueModalData.contexto === 'carrinho' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'} text-white px-6`}
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OVModule;