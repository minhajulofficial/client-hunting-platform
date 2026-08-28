// Client Hunter - Background Service Worker v1.0.0
// Handles message routing between popup and content scripts.
// No secrets, no DB access - all writes go through the authenticated CRM API.

const LOG_PREFIX = '[Background]';

chrome.runtime.onInstalled.addListener(() => {
  console.log(LOG_PREFIX, 'Client Hunter installed');
  chrome.storage.local.set({ version: chrome.runtime.getManifest().version });
});

// Relay messages between popup and content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if(msg && msg.type === 'GET_ACTIVE_TAB'){
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs && tabs[0];
      if(!tab || !tab.url || !/^https?:/.test(tab.url)){
        sendResponse({ error: 'No active tab or not a web page' });
        return;
      }
      sendResponse({ tabId: tab.id, url: tab.url, title: tab.title });
    });
    return true; // async response
  }

  if(msg && msg.type === 'INJECT_CONTENT_SCRIPT'){
    const tabId = msg.tabId;
    if(!tabId){ sendResponse({ error: 'No tabId provided' }); return false; }

    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }, results => {
      if(chrome.runtime.lastError){
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }

  if(msg && msg.type === 'SEND_TO_TAB'){
    const tabId = msg.tabId;
    if(!tabId){ sendResponse({ error: 'No tabId' }); return false; }

    chrome.tabs.sendMessage(tabId, msg.payload, response => {
      if(chrome.runtime.lastError){
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response);
      }
    });
    return true;
  }
});
