// Client Hunter - Content Script v2.1.0
// Real extraction from Google Maps + any website
// No mock data. No fake results.

(function(){
  if(window.__clientHunterContentScript) return;
  window.__clientHunterContentScript = true;

  const LOG = '[Content]';
  function log(...a){ console.log(LOG, ...a) }

  log('Injected ✓', location.href);

  // ─── Google Maps Extraction ────────────────────────────────

  function extractGoogleMaps(){
    const results = [];
    const url = location.href;

    // Strategy 1: Find all place links (/maps/place/...)
    const placeLinks = document.querySelectorAll('a[href*="/maps/place/"]');
    log('Place links found:', placeLinks.length);

    const processedNames = new Set();

    placeLinks.forEach(link => {
      try{
        // Get the card container (go up to find the result card)
        let card = link.closest('.Nv2PK') || link.closest('[data-result-index]') || link.parentElement?.parentElement?.parentElement;
        if(!card) card = link.parentElement;

        // Business name from the link text or aria-label
        let name = null;
        const ariaLabel = link.getAttribute('aria-label');
        if(ariaLabel && ariaLabel.length > 1 && !ariaLabel.startsWith('http')){
          name = ariaLabel.trim();
        }
        if(!name){
          const nameEl = link.querySelector('.qBF1Pd, .fontHeadlineSmall, .WMW5bf, .DUwDvf, [class*="fontHeadline"]');
          if(nameEl) name = nameEl.innerText.trim();
        }
        if(!name) name = link.innerText.trim().split('\n')[0];

        if(!name || name.length < 2 || processedNames.has(name)) return;
        processedNames.add(name);

        const cardText = card ? card.innerText : '';

        // Rating - look for star rating text like "4.7"
        let rating = null;
        const ratingMatch = cardText.match(/(\d\.\d)\s*(?:★|star)/i) || cardText.match(/^(\d\.\d)/m);
        if(ratingMatch) rating = ratingMatch[1];

        // Also check aria-label on star elements
        if(!rating){
          const starEl = card?.querySelector('[aria-label*="star"]');
          if(starEl){
            const m = starEl.getAttribute('aria-label').match(/([\d.]+)/);
            if(m) rating = m[1];
          }
        }

        // Reviews count
        let reviews = null;
        const reviewMatch = cardText.match(/\(([0-9,]+)\)/);
        if(reviewMatch) reviews = reviewMatch[1].replace(/,/g, '');

        // Type/category - usually after rating line
        let businessType = null;
        const typeEl = card?.querySelector('.W4Efsd span, .fontBodyMedium span');
        if(typeEl){
          const spans = card.querySelectorAll('.W4Efsd span, .fontBodyMedium span');
          spans.forEach(s => {
            const t = s.innerText.trim();
            if(t && !t.includes('★') && !t.includes('(') && !t.match(/^\d/) && t.length > 2 && t.length < 50 && !businessType){
              // Skip if it's the name, rating, or address
              if(t !== name && !t.includes('Open') && !t.includes('Closed') && !/\d{3}/.test(t)){
                businessType = t;
              }
            }
          });
        }

        // Address
        let address = null;
        const addrMatch = cardText.match(/(?:^|\n)((?:\d+\s+)?[A-Z][a-zA-Z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Highway|Hwy)[^,\n]*(?:,\s*[A-Za-z\s]+(?:,\s*[A-Z]{2})?)?)/i);
        if(addrMatch) address = addrMatch[1].trim();

        // Phone
        let phone = null;
        const phoneMatch = cardText.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if(phoneMatch) phone = phoneMatch[0].trim();

        // Website
        let website = null;
        const webLink = card?.querySelector('a[data-item-id*="authority"], a[href*="http"]:not([href*="google"]):not([href*="maps"])');
        if(webLink){
          const href = webLink.getAttribute('href');
          if(href && href.startsWith('http') && !href.includes('google.com')){
            website = href;
          }
        }

        results.push({
          business_name: name,
          business_type: businessType || null,
          rating: rating || null,
          reviews: reviews || null,
          address: address || null,
          phone: phone || null,
          website: website || null,
          source: 'google-maps',
          source_url: url,
        });

        log('Extracted:', name, phone ? '📞'+phone : '', rating ? '⭐'+rating : '');
      }catch(e){ /* skip bad card */ }
    });

    // Strategy 2: If no place links found, try extracting from visible text
    if(results.length === 0){
      log('No place links found, trying text-based extraction');
      const sidebar = document.querySelector('[role="feed"], .m6QErb, [aria-label*="Results"]');
      if(sidebar){
        const items = sidebar.querySelectorAll('[class*="result"], [role="listitem"], .Nv2PK');
        items.forEach(item => {
          const text = item.innerText;
          const lines = text.split('\n').filter(l => l.trim());
          if(lines.length > 0){
            const name = lines[0].trim();
            if(name.length > 2 && !processedNames.has(name)){
              processedNames.add(name);
              const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
              results.push({
                business_name: name,
                phone: phoneMatch ? phoneMatch[0].trim() : null,
                source: 'google-maps',
                source_url: url,
              });
            }
          }
        });
      }
    }

    log('Total extracted:', results.length);
    return results;
  }

  // ─── Generic Website Extraction ────────────────────────────

  function extractGenericWebsite(){
    // JSON-LD
    const ldBusinesses = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(node => {
      try{
        const parsed = JSON.parse(node.textContent || '{}');
        const items = Array.isArray(parsed) ? parsed : [parsed];
        items.forEach(item => {
          if(item['@graph']) item['@graph'].forEach(g => ldBusinesses.push(g));
          else ldBusinesses.push(item);
        });
      }catch{}
    });

    const types = ['LocalBusiness','Organization','Restaurant','Dentist','Doctor','Store','MedicalClinic','ProfessionalService'];
    const businessLd = ldBusinesses.find(b => types.some(t => (b['@type']||'').includes(t)) || b.name);

    // Email
    const emails = new Set();
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      const addr = (a.getAttribute('href')||'').replace('mailto:','').split('?')[0].trim();
      if(addr && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) emails.add(addr.toLowerCase());
    });
    const bodyText = document.body ? document.body.innerText : '';
    (bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).forEach(e => {
      if(!/\.(png|jpe?g|gif|svg|webp|css|js)$/i.test(e)) emails.add(e.toLowerCase());
    });

    // Phone
    const phones = new Set();
    document.querySelectorAll('a[href^="tel:"]').forEach(a => {
      const num = (a.getAttribute('href')||'').replace('tel:','').trim();
      if(num.replace(/\D/g,'').length >= 7) phones.add(num);
    });
    (bodyText.match(/(?:\+?\d[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || []).forEach(p => phones.add(p.trim()));

    // Socials
    const socials = {};
    document.querySelectorAll('a[href]').forEach(a => {
      const h = (a.getAttribute('href')||'').toLowerCase();
      if(h.includes('facebook.com') && !socials.facebook) socials.facebook = a.getAttribute('href');
      if(h.includes('instagram.com') && !socials.instagram) socials.instagram = a.getAttribute('href');
      if(h.includes('linkedin.com') && !socials.linkedin) socials.linkedin = a.getAttribute('href');
    });

    // Name
    const name = (businessLd && businessLd.name) ||
      (document.querySelector('h1') ? document.querySelector('h1').innerText.trim() : null) ||
      document.title.split(/[|\-–—]/)[0].trim();

    const addr = businessLd && businessLd.address;
    const addressStr = addr ? (typeof addr === 'string' ? addr : [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode].filter(Boolean).join(', ')) : null;

    return [{
      business_name: name || location.hostname,
      business_type: businessLd ? businessLd['@type'] : null,
      website: location.origin,
      email: emails.size > 0 ? [...emails][0] : null,
      phone: phones.size > 0 ? [...phones][0] : null,
      address: addressStr,
      facebook: socials.facebook || null,
      instagram: socials.instagram || null,
      linkedin: socials.linkedin || null,
      source: 'website',
      source_url: location.href,
      all_emails: [...emails],
      all_phones: [...phones],
    }];
  }

  // ─── Main Extractor ────────────────────────────────────────

  function extractCurrentPage(){
    const url = location.href.toLowerCase();

    if(url.includes('google.com/maps') || url.includes('maps.google.com')){
      return { source: 'google-maps', businesses: extractGoogleMaps() };
    }
    return { source: 'website', businesses: extractGenericWebsite() };
  }

  // ─── Wait for Dynamic Content ──────────────────────────────

  function waitForResults(callback, maxWait = 15000){
    const start = Date.now();
    const check = () => {
      const result = extractCurrentPage();
      if(result.businesses.length > 0 || Date.now() - start > maxWait){
        callback(result);
      } else {
        setTimeout(check, 1000);
      }
    };
    check();
  }

  // ─── Message Handler ───────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if(!msg || !msg.type) return false;

    if(msg.type === 'PING'){
      sendResponse({ alive: true, url: location.href, title: document.title });
      return true;
    }

    if(msg.type === 'TEST_CONNECTION'){
      sendResponse({ connected: true, url: location.href, title: document.title, version: '2.1.0' });
      return true;
    }

    if(msg.type === 'EXTRACT_CURRENT_PAGE'){
      log('Extract request received');
      // For Google Maps, wait for dynamic content
      if(location.href.includes('google.com/maps')){
        log('Google Maps detected, waiting for results...');
        waitForResults(result => {
          let emails = 0, phones = 0, socials = 0;
          result.businesses.forEach(b => {
            if(b.email) emails++;
            if(b.phone) phones++;
            if(b.facebook || b.instagram || b.linkedin) socials++;
          });
          sendResponse({
            success: true,
            source: result.source,
            url: location.href,
            title: document.title,
            businesses: result.businesses,
            stats: { found: result.businesses.length, emails, phones, socials }
          });
        });
        return true; // async response
      }

      // For other pages, extract immediately
      try{
        const result = extractCurrentPage();
        let emails = 0, phones = 0, socials = 0;
        result.businesses.forEach(b => {
          if(b.email) emails++;
          if(b.phone) phones++;
          if(b.facebook || b.instagram || b.linkedin) socials++;
        });
        sendResponse({
          success: true,
          source: result.source,
          url: location.href,
          title: document.title,
          businesses: result.businesses,
          stats: { found: result.businesses.length, emails, phones, socials }
        });
      }catch(e){
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

    return false;
  });

  log('Ready ✓');
})();
