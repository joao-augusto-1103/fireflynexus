import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';

const ConfirmacaoZeragem = ({ isOpen, onClose, onConfirm }) => {
  const [confirmacaoTexto, setConfirmacaoTexto] = useState('');
  const [confirmacaoCheckbox, setConfirmacaoCheckbox] = useState(false);
  
  const textoEsperado = "SIM, EU DESEJO ZERAR O BANCO DE DADOS";
  const isConfirmado = confirmacaoTexto === textoEsperado && confirmacaoCheckbox;

  const handleConfirm = () => {
    if (isConfirmado) {
      onConfirm();
      // Reset do formulário
      setConfirmacaoTexto('');
      setConfirmacaoCheckbox(false);
      onClose();
    }
  };

  const handleClose = () => {
    // Reset do formulário ao fechar
    setConfirmacaoTexto('');
    setConfirmacaoCheckbox(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-red-500">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            ⚠️ ZERAGEM COMPLETA DO BANCO DE DADOS
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-semibold mb-2">⚠️ ATENÇÃO - OPERAÇÃO IRREVERSÍVEL!</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>TODOS</strong> os dados serão removidos permanentemente</li>
                  <li>• <strong>TODOS</strong> os clientes serão deletados</li>
                  <li>• <strong>TODOS</strong> os produtos serão deletados</li>
                  <li>• <strong>TODAS</strong> as ordens de serviço serão deletadas</li>
                  <li>• <strong>TODOS</strong> os lançamentos financeiros serão deletados</li>
                  <li>• <strong>TODOS</strong> os usuários serão deletados</li>
                  <li>• <strong>NÃO HÁ COMO DESFAZER</strong> esta operação</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="confirmacao-texto" className="text-sm font-medium text-red-700 dark:text-red-300">
                Digite exatamente: <span className="font-mono bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded text-xs">
                  {textoEsperado}
                </span>
              </Label>
              <Input
                id="confirmacao-texto"
                value={confirmacaoTexto}
                onChange={(e) => setConfirmacaoTexto(e.target.value)}
                placeholder="Digite o texto de confirmação..."
                className="mt-1 border-red-300 dark:border-red-700 focus:border-red-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirmacao-checkbox"
                checked={confirmacaoCheckbox}
                onChange={(e) => setConfirmacaoCheckbox(e.target.checked)}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <Label htmlFor="confirmacao-checkbox" className="text-sm text-red-700 dark:text-red-300">
                <strong>Eu entendo que esta operação é irreversível</strong> e desejo continuar
              </Label>
            </div>
          </div>

          {isConfirmado && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                ✅ Confirmação válida - Pronto para zerar o banco de dados
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmado}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            ZERAR BANCO DE DADOS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmacaoZeragem;
