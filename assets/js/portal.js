document.addEventListener('DOMContentLoaded', async () => {
  const data = await ERP.fetchJSON('assets/json/portal.json', {summary:[],modules:[],activity:[]});
  const metrics=document.getElementById('metrics');
  metrics.innerHTML=data.summary.map(m=>`<article class="card metric-card ${m.tone||''}"><div class="metric-copy"><span>${m.label}</span><strong>${m.value}</strong><small>${m.hint}</small></div><div class="metric-icon"><i data-lucide="${m.icon}"></i></div></article>`).join('');
  const modules=document.getElementById('moduleGrid');
  const renderModules=(items)=>{modules.innerHTML=items.map(m=>`<a class="card module-card" href="${m.href}"><div class="module-icon"><i data-lucide="${m.icon}"></i></div><h3>${m.name}</h3><p>${m.description}</p><div class="module-meta"><span class="status ${m.statusClass}">${m.status}</span><span>${m.count}</span></div></a>`).join('')};
  renderModules(data.modules);
  document.getElementById('activityList').innerHTML=data.activity.map(a=>`<div class="list-item"><div class="list-icon"><i data-lucide="${a.icon}"></i></div><div class="list-copy"><strong>${a.title}</strong><p>${a.module}</p><small>${a.time}</small></div></div>`).join('');
  const input=document.getElementById('portalSearch'), results=document.getElementById('searchResults');
  input.addEventListener('input',()=>{
    const q=input.value.toLowerCase().trim(); renderModules(data.modules.filter(m=>(m.name+' '+m.description).toLowerCase().includes(q)));
    if(!q){results.classList.add('hidden');return}
    const matches=data.modules.filter(m=>(m.name+' '+m.description).toLowerCase().includes(q)).slice(0,5);
    results.innerHTML=matches.length?matches.map(m=>`<a href="${m.href}"><div class="module-icon" style="width:32px;height:32px;border-radius:9px"><i data-lucide="${m.icon}"></i></div><div><strong>${m.name}</strong><div style="color:var(--muted);font-size:11px">${m.count}</div></div></a>`).join(''):`<div class="empty-state" style="padding:18px">Sin coincidencias</div>`;
    results.classList.remove('hidden'); ERP.refreshIcons();
  });
  ERP.refreshIcons();
});
