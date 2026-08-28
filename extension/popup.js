const $ = id => document.getElementById(id);
let LAST = { req: '-', err: 'none' };

function setState(s, kind){
  const el = $('stateEl');
  el.textContent = s;
  el.className = 'state' + (kind === 'err' ? ' err' : kind === 'ok' ? ' okb' : '');
}
function diag(){ $('lastReq').textContent = LAST.req; $('lastErr').textContent = LAST.err; }
function showErr(msg){ LAST.err = msg; diag(); setState('ERROR', 'err'); }

async function authHeaders(extra){
  const s = await chrome.storage.local.get('session');
  const h = Object.assign({}, extra || {});
  if(s.session) h['Authorization'] = 'Bearer ' + s.session;
  return h;
}

async function api(path, options){
  const base = await getCrmUrl();
  const url = base + path;
  LAST.req = (options && options.method || 'GET') + ' ' + path;
  diag();
  const res = await fetch(url, options);
  let body = null;
  try{ body = await res.json() }catch{ body = { success:false, error:'Non-JSON response (HTTP '+res.status+') from '+url } }
  if(!res.ok && !body.error) body.error = 'HTTP ' + res.status;
  return { res, body };
}

async function testConnection(){
  $('api').textContent = 'checking…'; $('db').textContent = 'checking…'; $('auth').textContent = 'checking…';
  try{
    const { res, body } = await api('/api/extension/health', { headers: await authHeaders() });
    if(!res.ok){ $('api').textContent = 'Failed ✕'; showErr(body.error || 'health failed'); return false }
    $('api').textContent = 'Connected ✓';
    $('db').textContent = body.data.database.connected ? 'Connected ✓' : (body.data.database.supabase_configured ? 'Error ✕' : 'NOT CONFIGURED ✕');
    $('auth').textContent = body.data.authentication.session_valid ? 'Valid ✓' : (body.data.authentication.has_token ? 'Token set' : 'No token');
    LAST.err = 'none'; diag();
    return true;
  }catch(e){
    $('api').textContent = 'Failed ✕'; $('db').textContent = '-'; $('auth').textContent = '-';
    showErr(e.message + ' (check CRM URL)');
    return false;
  }
}

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
    list.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.name + (p.country ? ' · ' + p.country : ''); sel.appendChild(o); });
    const saved = (await chrome.storage.local.get('projectId')).projectId;
    if(saved) sel.value = saved;
  }catch(e){ sel.innerHTML = '<option value="">Error: ' + e.message + '</option>' }
}

async function checkSite(){
  try{
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    if(!tab || !tab.url || !/^https?:/.test(tab.url)){ $('siteSup').textContent = 'Not supported (open a business website)'; return }
    $('siteSup').textContent = 'Supported ✓ (' + new URL(tab.url).hostname + ')';
  }catch{ $('siteSup').textContent = 'unknown' }
}

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
  await testConnection(); await loadProjects();
};
$('testConn').onclick = e => { e.preventDefault(); testConnection() };

$('reconnect').onclick = async () => {
  const btn = $('reconnect'); btn.disabled = true; setState('CONNECTING');
  try{
    const { res, body } = await api('/api/extension/session', { method:'POST', credentials:'include' });
    if(res.ok && body.success){
      await chrome.storage.local.set({ session: body.data.token });
      $('extStatus').textContent = 'Connected ✓';
      setState('READY', 'ok');
      await testConnection(); await loadProjects();
    }else{
      showErr(body.error || 'connect failed');
      const base = await getCrmUrl();
      alert('Could not connect.\n\n' + (body.error || '') + '\n\nOpen ' + base + ' and log in with Google in this same browser, then press Connect again.');
      chrome.tabs.create({ url: base + '/login' });
    }
  }catch(e){ showErr(e.message); alert('Connect failed: ' + e.message) }
  btn.disabled = false;
};

$('disconnect').onclick = async () => {
  await chrome.storage.local.remove('session');
  $('extStatus').textContent = 'Not connected';
  setState('IDLE');
  await testConnection();
};

