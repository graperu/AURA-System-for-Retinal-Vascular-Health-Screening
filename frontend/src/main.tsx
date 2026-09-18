import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { DataSyncProvider } from './context/DataSyncContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <DataSyncProvider>
          <App />
        </DataSyncProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
