// Client Hunter - Popup v2.0.0
// Auto-search: user enters niche+location → extension opens Google Maps → extracts real results

const $ = id => document.getElementById(id);
const LOG = '[Extension]';
function log(...a){ console.log(LOG, ...a) }

let EXTRACTION_STATE = 'IDLE';
let SEARCH_TAB_ID = null;

// ─── Utilities ──────────────────────────────────────────────

function setState(text, kind){
  const el = $('stateEl');
  el.textContent = text;
  el.className = 'state' + (kind === 'err' ? ' err' : kind === 'ok' ? ' okb' : '');
}

function setDiagnostic(key, value){ const el = $(key); if(el) el.textContent = value; }

async function authHeaders(extra){
  const s = await chrome.storage.local.get('session');
  const h = Object.assign({}, extra || {});
  if(s.session) h['Authorization'] = 'Bearer ' + s.session;
  return h;
}

async function api(path, options){
  const base = await getCrmUrl();
  const url = base + path;
  log('API:', (options?.method || 'GET'), path);
  const res = await fetch(url, options);
  let body = null;
  try{ body = await res.json() }catch{ body = { success:false, error:'Non-JSON response (HTTP '+res.status+')' } }
  if(!res.ok && !body.error) body.error = 'HTTP ' + res.status;
  return { res, body };
}

function esc(s){ return String(s || '').replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])) }

// ─── Content Script Communication ───────────────────────────

async function sendMessageToTab(tabId, payload){
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, payload, response => {
      if(chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(response);
    });
  });
}

async function ensureContentScript(tabId){
  try{
    const resp = await sendMessageToTab(tabId, { type: 'PING' });
    if(resp && resp.alive) return true;
  }catch{}
  try{
    await new Promise((resolve, reject) => {
      chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }, results => {
        if(chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(results);
      });
    });
    await new Promise(r => setTimeout(r, 300));
    return true;
  }catch(e){
    log('Inject failed:', e.message);
    return false;
  }
}

// ─── Test Connection ────────────────────────────────────────

async function testConnection(){
  setDiagnostic('api', 'checking…');
  setDiagnostic('db', 'checking…');
  setDiagnostic('auth', 'checking…');
  try{
    const { res, body } = await api('/api/extension/health', { headers: await authHeaders() });
    if(!res.ok){ setDiagnostic('api', 'Failed ✕'); return false }
    setDiagnostic('api', 'Connected ✓');
    setDiagnostic('db', body.data.database.connected ? 'Connected ✓' : 'Error ✕');
    setDiagnostic('auth', body.data.authentication.session_valid ? 'Valid ✓' : 'No token');
    return true;
  }catch(e){
    setDiagnostic('api', 'Failed ✕'); setDiagnostic('db', '-'); setDiagnostic('auth', '-');
    return false;
  }
}

// ─── Load Projects ──────────────────────────────────────────

async function loadProjects(){
  const sel = $('project');
  sel.innerHTML = '<option value="">Loading…</option>';
  try{
    const { res, body } = await api('/api/projects', { headers: await authHeaders() });
    sel.innerHTML = '';
    if(!res.ok){
      sel.innerHTML = '<option value="">' + (res.status === 401 ? 'Connect to CRM first' : (body.error || 'Failed')) + '</option>';
      return;
    }
    const list = body.data || [];
    if(list.length === 0){ sel.innerHTML = '<option value="">No projects — create one in CRM</option>'; return }
    sel.innerHTML = '<option value="">Select project…</option>';
    list.forEach(p => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name + (p.country ? ' · ' + p.country : '');
      sel.appendChild(o);
    });
    const saved = (await chrome.storage.local.get('projectId')).projectId;
    if(saved) sel.value = saved;
  }catch(e){ sel.innerHTML = '<option value="">Error: ' + e.message + '</option>' }
}

// ─── Test Current Page ──────────────────────────────────────

