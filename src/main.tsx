import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[SW] Novo conteúdo disponível para o Banco de Leite.');
  },
  onOfflineReady() {
    console.log('[SW] Sistema pronto para funcionamento offline nas vans.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
