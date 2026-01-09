// Content script that injects the React app into the page

console.log('🚀 AI Prompt Manager content script starting...');
console.log('Current URL:', window.location.href);
console.log('Document ready state:', document.readyState);

// Prevent multiple injections
if (window.aiPromptManagerInjected) {
  console.log('⚠️ AI Prompt Manager already injected - skipping');
} else {
  window.aiPromptManagerInjected = true;
  console.log('✅ First injection - proceeding...');

  // Create a root element for the React app
  const createAppRoot = () => {
    console.log('📦 Creating app root...');
    
    // Check if root already exists
    if (document.getElementById('ai-prompt-manager-root')) {
      console.log('⚠️ Root element already exists');
      return;
    }

    console.log('Creating root div element...');
    const root = document.createElement('div');
    root.id = 'ai-prompt-manager-root';
    root.style.cssText = 'position: relative; z-index: 999999;';
    document.body.appendChild(root);
    console.log('✅ Root element appended to body');

    // Get the URLs for the assets
    const jsUrl = chrome.runtime.getURL('assets/main.js');
    const cssUrl = chrome.runtime.getURL('assets/main.css');
    
    console.log('JS URL:', jsUrl);
    console.log('CSS URL:', cssUrl);

    // Inject the bundled React app
    console.log('🎨 Injecting React app script...');
    const script = document.createElement('script');
    script.src = jsUrl;
    script.type = 'module';
    script.onload = () => {
      console.log('✅ React app loaded successfully!');
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load React app:', error);
      console.error('Script src:', script.src);
    };
    document.body.appendChild(script);

    // Inject the styles
    console.log('💅 Injecting styles...');
    const link = document.createElement('link');
    link.href = cssUrl;
    link.rel = 'stylesheet';
    link.onload = () => {
      console.log('✅ Styles loaded successfully!');
    };
    link.onerror = (error) => {
      console.error('❌ Failed to load styles:', error);
      console.error('Link href:', link.href);
    };
    document.head.appendChild(link);
    
    console.log('✅ App root creation complete');
  };

  // Initialize the app when the page loads
  console.log('⏳ Waiting for DOM to be ready...');
  if (document.readyState === 'loading') {
    console.log('Document still loading, adding DOMContentLoaded listener...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOMContentLoaded fired');
      createAppRoot();
    });
  } else {
    console.log('Document already ready, creating app root immediately');
    createAppRoot();
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received from background:', request);
    console.log('Sender:', sender);
    
    if (request.action === 'toggleDropdown') {
      console.log('🎯 Toggle dropdown action triggered');
      
      // Check if root element exists
      const root = document.getElementById('ai-prompt-manager-root');
      if (!root) {
        console.error('❌ Root element not found!');
        sendResponse({ success: false, error: 'Root element not found' });
        return true;
      }
      
      console.log('Root element found:', root);
      
      // Dispatch custom event to React app
      console.log('📡 Dispatching togglePromptManager event...');
      window.dispatchEvent(new CustomEvent('togglePromptManager'));
      console.log('✅ Event dispatched');
      
      sendResponse({ success: true });
    }
    
    return true; // Keep message channel open for async response
  });

  console.log('✅ AI Prompt Manager content script initialized');
  console.log('Waiting for extension icon click or Cmd/Ctrl+K...');
}