import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { rotas } from './configuracoes/rotas';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registro automático do Service Worker
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={rotas} />
  </React.StrictMode>
);
