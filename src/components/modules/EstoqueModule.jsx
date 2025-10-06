import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion } from 'framer-motion';

import { Plus, Search, Edit, Trash2, FolderTree, BarChart3, TrendingUp, TrendingDown, X, ZoomIn, AlertTriangle, DollarSign, Package, Tag, Camera, Download, ShoppingCart, Eye, EyeOff, Menu, Settings } from 'lucide-react';
import HamburgerMenuIcon from '@/components/ui/HamburgerMenuIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Rnd } from 'react-rnd'; // Import para redimensionamento
import { useDropzone } from 'react-dropzone'; // Import para arrasta e solta

import { useProdutos, useCategorias, useMovimentacoes, usePermissions, useConfiguracao, useGruposOpcoes, useOpcoes } from '@/lib/hooks/useFirebase';
import { AppContext } from '@/App';
import ConfirmDialog from '@/components/ui/confirm-dialog';

const EstoqueModule = () => {

  const { dialogs, openDialog, closeDialog, produtoParaReporEstoque, limparProdutoParaReporEstoque, darkMode, setActiveModule } = useContext(AppContext);
  const { toast } = useToast();
  
  // Usar hooks do Firebase
  const { data: categorias, loading: categoriasLoading, save: saveCategoria, remove: removeCategoria } = useCategorias();
  const { data: produtos, loading: produtosLoading, save: saveProduto, remove: removeProduto } = useProdutos();
  const { data: movimentacoes, loading: movimentacoesLoading, save: saveMovimentacao, remove: removeMovimentacao } = useMovimentacoes();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { config: configuracoes } = useConfiguracao();
  const { data: gruposOpcoes, save: saveGrupoOpcao, remove: removeGrupoOpcao } = useGruposOpcoes();
  const { data: opcoes, save: saveOpcao, remove: removeOpcao } = useOpcoes();

  // Verificar se a funcionalidade de grupos e opções está ativada
  const gruposEOpcoesAtivo = configuracoes?.gruposEOpcoesAtivo || false;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [movementSearchTerm, setMovementSearchTerm] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [isMovDialogOpen, setIsMovDialogOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  const [isEstoqueCriticoModalOpen, setIsEstoqueCriticoModalOpen] = useState(false);

  const [editingProduto, setEditingProduto] = useState(null);
  const [editingCategoria, setEditingCategoria] = useState(null);
  
  // Estados para confirmação de exclusão
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'produto' ou 'categoria'
  
  // Estados para confirmação de exclusão de movimentações
  const [confirmDeleteMovOpen, setConfirmDeleteMovOpen] = useState(false);
  const [movimentacaoToDelete, setMovimentacaoToDelete] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    preco: '',
    quantidade: '',
    categoriaId: '',
    imagem: null,
    oculto: false,
  });

  const [catForm, setCatForm] = useState({ nome: '', cor: '#8b5cf6', oculto: false });

  const [movData, setMovData] = useState({
    produtoId: '',
    tipo: 'entrada',
    quantidade: '',
    observacao: ''
  });

  
  // Estados para autocomplete
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);


  const [isReordenarOpen, setIsReordenarOpen] = useState(false);
  const [tipoOrdenacao, setTipoOrdenacao] = useState('personalizada');
  const [categoriasReordenadas, setCategoriasReordenadas] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);

  // Estados para reordenação de produtos
  const [isReordenarProdutosOpen, setIsReordenarProdutosOpen] = useState(false);
  const [categoriaProdutosReordenar, setCategoriaProdutosReordenar] = useState(null);
  const [tipoOrdenacaoProdutos, setTipoOrdenacaoProdutos] = useState('personalizada');
  const [produtosReordenados, setProdutosReordenados] = useState([]);
  const [draggedIndexProduto, setDraggedIndexProduto] = useState(null);
  const [dragOverIndexProduto, setDragOverIndexProduto] = useState(null);

  // Estados para alterações rápidas
  const [isAlteracoesRapidasOpen, setIsAlteracoesRapidasOpen] = useState(false);
  const [alteracaoRapidaSelecionada, setAlteracaoRapidaSelecionada] = useState(null);
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [valorAlteracao, setValorAlteracao] = useState('');
  const [tipoAlteracao, setTipoAlteracao] = useState('percentual'); // 'percentual' ou 'valor_fixo'
  const [categoriaDestino, setCategoriaDestino] = useState('');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState('');
  const [tipoEstoque, setTipoEstoque] = useState('entrada'); // 'entrada' ou 'saida'
  const [isAplicandoAlteracoes, setIsAplicandoAlteracoes] = useState(false);

  // ---------- MONITORAR DIALOGS DA DASHBOARD ----------
  useEffect(() => {

    if (dialogs.produto) {
      // Abrir modal de produto sem categoria pré-selecionada
      setEditingProduto(null);
      setFormData({
        nome: '',
        codigo: '',
        preco: '',
        quantidade: '',
        categoriaId: '', // Sem categoria pré-selecionada
        imagem: null,
        oculto: false,
      });
      setIsDialogOpen(true);
      closeDialog('produto');
    }
    
    if (dialogs.movimentacao) {
      // Verificar se há produto no contexto para reposição (vindo da dashboard)
      if (produtoParaReporEstoque) {
        // Produto pré-selecionado para reposição
        setMovData({
          produtoId: produtoParaReporEstoque.id,
          tipo: 'entrada',
          quantidade: '',
          observacao: `Reposição de estoque - ${produtoParaReporEstoque.nome}`
        });
        setBuscaProduto(produtoParaReporEstoque.nome);
        // Limpar o produto do contexto
        limparProdutoParaReporEstoque();
      } else {
        // Abrir modal de movimentação sem produto pré-selecionado
        setMovData({
          produtoId: '', // Sem produto pré-selecionado
          tipo: 'entrada',
          quantidade: '',
          observacao: ''
        });
        setBuscaProduto('');
        setProdutosFiltrados([]);
        setMostrarSugestoes(false);
      }
      
      if (!canCreate('estoque')) return;
    setIsMovDialogOpen(true);
      closeDialog('movimentacao');
    }
  }, [dialogs, closeDialog, produtoParaReporEstoque, limparProdutoParaReporEstoque]);

  // ---------- CATEGORIA ----------

  const handleSubmitCategoria = async (e) => {
    e.preventDefault();
    
    // Verificar permissões
    if (editingCategoria) {
      if (!canEdit('estoque')) return;
    } else {
      if (!canCreate('estoque')) return;
    }
    
    if (!catForm.nome) {
      toast({ title: "Erro", description: "Nome da categoria é obrigatório!", variant: "destructive" });
      return;
    }


    try {
      await saveCategoria({
      nome: catForm.nome,

        cor: catForm.cor,
        oculto: catForm.oculto,
        createdAt: editingCategoria ? editingCategoria.createdAt : new Date().toISOString()
      }, editingCategoria?.id);
      
      toast({ 
        title: "Sucesso!", 
        description: editingCategoria ? "Categoria atualizada!" : "Categoria criada!" 
      });

    setCatForm({ nome: '', cor: '#8b5cf6', oculto: false });
    setEditingCategoria(null);
    setIsCatDialogOpen(false);

    } catch (error) {
      console.error('[Estoque] ❌ Erro ao salvar categoria:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao salvar categoria. Tente novamente.",
        variant: "destructive" 
      });
    }
  };

  const handleDeleteCategoriaClick = (categoria) => {
    setItemToDelete(categoria);
    setDeleteType('categoria');
    setConfirmDeleteOpen(true);
  };

  const handleDeleteCategoria = async () => {
    if (!itemToDelete || deleteType !== 'categoria') return;
    
    try {
      // Primeiro, remover todos os produtos desta categoria
      const produtosParaRemover = produtos.filter(p => p.categoriaId === itemToDelete.id);
      for (const produto of produtosParaRemover) {
        await removeProduto(produto.id);
      }
      
      // Depois, remover a categoria
      await removeCategoria(itemToDelete.id);

      if (categoriaSelecionada === itemToDelete.id) setCategoriaSelecionada(null);

      toast({ title: "Sucesso!", description: "Categoria e produtos vinculados removidos!" });
      setConfirmDeleteOpen(false);
      setItemToDelete(null);
      setDeleteType('');

    } catch (error) {
      console.error('[Estoque] ❌ Erro ao remover categoria:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao remover categoria. Tente novamente.",
        variant: "destructive" 
      });
    }
  };

  // ---------- PRODUTO ----------

  const handleSubmitProduto = async (e) => {
    e.preventDefault();

    // Verificar permissões
    if (editingProduto) {
      if (!canEdit('estoque')) return;
    } else {
      if (!canCreate('estoque')) return;
    }

    console.log('[Estoque] ===== INICIANDO CADASTRO DE PRODUTO =====');
    console.log('[Estoque] FormData:', formData);
    
    if (!formData.nome || !formData.codigo || !formData.preco || !formData.quantidade || !formData.categoriaId) {

      console.log('[Estoque] ❌ Campos obrigatórios não preenchidos');
      toast({ title: "Erro", description: "Todos os campos são obrigatórios!", variant: "destructive" });
      return;
    }

    try {
      const novaQuantidade = parseInt(formData.quantidade);
      const quantidadeAnterior = editingProduto ? parseInt(editingProduto.quantidade) : 0;
      const diferencaQuantidade = novaQuantidade - quantidadeAnterior;

      const produtoData = {
        nome: formData.nome,
        codigo: formData.codigo,
        preco: parseFloat(formData.preco),
        quantidade: novaQuantidade,
        categoriaId: formData.categoriaId, // Manter como string (ID do Firebase)
        imagem: formData.imagem,
        oculto: formData.oculto,
        createdAt: editingProduto ? editingProduto.createdAt : new Date().toISOString()
      };

      console.log('[Estoque] ProdutoData preparado:', produtoData);
      console.log('[Estoque] Salvando produto...');
      console.log('[Estoque] editingProduto?.id:', editingProduto?.id);
      
      const produtoId = await saveProduto(produtoData, editingProduto?.id);
      
      // Se está editando um produto e a quantidade mudou, registrar movimentação automática
      if (editingProduto && diferencaQuantidade !== 0) {
        const tipoMovimentacao = diferencaQuantidade > 0 ? 'entrada' : 'saida';
        const quantidadeMovimentacao = Math.abs(diferencaQuantidade);
        
        const movimentacaoData = {
          produtoId: produtoId,
          produtoNome: formData.nome,
          tipo: tipoMovimentacao,
          quantidade: quantidadeMovimentacao,
          observacao: `Ajuste manual de estoque - ${tipoMovimentacao === 'entrada' ? 'Entrada' : 'Saída'} de ${quantidadeMovimentacao} unidades`,
          createdAt: new Date().toISOString()
        };

        console.log('[Estoque] Registrando movimentação automática:', movimentacaoData);
        await saveMovimentacao(movimentacaoData);
        
        toast({ 
          title: "Sucesso!", 
          description: `Produto atualizado e movimentação de ${tipoMovimentacao} registrada automaticamente!` 
        });
      } else {
        toast({ 
          title: "Sucesso!", 
          description: editingProduto ? "Produto atualizado!" : "Produto cadastrado!" 
        });
      }
      
      console.log('[Estoque] ✅ Produto salvo com ID:', produtoId);
      
      // Forçar refresh dos dados
      console.log('[Estoque] Forçando refresh dos dados...');
      setTimeout(() => {
        console.log('[Estoque] Produtos após salvamento:', produtos);
        console.log('[Estoque] Total de produtos:', produtos?.length);
        console.log('[Estoque] Verificando localStorage:', JSON.parse(localStorage.getItem('crm_produtos') || '[]').length);
      }, 1000);

      setFormData({ nome: '', codigo: '', preco: '', quantidade: '', categoriaId: '', imagem: null, oculto: false });
      setEditingProduto(null);
      setIsDialogOpen(false);

      console.log('[Estoque] ===== PRODUTO CADASTRADO COM SUCESSO =====');
      console.log('[Estoque] Formulário limpo e dialog fechado');
    } catch (error) {
      console.error('[Estoque] ❌ Erro ao salvar produto:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao salvar produto. Tente novamente.",
        variant: "destructive" 
      });
    }
  };

  const handleEditProduto = (produto) => {
    // Verificar permissão de edição
    if (!canEdit('estoque')) return;
    
    setFormData({
      nome: produto.nome,
      codigo: produto.codigo,
      preco: produto.preco.toString(),
      quantidade: produto.quantidade.toString(),

      categoriaId: produto.categoriaId.toString(), // Já é string do Firebase
      imagem: produto.imagem || null,
      oculto: produto.oculto || false
    });

    setEditingProduto(produto);
    setIsDialogOpen(true);
  };


  const handleReporEstoque = (produto) => {
    // Pré-selecionar o produto na movimentação
    setMovData({
      produtoId: produto.id,
      tipo: 'entrada',
      quantidade: '',
      observacao: `Reposição de estoque - ${produto.nome}`
    });
    setBuscaProduto(produto.nome);
    if (!canCreate('estoque')) return;
    setIsMovDialogOpen(true);
    setIsEstoqueCriticoModalOpen(false);
  };

  // Função para atualizar observação baseada no tipo de movimentação
  const handleTipoMovimentacaoChange = (tipo, produtoId) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (produto) {
      const observacao = tipo === 'entrada' 
        ? `Reposição de estoque - ${produto.nome}`
        : `Saída de estoque - ${produto.nome}`;
      
      setMovData(prev => ({
        ...prev,
        tipo,
        observacao
      }));
    }
  };

  const handleDeleteProdutoClick = (produto) => {
    // Verificar permissão de exclusão
    if (!canDelete('estoque')) return;
    
    setItemToDelete(produto);
    setDeleteType('produto');
    setConfirmDeleteOpen(true);
  };

  const handleDeleteProduto = async () => {
    if (!itemToDelete || deleteType !== 'produto') return;
    
    try {
      await removeProduto(itemToDelete.id);
      toast({ title: "Sucesso!", description: "Produto removido!" });
      setConfirmDeleteOpen(false);
      setItemToDelete(null);
      setDeleteType('');

    } catch (error) {
      console.error('[Estoque] ❌ Erro ao remover produto:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao remover produto. Tente novamente.",
        variant: "destructive" 
      });
    }
  };

  // Funções para exclusão de movimentações
  const handleDeleteMovimentacaoClick = (movimentacao) => {
    setMovimentacaoToDelete(movimentacao);
    setConfirmDeleteMovOpen(true);
  };

  const handleDeleteMovimentacao = async () => {
    if (!movimentacaoToDelete) return;
    
    try {
      await removeMovimentacao(movimentacaoToDelete.id);
      toast({ title: "Sucesso!", description: "Movimentação removida!" });
      setConfirmDeleteMovOpen(false);
      setMovimentacaoToDelete(null);
    } catch (error) {
      console.error('Erro ao remover movimentação:', error);
      toast({ 
        title: "Erro!", 
        description: "Não foi possível remover a movimentação. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleToggleOcultarProduto = async (produto) => {
    try {
      const produtoAtualizado = {
        ...produto,
        oculto: !produto.oculto
      };
      
      await saveProduto(produtoAtualizado, produto.id);
      
      toast({ 
        title: "Sucesso!", 
        description: produto.oculto ? "Produto exibido!" : "Produto ocultado!" 
      });
    } catch (error) {
      console.error('[Estoque] ❌ Erro ao alterar visibilidade do produto:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao alterar visibilidade do produto. Tente novamente.",
        variant: "destructive" 
      });
    }
  };

  // Funções para alterações rápidas
  const handleAlterarPrecos = async () => {
    if (produtosSelecionados.length === 0 || !valorAlteracao) {
      toast({
        title: "Erro",
        description: "Selecione produtos e informe o valor de alteração!",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const produtoId of produtosSelecionados) {
        const produto = produtos.find(p => p.id === produtoId);
        if (!produto) continue;

        let novoPreco = produto.preco;

        if (tipoAlteracao === 'valor_fixo') {
          novoPreco = parseFloat(valorAlteracao);
        } else if (tipoAlteracao === 'percentual') {
          const percentual = parseFloat(valorAlteracao) / 100;
          novoPreco = produto.preco * (1 + percentual);
        }

        const produtoAtualizado = {
          ...produto,
          preco: novoPreco,
          updatedAt: new Date().toISOString()
        };
        await saveProduto(produtoAtualizado, produto.id);
      }

      toast({
        title: "Sucesso!",
        description: `Preços de ${produtosSelecionados.length} produtos alterados!`,
      });

      // Fechar modal e resetar
      setIsAlteracoesRapidasOpen(false);
      setAlteracaoRapidaSelecionada(null);
      setProdutosSelecionados([]);
      setValorAlteracao('');
    } catch (error) {
      console.error('Erro ao alterar preços:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar preços. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleAjustarEstoque = async () => {
    if (produtosSelecionados.length === 0 || !quantidadeEstoque) {
      toast({
        title: "Erro",
        description: "Selecione produtos e informe a quantidade!",
        variant: "destructive"
      });
      return;
    }

    try {
      const quantidade = parseInt(quantidadeEstoque);
      console.log('[Estoque] Iniciando ajuste de estoque para produtos:', produtosSelecionados);
      
      for (const produtoId of produtosSelecionados) {
        console.log('[Estoque] Processando produto ID:', produtoId);
        const produto = produtos.find(p => p.id === produtoId);
        
        if (!produto) {
          console.log('[Estoque] Produto não encontrado para ID:', produtoId);
          continue;
        }

        console.log('[Estoque] Produto encontrado:', produto.nome, 'Estoque atual:', produto.quantidade);

        let novaQuantidade = produto.quantidade;
        
        if (tipoEstoque === 'entrada') {
          novaQuantidade += quantidade;
        } else {
          novaQuantidade = Math.max(0, novaQuantidade - quantidade);
        }

        console.log('[Estoque] Nova quantidade:', novaQuantidade);

        const produtoAtualizado = {
          ...produto,
          quantidade: novaQuantidade,
          updatedAt: new Date().toISOString()
        };
        
        console.log('[Estoque] Salvando produto atualizado:', produtoAtualizado);
        await saveProduto(produtoAtualizado, produto.id);

        // Registrar movimentação
        const movimentacao = {
          produtoId: produto.id,
          produtoNome: produto.nome,
          tipo: tipoEstoque,
          quantidade: quantidade,
          quantidadeAnterior: produto.quantidade,
          quantidadeNova: novaQuantidade,
          observacao: `Alteração rápida - ${tipoEstoque === 'entrada' ? 'Entrada' : 'Saída'} de ${quantidade} unidades`,
          data: new Date().toISOString(),
          usuario: 'Sistema'
        };
        
        console.log('[Estoque] Registrando movimentação:', movimentacao);
        await saveMovimentacao(movimentacao);
      }

      console.log('[Estoque] Ajuste de estoque concluído para', produtosSelecionados.length, 'produtos');

      toast({
        title: "Sucesso!",
        description: `Estoque de ${produtosSelecionados.length} produtos ajustado!`,
      });

      // Fechar modal e resetar
      setIsAlteracoesRapidasOpen(false);
      setAlteracaoRapidaSelecionada(null);
      setProdutosSelecionados([]);
      setQuantidadeEstoque('');
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      toast({
        title: "Erro",
        description: "Erro ao ajustar estoque. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleTrocarCategoria = async () => {
    if (produtosSelecionados.length === 0 || !categoriaDestino) {
      toast({
        title: "Erro",
        description: "Selecione produtos e uma categoria de destino!",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const produtoId of produtosSelecionados) {
        const produto = produtos.find(p => p.id === produtoId);
        if (!produto) continue;

        const produtoAtualizado = {
          ...produto,
          categoriaId: categoriaDestino,
          updatedAt: new Date().toISOString()
        };
        await saveProduto(produtoAtualizado, produto.id);
      }

      toast({
        title: "Sucesso!",
        description: `${produtosSelecionados.length} produtos movidos para nova categoria!`,
      });

      // Fechar modal e resetar
      setIsAlteracoesRapidasOpen(false);
      setAlteracaoRapidaSelecionada(null);
      setProdutosSelecionados([]);
      setCategoriaDestino('');
    } catch (error) {
      console.error('Erro ao trocar categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao trocar categoria. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleOcultarMostrar = async () => {
    if (produtosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione produtos para alterar visibilidade!",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const produtoId of produtosSelecionados) {
        const produto = produtos.find(p => p.id === produtoId);
        if (!produto) continue;

        const produtoAtualizado = {
          ...produto,
          oculto: !produto.oculto,
          updatedAt: new Date().toISOString()
        };
        await saveProduto(produtoAtualizado, produto.id);
      }

      toast({
        title: "Sucesso!",
        description: `Visibilidade de ${produtosSelecionados.length} produtos alterada!`,
      });

      // Fechar modal e resetar
      setIsAlteracoesRapidasOpen(false);
      setAlteracaoRapidaSelecionada(null);
      setProdutosSelecionados([]);
    } catch (error) {
      console.error('Erro ao alterar visibilidade:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar visibilidade. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDuplicar = async () => {
    if (produtosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione produtos para duplicar!",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const produtoId of produtosSelecionados) {
        const produto = produtos.find(p => p.id === produtoId);
        if (!produto) continue;

        const produtoDuplicado = {
          ...produto,
          nome: `${produto.nome} (Cópia)`,
          codigo: `${produto.codigo}-COPY`,
          quantidade: 0, // Produto duplicado inicia com estoque zero
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        delete produtoDuplicado.id; // Remove ID para criar novo produto
        await saveProduto(produtoDuplicado);
      }

      toast({
        title: "Sucesso!",
        description: `${produtosSelecionados.length} produtos duplicados!`,
      });

      // Fechar modal e resetar
      setIsAlteracoesRapidasOpen(false);
      setAlteracaoRapidaSelecionada(null);
      setProdutosSelecionados([]);
    } catch (error) {
      console.error('Erro ao duplicar produtos:', error);
      toast({
        title: "Erro",
        description: "Erro ao duplicar produtos. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDuplicarCategoria = async () => {
    if (produtosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione categorias para duplicar!",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const categoriaId of produtosSelecionados) {
        const categoria = categorias.find(c => c.id === categoriaId);
        if (!categoria) continue;

        // Duplicar a categoria
        const categoriaDuplicada = {
          ...categoria,
          nome: `${categoria.nome} (Cópia)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        delete categoriaDuplicada.id; // Remove ID para criar nova categoria
        const novaCategoria = await saveCategoria(categoriaDuplicada);

        // Encontrar todos os produtos desta categoria
        const produtosDaCategoria = produtos.filter(p => p.categoria === categoria.nome);
        
        // Duplicar todos os produtos da categoria
        for (const produto of produtosDaCategoria) {
          const produtoDuplicado = {
            ...produto,
            nome: `${produto.nome} (Cópia)`,
            codigo: `${produto.codigo}-COPY`,
            categoria: `${categoria.nome} (Cópia)`,
            quantidade: 0, // Produto duplicado inicia com estoque zero
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          delete produtoDuplicado.id; // Remove ID para criar novo produto
          await saveProduto(produtoDuplicado);
        }
      }

      toast({
        title: "Sucesso!",
        description: `${produtosSelecionados.length} categoria(s) duplicada(s) com todos os produtos!`,
      });

      // Fechar modal e resetar
      setIsAlteracoesRapidasOpen(false);
      setAlteracaoRapidaSelecionada(null);
      setProdutosSelecionados([]);
    } catch (error) {
      console.error('Erro ao duplicar categorias:', error);
      toast({
        title: "Erro",
        description: "Erro ao duplicar categorias. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleExcluir = async () => {
    if (produtosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione produtos para excluir!",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const produtoId of produtosSelecionados) {
        await removeProduto(produtoId);
      }

      toast({
        title: "Sucesso!",
        description: `${produtosSelecionados.length} produtos excluídos!`,
      });

      // Fechar modal e resetar
      setIsAlteracoesRapidasOpen(false);
      setAlteracaoRapidaSelecionada(null);
      setProdutosSelecionados([]);
    } catch (error) {
      console.error('Erro ao excluir produtos:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir produtos. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleAplicarAlteracoes = async () => {
    setIsAplicandoAlteracoes(true);
    
    try {
    switch (alteracaoRapidaSelecionada) {
      case 'preco':
          await handleAlterarPrecos();
        break;
      case 'estoque':
          await handleAjustarEstoque();
        break;
      case 'categoria':
          await handleTrocarCategoria();
        break;
      case 'ocultar':
          await handleOcultarMostrar();
        break;
      case 'duplicar':
          await handleDuplicar();
          break;
        case 'duplicar_categoria':
          await handleDuplicarCategoria();
        break;
      case 'excluir':
          await handleExcluir();
        break;
      default:
        toast({
          title: "Erro",
          description: "Tipo de alteração não reconhecido!",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao aplicar alterações:', error);
      toast({
        title: "Erro",
        description: "Erro ao aplicar alterações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsAplicandoAlteracoes(false);
    }
  };

  const handleToggleOcultarCategoria = async (categoria) => {
    try {
      const categoriaAtualizada = {
        ...categoria,
        oculto: !categoria.oculto
      };
      
      await saveCategoria(categoriaAtualizada, categoria.id);
      
      toast({ 
        title: "Sucesso!", 
        description: categoria.oculto ? "Categoria exibida!" : "Categoria ocultada!" 
      });
    } catch (error) {
      console.error('[Estoque] ❌ Erro ao alterar visibilidade da categoria:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao alterar visibilidade da categoria. Tente novamente.",
        variant: "destructive" 
      });
    }
  };

  // Função para abrir imagem em modal

  const openImageModal = (imageSrc, title) => {
    setSelectedImage(imageSrc);

    setSelectedImageTitle(title);
    setIsImageModalOpen(true);
  };


  // ---------- AUTОCOMPLETE ----------
  const handleBuscaProduto = (termo) => {
    setBuscaProduto(termo);
    if (termo.length > 0) {
      const filtrados = produtos.filter(p => 
        p.nome.toLowerCase().includes(termo.toLowerCase()) ||
        p.codigo.toLowerCase().includes(termo.toLowerCase())
      );
      setProdutosFiltrados(filtrados);
      setMostrarSugestoes(true);
    } else {
      setProdutosFiltrados([]);
      setMostrarSugestoes(false);
    }
  };

  const selecionarProduto = (produto) => {
    setMovData({ ...movData, produtoId: produto.id });
    setBuscaProduto(produto.nome);
    setMostrarSugestoes(false);
  };

  // Limpar busca quando modal fechar
  useEffect(() => {
    if (!isMovDialogOpen) {
      setBuscaProduto('');
      setProdutosFiltrados([]);
      setMostrarSugestoes(false);
    }
  }, [isMovDialogOpen]);

  // ---------- MOVIMENTAÇÃO ----------

  const handleMovimentacao = async (e) => {
    e.preventDefault();
    
    // Verificar permissão de criação
    if (!canCreate('estoque')) return;
    
    if (!movData.produtoId || !movData.quantidade) {
      toast({ title: "Erro", description: "Produto e quantidade são obrigatórios!", variant: "destructive" });
      return;
    }


    try {
      const produto = produtos.find(p => p.id === movData.produtoId);
    const quantidade = parseInt(movData.quantidade);

    if (movData.tipo === 'saida' && produto.quantidade < quantidade) {
      toast({ title: "Erro", description: "Quantidade insuficiente em estoque!", variant: "destructive" });
      return;
    }


      // Salvar movimentação
      await saveMovimentacao({
        produtoId: movData.produtoId,
      produtoNome: produto.nome,
      tipo: movData.tipo,

        quantidade: quantidade,
      observacao: movData.observacao,
      createdAt: new Date().toISOString()

      });

      // Atualizar quantidade do produto
      const produtoAtualizado = {
        ...produto,
        quantidade: movData.tipo === 'entrada' 
          ? produto.quantidade + quantidade 
          : produto.quantidade - quantidade
      };

      await saveProduto(produtoAtualizado, produto.id);

    toast({ title: "Sucesso!", description: `Movimentação de ${movData.tipo} registrada!` });

    setMovData({ produtoId: '', tipo: 'entrada', quantidade: '', observacao: '' });
    setIsMovDialogOpen(false);

    } catch (error) {
      console.error('[Estoque] ❌ Erro ao registrar movimentação:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao registrar movimentação. Tente novamente.",
        variant: "destructive" 
      });
    }
  };

  // ---------- FILTRO DE MOVIMENTAÇÕES ----------
  const hoje = new Date().toISOString().slice(0, 10);

  const movimentacoesFiltradas = (movimentacoes || []).filter(m => {
    // Filtro por data
    const createdAtStr = m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : m.createdAt;
    const dataMovimentacao = createdAtStr?.slice(0, 10);
    
    let filtroData = true;
    if (dataInicial && dataFinal) {
      filtroData = dataMovimentacao >= dataInicial && dataMovimentacao <= dataFinal;
    } else if (dataInicial) {
      filtroData = dataMovimentacao >= dataInicial;
    } else if (dataFinal) {
      filtroData = dataMovimentacao <= dataFinal;
    }
    
    // Filtro por pesquisa
    const filtroPesquisa = !movementSearchTerm || 
      m.produtoNome?.toLowerCase().includes(movementSearchTerm.toLowerCase()) ||
      m.observacao?.toLowerCase().includes(movementSearchTerm.toLowerCase()) ||
      m.tipo?.toLowerCase().includes(movementSearchTerm.toLowerCase());
    
    return filtroData && filtroPesquisa;
  });

  const movimentacoesHoje = movimentacoesFiltradas.filter(m => {
    const createdAtStr = m.createdAt?.toDate ? m.createdAt.toDate().toISOString() : m.createdAt;
    return createdAtStr?.slice(0, 10) === hoje;
  });

  // ---------- PAGINAÇÃO ----------
  const totalPages = Math.ceil(movimentacoesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const movimentacoesPaginadas = movimentacoesFiltradas.slice(startIndex, endIndex);

  // Reset página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [movementSearchTerm, dataInicial, dataFinal]);

  const filteredProdutos = (produtos || [])
    .filter(produto =>
      produto.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999)); // Ordenar por ordem

  // ---------- UPLOAD DE IMAGEM COM DRAG & DROP ----------
  const onDrop = (acceptedFiles) => {

    console.log('[Estoque] ===== UPLOAD DE IMAGEM =====');
    console.log('[Estoque] Arquivos aceitos:', acceptedFiles);
    
    if (acceptedFiles.length === 0) {
      console.log('[Estoque] ❌ Nenhum arquivo aceito');
      return;
    }
    
    const file = acceptedFiles[0];

    console.log('[Estoque] Arquivo selecionado:', file);
    
    // Verificar tamanho do arquivo (máximo 2MB para Firestore)
    if (file.size > 2 * 1024 * 1024) {
      console.log('[Estoque] ❌ Arquivo muito grande:', file.size);
      toast({
        title: "Arquivo muito grande!",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {

      // Comprimir imagem antes de salvar
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Redimensionar para máximo 1000x1000
        const maxSize = 1000;
        let { width, height } = img;
        
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
        
        console.log('[Estoque] ✅ Imagem comprimida, tamanho original:', reader.result.length, 'comprimida:', compressedBase64.length);
        setFormData(prev => ({ ...prev, imagem: compressedBase64 }));
      };
      
      img.src = reader.result;
    };
    
    reader.onerror = () => {
      console.log('[Estoque] ❌ Erro ao ler arquivo');
      toast({
        title: "Erro ao carregar imagem!",
        description: "Tente novamente com outro arquivo.",
        variant: "destructive"
      });
    };
    
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  // Produtos em estoque crítico
  const produtosCriticos = produtos.filter(p => p.quantidade <= 5);


  // ---------- FUNÇÕES DE REORDENAÇÃO DE CATEGORIAS ----------
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newCategorias = [...categoriasReordenadas];
      const draggedItem = newCategorias[draggedIndex];
      newCategorias.splice(draggedIndex, 1);
      newCategorias.splice(dragOverIndex, 0, draggedItem);
      setCategoriasReordenadas(newCategorias);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const salvarNovaOrdem = async () => {
    try {
      console.log('[Estoque] 🚀 Iniciando salvamento da nova ordem das categorias');
      console.log('[Estoque] Categorias reordenadas:', categoriasReordenadas.map(c => ({ id: c.id, nome: c.nome, ordemAtual: c.ordem })));
      
      let categoriasAtualizadas = 0;
      
      // Atualizar cada categoria com a nova ordem, usando o ID existente
      for (let i = 0; i < categoriasReordenadas.length; i++) {
        const categoria = categoriasReordenadas[i];
        const ordemAtual = categoria.ordem ?? -1; // Usar -1 se ordem for undefined/null
        
        // Verificar se a ordem realmente mudou para evitar operações desnecessárias
        if (ordemAtual !== i) {
          console.log(`[Estoque] Atualizando categoria "${categoria.nome}" (ID: ${categoria.id}) da ordem ${ordemAtual} para ${i}`);
          
          // IMPORTANTE: Passar o ID da categoria para atualizar o documento existente
          const categoriaAtualizada = {
            ...categoria,
            ordem: i,
            updatedAt: new Date().toISOString()
          };
          
          console.log('[Estoque] Dados a serem salvos:', categoriaAtualizada);
          
          const resultado = await saveCategoria(categoriaAtualizada, categoria.id);
          console.log('[Estoque] Resultado do salvamento:', resultado);
          
          categoriasAtualizadas++;
        } else {
          console.log(`[Estoque] Categoria "${categoria.nome}" já está na ordem correta (${i}), pulando...`);
        }
      }
      
      console.log(`[Estoque] ✅ Salvamento concluído! ${categoriasAtualizadas} categorias atualizadas`);
      
      toast({
        title: "Sucesso!",
        description: `Ordem de ${categoriasAtualizadas} categorias salva com sucesso!`,
      });
      
      // Aguardar um pouco antes de fechar para garantir que os dados foram atualizados
      setTimeout(() => {
        setIsReordenarOpen(false);
      }, 1000);
    } catch (error) {
      console.error('[Estoque] ❌ Erro ao salvar ordem das categorias:', error);
      console.error('[Estoque] Stack trace:', error.stack);
      toast({
        title: "Erro!",
        description: `Erro ao salvar ordem das categorias: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const aplicarOrdenacao = (tipo) => {
    let categoriasOrdenadas = [...categorias];
    
    switch (tipo) {
      case 'alfabetica':
        categoriasOrdenadas.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      case 'mais_produtos':
        categoriasOrdenadas.sort((a, b) => {
          const produtosA = produtos.filter(p => p.categoriaId === a.id).length;
          const produtosB = produtos.filter(p => p.categoriaId === b.id).length;
          return produtosB - produtosA;
        });
        break;
      case 'menos_produtos':
        categoriasOrdenadas.sort((a, b) => {
          const produtosA = produtos.filter(p => p.categoriaId === a.id).length;
          const produtosB = produtos.filter(p => p.categoriaId === b.id).length;
          return produtosA - produtosB;
        });
        break;
      default:
        categoriasOrdenadas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    }
    
    setCategoriasReordenadas(categoriasOrdenadas);
  };

  // Funções de reordenação de produtos
  const handleDragStartProduto = (index) => {
    console.log('[Estoque] Drag start produto:', index);
    setDraggedIndexProduto(index);
  };

  const handleDragOverProduto = (e, index) => {
    e.preventDefault();
    console.log('[Estoque] Drag over produto:', index);
    setDragOverIndexProduto(index);
  };

  const handleDropProduto = (e) => {
    e.preventDefault();
    console.log('[Estoque] handleDropProduto chamado');
    console.log('[Estoque] draggedIndexProduto:', draggedIndexProduto);
    console.log('[Estoque] dragOverIndexProduto:', dragOverIndexProduto);
    
    if (draggedIndexProduto !== null && dragOverIndexProduto !== null && draggedIndexProduto !== dragOverIndexProduto) {
      const newProdutos = [...produtosReordenados];
      const draggedItem = newProdutos[draggedIndexProduto];
      newProdutos.splice(draggedIndexProduto, 1);
      newProdutos.splice(dragOverIndexProduto, 0, draggedItem);
      console.log('[Estoque] Nova ordem dos produtos:', newProdutos.map(p => p.nome));
      setProdutosReordenados(newProdutos);
    }
    setDraggedIndexProduto(null);
    setDragOverIndexProduto(null);
  };

  const handleDragEndProduto = () => {
    console.log('[Estoque] handleDragEndProduto chamado');
    setDraggedIndexProduto(null);
    setDragOverIndexProduto(null);
  };

  const salvarNovaOrdemProdutos = async () => {
    try {
      console.log('[Estoque] 🚀 Iniciando salvamento da nova ordem dos produtos');
      console.log('[Estoque] Total de produtos para processar:', produtosReordenados.length);
      console.log('[Estoque] Produtos reordenados:', produtosReordenados.map(p => ({ id: p.id, nome: p.nome, ordemAtual: p.ordem })));
      
      let produtosAtualizados = 0;
      
      // Atualizar cada produto com a nova ordem
      for (let i = 0; i < produtosReordenados.length; i++) {
        const produto = produtosReordenados[i];
        const ordemAtual = produto.ordem ?? -1; // Usar -1 se ordem for undefined/null
        
        // Verificar se a ordem realmente mudou para evitar operações desnecessárias
        console.log(`[Estoque] Verificando produto "${produto.nome}": ordemAtual=${ordemAtual}, novaOrdem=${i}`);
        
        if (ordemAtual !== i) {
          console.log(`[Estoque] ✅ Atualizando produto "${produto.nome}" (ID: ${produto.id}) da ordem ${ordemAtual} para ${i}`);
          
          const produtoAtualizado = {
            ...produto,
            ordem: i,
            updatedAt: new Date().toISOString()
          };
          
          console.log('[Estoque] Dados a serem salvos:', produtoAtualizado);
          
          try {
            const resultado = await saveProduto(produtoAtualizado, produto.id);
            console.log('[Estoque] ✅ Resultado do salvamento:', resultado);
            produtosAtualizados++;
          } catch (saveError) {
            console.error(`[Estoque] ❌ Erro ao salvar produto "${produto.nome}":`, saveError);
            throw saveError;
          }
        } else {
          console.log(`[Estoque] ⏭️ Produto "${produto.nome}" já está na ordem correta (${i}), pulando...`);
        }
      }
      
      console.log(`[Estoque] ✅ Salvamento concluído! ${produtosAtualizados} produtos atualizados`);
      
      toast({
        title: "Sucesso!",
        description: `Ordem de ${produtosAtualizados} produtos salva com sucesso!`,
      });
      
      // Aguardar um pouco antes de fechar para garantir que os dados foram atualizados
      setTimeout(() => {
        setIsReordenarProdutosOpen(false);
        setCategoriaProdutosReordenar(null);
      }, 1000);
    } catch (error) {
      console.error('[Estoque] ❌ Erro ao salvar ordem dos produtos:', error);
      console.error('[Estoque] Stack trace:', error.stack);
      toast({
        title: "Erro!",
        description: `Erro ao salvar ordem dos produtos: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const aplicarOrdenacaoProdutos = (tipo) => {
    let produtosOrdenados = [...produtosReordenados];
    
    switch (tipo) {
      case 'alfabetica':
        produtosOrdenados.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      case 'preco_maior':
        produtosOrdenados.sort((a, b) => b.preco - a.preco);
        break;
      case 'preco_menor':
        produtosOrdenados.sort((a, b) => a.preco - b.preco);
        break;
      case 'estoque_maior':
        produtosOrdenados.sort((a, b) => b.quantidade - a.quantidade);
        break;
      case 'estoque_menor':
        produtosOrdenados.sort((a, b) => a.quantidade - b.quantidade);
        break;
      default:
        produtosOrdenados.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    }
    
    setProdutosReordenados(produtosOrdenados);
  };

  // Inicializar categorias reordenadas quando modal abre
  useEffect(() => {
    if (isReordenarOpen) {
      // Ordenar categorias pela ordem atual antes de inicializar e garantir que todas tenham um campo ordem
      const categoriasOrdenadas = [...categorias]
        .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999))
        .map((categoria, index) => ({
          ...categoria,
          ordem: categoria.ordem ?? index // Definir ordem se não existir
        }));
      setCategoriasReordenadas(categoriasOrdenadas);
    }
  }, [isReordenarOpen]); // Removido 'categorias' das dependências

  // Inicializar produtos reordenados quando modal abre
  useEffect(() => {
    if (isReordenarProdutosOpen && categoriaProdutosReordenar) {
      console.log('[Estoque] 🔄 Inicializando reordenação de produtos para categoria:', categoriaProdutosReordenar.nome);
      const produtosDaCategoria = produtos.filter(p => p.categoriaId === categoriaProdutosReordenar.id);
      console.log('[Estoque] Produtos da categoria encontrados:', produtosDaCategoria.length);
      console.log('[Estoque] Produtos antes da ordenação:', produtosDaCategoria.map(p => ({ nome: p.nome, ordem: p.ordem })));
      
      // Ordenar produtos pela ordem atual antes de inicializar e garantir que todos tenham um campo ordem
      const produtosOrdenados = [...produtosDaCategoria]
        .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999))
        .map((produto, index) => ({
          ...produto,
          ordem: produto.ordem ?? index // Definir ordem se não existir
        }));
      
      console.log('[Estoque] Produtos após ordenação e atribuição de ordem:', produtosOrdenados.map(p => ({ nome: p.nome, ordem: p.ordem })));
      setProdutosReordenados(produtosOrdenados);
    }
  }, [isReordenarProdutosOpen, categoriaProdutosReordenar]); // Removido 'produtos' das dependências

  // Debug básico
  console.log('[Estoque] Produtos:', produtos?.length, 'Categorias:', categorias?.length);

  return (
    <div className="space-y-6">
      {/* HEADER COM GRADIENTE E ESTATÍSTICAS */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-2xl p-6 text-white"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">📦 Estoque</h1>
            <p className="text-orange-100 text-lg">Gerencie categorias, produtos e movimentações</p>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col gap-3"
          >
            {/* AVISO DE ESTOQUE CRÍTICO - CLICÁVEL */}
            {produtosCriticos.length > 0 && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => setIsEstoqueCriticoModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg p-3 transition-all duration-200 cursor-pointer flex items-center gap-3"
              >
                <AlertTriangle className="h-5 w-5 text-yellow-200 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Estoque Crítico
                  </p>
                  <p className="text-xs text-orange-100">
                    {produtosCriticos.length} produto(s)
                  </p>
                </div>
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* CARDS DE ESTATÍSTICAS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Package className="h-5 w-5 text-blue-200" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Total Produtos</p>
                <p className="text-white text-2xl font-bold">{produtos?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FolderTree className="h-5 w-5 text-green-200" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Categorias</p>
                <p className="text-white text-2xl font-bold">{categorias?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-200" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Crítico</p>
                <p className="text-white text-2xl font-bold">{produtosCriticos.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-200" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Movimentações</p>
                <p className="text-white text-2xl font-bold">{movimentacoesHoje.length}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* BARRA LATERAL E CONTEÚDO PRINCIPAL */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* BARRA LATERAL */}
        <aside className="w-full lg:w-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 h-fit">
          <div className="space-y-3">
            <Button
              onClick={() => setCategoriaSelecionada(null)}
              variant="outline"
              className={`w-full justify-start transition-all duration-200 ${
                categoriaSelecionada === null 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl border-emerald-500" 
                  : "hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 hover:border-emerald-300 dark:hover:border-emerald-600 border-slate-300 dark:border-slate-600"
              }`}
            >
              <Package className="h-4 w-4 mr-2" />
              Todos os Produtos
            </Button>
            <Button
              onClick={() => { 
                if (!canCreate('estoque')) return;
                setEditingCategoria(null); 
                setCatForm({ nome: '', cor: '#8b5cf6', oculto: false }); 
                setIsCatDialogOpen(true); 
              }}
              variant="outline"
              className="w-full justify-start bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-violet-500 hover:border-violet-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              <FolderTree className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          <div className="mt-4 space-y-1">
            {[...categorias].sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999)).map(cat => (
              <div key={cat.id} className="flex items-center justify-between group relative">
                <Button
                  onClick={() => setCategoriaSelecionada(cat.id)}
                  variant="ghost"
                  className={`flex-1 justify-start text-left border-l-2 relative overflow-hidden transition-all duration-300 ${cat.oculto ? 'opacity-60' : ''} ${
                    categoriaSelecionada === cat.id 
                      ? "text-white shadow-lg hover:shadow-xl" 
                      : "hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20"
                  }`}
                  style={{ 
                    borderLeftColor: cat.cor,
                    borderRightColor: categoriaSelecionada === cat.id ? cat.cor : 'transparent',
                    borderTopColor: categoriaSelecionada === cat.id ? cat.cor : 'transparent',
                    borderBottomColor: categoriaSelecionada === cat.id ? cat.cor : 'transparent',
                    borderWidth: categoriaSelecionada === cat.id ? '2px' : '0 0 0 2px'
                  }}
                >
                  {cat.nome}
                  {/* Gradiente sutil na ponta esquerda com cor da categoria */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r to-transparent opacity-10 pointer-events-none"
                    style={{ background: `linear-gradient(to right, ${cat.cor || '#8b5cf6'}, transparent)` }}
                  ></div>
                </Button>
                <button 
                  title="Editar categoria" 
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 opacity-100 transition-opacity"
                  onClick={() => { 
                    if (!canEdit('estoque')) return;
                    setEditingCategoria(cat); 
                    setCatForm({ nome: cat.nome, cor: cat.cor || '#8b5cf6', oculto: cat.oculto || false }); 
                    setIsCatDialogOpen(true); 
                  }}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  title={cat.oculto ? "Mostrar categoria" : "Ocultar categoria"}
                  className={`p-1 rounded opacity-100 transition-opacity ${cat.oculto ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/20'}`}
                  onClick={() => handleToggleOcultarCategoria(cat)}
                >
                  {cat.oculto ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button 
                  title="Excluir categoria" 
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-100 transition-opacity"
                  onClick={() => handleDeleteCategoriaClick(cat)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1">
          {/* TABS - MOVIDAS PARA CIMA */}
          <Tabs defaultValue="produtos" className="mb-6">
            <TabsList className={`h-20 px-6 bg-transparent relative overflow-hidden w-full ${gruposEOpcoesAtivo ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
              <TabsTrigger 
                value="produtos" 
                className="px-8 py-5 relative z-10 data-[state=active]:bg-orange-500 data-[state=active]:shadow-xl data-[state=active]:text-white dark:data-[state=active]:bg-orange-500 dark:data-[state=active]:text-white transition-all duration-300 ease-in-out hover:bg-orange-100 dark:hover:bg-orange-900/30 text-base font-semibold flex-1 border-2 border-orange-500/30 hover:border-orange-500/60 data-[state=active]:border-orange-500 rounded-xl hover:scale-105 data-[state=active]:scale-105"
              >
                <Package className="h-5 w-5 mr-3 transition-transform duration-200" />
                Produtos
              </TabsTrigger>
              
              {gruposEOpcoesAtivo && (
                <TabsTrigger 
                  value="opcoes" 
                  className="px-8 py-5 relative z-10 data-[state=active]:bg-green-500 data-[state=active]:shadow-xl data-[state=active]:text-white dark:data-[state=active]:bg-green-500 dark:data-[state=active]:text-white transition-all duration-300 ease-in-out hover:bg-green-100 dark:hover:bg-green-900/30 text-base font-semibold flex-1 border-2 border-green-500/30 hover:border-green-500/60 data-[state=active]:border-green-500 rounded-xl hover:scale-105 data-[state=active]:scale-105"
                >
                  <HamburgerMenuIcon className="h-5 w-5 mr-3 transition-transform duration-200" />
                  Opções
                </TabsTrigger>
              )}
              
              <TabsTrigger 
                value="movimentacoes" 
                className="px-8 py-5 relative z-10 data-[state=active]:bg-red-500 data-[state=active]:shadow-xl data-[state=active]:text-white dark:data-[state=active]:bg-red-500 dark:data-[state=active]:text-white transition-all duration-300 ease-in-out hover:bg-red-100 dark:hover:bg-red-900/30 text-base font-semibold flex-1 border-2 border-red-500/30 hover:border-red-500/60 data-[state=active]:border-red-500 rounded-xl hover:scale-105 data-[state=active]:scale-105"
              >
                <BarChart3 className="h-5 w-5 mr-3 transition-transform duration-200" />
                Movimentações
              </TabsTrigger>
            </TabsList>


            {/* ÁREA DE PRODUTOS */}
            <TabsContent value="produtos" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-6"
              >
              {/* CONTROLES DE BUSCA E FILTROS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* GRUPO ESQUERDO - BUSCA E AÇÕES */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative w-full sm:w-auto sm:max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="Buscar por nome ou código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-auto pl-10" />
                    </div>

                    <Button
                      onClick={() => setIsReordenarOpen(true)}
                      variant="outline"
                      size="sm"
                      className="bg-black text-white hover:bg-gray-700 hover:scale-105 transition-all duration-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Reordenar Categorias
                    </Button>

                    <Button
                      onClick={() => {
                        // Reset ao abrir o modal
                        setAlteracaoRapidaSelecionada(null);
                        setProdutosSelecionados([]);
                        setValorAlteracao('');
                        setTipoAlteracao('percentual');
                        setCategoriaDestino('');
                        setQuantidadeEstoque('');
                        setTipoEstoque('entrada');
                        setIsAlteracoesRapidasOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-black text-white hover:bg-gray-700 hover:scale-105 transition-all duration-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Alterações Rápidas
                    </Button>
              </div>
              
                  {/* GRUPO DIREITO - BOTÕES DE CRIAÇÃO */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

                  {/* BOTÕES DE AÇÃO - MOVIDOS PARA AQUI */}
              <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>

                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-violet-500 hover:border-violet-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      <FolderTree className="h-4 w-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg w-full max-w-[95vw] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 scrollbar-hide">
                    <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
                      <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <FolderTree className="h-6 w-6" />
                        </motion.div>
                        {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitCategoria} className="space-y-6">
                      {/* Seção de Informações */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <Tag className="h-5 w-5 text-blue-500" />
                          Informações da Categoria
                        </h3>
                        
                        <div className="space-y-4">
                    <div>

                            <Label className="text-sm font-medium">Nome da Categoria *</Label>
                            <Input 
                              value={catForm.nome} 
                              onChange={(e) => setCatForm({ ...catForm, nome: e.target.value })} 
                              placeholder="Ex: Eletrônicos, Roupas, Acessórios..."
                              className="mt-1"
                              required 
                            />
                    </div>

                          
                          <div>
                            <Label className="text-sm font-medium">Cor da Categoria *</Label>
                            <div className="mt-2 flex items-center gap-3">
                              <Input 
                                type="color" 
                                value={catForm.cor} 
                                onChange={(e) => setCatForm({ ...catForm, cor: e.target.value })}
                                className="w-16 h-10 rounded-lg border-2 border-slate-300 dark:border-slate-600"
                              />
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600" 
                                  style={{ backgroundColor: catForm.cor }}
                                ></div>
                                <span className="text-sm text-slate-600 dark:text-slate-400">{catForm.cor}</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              💡 Escolha uma cor que represente bem sua categoria
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botões de Ação */}
                      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button 
                          type="submit" 
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2"
                        >
                          {editingCategoria ? 'Atualizar Categoria' : 'Criar Categoria'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => { setIsCatDialogOpen(false); setEditingCategoria(null); setCatForm({ nome: '', cor: '#8b5cf6', oculto: false }); }}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>

                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Novo Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl w-full max-w-[95vw] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 scrollbar-hide">
                    <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
                      <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Package className="h-6 w-6" />
                        </motion.div>
                        {editingProduto ? 'Editar Produto' : 'Novo Produto'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitProduto} className="space-y-6">
                      {/* Seção Principal */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Coluna Esquerda - Informações Básicas */}
                        <div className="space-y-4">
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                              <Package className="h-5 w-5 text-blue-500" />
                              Informações Básicas
                            </h3>
                            
                            <div className="space-y-4">
                    <div>

                                <Label className="text-sm font-medium">Nome do Produto *</Label>
                                <Input 
                                  value={formData.nome} 
                                  onChange={(e) => {
                                    setFormData({ ...formData, nome: e.target.value });
                                    // Gerar código automático se estiver vazio
                                    if (!formData.codigo && e.target.value) {
                                      const codigoAuto = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6) + String(Date.now()).slice(-4);
                                      setFormData(prev => ({ ...prev, codigo: codigoAuto }));
                                    }
                                  }} 
                                  placeholder="Ex: Mouse Gamer RGB"
                                  className="mt-1"
                                  required 
                                />
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium">Preço *</Label>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  value={formData.preco} 
                                  onChange={(e) => setFormData({ ...formData, preco: e.target.value })} 
                                  placeholder="0.00"
                                  className="mt-1"
                                  required 
                                />
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium">Quantidade *</Label>
                                <Input 
                                  type="number" 
                                  value={formData.quantidade} 
                                  onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })} 
                                  placeholder="0"
                                  className="mt-1"
                                  required 
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Categoria */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                              <Tag className="h-5 w-5 text-purple-500" />
                              Categoria
                            </h3>
                            
                            <div>
                              <Label className="text-sm font-medium">Categoria *</Label>
                              <Select value={formData.categoriaId} onValueChange={(v) => setFormData({ ...formData, categoriaId: v })} className="mt-1">
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {categorias.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }}></div>
                                        {cat.nome}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                      </Select>

                            </div>
                          </div>
                    </div>


                        {/* Coluna Direita - Código e Imagem */}
                        <div className="space-y-4">
                          {/* Código Automático */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                              <BarChart3 className="h-5 w-5 text-orange-500" />
                              Código do Produto
                            </h3>
                            
                    <div>

                              <Label className="text-sm font-medium">Código (Gerado Automaticamente)</Label>
                              <div className="mt-1 relative">
                                <Input 
                                  value={formData.codigo} 
                                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} 
                                  placeholder="Será gerado automaticamente"
                                  className="pr-10"
                                  required 
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Gerado automaticamente"></div>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                💡 Código gerado automaticamente baseado no nome do produto
                              </p>
                            </div>
                          </div>

                          {/* Upload de Imagem */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                              <Camera className="h-5 w-5 text-indigo-500" />
                              Imagem do Produto
                            </h3>
                            
                      <div
                        {...getRootProps()}

                              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                                isDragActive 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
                                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                        } ${formData.imagem ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                      >
                        <input {...getInputProps()} />
                        {formData.imagem ? (
                          <div className="space-y-4">
                            <div className="relative inline-block">
                              <img
                                src={formData.imagem}
                                alt="Preview do produto"

                                      className="max-w-full max-h-40 object-contain rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-lg"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({ ...formData, imagem: null });
                                }}

                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                              >

                                      <X className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">

                                    ✨ Clique ou arraste para alterar a imagem
                            </p>
                          </div>
                        ) : (

                                <div className="space-y-4">
                                  <div className="mx-auto w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                    <Camera className="w-10 h-10 text-slate-400" />
                                  </div>
                          <div>

                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                      {isDragActive ? '🎯 Solte a imagem aqui' : '📷 Arraste uma imagem ou clique para selecionar'}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                      PNG, JPG até 2MB • Redimensionada para 1000x1000px
                                </p>
                              </div>
                          </div>
                        )}
                            </div>
                          </div>
                      </div>
                    </div>


                      {/* Botões de Ação */}
                      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button 
                          type="submit" 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2"
                        >
                          {editingProduto ? 'Atualizar Produto' : 'Cadastrar Produto'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => { 
                            setIsDialogOpen(false); 
                            setEditingProduto(null); 
                            setFormData({ nome: '', codigo: '', preco: '', quantidade: '', categoriaId: '', imagem: null, oculto: false }); 
                          }}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isMovDialogOpen} onOpenChange={setIsMovDialogOpen}>
                <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-500 hover:border-orange-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Movimentação
                    </Button>
                </DialogTrigger>

                  <DialogContent className={`sm:max-w-lg bg-white dark:bg-slate-900 ${!darkMode ? 'shadow-xl border-slate-200' : ''}`}>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-orange-500" />
                        Nova Movimentação
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleMovimentacao} className="space-y-6">
                      {/* Seção Principal */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <Package className="h-5 w-5 text-blue-500" />
                          Dados da Movimentação
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="relative">
                            <Label className="text-sm font-medium">Produto *</Label>
                            <div className="mt-1 relative">
                              <Input
                                value={buscaProduto}
                                onChange={(e) => handleBuscaProduto(e.target.value)}
                                placeholder="Digite o nome ou código do produto..."
                                className="pr-10"
                              />
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              
                              {/* Dropdown de sugestões */}
                              {mostrarSugestoes && produtosFiltrados.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto max-w-full scrollbar-hide">
                                  {produtosFiltrados.map(produto => (
                                    <div
                                      key={produto.id}
                                      onClick={() => selecionarProduto(produto)}
                                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-600 last:border-b-0"
                                    >
                                      <div className="flex items-center gap-3">
                                        {produto.imagem && (
                                          <img
                                            src={produto.imagem}
                                            alt={produto.nome}
                                            className="w-8 h-8 object-cover rounded border"
                                          />
                                        )}
                                        <div className="flex-1">
                                          <p className="font-medium text-slate-900 dark:text-white">{produto.nome}</p>
                                          <p className="text-xs text-slate-500">Código: {produto.codigo} | Estoque: {produto.quantidade}</p>
                    </div>

                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              💡 Digite o nome ou código do produto para buscar
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                    <div>

                              <Label className="text-sm font-medium">Tipo de Movimentação *</Label>
                              <Select value={movData.tipo} onValueChange={(v) => handleTipoMovimentacaoChange(v, movData.produtoId)} className="mt-1">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                        <SelectContent>

                                  <SelectItem value="entrada">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-green-500" />
                                      Entrada
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="saida">
                                    <div className="flex items-center gap-2">
                                      <TrendingDown className="h-4 w-4 text-red-500" />
                                      Saída
                                    </div>
                                  </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                            
                            <div>
                              <Label className="text-sm font-medium">Quantidade *</Label>
                              <Input 
                                type="number" 
                                min="1"
                                value={movData.quantidade} 
                                onChange={(e) => setMovData({ ...movData, quantidade: e.target.value })} 
                                placeholder="0"
                                className="mt-1"
                                required 
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Observação</Label>
                            <Input 
                              value={movData.observacao} 
                              onChange={(e) => setMovData({ ...movData, observacao: e.target.value })} 
                              placeholder="Ex: Compra, venda, ajuste de estoque..."
                              className="mt-1"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              💡 Descreva o motivo da movimentação
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botões de Ação */}
                      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button 
                          type="submit" 
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2"
                        >
                          Registrar Movimentação
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => { setIsMovDialogOpen(false); setMovData({ produtoId: '', tipo: 'entrada', quantidade: '', observacao: '' }); }}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
                </div>
              </motion.div>

              {/* PRODUTOS POR CATEGORIA */}
              {categoriaSelecionada === null ? (
                [...categorias].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(cat => {
                  const produtosDaCategoria = filteredProdutos.filter(p => p.categoriaId === cat.id);
                  if (produtosDaCategoria.length === 0) return null;
                  
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-4"
                    >
                      {/* BARRA DE CATEGORIA */}
                      <div className={`bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl p-4 border-2 ${cat.oculto ? 'border-red-500 bg-red-50/30 dark:bg-red-900/10' : ''}`} style={{ borderColor: cat.oculto ? '#ef4444' : cat.cor }}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: cat.cor }}></div>
                            <h2 className="font-bold text-slate-900 dark:text-white text-xl">{cat.nome}</h2>
                            {cat.oculto && <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">Oculto</span>}
                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm px-3 py-1 rounded-full font-medium">
                              {produtosDaCategoria.length} produtos
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              title="Reordenar produtos"
                              onClick={() => { setCategoriaProdutosReordenar(cat); setIsReordenarProdutosOpen(true); }}
                              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Menu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => { 
                                if (!canCreate('estoque')) return;
                                setEditingProduto(null); 
                                setFormData({ nome: '', codigo: '', preco: '', quantidade: '', categoriaId: cat.id.toString(), imagem: null, oculto: false }); 
                                setIsDialogOpen(true); 
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Novo Produto
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* GRID DE PRODUTOS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {produtosDaCategoria.map((produto, index) => (
                          <motion.div 
                            key={produto.id} 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={`bg-white dark:bg-slate-800 rounded-xl p-4 border-2 hover:shadow-xl transition-all duration-300 group ${produto.oculto ? 'border-red-500 bg-red-50/30 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'}`}
                          >
                            <div className="flex gap-3">
                              {/* IMAGEM */}
                              {produto.imagem && (
                                <div className="flex-shrink-0 flex items-center justify-center">
                                  <img
                                    src={produto.imagem}
                                    alt={produto.nome}
                                    className="w-24 h-24 object-cover rounded-lg shadow-md border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-all duration-200"
                                    onClick={() => openImageModal(produto.imagem, produto.nome)}
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {produto.oculto && <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">Oculto</span>}
                                  <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {produto.nome}
                                  </h3>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Código: {produto.codigo}</p>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                                    <BarChart3 className="h-4 w-4" />
                                    <span className={`text-sm font-semibold ${produto.quantidade <= 5 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                      {produto.quantidade} {produto.quantidade <= 5 && '(Baixo)'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-1 opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditProduto(produto)}
                                  className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleOcultarProduto(produto)}
                                  className={`h-8 w-8 ${produto.oculto ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900/20'}`}
                                  title={produto.oculto ? "Mostrar produto" : "Ocultar produto"}
                                >
                                  {produto.oculto ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteProdutoClick(produto)}
                                  className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })

              ) : (
                [...categorias].filter(cat => cat.id === categoriaSelecionada).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(cat => {
                  const produtosDaCategoria = filteredProdutos.filter(p => p.categoriaId === cat.id);
                  
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-4"
                    >
                      {/* BARRA DE CATEGORIA */}
                      <div className={`bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl p-4 border-2 ${cat.oculto ? 'border-red-500 bg-red-50/30 dark:bg-red-900/10' : ''}`} style={{ borderColor: cat.oculto ? '#ef4444' : cat.cor }}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: cat.cor }}></div>
                            <h2 className="font-bold text-slate-900 dark:text-white text-xl">{cat.nome}</h2>
                            {cat.oculto && <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">Oculto</span>}
                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm px-3 py-1 rounded-full font-medium">
                              {produtosDaCategoria.length} produtos
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              title="Reordenar produtos"
                              onClick={() => { setCategoriaProdutosReordenar(cat); setIsReordenarProdutosOpen(true); }}
                              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Menu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => { 
                                if (!canCreate('estoque')) return;
                                setEditingProduto(null); 
                                setFormData({ nome: '', codigo: '', preco: '', quantidade: '', categoriaId: cat.id.toString(), imagem: null, oculto: false }); 
                                setIsDialogOpen(true); 
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Novo Produto
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* GRID DE PRODUTOS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {produtosDaCategoria.map((produto, index) => (
                          <motion.div 
                            key={produto.id} 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={`bg-white dark:bg-slate-800 rounded-xl p-4 border-2 hover:shadow-xl transition-all duration-300 group ${produto.oculto ? 'border-red-500 bg-red-50/30 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'}`}
                          >
                            <div className="flex gap-3">
                              {/* IMAGEM */}
                              {produto.imagem && (
                                <div className="flex-shrink-0 flex items-center justify-center">
                                  <img
                                    src={produto.imagem}
                                    alt={produto.nome}
                                    className="w-24 h-24 object-cover rounded-lg shadow-md border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition-all duration-200"
                                    onClick={() => openImageModal(produto.imagem, produto.nome)}
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {produto.oculto && <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">Oculto</span>}
                                  <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {produto.nome}
                                  </h3>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Código: {produto.codigo}</p>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                                    <DollarSign className="h-4 w-4" />
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                                    <BarChart3 className="h-4 w-4" />
                                    <span className={`text-sm font-semibold ${produto.quantidade <= 5 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                      {produto.quantidade} {produto.quantidade <= 5 && '(Baixo)'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-1 opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditProduto(produto)}
                                  className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleOcultarProduto(produto)}
                                  className={`h-8 w-8 ${produto.oculto ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900/20'}`}
                                  title={produto.oculto ? "Mostrar produto" : "Ocultar produto"}
                                >
                                  {produto.oculto ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteProdutoClick(produto)}
                                  className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })
              )}
              
              {/* MENSAGEM QUANDO NÃO HÁ PRODUTOS */}
              {filteredProdutos.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {searchTerm ? 'Tente buscar com outros termos' : 'Cadastre produtos para começar a gerenciar seu estoque'}
                  </p>
                  {!searchTerm && (
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => {
                          if (!canCreate('estoque')) return;
                          setIsDialogOpen(true);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Cadastrar Produto
                      </Button>
                      <Button
                        onClick={() => {
                          if (!canCreate('estoque')) return;
                          setIsCatDialogOpen(true);
                        }}
                        variant="outline"
                        className="border-violet-500 text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-semibold px-6 py-3"
                      >
                        <FolderTree className="h-5 w-5 mr-2" />
                        Criar Categoria
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
              </motion.div>
            </TabsContent>

            {/* OPÇÕES */}
            {gruposEOpcoesAtivo && (
              <TabsContent value="opcoes" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <HamburgerMenuIcon className="h-7 w-7 text-green-600 dark:text-green-400" />
                        Grupos e Opções
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Gerencie grupos de opções e vincule-os a produtos ou categorias
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <HamburgerMenuIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Sistema de Opções
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Crie grupos de opções e vincule-os aos seus produtos
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-slate-900 dark:text-white">Grupos de Opções</h4>
                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          <p>• <strong>Adicionais:</strong> Queijo extra, bacon, azeitona</p>
                          <p>• <strong>Tamanhos:</strong> Pequeno, médio, grande</p>
                          <p>• <strong>Cores:</strong> Vermelho, azul, verde</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium text-slate-900 dark:text-white">Vinculação</h4>
                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          <p>• Vincule grupos a produtos específicos</p>
                          <p>• Ou vincule a categorias inteiras</p>
                          <p>• Clientes escolhem quantidades no módulo de vendas</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h5 className="font-medium text-blue-900 dark:text-blue-100">
                            Em desenvolvimento
                          </h5>
                          <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                            Esta funcionalidade está sendo implementada. Em breve você poderá criar e gerenciar grupos de opções para seus produtos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            )}

            {/* MOVIMENTAÇÕES */}
            <TabsContent value="movimentacoes" className="space-y-6">
              {/* FILTROS DE MOVIMENTAÇÕES */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Filtro por Data Inicial */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data Inicial</Label>
                    <Input
                      type="date"
                      value={dataInicial}
                      onChange={(e) => setDataInicial(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  {/* Filtro por Data Final */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data Final</Label>
                    <Input
                      type="date"
                      value={dataFinal}
                      onChange={(e) => setDataFinal(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  {/* Pesquisa */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pesquisar</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Produto, observação ou tipo..."
                        value={movementSearchTerm}
                        onChange={(e) => setMovementSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Botão Limpar Filtros */}
                {(dataInicial || dataFinal || movementSearchTerm) && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDataInicial('');
                        setDataFinal('');
                        setMovementSearchTerm('');
                        setCurrentPage(1);
                      }}
                      className="text-slate-600 dark:text-slate-400"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-6"
              >
              {movimentacoesFiltradas.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {movementSearchTerm || dataInicial || dataFinal ? 'Nenhuma movimentação encontrada' : 'Nenhuma movimentação hoje'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {movementSearchTerm || dataInicial || dataFinal ? 'Tente ajustar os filtros de pesquisa' : 'As movimentações de entrada e saída aparecerão aqui'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => setIsMovDialogOpen(true)}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Nova Movimentação
                    </Button>
                    <Button
                      onClick={() => setActiveModule('ov')}
                      variant="outline"
                      className="border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold px-6 py-3"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Ir para Vendas
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <>
                <div className="space-y-4">
                  {movimentacoesPaginadas.map((mov, index) => (
                    <motion.div 
                      key={mov.id} 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`bg-white dark:bg-slate-800 rounded-xl p-4 border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
                        mov.tipo === 'entrada' 
                          ? 'border-green-200 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10' 
                          : 'border-red-200 dark:border-red-700 bg-red-50/30 dark:bg-red-900/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${
                              mov.tipo === 'entrada' 
                                ? 'bg-green-100 dark:bg-green-900/30' 
                                : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                              {mov.tipo === 'entrada' ? (
                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {mov.produtoNome}
                              </h4>
                              <p className={`text-sm font-medium ${
                                mov.tipo === 'entrada' 
                                  ? 'text-green-700 dark:text-green-300' 
                                  : 'text-red-700 dark:text-red-300'
                              }`}>
                                {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'} de {mov.quantidade} unidades
                              </p>
                            </div>
                          </div>
                          
                          {mov.observacao && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 bg-slate-100 dark:bg-slate-700/50 p-2 rounded border-l-2 border-slate-300 dark:border-slate-600">
                              <span className="font-medium">Obs:</span> {mov.observacao}
                            </p>
                          )}
                          
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {new Date(mov.createdAt?.toDate ? mov.createdAt.toDate() : mov.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        
                        {/* Botão de exclusão */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMovimentacaoClick(mov)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* PAGINAÇÃO */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    {/* Informações da página */}
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, movimentacoesFiltradas.length)} de {movimentacoesFiltradas.length} movimentações
                    </div>
                    
                    {/* Controles de paginação */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1"
                      >
                        Anterior
                      </Button>
                      
                      {/* Números das páginas */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1"
                      >
                        Próximo
                      </Button>
                    </div>
                  </motion.div>
                )}
                </>
              )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>


      {/* MODAL DE ZOOM DA IMAGEM - VISUAL MELHORADO */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>

        <DialogContent className={`sm:max-w-4xl w-full max-w-[90vw] bg-white dark:bg-slate-900 border-0 p-0 overflow-hidden ${!darkMode ? 'shadow-2xl' : ''}`}>
          <DialogHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <ZoomIn className="h-7 w-7" />
              {selectedImageTitle}
            </DialogTitle>
          </DialogHeader>

          
          <div className="relative bg-slate-50 dark:bg-slate-800 min-h-[60vh] flex items-center justify-center p-8">
            {selectedImage && (
              <div className="relative group w-full h-full flex flex-col items-center justify-center">
                {/* Imagem principal com efeitos */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative overflow-hidden rounded-2xl shadow-2xl bg-white p-4"
                >
                  <img
                    src={selectedImage}
                    alt={selectedImageTitle}
                    className="max-w-full max-h-[50vh] object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Overlay com informações */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-2xl" />
                  
                  {/* Botão de download */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = selectedImage;
                        link.download = `${selectedImageTitle}.jpg`;
                        link.click();
                      }}
                      className="bg-white/90 hover:bg-white text-slate-900 shadow-lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          
          {/* Rodapé com ações */}
          <div className="bg-slate-100 dark:bg-slate-800 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Camera className="h-4 w-4" />
              Clique fora da imagem ou use ESC para fechar
            </div>
            <Button
              variant="outline"
              onClick={() => setIsImageModalOpen(false)}
              className="bg-white dark:bg-slate-700"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE ALTERAÇÕES RÁPIDAS - SIDEBAR STYLE */}
      <Dialog open={isAlteracoesRapidasOpen} onOpenChange={(open) => {
        setIsAlteracoesRapidasOpen(open);
        if (!open) {
          // Reset ao fechar o modal
          setAlteracaoRapidaSelecionada(null);
          setProdutosSelecionados([]);
          setValorAlteracao('');
          setTipoAlteracao('percentual');
          setCategoriaDestino('');
          setQuantidadeEstoque('');
          setTipoEstoque('entrada');
          setIsAplicandoAlteracoes(false);
        }
      }}>
        <DialogContent className={`max-w-[98vw] w-full h-[95vh] max-h-[95vh] p-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${!darkMode ? 'shadow-2xl border-slate-200' : 'shadow-2xl shadow-slate-900/50'}`}>
          <div className="flex h-full">
            {/* SIDEBAR - NAVEGAÇÃO */}
            <div className="w-80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col">
              {/* HEADER DA SIDEBAR */}
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
                  className="text-center"
            >
                  <DialogTitle className="flex items-center justify-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Settings className="h-6 w-6 text-blue-500" />
                </motion.div>
                Alterações Rápidas
              </DialogTitle>
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
                    🚀 Gerencie seus produtos em massa
              </p>
            </motion.div>
              </div>

              {/* NAVEGAÇÃO LATERAL */}
              <div className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAlteracaoRapidaSelecionada('preco')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'preco'
                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-green-300 hover:shadow-md bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'preco' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  }`}>
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="text-left flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Alterar Preços</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Ajustar preços em massa</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAlteracaoRapidaSelecionada('estoque')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'estoque'
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-md bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'estoque' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="text-left flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Ajustar Estoque</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Modificar quantidades</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAlteracaoRapidaSelecionada('categoria')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'categoria'
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:shadow-md bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'categoria' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  }`}>
                    <Tag className="h-5 w-5" />
                  </div>
                  <div className="text-left flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Trocar Categoria</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Mover para outra categoria</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAlteracaoRapidaSelecionada('ocultar')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'ocultar'
                      ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-orange-300 hover:shadow-md bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'ocultar' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                  }`}>
                    <EyeOff className="h-5 w-5" />
                  </div>
                  <div className="text-left flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Ocultar/Mostrar</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Alterar visibilidade</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAlteracaoRapidaSelecionada('duplicar')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'duplicar'
                      ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:shadow-md bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'duplicar' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="text-left flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Duplicar Produtos</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Criar cópias</p>
                    </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAlteracaoRapidaSelecionada('duplicar_categoria')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'duplicar_categoria'
                      ? 'border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:shadow-md bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'duplicar_categoria' 
                      ? 'bg-teal-500 text-white' 
                      : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                  }`}>
                    <FolderTree className="h-5 w-5" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Duplicar Categorias</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Categoria + produtos</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAlteracaoRapidaSelecionada('excluir')}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'excluir'
                      ? 'border-red-500 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-red-300 hover:shadow-md bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    alteracaoRapidaSelecionada === 'excluir' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div className="text-left flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Excluir Produtos</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Remover permanentemente</p>
                  </div>
                </motion.button>
              </div>

              {/* FOOTER DA SIDEBAR */}
              <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-3">
                {alteracaoRapidaSelecionada && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      onClick={handleAplicarAlteracoes}
                      disabled={produtosSelecionados.length === 0 || isAplicandoAlteracoes}
                      className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAplicandoAlteracoes ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4 mr-2"
                          >
                            <Settings className="h-4 w-4" />
            </motion.div>
                          ⏳ Aplicando...
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          🚀 Aplicar Alterações
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setAlteracaoRapidaSelecionada(null);
                    setProdutosSelecionados([]);
                    setValorAlteracao('');
                    setTipoAlteracao('percentual');
                    setCategoriaDestino('');
                    setQuantidadeEstoque('');
                    setTipoEstoque('entrada');
                    setIsAplicandoAlteracoes(false);
                    setIsAlteracoesRapidasOpen(false);
                  }}
                  className="w-full border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Fechar
                </Button>
              </div>
            </div>

            {/* ÁREA DE CONTEÚDO PRINCIPAL */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* HEADER DO CONTEÚDO */}
              <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                      {alteracaoRapidaSelecionada === 'preco' ? '💰 Alterar Preços' : 
                       alteracaoRapidaSelecionada === 'estoque' ? '📦 Ajustar Estoque' :
                       alteracaoRapidaSelecionada === 'categoria' ? '🏷️ Trocar Categoria' :
                       alteracaoRapidaSelecionada === 'ocultar' ? '👁️ Ocultar/Mostrar' :
                       alteracaoRapidaSelecionada === 'duplicar' ? '📋 Duplicar Produtos' :
                       alteracaoRapidaSelecionada === 'duplicar_categoria' ? '📁 Duplicar Categorias' : '🗑️ Excluir Produtos'}
                    </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Configure os parâmetros e selecione os produtos para aplicar as alterações
                  </p>
                </motion.div>
              </div>

              {/* CONTEÚDO PRINCIPAL */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            {alteracaoRapidaSelecionada && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="space-y-6"
                  >
                <div className="space-y-4">
                  {/* Seleção de produtos/categorias melhorada */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-bold flex items-center gap-2">
                        {alteracaoRapidaSelecionada === 'duplicar_categoria' ? (
                          <>
                            <FolderTree className="h-4 w-4 text-teal-500" />
                            Selecionar Categorias
                          </>
                        ) : (
                          <>
                            <Package className="h-4 w-4 text-blue-500" />
                            Selecionar Produtos
                          </>
                        )}
                      </Label>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {alteracaoRapidaSelecionada === 'duplicar_categoria' ? 
                            produtosSelecionados.length : 
                            produtosSelecionados.length
                          }
                        </span>
                        <span>
                          de {alteracaoRapidaSelecionada === 'duplicar_categoria' ? 
                            categorias.length : 
                            produtos.length
                          } selecionados
                        </span>
                      </div>
                    </div>
                    
                    {/* Controles de seleção */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProdutosSelecionados(
                          alteracaoRapidaSelecionada === 'duplicar_categoria' 
                            ? categorias.map(c => c.id) 
                            : produtos.map(p => p.id)
                        )}
                        className="text-xs px-3 py-1"
                      >
                        Selecionar Todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProdutosSelecionados([])}
                        className="text-xs px-3 py-1"
                      >
                        Limpar Seleção
                      </Button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                      <div className="max-h-96 overflow-y-auto scrollbar-hide">
                        <div className="grid grid-cols-1 gap-1 p-3">
                          {alteracaoRapidaSelecionada === 'duplicar_categoria' ? (
                            // Lista de categorias
                            categorias.map(categoria => {
                              const produtosNaCategoria = produtos.filter(p => p.categoria === categoria.nome);
                              return (
                                <motion.label 
                                  key={categoria.id} 
                                  whileHover={{ scale: 1.01, x: 2 }}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                    produtosSelecionados.includes(categoria.id)
                                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md'
                                      : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={produtosSelecionados.includes(categoria.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setProdutosSelecionados([...produtosSelecionados, categoria.id]);
                                      } else {
                                        setProdutosSelecionados(produtosSelecionados.filter(id => id !== categoria.id));
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 focus:ring-2"
                                  />
                                  <div className="flex items-center gap-3 flex-1">
                                    <div 
                                      className="w-12 h-12 rounded-lg border-2 border-white shadow-sm flex items-center justify-center"
                                      style={{ backgroundColor: categoria.cor }}
                                    >
                                      <FolderTree className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{categoria.nome}</p>
                                      <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                                          📦 {produtosNaCategoria.length} produtos
                                        </span>
                                        {categoria.oculto && (
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                            Oculto
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.label>
                              );
                            })
                          ) : (
                            // Lista de produtos
                            produtos.map(produto => (
                              <motion.label 
                                key={produto.id} 
                                whileHover={{ scale: 1.01, x: 2 }}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                  produtosSelecionados.includes(produto.id)
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                              >
                          <input
                            type="checkbox"
                            checked={produtosSelecionados.includes(produto.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProdutosSelecionados([...produtosSelecionados, produto.id]);
                              } else {
                                setProdutosSelecionados(produtosSelecionados.filter(id => id !== produto.id));
                              }
                            }}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                          />
                          <div className="flex items-center gap-3 flex-1">
                            {produto.imagem && (
                                    <img src={produto.imagem} alt={produto.nome} className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm" />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{produto.nome}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                        💰 R$ {produto.preco}
                                      </span>
                                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                        📦 {produto.quantidade}
                                      </span>
                                      {produto.categoria && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                          {produto.categoria}
                                        </span>
                                      )}
                            </div>
                          </div>
                                </div>
                              </motion.label>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configurações específicas melhoradas */}
                  {alteracaoRapidaSelecionada === 'preco' && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configurações de Preço</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                            <Settings className="h-4 w-4 text-green-500" />
                            Tipo de Alteração
                          </Label>
                        <Select value={tipoAlteracao} onValueChange={setTipoAlteracao}>
                            <SelectTrigger className="h-12 text-base border-2 border-green-200 dark:border-green-800 focus:border-green-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="percentual" className="text-base py-3">
                                📊 Percentual (%)
                              </SelectItem>
                              <SelectItem value="valor_fixo" className="text-base py-3">
                                💰 Valor Fixo (R$)
                              </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                          <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            Valor da Alteração
                          </Label>
                        <Input
                          type="number"
                            step="0.01"
                          value={valorAlteracao}
                          onChange={(e) => setValorAlteracao(e.target.value)}
                            placeholder={tipoAlteracao === 'percentual' ? 'Ex: 10 (para +10%)' : 'Ex: 5.50 (para R$ 5,50)'}
                            className="h-12 text-base border-2 border-green-200 dark:border-green-800 focus:border-green-500"
                          />
                        </div>
                      </div>
                      
                      {valorAlteracao && produtosSelecionados.length > 0 && (
                        <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-green-200 dark:border-green-800">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Preview das Alterações:</h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {produtosSelecionados.length} produto(s) será(ão) alterado(s)
                            {tipoAlteracao === 'percentual' ? ` em ${valorAlteracao}%` : ` para R$ ${valorAlteracao}`}
                      </div>
                        </div>
                      )}
                    </div>
                  )}

                  {alteracaoRapidaSelecionada === 'estoque' && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configurações de Estoque</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            Tipo de Movimentação
                          </Label>
                        <Select value={tipoEstoque} onValueChange={setTipoEstoque}>
                            <SelectTrigger className="h-12 text-base border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="entrada" className="text-base py-3">
                                📈 Entrada (Adicionar)
                              </SelectItem>
                              <SelectItem value="saida" className="text-base py-3">
                                📉 Saída (Remover)
                              </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                          <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                            <Package className="h-4 w-4 text-blue-500" />
                            Quantidade
                          </Label>
                        <Input
                          type="number"
                          value={quantidadeEstoque}
                          onChange={(e) => setQuantidadeEstoque(e.target.value)}
                            placeholder="Ex: 10 unidades"
                            className="h-12 text-base border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      {quantidadeEstoque && produtosSelecionados.length > 0 && (
                        <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Preview das Alterações:</h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {produtosSelecionados.length} produto(s) terá(ão) {quantidadeEstoque} unidades 
                            {tipoEstoque === 'entrada' ? ' adicionadas' : ' removidas'}
                      </div>
                        </div>
                      )}
                    </div>
                  )}

                  {alteracaoRapidaSelecionada === 'categoria' && (
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500 rounded-lg">
                          <Tag className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configurações de Categoria</h3>
                      </div>
                      
                    <div>
                        <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                          <Tag className="h-4 w-4 text-purple-500" />
                          Nova Categoria
                        </Label>
                      <Select value={categoriaDestino} onValueChange={setCategoriaDestino}>
                          <SelectTrigger className="h-12 text-base border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map(cat => (
                              <SelectItem key={cat.id} value={cat.id} className="text-base py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: cat.cor }}></div>
                                  <span className="font-medium">{cat.nome}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      </div>
                      
                      {categoriaDestino && produtosSelecionados.length > 0 && (
                        <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Preview das Alterações:</h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {produtosSelecionados.length} produto(s) será(ão) movido(s) para a categoria selecionada
                          </div>
                    </div>
                  )}

                   {/* Explicações para operações que não precisam de configurações adicionais */}
                   {alteracaoRapidaSelecionada === 'ocultar' && (
                     <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800">
                       <div className="flex items-center gap-3 mb-4">
                         <div className="p-2 bg-orange-500 rounded-lg">
                           <EyeOff className="h-5 w-5 text-white" />
                </div>
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ocultar/Mostrar Produtos</h3>
                       </div>
                       
                       <div className="space-y-4">
                         <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-orange-200 dark:border-orange-800">
                           <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                             <EyeOff className="h-4 w-4 text-orange-500" />
                             Como funciona:
                           </h4>
                           <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                             <p>• <strong>Produtos ocultos:</strong> Serão alternados para visíveis</p>
                             <p>• <strong>Produtos visíveis:</strong> Serão alternados para ocultos</p>
                             <p>• <strong>Resultado:</strong> O status de visibilidade será invertido para cada produto selecionado</p>
                           </div>
                         </div>
                         
                         {produtosSelecionados.length > 0 && (
                           <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-orange-200 dark:border-orange-800">
                             <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Preview das Alterações:</h4>
                             <div className="text-sm text-slate-600 dark:text-slate-400">
                               {produtosSelecionados.length} produto(s) terá(ão) o status de visibilidade alterado
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                   {alteracaoRapidaSelecionada === 'duplicar' && (
                     <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
                       <div className="flex items-center gap-3 mb-4">
                         <div className="p-2 bg-indigo-500 rounded-lg">
                           <Plus className="h-5 w-5 text-white" />
                         </div>
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white">Duplicar Produtos</h3>
                       </div>
                       
                       <div className="space-y-4">
                         <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800">
                           <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                             <Plus className="h-4 w-4 text-indigo-500" />
                             Como funciona:
                           </h4>
                           <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                             <p>• <strong>Nome:</strong> Será adicionado "(Cópia)" ao final</p>
                             <p>• <strong>Código:</strong> Será adicionado "-COPY" ao final</p>
                             <p>• <strong>Estoque:</strong> Iniciará com 0 unidades</p>
                             <p>• <strong>Categoria:</strong> Será mantida a mesma</p>
                             <p>• <strong>Preço:</strong> Será mantido o mesmo</p>
                           </div>
                         </div>
                         
                         {produtosSelecionados.length > 0 && (
                           <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800">
                             <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Preview das Alterações:</h4>
                             <div className="text-sm text-slate-600 dark:text-slate-400">
                               {produtosSelecionados.length} produto(s) será(ão) duplicado(s) com estoque zero
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                   {alteracaoRapidaSelecionada === 'duplicar_categoria' && (
                     <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border-2 border-teal-200 dark:border-teal-800">
                       <div className="flex items-center gap-3 mb-4">
                         <div className="p-2 bg-teal-500 rounded-lg">
                           <FolderTree className="h-5 w-5 text-white" />
                         </div>
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white">Duplicar Categorias</h3>
                       </div>
                       
                       <div className="space-y-4">
                         <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-teal-200 dark:border-teal-800">
                           <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                             <FolderTree className="h-4 w-4 text-teal-500" />
                             Como funciona:
                           </h4>
                           <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                             <p>• <strong>Categoria:</strong> Será duplicada com "(Cópia)" no nome</p>
                             <p>• <strong>Produtos:</strong> Todos os produtos da categoria serão duplicados</p>
                             <p>• <strong>Nomes dos produtos:</strong> Receberão "(Cópia)" no final</p>
                             <p>• <strong>Códigos:</strong> Receberão "-COPY" no final</p>
                             <p>• <strong>Estoque:</strong> Todos os produtos duplicados iniciarão com 0 unidades</p>
                             <p>• <strong>Cores e configurações:</strong> Serão mantidas iguais</p>
                           </div>
                         </div>
                         
                         {produtosSelecionados.length > 0 && (
                           <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-teal-200 dark:border-teal-800">
                             <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Preview das Alterações:</h4>
                             <div className="text-sm text-slate-600 dark:text-slate-400">
                               {produtosSelecionados.length} categoria(s) será(ão) duplicada(s) com todos os produtos
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                   {alteracaoRapidaSelecionada === 'excluir' && (
                     <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-6 border-2 border-red-200 dark:border-red-800">
                       <div className="flex items-center gap-3 mb-4">
                         <div className="p-2 bg-red-500 rounded-lg">
                           <Trash2 className="h-5 w-5 text-white" />
                         </div>
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir Produtos</h3>
                       </div>
                       
                       <div className="space-y-4">
                         <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-300 dark:border-red-700">
                           <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                             <AlertTriangle className="h-4 w-4 text-red-600" />
                             ⚠️ ATENÇÃO - OPERAÇÃO IRREVERSÍVEL:
                           </h4>
                           <div className="text-sm text-red-700 dark:text-red-300 space-y-2">
                             <p>• <strong>EXCLUSÃO PERMANENTE:</strong> Os produtos serão removidos definitivamente</p>
                             <p>• <strong>SEM POSSIBILIDADE DE RECUPERAÇÃO:</strong> Esta ação não pode ser desfeita</p>
                             <p>• <strong>HISTÓRICO:</strong> Todas as movimentações relacionadas aos produtos serão perdidas</p>
                             <p>• <strong>ORDENS DE SERVIÇO:</strong> Produtos em OS ativas podem causar problemas</p>
                             <p>• <strong>RECOMENDAÇÃO:</strong> Considere ocultar os produtos ao invés de excluir</p>
                           </div>
                         </div>
                         
                         <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-800">
                           <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                             <Trash2 className="h-4 w-4 text-red-500" />
                             O que será excluído:
                           </h4>
                           <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                             <p>• Produto e todas as suas informações</p>
                             <p>• Imagens e arquivos relacionados</p>
                             <p>• Histórico de movimentações</p>
                             <p>• Relacionamentos com categorias</p>
                           </div>
                         </div>
                         
                         {produtosSelecionados.length > 0 && (
                           <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl border-2 border-red-300 dark:border-red-700">
                             <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">⚠️ Produtos que serão EXCLUÍDOS:</h4>
                             <div className="text-sm text-red-700 dark:text-red-300 font-semibold">
                               {produtosSelecionados.length} produto(s) será(ão) REMOVIDO(S) PERMANENTEMENTE
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   )}
                 </div>
                   )}
                     </div>
              </motion.div>
                  )}
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE REORDENAÇÃO DE PRODUTOS */}
      <Dialog open={isReordenarProdutosOpen} onOpenChange={setIsReordenarProdutosOpen}>
        <DialogContent className={`sm:max-w-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 ${!darkMode ? 'shadow-2xl border-slate-200' : 'shadow-2xl shadow-slate-900/50'}`}>
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Package className="h-6 w-6 text-blue-500" />
                </motion.div>
                Reordenar Produtos - {categoriaProdutosReordenar?.nome}
              </DialogTitle>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Organize os produtos da categoria da forma que preferir
              </p>
            </motion.div>
          </DialogHeader>
          
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {/* Seletor de tipo de ordenação */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-slate-700 w-full max-w-full"
            >
              <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Tipo de Ordenação:
              </Label>
              <Select value={tipoOrdenacaoProdutos} onValueChange={(value) => {
                setTipoOrdenacaoProdutos(value);
                aplicarOrdenacaoProdutos(value);
              }}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-blue-400 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personalizada">🎯 Personalizada (Arrastar e Soltar)</SelectItem>
                  <SelectItem value="alfabetica">🔤 Ordem Alfabética</SelectItem>
                  <SelectItem value="preco_maior">💰 Maior Preço</SelectItem>
                  <SelectItem value="preco_menor">💸 Menor Preço</SelectItem>
                  <SelectItem value="estoque_maior">📈 Maior Estoque</SelectItem>
                  <SelectItem value="estoque_menor">📉 Menor Estoque</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Lista de produtos para reordenar */}
            <motion.div 
              className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              {produtosReordenados.map((produto, index) => (
                <motion.div
                  key={produto.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  draggable={tipoOrdenacaoProdutos === 'personalizada'}
                  onDragStart={() => handleDragStartProduto(index)}
                  onDragOver={(e) => handleDragOverProduto(e, index)}
                  onDrop={(e) => handleDropProduto(e)}
                  onDragEnd={handleDragEndProduto}
                  className={`group relative p-4 rounded-xl transition-all duration-300 ${
                    draggedIndexProduto === index 
                      ? 'border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 shadow-lg shadow-blue-500/20 scale-105 opacity-50' 
                      : dragOverIndexProduto === index && draggedIndexProduto !== null
                      ? 'border-2 border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg shadow-green-500/20 scale-105'
                      : 'border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg hover:shadow-slate-500/10'
                  } ${tipoOrdenacaoProdutos === 'personalizada' ? 'cursor-move' : 'cursor-default'} ${!darkMode ? 'bg-white/70' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {produto.imagem && (
                        <img
                          src={produto.imagem}
                          alt={produto.nome}
                          className="w-12 h-12 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-700"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {produto.nome}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Código: {produto.codigo} | Preço: R$ {produto.preco} | Estoque: {produto.quantidade}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        #{index + 1}
                      </motion.div>
                      {tipoOrdenacaoProdutos === 'personalizada' && (
                        <motion.div 
                          className="flex flex-col gap-1"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <div className="w-1 h-1 bg-slate-400 rounded-full" />
                          <div className="w-1 h-1 bg-slate-400 rounded-full" />
                          <div className="w-1 h-1 bg-slate-400 rounded-full" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                  {/* Efeito de brilho no hover */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </motion.div>
              ))}
            </motion.div>

            {/* Botões de ação */}
            <motion.div 
              className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <Button
                variant="outline"
                onClick={() => {
                  setIsReordenarProdutosOpen(false);
                  setCategoriaProdutosReordenar(null);
                }}
                className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
              >
                Cancelar
              </Button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={salvarNovaOrdemProdutos}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Salvar Ordem
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE REORDENAÇÃO DE CATEGORIAS */}
      <Dialog open={isReordenarOpen} onOpenChange={setIsReordenarOpen}>
        <DialogContent className={`sm:max-w-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 ${!darkMode ? 'shadow-2xl border-slate-200' : 'shadow-2xl shadow-slate-900/50'}`}>
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </motion.div>
                Reordenar Categorias
              </DialogTitle>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Organize suas categorias da forma que preferir
              </p>
            </motion.div>
          </DialogHeader>
          
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {/* Seletor de tipo de ordenação */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-slate-700 w-full max-w-full"
            >
              <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Tipo de Ordenação:
              </Label>
              <Select value={tipoOrdenacao} onValueChange={(value) => {
                setTipoOrdenacao(value);
                aplicarOrdenacao(value);
              }}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-blue-400 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personalizada">🎯 Personalizada (Arrastar e Soltar)</SelectItem>
                  <SelectItem value="alfabetica">🔤 Ordem Alfabética</SelectItem>
                  <SelectItem value="mais_produtos">📈 Mais Produtos</SelectItem>
                  <SelectItem value="menos_produtos">📉 Menos Produtos</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Lista de categorias para reordenar */}
            <motion.div 
              className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              {categoriasReordenadas.map((categoria, index) => {
                const produtosCategoria = produtos.filter(p => p.categoriaId === categoria.id);
                return (
                  <motion.div
                    key={categoria.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    draggable={tipoOrdenacao === 'personalizada'}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    className={`group relative p-4 rounded-xl transition-all duration-300 ${
                      draggedIndex === index 
                        ? 'border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 shadow-lg shadow-blue-500/20 scale-105 opacity-50' 
                        : dragOverIndex === index && draggedIndex !== null
                        ? 'border-2 border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg shadow-green-500/20 scale-105'
                        : 'border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg hover:shadow-slate-500/10'
                    } ${tipoOrdenacao === 'personalizada' ? 'cursor-move' : 'cursor-default'} ${!darkMode ? 'bg-white/70' : ''}`}
                    style={{ 
                      borderLeftColor: categoria.cor,
                      borderLeftWidth: '4px',
                      boxShadow: draggedIndex === index ? `0 10px 25px -5px ${categoria.cor}20` : undefined
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className="w-6 h-6 rounded-full shadow-lg"
                          style={{ backgroundColor: categoria.cor }}
                          whileHover={{ scale: 1.2 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        />
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {categoria.nome}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {produtosCategoria.length} produto{produtosCategoria.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          #{index + 1}
                        </motion.div>
                        {tipoOrdenacao === 'personalizada' && (
                          <motion.div 
                            className="flex flex-col gap-1"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <div className="w-1 h-1 bg-slate-400 rounded-full" />
                            <div className="w-1 h-1 bg-slate-400 rounded-full" />
                            <div className="w-1 h-1 bg-slate-400 rounded-full" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                    
                    {/* Efeito de brilho no hover */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Botões de ação */}
            <motion.div 
              className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <Button
                variant="outline"
                onClick={() => setIsReordenarOpen(false)}
                className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
              >
                Cancelar
              </Button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={salvarNovaOrdem}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Salvar Ordem
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE ESTOQUE CRÍTICO */}
      <Dialog open={isEstoqueCriticoModalOpen} onOpenChange={setIsEstoqueCriticoModalOpen}>

        <DialogContent className={`sm:max-w-2xl bg-white dark:bg-slate-900 ${!darkMode ? 'shadow-xl border-slate-200' : ''}`}>
          <DialogHeader>

            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Estoque Crítico
            </DialogTitle>
          </DialogHeader>
              <div className="space-y-3">
                  {produtosCriticos.map(produto => {
                    const categoria = categorias.find(c => c.id === produto.categoriaId);
                    return (
                      <motion.div
                        key={produto.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}

                  className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">{produto.nome}</h3>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Categoria: {categoria?.nome || 'Sem categoria'} | 
                        Estoque: <span className="font-bold">{produto.quantidade}</span> unidades
                      </p>
                            </div>

                    <Button
                      size="sm"
                      onClick={() => handleReporEstoque(produto)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Repor Estoque
                    </Button>
                        </div>
                      </motion.div>
                    );
                  })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={deleteType === 'produto' ? handleDeleteProduto : handleDeleteCategoria}
        title={deleteType === 'produto' ? "Excluir Produto" : "Excluir Categoria"}
        description={
          deleteType === 'produto' 
            ? `Tem certeza que deseja excluir o produto "${itemToDelete?.nome}"? Esta ação não pode ser desfeita.`
            : `Tem certeza que deseja excluir a categoria "${itemToDelete?.nome}"? Todos os produtos desta categoria também serão removidos. Esta ação não pode ser desfeita.`
        }
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="delete"
      />

      {/* Modal de Confirmação de Exclusão de Movimentação */}
      <ConfirmDialog
        open={confirmDeleteMovOpen}
        onOpenChange={setConfirmDeleteMovOpen}
        onConfirm={handleDeleteMovimentacao}
        title="Excluir Movimentação"
        description={`Tem certeza que deseja excluir esta movimentação de ${movimentacaoToDelete?.tipo === 'entrada' ? 'entrada' : 'saída'} do produto "${movimentacaoToDelete?.produtoNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="delete"
      />
    </div>
  );
};

export default EstoqueModule;

