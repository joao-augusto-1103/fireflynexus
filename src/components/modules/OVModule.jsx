import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, ShoppingCart, User, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/App';

const OVModule = () => {
  const { dialogs, openDialog, closeDialog } = useContext(AppContext);
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOV, setEditingOV] = useState(null);
  const [formData, setFormData] = useState({
    clienteId: '',
    clienteNome: '',
    produtos: [{ produtoId: '', nome: '', preco: 0, quantidade: 1 }],
    status: 'Pendente',
    total: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    const savedOrdens = JSON.parse(localStorage.getItem('crm_ov') || '[]');
    const savedClientes = JSON.parse(localStorage.getItem('crm_clientes') || '[]');
    const savedProdutos = JSON.parse(localStorage.getItem('crm_produtos') || '[]');
    setOrdens(savedOrdens);
    setClientes(savedClientes);
    setProdutos(savedProdutos);
  }, []);

  const saveOrdens = (newOrdens) => {
    localStorage.setItem('crm_ov', JSON.stringify(newOrdens));
    setOrdens(newOrdens);
    window.dispatchEvent(new Event('storage'));
  };

  const resetForm = () => {
    setFormData({
      clienteId: '',
      clienteNome: '',
      produtos: [{ produtoId: '', nome: '', preco: 0, quantidade: 1 }],
      status: 'Pendente',
      total: 0
    });
  };

  const handleOpenDialog = (ov = null) => {
    if (ov) {
      setEditingOV(ov);
      setFormData(ov);
    } else {
      setEditingOV(null);
      resetForm();
    }
    openDialog('ov');
  };

  const handleCloseDialog = () => {
    closeDialog('ov');
  };

  const calculateTotal = (produtos) => {
    return produtos.reduce((sum, produto) => sum + (produto.preco * produto.quantidade), 0);
  };

  const handleProdutoChange = (index, field, value) => {
    const newProdutos = [...formData.produtos];
    
    if (field === 'produtoId') {
      const produto = produtos.find(p => p.id === parseInt(value));
      if (produto) {
        newProdutos[index] = {
          ...newProdutos[index],
          produtoId: value,
          nome: produto.nome,
          preco: produto.preco
        };
      }
    } else {
      newProdutos[index][field] = field === 'quantidade' || field === 'preco' ? parseFloat(value) || 0 : value;
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

  const updateFinanceiro = (ov, action) => {
    const financeiro = JSON.parse(localStorage.getItem('crm_financeiro') || '[]');
    let updatedFinanceiro = financeiro;

    if (action === 'add') {
      const existingEntry = financeiro.find(entry => entry.origemId === `ov-${ov.id}`);
      if (!existingEntry) {
        const newEntry = {
          id: Date.now(),
          descricao: `Recebimento da OV: ${ov.numero}`,
          valor: ov.total,
          dataVencimento: new Date().toISOString().split('T')[0],
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.clienteNome || formData.produtos.length === 0 || formData.produtos.some(p => !p.nome)) {
      toast({
        title: "Erro",
        description: "Cliente e pelo menos um produto são obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    const newOV = {
      id: editingOV ? editingOV.id : Date.now(),
      numero: editingOV ? editingOV.numero : `OV${String(ordens.length + 1).padStart(4, '0')}`,
      ...formData,
      createdAt: editingOV ? editingOV.createdAt : new Date().toISOString()
    };

    let updatedOrdens;
    if (editingOV) {
      updatedOrdens = ordens.map(o => o.id === editingOV.id ? newOV : o);
      toast({
        title: "Sucesso!",
        description: "OV atualizada com sucesso!"
      });
    } else {
      updatedOrdens = [...ordens, newOV];
      toast({
        title: "Sucesso!",
        description: "OV criada com sucesso!"
      });
    }

    saveOrdens(updatedOrdens);

    if (newOV.status === 'Concluída') {
      updateFinanceiro(newOV, 'add');
    } else {
      updateFinanceiro(newOV, 'remove');
    }

    handleCloseDialog();
  };

  const handleDelete = (id) => {
    const ovToDelete = ordens.find(o => o.id === id);
    if (ovToDelete) {
      updateFinanceiro(ovToDelete, 'remove');
    }
    const updatedOrdens = ordens.filter(o => o.id !== id);
    saveOrdens(updatedOrdens);
    toast({
      title: "Sucesso!",
      description: "OV removida com sucesso!"
    });
  };

  const handleClienteSelect = (clienteId) => {
    const cliente = clientes.find(c => c.id === parseInt(clienteId));
    if (cliente) {
      setFormData({
        ...formData,
        clienteId,
        clienteNome: cliente.nome
      });
    }
  };

  const filteredOrdens = ordens.filter(ov =>
    ov.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ov.numero.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ordens de Venda</h1>
          <p className="text-slate-600 dark:text-slate-400">Gerencie suas vendas</p>
        </div>
        
        <Dialog open={dialogs.ov} onOpenChange={handleCloseDialog}>
          <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Plus className="h-4 w-4 mr-2" />
            Nova OV
          </Button>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>{editingOV ? 'Editar OV' : 'Nova Ordem de Venda'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Cliente</Label>
                <Select value={formData.clienteId} onValueChange={handleClienteSelect}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente..." /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()}>{cliente.nome} - {cliente.telefone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="clienteNome">Nome do Cliente</Label>
                <Input id="clienteNome" value={formData.clienteNome} onChange={(e) => setFormData({...formData, clienteNome: e.target.value})} placeholder="Nome do cliente" required />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Produtos</Label>
                  <Button type="button" onClick={addProduto} size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {formData.produtos.map((produto, index) => (
                    <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <Label>Produto</Label>
                          <Select value={produto.produtoId} onValueChange={(value) => handleProdutoChange(index, 'produtoId', value)}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                              {produtos.map(p => (<SelectItem key={p.id} value={p.id.toString()}>{p.nome} - R$ {p.preco.toFixed(2)}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Nome</Label><Input value={produto.nome} onChange={(e) => handleProdutoChange(index, 'nome', e.target.value)} placeholder="Nome do produto" /></div>
                        <div><Label>Preço</Label><Input type="number" step="0.01" value={produto.preco} onChange={(e) => handleProdutoChange(index, 'preco', e.target.value)} placeholder="0.00" /></div>
                        <div>
                          <Label>Quantidade</Label>
                          <div className="flex"><Input type="number" min="1" value={produto.quantidade} onChange={(e) => handleProdutoChange(index, 'quantidade', e.target.value)} className="flex-1" />
                            {formData.produtos.length > 1 && (<Button type="button" variant="outline" size="icon" onClick={() => removeProduto(index)} className="ml-2"><Trash2 className="h-4 w-4" /></Button>)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-right"><span className="text-sm text-slate-600 dark:text-slate-400">Subtotal: R$ {(produto.preco * produto.quantidade).toFixed(2)}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Processando">Processando</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">R$ {formData.total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingOV ? 'Atualizar' : 'Criar OV'}</Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Buscar por cliente ou número..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm pl-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredOrdens.map((ov, index) => (
          <motion.div
            key={ov.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{ov.numero}</h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ov.status)}`}>{ov.status}</span>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(ov)} className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ov.id)} className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400"><User className="h-4 w-4" /><span className="text-sm">{ov.clienteNome}</span></div>
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400"><ShoppingCart className="h-4 w-4" /><span className="text-sm">{ov.produtos.length} produto(s)</span></div>
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400"><DollarSign className="h-4 w-4" /><span className="text-lg font-semibold text-green-600 dark:text-green-400">R$ {ov.total.toFixed(2)}</span></div>
              <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-700/50 rounded max-h-24 overflow-y-auto">
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Produtos:</p>
                {ov.produtos.map((produto, idx) => (<div key={idx} className="text-xs text-slate-600 dark:text-slate-400">{produto.nome} - Qtd: {produto.quantidade} - R$ {produto.preco.toFixed(2)}</div>))}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500 pt-2">Criada em: {new Date(ov.createdAt).toLocaleDateString('pt-BR')}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredOrdens.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{searchTerm ? 'Nenhuma OV encontrada' : 'Nenhuma OV cadastrada'}</h3>
          <p className="text-slate-600 dark:text-slate-400">{searchTerm ? 'Tente buscar com outros termos' : 'Comece criando sua primeira ordem de venda'}</p>
        </div>
      )}
    </div>
  );
};

export default OVModule;