async function testCurrentPage(){
  const el = $('testResult');
  el.style.display = 'block';
  el.innerHTML = '<span style="color:#71717a">Testing…</span>';
  try{
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if(!tab || !tab.url || !/^https?:/.test(tab.url)){
      el.innerHTML = '<span style="color:#b91c1c">Not a web page.</span>'; return;
    }
    const injected = await ensureContentScript(tab.id);
    if(!injected){
      el.innerHTML = '<span style="color:#b91c1c">Content Script: FAILED ✕<br>Reload page and try again.</span>'; return;
    }
    const resp = await sendMessageToTab(tab.id, { type: 'TEST_CONNECTION' });
    if(resp && resp.connected){
      el.innerHTML = '<span style="color:#15803d">Content Script: CONNECTED ✓</span><br>' +
        'URL: ' + esc(resp.url) + '<br>Title: ' + esc(resp.title) + '<br>Version: ' + esc(resp.version);
    } else {
      el.innerHTML = '<span style="color:#b91c1c">Content Script: FAILED ✕</span>';
    }
  }catch(e){
    el.innerHTML = '<span style="color:#b91c1c">FAILED ✕<br>' + esc(e.message) + '</span>';
  }
}

// ─── Source Detection ───────────────────────────────────────

async function detectCurrentSource(){
  const el = $('siteSup');
  try{
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if(!tab || !tab.url || !/^https?:/.test(tab.url)){
      el.textContent = 'Not a web page'; el.style.color = '#b91c1c'; return;
    }
    const hostname = new URL(tab.url).hostname;
    if(hostname.includes('google.com/maps')){
      el.innerHTML = '<b style="color:#15803d">Google Maps ✓</b>';
    } else {
      el.innerHTML = esc(hostname) + ' <span style="color:#71717a">(will extract from this page)</span>';
    }
  }catch{ el.textContent = 'unknown' }
}

// ─── BUILD SEARCH URL ───────────────────────────────────────

function buildSearchUrl(){
  const niche = ($('niche').value || '').trim();
  const city = ($('location').value || '').trim();
  const state = ($('state').value || '').trim();
  const country = ($('country').value || '').trim();

  const parts = [niche, city, state, country].filter(Boolean).join(' ');
  if(!parts) return null;

  return 'https://www.google.com/maps/search/' + encodeURIComponent(parts);
}

// ─── START HUNT ─────────────────────────────────────────────

