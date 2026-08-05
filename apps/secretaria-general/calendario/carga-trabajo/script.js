let W={office:'',period:'week'};
document.addEventListener('DOMContentLoaded',async()=>{await Agenda.init('../data.json');populate();bind();render();ERP.refreshIcons()});
function populate(){document.getElementById('workloadOffice').insertAdjacentHTML('beforeend',Agenda.data.offices.map(o=>`<option value="${o.id}">${Agenda.escape(o.name)}</option>`).join(''))}
function bind(){
 document.getElementById('workloadOffice').onchange=e=>{W.office=e.target.value;render()};
 document.getElementById('workloadPeriod').onchange=e=>{W.period=e.target.value;render()};
 document.getElementById('rebalanceBtn').onclick=()=>{document.getElementById('recommendations').scrollIntoView({behavior:'smooth'});ERP.toast('Se generaron recomendaciones de redistribución')};
 document.getElementById('exportWorkload').onclick=exportRows
}
function range(){
 const today=Agenda.data.today,start=Agenda.startOfWeek(today);
 if(W.period==='next')return [Agenda.addDays(start,7),Agenda.addDays(start,11)];
 if(W.period==='month'){const d=Agenda.parseDate(today);return [`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`,`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-31`]}
 return [start,Agenda.addDays(start,4)]
}
function rows(){
 const [from,to]=range();return Agenda.data.people.filter(p=>!W.office||p.office===W.office).map(p=>{
  const events=Agenda.data.events.filter(e=>(e.assignees||[]).includes(p.id)&&e.date>=from&&e.date<=to&&e.status!=='Cancelada');
  const hours=events.reduce((s,e)=>s+(e.estimatedHours||Agenda.duration(e)),0),capacity=W.period==='month'?p.capacity*4:p.capacity,pct=Math.round(hours/capacity*100);
  return {...p,events,hours,capacity,pct}
 }).sort((a,b)=>b.pct-a.pct)
}
function render(){
 const list=rows(),total=list.reduce((s,p)=>s+p.hours,0),capacity=list.reduce((s,p)=>s+p.capacity,0),over=list.filter(p=>p.pct>100),available=list.reduce((s,p)=>s+Math.max(0,p.capacity-p.hours),0);
 document.getElementById('workloadKpis').innerHTML=[
 ['clock',`${total.toFixed(1)} h`,'Horas planeadas'],['gauge',`${Math.round(total/capacity*100)||0}%`,'Utilización global'],['alert-triangle',over.length,'Personas sobrecargadas'],['battery-charging',`${available.toFixed(1)} h`,'Capacidad disponible'],['users',list.length,'Personas analizadas']
 ].map(([i,v,l])=>`<div class="kpi"><div class="kpi-icon"><i data-lucide="${i}"></i></div><div><strong>${v}</strong><span>${l}</span></div></div>`).join('');
 document.getElementById('workloadList').innerHTML=list.map(p=>`<div class="workload-row"><div class="person-main"><span class="avatar">${p.avatar}</span><div><strong>${Agenda.escape(p.name)}</strong><span>${Agenda.escape(p.role)} · ${Agenda.escape(Agenda.office(p.office).name)}</span></div></div>
 <div class="capacity-bar"><div class="bar-head"><span>0 h</span><span>${p.capacity} h capacidad</span></div><div class="progress ${p.pct>100?'danger':p.pct>85?'warning':'success'}"><span style="width:${Math.min(p.pct,100)}%"></span></div><i class="limit"></i></div>
 <div class="hours"><strong>${p.hours.toFixed(1)} h</strong><span>${p.events.length} actividades</span></div><div class="workload-status"><span class="status ${p.pct>100?'status-danger':p.pct>85?'status-warning':'status-success'}">${p.pct}%</span></div></div>`).join('');
 renderRecommendations(list);renderOffices(list);renderHeatmap(list);ERP.refreshIcons()
}
function renderRecommendations(list){
 const heavy=list.filter(p=>p.pct>90),light=list.filter(p=>p.pct<70).sort((a,b)=>a.pct-b.pct);
 const recs=heavy.map((p,i)=>({from:p,to:light[i%Math.max(light.length,1)],hours:Math.min(4,Math.max(1,p.hours-p.capacity*.85))})).filter(x=>x.to);
 document.getElementById('recommendations').innerHTML=recs.map(r=>`<div class="recommendation"><strong>Mover ${r.hours.toFixed(1)} h de ${Agenda.escape(r.from.name.split(' ')[0])} a ${Agenda.escape(r.to.name.split(' ')[0])}</strong><p>${r.from.pct}% → ${Math.round((r.from.hours-r.hours)/r.from.capacity*100)}% · ${r.to.pct}% → ${Math.round((r.to.hours+r.hours)/r.to.capacity*100)}%</p><div class="inline-actions"><span class="tag">${Agenda.escape(Agenda.office(r.from.office).name)}</span><button class="btn btn-soft btn-sm" data-apply>Aplicar</button></div></div>`).join('')||'<div class="empty-mini">La distribución actual está equilibrada.</div>';
 document.querySelectorAll('[data-apply]').forEach(x=>x.onclick=()=>ERP.toast('Simulación aplicada. En producción solicitará aprobación.'))
}
function renderOffices(list){
 const grouped={};list.forEach(p=>{grouped[p.office]=(grouped[p.office]||0)+p.hours});const total=Object.values(grouped).reduce((a,b)=>a+b,0);
 document.getElementById('officeDistribution').innerHTML=Object.entries(grouped).sort((a,b)=>b[1]-a[1]).map(([id,h])=>{const o=Agenda.office(id),pct=Math.round(h/total*100)||0;return `<div class="office-bar"><div class="office-bar-head"><strong>${Agenda.escape(o.name)}</strong><span>${h.toFixed(1)} h · ${pct}%</span></div><div class="progress"><span style="width:${pct}%;background:${o.color}"></span></div></div>`}).join('')
}
function renderHeatmap(list){
 const days=Array.from({length:5},(_,i)=>Agenda.addDays(range()[0],i));
 document.getElementById('heatmap').innerHTML=`<div></div>${days.map(d=>`<div class="heat-head">${Agenda.dateLabel(d,{weekday:'short',day:'2-digit'})}</div>`).join('')}${list.map(p=>`<div class="heat-person"><span class="avatar">${p.avatar}</span>${Agenda.escape(p.name.split(' ').slice(0,2).join(' '))}</div>${days.map(d=>{const h=p.events.filter(e=>e.date===d).reduce((s,e)=>s+(e.estimatedHours||Agenda.duration(e)),0),level=h===0?0:h<=2?1:h<=4?2:h<=6?3:4;return `<div class="heat-cell heat-${level}"><strong>${h.toFixed(1)} h</strong><span>${p.events.filter(e=>e.date===d).length} activ.</span></div>`}).join('')}`).join('')}`
}
function exportRows(){ERP.csv('carga-trabajo.csv',rows().map(p=>({Persona:p.name,Dependencia:Agenda.office(p.office).name,Horas:p.hours.toFixed(1),Capacidad:p.capacity,Utilizacion:`${p.pct}%`,Actividades:p.events.length})))}
