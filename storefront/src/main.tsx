import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "primereact/resources/themes/lara-light-teal/theme.css";
import { PrimeReactProvider } from 'primereact/api';
import { Web5Provider } from './providers/Web5Provider.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider>
      <Web5Provider>
        <App />
      </Web5Provider>
    </PrimeReactProvider>
  </React.StrictMode>,
)
