import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('🚀 main.jsx executing');

// Function to initialize the app
const initApp = () => {
  console.log('🔍 Attempting to initialize app...');
  
  // Look for the extension root element
  const rootElement = document.getElementById('ai-prompt-manager-root');
  
  if (!rootElement) {
    console.warn('⚠️ ai-prompt-manager-root not found, retrying in 100ms...');
    setTimeout(initApp, 100);
    return;
  }
  
  console.log('✅ Found ai-prompt-manager-root');
  
  // Check if already mounted
  if (rootElement.hasAttribute('data-reactroot') || rootElement._reactRootContainer) {
    console.log('⚠️ React already mounted to this element');
    return;
  }
  
  try {
    console.log('🎯 Creating React root and mounting App...');
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('✅ React app mounted successfully!');
  } catch (error) {
    console.error('❌ Error mounting React app:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
};

// Start initialization with retry logic
let retryCount = 0;
const maxRetries = 50; // 5 seconds max

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

// Start immediately
console.log('📦 Starting app initialization...');
startInit();