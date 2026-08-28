// Minimal MV3 service worker. No secrets, no DB access - all writes go through the authenticated CRM API.
chrome.runtime.onInstalled.addListener(function(){
  console.log('Client Hunter installed');
});
