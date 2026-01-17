import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const initApp = () => {
  const rootElement = document.getElementById('ai-prompt-manager-root');
  
  if (!rootElement) {
    setTimeout(initApp, 100);
    return;
  }
  if (rootElement.hasAttribute('data-reactroot') || rootElement._reactRootContainer) {
    return;
  }
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    ); 
  } catch (error) {
    console.error('❌ Error mounting React app:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
};

let retryCount = 0;
const maxRetries = 50;

const startInit = () => {
  if (retryCount >= maxRetries) {
    console.error('❌ Failed to find ai-prompt-manager-root after', maxRetries, 'attempts');
    return;
  }
  
  const rootElement = document.getElementById('ai-prompt-manager-root');
  if (rootElement) {
    initApp();
  } else {
    retryCount++;
    setTimeout(startInit, 100);
  }
};

console.log('📦 Starting app initialization...');
startInit();