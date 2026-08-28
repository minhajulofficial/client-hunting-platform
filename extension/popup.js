const API='https://client-hunting-platform.vercel.app';
const LOCAL='http://localhost:3000';
function getApi(){ try{ return (typeof chrome!=='undefined' && location && location.hostname==='localhost') ? LOCAL : API }catch{ return API } }
const $=id=>document.getElementById(id);
const stateEl=$('stateEl');
function setState(s){ stateEl.textContent=s }
async function testConnection(){
  const api=getApi();
  $('api').textContent='checking...'; $('auth').textContent='checking...'; $('db').textContent='checking...';
  try{
    const storage=await chrome.storage.local.get('session');
    const headers={}; if(storage.session) headers['Authorization']='Bearer '+storage.session;
    const res=await fetch(api+'/api/extension/health',{headers});
    const j=await res.json();
    $('api').textContent=j.data?.api ? 'Connected ✓' : 'Failed ✕';
    $('db').textContent=j.data?.database?.connected ? 'Connected ✓' : j.data?.database?.supabase_configured ? 'Error ✕' : 'NOT CONFIGURED ✕';
    $('auth').textContent=j.data?.authentication?.session_valid ? 'Valid ✓' : (storage.session ? 'Token present' : 'No token');
    if(!res.ok) $('api').textContent='Failed ✕ '+ (j.error||'');
  }catch(e){ $('api').textContent='Failed ✕'; $('db').textContent='Error'; $('auth').textContent=e.message }
}
async function loadProjects(){
  const api=getApi();
  try{
    const r=await fetch(api+'/api/projects'); const j=await r.json();
    const sel=$('project'); sel.innerHTML='<option value="">Select Project</option>';
    (j.data||[]).forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.name; sel.appendChild(o)})
    if(!j.data || j.data.length===0){ const o=document.createElement('option'); o.textContent='No projects — create in CRM first'; o.disabled=true; sel.appendChild(o)}
  }catch{}
}
async function checkSiteSupport(){
  try{
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    const url=tab?.url||'';
    const supported = /google\.(com|co\.uk)|business|directory|yelp|yellowpages/i.test(url) || url.startsWith('http');
    // Website source always supported for public data where permitted
    $('siteSup').textContent = url ? (supported ? 'Supported ✓ ('+new URL(url).hostname+')' : 'Not supported yet ('+new URL(url).hostname+')') : 'No tab';
  }catch{ $('siteSup').textContent='checking...' }
}
$('testConn').onclick=(e)=>{ e.preventDefault(); testConnection() };
$('reconnect').onclick=async(e)=>{
  e.preventDefault(); setState('CONNECTING');
  const api=getApi();
  try{
    const res=await fetch(api+'/api/extension/session',{method:'POST', credentials:'include'});
    const j=await res.json();
    if(j.success){ await chrome.storage.local.set({session:j.data.token}); $('extStatus').textContent='Connected ✓'; setState('READY'); await testConnection(); alert('Connected!'); }
    else { setState('ERROR'); alert('Login to CRM first at '+api+'\n'+(j.error||'')) }
  }catch(err){ setState('ERROR'); alert('Reconnect failed: '+err.message) }
};
$('start').onclick=async()=>{
  const project=$('project').value;
  if(!project){ alert('Select a project first (create in CRM → Projects)'); return }
  setState('SEARCHING'); $('results').style.display='block'; const tbody=$('tbody'); tbody.innerHTML='';
  $('found').textContent='Found: ...'; $('usable').textContent='Usable: ...';
  try{
    setState('COLLECTING');
    let extracted=[];
    try{
      const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
      const resp=await chrome.tabs.sendMessage(tab.id,{type:'EXTRACT_WEBSITE'});
      if(resp && resp.businessName) extracted=[{business:resp.businessName, email:resp.email||'', phone:resp.phone||'', website:resp.website||'', facebook:resp.facebook||'', instagram:resp.instagram||'', linkedin:resp.linkedin||'', source:'website', sourceUrl: resp.sourceUrl}]
    }catch{}
    setState('PROCESSING');
    if(extracted.length===0){
      $('found').textContent='Found: 0'; $('usable').textContent='Usable: 0'; $('newc').textContent='New: 0'; $('dup').textContent='Duplicates: 0';
      tbody.innerHTML='<tr><td colspan=4 style="text-align:center;padding:12px;color:#71717a">No data found on this page. Try a business directory or website with public contact info. No mock data.</td></tr>';
      setState('READY'); return;
    }
    setState('VALIDATING');
    // Normalize + validate client-side (syntax only), server will re-validate
    const usable=extracted.filter(e=>e.business && e.business.length>=2);
    setState('DEDUPLICATING');
    // Ask backend for dedup preview via import dry-run? For now show counts, server will dedup on import
    $('found').textContent='Found: '+extracted.length;
    $('usable').textContent='Usable: '+usable.length;
    $('newc').textContent='New: ? (check on import)';
    $('dup').textContent='Duplicates: ? (check on import)';
    usable.forEach(d=>{
      const tr=document.createElement('tr');
      const safe = s=> (s||'').replace(/</g,'&lt;');
      tr.innerHTML=`<td><input type="checkbox" checked></td><td>${safe(d.business)}</td><td>${safe(d.email||'—')}</td><td>${safe(d.source)}</td>`;
      // store full data on row
      tr.dataset.json=JSON.stringify(d);
      tbody.appendChild(tr);
    });
    setState('READY');
  }catch(e){ setState('ERROR'); alert('Search failed: '+e.message) }
};
$('selectAll').onclick=()=> document.querySelectorAll('#tbody input').forEach(c=>c.checked=true);
$('deselectAll').onclick=()=> document.querySelectorAll('#tbody input').forEach(c=>c.checked=false);
$('import').onclick=async()=>{
  const api=getApi();
  const project=$('project').value;
  if(!project) return alert('Select project');
  const rows=Array.from(document.querySelectorAll('#tbody tr')).filter(tr=>tr.querySelector('input')?.checked && tr.dataset.json);
  if(!rows.length) return alert('Select leads to import');
  const leads=rows.map(tr=>{ const d=JSON.parse(tr.dataset.json); return { business_name: d.business, email: d.email, phone: d.phone, website: d.website, facebook: d.facebook, instagram: d.instagram, linkedin: d.linkedin, source: d.source, source_url: d.sourceUrl, city: $('location').value, state: $('state').value, country: $('country').value, niche: $('niche').value, contact_position: $('position').value }});
  setState('IMPORTING');
  const storage=await chrome.storage.local.get('session');
  const token=storage.session||'';
  const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']='Bearer '+token;
  try{
    const res=await fetch(api+'/api/extension/import',{method:'POST', headers, body: JSON.stringify({ leads, projectId: project })});
    const j=await res.json();
    if(j.success){
      setState('COMPLETED');
      $('newc').textContent='New: '+j.data.inserted;
      $('dup').textContent='Duplicates: '+j.data.duplicates;
      alert(`Import Complete ✓\nReceived: ${j.data.total}\nImported: ${j.data.inserted}\nDuplicates: ${j.data.duplicates}`);
    } else { setState('ERROR'); alert('Import Failed ✕\n'+(j.error||JSON.stringify(j))) }
  }catch(e){ setState('ERROR'); alert('Import Failed ✕\n'+e.message) }
};
(async()=>{
  await testConnection();
  await loadProjects();
  await checkSiteSupport();
  try{ const s=await chrome.storage.local.get('session'); $('extStatus').textContent=s.session?'Connected ✓':'Not connected — click Connect to CRM'; }catch{ $('extStatus').textContent='Not connected'; }
  setState('IDLE');
})();
