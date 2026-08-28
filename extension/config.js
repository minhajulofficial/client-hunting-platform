// Client Hunter extension config
// Default CRM URL - change in the extension popup (gear) if you self-host
const DEFAULT_CRM_URL = 'https://client-hunting-platform-five.vercel.app';
async function getCrmUrl(){
  try{
    const s = await chrome.storage.local.get('crmUrl');
    return (s.crmUrl || DEFAULT_CRM_URL).replace(/\/$/, '');
  }catch{ return DEFAULT_CRM_URL }
}
async function setCrmUrl(url){
  await chrome.storage.local.set({ crmUrl: url.replace(/\/$/, '') });
}
