import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Package, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const EstoqueModule = () => {
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMovDialogOpen, setIsMovDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    preco: '',
    quantidade: ''
  });
  const [movData, setMovData] = useState({
    produtoId: '',
    tipo: 'entrada',
    quantidade: '',
    observacao: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const savedProdutos = JSON.parse(localStorage.getItem('crm_produtos') || '[]');
    const savedMovimentacoes = JSON.parse(localStorage.getItem('crm_movimentacoes') || '[]');
    setProdutos(savedProdutos);
    setMovimentacoes(savedMovimentacoes);
  }, []);

  const saveProdutos = (newProdutos) => {
    localStorage.setItem('crm_produtos', JSON.stringify(newProdutos));
    setProdutos(newProdutos);
    window.dispatchEvent(new Event('storage'));
  };

  const saveMovimentacoes = (newMovimentacoes) => {
    localStorage.setItem('crm_movimentacoes', JSON.stringify(newMovimentacoes));
    setMovimentacoes(newMovimentacoes);
    window.dispatchEvent(new Event('storage'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.codigo || !formData.preco || !formData.quantidade) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    const newProduto = {
      id: editingProduto ? editingProduto.id : Date.now(),
      nome: formData.nome,
      codigo: formData.codigo,
      preco: parseFloat(formData.preco),
      quantidade: parseInt(formData.quantidade),
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
    setFormData({ nome: '', codigo: '', preco: '', quantidade: '' });
    setEditingProduto(null);
    setIsDialogOpen(false);
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
      quantidade: produto.quantidade.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    const updatedProdutos = produtos.filter(p => p.id !== id);
    saveProdutos(updatedProdutos);
    toast({
      title: "Sucesso!",
      description: "Produto removido com sucesso!"
    });
  };

  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const produtosBaixoEstoque = produtos.filter(p => p.quantidade <= 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Estoque</h1>
          <p className="text-slate-600 dark:text-slate-400">Gerencie seus produtos e movimentações</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isMovDialogOpen} onOpenChange={setIsMovDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 dark:text-orange-400 dark:border-orange-500/50">
                <BarChart3 className="h-4 w-4 mr-2" />
                Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle>Nova Movimentação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMovimentacao} className="space-y-4">
                <div>
                  <Label>Produto</Label>
                  <Select value={movData.produtoId} onValueChange={(value) => setMovData({...movData, produtoId: value})}>
                    <SelectTrigger><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
                    <SelectContent>
                      {produtos.map(produto => (
                        <SelectItem key={produto.id} value={produto.id.toString()}>{produto.nome} - Estoque: {produto.quantidade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={movData.tipo} onValueChange={(value) => setMovData({...movData, tipo: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input id="quantidade" type="number" min="1" value={movData.quantidade} onChange={(e) => setMovData({...movData, quantidade: e.target.value})} placeholder="Quantidade" required />
                </div>
                <div>
                  <Label htmlFor="observacao">Observação</Label>
                  <Input id="observacao" value={movData.observacao} onChange={(e) => setMovData({...movData, observacao: e.target.value})} placeholder="Observação (opcional)" />
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
            <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle>{editingProduto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label htmlFor="nome">Nome *</Label><Input id="nome" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Nome do produto" required /></div>
                <div><Label htmlFor="codigo">Código/SKU *</Label><Input id="codigo" value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} placeholder="Código do produto" required /></div>
                <div><Label htmlFor="preco">Preço *</Label><Input id="preco" type="number" step="0.01" value={formData.preco} onChange={(e) => setFormData({...formData, preco: e.target.value})} placeholder="0.00" required /></div>
                <div><Label htmlFor="quantidade">Quantidade Inicial *</Label><Input id="quantidade" type="number" min="0" value={formData.quantidade} onChange={(e) => setFormData({...formData, quantidade: e.target.value})} placeholder="0" required /></div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">{editingProduto ? 'Atualizar' : 'Cadastrar'}</Button>
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingProduto(null); setFormData({ nome: '', codigo: '', preco: '', quantidade: '' }); }}>Cancelar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {produtosBaixoEstoque.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">⚠️ Produtos com Baixo Estoque</h3>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 flex flex-wrap gap-x-4 gap-y-1">
            {produtosBaixoEstoque.map(p => (<span key={p.id}>{p.nome}: <strong>{p.quantidade}</strong></span>))}
          </div>
        </motion.div>
      )}

      <Tabs defaultValue="produtos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="produtos" className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar por nome ou código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm pl-10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProdutos.map((produto, index) => (
              <motion.div key={produto.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="bg-white dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{produto.nome}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Código: {produto.codigo}</p>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(produto)} className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(produto.id)} className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><span className="text-slate-600 dark:text-slate-400">Preço:</span><span className="font-semibold text-green-600 dark:text-green-400">R$ {produto.preco.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600 dark:text-slate-400">Estoque:</span><span className={`font-semibold ${produto.quantidade <= 5 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>{produto.quantidade} unidades</span></div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredProdutos.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</h3>
              <p className="text-slate-600 dark:text-slate-400">{searchTerm ? 'Tente buscar com outros termos' : 'Comece cadastrando seu primeiro produto'}</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="movimentacoes" className="space-y-4 pt-4">
          <div className="space-y-3">
            {movimentacoes.map((mov, index) => (
              <motion.div key={mov.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }} className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${mov.tipo === 'entrada' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                      {mov.tipo === 'entrada' ? (<TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />) : (<TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{mov.produtoNome}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{mov.tipo === 'entrada' ? 'Entrada' : 'Saída'} de {mov.quantidade} unidades</p>
                      {mov.observacao && (<p className="text-xs text-slate-500 dark:text-slate-500">{mov.observacao}</p>)}
                    </div>
                  </div>
                  <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-500">
                    <p>{new Date(mov.createdAt).toLocaleDateString('pt-BR')}</p>
                    <p>{new Date(mov.createdAt).toLocaleTimeString('pt-BR')}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {movimentacoes.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Nenhuma movimentação registrada</h3>
              <p className="text-slate-600 dark:text-slate-400">As movimentações de entrada e saída aparecerão aqui</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EstoqueModule;