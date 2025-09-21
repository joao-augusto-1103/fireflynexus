import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, DollarSign, ShoppingCart, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const RelatoriosModule = () => {
  const [date, setDate] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const [vendas, setVendas] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    setVendas(JSON.parse(localStorage.getItem('crm_ov') || '[]'));
    setFinanceiro(JSON.parse(localStorage.getItem('crm_financeiro') || '[]'));
    setProdutos(JSON.parse(localStorage.getItem('crm_produtos') || '[]'));
  }, []);

  const filteredVendas = vendas.filter(venda => {
    const vendaDate = new Date(venda.createdAt);
    return date.from && date.to && vendaDate >= date.from && vendaDate <= date.to && venda.status === 'Concluída';
  });

  const filteredFinanceiro = financeiro.filter(item => {
    const itemDate = new Date(item.createdAt);
    return date.from && date.to && itemDate >= date.from && itemDate <= date.to;
  });

  const vendasData = filteredVendas.reduce((acc, venda) => {
    const date = format(new Date(venda.createdAt), 'dd/MM');
    if (!acc[date]) {
      acc[date] = { date, total: 0, quantidade: 0 };
    }
    acc[date].total += venda.total;
    acc[date].quantidade += 1;
    return acc;
  }, {});

  const financeiroData = filteredFinanceiro.reduce((acc, item) => {
    const date = format(new Date(item.createdAt), 'dd/MM');
    if (!acc[date]) {
      acc[date] = { date, recebido: 0, pago: 0 };
    }
    if (item.tipo === 'receber' && item.status === 'Recebido') {
      acc[date].recebido += item.valor;
    }
    if (item.tipo === 'pagar' && item.status === 'Pago') {
      acc[date].pago += item.valor;
    }
    return acc;
  }, {});

  const produtosVendidos = filteredVendas.flatMap(v => v.produtos).reduce((acc, produto) => {
    if (!acc[produto.nome]) {
      acc[produto.nome] = { nome: produto.nome, quantidade: 0, total: 0 };
    }
    acc[produto.nome].quantidade += produto.quantidade;
    acc[produto.nome].total += produto.preco * produto.quantidade;
    return acc;
  }, {});

  const topProdutos = Object.values(produtosVendidos).sort((a, b) => b.quantidade - a.quantidade).slice(0, 10);

  const totalVendido = filteredVendas.reduce((sum, v) => sum + v.total, 0);
  const totalRecebido = Object.values(financeiroData).reduce((sum, d) => sum + d.recebido, 0);
  const totalPago = Object.values(financeiroData).reduce((sum, d) => sum + d.pago, 0);

  const ReportCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Relatórios</h1>
          <p className="text-slate-600 dark:text-slate-400">Analise a performance do seu negócio</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-full sm:w-[300px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                <span>Selecione um período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Tabs defaultValue="vendas" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="vendas">Relatório de Vendas</TabsTrigger>
          <TabsTrigger value="financeiro">Relatório Financeiro</TabsTrigger>
          <TabsTrigger value="produtos">Performance de Produtos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vendas" className="space-y-6 pt-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <ReportCard title="Total Vendido" value={`R$ ${totalVendido.toFixed(2)}`} icon={DollarSign} color="bg-green-500" />
              <ReportCard title="Vendas Realizadas" value={filteredVendas.length} icon={ShoppingCart} color="bg-blue-500" />
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 h-[400px]">
              <h3 className="font-semibold mb-4">Vendas por Dia</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.values(vendasData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="Total (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="financeiro" className="space-y-6 pt-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <ReportCard title="Total Recebido" value={`R$ ${totalRecebido.toFixed(2)}`} icon={TrendingUp} color="bg-emerald-500" />
              <ReportCard title="Total Pago" value={`R$ ${totalPago.toFixed(2)}`} icon={TrendingDown} color="bg-red-500" />
              <ReportCard title="Saldo" value={`R$ ${(totalRecebido - totalPago).toFixed(2)}`} icon={DollarSign} color="bg-purple-500" />
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 h-[400px]">
              <h3 className="font-semibold mb-4">Fluxo de Caixa por Dia</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={Object.values(financeiroData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Line type="monotone" dataKey="recebido" stroke="#22c55e" name="Recebido (R$)" />
                  <Line type="monotone" dataKey="pago" stroke="#ef4444" name="Pago (R$)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="produtos" className="space-y-6 pt-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 h-[400px]">
              <h3 className="font-semibold mb-4">Top 10 Produtos Mais Vendidos (por quantidade)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProdutos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="nome" width={120} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Bar dataKey="quantidade" fill="#8884d8" name="Quantidade Vendida" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RelatoriosModule;