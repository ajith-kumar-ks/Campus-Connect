import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ClubsProvider } from './context/ClubsContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <ClubsProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ClubsProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
