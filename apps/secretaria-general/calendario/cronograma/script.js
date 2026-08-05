let T={office:'',from:'2026-08-01',to:'2026-09-15',critical:false};
document.addEventListener('DOMContentLoaded',async()=>{await Agenda.init('../data.json');populate();bind();render();ERP.refreshIcons()});
function populate(){
 const offices=Agenda.data.offices.map(o=>`<option value="${o.id}">${Agenda.escape(o.name)}</option>`).join('');
 document.getElementById('timelineOffice').insertAdjacentHTML('beforeend',offices);document.getElementById('milestoneOffice').innerHTML=offices;
 document.getElementById('milestonePerson').innerHTML=Agenda.data.people.map(p=>`<option value="${p.id}">${Agenda.escape(p.name)}</option>`).join('');
 document.getElementById('timelineFrom').value=T.from;document.getElementById('timelineTo').value=T.to
}
function bind(){
 document.getElementById('timelineOffice').onchange=e=>{T.office=e.target.value;render()};
 document.getElementById('timelineFrom').onchange=e=>{T.from=e.target.value;render()};
 document.getElementById('timelineTo').onchange=e=>{T.to=e.target.value;render()};
 document.getElementById('timelineScale').onchange=render;
 document.getElementById('criticalPath').onclick=()=>{T.critical=!T.critical;document.getElementById('criticalPath').classList.toggle('btn-primary',T.critical);render()};
 document.getElementById('exportTimeline').onclick=()=>Agenda.csvEvents(items());
 document.getElementById('newMilestone').onclick=()=>{const f=document.getElementById('milestoneForm');f.reset();f.elements.date.value=Agenda.data.today;ERP.open('milestoneModal')};
 document.getElementById('milestoneForm').onsubmit=saveMilestone
}
function items(){return Agenda.data.events.filter(e=>(!T.office||e.office===T.office)&&e.date<=T.to&&(e.endDate||e.date)>=T.from).sort((a,b)=>a.date.localeCompare(b.date))}
function daysBetween(a,b){return Math.max(1,Math.round((Agenda.parseDate(b)-Agenda.parseDate(a))/86400000)+1)}
function render(){
 const list=items(),totalDays=daysBetween(T.from,T.to),unit=Math.max(12,720/totalDays),over=list.filter(e=>(e.endDate||e.date)<Agenda.data.today&&e.status!=='Cumplida'),blocked=list.filter(e=>(e.dependencies||[]).some(id=>Agenda.data.events.find(x=>x.id===id)?.status!=='Cumplida')),critical=list.filter(e=>e.priority==='Crítica'||e.status==='En riesgo'),milestones=list.filter(e=>e.type==='deadline');
 document.getElementById('timelineKpis').innerHTML=[['calendar-range',list.length,'Elementos del cronograma'],['flag',milestones.length,'Hitos'],['git-branch',blocked.length,'Bloqueados'],['alert-triangle',over.length,'Retrasados'],['route',critical.length,'Ruta crítica']].map(([i,v,l])=>`<div class="kpi"><div class="kpi-icon"><i data-lucide="${i}"></i></div><div><strong>${v}</strong><span>${l}</span></div></div>`).join('');
 const ticks=[];for(let i=0;i<totalDays;i++){const d=Agenda.addDays(T.from,i);if(i===0||Agenda.parseDate(d).getDay()===1||i===totalDays-1)ticks.push({i,d})}
 const timelineHeader=`<div class="timeline-units" style="grid-template-columns:repeat(${totalDays},${unit}px)">${Array.from({length:totalDays},(_,i)=>{const d=Agenda.addDays(T.from,i);return `<div class="timeline-unit">${Agenda.parseDate(d).getDate()===1||i===0?Agenda.dateLabel(d,{day:'2-digit',month:'short'}):Agenda.parseDate(d).getDay()===1?Agenda.parseDate(d).getDate():''}</div>`}).join('')}</div>`;
 let html=`<div class="gantt-head">Actividad</div><div class="gantt-head">Responsable</div><div class="gantt-head timeline">${timelineHeader}</div>`;
 list.forEach(e=>{
  const start=Math.max(0,daysBetween(T.from,e.date)-1),duration=daysBetween(e.date,e.endDate||e.date),left=start*unit,width=Math.max(e.type==='deadline'?18:duration*unit-4,18),p=Agenda.person((e.assignees||[])[0]),color=Agenda.calendar(e.calendar).color,criticalClass=T.critical&&(e.priority==='Crítica'||e.status==='En riesgo')?'critical':'',milestone=e.type==='deadline'&&duration===1;
  html+=`<div class="gantt-row"><div class="gantt-name"><span class="color-dot" style="background:${color}"></span><div><strong>${Agenda.escape(e.title)}</strong><span>${Agenda.escape(Agenda.office(e.office).name)} · ${e.progress||0}%</span></div></div><div class="gantt-owner"><span class="person-chip"><span class="avatar">${p.avatar}</span>${Agenda.escape(p.name.split(' ')[0])}</span></div><div class="gantt-track" style="--unit:${unit}px;width:${totalDays*unit}px"><button data-event="${e.id}" class="gantt-bar ${criticalClass} ${milestone?'milestone':''}" style="left:${left}px;width:${width}px;--bar:${color}" title="${Agenda.escape(e.title)}"><span class="progress-handle" style="width:${e.progress||0}%"></span>${milestone?'':`<strong>${Agenda.escape(e.title)}</strong><span>${Agenda.dateLabel(e.date,{day:'2-digit',month:'short'})} – ${Agenda.dateLabel(e.endDate||e.date,{day:'2-digit',month:'short'})}</span>`}</button>${todayLine(totalDays,unit)}</div></div>`
 });
 const gantt=document.getElementById('gantt');gantt.style.gridTemplateColumns=`250px 90px ${totalDays*unit}px`;gantt.innerHTML=html;
 gantt.querySelectorAll('[data-event]').forEach(x=>x.onclick=()=>location.href=`../index.html?event=${x.dataset.event}`);
 renderDependencies(blocked);renderMilestones(milestones);ERP.refreshIcons()
}
function todayLine(total,unit){if(Agenda.data.today<T.from||Agenda.data.today>T.to)return'';const left=(daysBetween(T.from,Agenda.data.today)-1)*unit+unit/2;return `<span class="today-line" style="left:${left}px"></span>`}
function renderDependencies(blocked){
 document.getElementById('dependencyList').innerHTML=blocked.map(e=>{const deps=(e.dependencies||[]).map(id=>Agenda.data.events.find(x=>x.id===id)).filter(Boolean);return `<div class="dependency-item"><div class="dependency-icon"><i data-lucide="git-branch"></i></div><div><strong>${Agenda.escape(e.title)}</strong><p>Bloqueada por: ${deps.map(d=>Agenda.escape(d.title)).join(', ')}</p><span class="status status-warning">${e.status}</span></div></div>`}).join('')||'<div class="empty-mini">No hay actividades bloqueadas.</div>'
}
function renderMilestones(list){
 document.getElementById('milestoneList').innerHTML=list.sort((a,b)=>a.date.localeCompare(b.date)).slice(0,7).map(e=>`<div class="milestone-item"><div class="dependency-icon"><i data-lucide="flag"></i></div><div><strong>${Agenda.escape(e.title)}</strong><p>${Agenda.dateLabel(e.date,{weekday:'short',day:'2-digit',month:'long'})} · ${Agenda.escape(Agenda.office(e.office).name)}</p><span class="tag">${e.priority}</span></div></div>`).join('')||'<div class="empty-mini">No hay hitos en el rango.</div>'
}
function saveMilestone(ev){
 ev.preventDefault();const f=new FormData(ev.target);
 Agenda.upsert({id:Agenda.uid('HIT'),title:f.get('title'),date:f.get('date'),endDate:f.get('date'),start:'00:00',end:'23:59',allDay:true,type:'deadline',calendar:'CAL-LIM',office:f.get('office'),assignees:[f.get('person')],attendees:[],status:'Programada',priority:f.get('priority'),location:'',meetingUrl:'',description:f.get('description'),progress:0,visibility:'Institucional',reminders:[1440],recurrence:'No se repite',checklist:[],comments:[],dependencies:[],attachments:[],estimatedHours:1,actualHours:0});
 ERP.close('milestoneModal');render();ERP.toast('Hito agregado al cronograma')
}
