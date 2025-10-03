import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const ConfirmDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title = "Confirmar Exclusão", 
  description = "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.",
  confirmText = "Sim, Excluir",
  cancelText = "Cancelar",
  type = "delete" // delete, warning, info
}) => {
  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="h-6 w-6" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6" />;
      default:
        return <AlertTriangle className="h-6 w-6" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'delete':
        return {
          header: 'from-red-600 to-pink-600',
          icon: 'text-red-100',
          description: 'text-red-100',
          confirmButton: 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600',
          iconBg: 'bg-red-100 dark:bg-red-900/30'
        };
      case 'warning':
        return {
          header: 'from-amber-600 to-orange-600',
          icon: 'text-amber-100',
          description: 'text-amber-100',
          confirmButton: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
          iconBg: 'bg-amber-100 dark:bg-amber-900/30'
        };
      default:
        return {
          header: 'from-blue-600 to-indigo-600',
          icon: 'text-blue-100',
          description: 'text-blue-100',
          confirmButton: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30'
        };
    }
  };

  const colors = getColors();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <DialogHeader className={`bg-gradient-to-r ${colors.header} text-white p-6 -m-6 mb-6 rounded-t-lg`}>
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {getIcon()}
            </motion.div>
            {title}
          </DialogTitle>
          <DialogDescription className={colors.description}>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center py-6">
          <motion.div 
            className={`p-6 rounded-full ${colors.iconBg}`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {getIcon()}
          </motion.div>
        </div>
        
        <DialogFooter className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4 mr-2" />
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm}
            className={`${colors.confirmButton} text-white shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
