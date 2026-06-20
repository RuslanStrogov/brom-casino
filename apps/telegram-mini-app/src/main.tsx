import React from 'react';
import ReactDOM from 'react-dom/client';
import { SDKProvider } from '@twa-dev/sdk/react';
import App from './App';
import './app/globals.css';

// Initialize TWA SDK
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <SDKProvider acceptCustomStyles>
      <App />
    </SDKProvider>
  </React.StrictMode>
);