async function startHunt(){
  const projectId = $('project').value;
  if(!projectId){ alert('Select a project first.'); return }
  await chrome.storage.local.set({ projectId });

  // Build search query
  const searchUrl = buildSearchUrl();
  if(!searchUrl){
    alert('Enter at least Niche or City/Location.\n\nExample:\nNiche: Dental\nCity: Miami\nState: Florida');
    return;
  }

  const btn = $('start');
  const stopBtn = $('stop');
  btn.disabled = true;
  stopBtn.style.display = 'inline-block';
  EXTRACTION_STATE = 'EXTRACTING';

  $('results').style.display = 'block';
  $('tbody').innerHTML = '';
  $('found').textContent = 'Found: …';
  $('emails').textContent = 'Emails: …';
  $('phones').textContent = 'Phones: …';
  $('socials').textContent = 'Socials: …';

  try{
    // Step 1: Open Google Maps search
    setState('Opening Google Maps search…');
    log('Search URL:', searchUrl);

    const searchTab = await chrome.tabs.create({ url: searchUrl, active: true });
    SEARCH_TAB_ID = searchTab.id;

    // Step 2: Wait for page to load
    setState('Waiting for results to load…');
    await new Promise(r => setTimeout(r, 5000)); // wait for Google Maps to render

    if(EXTRACTION_STATE !== 'EXTRACTING') return;

    // Step 3: Inject content script
    setState('Connecting to page…');
    const injected = await ensureContentScript(SEARCH_TAB_ID);
    if(!injected) throw new Error('Failed to inject content script. Reload and try again.');

    if(EXTRACTION_STATE !== 'EXTRACTING') return;

    // Step 4: Extract results (with waiting for dynamic content)
    setState('Extracting businesses…');
    const resp = await sendMessageToTab(SEARCH_TAB_ID, { type: 'EXTRACT_CURRENT_PAGE' });

    if(EXTRACTION_STATE !== 'EXTRACTING') return;

    if(!resp || !resp.success){
      throw new Error(resp?.error || 'Extraction failed');
    }

    // Step 5: Display results
    setState('Processing…');
    const businesses = resp.businesses || [];
    log('Extracted:', businesses.length, 'businesses');

    $('found').textContent = 'Found: ' + businesses.length;
    $('emails').textContent = 'Emails: ' + resp.stats.emails;
    $('phones').textContent = 'Phones: ' + resp.stats.phones;
    $('socials').textContent = 'Socials: ' + resp.stats.socials;

    if(businesses.length === 0){
      $('tbody').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:12px;color:#71717a">' +
        'No businesses found on this page.<br>Try different niche/location, or scroll down to load more results, then click START HUNT again.</td></tr>';
      setState('No results found', 'err');
      return;
    }

    // Render results table
    businesses.forEach((b, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td><input type="checkbox" checked data-idx="' + i + '"></td>' +
        '<td><b>' + esc(b.business_name) + '</b>' +
          (b.business_type ? '<br><small>' + esc(b.business_type) + '</small>' : '') +
          (b.rating ? ' <small>⭐' + esc(b.rating) + (b.reviews ? ' (' + esc(b.reviews) + ')' : '') + '</small>' : '') +
          (b.address ? '<br><small style="color:#71717a">' + esc(b.address) + '</small>' : '') +
          '</td>' +
        '<td>' + esc(b.email || '—') + '</td>' +
        '<td>' + esc(b.phone || '—') + '</td>' +
        '<td>' +
          (b.website ? '<a href="' + esc(b.website) + '" target="_blank" style="color:#1a73e8">Web</a> ' : '') +
          (b.facebook ? '<a href="' + esc(b.facebook) + '" target="_blank" style="color:#1877f2">FB</a> ' : '') +
          (b.instagram ? '<a href="' + esc(b.instagram) + '" target="_blank" style="color:#e4405f">IG</a> ' : '') +
          (!b.website && !b.facebook && !b.instagram ? '—' : '') +
          '</td>';
      tr.dataset.json = JSON.stringify(b);
      $('tbody').appendChild(tr);
    });

    setState('COMPLETED — ' + businesses.length + ' businesses found', 'ok');

  }catch(e){
    log('Hunt failed:', e.message);
    setState('ERROR: ' + e.message, 'err');
    $('found').textContent = 'Error';
  }finally{
    btn.disabled = false;
    stopBtn.style.display = 'none';
  }
}

// ─── STOP ───────────────────────────────────────────────────

function stopHunt(){
  EXTRACTION_STATE = 'IDLE';
  setState('Stopped');
  $('start').disabled = false;
  $('stop').style.display = 'none';
}

// ─── IMPORT SELECTED ────────────────────────────────────────

async function importSelected(){
  const projectId = $('project').value;
  if(!projectId) return alert('Select a project');

  const rows = Array.from(document.querySelectorAll('#tbody tr'))
    .filter(tr => tr.dataset.json && tr.querySelector('input')?.checked);
  if(!rows.length) return alert('Select at least one lead');

  const btn = $('import');
  btn.disabled = true;
  setState('Importing…');

  const leads = rows.map(tr => {
    const d = JSON.parse(tr.dataset.json);
    return {
      business_name: d.business_name,
      business_type: d.business_type || null,
      email: d.email || null,
      phone: d.phone || null,
      website: d.website || null,
      address: d.address || null,
      city: d.city || null,
      state: d.state || null,
      country: $('country').value || null,
      facebook: d.facebook || null,
      instagram: d.instagram || null,
      linkedin: d.linkedin || null,
      source: d.source || 'google-maps',
      source_url: d.source_url || null,
      niche: $('niche').value || null,
      contact_position: $('position').value || null,
    };
  });

  try{
    log('Importing', leads.length, 'leads');
    const { res, body } = await api('/api/extension/import', {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ leads, projectId })
    });
    if(res.ok && body.success){
      setState('Import Complete ✓', 'ok');
      $('newc').textContent = 'Imported: ' + body.data.imported;
      $('dup').textContent = 'Duplicates: ' + body.data.duplicates;
      alert('Import Complete ✓\n\nReceived: ' + body.data.received +
        '\nImported: ' + body.data.imported +
        '\nDuplicates: ' + body.data.duplicates +
        '\nFailed: ' + body.data.failed);
    } else {
      setState('Import Failed ✕', 'err');
      alert('Import Failed ✕\n\n' + (body.error || 'unknown'));
    }
  }catch(e){
    setState('Import Failed ✕', 'err');
    alert('Import Failed ✕\n\nAPI unavailable.\n' + e.message);
  }
  btn.disabled = false;
}

