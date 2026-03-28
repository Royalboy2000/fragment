import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Web3ModalProvider } from './Web3ModalProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3ModalProvider>
      <App />
    </Web3ModalProvider>
  </StrictMode>,
);
