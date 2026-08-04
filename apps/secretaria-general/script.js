document.addEventListener('DOMContentLoaded', async()=>{
 const d=await ERP.fetchJSON('data.json',{metrics:[],modules:[],tasks:[]});
 document.getElementById('metrics').innerHTML=d.metrics.map(m=>`<article class="card metric-card ${m.tone||''}"><div class="metric-copy"><span>${m.label}</span><strong>${m.value}</strong><small>${m.hint}</small></div><div class="metric-icon"><i data-lucide="${m.icon}"></i></div></article>`).join('');
 document.getElementById('processes').innerHTML=d.modules.map(m=>`<a href="${m.href}" class="card process-card"><div class="list-icon"><i data-lucide="${m.icon}"></i></div><div class="content-col"><h3>${m.name}</h3><p>${m.desc}</p><div class="process-summary"><span>${m.value}</span><strong>${m.progress}%</strong></div><div class="progress"><span style="width:${m.progress}%"></span></div></div></a>`).join('');
 document.getElementById('taskList').innerHTML=d.tasks.map(t=>`<div class="list-item"><div class="list-copy"><strong>${t.title}</strong><p>${t.area}</p><small>${t.due}</small></div><span class="status ${t.statusClass}">${t.status}</span></div>`).join('');
 ERP.refreshIcons();
});
