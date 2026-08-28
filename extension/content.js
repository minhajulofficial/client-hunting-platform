// Content script: extract publicly visible business info from page (no bypass of auth/CAPTCHA/paywalls)
// Implements Extractor → Normalizer for website source
function extractWebsite(){
  const getMeta=(n)=> document.querySelector(`meta[name="${n}"]`)?.content || document.querySelector(`meta[property="${n}"]`)?.content || ''
  const emails = Array.from(document.body.innerText.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)).map(m=>m[0]).slice(0,3)
  const phones = Array.from(document.body.innerText.matchAll(/\+?[\d\s\-\(\)]{7,}/g)).map(m=>m[0].trim()).slice(0,2)
  const socials = { facebook: document.querySelector('a[href*="facebook.com"]')?.href, instagram: document.querySelector('a[href*="instagram.com"]')?.href, linkedin: document.querySelector('a[href*="linkedin.com"]')?.href }
  return {
    businessName: document.querySelector('h1')?.innerText || document.title.split('|')[0].trim() || location.hostname,
    website: location.origin,
    email: emails[0],
    phone: phones[0],
    ...socials,
    address: document.querySelector('[itemprop="address"]')?.innerText || '',
    source: 'website',
    sourceUrl: location.href
  }
}
chrome.runtime.onMessage.addListener((msg, _, sendResponse)=>{
  if(msg.type==='EXTRACT_WEBSITE'){ sendResponse(extractWebsite()) }
})
