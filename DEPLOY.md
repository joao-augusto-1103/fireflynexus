# 🚀 Deploy do Firefly Nexus no Vercel

## Passo a Passo Completo

### 1. Preparação dos Arquivos

✅ **Arquivos já configurados:**
- `vercel.json` - Configuração do Vercel
- `package.json` - Scripts e dependências atualizados
- `vite.config.js` - Configuração otimizada para produção
- `.vercelignore` - Arquivos ignorados no deploy
- `README.md` - Documentação do projeto

### 2. Deploy no Vercel

#### Opção A: Upload Direto (Recomendado)

1. **Acesse [vercel.com](https://vercel.com)**
2. **Faça login ou crie uma conta**
3. **Clique em "New Project"**
4. **Selecione "Browse All Templates"**
5. **Clique em "Deploy" sem selecionar template**
6. **Faça upload da pasta do projeto inteira**

#### Opção B: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login no Vercel
vercel login

# Deploy (executar na pasta do projeto)
vercel --prod
```

### 3. Configurações do Build

O Vercel detectará automaticamente as configurações:

- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4. Variáveis de Ambiente

Se seu projeto usa Firebase ou outras APIs:

1. **No painel do Vercel, vá em Settings > Environment Variables**
2. **Adicione as variáveis necessárias** (veja `vercel-env-example.txt`)
3. **Configure para Production, Preview e Development**

### 5. Domínio Personalizado

Para usar `fireflynexus.vercel.app`:

1. **No painel do Vercel, vá em Settings > Domains**
2. **Adicione o domínio:** `fireflynexus.vercel.app`
3. **O Vercel configurará automaticamente**

### 6. Verificação do Deploy

Após o deploy:

1. **Acesse a URL fornecida pelo Vercel**
2. **Teste todas as funcionalidades**
3. **Verifique se os assets estão carregando**
4. **Teste em diferentes dispositivos**

## 🔧 Configurações Avançadas

### Cache e Performance

O `vercel.json` já inclui:
- Cache otimizado para assets estáticos
- Headers de performance
- Configuração SPA (Single Page Application)

### Build Otimizado

O `vite.config.js` inclui:
- Minificação com Terser
- Code splitting otimizado
- Chunks separados por categoria

## 🐛 Solução de Problemas

### Build Falha

1. **Verifique as dependências no package.json**
2. **Confirme que o index.html está na raiz**
3. **Verifique se todas as importações estão corretas**

### Assets Não Carregam

1. **Verifique o caminho dos assets no código**
2. **Confirme que os arquivos estão na pasta public/**
3. **Teste localmente com `npm run preview`**

### Variáveis de Ambiente

1. **Confirme que todas as variáveis estão no painel do Vercel**
2. **Verifique se começam com `VITE_`**
3. **Redeploy após adicionar variáveis**

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs do Vercel**
2. **Teste localmente primeiro**
3. **Consulte a documentação do Vercel**
4. **Entre em contato com a equipe de desenvolvimento**

---

**🎉 Pronto! Seu projeto estará disponível em `fireflynexus.vercel.app`**
