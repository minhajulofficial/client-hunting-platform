const API = 'https://client-hunting-platform.vercel.app';
const LOCAL_API = 'http://localhost:3000';
function getApi(){ return location.hostname==='localhost' ? LOCAL_API : API }
document.getElementById('start').onclick = async () => {
  const r = document.getElementById('results'); r.style.display='block';
  const tbody = document.getElementById('tbody'); tbody.innerHTML='';
  let extracted=[]
  try{
    const [tab]=await chrome.tabs.query({active:true, currentWindow:true})
    try{ const resp=await chrome.tabs.sendMessage(tab.id, {type:'EXTRACT_WEBSITE'}); if(resp && resp.businessName) extracted=[resp] }catch{}
  }catch{}
  const demo = extracted.length ? extracted.map(e=>({business:e.businessName, email:e.email||'—', phone:e.phone||'', website:e.website||'', source:e.source})) : [
    {business:'ABC Dental', email:'info@abcdental.com', phone:'+1 305 123 4567', website:'https://abcdental.com', source:'website'},
    {business:'Bright Smile', email:'contact@brightsmile.com', phone:'+1 305 987 6543', website:'https://brightsmile.com', source:'google-maps'},
  ];
  demo.forEach(d=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><input type="checkbox" checked></td><td>${d.business}</td><td>${d.email}</td><td>${d.source}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('conn').textContent='✓ found '+demo.length;
};
document.getElementById('selectAll').onclick=()=> document.querySelectorAll('#tbody input').forEach(c=>c.checked=true);
document.getElementById('import').onclick= async ()=>{
  const api=getApi()
  const leads = Array.from(document.querySelectorAll('#tbody tr')).filter(tr=>tr.querySelector('input').checked).map(tr=>{
    const tds=tr.querySelectorAll('td'); return { business_name: tds[1].textContent, email: tds[2].textContent==='—'?'':tds[2].textContent, source: tds[3].textContent, city: document.getElementById('location').value, country: document.getElementById('country').value, niche: document.getElementById('niche').value };
  });
  const storage=await chrome.storage.local.get('session')
  const token=storage.session || ''
  const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']='Bearer '+token
  try{
    const res = await fetch(api+'/api/extension/import', {method:'POST', headers, body: JSON.stringify({ leads, projectId: null })});
    const j=await res.json(); alert(j.success ? `Imported ${j.data.inserted} (duplicates ${j.data.duplicates})` : 'Error: '+(j.error||JSON.stringify(j)))
  }catch(e){ alert('Import failed - is CRM logged in? '+e.message + ' Try Reconnect') }
};
document.getElementById('reconnect').onclick= async (e)=>{
  e.preventDefault()
  const api=getApi()
  try{
    const res=await fetch(api+'/api/extension/session',{method:'POST', credentials:'include'})
    const j=await res.json()
    if(j.success){ await chrome.storage.local.set({session:j.data.token}); document.getElementById('conn').textContent='✓ connected'; alert('Connected!') }
    else alert('Login to CRM first at '+api+' : '+(j.error||''))
  }catch(err){ alert('Reconnect failed: '+err.message) }
};
(async()=>{
  try{ const s=await chrome.storage.local.get('session'); document.getElementById('conn').textContent=s.session?'✓ connected':'not connected - click Reconnect'; }catch{ document.getElementById('conn').textContent='not connected'; }
})();
