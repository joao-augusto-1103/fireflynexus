# Firefly Nexus

Sistema de gestão empresarial desenvolvido em React + Vite.

## Deploy no Vercel

### Configuração Automática

1. **Conecte seu projeto ao Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Importe seu repositório ou faça upload dos arquivos

2. **Configurações do Build:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Variáveis de Ambiente (se necessário):**
   - Adicione as variáveis do Firebase no painel do Vercel
   - Exemplo: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.

### Deploy Manual via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

### Domínio Personalizado

Para usar o domínio `fireflynexus.vercel.app`:

1. No painel do Vercel, vá em **Settings** > **Domains**
2. Adicione o domínio personalizado
3. Configure os registros DNS conforme instruído

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run vercel-build` - Comando específico para o Vercel

## Estrutura do Projeto

```
fireflynexus/
├── src/
│   ├── components/     # Componentes React
│   ├── lib/           # Utilitários e configurações
│   ├── reports/       # Relatórios
│   └── tests/         # Testes
├── public/            # Arquivos estáticos
├── dist/              # Build de produção (gerado)
├── vercel.json        # Configuração do Vercel
└── package.json       # Dependências e scripts
```

## Tecnologias

- **React 18** - Framework frontend
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **Firebase** - Backend e autenticação
- **Radix UI** - Componentes de UI
- **Recharts** - Gráficos e visualizações

## Configuração Local

```bash
# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Suporte

Para suporte ou dúvidas sobre o deploy, consulte a documentação do Vercel ou entre em contato com a equipe de desenvolvimento.
