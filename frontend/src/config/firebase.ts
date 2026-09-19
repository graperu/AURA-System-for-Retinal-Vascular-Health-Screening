import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, browserPopupRedirectResolver, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, type Auth, type ActionCodeSettings } from 'firebase/auth';

const resolveEnv = (keys: string[]): string => {
  for (const k of keys) {
    const metaVal = (import.meta.env as Record<string, any>)?.[k];
    if (metaVal && typeof metaVal === 'string' && metaVal.trim() !== '' && !metaVal.includes('YOUR_')) {
      return metaVal.trim();
    }
    try {
      if (typeof process !== 'undefined' && process.env) {
        const procVal = (process.env as Record<string, string>)[k];
        if (procVal && typeof procVal === 'string' && procVal.trim() !== '' && !procVal.includes('YOUR_')) {
          return procVal.trim();
        }
      }
    } catch (_) {}
  }
  return '';
};

const DEFAULT_FIREBASE = {
  apiKey: 'AIzaSyB3qOESpRPl79v77AJdWaz30c23BTdgucU',
  authDomain: 'aura-retinal.firebaseapp.com',
  projectId: 'aura-retinal',
  storageBucket: 'aura-retinal.firebasestorage.app',
  messagingSenderId: '498167667537',
  appId: '1:498167667537:web:a7c6c019e3ef603b33d170',
};

const apiKey =
  resolveEnv([
    'VITE_FIREBASE_API_KEY',
    'FIREBASE_API_KEY',
    'VITE_GOOGLE_API_KEY',
    'GOOGLE_API_KEY',
    'VITE_GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_ID',
    'VITE_API_KEY',
    'API_KEY',
  ]) || DEFAULT_FIREBASE.apiKey;

const projectId =
  resolveEnv([
    'VITE_FIREBASE_PROJECT_ID',
    'FIREBASE_PROJECT_ID',
    'VITE_GOOGLE_PROJECT_ID',
    'GOOGLE_PROJECT_ID',
    'VITE_PROJECT_ID',
    'PROJECT_ID',
  ]) || DEFAULT_FIREBASE.projectId;

const authDomain =
  resolveEnv([
    'VITE_FIREBASE_AUTH_DOMAIN',
    'FIREBASE_AUTH_DOMAIN',
    'VITE_GOOGLE_AUTH_DOMAIN',
    'GOOGLE_AUTH_DOMAIN',
    'VITE_AUTH_DOMAIN',
    'AUTH_DOMAIN',
  ]) || (projectId ? `${projectId}.firebaseapp.com` : DEFAULT_FIREBASE.authDomain);

const storageBucket =
  resolveEnv([
    'VITE_FIREBASE_STORAGE_BUCKET',
    'FIREBASE_STORAGE_BUCKET',
  ]) || (projectId ? `${projectId}.appspot.com` : DEFAULT_FIREBASE.storageBucket);

const messagingSenderId =
  resolveEnv([
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_MESSAGING_SENDER_ID',
  ]) || DEFAULT_FIREBASE.messagingSenderId;

const appId =
  resolveEnv([
    'VITE_FIREBASE_APP_ID',
    'FIREBASE_APP_ID',
    'VITE_GOOGLE_APP_ID',
  ]) || DEFAULT_FIREBASE.appId;

export const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

export const isFirebaseConfigured = () => Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5);

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

export const signOutFirebase = async () => {
  const fb = getFirebaseAuth();
  if (fb?.auth) {
    try {
      await fb.auth.signOut();
    } catch (_) {}
  }
};

export const signInWithGoogleFirebase = async () => {
  const fb = getFirebaseAuth();
  if (!fb) {
    throw new Error('Firebase chưa được cấu hình đầy đủ API Key trong file .env');
  }

  try {
    await fb.auth.signOut();
  } catch (_) {}

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  provider.addScope('email');
  provider.addScope('profile');
  provider.addScope('openid');

  const result = await signInWithPopup(fb.auth, provider, browserPopupRedirectResolver);
  const user = result.user;

  // Trích xuất Google OAuth2 ID Token từ OAuth credential (nếu có) và Firebase ID Token
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const googleIdToken = credential?.idToken;
  const firebaseIdToken = await user.getIdToken(true);

  // Ưu tiên Google ID Token, fallback sang Firebase ID Token
  const tokenToSend = googleIdToken || firebaseIdToken;

  return {
    idToken: tokenToSend,
    googleIdToken,
    firebaseIdToken,
    email: user.email || '',
    fullName: user.displayName || '',
    picture: user.photoURL || '',
  };
};

export const getFirebaseCurrentUser = () => {
  const fb = getFirebaseAuth();
  return fb?.auth?.currentUser;
};

export const sendMagicLinkFirebase = async (email: string, actionCodeSettings: ActionCodeSettings) => {
  const fb = getFirebaseAuth();
  if (!fb) {
    throw new Error('Firebase chưa được cấu hình đầy đủ API Key trong file .env');
  }
  await sendSignInLinkToEmail(fb.auth, email, actionCodeSettings);
  // Lưu email vào localStorage để dùng sau khi click link
  window.localStorage.setItem('emailForSignIn', email);
};

export const isMagicLink = (url: string) => {
  const fb = getFirebaseAuth();
  if (!fb) return false;
  return isSignInWithEmailLink(fb.auth, url);
};

export const signInWithMagicLinkFirebase = async (email: string, url: string) => {
  const fb = getFirebaseAuth();
  if (!fb) {
    throw new Error('Firebase chưa được cấu hình đầy đủ API Key trong file .env');
  }
  const result = await signInWithEmailLink(fb.auth, email, url);
  const user = result.user;
  const idToken = await user.getIdToken();
  return {
    idToken,
    email: user.email || '',
    fullName: user.displayName || '',
    picture: user.photoURL || '',
  };
};
