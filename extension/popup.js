const API = 'http://localhost:3000';
document.getElementById('start').onclick = async () => {
  const r = document.getElementById('results'); r.style.display='block';
  const tbody = document.getElementById('tbody'); tbody.innerHTML='';
  // In production: call source adapters via content script extraction; here demo data
  const demo = [
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
  const res = await fetch(API+'/api/extension/import', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ leads, projectId: null })});
  const j=await res.json(); alert('Import: '+JSON.stringify(j));
};
(async()=>{
  try{ const s=await chrome.storage.local.get('session'); if(s.session) document.getElementById('conn').textContent='✓'; else document.getElementById('conn').textContent='not connected'; }catch{ document.getElementById('conn').textContent='not connected'; }
})();
