import { useContext } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/App';
import { useConfiguracoesUsuarios } from './useFirebase';

export const usePermissions = () => {
  const { usuarioLogado } = useContext(AppContext);
  const { config: configUsuarios } = useConfiguracoesUsuarios();
  const { toast } = useToast();

  // Buscar permissões do usuário atual
  const getUsuarioPermissoes = () => {
    if (!usuarioLogado) return {};
    
    // Administradores têm acesso total
    if (usuarioLogado.tipo === 'administrador') {
      return {
        clientes: { visualizar: true, criar: true, editar: true, excluir: true },
        os: { visualizar: true, criar: true, editar: true, excluir: true },
        ov: { visualizar: true, criar: true, editar: true, excluir: true },
        estoque: { visualizar: true, criar: true, editar: true, excluir: true },
        caixa: { visualizar: true, criar: true, editar: true, excluir: true },
        financeiro: { visualizar: true, criar: true, editar: true, excluir: true },
        relatorios: { visualizar: true, criar: true, editar: true, excluir: true },
        configuracoes: { visualizar: true, criar: true, editar: true, excluir: true }
      };
    }

    // Buscar permissões das configurações globais de usuários
    return configUsuarios?.permissoes || {};
  };

  const permissoes = getUsuarioPermissoes();

  // Função para verificar permissão e mostrar toast se necessário
  const checkPermission = (modulo, acao, showToast = true) => {
    const permissao = permissoes[modulo]?.[acao];
    
    if (!permissao) {
      if (showToast) {
        const moduloTitulos = {
          clientes: 'Clientes',
          os: 'Ordens de Serviço',
          ov: 'Ordens de Venda',
          estoque: 'Estoque',
          caixa: 'Caixa',
          financeiro: 'Financeiro',
          relatorios: 'Relatórios',
          configuracoes: 'Configurações'
        };

        const acaoTitulos = {
          visualizar: 'visualizar',
          criar: 'criar',
          editar: 'editar',
          excluir: 'excluir'
        };

        toast({
          title: 'Permissão negada',
          description: `Você não tem permissão para ${acaoTitulos[acao]} no módulo ${moduloTitulos[modulo]}.`,
          variant: 'destructive'
        });
      }
      return false;
    }
    
    return true;
  };

  // Funções de conveniência para cada ação
  const canView = (modulo) => checkPermission(modulo, 'visualizar');
  const canCreate = (modulo) => checkPermission(modulo, 'criar');
  const canEdit = (modulo) => checkPermission(modulo, 'editar');
  const canDelete = (modulo) => checkPermission(modulo, 'excluir');

  // Funções que não mostram toast (para uso em condicionais)
  const hasPermission = (modulo, acao) => {
    const permissao = permissoes[modulo]?.[acao];
    return permissao === true;
  };

  return {
    permissoes,
    checkPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    hasPermission
  };
};
