chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if(msg.type==='EXTRACT'){
    // Delegates to content script; content.js handles DOM extraction via extractor/normalizer
    sendResponse({ ok:true });
  }
  return true;
});
