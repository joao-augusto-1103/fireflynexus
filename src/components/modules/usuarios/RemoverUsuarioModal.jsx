import React, { useState, useContext } from 'react';
import { Trash2, AlertTriangle, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { t } from '@/lib/translations';
import { AppContext } from '@/App';

const RemoverUsuarioModal = ({ usuario, isOpen, onClose, onConfirm }) => {
  const { currentLanguage: appLanguage } = useContext(AppContext);
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Função para lidar com a confirmação
  const handleConfirm = async () => {
    if (confirmText !== 'CONFIRMAR') {
      toast({
        title: t('usuarios.remocao.erroConfirmacao', appLanguage),
        description: t('usuarios.remocao.erroConfirmacaoDescricao', appLanguage),
        variant: 'destructive',
        duration: 4000
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      onConfirm(usuario.id);

    } catch (error) {
      toast({
        title: t('usuarios.remocao.erro', appLanguage),
        description: t('usuarios.remocao.erroDescricao', appLanguage),
        variant: 'destructive',
        duration: 4000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fechar modal
  const handleClose = () => {
    if (!isLoading) {
      setConfirmText('');
      onClose();
    }
  };

  // Função para lidar com mudança no texto de confirmação
  const handleConfirmTextChange = (e) => {
    setConfirmText(e.target.value);
  };

  if (!usuario) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {t('usuarios.remocao.titulo', appLanguage)}
          </DialogTitle>
          <DialogDescription>
            {t('usuarios.remocao.descricao', appLanguage)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do usuário */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                {usuario.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {usuario.nome}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {usuario.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                    {usuario.tipo === 'administrador' ? 'Administrador' :
                     t('usuarios.tipos.comum', appLanguage)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    usuario.status === 'ativo'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                  }`}>
                    {usuario.status === 'ativo' ? t('usuarios.status.ativo', appLanguage) : t('usuarios.status.inativo', appLanguage)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso de confirmação */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  {t('usuarios.remocao.aviso.titulo', appLanguage)}
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {t('usuarios.remocao.aviso.descricao', appLanguage)}
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 list-disc list-inside space-y-1">
                  <li>{t('usuarios.remocao.aviso.item1', appLanguage)}</li>
                  <li>{t('usuarios.remocao.aviso.item2', appLanguage)}</li>
                  <li>{t('usuarios.remocao.aviso.item3', appLanguage)}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Campo de confirmação */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('usuarios.remocao.confirmacao.label', appLanguage)}
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('usuarios.remocao.confirmacao.descricao', appLanguage)}
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={handleConfirmTextChange}
              placeholder={t('usuarios.remocao.confirmacao.placeholder', appLanguage)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              {t('usuarios.remocao.cancelar', appLanguage)}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || confirmText !== 'CONFIRMAR'}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('usuarios.remocao.removendo', appLanguage)}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('usuarios.remocao.confirmar', appLanguage)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemoverUsuarioModal;
