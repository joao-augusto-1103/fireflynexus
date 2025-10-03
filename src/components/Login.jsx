import React, { useState, useEffect, useContext } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { useUsuarios, useConfiguracao } from '@/lib/hooks/useFirebase';
import { User, Lock, Mail, Camera, Shield, ArrowRight, LogIn, Clock, X } from 'lucide-react';

const Login = ({ onLogin }) => {
  const { toast } = useToast();
  
  // Hooks
  const { 
    usuarios, 
    loading: usuariosLoading, 
    saveUsuario, 
    findUsuarioByEmail,
    emailExists,
    countUsuariosAtivos,
    error: usuariosError 
  } = useUsuarios();
  
  
  const { config: configuracoes, loading: configLoading } = useConfiguracao();

  // Estados
  const [form, setForm] = useState({ email: '', senha: '' });
  const [lembrarEmail, setLembrarEmail] = useState(() => localStorage.getItem('crm_lembrar_email') === 'true');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ 
    nome: '', 
    email: '', 
    senha: '', 
    telefone: '', 
    tipo: 'comum', 
    foto: '' 
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showApprovalNotification, setShowApprovalNotification] = useState(false);

  // Carregar email salvo se lembrar estiver ativo
  useEffect(() => {
    if (lembrarEmail) {
      const emailSalvo = localStorage.getItem('crm_lembrar_email_valor');
      if (emailSalvo) {
        setForm(prev => ({ ...prev, email: emailSalvo }));
      }
    }
  }, [lembrarEmail]);

  // Função para alternar lembrar email
  const toggleLembrarEmail = () => {
    const novoValor = !lembrarEmail;
    setLembrarEmail(novoValor);
    
    if (novoValor) {
      localStorage.setItem('crm_lembrar_email', 'true');
      if (form.email) {
        localStorage.setItem('crm_lembrar_email_valor', form.email);
      }
    } else {
      localStorage.removeItem('crm_lembrar_email');
      localStorage.removeItem('crm_lembrar_email_valor');
    }
  };

  // Função para atualizar email salvo
  const handleEmailChange = (value) => {
    setForm(prev => ({ ...prev, email: value }));
    if (lembrarEmail && value) {
      localStorage.setItem('crm_lembrar_email_valor', value);
    }
  };

  // Função de login
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Login] Iniciando processo de login...', form);
    
    if (!form.email || !form.senha) {
      toast({ title: 'Preencha todos os campos!', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Verificar se Firebase está carregando
      if (usuariosLoading) {
        console.log('[Login] Aguardando carregamento de usuários...');
        toast({ 
          title: 'Carregando usuários...', 
          description: 'Aguarde um momento.',
          variant: 'default' 
        });
        setLoading(false);
        return;
      }

      // Verificar se há erro no carregamento
      if (usuariosError) {
        console.log('[Login] Erro ao carregar usuários:', usuariosError);
        toast({ 
          title: 'Erro de conexão!', 
          description: 'Não foi possível carregar os usuários. Verifique sua conexão.',
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }

      // Verificar se há usuários
      if (!usuarios || usuarios.length === 0) {
        console.log('[Login] Nenhum usuário cadastrado no sistema');
        toast({ 
          title: 'Nenhum usuário cadastrado!', 
          description: 'Você precisa registrar um usuário primeiro.',
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }


      // Buscar usuário no Firebase
      const usuario = findUsuarioByEmail(form.email);
      
      if (!usuario) {
        console.log('[Login] Usuário não encontrado para:', form.email);
        toast({ title: 'E-mail ou senha inválidos!', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Verificar senha
      if (usuario.senha !== form.senha) {
        console.log('[Login] Senha incorreta para:', form.email);
        toast({ title: 'E-mail ou senha inválidos!', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Verificar status do usuário
      if (usuario.status === 'pendente') {
        console.log('[Login] Usuário pendente de aprovação');
        toast({ 
          title: 'Cadastro pendente de aprovação', 
          description: 'Seu cadastro ainda está aguardando aprovação do administrador.',
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }

      if (usuario.status === 'inativo') {
        console.log('[Login] Usuário inativo');
        toast({ 
          title: 'Usuário inativo', 
          description: 'Sua conta foi desativada. Entre em contato com o administrador.',
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }

      if (usuario.status === 'rejeitado') {
        console.log('[Login] Usuário rejeitado');
        toast({ 
          title: 'Cadastro rejeitado', 
          description: 'Seu cadastro foi rejeitado. Entre em contato com o administrador.',
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }

      console.log('[Login] Usuário encontrado e validado:', usuario);

      // Salvar dados do usuário logado
      const usuarioLogado = {
        ...usuario,
        ultimoAcesso: new Date().toISOString()
      };
      
      localStorage.setItem('crm_usuario_logado', JSON.stringify(usuarioLogado));

      // Atualizar último acesso no Firebase (sem bloquear o login)
      try {
        await saveUsuario(usuarioLogado);
      } catch (error) {
        console.warn('[Login] Erro ao atualizar último acesso:', error);
        // Não bloquear o login por causa disso
      }

      toast({ 
        title: 'Login realizado com sucesso!', 
        description: `Bem-vindo, ${usuario.nome}!`,
        variant: 'default' 
      });

      onLogin(usuarioLogado);

    } catch (error) {
      console.error('[Login] Erro durante login:', error);
      toast({ 
        title: 'Erro interno!', 
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Função de registro
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    console.log('[Login] Iniciando registro...', registerForm);
    setRegisterLoading(true);
    
    try {
      // Verificar limite de usuários (sempre permitir até 10)
      const usuariosAtivos = countUsuariosAtivos();
      const limiteUsuarios = 10; // Limite fixo para teste
      
      console.log('[Login] Verificação de limite:', { usuariosAtivos, limiteUsuarios });
      
      if (usuariosAtivos >= limiteUsuarios) {
        console.log('[Login] Limite de usuários atingido - mostrando toast');
        toast({ 
          title: 'Limite de usuários atingido', 
          description: `O sistema atingiu o limite máximo de ${limiteUsuarios} usuários. Entre em contato com o administrador.`,
          variant: 'destructive' 
        });
        setRegisterLoading(false);
        return;
      }

      // Validar campos obrigatórios
      if (!registerForm.nome || !registerForm.email || !registerForm.senha) {
        console.log('[Login] Campos obrigatórios não preenchidos');
        toast({ title: 'Preencha todos os campos obrigatórios!', variant: 'destructive' });
        setRegisterLoading(false);
        return;
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerForm.email)) {
        toast({ title: 'Email inválido!', variant: 'destructive' });
        setRegisterLoading(false);
        return;
      }

      // Validar senha
      if (registerForm.senha.length < 6) {
        toast({ title: 'A senha deve ter pelo menos 6 caracteres!', variant: 'destructive' });
        setRegisterLoading(false);
        return;
      }

      // Verificar se email já existe
      if (emailExists(registerForm.email)) {
        toast({ title: 'Este email já está cadastrado!', variant: 'destructive' });
        setRegisterLoading(false);
        return;
      }

      // Status sempre ativo para teste
      const statusUsuario = 'ativo';
      
      // Criar novo usuário - ESTRUTURA CORRETA PARA FIREBASE
      const novoUsuario = {
        nome: registerForm.nome.trim(),
        email: registerForm.email.trim(),
        senha: registerForm.senha,
        telefone: registerForm.telefone?.trim() || '',
        endereco: '', // Campo obrigatório
        tipo: registerForm.tipo || 'comum',
        status: statusUsuario,
        foto: registerForm.foto || '',
        ativo: true, // Campo obrigatório
        dataCriacao: new Date().toISOString(),
        ultimaAtualizacao: new Date().toISOString(),
        ultimoAcesso: null
      };

      console.log('[Login] Criando novo usuário:', novoUsuario);
      
      try {
        
        // Validação rigorosa dos dados
        if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) {
          throw new Error('Campos obrigatórios não preenchidos');
        }
        
        if (typeof novoUsuario.nome !== 'string' || typeof novoUsuario.email !== 'string' || typeof novoUsuario.senha !== 'string') {
          throw new Error('Tipos de dados inválidos');
        }
        
        // Validação da foto
        if (novoUsuario.foto && typeof novoUsuario.foto !== 'string') {
          console.warn('[Login] Foto inválida, removendo...');
          novoUsuario.foto = '';
        }
        
        // Limitar tamanho da foto se muito grande
        if (novoUsuario.foto && novoUsuario.foto.length > 1000000) { // 1MB em base64
          console.warn('[Login] Foto muito grande, removendo...');
          novoUsuario.foto = '';
        }
        
        // Teste: verificar se saveUsuario é uma função
        if (typeof saveUsuario !== 'function') {
          throw new Error('saveUsuario não é uma função válida');
        }
        
        const resultado = await saveUsuario(novoUsuario);
        console.log('[Login] ✅ Usuário registrado com sucesso! ID:', resultado);
        
        // Verificar se o resultado é válido
        if (!resultado) {
          throw new Error('saveUsuario retornou resultado inválido');
        }
        
      } catch (error) {
        console.error('[Login] ❌ Erro ao registrar usuário:', error);
        console.error('[Login] Stack trace:', error.stack);
        console.error('[Login] Tipo do erro:', typeof error);
        console.error('[Login] Mensagem do erro:', error.message);
        
        toast({ 
          title: 'Erro ao registrar usuário', 
          description: error.message || 'Erro desconhecido ao registrar usuário.',
          variant: 'destructive' 
        });
        setRegisterLoading(false);
        return;
      }

      console.log('[Login] Usuário registrado com sucesso!');
      
      if (statusUsuario === 'pendente') {
        toast({ 
          title: 'Cadastro enviado para aprovação!', 
          description: 'Seu cadastro foi enviado para aprovação. Você receberá uma notificação quando for aprovado.' 
        });
        // Mostrar notificação visual no canto da tela
        setShowApprovalNotification(true);
        // Voltar para tela de login após 2 segundos
        setTimeout(() => {
          setShowRegister(false);
        }, 2000);
        // Fechar notificação após 8 segundos
        setTimeout(() => {
          setShowApprovalNotification(false);
        }, 8000);
      } else {
        toast({ 
          title: 'Usuário registrado com sucesso!', 
          description: 'Agora você pode fazer login com suas credenciais.' 
        });
        console.log('[Login] Voltando para tela de login...');
        setShowRegister(false);
      }
      
      setRegisterLoading(false);
      setRegisterForm({ nome: '', email: '', senha: '', telefone: '', tipo: 'comum', foto: '' });

    } catch (error) {
      console.error('[Login] Erro ao registrar usuário:', error);
      toast({ 
        title: 'Erro ao registrar!', 
        description: 'Não foi possível registrar o usuário. Tente novamente.',
        variant: 'destructive' 
      });
      setRegisterLoading(false);
    }
  };

  // Função para upload de foto
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Verificar tamanho do arquivo (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({ 
          title: 'Arquivo muito grande', 
          description: 'A foto deve ter no máximo 2MB.', 
          variant: 'destructive' 
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setRegisterForm(prev => ({ ...prev, foto: base64 }));
      };
      reader.onerror = () => {
        console.error('[Login] Erro ao ler arquivo de foto');
        toast({ 
          title: 'Erro ao carregar foto', 
          description: 'Não foi possível processar a imagem.', 
          variant: 'destructive' 
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {!showRegister ? (
          // Tela de Login
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 space-y-6"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Bem-vindo de volta
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Faça login para acessar sua conta
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Digite seu email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="senha"
                    type="password"
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    placeholder="Digite sua senha"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={lembrarEmail}
                    onChange={toggleLembrarEmail}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Lembrar email
                  </span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || usuariosLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Não tem conta? Registrar-se
              </button>
            </div>
          </motion.form>
        ) : (
          // Tela de Registro
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleRegisterSubmit}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 space-y-6"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Criar conta
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Preencha os dados para se registrar
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={registerForm.nome}
                  onChange={(e) => setRegisterForm({ ...registerForm, nome: e.target.value })}
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="Digite seu email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha *</Label>
                <Input
                  id="senha"
                  type="password"
                  value={registerForm.senha}
                  onChange={(e) => setRegisterForm({ ...registerForm, senha: e.target.value })}
                  placeholder="Digite sua senha (mín. 6 caracteres)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={registerForm.telefone}
                  onChange={(e) => setRegisterForm({ ...registerForm, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="foto">Foto de Perfil</Label>
                <div className="flex items-center space-x-4">
                  {registerForm.foto && (
                    <div className="relative">
                      <img
                        src={registerForm.foto}
                        alt="Preview"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setRegisterForm(prev => ({ ...prev, foto: '' }))}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <Camera className="h-8 w-8 text-slate-400 hover:text-purple-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {!registerForm.foto && (
                    <span className="text-sm text-slate-500">Opcional</span>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={registerLoading}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
            >
              {registerLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando conta...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Criar conta
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Já tem conta? 
                <span className="text-purple-600 dark:text-purple-400 font-semibold">Entrar</span>
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
      
      {/* Notificação de Aprovação Pendente */}
      {showApprovalNotification && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg border border-blue-700">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Aguardando Aprovação</h4>
                <p className="text-xs text-blue-100 mt-1">
                  Seu cadastro foi enviado para aprovação. Você receberá uma notificação quando for aprovado.
                </p>
              </div>
              <button
                onClick={() => setShowApprovalNotification(false)}
                className="flex-shrink-0 text-blue-200 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Login;