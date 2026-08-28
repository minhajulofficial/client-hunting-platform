// Client Hunter - Popup v1.0.0
// Real extraction only. No mock data. No fake results.

const $ = id => document.getElementById(id);
const LOG_PREFIX = '[Extension]';
function log(...args){ console.log(LOG_PREFIX, ...args) }

let EXTRACTION_STATE = 'IDLE'; // IDLE, EXTRACTING, COMPLETED, ERROR
let LAST_EXTRACTION = null;

// ─── Utilities ──────────────────────────────────────────────

function setState(text, kind){
  const el = $('stateEl');
  el.textContent = text;
  el.className = 'state' + (kind === 'err' ? ' err' : kind === 'ok' ? ' okb' : '');
}

function setDiagnostic(key, value){
  const el = $(key);
  if(el) el.textContent = value;
}

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
      if(chrome.runtime.lastError){
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

async function ensureContentScript(tabId){
  try{
    // Try sending a ping first
    const resp = await sendMessageToTab(tabId, { type: 'PING' });
    if(resp && resp.alive) return true;
  }catch{}

  // Not injected yet - inject it
  try{
    await new Promise((resolve, reject) => {
      chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }, results => {
        if(chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(results);
      });
    });
    // Wait a moment for script to initialize
    await new Promise(r => setTimeout(r, 200));
    return true;
  }catch(e){
    log('Failed to inject content script:', e.message);
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
    if(!res.ok){
      setDiagnostic('api', 'Failed ✕');
      setState('ERROR', 'err');
      return false;
    }
    setDiagnostic('api', 'Connected ✓');
    setDiagnostic('db', body.data.database.connected ? 'Connected ✓' : 'Error ✕');
    setDiagnostic('auth', body.data.authentication.session_valid ? 'Valid ✓' : 'No token');
    return true;
  }catch(e){
    setDiagnostic('api', 'Failed ✕');
    setDiagnostic('db', '-');
    setDiagnostic('auth', '-');
    setState('ERROR', 'err');
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
      sel.innerHTML = '<option value="">' + (res.status === 401 ? 'Connect to CRM first' : (body.error || 'Failed to load')) + '</option>';
      return;
    }
    const list = body.data || [];
    if(list.length === 0){
      sel.innerHTML = '<option value="">No projects — create one in the CRM</option>';
      return;
    }
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

// ─── Source Detection ───────────────────────────────────────

async function detectCurrentSource(){
  const el = $('siteSup');
  try{
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if(!tab || !tab.url || !/^https?:/.test(tab.url)){
      el.textContent = 'Not a web page';
      el.style.color = '#b91c1c';
      return null;
    }

    const injected = await ensureContentScript(tab.id);
    if(!injected){
      el.textContent = 'Content script failed to inject';
      el.style.color = '#b91c1c';
      return null;
    }

    const resp = await sendMessageToTab(tab.id, { type: 'DETECT_SOURCE' });
    if(resp && resp.source){
      const src = resp.source;
      el.textContent = src.name + (src.supported ? ' ✓' : ' — Not supported');
      el.style.color = src.supported ? '#15803d' : '#b91c1c';
      log('Source detected:', src);
      return src;
    }
    el.textContent = 'Detection failed';
    el.style.color = '#b91c1c';
    return null;
  }catch(e){
    el.textContent = 'Error: ' + e.message;
    el.style.color = '#b91c1c';
    return null;
  }
}

// ─── Test Current Page ──────────────────────────────────────

async function testCurrentPage(){
  const el = $('testResult');
  el.style.display = 'block';
  el.innerHTML = '<span style="color:#71717a">Testing…</span>';

  try{
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if(!tab || !tab.url || !/^https?:/.test(tab.url)){
      el.innerHTML = '<span style="color:#b91c1c">Not a web page. Open a website first.</span>';
      return;
    }

    const injected = await ensureContentScript(tab.id);
    if(!injected){
      el.innerHTML = '<span style="color:#b91c1c">Content Script: FAILED ✕<br>Reason: Could not inject content script. Reload the page and try again.</span>';
      return;
    }

    const resp = await sendMessageToTab(tab.id, { type: 'TEST_CONNECTION' });
    if(resp && resp.connected){
      el.innerHTML = '<span style="color:#15803d">Content Script: CONNECTED ✓</span><br>' +
        'URL: ' + esc(resp.url) + '<br>' +
        'Title: ' + esc(resp.title) + '<br>' +
        'DOM Access: ✓<br>' +
        'Version: ' + esc(resp.contentScriptVersion);
      log('Connection test passed:', resp);
    } else {
      el.innerHTML = '<span style="color:#b91c1c">Content Script: FAILED ✕<br>Reason: No response from content script</span>';
    }
  }catch(e){
    el.innerHTML = '<span style="color:#b91c1c">Content Script: FAILED ✕<br>Reason: ' + esc(e.message) + '</span>';
    log('Connection test failed:', e.message);
  }
}

// ─── Start Hunt (Real Extraction) ───────────────────────────

async function startHunt(){
  const projectId = $('project').value;
  if(!projectId){
    alert('Select a project first. Create one in the CRM → Projects.');
    return;
  }
  await chrome.storage.local.set({ projectId });

  const btn = $('start');
  const stopBtn = $('stop');
  btn.disabled = true;
  stopBtn.style.display = 'inline-block';
  EXTRACTION_STATE = 'EXTRACTING';

  $('results').style.display = 'block';
  const tbody = $('tbody');
  tbody.innerHTML = '';
  $('found').textContent = 'Found: …';
  $('emails').textContent = 'Emails: …';
  $('phones').textContent = 'Phones: …';
  $('socials').textContent = 'Socials: …';

  try{
    setState('Detecting source…');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if(!tab || !tab.url || !/^https?:/.test(tab.url || '')){
      throw new Error('Open a business website tab first');
    }

    setState('Connecting to page…');
    const injected = await ensureContentScript(tab.id);
    if(!injected){
      throw new Error('Cannot inject content script. Reload the page and try again.');
    }

    if(EXTRACTION_STATE !== 'EXTRACTING') return; // stopped

    setState('Extracting data…');
    const resp = await sendMessageToTab(tab.id, { type: 'EXTRACT_CURRENT_PAGE' });

    if(EXTRACTION_STATE !== 'EXTRACTING') return; // stopped

    if(!resp || !resp.success){
      throw new Error(resp?.error || 'Extraction failed - no response from content script');
    }

    setState('Processing results…');
    log('Extraction result:', resp);

    const businesses = resp.businesses || [];
    LAST_EXTRACTION = { ...resp.stats, url: resp.url, timestamp: Date.now() };

    $('found').textContent = 'Found: ' + businesses.length;
    $('emails').textContent = 'Emails: ' + resp.stats.emails;
    $('phones').textContent = 'Phones: ' + resp.stats.phones;
    $('socials').textContent = 'Socials: ' + resp.stats.socials;

    if(businesses.length === 0){
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:12px;color:#71717a">' +
        'No public business data found on this page.<br>' +
        'Open a business website, directory listing, or contact page.</td></tr>';
      setState('COMPLETED', 'ok');
      return;
    }

    // Render results
    businesses.forEach((b, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td><input type="checkbox" checked data-idx="' + i + '"></td>' +
        '<td><b>' + esc(b.business_name) + '</b>' +
          (b.business_type ? '<br><small style="color:#71717a">' + esc(b.business_type) + '</small>' : '') +
          (b.address ? '<br><small style="color:#71717a">' + esc(b.address) + '</small>' : '') +
          '</td>' +
        '<td>' + esc(b.email || '—') +
          (b.all_emails && b.all_emails.length > 1 ? '<br><small style="color:#71717a">+' + (b.all_emails.length - 1) + ' more</small>' : '') +
          '</td>' +
        '<td>' + esc(b.phone || '—') +
          (b.all_phones && b.all_phones.length > 1 ? '<br><small style="color:#71717a">+' + (b.all_phones.length - 1) + ' more</small>' : '') +
          '</td>' +
        '<td>' +
          (b.facebook ? '<a href="' + esc(b.facebook) + '" target="_blank" style="color:#1877f2">FB</a> ' : '') +
          (b.instagram ? '<a href="' + esc(b.instagram) + '" target="_blank" style="color:#e4405f">IG</a> ' : '') +
          (b.linkedin ? '<a href="' + esc(b.linkedin) + '" target="_blank" style="color:#0a66c2">LI</a> ' : '') +
          (!b.facebook && !b.instagram && !b.linkedin ? '—' : '') +
          '</td>';
      tr.dataset.json = JSON.stringify(b);
      tbody.appendChild(tr);
    });

    setState('COMPLETED', 'ok');
    log('Extraction complete:', businesses.length, 'businesses');

  }catch(e){
    log('Extraction failed:', e.message);
    setState('ERROR', 'err');
    $('found').textContent = 'Error';
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:12px;color:#b91c1c">' +
      'Extraction failed.<br><br>Reason: ' + esc(e.message) +
      '<br><br><button onclick="startHunt()" style="margin-top:8px;padding:4px 12px;background:#18181b;color:#fff;border:none;border-radius:4px;cursor:pointer">Retry</button>' +
      '</td></tr>';
  }finally{
    btn.disabled = false;
    stopBtn.style.display = 'none';
  }
}

// ─── Stop ───────────────────────────────────────────────────

function stopHunt(){
  EXTRACTION_STATE = 'IDLE';
  setState('Stopped');
  $('start').disabled = false;
  $('stop').style.display = 'none';
}

// ─── Import Selected ────────────────────────────────────────

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
      email: d.email || null,
      phone: d.phone || null,
      website: d.website || null,
      address: d.address || null,
      city: d.city || null,
      state: d.state || null,
      country: d.country || null,
      postal_code: d.postal_code || null,
      facebook: d.facebook || null,
      instagram: d.instagram || null,
      linkedin: d.linkedin || null,
      twitter: d.twitter || null,
      source: d.source || 'website',
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
      log('Import result:', body.data);
      alert(
        'Import Complete ✓\n\n' +
        'Received: ' + body.data.received + '\n' +
        'Imported: ' + body.data.imported + '\n' +
        'Duplicates: ' + body.data.duplicates + '\n' +
        'Failed: ' + body.data.failed
      );
    } else {
      setState('Import Failed ✕', 'err');
      alert('Import Failed ✕\n\nReason: ' + (body.error || 'unknown') +
        (res.status === 401 ? '\n\nPress "Connect to CRM" first.' : ''));
    }
  }catch(e){
    setState('Import Failed ✕', 'err');
    alert('Import Failed ✕\n\nAPI is unavailable.\nReason: ' + e.message + '\n\n[Retry]');
    log('Import failed:', e.message);
  }
  btn.disabled = false;
}

