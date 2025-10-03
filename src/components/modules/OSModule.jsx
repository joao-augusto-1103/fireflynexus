import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Printer, Phone, Lock, FileText, DollarSign, Clock, User, Calendar, AlertCircle, CheckCircle, Settings, Eye, Filter, Download, Smartphone, Wrench, Battery, Shield, Users, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/App';
import { useOS, useClientes, useFinanceiro, useConfiguracoesLoja, useCaixa } from '@/lib/hooks/useFirebase';
import { firebaseService } from '@/lib/firebaseService';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import CustomerAvatar from '@/components/ui/customer-avatar';

const OSModule = ({ userId }) => {
  const { dialogs, openDialog, closeDialog } = useContext(AppContext);
  
  // Usar hooks do Firebase
  const { data: ordens, loading: ordensLoading, save: saveOS, remove: removeOS } = useOS();
  const { data: clientes, save: saveCliente } = useClientes();
  const { save: saveFinanceiro } = useFinanceiro();
  const { data: caixaData, save: saveCaixa } = useCaixa();
  
  // Estados para busca de clientes
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const { config: configLoja } = useConfiguracoesLoja();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [viewMode, setViewMode] = useState('grid'); // grid ou list
  const [editingOS, setEditingOS] = useState(null);
  
  // Estados para confirmação de exclusão
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [osToDelete, setOsToDelete] = useState(null);
  const [formData, setFormData] = useState({
    clienteNome: '',
    clienteTelefone: '',
    clienteId: '', // ID do cliente selecionado
    endereco: '',
    titulo: '',
    marcaModelo: '',
    senha: '',
    valor: '',
    observacoes: '',
    status: 'Pendente',
    formaPagamento: 'dinheiro',
    formasPagamento: [{ id: Date.now(), tipo: 'dinheiro', valor: 0, observacao: '' }],
    parcelamento: { ativo: false, parcelas: 1, intervalo: 'mensal' }
  });
  const { toast } = useToast();

  console.log('[OS] ===== DADOS CARREGADOS =====');
  console.log('[OS] Ordens:', ordens);
  console.log('[OS] Clientes:', clientes);
  console.log('[OS] Loading:', ordensLoading);


  const handleOpenDialog = (os = null) => {
    try {
      console.log('[OS] Abrindo dialog para OS:', os);
      
      if (os) {
        setEditingOS(os);
        // Mapear dados da OS para o formato esperado pelo formulário
        setFormData({
          clienteNome: os.cliente || os.clienteNome || '',
          clienteTelefone: os.telefone || os.clienteTelefone || '',
          clienteId: os.clienteId || '',
          titulo: os.equipamento || os.titulo || '',
          senha: os.senha || os.numero || '',
          valor: os.valor ? os.valor.toString() : '',
          observacoes: os.observacoes || '',
          status: os.status || 'Pendente',
          formaPagamento: os.formaPagamento || 'dinheiro',
          formasPagamento: os.formasPagamento || [{ id: Date.now(), tipo: os.formaPagamento || 'dinheiro', valor: parseFloat(os.valor) || 0, observacao: '' }],
          parcelamento: os.parcelamento || { ativo: false, parcelas: 1, intervalo: 'mensal' }
        });
        console.log('[OS] Editando OS:', os);
      } else {
        setEditingOS(null);
        setFormData({ 
          clienteNome: '', 
          clienteTelefone: '', 
          clienteId: '', 
          titulo: '', 
          senha: '', 
          valor: '', 
          observacoes: '', 
          status: 'Pendente',
          formaPagamento: 'dinheiro',
          formasPagamento: [{ id: Date.now(), tipo: 'dinheiro', valor: 0, observacao: '' }],
          parcelamento: { ativo: false, parcelas: 1, intervalo: 'mensal' }
        });
        console.log('[OS] Nova OS, formulário limpo');
      }
      
      openDialog('os');
      console.log('[OS] Dialog de OS aberto');
    } catch (error) {
      console.error('[OS] Erro ao abrir dialog:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir formulário de edição. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleCloseDialog = () => {
  closeDialog('os');
  console.log('[OS] Dialog de OS fechado');
  };

  const updateFinanceiro = async (os, action) => {
    try {
      console.log('[OS] 🔄 Iniciando atualização do financeiro para OS:', os.numero);
      
      if (action === 'add') {
        // Determinar forma de pagamento (múltiplas formas ou única)
        const formasPagamentoDetalhadas = os.formasPagamento && os.formasPagamento.length > 0 
          ? os.formasPagamento 
          : [{ tipo: os.formaPagamento || 'dinheiro', valor: parseFloat(os.valor) }];
        
        // Forma de pagamento principal para compatibilidade
        const formaPagamentoPrincipal = formasPagamentoDetalhadas[0].tipo;

        // Determinar cliente
        const clienteNome = os.cliente || os.clienteNome || 'Cliente não informado';
        const clienteTelefone = os.telefone || os.clienteTelefone || '';
        const clienteId = os.clienteId || '';

        // Criar entrada financeira única (com ou sem parcelamento)
        const valorParcela = os.parcelamento && os.parcelamento.ativo && os.parcelamento.parcelas > 1 
          ? parseFloat(os.valor) / os.parcelamento.parcelas 
          : parseFloat(os.valor);

        const newEntry = {
          descricao: `Recebimento da OS: ${os.numero}`,
          valor: parseFloat(os.valor),
          dataVencimento: new Date().toISOString().split('T')[0],
          tipo: 'receber',
          status: os.parcelamento && os.parcelamento.ativo && os.parcelamento.parcelas > 1 ? 'Pendente' : 'Concluído',
          categoria: 'servicos',
          formaPagamento: formaPagamentoPrincipal,
          cliente: clienteNome,
          telefone: clienteTelefone,
          clienteId: clienteId,
          origemId: `os-${os.id}`,
          observacoes: `Ordem de Serviço ${os.numero} - ${clienteNome}${formasPagamentoDetalhadas.length > 1 ? ` - Pagamento: ${formasPagamentoDetalhadas.map(fp => `${fp.tipo} (R$ ${fp.valor.toFixed(2)})`).join(', ')}` : ''}`,
          parcelamento: os.parcelamento && os.parcelamento.ativo && os.parcelamento.parcelas > 1 ? {
            ativo: true,
            parcelas: os.parcelamento.parcelas,
            intervalo: os.parcelamento.intervalo,
            valorParcela: valorParcela,
            parcelasGeradas: [],
            parcelasPagas: 0
          } : {
            ativo: false,
            parcelas: 1,
            intervalo: 'mensal',
            valorParcela: parseFloat(os.valor),
            parcelasGeradas: [],
            parcelasPagas: 0
          },
          formasPagamento: formasPagamentoDetalhadas,
          createdAt: new Date().toISOString()
        };
        
        console.log('[OS] 📝 Nova entrada financeira criada:', newEntry);
        await saveFinanceiro(newEntry);
        console.log('[OS] ✅ Entrada financeira salva no Firebase');
        
      } else if (action === 'remove') {
        console.log('[OS] 🗑️ Removendo entrada financeira para OS:', os.numero);
        // Para remover, seria necessário implementar uma função específica no hook
        // Por enquanto, apenas logamos a intenção
        console.log('[OS] ⚠️ Remoção de entrada financeira não implementada ainda');
      }
      
    } catch (error) {
      console.error('[OS] ❌ Erro ao atualizar financeiro:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar registro financeiro. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const updateCaixa = async (os) => {
    try {
      console.log('[OS] 🔄 Iniciando atualização do caixa para OS:', os.numero);
      
      // Verificar se há caixa aberto
      const caixaAberto = caixaData?.find(caixa => caixa.status === 'aberto');
      
      if (!caixaAberto) {
        console.log('[OS] ⚠️ Nenhum caixa aberto encontrado, não será adicionada transação');
        return;
      }
      
      console.log('[OS] ✅ Caixa aberto encontrado:', caixaAberto.id);
      
      // Criar transação de entrada no caixa
      const novaTransacao = {
        id: Date.now(),
        tipo: 'entrada',
        descricao: `Serviço OS #${os.numero}`,
        valor: parseFloat(os.valor),
        data: new Date().toISOString(),
        observacoes: `Cliente: ${os.clienteNome} - ${os.titulo}`,
        formaPagamento: os.formaPagamento || 'dinheiro',
        categoria: 'servico'
      };

      console.log('[OS] 📝 Nova transação criada:', novaTransacao);

      // Atualizar caixa com nova transação
      const caixaAtualizado = {
        ...caixaAberto,
        transacoes: [...(caixaAberto.transacoes || []), novaTransacao]
      };

      console.log('[OS] 💾 Salvando caixa atualizado...');
      await saveCaixa(caixaAtualizado, caixaAberto.id);
      console.log('[OS] ✅ Transação adicionada ao caixa com sucesso!');
      
    } catch (error) {
      console.error('[OS] ❌ Erro ao atualizar caixa:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar transação no caixa. Verifique se o caixa está aberto.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clienteNome || !formData.clienteTelefone || !formData.titulo || !formData.senha || !formData.valor) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos!",
        variant: "destructive"
      });
      return;
    }

    try {
      
      // Variável para controlar se cliente foi cadastrado ou encontrado
      let clienteExistente = null;
      let clienteFoiCadastrado = false;

      // Preparar dados da OS
      let newOS = {
        numero: editingOS ? editingOS.numero : `OS${String((ordens?.length || 0) + 1).padStart(4, '0')}`,
        ...formData,
        valor: parseFloat(formData.valor),
        total: parseFloat(formData.valor), // Adicionar campo total para compatibilidade com ClientesModule
        parcelamento: formData.parcelamento || { ativo: false, parcelas: 1, intervalo: 'mensal' },
        createdAt: editingOS ? editingOS.createdAt : new Date().toISOString()
      };
      
      console.log('[OS] Dados da OS:', newOS);

      // Se não está editando e tem cliente, verificar se precisa cadastrar
      if (!editingOS && formData.clienteNome.trim()) {
        // Buscar cliente existente
        clienteExistente = clientes.find(c => 
          c.nome.toLowerCase().includes(formData.clienteNome.toLowerCase()) ||
          (c.telefone && formData.clienteTelefone && c.telefone.includes(formData.clienteTelefone))
        );

        if (clienteExistente) {
          // Cliente encontrado, vincular
          newOS.clienteId = clienteExistente.id;
          newOS.clienteNome = clienteExistente.nome;
          newOS.clienteTelefone = clienteExistente.telefone || formData.clienteTelefone;
        } else {
          // Cliente não encontrado, cadastrar automaticamente
          try {
            const novoCliente = {
              nome: formData.clienteNome.trim(),
              telefone: formData.clienteTelefone.trim(),
              email: '',
              endereco: '',
              observacoes: 'Cadastrado automaticamente via ordem de serviço',
              createdAt: new Date().toISOString()
            };
            
            const clienteSalvo = await saveCliente(novoCliente);
            newOS.clienteId = clienteSalvo.id || Date.now();
            newOS.clienteNome = formData.clienteNome.trim();
            newOS.clienteTelefone = formData.clienteTelefone.trim();
            clienteFoiCadastrado = true;
          } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);
            // Mesmo com erro, salvar na OS sem cliente
            newOS.clienteId = '';
          }
        }
      }

      await saveOS(newOS, editingOS?.id);
      console.log('[OS] OS salva com sucesso:', newOS);
      console.log('[OS] ClienteId da OS:', newOS.clienteId);
      console.log('[OS] Total da OS:', newOS.total);

    if (editingOS) {
      toast({
        title: "Sucesso!",
        description: "OS atualizada com sucesso!"
      });
    } else {
      let description = "OS criada com sucesso!";
      
      // Adicionar informação sobre cliente se foi cadastrado
      if (newOS.clienteId && clienteFoiCadastrado) {
        description += ` Cliente "${newOS.clienteNome}" foi cadastrado automaticamente.`;
      } else if (newOS.clienteId && clienteExistente) {
        description += ` Cliente "${newOS.clienteNome}" vinculado da base.`;
      }
      
      toast({
        title: "Sucesso!",
        description: description
      });
    }

    if (newOS.status === 'Concluída') {
        await updateFinanceiro(newOS, 'add');
        // Adicionar ao caixa se estiver aberto
        await updateCaixa(newOS);
        console.log('[OS] ✅ OS criada como concluída e adicionada ao caixa');
    } else {
        await updateFinanceiro(newOS, 'remove');
        console.log('[OS] ✅ OS criada sem adicionar ao caixa');
    }

      setFormData({ clienteNome: '', clienteTelefone: '', clienteId: '', endereco: '', titulo: '', marcaModelo: '', senha: '', valor: '', observacoes: '', status: 'Pendente' });
      setEditingOS(null);
    handleCloseDialog();
    } catch (error) {
      console.error('[OS] ❌ Erro ao salvar OS:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar ordem de serviço. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (os) => {
    setOsToDelete(os);
    setConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!osToDelete) return;
    
    try {
      await updateFinanceiro(osToDelete, 'remove');
      
      console.log('[OS] Removendo OS:', osToDelete.id);
      await removeOS(osToDelete.id);
      
      toast({
        title: "Sucesso!",
        description: "OS removida com sucesso!"
      });
      setConfirmDeleteOpen(false);
      setOsToDelete(null);
    } catch (error) {
      console.error('[OS] ❌ Erro ao remover OS:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover ordem de serviço. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para alterar status rapidamente
  const handleStatusChange = async (osId, newStatus) => {
    try {
      const os = ordens.find(o => o.id === osId);
      if (!os) return;

      const updatedOS = {
        ...os,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      await saveOS(updatedOS, osId);
      
      // Atualizar financeiro baseado no novo status
      if (newStatus === 'Concluída') {
        await updateFinanceiro(updatedOS, 'add');
        // Adicionar ao caixa se estiver aberto
        await updateCaixa(updatedOS);
        console.log('[OS] ✅ OS marcada como concluída e adicionada ao caixa');
      } else {
        await updateFinanceiro(updatedOS, 'remove');
        console.log('[OS] ✅ OS removida do financeiro');
      }
      
      toast({
        title: "Status atualizado!",
        description: `OS ${os.numero} agora está ${newStatus.toLowerCase()}`
      });
    } catch (error) {
      console.error('[OS] ❌ Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da OS. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = (os) => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const osNumber = os.numero || `OS${String((ordens?.length || 0) + 1).padStart(4, '0')}`;
    
    // Usar configurações da loja ou valores padrão
    const empresa = configLoja || {};
    const nomeEmpresa = empresa.nomeEmpresa || 'MultiSmart';
    const descricao = empresa.descricao || 'Manutenção e Comércio de Celulares e Tablets';
    const endereco = empresa.endereco || 'Rua José Pedro dos Santos nº74 - JD das Lanjeiras, Bebedouro - SP';
    const cnpj = empresa.cnpj || '47.309.271/0001-97';
    const telefone = empresa.telefone || '(17)3345-1016';
    const whatsapp = empresa.whatsapp || '(17)99157-1263';
    const email = empresa.email || '';
    const site = empresa.site || '';
    const imei = empresa.imei || '';
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ordem de Serviço - ${osNumber}</title>
          <meta charset="UTF-8">
          <style>
            @page {
              size: A4 portrait;
              margin: 0.2cm;
            }
            
            * {
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0; 
              padding: 0;
              color: #000; 
              font-size: 14px;
              line-height: 1.4;
              background: #fff;
            }
            
            .page {
              width: 20.6cm;
              height: 29.6cm;
              position: relative;
              display: flex;
              flex-direction: column;
            }
            
            .os-card {
              width: 100%;
              height: 14.6cm;
              border: 2px solid #333;
              margin-bottom: 0.2cm;
              padding: 0.4cm;
              position: relative;
              background: #fff;
            }
            
            .os-card:last-child {
              margin-bottom: 0;
            }
            
            .header {
              text-align: center;
              margin-bottom: 0.2cm;
              border-bottom: 2px solid #333;
              padding-bottom: 0.15cm;
            }
            
            .company-name {
              font-size: 20px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 0.05cm;
            }
            
            .company-subtitle {
              font-size: 12px;
              color: #666;
              margin-bottom: 0.05cm;
            }
            
            .company-info {
              font-size: 11px;
              line-height: 1.3;
            }
            
            .os-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 0.15cm 0;
              padding: 0.1cm 0.2cm;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
            }
            
            .os-number {
              font-size: 18px;
              font-weight: bold;
              color: #2563eb;
            }
            
            .os-date {
              font-size: 14px;
              font-weight: bold;
            }
            
            .main-content {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.3cm;
              height: 10cm;
              margin-bottom: 0.2cm;
            }
            
            .left-column, .right-column {
              display: flex;
              flex-direction: column;
            }
            
            .form-field {
              margin-bottom: 0.1cm;
            }
            
            .form-label {
              font-weight: bold;
              font-size: 11px;
              margin-bottom: 0.03cm;
              display: block;
            }
            
            .form-input {
              border: none;
              border-bottom: 1px solid #333;
              padding: 0.03cm 0;
              font-size: 12px;
              width: 100%;
              background: transparent;
              min-height: 0.35cm;
            }
            
            .form-textarea {
              border: 1px solid #ccc;
              padding: 0.08cm;
              font-size: 11px;
              width: 100%;
              min-height: 1cm;
              resize: none;
              background: #fafafa;
            }
            
            .phone-input {
              font-family: monospace;
              letter-spacing: 0.3px;
            }
            
            .pattern-password {
              margin-top: 0.1cm;
            }
            
            .pattern-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 0.1cm;
              width: 1.8cm;
              height: 1.8cm;
              border: 2px solid #333;
              padding: 0.08cm;
            }
            
            .pattern-dot {
              width: 100%;
              height: 100%;
              border: 1px solid #333;
              border-radius: 50%;
              background: #fff;
              position: relative;
            }
            
            .pattern-dot::after {
              content: attr(data-number);
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 7px;
              font-weight: bold;
              color: #666;
            }
            
            .pattern-lines {
              margin-top: 0.08cm;
              height: 0.3cm;
              border-bottom: 1px solid #333;
              font-size: 8px;
              color: #666;
            }
            
            .terms-section {
              margin-top: 0.1cm;
              padding: 0.1cm;
              border: 2px solid #333;
              height: 2.2cm;
              width: 100%;
              box-sizing: border-box;
            }
            
            .terms-title {
              text-align: center;
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 0.08cm;
              border-bottom: 1px dashed #333;
              padding-bottom: 0.03cm;
            }
            
            .terms-list {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            
            .terms-list li {
              margin-bottom: 0.03cm;
              font-size: 9px;
              line-height: 1.3;
            }
            
            .footer-section {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 0.15cm;
              margin-top: 0.1cm;
              padding-top: 0.08cm;
              border-top: 1px solid #333;
              height: 0.6cm;
            }
            
            .signature-line {
              border-bottom: 1px solid #333;
              padding: 0.08cm 0;
              text-align: center;
              font-size: 10px;
              font-weight: bold;
            }
            
            .status-badge {
              position: absolute;
              top: 0.1cm;
              right: 0.1cm;
              padding: 0.08cm 0.12cm;
              border-radius: 0.08cm;
              font-size: 9px;
              font-weight: bold;
              color: white;
            }
            
            .status-pendente { background: #f59e0b; }
            .status-andamento { background: #3b82f6; }
            .status-concluida { background: #10b981; }
            
            .cut-line {
              position: absolute;
              top: 14.6cm;
              left: 0;
              right: 0;
              height: 0.3cm;
              display: flex;
              align-items: center;
              justify-content: center;
              border-top: 1px dashed #333;
              border-bottom: 1px dashed #333;
              background: #f9fafb;
            }
            
            .cut-text {
              font-size: 6px;
              font-weight: bold;
              color: #666;
            }
            
            @media print {
              .page {
                border: none;
              }
              .cut-line {
                border-top: 1px dashed #333;
                border-bottom: 1px dashed #333;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <!-- Primeira OS -->
            <div class="os-card">
              <div class="status-badge status-${os.status?.toLowerCase().replace(' ', '') || 'pendente'}">
                ${os.status || 'Pendente'}
              </div>
              
              <div class="header">
                <div class="company-name">${nomeEmpresa}</div>
                <div class="company-subtitle">${descricao}</div>
                <div class="company-info">
                  ${endereco} | CNPJ: ${cnpj}<br>
                  Fone: ${telefone} | WhatsApp: ${whatsapp}${email ? ` | E-mail: ${email}` : ''}${site ? ` | Site: ${site}` : ''}
                </div>
              </div>
              
              <div class="os-header">
                <div class="os-date">Data: ${currentDate}</div>
                <div class="os-number">OS: ${osNumber}</div>
              </div>
              
              <div class="main-content">
                <div class="left-column">
                  <div class="form-field">
                    <label class="form-label">Cliente:</label>
                    <div class="form-input">${os.clienteNome || ''}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Telefone:</label>
                    <div class="form-input phone-input">${os.clienteTelefone || ''}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Endereço:</label>
                    <div class="form-input">${os.endereco || ''}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Descrição do Defeito:</label>
                    <div class="form-input">${os.titulo || ''}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Marca/Modelo:</label>
                    <div class="form-input">${os.marcaModelo || ''}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">IMEI:</label>
                    <div class="form-input">${imei}</div>
                  </div>
                </div>
                
                <div class="right-column">
                  <div class="form-field">
                    <label class="form-label">Valor:</label>
                    <div class="form-input">R$ ${os.valor ? os.valor.toFixed(2).replace('.', ',') : '0,00'}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Data Entrada:</label>
                    <div class="form-input">${currentDate}</div>
                  </div>
                  <div class="form-field pattern-password">
                    <label class="form-label">Senha Desenho:</label>
                    <div class="pattern-grid">
                      <div class="pattern-dot" data-number="1"></div>
                      <div class="pattern-dot" data-number="2"></div>
                      <div class="pattern-dot" data-number="3"></div>
                      <div class="pattern-dot" data-number="4"></div>
                      <div class="pattern-dot" data-number="5"></div>
                      <div class="pattern-dot" data-number="6"></div>
                      <div class="pattern-dot" data-number="7"></div>
                      <div class="pattern-dot" data-number="8"></div>
                      <div class="pattern-dot" data-number="9"></div>
                    </div>
                    <div class="pattern-lines">Desenhe o padrão conectando os pontos</div>
                  </div>
                </div>
              </div>
              
              <div class="terms-section">
                <div class="terms-title">TERMOS E CONDIÇÕES</div>
                <ul class="terms-list">
                  <li>• Prazo para retirada: 30 dias após conclusão</li>
                  <li>• Taxa de armazenamento: R$ 5,00/dia após prazo</li>
                  <li>• Backup de dados é responsabilidade do cliente</li>
                  <li>• Peças substituídas ficam conosco</li>
                  <li>• Garantia: 90 dias peças / 30 dias mão de obra</li>
                </ul>
              </div>
              
              <div class="footer-section">
                <div class="signature-line">Cliente</div>
                <div class="signature-line">Técnico</div>
                <div class="signature-line">Observações</div>
              </div>
            </div>
            
            <div class="cut-line">
              <div class="cut-text">CORTE AQUI</div>
            </div>
            
            <!-- Segunda OS (cópia) -->
            <div class="os-card">
              <div class="status-badge status-${os.status?.toLowerCase().replace(' ', '') || 'pendente'}">
                ${os.status || 'Pendente'}
              </div>
              
              <div class="header">
                <div class="company-name">${nomeEmpresa}</div>
                <div class="company-subtitle">${descricao}</div>
                <div class="company-info">
                  ${endereco} | CNPJ: ${cnpj}<br>
                  Fone: ${telefone} | WhatsApp: ${whatsapp}${email ? ` | E-mail: ${email}` : ''}${site ? ` | Site: ${site}` : ''}
                </div>
              </div>
              
              <div class="os-header">
                <div class="os-date">Data: ${currentDate}</div>
                <div class="os-number">OS: ${osNumber}</div>
              </div>
              
              <div class="main-content">
                <div class="left-column">
                  <div class="form-field">
                    <label class="form-label">Cliente:</label>
                    <div class="form-input">${os.clienteNome || ''}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Telefone:</label>
                    <div class="form-input phone-input">${os.clienteTelefone || ''}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Endereço:</label>
                    <div class="form-input">${os.endereco || ''}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Descrição do Defeito:</label>
                    <div class="form-input">${os.titulo || ''}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Marca/Modelo:</label>
                    <div class="form-input">${os.marcaModelo || ''}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">IMEI:</label>
                    <div class="form-input">${imei}</div>
                  </div>
                </div>
                
                <div class="right-column">
                  <div class="form-field">
                    <label class="form-label">Valor:</label>
                    <div class="form-input">R$ ${os.valor ? os.valor.toFixed(2).replace('.', ',') : '0,00'}</div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Data Entrada:</label>
                    <div class="form-input">${currentDate}</div>
                  </div>
                  <div class="form-field pattern-password">
                    <label class="form-label">Senha Desenho:</label>
                    <div class="pattern-grid">
                      <div class="pattern-dot" data-number="1"></div>
                      <div class="pattern-dot" data-number="2"></div>
                      <div class="pattern-dot" data-number="3"></div>
                      <div class="pattern-dot" data-number="4"></div>
                      <div class="pattern-dot" data-number="5"></div>
                      <div class="pattern-dot" data-number="6"></div>
                      <div class="pattern-dot" data-number="7"></div>
                      <div class="pattern-dot" data-number="8"></div>
                      <div class="pattern-dot" data-number="9"></div>
                    </div>
                    <div class="pattern-lines">Desenhe o padrão conectando os pontos</div>
                  </div>
                </div>
              </div>
              
              <div class="terms-section">
                <div class="terms-title">TERMOS E CONDIÇÕES</div>
                <ul class="terms-list">
                  <li>• Prazo para retirada: 30 dias após conclusão</li>
                  <li>• Taxa de armazenamento: R$ 5,00/dia após prazo</li>
                  <li>• Backup de dados é responsabilidade do cliente</li>
                  <li>• Peças substituídas ficam conosco</li>
                  <li>• Garantia: 90 dias peças / 30 dias mão de obra</li>
                </ul>
              </div>
              
              <div class="footer-section">
                <div class="signature-line">Cliente</div>
                <div class="signature-line">Técnico</div>
                <div class="signature-line">Observações</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Aguarda o carregamento e imprime
    setTimeout(() => {
    printWindow.print();
    }, 500);
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

  // Função para buscar clientes dinamicamente
  const handleBuscaCliente = (valor) => {
    setBuscaCliente(valor);
    if (valor.length > 0) {
      const filtrados = clientes.filter(cliente => 
        cliente.nome.toLowerCase().includes(valor.toLowerCase()) ||
        cliente.telefone.includes(valor) ||
        cliente.email?.toLowerCase().includes(valor.toLowerCase())
      );
      setClientesFiltrados(filtrados);
      setMostrarSugestoes(filtrados.length > 0);
    } else {
      setClientesFiltrados([]);
      setMostrarSugestoes(false);
    }
  };

  const selecionarCliente = (cliente) => {
    setFormData({
      ...formData,
      clienteNome: cliente.nome,
      clienteTelefone: cliente.telefone,
      clienteId: cliente.id
    });
    setBuscaCliente(cliente.nome);
    setMostrarSugestoes(false);
  };

  const filteredOrdens = (ordens || []).filter(os => {
    const matchesSearch = os.clienteNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         os.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         os.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         os.clienteTelefone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Todos' || os.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Em Andamento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Concluída': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Estatísticas para o dashboard
  const stats = {
    total: ordens?.length || 0,
    pendentes: ordens?.filter(o => o.status === 'Pendente').length || 0,
    emAndamento: ordens?.filter(o => o.status === 'Em Andamento').length || 0,
    concluidas: ordens?.filter(o => o.status === 'Concluída').length || 0,
    valorTotal: ordens?.reduce((acc, o) => acc + (o.valor || 0), 0) || 0
  };

  return (
    <div className="space-y-8">
      {/* Header Turbinado */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 sm:gap-3">
              <Settings className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              Ordens de Serviço
            </h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg">Gerencie e acompanhe todos os seus serviços</p>
        </div>
        
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 border-white/30"
            >
              {viewMode === 'grid' ? <Eye className="h-4 w-4 mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
              {viewMode === 'grid' ? 'Lista' : 'Cards'}
            </Button>
        <Dialog open={dialogs.os} onOpenChange={handleCloseDialog}>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Nova OS
              </Button>
          <DialogContent className="sm:max-w-2xl w-full max-w-[95vw] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 scrollbar-hide">
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 -m-4 sm:-m-6 mb-4 sm:mb-6 rounded-t-lg">
              <DialogTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-bold">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                </motion.div>
                {editingOS ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
              </DialogTitle>
              <p className="text-blue-100 mt-2 text-sm sm:text-base">
                {editingOS ? 'Atualize as informações da ordem de serviço' : 'Cadastre uma nova ordem de serviço para seus clientes'}
              </p>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Seção: Informações do Cliente */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl p-4 sm:p-6 border border-blue-200 dark:border-slate-600">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Informações do Cliente</h3>
                </div>
                
                {/* Busca dinâmica de clientes */}
                <div className="mb-4 relative">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Buscar Cliente Existente</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      value={buscaCliente}
                      onChange={(e) => handleBuscaCliente(e.target.value)}
                      placeholder="Digite o nome ou telefone do cliente..."
                      className="mt-1 pl-10 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                    
                    {/* Sugestões de clientes */}
                    {mostrarSugestoes && clientesFiltrados.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {clientesFiltrados.map(cliente => (
                          <button
                            key={cliente.id}
                            type="button"
                            onClick={() => selecionarCliente(cliente)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-600 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <CustomerAvatar 
                                customer={cliente} 
                                size="sm" 
                                showName={true} 
                                showPhone={true}
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="clienteNome" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Cliente *</Label>
                    <Input 
                      id="clienteNome" 
                      value={formData.clienteNome} 
                      onChange={(e) => {
                        setFormData({...formData, clienteNome: e.target.value});
                        handleBuscaCliente(e.target.value);
                      }} 
                      placeholder="Nome completo do cliente" 
                      className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                      required 
                    />
                    {formData.clienteId && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ Cliente selecionado da base
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="clienteTelefone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone do Cliente *</Label>
                    <Input 
                      id="clienteTelefone" 
                      value={formData.clienteTelefone} 
                      onChange={(e) => {
                        setFormData({...formData, clienteTelefone: e.target.value});
                        handleBuscaCliente(e.target.value);
                      }} 
                      placeholder="(11) 99999-9999" 
                      className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="endereco" className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</Label>
                    <Input 
                      id="endereco" 
                      value={formData.endereco} 
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})} 
                      placeholder="Ex: Rua das Flores, 123 - Centro, Bebedouro - SP" 
                      className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Detalhes do Serviço */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl p-6 border border-green-200 dark:border-slate-600">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Detalhes do Serviço</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="titulo" className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição do Defeito *</Label>
                    <Input 
                      id="titulo" 
                      value={formData.titulo} 
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})} 
                      placeholder="Ex: Tela quebrada, não liga, bateria não carrega..." 
                      className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                      required 
                    />
                  </div>

                  <div>
                    <Label htmlFor="marcaModelo" className="text-sm font-medium text-slate-700 dark:text-slate-300">Marca/Modelo</Label>
                    <Input 
                      id="marcaModelo" 
                      value={formData.marcaModelo} 
                      onChange={(e) => setFormData({...formData, marcaModelo: e.target.value})} 
                      placeholder="Ex: Samsung Galaxy S21, iPhone 13 Pro..." 
                      className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="senha" className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha do Dispositivo *</Label>
                      <Input 
                        id="senha" 
                        value={formData.senha} 
                        onChange={(e) => setFormData({...formData, senha: e.target.value})} 
                        placeholder="Senha ou PIN" 
                        className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                        required 
                      />
                    </div>

                    <div>
                      <Label htmlFor="valor" className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor do Serviço (R$) *</Label>
                      <Input 
                        id="valor" 
                        type="number" 
                        step="0.01" 
                        value={formData.valor} 
                        onChange={(e) => setFormData({...formData, valor: e.target.value})} 
                        placeholder="0.00" 
                        className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                        required 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Status e Observações */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl p-6 border border-purple-200 dark:border-slate-600">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Status e Observações</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">🟡 Pendente</SelectItem>
                        <SelectItem value="Em Andamento">🟠 Em Andamento</SelectItem>
                        <SelectItem value="Concluída">🟢 Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Sistema de Múltiplas Formas de Pagamento */}
                  <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-800/30 dark:via-slate-700/30 dark:to-slate-600/30 rounded-xl p-4 border border-green-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Formas de Pagamento</h3>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          const valor = parseFloat(formData.valor) || 0;
                          const totalPago = (formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0);
                          const valorRestante = valor - totalPago;
                          const valorInicial = (formData.formasPagamento || []).length === 0 ? valor : (valorRestante > 0 ? valorRestante : 0);
                          
                          setFormData({
                            ...formData,
                            formasPagamento: [...(formData.formasPagamento || []), { 
                              id: Date.now(), 
                              tipo: 'dinheiro', 
                              valor: valorInicial, 
                              observacao: '' 
                            }]
                          });
                        }}
                        className="h-7 px-2 text-xs"
                        disabled={(formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0) >= parseFloat(formData.valor || 0)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    
                    {/* Indicador de Valor Restante */}
                    {(() => {
                      const valor = parseFloat(formData.valor) || 0;
                      const totalPago = (formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0);
                      const valorRestante = valor - totalPago;
                      
                      if (valorRestante > 0) {
                        return (
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                  Valor Restante
                                </span>
                              </div>
                              <span className="text-lg font-bold text-amber-900 dark:text-amber-100">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorRestante)}
                              </span>
                            </div>
                          </div>
                        );
                      } else if (totalPago > valor) {
                        return (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                  Troco
                                </span>
                              </div>
                              <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPago - valor)}
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                  Pagamento Completo
                                </span>
                              </div>
                              <span className="text-lg font-bold text-green-900 dark:text-green-100">
                                ✓
                              </span>
                            </div>
                          </div>
                        );
                      }
                    })()}
                    
                    <div className="space-y-3">
                      {(formData.formasPagamento || []).map((forma, index) => (
                        <div key={forma.id} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label className="text-xs text-slate-600 dark:text-slate-400">Tipo</Label>
                            <Select 
                              value={forma.tipo} 
                              onValueChange={(value) => {
                                const newFormas = [...(formData.formasPagamento || [])];
                                newFormas[index].tipo = value;
                                setFormData({...formData, formasPagamento: newFormas});
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                                <SelectItem value="pix">📱 PIX</SelectItem>
                                <SelectItem value="cartao_credito">💳 Cartão de Crédito</SelectItem>
                                <SelectItem value="cartao_debito">💳 Cartão de Débito</SelectItem>
                                <SelectItem value="transferencia">🏦 Transferência</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-slate-600 dark:text-slate-400">Valor</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={forma.valor || ''}
                              onChange={(e) => {
                                const newFormas = [...(formData.formasPagamento || [])];
                                newFormas[index].valor = parseFloat(e.target.value) || 0;
                                setFormData({...formData, formasPagamento: newFormas});
                              }}
                              className="h-8 text-xs"
                              placeholder="0.00"
                            />
                          </div>
                          {(formData.formasPagamento || []).length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newFormas = (formData.formasPagamento || []).filter((_, i) => i !== index);
                                setFormData({...formData, formasPagamento: newFormas});
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      {/* Resumo do Pagamento */}
                      {(formData.formasPagamento || []).length > 0 && parseFloat(formData.valor) > 0 && (
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 dark:border-slate-600/50">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Total da OS:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formData.valor) || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Total Pago:</span>
                            <span className="font-bold text-green-600 dark:text-green-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0))}
                            </span>
                          </div>
                          {(formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0) > parseFloat(formData.valor || 0) && (
                            <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                              <span>Troco:</span>
                              <span className="font-bold">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((formData.formasPagamento || []).reduce((sum, fp) => sum + fp.valor, 0) - parseFloat(formData.valor || 0))}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sistema de Parcelamento */}
                  <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-slate-800/30 dark:via-slate-700/30 dark:to-slate-600/30 rounded-xl p-4 border border-orange-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="parcelamentoAtivoOS"
                          checked={formData.parcelamento?.ativo || false}
                          onChange={(e) => {
                            const ativo = e.target.checked;
                            const parcelas = ativo ? (formData.parcelamento?.parcelas || 1) : 1;
                            setFormData({
                              ...formData,
                              parcelamento: {
                                ...formData.parcelamento,
                                ativo,
                                parcelas
                              }
                            });
                          }}
                          className="w-4 h-4 rounded border-2 border-orange-400 text-orange-500 focus:ring-orange-500"
                        />
                        <Label htmlFor="parcelamentoAtivoOS" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                          Ativar parcelamento
                        </Label>
                      </div>
                      {formData.parcelamento?.ativo && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                          <Calendar className="h-3 w-3" />
                          <span className="font-medium">Parcelado</span>
                        </div>
                      )}
                    </div>
                    
                    {formData.parcelamento?.ativo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="parcelasOS" className="text-xs font-medium text-slate-700 dark:text-slate-300">Parcelas</Label>
                            <Input
                              id="parcelasOS"
                              type="number"
                              min="1"
                              max="60"
                              value={formData.parcelamento?.parcelas || 1}
                              onChange={(e) => {
                                const parcelas = parseInt(e.target.value) || 1;
                                setFormData({
                                  ...formData,
                                  parcelamento: {
                                    ...formData.parcelamento,
                                    parcelas
                                  }
                                });
                              }}
                              className="mt-1 h-8 text-sm"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="intervaloOS" className="text-xs font-medium text-slate-700 dark:text-slate-300">Intervalo</Label>
                            <Select 
                              value={formData.parcelamento?.intervalo || 'mensal'} 
                              onValueChange={(value) => setFormData({
                                ...formData,
                                parcelamento: {
                                  ...formData.parcelamento,
                                  intervalo: value
                                }
                              })}
                            >
                              <SelectTrigger className="mt-1 h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="semanal">📅 Semanal</SelectItem>
                                <SelectItem value="quinzenal">📆 Quinzenal</SelectItem>
                                <SelectItem value="mensal">🗓️ Mensal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {formData.parcelamento?.parcelas > 1 && parseFloat(formData.valor) > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 dark:border-slate-600/50"
                          >
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-slate-600 dark:text-slate-400">Valor por Parcela</div>
                                <div className="font-bold text-blue-600 dark:text-blue-400">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formData.valor || 0) / (formData.parcelamento?.parcelas || 1))}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-slate-600 dark:text-slate-400">Total de Parcelas</div>
                                <div className="font-bold text-purple-600 dark:text-purple-400">
                                  {formData.parcelamento?.parcelas || 1}x
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Informações de Pagamento (somente leitura ao editar) */}
                  {editingOS && editingOS.formasPagamento && editingOS.formasPagamento.length > 1 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Formas de Pagamento Utilizadas</h4>
                      <div className="space-y-1">
                        {editingOS.formasPagamento.map((forma, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-blue-700 dark:text-blue-300 capitalize">{forma.tipo}:</span>
                            <span className="font-semibold text-blue-800 dark:text-blue-200">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(forma.valor)}
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-blue-200 dark:border-blue-700 pt-1 mt-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-blue-800 dark:text-blue-200">Total:</span>
                            <span className="text-blue-900 dark:text-blue-100">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(editingOS.formasPagamento.reduce((sum, fp) => sum + fp.valor, 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="observacoes" className="text-sm font-medium text-slate-700 dark:text-slate-300">Observações</Label>
                    <Textarea 
                      id="observacoes" 
                      value={formData.observacoes} 
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})} 
                      placeholder="Observações adicionais sobre o serviço..." 
                      rows={3} 
                      className="mt-1 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    />
                  </div>
                </div>
              </div>
              
              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 sm:py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {editingOS ? 'Atualizar OS' : 'Criar OS'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseDialog} 
                  className="flex-1 sm:flex-none border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
        </div>
      </motion.div>

      {/* Dashboard de Estatísticas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-full">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-full">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendentes}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-full">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Em Andamento</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.emAndamento}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-full">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Concluídas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.concluidas}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-full">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Valor Total</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.valorTotal)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filtros e Busca Turbinados */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-full"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Buscar por cliente, número, descrição ou telefone..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-12 h-12 text-lg" 
            />
      </div>

          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 h-12">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendentes</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluída">Concluídas</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="h-12 w-full max-w-full">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Listagem Turbinada */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        {ordensLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg text-slate-600 dark:text-slate-400">Carregando ordens de serviço...</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredOrdens.map((os, index) => (
          <motion.div
            key={os.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 w-full max-w-full"
                  >
                    {/* Header do Card */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-xl">{os.numero}</h3>
                        <Select value={os.status} onValueChange={(value) => handleStatusChange(os.id, value)}>
                          <SelectTrigger className={`w-auto h-8 px-3 py-1 text-sm font-medium border-0 ${getStatusColor(os.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendente">🟡 Pendente</SelectItem>
                            <SelectItem value="Em Andamento">🟠 Em Andamento</SelectItem>
                            <SelectItem value="Concluída">🟢 Concluída</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handlePrint(os)} className="h-10 w-10 max-w-full hover:bg-blue-100 dark:hover:bg-blue-900/30">
                          <Printer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(os)} className="h-10 w-10 max-w-full hover:bg-green-100 dark:hover:bg-green-900/30">
                          <Edit className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(os)} className="h-10 w-10 max-w-full hover:bg-red-100 dark:hover:bg-red-900/30">
                          <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Conteúdo do Card */}
                    <div className="space-y-4">
                      {/* Cliente */}
                      <div className="flex items-center space-x-3">
                        <CustomerAvatar 
                          customer={{
                            nome: os.clienteNome,
                            telefone: os.clienteTelefone,
                            foto: clientes.find(c => c.id === os.clienteId)?.foto
                          }} 
                          size="md" 
                          showName={true} 
                          showPhone={true}
                        />
                      </div>

                      {/* Serviço */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Wrench className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
              <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{os.titulo}</p>
                        </div>
                      </div>

                      {/* Valor */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {os.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor) : 'R$ 0,00'}
                          </p>
              </div>
            </div>
            
                      {/* Senha */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
              <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Senha: <span className="font-mono font-semibold">{os.senha}</span></p>
                        </div>
                      </div>

                      {/* Observações */}
                      {os.observacoes && (
                        <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-sm text-slate-600 dark:text-slate-400">{os.observacoes}</p>
                        </div>
                      )}

                      {/* Data */}
                      <div className="flex items-center space-x-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          Criada em: {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                        </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
            ) : (
              // Modo Lista
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden w-full max-w-full">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">OS</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Serviço</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valor</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredOrdens.map((os, index) => (
                        <motion.tr
                          key={os.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/30"
                        >
                          <td className="px-3 sm:px-6 py-4">
                            <div className="text-sm font-bold text-slate-900 dark:text-white break-words">{os.numero}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <CustomerAvatar 
                              customer={{
                                nome: os.clienteNome,
                                telefone: os.clienteTelefone,
                                foto: clientes.find(c => c.id === os.clienteId)?.foto
                              }} 
                              size="sm" 
                              showName={true} 
                              showPhone={true}
                            />
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <div className="text-sm text-slate-900 dark:text-white max-w-xs truncate break-words">{os.titulo}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <Select value={os.status} onValueChange={(value) => handleStatusChange(os.id, value)}>
                              <SelectTrigger className={`w-auto h-7 px-2 py-1 text-xs font-medium border-0 ${getStatusColor(os.status)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pendente">🟡 Pendente</SelectItem>
                                <SelectItem value="Em Andamento">🟠 Em Andamento</SelectItem>
                                <SelectItem value="Concluída">🟢 Concluída</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <div className="text-sm font-bold text-green-600 dark:text-green-400 break-words">
                              {os.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor) : 'R$ 0,00'}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <div className="text-sm text-slate-500 dark:text-slate-400 break-words">
                              {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => handlePrint(os)} className="h-8 w-8 max-w-full">
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(os)} className="h-8 w-8 max-w-full">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(os)} className="h-8 w-8 max-w-full text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
        </div>
            )}
          </>
        )}
      </motion.div>

      {!ordensLoading && filteredOrdens.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center py-16 w-full max-w-full"
        >
          <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <FileText className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            {searchTerm || statusFilter !== 'Todos' ? 'Nenhuma OS encontrada' : 'Nenhuma OS cadastrada'}
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'Todos' 
              ? 'Tente ajustar os filtros ou buscar com outros termos' 
              : 'Comece criando sua primeira ordem de serviço e organize seus atendimentos'
            }
          </p>
          {!searchTerm && statusFilter === 'Todos' && (
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira OS
            </Button>
          )}
        </motion.div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir Ordem de Serviço"
        description={`Tem certeza que deseja excluir a OS #${osToDelete?.id} do cliente "${osToDelete?.clienteNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="delete"
      />
    </div>
  );
};

export default OSModule;

