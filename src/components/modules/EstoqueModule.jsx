import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Package, TrendingUp, TrendingDown, BarChart3, Upload, X, Eye, Filter, Settings, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const EstoqueModule = () => {
  const [produtos, setProdutos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrupo, setSelectedGrupo] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMovDialogOpen, setIsMovDialogOpen] = useState(false);
  const [isGrupoDialogOpen, setIsGrupoDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    preco: '',
    quantidade: '',
    grupoId: '',
    imagem: null,
    imagemPreview: null
  });
  const [grupoData, setGrupoData] = useState({
    nome: '',
    descricao: '',
    cor: '#3B82F6'
  });
  const [movData, setMovData] = useState({
    produtoId: '',
    tipo: 'entrada',
    quantidade: '',
    observacao: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [imageDialog, setImageDialog] = useState({ open: false, image: null });
  const { toast } = useToast();

  useEffect(() => {
    const savedProdutos = JSON.parse(localStorage.getItem('crm_produtos') || '[]');
    const savedGrupos = JSON.parse(localStorage.getItem('crm_grupos') || '[]');
    const savedMovimentacoes = JSON.parse(localStorage.getItem('crm_movimentacoes') || '[]');

    // Se não há grupos, criar alguns padrões
    if (savedGrupos.length === 0) {
      const gruposPadrao = [
        { id: 1, nome: 'Pizzas Grandes', descricao: 'Pizzas tamanho família', cor: '#EF4444' },
        { id: 2, nome: 'Pizzas Broto', descricao: 'Pizzas tamanho individual', cor: '#F59E0B' },
        { id: 3, nome: 'Bolos e Tortas', descricao: 'Bolos e tortas variados', cor: '#8B5CF6' },
        { id: 4, nome: 'Bebidas', descricao: 'Refrigerantes e sucos', cor: '#10B981' }
      ];
      setGrupos(gruposPadrao);
      localStorage.setItem('crm_grupos', JSON.stringify(gruposPadrao));
    } else {
      setGrupos(savedGrupos);
    }

    setProdutos(savedProdutos);
    setMovimentacoes(savedMovimentacoes);
  }, []);

  const saveProdutos = (newProdutos) => {
    localStorage.setItem('crm_produtos', JSON.stringify(newProdutos));
    setProdutos(newProdutos);
    window.dispatchEvent(new Event('storage'));
  };

  const saveGrupos = (newGrupos) => {
    localStorage.setItem('crm_grupos', JSON.stringify(newGrupos));
    setGrupos(newGrupos);
    window.dispatchEvent(new Event('storage'));
  };

  const saveMovimentacoes = (newMovimentacoes) => {
    localStorage.setItem('crm_movimentacoes', JSON.stringify(newMovimentacoes));
    setMovimentacoes(newMovimentacoes);
    window.dispatchEvent(new Event('storage'));
  };

  // Função para redimensionar imagem
  const resizeImage = (file, maxWidth = 400, maxHeight = 400) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Função para processar upload de imagem
  const handleImageUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Tipo de arquivo não suportado. Use JPG, PNG ou WebP.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      const resizedBlob = await resizeImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          imagem: e.target.result,
          imagemPreview: e.target.result
        }));
      };
      reader.readAsDataURL(resizedBlob);

      toast({
        title: "Sucesso!",
        description: "Imagem carregada com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar imagem.",
        variant: "destructive"
      });
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imagem: null,
      imagemPreview: null
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nome || !formData.codigo || !formData.preco || !formData.quantidade || !formData.grupoId) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    const grupoSelecionado = grupos.find(g => g.id === parseInt(formData.grupoId));

    const newProduto = {
      id: editingProduto ? editingProduto.id : Date.now(),
      nome: formData.nome,
      codigo: formData.codigo,
      preco: parseFloat(formData.preco),
      quantidade: parseInt(formData.quantidade),
      grupoId: parseInt(formData.grupoId),
      grupoNome: grupoSelecionado.nome,
      imagem: formData.imagem,
      createdAt: editingProduto ? editingProduto.createdAt : new Date().toISOString()
    };

    let updatedProdutos;
    if (editingProduto) {
      updatedProdutos = produtos.map(p => p.id === editingProduto.id ? newProduto : p);
      toast({
        title: "Sucesso!",
        description: "Produto atualizado com sucesso!"
      });
    } else {
      updatedProdutos = [...produtos, newProduto];
      toast({
        title: "Sucesso!",
        description: "Produto cadastrado com sucesso!"
      });
    }

    saveProdutos(updatedProdutos);
    setFormData({ nome: '', codigo: '', preco: '', quantidade: '', grupoId: '', imagem: null, imagemPreview: null });
    setEditingProduto(null);
    setIsDialogOpen(false);
  };

  const handleGrupoSubmit = (e) => {
    e.preventDefault();

    if (!grupoData.nome) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório!",
        variant: "destructive"
      });
      return;
    }

    const newGrupo = {
      id: editingGrupo ? editingGrupo.id : Date.now(),
      nome: grupoData.nome,
      descricao: grupoData.descricao,
      cor: grupoData.cor
    };

    let updatedGrupos;
    if (editingGrupo) {
      updatedGrupos = grupos.map(g => g.id === editingGrupo.id ? newGrupo : g);
      toast({
        title: "Sucesso!",
        description: "Grupo atualizado com sucesso!"
      });
    } else {
      updatedGrupos = [...grupos, newGrupo];
      toast({
        title: "Sucesso!",
        description: "Grupo criado com sucesso!"
      });
    }

    saveGrupos(updatedGrupos);
    setGrupoData({ nome: '', descricao: '', cor: '#3B82F6' });
    setEditingGrupo(null);
    setIsGrupoDialogOpen(false);
  };

  const handleMovimentacao = (e) => {
    e.preventDefault();

    if (!movData.produtoId || !movData.quantidade) {
      toast({
        title: "Erro",
        description: "Produto e quantidade são obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    const produto = produtos.find(p => p.id === parseInt(movData.produtoId));
    const quantidade = parseInt(movData.quantidade);

    if (movData.tipo === 'saida' && produto.quantidade < quantidade) {
      toast({
        title: "Erro",
        description: "Quantidade insuficiente em estoque!",
        variant: "destructive"
      });
      return;
    }

    const novaMovimentacao = {
      id: Date.now(),
      produtoId: parseInt(movData.produtoId),
      produtoNome: produto.nome,
      tipo: movData.tipo,
      quantidade,
      observacao: movData.observacao,
      createdAt: new Date().toISOString()
    };

    const novaQuantidade = movData.tipo === 'entrada'
      ? produto.quantidade + quantidade
      : produto.quantidade - quantidade;

    const updatedProdutos = produtos.map(p =>
      p.id === parseInt(movData.produtoId)
        ? { ...p, quantidade: novaQuantidade }
        : p
    );

    const updatedMovimentacoes = [novaMovimentacao, ...movimentacoes];

    saveProdutos(updatedProdutos);
    saveMovimentacoes(updatedMovimentacoes);

    toast({
      title: "Sucesso!",
      description: `${movData.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`
    });

    setMovData({ produtoId: '', tipo: 'entrada', quantidade: '', observacao: '' });
    setIsMovDialogOpen(false);
  };

  const handleEdit = (produto) => {
    setEditingProduto(produto);
    setFormData({
      nome: produto.nome,
      codigo: produto.codigo,
      preco: produto.preco.toString(),
      quantidade: produto.quantidade.toString(),
      grupoId: produto.grupoId.toString(),
      imagem: produto.imagem || null,
      imagemPreview: produto.imagem || null
    });
    setIsDialogOpen(true);
  };

  const handleEditGrupo = (grupo) => {
    setEditingGrupo(grupo);
    setGrupoData({
      nome: grupo.nome,
      descricao: grupo.descricao,
      cor: grupo.cor
    });
    setIsGrupoDialogOpen(true);
  };

  const handleDelete = (id) => {
    const updatedProdutos = produtos.filter(p => p.id !== id);
    saveProdutos(updatedProdutos);
    toast({
      title: "Sucesso!",
      description: "Produto removido com sucesso!"
    });
  };

  const handleDeleteGrupo = (id) => {
    const grupo = grupos.find(g => g.id === id);
    const produtosDoGrupo = produtos.filter(p => p.grupoId === id);

    if (produtosDoGrupo.length > 0) {
      toast({
        title: "Atenção!",
        description: `Não é possível excluir o grupo "${grupo.nome}" pois existem ${produtosDoGrupo.length} produto(s) vinculado(s) a ele. Transfira ou exclua os produtos primeiro.`,
        variant: "destructive"
      });
      return;
    }

    const updatedGrupos = grupos.filter(g => g.id !== id);
    saveGrupos(updatedGrupos);

    // Se o grupo excluído estava selecionado, voltar para "Todos os Produtos"
    if (selectedGrupo === id.toString()) {
      setSelectedGrupo('todos');
    }

    toast({
      title: "Sucesso!",
      description: `Grupo "${grupo.nome}" removido com sucesso!`
    });
  };

  const openImageDialog = (image) => {
    setImageDialog({ open: true, image });
  };

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrupo = selectedGrupo === 'todos' || produto.grupoId === parseInt(selectedGrupo);
    return matchesSearch && matchesGrupo;
  });

  const produtosBaixoEstoque = produtos.filter(p => p.quantidade <= 5);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar de Grupos */}
      <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">📋 Cardápio</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Use esta página para controlar os cadastros de produtos e grupos dessa filial.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <Button
              variant={selectedGrupo === 'todos' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setSelectedGrupo('todos')}
            >
              <Package className="h-4 w-4 mr-2" />
              Todos os Produtos
            </Button>

            {grupos.map((grupo) => (
              <div key={grupo.id} className="group flex items-center space-x-2">
                <Button
                  variant={selectedGrupo === grupo.id.toString() ? 'default' : 'ghost'}
                  className="flex-1 justify-start"
                  onClick={() => setSelectedGrupo(grupo.id.toString())}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: grupo.cor }}
                  />
                  {grupo.nome}
                </Button>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditGrupo(grupo)}
                    className="h-6 w-6 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGrupo(grupo.id)}
                    className="h-6 w-6 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <Dialog open={isGrupoDialogOpen} onOpenChange={setIsGrupoDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <FolderPlus className="h-4 w-4 mr-2" />
                Novo Grupo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-white">
                  {editingGrupo ? 'Editar Grupo' : 'Novo Grupo'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleGrupoSubmit} className="space-y-4">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Nome *</Label>
                  <Input
                    value={grupoData.nome}
                    onChange={(e) => setGrupoData({...grupoData, nome: e.target.value})}
                    placeholder="Nome do grupo"
                    required
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Descrição</Label>
                  <Input
                    value={grupoData.descricao}
                    onChange={(e) => setGrupoData({...grupoData, descricao: e.target.value})}
                    placeholder="Descrição do grupo"
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Cor</Label>
                  <Input
                    type="color"
                    value={grupoData.cor}
                    onChange={(e) => setGrupoData({...grupoData, cor: e.target.value})}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingGrupo ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsGrupoDialogOpen(false);
                    setEditingGrupo(null);
                    setGrupoData({ nome: '', descricao: '', cor: '#3B82F6' });
                  }}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedGrupo === 'todos' ? 'Todos os Produtos' : grupos.find(g => g.id === parseInt(selectedGrupo))?.nome}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {grupos.find(g => g.id === parseInt(selectedGrupo))?.descricao}
              </p>
            </div>

            <div className="flex gap-2">
              <Dialog open={isMovDialogOpen} onOpenChange={setIsMovDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 dark:text-orange-400 dark:border-orange-500/50">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Movimentação
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900 dark:text-white">Nova Movimentação</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMovimentacao} className="space-y-4">
                    <div>
                      <Label className="text-slate-700 dark:text-slate-300">Produto</Label>
                      <Select value={movData.produtoId} onValueChange={(value) => setMovData({...movData, produtoId: value})}>
                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                          <SelectValue placeholder="Selecione um produto..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                          {produtos.map(produto => (
                            <SelectItem key={produto.id} value={produto.id.toString()} className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700">
                              {produto.nome} - Estoque: {produto.quantidade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-700 dark:text-slate-300">Tipo</Label>
                      <Select value={movData.tipo} onValueChange={(value) => setMovData({...movData, tipo: value})}>
                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                          <SelectItem value="entrada" className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700">Entrada</SelectItem>
                          <SelectItem value="saida" className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quantidade" className="text-slate-700 dark:text-slate-300">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={movData.quantidade}
                        onChange={(e) => setMovData({...movData, quantidade: e.target.value})}
                        placeholder="Quantidade"
                        required
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="observacao" className="text-slate-700 dark:text-slate-300">Observação</Label>
                      <Input
                        id="observacao"
                        value={movData.observacao}
                        onChange={(e) => setMovData({...movData, observacao: e.target.value})}
                        placeholder="Observação (opcional)"
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Registrar</Button>
                      <Button type="button" variant="outline" onClick={() => { setIsMovDialogOpen(false); setMovData({ produtoId: '', tipo: 'entrada', quantidade: '', observacao: '' }); }}>Cancelar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900 dark:text-white">{editingProduto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="nome" className="text-slate-700 dark:text-slate-300">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        placeholder="Nome do produto"
                        required
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="codigo" className="text-slate-700 dark:text-slate-300">Código/SKU *</Label>
                      <Input
                        id="codigo"
                        value={formData.codigo}
                        onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                        placeholder="Código do produto"
                        required
                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="preco" className="text-slate-700 dark:text-slate-300">Preço *</Label>
                        <Input
                          id="preco"
                          type="number"
                          step="0.01"
                          value={formData.preco}
                          onChange={(e) => setFormData({...formData, preco: e.target.value})}
                          placeholder="0.00"
                          required
                          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quantidade" className="text-slate-700 dark:text-slate-300">Quantidade *</Label>
                        <Input
                          id="quantidade"
                          type="number"
                          min="0"
                          value={formData.quantidade}
                          onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                          placeholder="0"
                          required
                          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-700 dark:text-slate-300">Grupo *</Label>
                      <Select value={formData.grupoId} onValueChange={(value) => setFormData({...formData, grupoId: value})}>
                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                          <SelectValue placeholder="Selecione um grupo..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                          {grupos.map(grupo => (
                            <SelectItem key={grupo.id} value={grupo.id.toString()} className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700">
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: grupo.cor }}
                                />
                                {grupo.nome}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Campo de upload de imagem */}
                    <div>
                      <Label className="text-slate-700 dark:text-slate-300">Imagem do Produto</Label>
                      <div className="flex gap-3 items-start">
                        <div
                          className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer flex-1 ${
                            isDragging
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('image-input').click()}
                        >
                          {formData.imagemPreview ? (
                            <div className="space-y-2">
                              <div className="relative inline-block">
                                <img
                                  src={formData.imagemPreview}
                                  alt="Preview"
                                  className="w-16 h-16 object-cover rounded-lg mx-auto"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-1 -right-1 h-4 w-4"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage();
                                  }}
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Clique para trocar
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-6 w-6 text-slate-400 mx-auto" />
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                  Arraste ou clique
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  PNG, JPG, WebP
                                </p>
                              </div>
                            </div>
                          )}
                          <Input
                            id="image-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">{editingProduto ? 'Atualizar' : 'Cadastrar'}</Button>
                      <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingProduto(null); setFormData({ nome: '', codigo: '', preco: '', quantidade: '', grupoId: '', imagem: null, imagemPreview: null }); }}>Cancelar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Barra de busca e filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-slate-300 dark:border-slate-600">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo dos Produtos */}
        <div className="flex-1 overflow-y-auto p-6">
          {produtosBaixoEstoque.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">⚠️ Produtos com Baixo Estoque</h3>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 flex flex-wrap gap-x-4 gap-y-1">
                {produtosBaixoEstoque.map(p => (<span key={p.id}>{p.nome}: <strong>{p.quantidade}</strong></span>))}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProdutos.map((produto, index) => (
              <motion.div
                key={produto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Imagem do produto */}
                <div className="relative h-32 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  {produto.imagem ? (
                    <img
                      src={produto.imagem}
                      alt={produto.nome}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageDialog(produto.imagem)}
                    />
                  ) : (
                    <Package className="h-12 w-12 text-slate-400" />
                  )}
                  {/* Botões de ação */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(produto)}
                      className="h-7 w-7 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(produto.id)}
                      className="h-7 w-7 bg-red-500/90 hover:bg-red-600 text-white"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Conteúdo do card */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-tight flex-1 mr-2">
                      {produto.nome}
                    </h3>
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg whitespace-nowrap">
                      R$ {produto.preco.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Código: {produto.codigo}
                  </p>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Estoque:</span>
                    <span className={`font-semibold ${produto.quantidade <= 5 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                      {produto.quantidade} un
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredProdutos.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                {search