$('start').onclick = async () => {
  const projectId = $('project').value;
  if(!projectId){ alert('Select a project first. Create one in the CRM → Projects.'); return }
  await chrome.storage.local.set({ projectId });

  const btn = $('start'); btn.disabled = true;
  $('results').style.display = 'block';
  const tbody = $('tbody'); tbody.innerHTML = '';
  $('found').textContent = 'Found: …'; $('usable').textContent = 'Usable: …'; $('newc').textContent = 'New: —'; $('dup').textContent = 'Duplicates: —';

  try{
    setState('SEARCHING');
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    if(!tab || !/^https?:/.test(tab.url || '')) throw new Error('Open a business website tab first');

    setState('COLLECTING');
    let raw = null;
    try{
      raw = await chrome.tabs.sendMessage(tab.id, { type:'EXTRACT_WEBSITE' });
    }catch{
      // content script not injected yet (e.g. installed after page load) - inject then retry
      try{
        await chrome.scripting.executeScript({ target:{ tabId: tab.id }, files:['content.js'] });
        raw = await chrome.tabs.sendMessage(tab.id, { type:'EXTRACT_WEBSITE' });
      }catch(e2){ throw new Error('Cannot read this page (' + e2.message + '). Reload the page and try again.') }
    }

    setState('PROCESSING');
    const items = (raw && raw.businessName) ? [raw] : [];
    $('found').textContent = 'Found: ' + items.length;

    setState('VALIDATING');
    const usable = items.filter(i => i.businessName && i.businessName.trim().length >= 2);
    $('usable').textContent = 'Usable: ' + usable.length;

    if(usable.length === 0){
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:12px;color:#71717a">No public business data found on this page. Open a business website or contact page. (No sample data is shown.)</td></tr>';
      setState('READY');
      btn.disabled = false;
      return;
    }

    const esc = s => String(s || '').replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
    usable.forEach(d => {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td><input type="checkbox" checked></td><td>' + esc(d.businessName) + '</td><td>' + esc(d.email || '—') + '</td><td>' + esc(d.source) + '</td>';
      tr.dataset.json = JSON.stringify(d);
      tbody.appendChild(tr);
    });
    setState('READY', 'ok');
  }catch(e){ showErr(e.message); alert('Search failed.\n\nReason: ' + e.message) }
  btn.disabled = false;
};

$('selectAll').onclick = () => document.querySelectorAll('#tbody input').forEach(c => c.checked = true);
$('deselectAll').onclick = () => document.querySelectorAll('#tbody input').forEach(c => c.checked = false);

$('import').onclick = async () => {
  const projectId = $('project').value;
  if(!projectId) return alert('Select a project');
  const rows = Array.from(document.querySelectorAll('#tbody tr')).filter(tr => tr.dataset.json && tr.querySelector('input') && tr.querySelector('input').checked);
  if(!rows.length) return alert('Select at least one lead');

  const btn = $('import'); btn.disabled = true;
  setState('IMPORTING');
  const leads = rows.map(tr => {
    const d = JSON.parse(tr.dataset.json);
    return {
      business_name: d.businessName,
      email: d.email || null,
      phone: d.phone || null,
      website: d.website || null,
      address: d.address || null,
      facebook: d.facebook || null,
      instagram: d.instagram || null,
      linkedin: d.linkedin || null,
      source: d.source || 'website',
      source_url: d.sourceUrl || null,
      city: $('location').value || null,
      state: $('state').value || null,
      country: $('country').value || null,
      niche: $('niche').value || null,
      contact_position: $('position').value || null
    };
  });

  try{
    const { res, body } = await api('/api/extension/import', {
      method:'POST',
      headers: await authHeaders({ 'Content-Type':'application/json' }),
      body: JSON.stringify({ leads, projectId })
    });
    if(res.ok && body.success){
      setState('COMPLETED', 'ok');
      $('newc').textContent = 'New: ' + body.data.imported;
      $('dup').textContent = 'Duplicates: ' + body.data.duplicates;
      alert('Import Complete ✓\n\nReceived: ' + body.data.received + '\nImported: ' + body.data.imported + '\nDuplicates: ' + body.data.duplicates + '\nPossible duplicates: ' + (body.data.possible_duplicates || 0) + '\nFailed: ' + body.data.failed);
    }else{
      showErr(body.error || 'import failed');
      alert('Import Failed ✕\n\nReason: ' + (body.error || 'unknown') + (res.status === 401 ? '\n\nPress "Connect to CRM" first.' : ''));
    }
  }catch(e){ showErr(e.message); alert('Import Failed ✕\n\nReason: ' + e.message) }
  btn.disabled = false;
};

(async () => {
  try{ $('ver').textContent = chrome.runtime.getManifest().version }catch{}
  diag();
  const s = await chrome.storage.local.get('session');
  $('extStatus').textContent = s.session ? 'Connected ✓' : 'Not connected — press Connect to CRM';
  await testConnection();
  await loadProjects();
  await checkSite();
  setState('IDLE');
})();