// ─── Copy Debug Info ────────────────────────────────────────

async function copyDebugInfo(){
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const manifest = chrome.runtime.getManifest();
  const session = await chrome.storage.local.get('session');
  const info = [
    'Client Hunter Debug v' + manifest.version,
    'URL: ' + (tab?.url || 'N/A'),
    'Title: ' + (tab?.title || 'N/A'),
    'Session: ' + (session.session ? 'Set' : 'Not set'),
    'Time: ' + new Date().toISOString(),
  ].join('\n');
  await navigator.clipboard.writeText(info);
  alert('Debug info copied');
}

// ─── Event Listeners ────────────────────────────────────────

$('testConn').onclick = e => { e.preventDefault(); testConnection() };
$('testPage').onclick = e => { e.preventDefault(); testCurrentPage() };
$('copyDebug').onclick = e => { e.preventDefault(); copyDebugInfo() };

$('toggleCfg').onclick = async e => {
  e.preventDefault();
  const box = $('cfgBox');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
  $('crmUrl').value = await getCrmUrl();
};
$('saveCfg').onclick = async () => {
  const v = $('crmUrl').value.trim();
  if(!/^https?:\/\//.test(v)) return alert('Enter a valid URL');
  await setCrmUrl(v);
  $('cfgBox').style.display = 'none';
  await testConnection(); await loadProjects();
};

$('reconnect').onclick = async () => {
  const btn = $('reconnect'); btn.disabled = true; setState('CONNECTING');
  try{
    const { res, body } = await api('/api/extension/session', { method: 'POST', credentials: 'include' });
    if(res.ok && body.success){
      await chrome.storage.local.set({ session: body.data.token });
      $('extStatus').textContent = 'Connected ✓';
      setState('READY', 'ok');
      await testConnection(); await loadProjects();
    } else {
      setState('ERROR', 'err');
      const base = await getCrmUrl();
      alert('Connect failed.\n\n' + (body.error||'') + '\n\nOpen ' + base + ' and log in first.');
      chrome.tabs.create({ url: base + '/login' });
    }
  }catch(e){ setState('ERROR', 'err'); alert('Failed: ' + e.message) }
  btn.disabled = false;
};

$('disconnect').onclick = async () => {
  await chrome.storage.local.remove('session');
  $('extStatus').textContent = 'Not connected';
  setState('IDLE'); await testConnection();
};

$('start').onclick = startHunt;
$('stop').onclick = stopHunt;
$('selectAll').onclick = () => document.querySelectorAll('#tbody input[type=checkbox]').forEach(c => c.checked = true);
$('deselectAll').onclick = () => document.querySelectorAll('#tbody input[type=checkbox]').forEach(c => c.checked = false);
$('import').onclick = importSelected;

// ─── Init ───────────────────────────────────────────────────

(async () => {
  try{ $('ver').textContent = chrome.runtime.getManifest().version }catch{}
  const s = await chrome.storage.local.get('session');
  $('extStatus').textContent = s.session ? 'Connected ✓' : 'Not connected';
  $('stop').style.display = 'none';
  $('testResult').style.display = 'none';
  await testConnection();
  await loadProjects();
  await detectCurrentSource();
  setState('READY');
})();
