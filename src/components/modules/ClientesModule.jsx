import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/App';

const ClientesModule = () => {
  const { dialogs, openDialog, closeDialog } = useContext(AppContext);
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    observacoes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const savedClientes = JSON.parse(localStorage.getItem('crm_clientes') || '[]');
    setClientes(savedClientes);
  }, []);

  const saveClientes = (newClientes) => {
    localStorage.setItem('crm_clientes', JSON.stringify(newClientes));
    setClientes(newClientes);
    window.dispatchEvent(new Event('storage'));
  };

  const handleOpenDialog = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData(cliente);
    } else {
      setEditingCliente(null);
      setFormData({ nome: '', telefone: '', email: '', endereco: '', observacoes: '' });
    }
    openDialog('clientes');
  };

  const handleCloseDialog = () => {
    closeDialog('clientes');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.telefone) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    const newCliente = {
      id: editingCliente ? editingCliente.id : Date.now(),
      ...formData,
      createdAt: editingCliente ? editingCliente.createdAt : new Date().toISOString()
    };

    let updatedClientes;
    if (editingCliente) {
      updatedClientes = clientes.map(c => c.id === editingCliente.id ? newCliente : c);
      toast({
        title: "Sucesso!",
        description: "Cliente atualizado com sucesso!"
      });
    } else {
      updatedClientes = [...clientes, newCliente];
      toast({
        title: "Sucesso!",
        description: "Cliente cadastrado com sucesso!"
      });
    }

    saveClientes(updatedClientes);
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    const updatedClientes = clientes.filter(c => c.id !== id);
    saveClientes(updatedClientes);
    toast({
      title: "Sucesso!",
      description: "Cliente removido com sucesso!"
    });
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Clientes</h1>
          <p className="text-slate-600 dark:text-slate-400">Gerencie seus clientes</p>
        </div>
        
        <Dialog open={dialogs.clientes} onOpenChange={handleCloseDialog}>
          <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Nome completo"
                  required
                />
              </div>
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
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  placeholder="Endereço completo"
                />
              </div>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingCliente ? 'Atualizar' : 'Cadastrar'}
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
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClientes.map((cliente, index) => (
          <motion.div
            key={cliente.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                {cliente.nome}
              </h3>
              <div className="flex space-x-1">
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
                  onClick={() => handleDelete(cliente.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{cliente.telefone}</span>
              </div>
              {cliente.email && (
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{cliente.email}</span>
                </div>
              )}
              {cliente.endereco && (
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{cliente.endereco}</span>
                </div>
              )}
              {cliente.observacoes && (
                <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-700/50 rounded text-sm text-slate-600 dark:text-slate-400">
                  {cliente.observacoes}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredClientes.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {searchTerm ? 'Tente buscar com outros termos' : 'Comece cadastrando seu primeiro cliente'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientesModule;