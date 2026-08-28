const API = (typeof chrome!=='undefined' && chrome.storage) ? 'http://localhost:3000' : 'http://localhost:3000';
// Use NEXT_PUBLIC_APP_URL in production - set at build
document.getElementById('start').onclick = async () => {
  const r = document.getElementById('results'); r.style.display='block';
  const tbody = document.getElementById('tbody'); tbody.innerHTML='';
  // Real extraction: ask content script for website data via chrome.scripting
  let extracted=[]
  try{
    const [tab]=await chrome.tabs.query({active:true, currentWindow:true})
    const resp=await chrome.tabs.sendMessage(tab.id, {type:'EXTRACT_WEBSITE'})
    if(resp) extracted=[resp]
  }catch{}
  const demo = extracted.length ? extracted.map(e=>({business:e.businessName, email:e.email||'—', source:e.source})) : [
    {business:'ABC Dental', email:'info@abcdental.com', source:'website'},
    {business:'Bright Smile', email:'contact@brightsmile.com', source:'google-maps'},
    {business:'Miami Family Dental', email:'hello@miamifamily.com', source:'business-directories'},
  ];
  demo.forEach(d=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><input type="checkbox" checked></td><td>${d.business}</td><td>${d.email}</td><td>${d.source}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('conn').textContent='✓';
};
document.getElementById('selectAll').onclick=()=> document.querySelectorAll('#tbody input').forEach(c=>c.checked=true);
document.getElementById('import').onclick= async ()=>{
  const leads = Array.from(document.querySelectorAll('#tbody tr')).filter(tr=>tr.querySelector('input').checked).map(tr=>{
    const tds=tr.querySelectorAll('td'); return { business_name: tds[1].textContent, email: tds[2].textContent, source: tds[3].textContent, city: document.getElementById('location').value, country: document.getElementById('country').value, niche: document.getElementById('niche').value };
  });
  const storage=await chrome.storage.local.get('session')
  const token=storage.session || ''
  const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']='Bearer '+token
  const res = await fetch(API+'/api/extension/import', {method:'POST', headers, body: JSON.stringify({ leads, projectId: null })});
  const j=await res.json(); alert('Import: '+JSON.stringify(j).slice(0,300));
};
document.getElementById('reconnect').onclick= async (e)=>{
  e.preventDefault()
  const res=await fetch(API+'/api/extension/session',{method:'POST', credentials:'include'})
  const j=await res.json()
  if(j.success){ await chrome.storage.local.set({session:j.data.token}); document.getElementById('conn').textContent='✓' }
  else alert('Login to CRM first: '+ (j.error||''))
};
(async()=>{
  try{ const s=await chrome.storage.local.get('session'); document.getElementById('conn').textContent=s.session?'✓':'not connected'; }catch{ document.getElementById('conn').textContent='not connected'; }
})();
