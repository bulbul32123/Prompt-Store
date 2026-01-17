chrome.action.onClicked.addListener(async (tab) => {
    const supportedUrls = [
      'chat.openai.com',
      'chatgpt.com',
      'claude.ai',
      'gemini.google.com'
    ];
    
    const isSupported = supportedUrls.some(url => tab.url?.includes(url));
    
    if (!isSupported) {
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
  
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "toggleDropdown" });
      console.log('✅ Message sent successfully, response:', response);
    } catch (error) {
      console.log('⚠️ Content script not responding:', error.message);
      console.log('Attempting to inject content script...');
      
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        setTimeout(async () => {
          try {
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
  
  chrome.runtime.onInstalled.addListener(() => {
    console.log('🎉 AI Prompt Manager installed successfully');
  });