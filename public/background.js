// Background service worker for handling extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
    console.log('=== Extension icon clicked ===');
    console.log('Tab URL:', tab.url);
    console.log('Tab ID:', tab.id);
    
    // Check if we're on a supported page
    const supportedUrls = [
      'chat.openai.com',
      'chatgpt.com',
      'claude.ai',
      'gemini.google.com'
    ];
    
    const isSupported = supportedUrls.some(url => tab.url?.includes(url));
    
    if (!isSupported) {
      console.log('❌ Not on a supported site');
      console.log('Current URL:', tab.url);
      console.log('Supported sites:', supportedUrls);
      
      // Try to show notification if permission is available
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'AI Prompt Manager',
          message: 'Please open ChatGPT, Claude, or Gemini to use this extension.'
        });
      }
      return;
    }
  
    console.log('✅ Supported site detected');
  
    try {
      // Try to send message to content script
      console.log('Attempting to send message to content script...');
      const response = await chrome.tabs.sendMessage(tab.id, { action: "toggleDropdown" });
      console.log('✅ Message sent successfully, response:', response);
    } catch (error) {
      console.log('⚠️ Content script not responding:', error.message);
      console.log('Attempting to inject content script...');
      
      try {
        // Inject CSS first
        console.log('Injecting CSS...');
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        });
        console.log('✅ CSS injected');
        
        // Inject content script
        console.log('Injecting content script...');
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log('✅ Content script injected');
        
        // Wait for the script to initialize, then send message
        console.log('Waiting 1 second for initialization...');
        setTimeout(async () => {
          try {
            console.log('Sending message after injection...');
            const response = await chrome.tabs.sendMessage(tab.id, { action: "toggleDropdown" });
            console.log('✅ Message sent after injection, response:', response);
          } catch (e) {
            console.error('❌ Failed to send message after injection:', e);
          }
        }, 1000);
      } catch (injectionError) {
        console.error('❌ Failed to inject content script:', injectionError);
      }
    }
  });
  
  // Listen for installation
  chrome.runtime.onInstalled.addListener(() => {
    console.log('🎉 AI Prompt Manager installed successfully');
  });