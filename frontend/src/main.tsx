import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { DataSyncProvider } from './context/DataSyncContext';
import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="Khởi động ứng dụng lâm sàng AURA">
      <LanguageProvider>
        <AuthProvider>
          <DataSyncProvider>
            <App />
          </DataSyncProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
