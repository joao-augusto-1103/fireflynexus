import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  ScatterChart,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Calendar } from 'lucide-react';

// Cores padrão para os gráficos
const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#EC4899', // pink-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
];

// Componente de Tooltip customizado turbinado
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <p className="font-bold text-slate-900 dark:text-white text-sm">{label}</p>
        </div>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatter ? formatter(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Componente de gráfico de barras
export const BarChartComponent = ({ 
  data, 
  title, 
  description, 
  xKey, 
  yKey, 
  color = COLORS[0],
  height = 300,
  showLegend = true,
  formatter = (value) => value
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-slate-500">
            Nenhum dado disponível para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg">
            <BarChart className="h-6 w-6 text-white" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400 text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.3} />
            <XAxis 
              dataKey={xKey} 
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              fontWeight={500}
            />
            <YAxis 
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatter}
              fontWeight={500}
            />
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            {showLegend && <Legend />}
            <Bar 
              dataKey={yKey} 
              fill={color}
              radius={[6, 6, 0, 0]}
              stroke={color}
              strokeWidth={2}
              className="drop-shadow-lg"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Componente de gráfico de linha
export const LineChartComponent = ({ 
  data, 
  title, 
  description, 
  xKey, 
  yKey, 
  color = COLORS[0],
  height = 300,
  showLegend = true,
  formatter = (value) => value,
  strokeWidth = 2
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-slate-500">
            Nenhum dado disponível para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg">
            <LineChart className="h-6 w-6 text-white" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400 text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.3} />
            <XAxis 
              dataKey={xKey} 
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              fontWeight={500}
            />
            <YAxis 
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatter}
              fontWeight={500}
            />
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke={color}
              strokeWidth={strokeWidth + 1}
              dot={{ fill: color, strokeWidth: 3, r: 5, className: "drop-shadow-lg" }}
              activeDot={{ r: 8, stroke: color, strokeWidth: 3, className: "drop-shadow-xl" }}
              className="drop-shadow-lg"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Componente de gráfico de pizza
export const PieChartComponent = ({ 
  data, 
  title, 
  description, 
  nameKey, 
  valueKey, 
  height = 300,
  showLegend = true,
  formatter = (value) => value
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-slate-500">
            Nenhum dado disponível para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={valueKey}
              nameKey={nameKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [formatter(value), nameKey]} />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Componente de gráfico de área
export const AreaChartComponent = ({ 
  data, 
  title, 
  description, 
  xKey, 
  yKey, 
  color = COLORS[0],
  height = 300,
  showLegend = true,
  formatter = (value) => value
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AreaChart className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-slate-500">
            Nenhum dado disponível para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AreaChart className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis 
              dataKey={xKey} 
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatter}
            />
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            {showLegend && <Legend />}
            <Area 
              type="monotone" 
              dataKey={yKey} 
              stroke={color}
              fill={color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Componente de gráfico composto (barras + linha)
export const ComposedChartComponent = ({ 
  data, 
  title, 
  description, 
  xKey, 
  bars = [],
  lines = [],
  height = 300,
  showLegend = true,
  formatter = (value) => value
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ComposedChart className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-slate-500">
            Nenhum dado disponível para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ComposedChart className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis 
              dataKey={xKey} 
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatter}
            />
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            {showLegend && <Legend />}
            
            {/* Renderizar barras */}
            {bars.map((bar, index) => (
              <Bar 
                key={bar.dataKey}
                dataKey={bar.dataKey}
                fill={bar.color || COLORS[index % COLORS.length]}
                name={bar.name}
                radius={[4, 4, 0, 0]}
              />
            ))}
            
            {/* Renderizar linhas */}
            {lines.map((line, index) => (
              <Line 
                key={line.dataKey}
                type="monotone" 
                dataKey={line.dataKey} 
                stroke={line.color || COLORS[index % COLORS.length]}
                strokeWidth={line.strokeWidth || 2}
                name={line.name}
                dot={{ fill: line.color || COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Componente de estatísticas resumidas
export const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  color = 'blue',
  formatter = (value) => value
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    cyan: 'bg-cyan-500',
  };

  const changeColorClasses = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-600 dark:text-slate-400',
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:shadow-2xl transition-all duration-500">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{title}</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white">
              {formatter(value)}
            </p>
            {change !== undefined && (
              <div className={`flex items-center text-sm font-semibold ${changeColorClasses[changeType]}`}>
                {changeType === 'positive' && <TrendingUp className="h-4 w-4 mr-1" />}
                {changeType === 'negative' && <TrendingDown className="h-4 w-4 mr-1" />}
                {change !== 0 && `${change > 0 ? '+' : ''}${change}%`}
                {change === 0 && 'Sem alteração'}
              </div>
            )}
          </div>
          {Icon && (
            <div className={`p-4 rounded-2xl ${colorClasses[color]} shadow-lg`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de gráfico horizontal (para rankings)
export const HorizontalBarChartComponent = ({ 
  data, 
  title, 
  description, 
  xKey, 
  yKey, 
  color = COLORS[0],
  height = 300,
  showLegend = true,
  formatter = (value) => value
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-slate-500">
            Nenhum dado disponível para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart 
            data={data} 
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis 
              type="number"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatter}
            />
            <YAxis 
              type="category"
              dataKey={xKey}
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            {showLegend && <Legend />}
            <Bar 
              dataKey={yKey} 
              fill={color}
              radius={[0, 4, 4, 0]}
              stroke={color}
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
