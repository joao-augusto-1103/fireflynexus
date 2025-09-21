import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const FinanceiroModule = () => {
  const [lancamentos, setLancamentos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState(null);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    dataVencimento: '',
    tipo: 'receber',
    status: 'Pendente'
  });
  const { toast } = useToast();

  useEffect(() => {
    const savedLancamentos = JSON.parse(localStorage.getItem('crm_financeiro') || '[]');
    setLancamentos(savedLancamentos);
  }, []);

  const saveLancamentos = (newLancamentos) => {
    localStorage.setItem('crm_financeiro', JSON.stringify(newLancamentos));
    setLancamentos(newLancamentos);
    window.dispatchEvent(new Event('storage'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.valor || !formData.dataVencimento) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos!",
        variant: "destructive"
      });
      return;
    }

    const newLancamento = {
      id: editingLancamento ? editingLancamento.id : Date.now(),
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      dataVencimento: formData.dataVencimento,
      tipo: formData.tipo,
      status: formData.status,
      createdAt: editingLancamento ? editingLancamento.createdAt : new Date().toISOString()
    };

    let updatedLancamentos;
    if (editingLancamento) {
      updatedLancamentos = lancamentos.map(l => l.id === editingLancamento.id ? newLancamento : l);
      toast({
        title: "Sucesso!",
        description: "Lançamento atualizado com sucesso!"
      });
    } else {
      updatedLancamentos = [...lancamentos, newLancamento];
      toast({
        title: "Sucesso!",
        description: "Lançamento criado com sucesso!"
      });
    }

    saveLancamentos(updatedLancamentos);
    setFormData({ descricao: '', valor: '', dataVencimento: '', tipo: 'receber', status: 'Pendente' });
    setEditingLancamento(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (lancamento) => {
    setEditingLancamento(lancamento);
    setFormData({
      descricao: lancamento.descricao,
      valor: lancamento.valor.toString(),
      dataVencimento: lancamento.dataVencimento,
      tipo: lancamento.tipo,
      status: lancamento.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    const updatedLancamentos = lancamentos.filter(l => l.id !== id);
    saveLancamentos(updatedLancamentos);
    toast({
      title: "Sucesso!",
      description: "Lançamento removido com sucesso!"
    });
  };

  const toggleStatus = (id) => {
    const updatedLancamentos = lancamentos.map(l => {
      if (l.id === id) {
        const newStatus = l.status === 'Pendente' ? (l.tipo === 'receber' ? 'Recebido' : 'Pago') : 'Pendente';
        return { ...l, status: newStatus };
      }
      return l;
    });
    saveLancamentos(updatedLancamentos);
    toast({
      title: "Sucesso!",
      description: "Status atualizado com sucesso!"
    });
  };

  const filteredLancamentos = lancamentos.filter(lancamento =>
    lancamento.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const contasReceber = filteredLancamentos.filter(l => l.tipo === 'receber');
  const contasPagar = filteredLancamentos.filter(l => l.tipo === 'pagar');

  const totalReceber = contasReceber.filter(l => l.status === 'Pendente').reduce((sum, l) => sum + l.valor, 0);
  const totalPagar = contasPagar.filter(l => l.status === 'Pendente').reduce((sum, l) => sum + l.valor, 0);
  const totalRecebido = contasReceber.filter(l => l.status === 'Recebido').reduce((sum, l) => sum + l.valor, 0);
  const totalPago = contasPagar.filter(l => l.status === 'Pago').reduce((sum, l) => sum + l.valor, 0);

  const getStatusColor = (status, tipo) => {
    if (status === 'Pendente') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
    if ((status === 'Recebido' && tipo === 'receber') || (status === 'Pago' && tipo === 'pagar')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const isVencido = (dataVencimento, status) => {
    if (status !== 'Pendente') return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return new Date(dataVencimento) < hoje;
  };

  const LancamentoCard = ({ conta, index }) => (
    <motion.div
      key={conta.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`bg-white dark:bg-slate-800/50 rounded-lg p-4 border transition-all duration-300 ${
        isVencido(conta.dataVencimento, conta.status) 
          ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
          : 'border-slate-200 dark:border-slate-700 hover:shadow-lg'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">{conta.descricao}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conta.status, conta.tipo)}`}>{conta.status}</span>
            {isVencido(conta.dataVencimento, conta.status) && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Vencido</span>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-2">
            <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
              <DollarSign className="h-4 w-4" />
              <span className={`font-semibold ${conta.tipo === 'receber' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>R$ {conta.valor.toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{new Date(conta.dataVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-1 self-start sm:self-center">
          <Button variant="ghost" size="sm" onClick={() => toggleStatus(conta.id)} className={conta.status === 'Pendente' ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300' : 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300'}>
            {conta.status === 'Pendente' ? `Marcar como ${conta.tipo === 'receber' ? 'Recebido' : 'Pago'}` : 'Marcar como Pendente'}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(conta)} className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(conta.id)} className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financeiro</h1>
          <p className="text-slate-600 dark:text-slate-400">Controle suas contas a pagar e receber</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              <Plus className="h-4 w-4 mr-2" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
            <DialogHeader><DialogTitle>{editingLancamento ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label htmlFor="descricao">Descrição *</Label><Input id="descricao" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} placeholder="Descrição do lançamento" required /></div>
              <div><Label htmlFor="valor">Valor *</Label><Input id="valor" type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} placeholder="0.00" required /></div>
              <div><Label htmlFor="dataVencimento">Data de Vencimento *</Label><Input id="dataVencimento" type="date" value={formData.dataVencimento} onChange={(e) => setFormData({...formData, dataVencimento: e.target.value})} required /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receber">Conta a Receber</SelectItem>
                    <SelectItem value="pagar">Conta a Pagar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value={formData.tipo === 'receber' ? 'Recebido' : 'Pago'}>{formData.tipo === 'receber' ? 'Recebido' : 'Pago'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingLancamento ? 'Atualizar' : 'Criar'}</Button>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setEditingLancamento(null); setFormData({ descricao: '', valor: '', dataVencimento: '', tipo: 'receber', status: 'Pendente' }); }}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800"><div className="flex items-center justify-between"><div><p className="text-sm text-green-600 dark:text-green-400 font-medium">A Receber</p><p className="text-xl font-bold text-green-700 dark:text-green-300">R$ {totalReceber.toFixed(2)}</p></div><TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" /></div></motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800"><div className="flex items-center justify-between"><div><p className="text-sm text-red-600 dark:text-red-400 font-medium">A Pagar</p><p className="text-xl font-bold text-red-700 dark:text-red-300">R$ {totalPagar.toFixed(2)}</p></div><TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" /></div></motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"><div className="flex items-center justify-between"><div><p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Recebido</p><p className="text-xl font-bold text-blue-700 dark:text-blue-300">R$ {totalRecebido.toFixed(2)}</p></div><DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" /></div></motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800"><div className="flex items-center justify-between"><div><p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Pago</p><p className="text-xl font-bold text-purple-700 dark:text-purple-300">R$ {totalPago.toFixed(2)}</p></div><DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" /></div></motion.div>
      </div>

      <Tabs defaultValue="receber" className="w-full">
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="receber">Contas a Receber</TabsTrigger><TabsTrigger value="pagar">Contas a Pagar</TabsTrigger></TabsList>
        <TabsContent value="receber" className="space-y-4 pt-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Buscar por descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm pl-10" /></div>
          <div className="space-y-3">{contasReceber.map((conta, index) => <LancamentoCard key={conta.id} conta={conta} index={index} />)}</div>
          {contasReceber.length === 0 && (<div className="text-center py-12"><TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Nenhuma conta a receber</h3><p className="text-slate-600 dark:text-slate-400">Suas contas a receber aparecerão aqui</p></div>)}
        </TabsContent>
        <TabsContent value="pagar" className="space-y-4 pt-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Buscar por descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm pl-10" /></div>
          <div className="space-y-3">{contasPagar.map((conta, index) => <LancamentoCard key={conta.id} conta={conta} index={index} />)}</div>
          {contasPagar.length === 0 && (<div className="text-center py-12"><TrendingDown className="h-12 w-12 text-slate-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Nenhuma conta a pagar</h3><p className="text-slate-600 dark:text-slate-400">Suas contas a pagar aparecerão aqui</p></div>)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceiroModule;