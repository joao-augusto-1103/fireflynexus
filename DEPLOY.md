# 🚀 Deploy do Firefly Nexus no Vercel

## 📋 Pré-requisitos
- Conta no [Vercel](https://vercel.com)
- Projeto Firebase configurado
- Código no GitHub/GitLab/Bitbucket

## 🔧 Configuração do Firebase

### 1. Configuração de Domínio Autorizado
No Firebase Console:
1. Vá em **Authentication** → **Settings** → **Authorized domains**
2. Adicione seu domínio do Vercel: `seu-projeto.vercel.app`

### 2. Regras de Segurança do Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para usuários
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regras para dados do sistema (administradores)
    match /{collection}/{document} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }
  }
}
```

## 🌐 Deploy no Vercel

### Opção 1: Deploy via Dashboard Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em **New Project**
3. Importe seu repositório GitHub
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Clique em **Deploy**

### Opção 2: Deploy via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy em produção
vercel --prod
```

## 🔐 Variáveis de Ambiente (Opcional)
Se quiser usar variáveis de ambiente:

No Dashboard Vercel → Settings → Environment Variables:
```
VITE_FIREBASE_API_KEY=AIzaSyDZa2C8AZc902HNuRWS0jP2KxfFoX5npyA
VITE_FIREBASE_AUTH_DOMAIN=firefly-nexus.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=firefly-nexus
VITE_FIREBASE_STORAGE_BUCKET=firefly-nexus.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=981611156212
VITE_FIREBASE_APP_ID=1:981611156212:web:aa09e09bbc3995617704a1
```

## 📁 Estrutura de Deploy
```
├── vercel.json          # Configuração do Vercel
├── .vercelignore        # Arquivos ignorados no deploy
├── vite.config.js       # Configuração otimizada para produção
└── dist/               # Build de produção
```

## 🎯 Funcionalidades do Deploy
- ✅ SPA Routing (todas as rotas → index.html)
- ✅ Cache otimizado para assets
- ✅ Code splitting automático
- ✅ Build otimizado para produção
- ✅ Suporte a Firebase

## 🔄 Atualizações
Para atualizar o site:
1. Faça push para o repositório
2. O Vercel fará deploy automático
3. Ou use: `vercel --prod`

## 🐛 Troubleshooting

### Erro de CORS no Firebase
```javascript
// No firebase.js, adicione:
const firebaseConfig = {
  // ... sua config
  authDomain: "firefly-nexus.firebaseapp.com", // Use o domínio oficial
};
```

### Build falha
```bash
# Limpar cache
npm run build -- --force

# Verificar dependências
npm install --production=false
```

## 📞 Suporte
- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Firebase](https://firebase.google.com/docs)
- [Vite Build](https://vitejs.dev/guide/build.html)
