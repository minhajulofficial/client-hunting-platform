// Client Hunter - Content Script v1.0.0
// Real DOM extraction engine. No mock data. No fake results.
// Extracts ONLY publicly visible business info from the current page.
// Never bypasses login, CAPTCHA, paywalls or anti-bot controls.

(function(){
  if(window.__clientHunterContentScript) return;
  window.__clientHunterContentScript = true;

  const LOG_PREFIX = '[ContentScript]';

  function log(...args){ console.log(LOG_PREFIX, ...args) }
  function warn(...args){ console.warn(LOG_PREFIX, ...args) }

  log('Injected ✓', location.href);

  // ─── Utility ───────────────────────────────────────────────

  function absolute(href){
    try{ return new URL(href, location.href).toString() }
    catch{ return null }
  }

  function clean(text){
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  function unique(arr){
    return [...new Set(arr.filter(Boolean))];
  }

  // ─── Source Detection ──────────────────────────────────────

  const SOURCE_PATTERNS = [
    { id: 'google-maps', name: 'Google Maps', patterns: ['google.com/maps', 'google.com/search?tbm=map', 'maps.google.com'] },
    { id: 'yelp', name: 'Yelp', patterns: ['yelp.com'] },
    { id: 'yellowpages', name: 'Yellow Pages', patterns: ['yellowpages.com'] },
    { id: 'bbb', name: 'BBB', patterns: ['bbb.org'] },
    { id: 'facebook', name: 'Facebook', patterns: ['facebook.com', 'fb.com'] },
    { id: 'instagram', name: 'Instagram', patterns: ['instagram.com'] },
    { id: 'linkedin', name: 'LinkedIn', patterns: ['linkedin.com'] },
    { id: 'twitter', name: 'Twitter/X', patterns: ['twitter.com', 'x.com'] },
    { id: 'thumbtack', name: 'Thumbtack', patterns: ['thumbtack.com'] },
    { id: 'angi', name: 'Angi', patterns: ['angi.com', 'angieslist.com'] },
    { id: 'homeadvisor', name: 'HomeAdvisor', patterns: ['homeadvisor.com'] },
    { id: 'clutch', name: 'Clutch', patterns: ['clutch.co'] },
    { id: 'goodfirms', name: 'GoodFirms', patterns: ['goodfirms.co'] },
    { id: 'tripadvisor', name: 'TripAdvisor', patterns: ['tripadvisor.com'] },
    { id: 'foursquare', name: 'Foursquare', patterns: ['foursquare.com'] },
    { id: 'bing-maps', name: 'Bing Maps', patterns: ['bing.com/maps', 'bing.com/search'] },
    { id: 'apple-maps', name: 'Apple Maps', patterns: ['maps.apple.com'] },
    { id: 'opendi', name: 'OpenDi', patterns: ['opendi.us'] },
    { id: 'manta', name: 'Manta', patterns: ['manta.com'] },
    { id: 'chamberofcommerce', name: 'Chamber of Commerce', patterns: ['chamberofcommerce.com'] },
  ];

  function detectSource(){
    const url = location.href.toLowerCase();
    for(const src of SOURCE_PATTERNS){
      for(const p of src.patterns){
        if(url.includes(p)) return { id: src.id, name: src.name, supported: true };
      }
    }
    // Any other website = generic website source
    return { id: 'website', name: location.hostname, supported: true };
  }

  // ─── JSON-LD Extraction ────────────────────────────────────

  function extractJsonLd(){
    const results = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(node => {
      try{
        const parsed = JSON.parse(node.textContent || '{}');
        const items = Array.isArray(parsed) ? parsed : [parsed];
        items.forEach(item => {
          if(!item || typeof item !== 'object') return;
          // Handle @graph
          if(item['@graph'] && Array.isArray(item['@graph'])){
            item['@graph'].forEach(g => results.push(g));
          } else {
            results.push(item);
          }
        });
      }catch{}
    });
    return results;
  }

  function parseJsonLdBusinesses(){
    const items = extractJsonLd();
    const businesses = [];
    const types = ['LocalBusiness', 'Organization', 'Restaurant', 'Dentist', 'Doctor',
      'Plumber', 'Electrician', 'Contractor', 'Store', 'Shop', 'MedicalClinic',
      'HealthAndBeautyBusiness', 'HomeAndConstructionBusiness', 'ProfessionalService'];

    items.forEach(item => {
      const type = item['@type'] || '';
      const isBusiness = types.some(t => type.includes(t)) || item.name;
      if(!isBusiness) return;

      const addr = item.address || {};
      const social = Array.isArray(item.sameAs) ? item.sameAs : (item.sameAs ? [item.sameAs] : []);

      businesses.push({
        business_name: clean(item.name) || null,
        website: item.url || null,
        email: item.email ? String(item.email).replace('mailto:', '') : null,
        phone: item.telephone || null,
        address: typeof addr === 'string' ? addr : [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode, addr.addressCountry].filter(Boolean).join(', ') || null,
        city: addr.addressLocality || null,
        state: addr.addressRegion || null,
        country: addr.addressCountry || null,
        postal_code: addr.postalCode || null,
        facebook: social.find(s => s.includes('facebook.com')) || null,
        instagram: social.find(s => s.includes('instagram.com')) || null,
        linkedin: social.find(s => s.includes('linkedin.com')) || null,
        business_type: type || null,
      });
    });
    return businesses;
  }

  // ─── Email Extraction ──────────────────────────────────────

  function extractEmails(){
    const emails = new Set();

    // 1. mailto: links
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      const addr = (a.getAttribute('href') || '').replace('mailto:', '').split('?')[0].trim();
      if(addr && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) emails.add(addr.toLowerCase());
    });

    // 2. Visible email text (but not in scripts/styles)
    const text = document.body ? document.body.innerText : '';
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    let match;
    while((match = emailRegex.exec(text)) !== null){
      const e = match[0].toLowerCase();
      // Skip image/file extensions
      if(!/\.(png|jpe?g|gif|svg|webp|css|js)$/i.test(e)) emails.add(e);
    }

    // 3. Obfuscated emails (data-email attributes)
    document.querySelectorAll('[data-email]').forEach(el => {
      const e = el.getAttribute('data-email');
      if(e && e.includes('@')) emails.add(e.toLowerCase());
    });

    return [...emails];
  }

  // ─── Phone Extraction ──────────────────────────────────────

  function extractPhones(){
    const phones = new Set();

    // 1. tel: links
    document.querySelectorAll('a[href^="tel:"]').forEach(a => {
      const num = (a.getAttribute('href') || '').replace('tel:', '').trim();
      if(num && num.replace(/\D/g, '').length >= 7) phones.add(num);
    });

    // 2. Visible phone numbers
    const text = document.body ? document.body.innerText : '';
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    let match;
    while((match = phoneRegex.exec(text)) !== null){
      const p = match[0].trim();
      if(p.replace(/\D/g, '').length >= 7 && p.replace(/\D/g, '').length <= 15) phones.add(p);
    }

    return [...phones];
  }

  // ─── Social Link Extraction ────────────────────────────────

  function extractSocials(){
    const socials = { facebook: null, instagram: null, linkedin: null, twitter: null };
    const seen = new Set();

    document.querySelectorAll('a[href]').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if(seen.has(href)) return;
      seen.add(href);

      if(href.includes('facebook.com') && !socials.facebook) socials.facebook = absolute(a.getAttribute('href'));
      else if(href.includes('instagram.com') && !socials.instagram) socials.instagram = absolute(a.getAttribute('href'));
      else if(href.includes('linkedin.com') && !socials.linkedin) socials.linkedin = absolute(a.getAttribute('href'));
      else if((href.includes('twitter.com') || href.includes('x.com')) && !socials.twitter) socials.twitter = absolute(a.getAttribute('href'));
    });

    return socials;
  }

  // ─── Business Name Extraction ──────────────────────────────

  function extractBusinessName(){
    // Priority: JSON-LD > og:site_name > h1 > title
    const ld = parseJsonLdBusinesses();
    if(ld.length > 0 && ld[0].business_name) return ld[0].business_name;

    const ogSite = document.querySelector('meta[property="og:site_name"]');
    if(ogSite) return clean(ogSite.getAttribute('content'));

    const h1 = document.querySelector('h1');
    if(h1) return clean(h1.innerText);

    const title = document.title || '';
    const parts = title.split(/[|\-–—:]/);
    if(parts.length > 0) return clean(parts[0]);

    return location.hostname;
  }

  // ─── Address Extraction ────────────────────────────────────

  function extractAddress(){
    // Try JSON-LD first
    const ld = parseJsonLdBusinesses();
    if(ld.length > 0 && ld[0].address) return ld[0].address;

    // Try schema.org microdata
    const addrEl = document.querySelector('[itemprop="address"], [itemprop="streetAddress"]');
    if(addrEl){
      const parts = [];
      const street = document.querySelector('[itemprop="streetAddress"]');
      const city = document.querySelector('[itemprop="addressLocality"]');
      const region = document.querySelector('[itemprop="addressRegion"]');
      const zip = document.querySelector('[itemprop="postalCode"]');
      if(street) parts.push(clean(street.innerText));
      if(city) parts.push(clean(city.innerText));
      if(region) parts.push(clean(region.innerText));
      if(zip) parts.push(clean(zip.innerText));
      if(parts.length > 0) return parts.join(', ');
    }

    // Try footer/contact text patterns
    const text = document.body ? document.body.innerText : '';
    const addrMatch = text.match(/\d{1,5}\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)[^,]*,\s*[\w\s]+,\s*[A-Z]{2}\s+\d{5}/i);
    if(addrMatch) return clean(addrMatch[0]);

    return null;
  }

  // ─── Single Business Extraction (for any website) ──────────

  function extractSingleBusiness(){
    const name = extractBusinessName();
    const emails = extractEmails();
    const phones = extractPhones();
    const socials = extractSocials();
    const address = extractAddress();
    const ld = parseJsonLdBusinesses();
    const ldBusiness = ld.length > 0 ? ld[0] : {};

    return {
      business_name: name,
      business_type: ldBusiness.business_type || null,
      website: location.origin,
      email: emails[0] || ldBusiness.email || null,
      phone: phones[0] || ldBusiness.phone || null,
      address: address || ldBusiness.address || null,
      city: ldBusiness.city || null,
      state: ldBusiness.state || null,
      country: ldBusiness.country || null,
      postal_code: ldBusiness.postal_code || null,
      facebook: socials.facebook || ldBusiness.facebook || null,
      instagram: socials.instagram || ldBusiness.instagram || null,
      linkedin: socials.linkedin || ldBusiness.linkedin || null,
      twitter: socials.twitter || null,
      source: 'website',
      source_url: location.href,
      all_emails: emails,
      all_phones: phones,
    };
  }

  // ─── Multiple Business Extraction (for directory pages) ────

  function extractMultipleBusinesses(){
    const businesses = [];

    // Strategy 1: JSON-LD with multiple items
    const ldBusinesses = parseJsonLdBusinesses();
    if(ldBusinesses.length > 1){
      log('Found', ldBusinesses.length, 'businesses in JSON-LD');
      return ldBusinesses.map(b => ({
        ...b,
        source: 'website',
        source_url: location.href,
        all_emails: b.email ? [b.email] : [],
        all_phones: b.phone ? [b.phone] : [],
      }));
    }

    // Strategy 2: Common directory card selectors
    const cardSelectors = [
      '.result', '.listing', '.business-card', '.card', '.item',
      '[data-business]', '[data-listing]', '.search-result',
      '.directory-item', '.vendor', '.provider', '.company',
      'article', '.entry',
    ];

    for(const selector of cardSelectors){
      const cards = document.querySelectorAll(selector);
      if(cards.length >= 2){
        log('Found', cards.length, 'cards with selector:', selector);
        cards.forEach(card => {
          const nameEl = card.querySelector('h2, h3, h4, .name, .title, [data-name]');
          const name = nameEl ? clean(nameEl.innerText) : null;
          if(!name || name.length < 2) return;

          const emailEl = card.querySelector('a[href^="mailto:"]');
          const email = emailEl ? (emailEl.getAttribute('href') || '').replace('mailto:', '').split('?')[0] : null;

          const phoneEl = card.querySelector('a[href^="tel:"]');
          const phone = phoneEl ? (phoneEl.getAttribute('href') || '').replace('tel:', '') : null;

          const linkEl = card.querySelector('a[href]');
          const website = linkEl ? absolute(linkEl.getAttribute('href')) : null;

          const text = clean(card.innerText);
          const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          const phoneMatch = text.match(/(?:\+?\d[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

          const socials = extractSocials();

          businesses.push({
            business_name: name,
            website: website || location.origin,
            email: email || (emailMatch ? emailMatch[0].toLowerCase() : null),
            phone: phone || (phoneMatch ? phoneMatch[0] : null),
            address: null,
            city: null, state: null, country: null, postal_code: null,
            facebook: null, instagram: null, linkedin: null, twitter: null,
            source: 'website',
            source_url: location.href,
            all_emails: email ? [email] : (emailMatch ? [emailMatch[0]] : []),
            all_phones: phone ? [phone] : (phoneMatch ? [phoneMatch[0]] : []),
          });
        });
        if(businesses.length > 0) return businesses;
      }
    }

    // Strategy 3: Fallback to single business
    return [extractSingleBusiness()];
  }

  // ─── Message Handler ───────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if(!msg || !msg.type) return false;

    if(msg.type === 'PING'){
      log('Ping received, responding');
      sendResponse({ alive: true, url: location.href, title: document.title });
      return true;
    }

    if(msg.type === 'DETECT_SOURCE'){
      const source = detectSource();
      log('Source detected:', source);
      sendResponse({ source, url: location.href, title: document.title });
      return true;
    }

    if(msg.type === 'EXTRACT_CURRENT_PAGE'){
      log('Extraction requested');
      try{
        const businesses = extractMultipleBusinesses();
        log('Extracted', businesses.length, 'business(es)');

        let totalEmails = 0, totalPhones = 0, totalSocials = 0;
        businesses.forEach(b => {
          if(b.email) totalEmails++;
          if(b.phone) totalPhones++;
          if(b.facebook || b.instagram || b.linkedin) totalSocials++;
        });

        log('Emails:', totalEmails, 'Phones:', totalPhones, 'Socials:', totalSocials);

        sendResponse({
          success: true,
          source: detectSource(),
          url: location.href,
          title: document.title,
          businesses: businesses,
          stats: {
            found: businesses.length,
            emails: totalEmails,
            phones: totalPhones,
            socials: totalSocials,
          }
        });
      }catch(e){
        warn('Extraction failed:', e.message);
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

    if(msg.type === 'TEST_CONNECTION'){
      log('Connection test requested');
      sendResponse({
        connected: true,
        url: location.href,
        title: document.title,
        domAccess: !!document.body,
        contentScriptVersion: '1.0.0',
      });
      return true;
    }

    return false;
  });

  log('Ready ✓');
})();
