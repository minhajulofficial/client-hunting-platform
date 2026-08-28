// Content script: extracts ONLY publicly visible business info from the current page.
// It never bypasses login, CAPTCHA, paywalls or anti-bot controls.
(function(){
  if (window.__clientHunterInjected) return;
  window.__clientHunterInjected = true;

  function absolute(href){
    try { return new URL(href, location.href).toString() } catch { return null }
  }
  function pickSocial(pattern){
    const a = document.querySelector('a[href*="' + pattern + '"]');
    return a ? absolute(a.getAttribute('href')) : null;
  }
  function jsonLd(){
    const out = {};
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function(node){
      try{
        const parsed = JSON.parse(node.textContent || '{}');
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        arr.forEach(function(entry){
          if(!entry || typeof entry !== 'object') return;
          if(entry.name && !out.name) out.name = entry.name;
          if(entry.email && !out.email) out.email = String(entry.email).replace('mailto:','');
          if(entry.telephone && !out.phone) out.phone = String(entry.telephone);
          const addr = entry.address;
          if(addr && !out.address){
            out.address = typeof addr === 'string' ? addr : [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode].filter(Boolean).join(', ');
          }
        });
      }catch{}
    });
    return out;
  }

  function extractWebsite(){
    const ld = jsonLd();
    const text = document.body ? document.body.innerText : '';

    const mailto = document.querySelector('a[href^="mailto:"]');
    const mailtoAddr = mailto ? (mailto.getAttribute('href') || '').replace('mailto:','').split('?')[0].trim() : null;
    const emailMatches = (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [])
      .filter(function(e){ return !/\.(png|jpe?g|gif|svg|webp)$/i.test(e) });

    const telLink = document.querySelector('a[href^="tel:"]');
    const telAddr = telLink ? (telLink.getAttribute('href') || '').replace('tel:','').trim() : null;
    const phoneMatches = (text.match(/\+?\d[\d\s().-]{6,}\d/g) || []).map(function(p){ return p.trim() });

    const heading = document.querySelector('h1');
    const ogSite = document.querySelector('meta[property="og:site_name"]');
    const businessName = (ld.name
      || (heading && heading.innerText.trim())
      || (ogSite && ogSite.getAttribute('content'))
      || (document.title || '').split(/[|\-–—]/)[0].trim()
      || location.hostname).slice(0, 200);

    const contactLink = Array.from(document.querySelectorAll('a')).find(function(a){ return /contact/i.test(a.textContent || '') || /contact/i.test(a.getAttribute('href') || '') });
    const aboutLink = Array.from(document.querySelectorAll('a')).find(function(a){ return /about/i.test(a.textContent || '') || /about/i.test(a.getAttribute('href') || '') });

    return {
      businessName: businessName,
      website: location.origin,
      email: ld.email || mailtoAddr || emailMatches[0] || null,
      phone: ld.phone || telAddr || phoneMatches[0] || null,
      address: ld.address || null,
      facebook: pickSocial('facebook.com'),
      instagram: pickSocial('instagram.com'),
      linkedin: pickSocial('linkedin.com'),
      contactUrl: contactLink ? absolute(contactLink.getAttribute('href')) : null,
      aboutUrl: aboutLink ? absolute(aboutLink.getAttribute('href')) : null,
      source: 'website',
      sourceUrl: location.href
    };
  }

  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
    if(msg && msg.type === 'EXTRACT_WEBSITE'){
      try{ sendResponse(extractWebsite()) }
      catch(e){ sendResponse({ error: e.message }) }
    }
    return true;
  });
})();
