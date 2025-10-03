import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Configuração do Firebase - Projeto Firefly Nexus
const firebaseConfig = {
  apiKey: "AIzaSyDZa2C8AZc902HNuRWS0jP2KxfFoX5npyA",
  authDomain: "firefly-nexus.firebaseapp.com",
  projectId: "firefly-nexus",
  storageBucket: "firefly-nexus.firebasestorage.app",
  messagingSenderId: "981611156212",
  appId: "1:981611156212:web:aa09e09bbc3995617704a1",
  measurementId: "G-BG7KGG32F2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);

// Para desenvolvimento local (opcional)
// Descomente as linhas abaixo se quiser usar emuladores locais
// if (process.env.NODE_ENV === 'development') {
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectAuthEmulator(auth, 'http://localhost:9099');
// }

export default app;