// ─── Copy Debug Info ────────────────────────────────────────

async function copyDebugInfo(){
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const manifest = chrome.runtime.getManifest();
  const session = await chrome.storage.local.get('session');

  const info = [
    'Client Hunter Debug Info',
    '========================',
    'Version: ' + manifest.version,
    'URL: ' + (tab?.url || 'N/A'),
    'Title: ' + (tab?.title || 'N/A'),
    'Session: ' + (session.session ? 'Set' : 'Not set'),
    'Last extraction: ' + (LAST_EXTRACTION ? JSON.stringify(LAST_EXTRACTION) : 'None'),
    'Timestamp: ' + new Date().toISOString(),
  ].join('\n');

  await navigator.clipboard.writeText(info);
  alert('Debug info copied to clipboard');
}

// ─── CRM URL Config ─────────────────────────────────────────

$('toggleCfg').onclick = async e => {
  e.preventDefault();
  const box = $('cfgBox');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
  $('crmUrl').value = await getCrmUrl();
};

$('saveCfg').onclick = async () => {
  const v = $('crmUrl').value.trim();
  if(!/^https?:\/\//.test(v)) return alert('Enter a full URL starting with http:// or https://');
  await setCrmUrl(v);
  $('cfgBox').style.display = 'none';
  await testConnection();
  await loadProjects();
};

// ─── Event Listeners ────────────────────────────────────────

$('testConn').onclick = e => { e.preventDefault(); testConnection() };
$('testPage').onclick = e => { e.preventDefault(); testCurrentPage() };
$('copyDebug').onclick = e => { e.preventDefault(); copyDebugInfo() };

$('reconnect').onclick = async () => {
  const btn = $('reconnect');
  btn.disabled = true;
  setState('CONNECTING');
  try{
    const { res, body } = await api('/api/extension/session', { method: 'POST', credentials: 'include' });
    if(res.ok && body.success){
      await chrome.storage.local.set({ session: body.data.token });
      $('extStatus').textContent = 'Connected ✓';
      setState('READY', 'ok');
      await testConnection();
      await loadProjects();
    } else {
      setState('ERROR', 'err');
      const base = await getCrmUrl();
      alert('Could not connect.\n\n' + (body.error || '') + '\n\nOpen ' + base + ' and log in with Google, then press Connect again.');
      chrome.tabs.create({ url: base + '/login' });
    }
  }catch(e){
    setState('ERROR', 'err');
    alert('Connect failed: ' + e.message);
  }
  btn.disabled = false;
};

$('disconnect').onclick = async () => {
  await chrome.storage.local.remove('session');
  $('extStatus').textContent = 'Not connected';
  setState('IDLE');
  await testConnection();
};

$('start').onclick = startHunt;
$('stop').onclick = stopHunt;
$('selectAll').onclick = () => document.querySelectorAll('#tbody input[type=checkbox]').forEach(c => c.checked = true);
$('deselectAll').onclick = () => document.querySelectorAll('#tbody input[type=checkbox]').forEach(c => c.checked = false);
$('import').onclick = importSelected;

// ─── Initialize ─────────────────────────────────────────────

(async () => {
  try{ $('ver').textContent = chrome.runtime.getManifest().version }catch{}
  const s = await chrome.storage.local.get('session');
  $('extStatus').textContent = s.session ? 'Connected ✓' : 'Not connected — press Connect to CRM';
  $('stop').style.display = 'none';
  $('testResult').style.display = 'none';
  await testConnection();
  await loadProjects();
  await detectCurrentSource();
  setState('IDLE');
})();
