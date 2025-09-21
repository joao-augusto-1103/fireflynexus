import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Printer, Phone, Lock, FileText, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/App';

const OSModule = () => {
  const { dialogs, openDialog, closeDialog } = useContext(AppContext);
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [editingOS, setEditingOS] = useState(null);
  const [formData, setFormData] = useState({
    clienteNome: '',
    clienteTelefone: '',
    titulo: '',
    senha: '',
    valor: '',
    observacoes: '',
    status: 'Pendente'
  });
  const { toast } = useToast();

  useEffect(() => {
    const savedOrdens = JSON.parse(localStorage.getItem('crm_os') || '[]');
    const savedClientes = JSON.parse(localStorage.getItem('crm_clientes') || '[]');
    setOrdens(savedOrdens);
    setClientes(savedClientes);
  }, []);

  const saveOrdens = (newOrdens) => {
    localStorage.setItem('crm_os', JSON.stringify(newOrdens));
    setOrdens(newOrdens);
    window.dispatchEvent(new Event('storage'));
  };

  const handleOpenDialog = (os = null) => {
    if (os) {
      setEditingOS(os);
      setFormData({ ...os, valor: os.valor ? os.valor.toString() : '' });
    } else {
      setEditingOS(null);
      setFormData({ clienteNome: '', clienteTelefone: '', titulo: '', senha: '', valor: '', observacoes: '', status: 'Pendente' });
    }
    openDialog('os');
  };

  const handleCloseDialog = () => {
    closeDialog('os');
  };

  const updateFinanceiro = (os, action) => {
    const financeiro = JSON.parse(localStorage.getItem('crm_financeiro') || '[]');
    let updatedFinanceiro = financeiro;

    if (action === 'add') {
      const existingEntry = financeiro.find(entry => entry.origemId === `os-${os.id}`);
      if (!existingEntry) {
        const newEntry = {
          id: Date.now(),
          descricao: `Recebimento da OS: ${os.numero}`,
          valor: parseFloat(os.valor),
          dataVencimento: new Date().toISOString().split('T')[0],
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.clienteNome || !formData.clienteTelefone || !formData.titulo || !formData.senha || !formData.valor) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos!",
        variant: "destructive"
      });
      return;
    }

    const newOS = {
      id: editingOS ? editingOS.id : Date.now(),
      numero: editingOS ? editingOS.numero : `OS${String(ordens.length + 1).padStart(4, '0')}`,
      ...formData,
      valor: parseFloat(formData.valor),
      createdAt: editingOS ? editingOS.createdAt : new Date().toISOString()
    };

    let updatedOrdens;
    if (editingOS) {
      updatedOrdens = ordens.map(o => o.id === editingOS.id ? newOS : o);
      toast({
        title: "Sucesso!",
        description: "OS atualizada com sucesso!"
      });
    } else {
      updatedOrdens = [...ordens, newOS];
      toast({
        title: "Sucesso!",
        description: "OS criada com sucesso!"
      });
    }

    saveOrdens(updatedOrdens);

    if (newOS.status === 'Concluída') {
      updateFinanceiro(newOS, 'add');
    } else {
      updateFinanceiro(newOS, 'remove');
    }

    handleCloseDialog();
  };

  const handleDelete = (id) => {
    const osToDelete = ordens.find(o => o.id === id);
    if (osToDelete) {
      updateFinanceiro(osToDelete, 'remove');
    }
    const updatedOrdens = ordens.filter(o => o.id !== id);
    saveOrdens(updatedOrdens);
    toast({
      title: "Sucesso!",
      description: "OS removida com sucesso!"
    });
  };

  const handlePrint = (os) => {
    const printContent = `
      <html>
        <head>
          <title>Ordem de Serviço - ${os.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #000; }
            .header { text-align: center; margin-bottom: 40px; }
            h1 { font-size: 24px; margin: 0; }
            h2 { font-size: 20px; margin: 5px 0; color: #555; }
            .info { margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; border-radius: 8px; }
            .field { margin-bottom: 12px; font-size: 16px; }
            .label { font-weight: bold; }
            .pattern-area { 
              border: 2px solid #000; 
              width: 250px; 
              height: 250px; 
              margin: 30px auto; 
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              color: #666;
              border-radius: 8px;
            }
            .signature { 
              margin-top: 80px; 
              border-top: 1px solid #000; 
              width: 350px; 
              text-align: center; 
              padding-top: 10px;
              margin-left: auto;
              margin-right: auto;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ORDEM DE SERVIÇO</h1>
            <h2>${os.numero}</h2>
          </div>
          
          <div class="info">
            <div class="field">
              <span class="label">Cliente:</span> ${os.clienteNome}
            </div>
            <div class="field">
              <span class="label">Telefone:</span> ${os.clienteTelefone}
            </div>
            <div class="field">
              <span class="label">Descrição:</span> ${os.titulo}
            </div>
            <div class="field">
              <span class="label">Valor:</span> R$ ${os.valor ? os.valor.toFixed(2) : 'N/A'}
            </div>
            <div class="field">
              <span class="label">Senha:</span> ${os.senha}
            </div>
            <div class="field">
              <span class="label">Data:</span> ${new Date(os.createdAt).toLocaleDateString('pt-BR')}
            </div>
            ${os.observacoes ? `<div class="field"><span class="label">Observações:</span> ${os.observacoes}</div>` : ''}
          </div>

          <div class="pattern-area">
            Padrão de Desbloqueio<br>
            (Desenhar aqui)
          </div>

          <div class="signature">
            Assinatura do Cliente
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleClienteSelect = (clienteId) => {
    const cliente = clientes.find(c => c.id === parseInt(clienteId));
    if (cliente) {
      setFormData({
        ...formData,
        clienteNome: cliente.nome,
        clienteTelefone: cliente.telefone
      });
    }
  };

  const filteredOrdens = ordens.filter(os =>
    os.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Em Andamento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Concluída': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ordens de Serviço</h1>
          <p className="text-slate-600 dark:text-slate-400">Gerencie suas ordens de serviço</p>
        </div>
        
        <Dialog open={dialogs.os} onOpenChange={handleCloseDialog}>
          <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Nova OS
          </Button>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>{editingOS ? 'Editar OS' : 'Nova Ordem de Serviço'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {clientes.length > 0 && (
                <div>
                  <Label>Selecionar Cliente Existente</Label>
                  <Select onValueChange={handleClienteSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id.toString()}>
                          {cliente.nome} - {cliente.telefone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label htmlFor="clienteNome">Nome do Cliente *</Label>
                <Input id="clienteNome" value={formData.clienteNome} onChange={(e) => setFormData({...formData, clienteNome: e.target.value})} placeholder="Nome do cliente" required />
              </div>
              
              <div>
                <Label htmlFor="clienteTelefone">Telefone do Cliente *</Label>
                <Input id="clienteTelefone" value={formData.clienteTelefone} onChange={(e) => setFormData({...formData, clienteTelefone: e.target.value})} placeholder="(11) 99999-9999" required />
              </div>
              
              <div>
                <Label htmlFor="titulo">Descrição/Título *</Label>
                <Input id="titulo" value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} placeholder="Ex: Troca de tela, reparo de bateria..." required />
              </div>
              
              <div>
                <Label htmlFor="senha">Senha do Dispositivo *</Label>
                <Input id="senha" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} placeholder="Senha ou PIN" required />
              </div>

              <div>
                <Label htmlFor="valor">Valor do Serviço (R$) *</Label>
                <Input id="valor" type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} placeholder="0.00" required />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} placeholder="Observações adicionais" rows={3} />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingOS ? 'Atualizar' : 'Criar OS'}</Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Buscar por cliente, número ou descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm pl-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredOrdens.map((os, index) => (
          <motion.div
            key={os.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{os.numero}</h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(os.status)}`}>{os.status}</span>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" onClick={() => handlePrint(os)} className="h-8 w-8"><Printer className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(os)} className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(os.id)} className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{os.clienteNome}</p>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400"><Phone className="h-4 w-4" /><span className="text-sm">{os.clienteTelefone}</span></div>
              </div>
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400"><FileText className="h-4 w-4" /><span className="text-sm">{os.titulo}</span></div>
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400"><DollarSign className="h-4 w-4" /><span className="text-sm font-semibold text-green-600 dark:text-green-400">R$ {os.valor ? os.valor.toFixed(2) : '0.00'}</span></div>
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400"><Lock className="h-4 w-4" /><span className="text-sm">Senha: {os.senha}</span></div>
              {os.observacoes && (<div className="mt-3 p-2 bg-slate-100 dark:bg-slate-700/50 rounded text-sm text-slate-600 dark:text-slate-400">{os.observacoes}</div>)}
              <div className="text-xs text-slate-500 dark:text-slate-500 pt-2">Criada em: {new Date(os.createdAt).toLocaleDateString('pt-BR')}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredOrdens.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{searchTerm ? 'Nenhuma OS encontrada' : 'Nenhuma OS cadastrada'}</h3>
          <p className="text-slate-600 dark:text-slate-400">{searchTerm ? 'Tente buscar com outros termos' : 'Comece criando sua primeira ordem de serviço'}</p>
        </div>
      )}
    </div>
  );
};

export default OSModule;

