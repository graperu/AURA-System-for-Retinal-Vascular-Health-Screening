import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
};

export const isFirebaseConfigured = () => Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain);

let authInstance: Auth | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

const getFirebaseAuth = () => {
  if (!isFirebaseConfigured()) return null;
  if (!authInstance) {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({ prompt: 'select_account' });
  }
  return { auth: authInstance, provider: googleProviderInstance! };
};

export const signInWithGoogleFirebase = async () => {
  const fb = getFirebaseAuth();
  if (!fb) {
    throw new Error('Firebase chưa được cấu hình đầy đủ API Key trong file .env');
  }
  const result = await signInWithPopup(fb.auth, fb.provider);
  const user = result.user;
  const idToken = await user.getIdToken();
  return {
    idToken,
    email: user.email || '',
    fullName: user.displayName || '',
    picture: user.photoURL || '',
  };
};
