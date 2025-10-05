import React, { useState, useContext, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { t } from '@/lib/translations';
import { AppContext } from '@/App';
import { UserPlus, Mail, Lock, User, Phone, MapPin, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useUsuarios, useConfiguracoesUsuarios } from '@/lib/hooks/useFirebase';

const CadastroUsuarioForm = () => {
  const { currentLanguage: appLanguage } = useContext(AppContext);
  const { toast } = useToast();
  const { usuarios, saveUsuario } = useUsuarios();
  const { config: configuracoes } = useConfiguracoesUsuarios();
  
   const [formData, setFormData] = useState({
     nome: '',
     email: '',
     senha: '',
     confirmarSenha: '',
     telefone: '',
     tipoUsuario: 'comum',
     ativo: true,
     foto: ''
   });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fotoPreview, setFotoPreview] = useState('');
  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funções para drag & drop de foto
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      // Verificar tamanho do arquivo (máximo 1MB)
      if (file.size > 1048576) {
        toast({ 
          title: 'Arquivo muito grande!', 
          description: 'A imagem deve ter no máximo 1MB. Por favor, escolha uma imagem menor.',
          variant: 'destructive' 
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        // Comprimir a imagem antes de salvar
        compressImage(e.target.result, (compressedImage) => {
          setFotoPreview(compressedImage);
          setFormData(prev => ({ ...prev, foto: compressedImage }));
        });
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione apenas arquivos de imagem.',
        variant: 'destructive'
      });
    }
  };

  // Função para comprimir imagem
  const compressImage = (imageDataUrl, callback) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Redimensionar para máximo 200x200px
      const maxSize = 200;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Converter para base64 com qualidade reduzida
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      callback(compressedDataUrl);
    };
    
    img.src = imageDataUrl;
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFoto = () => {
    setFotoPreview('');
    setFormData(prev => ({ ...prev, foto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    // Validação básica
    if (!formData.nome.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O nome é obrigatório.',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O email é obrigatório.',
        variant: 'destructive'
      });
      return false;
    }

    // Validação de email simples
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.senha) {
      toast({
        title: 'Erro de validação',
        description: 'A senha é obrigatória.',
        variant: 'destructive'
      });
      return false;
    }

    if (formData.senha.length < 6) {
      toast({
        title: 'Erro de validação',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive'
      });
      return false;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: 'Erro de validação',
        description: 'As senhas não coincidem.',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Verificar se cadastro está permitido
    const permitirCadastro = configuracoes?.permitirCadastro ?? true; // Padrão: sempre permitido
    if (!permitirCadastro) {
      toast({
        title: 'Cadastro desabilitado',
        description: 'O cadastro de novos usuários está temporariamente desabilitado pelo administrador.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Verificar limite de usuários
      const usuariosAtivos = usuarios?.filter(u => u.status === 'ativo' || u.status === 'pendente').length || 0;
      const limiteUsuarios = configuracoes?.limiteUsuarios || 10;
      
      if (usuariosAtivos >= limiteUsuarios) {
        toast({
          title: 'Limite de usuários atingido',
          description: `O sistema atingiu o limite máximo de ${limiteUsuarios} usuários. Para cadastrar novos usuários, remova usuários existentes ou aumente o limite nas configurações.`,
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      if (usuarios.some(u => u.email === formData.email)) {
        toast({
          title: 'Erro de validação',
          description: 'Este email já está cadastrado.',
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }
      
       const novoUsuario = {
         nome: formData.nome,
         email: formData.email,
         senha: formData.senha,
         telefone: formData.telefone,
         tipo: formData.tipoUsuario,
         foto: formData.foto,
         status: 'ativo',
         dataCriacao: new Date().toISOString(),
         ultimoAcesso: null
       };
      
      console.log('[CadastroUsuario] Dados do formulário:', formData);
      console.log('[CadastroUsuario] Novo usuário:', novoUsuario);
      
      console.log('[CadastroUsuario] Salvando usuário...');
      const resultado = await saveUsuario(novoUsuario);
      console.log('[CadastroUsuario] Usuário salvo com sucesso! ID:', resultado);

      toast({
        title: 'Usuário cadastrado!',
        description: `${formData.nome} foi cadastrado com sucesso.`,
        variant: 'default'
      });

       // Limpar formulário
       setFormData({
         nome: '',
         email: '',
         senha: '',
         confirmarSenha: '',
         telefone: '',
         tipoUsuario: 'comum',
         ativo: true,
         foto: ''
       });
      setFotoPreview('');

    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Ocorreu um erro ao cadastrar o usuário. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Pessoais */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="h-5 w-5" />
          Informações Pessoais
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Digite o nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="usuario@exemplo.com"
              required
            />
          </div>

           <div className="space-y-2">
             <Label htmlFor="telefone">Telefone</Label>
             <Input
               id="telefone"
               type="tel"
               value={formData.telefone}
               onChange={(e) => handleInputChange('telefone', e.target.value)}
               placeholder="(11) 99999-9999"
             />
           </div>

           <div className="space-y-2">
             <Label htmlFor="tipoUsuario">Tipo de Usuário</Label>
             <Select value={formData.tipoUsuario} onValueChange={(value) => handleInputChange('tipoUsuario', value)}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="comum">Usuário Comum</SelectItem>
                 <SelectItem value="administrador">Administrador</SelectItem>
               </SelectContent>
             </Select>
           </div>
        </div>
      </div>

      {/* Campo de Foto */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Foto do Usuário
        </h3>
        
        <div className="space-y-4">
          {/* Área de drag & drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Preview da foto dentro da área */}
            {fotoPreview ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={fotoPreview}
                    alt="Preview da foto"
                    className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={removeFoto}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p className="font-medium">Foto selecionada!</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2"
                  >
                    Trocar imagem
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-slate-400" />
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p className="font-medium">Arraste e solte uma imagem aqui</p>
                  <p>ou</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2"
                  >
                    Selecione uma imagem
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  PNG, JPG, GIF até 1MB
                </p>
              </div>
            )}
          </div>

          {/* Input hidden para arquivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Informações de Acesso */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Informações de Acesso
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="senha">Senha *</Label>
            <Input
              id="senha"
              type="password"
              value={formData.senha}
              onChange={(e) => handleInputChange('senha', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

           <div className="space-y-2">
             <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
             <Input
               id="confirmarSenha"
               type="password"
               value={formData.confirmarSenha}
               onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
               placeholder="Digite a senha novamente"
               required
             />
           </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
        <Button
          type="button"
          variant="outline"
           onClick={() => {
             setFormData({
               nome: '',
               email: '',
               senha: '',
               confirmarSenha: '',
               telefone: '',
               tipoUsuario: 'comum',
               ativo: true,
               foto: ''
             });
             setFotoPreview('');
           }}
          disabled={isSubmitting}
        >
          Limpar
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Cadastrando...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar Usuário
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default CadastroUsuarioForm;

