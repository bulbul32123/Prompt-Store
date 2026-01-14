function findChatInput() {
  return (
    document.querySelector('#prompt-textarea') ||
    document.querySelector('.trailing-actions-wrapper.ui-ready-fade-in.ng-tns-c626672225-6') ||
    document.querySelector('[contenteditable="true"][role="textbox"]') ||
    document.querySelector('.tiptap')
  );
}

function findActionBar(input) {
  if (!input) return null;

  const chatgptBar = document.querySelector('.trailing-actions-wrapper');
  if (chatgptBar) return chatgptBar;
  if (input.classList.contains('ql-editor')) {
    let el = input.parentElement;
    while (el && el !== document.body) {
      if (
        el.querySelector('button') &&
        getComputedStyle(el).display === 'flex'
      ) {
        return el;
      }
      el = el.parentElement;
    }
  }

  const radixMenu = document.querySelector(['[contenteditable="true"][role="textbox"]', '.tiptap']);
  if (radixMenu) {
    let parent = radixMenu.parentElement;
    while (parent && parent !== document.body) {
      const style = getComputedStyle(parent);
      const hasSendButton = parent.querySelector('button[type="submit"]');

      if (style.display === 'flex' && hasSendButton) {
        return parent;
      }
      parent = parent.parentElement;
    }
  }

  let el = input.parentElement;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    const isFlex = style.display === 'flex';
    const hasSendButton = el.querySelector('button[type="submit"]');
    const hasRadixMenu = el.querySelector('[aria-haspopup="menu"]');

    if (isFlex && hasSendButton && hasRadixMenu) {
      return el;
    }

    el = el.parentElement;
  }

  return null;
}

function injectSavePromptButton() {
  const input = findChatInput();
  if (!input) return;
  const iconUrl = chrome?.runtime.getURL('icons/promtlens.svg');

  const actionBar = findActionBar(input);
  if (!actionBar) return;

  if (actionBar.querySelector('#save-prompt-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'save-prompt-btn';
  btn.type = 'button';
  btn.title = 'Save prompt';
  // Change this line if using an extension:

  btn.innerHTML = `
  <div style="display: flex; align-items: center; justify-content: center;">
    <img src="${iconUrl}" 
         style="width: 25px; height: 25px; min-width: 25px; min-height: 25px; display: block;" 
         onerror="this.style.display='none'; console.error('Image failed to load:', this.src);">
  </div>
`;

  btn.style.cssText = `
    margin-left: 6px;
    margin-right: 6px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    background: transparent;
    border: none;
    font-size: 16px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    z-index: 9999;
    transition: background 0.2s;
  `;

  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'rgba(255, 255, 255, 0.1)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'transparent';
  });

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    window.dispatchEvent(
      new CustomEvent('openAddPromptFromChat')
    );
  });

  const sendButton = actionBar.querySelector('button[type="submit"]');
  if (sendButton) {
    actionBar.insertBefore(btn, sendButton);
  } else {
    actionBar.appendChild(btn);
  }
}

const observer = new MutationObserver(() => {
  injectSavePromptButton();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

document.addEventListener('focusin', injectSavePromptButton);
document.addEventListener('input', injectSavePromptButton);

setTimeout(injectSavePromptButton, 500);
setTimeout(injectSavePromptButton, 1000);
setTimeout(injectSavePromptButton, 2000);
