import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Shield, 
  DollarSign, 
  User as UserIcon,
  MoreVertical,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useUsuarios } from '@/lib/hooks/useFirebase';
import EditarUsuarioModal from './EditarUsuarioModal';
import RemoverUsuarioModal from './RemoverUsuarioModal';
import { AppContext } from '@/App';

const UsuariosListagem = () => {
  const { currentLanguage } = useContext(AppContext);
  const { toast } = useToast();
  
  // Hook para gerenciar usuários
  const { 
    usuarios, 
    loading: usuariosLoading, 
    saveUsuario, 
    removeUsuario,
    findUsuarioById,
    emailExists
  } = useUsuarios();
  
  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  
  // Estados dos modais
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  // Filtrar usuários
  const usuariosFiltrados = usuarios?.filter(usuario => {
    const matchSearch = usuario.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       usuario.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'todos' || usuario.status === statusFilter;
    const matchTipo = tipoFilter === 'todos' || usuario.tipo === tipoFilter;
    
    return matchSearch && matchStatus && matchTipo;
  }) || [];

  // Função para obter ícone do tipo
  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'administrador':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'financeiro':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'inativo':
        return 'bg-red-100 text-red-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para alternar status do usuário
  const toggleUserStatus = async (usuario) => {
    try {
      const novoStatus = usuario.status === 'ativo' ? 'inativo' : 'ativo';
      
      // Atualizar apenas o status, mantendo o ID original
      const usuarioAtualizado = {
        id: usuario.id, // Manter o ID original
        nome: usuario.nome,
        email: usuario.email,
        senha: usuario.senha,
        telefone: usuario.telefone || '',
        endereco: usuario.endereco || '',
        tipo: usuario.tipo,
        status: novoStatus,
        foto: usuario.foto || '',
        dataCriacao: usuario.dataCriacao,
        ultimoAcesso: usuario.ultimoAcesso
      };
      
      console.log('[UsuariosListagem] Atualizando usuário:', usuarioAtualizado);
      await saveUsuario(usuarioAtualizado);
      
      toast({
        title: novoStatus === 'ativo' ? 'Usuário ativado!' : 'Usuário desativado!',
        description: novoStatus === 'ativo' 
          ? 'O usuário agora pode fazer login no sistema.'
          : 'O usuário foi bloqueado e não pode mais fazer login.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do usuário.',
        variant: 'destructive'
      });
    }
  };

  // Função para excluir usuário
  const handleDeleteUser = async (usuario) => {
    try {
      console.log('[UsuariosListagem] Excluindo usuário:', usuario.id);
      await removeUsuario(usuario.id);
      
      toast({
        title: 'Usuário excluído!',
        description: 'Usuário removido permanentemente do sistema.',
        variant: 'default'
      });
      
      setShowDeleteModal(false);
      setUsuarioSelecionado(null);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro ao excluir usuário',
        description: 'Não foi possível excluir o usuário.',
        variant: 'destructive'
      });
    }
  };

  // Função para salvar edição
  const handleSaveEdit = async (usuarioAtualizado) => {
    try {
      console.log('[UsuariosListagem] Salvando edição:', usuarioAtualizado);
      await saveUsuario(usuarioAtualizado);
      
      toast({
        title: 'Usuário atualizado!',
        description: 'As informações do usuário foram salvas com sucesso.',
        variant: 'default'
      });
      
      setShowEditModal(false);
      setUsuarioSelecionado(null);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: 'Erro ao atualizar usuário',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive'
      });
    }
  };

  if (usuariosLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6" />
            Usuários do Sistema
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie todos os usuários cadastrados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="comum">Comum</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
            <SelectItem value="administrador">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardContent className="p-0">
          {usuariosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm || statusFilter !== 'todos' || tipoFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Cadastre o primeiro usuário do sistema.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {usuariosFiltrados.map((usuario) => (
                <motion.div
                  key={usuario.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={usuario.foto && usuario.foto.trim() !== '' ? usuario.foto : undefined} 
                          alt={usuario.nome}
                          onError={(e) => {
                            console.warn('[UsuariosListagem] Erro ao carregar foto:', usuario.nome, e);
                          }}
                        />
                        <AvatarFallback>
                          {usuario.nome?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {usuario.nome || 'Nome não informado'}
                          </h4>
                          {getTipoIcon(usuario.tipo)}
                          <Badge className={`text-xs ${getStatusColor(usuario.status)}`}>
                            {usuario.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {usuario.email}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setUsuarioSelecionado(usuario);
                          setShowEditModal(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleUserStatus(usuario)}>
                          {usuario.status === 'ativo' ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setUsuarioSelecionado(usuario);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      {showEditModal && usuarioSelecionado && (
        <EditarUsuarioModal
          usuario={usuarioSelecionado}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setUsuarioSelecionado(null);
          }}
          onSave={handleSaveEdit}
        />
      )}

      {showDeleteModal && usuarioSelecionado && (
        <RemoverUsuarioModal
          usuario={usuarioSelecionado}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setUsuarioSelecionado(null);
          }}
          onConfirm={() => handleDeleteUser(usuarioSelecionado)}
        />
      )}
    </div>
  );
};

export default UsuariosListagem;