let T={office:'',status:'',query:'',from:'2026-08-01',to:'2026-09-15',critical:false,zoom:1,unit:16};
document.addEventListener('DOMContentLoaded',async()=>{await Agenda.init('../data.json');populate();bind();render();ERP.refreshIcons()});
function populate(){
 const offices=Agenda.data.offices.map(o=>`<option value="${o.id}">${Agenda.escape(o.name)}</option>`).join('');
 document.getElementById('timelineOffice').insertAdjacentHTML('beforeend',offices);document.getElementById('milestoneOffice').innerHTML=offices;
 document.getElementById('milestonePerson').innerHTML=Agenda.data.people.map(p=>`<option value="${p.id}">${Agenda.escape(p.name)}</option>`).join('');
 document.getElementById('timelineFrom').value=T.from;document.getElementById('timelineTo').value=T.to
}
function bind(){
 document.getElementById('timelineOffice').onchange=e=>{T.office=e.target.value;render()};
 document.getElementById('timelineStatus').onchange=e=>{T.status=e.target.value;render()};
 document.getElementById('timelineSearch').oninput=e=>{T.query=e.target.value.trim().toLowerCase();render()};
 document.getElementById('timelineFrom').onchange=e=>{T.from=e.target.value;render()};
 document.getElementById('timelineTo').onchange=e=>{T.to=e.target.value;render()};
 document.getElementById('timelineScale').onchange=render;
 document.getElementById('timelineToday').onclick=()=>{T.from=Agenda.addDays(Agenda.data.today,-7);T.to=Agenda.addDays(Agenda.data.today,35);document.getElementById('timelineFrom').value=T.from;document.getElementById('timelineTo').value=T.to;render();requestAnimationFrame(scrollToToday)};
 document.getElementById('zoomOut').onclick=()=>setZoom(-.15);
 document.getElementById('zoomIn').onclick=()=>setZoom(.15);
 document.getElementById('timelineFocus').onclick=()=>{document.body.classList.toggle('timeline-focus');document.getElementById('timelineFocus').classList.toggle('btn-primary',document.body.classList.contains('timeline-focus'));ERP.toast(document.body.classList.contains('timeline-focus')?'Vista enfocada activada':'Vista completa restaurada')};
 document.getElementById('criticalPath').onclick=()=>{T.critical=!T.critical;document.getElementById('criticalPath').classList.toggle('btn-primary',T.critical);render()};
 document.getElementById('exportTimeline').onclick=()=>Agenda.csvEvents(items());
 document.getElementById('newMilestone').onclick=()=>{const f=document.getElementById('milestoneForm');f.reset();f.elements.date.value=Agenda.data.today;ERP.open('milestoneModal')};
 document.getElementById('milestoneForm').onsubmit=saveMilestone
}
function items(){return Agenda.data.events.filter(e=>{
 const person=(e.assignees||[]).map(id=>Agenda.person(id)?.name||'').join(' '),office=Agenda.office(e.office)?.name||'';
 const haystack=`${e.title||''} ${e.description||''} ${person} ${office}`.toLowerCase();
 return (!T.office||e.office===T.office)&&(!T.status||e.status===T.status)&&(!T.query||haystack.includes(T.query))&&e.date<=T.to&&(e.endDate||e.date)>=T.from
 }).sort((a,b)=>a.date.localeCompare(b.date))}
function daysBetween(a,b){return Math.max(1,Math.round((Agenda.parseDate(b)-Agenda.parseDate(a))/86400000)+1)}
function monthGroups(totalDays){
 const groups=[];
 for(let i=0;i<totalDays;i++){
  const d=Agenda.addDays(T.from,i),date=Agenda.parseDate(d),key=`${date.getFullYear()}-${date.getMonth()}`;
  if(!groups.length||groups[groups.length-1].key!==key){
   groups.push({key,count:1,label:Agenda.dateLabel(d,{month:'long',year:'numeric'})});
  }else groups[groups.length-1].count++;
 }
 return groups
}
function timelineHeader(totalDays,unit){
 const months=monthGroups(totalDays).map(g=>`<div class="month-band" style="grid-column:span ${g.count}">${Agenda.escape(g.label)}</div>`).join('');
 const days=Array.from({length:totalDays},(_,i)=>{
  const d=Agenda.addDays(T.from,i),date=Agenda.parseDate(d),weekend=[0,6].includes(date.getDay()),today=d===Agenda.data.today;
  const weekday=Agenda.dateLabel(d,{weekday:'short'}).replace('.','');
  return `<div class="timeline-unit ${weekend?'weekend':''} ${today?'today':''}" title="${Agenda.dateLabel(d,{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}"><span>${weekday}</span><strong>${String(date.getDate()).padStart(2,'0')}</strong></div>`
 }).join('');
 return `<div class="timeline-header-stack"><div class="month-bands" style="grid-template-columns:repeat(${totalDays},${unit}px)">${months}</div><div class="timeline-units" style="grid-template-columns:repeat(${totalDays},${unit}px)">${days}</div></div>`
}
function trackGuides(totalDays,unit){
 let html='';
 for(let i=0;i<totalDays;i++){
  const d=Agenda.addDays(T.from,i),date=Agenda.parseDate(d);
  if([0,6].includes(date.getDay()))html+=`<span class="track-weekend" style="left:${i*unit}px;width:${unit}px"></span>`;
  if(date.getDate()===1&&i>0)html+=`<span class="month-separator" style="left:${i*unit}px"></span>`;
 }
 return html
}
function render(){
 const list=items(),totalDays=daysBetween(T.from,T.to),scale=document.getElementById('timelineScale').value,base=scale==='day'?48:scale==='week'?42:36,unit=Math.max(30,Math.round(base*T.zoom)),over=list.filter(e=>(e.endDate||e.date)<Agenda.data.today&&e.status!=='Cumplida'),blocked=list.filter(e=>(e.dependencies||[]).some(id=>Agenda.data.events.find(x=>x.id===id)?.status!=='Cumplida')),critical=list.filter(e=>e.priority==='Crítica'||e.status==='En riesgo'),milestones=list.filter(e=>e.type==='deadline');
 T.unit=unit;document.getElementById('zoomValue').textContent=`${Math.round(T.zoom*100)}%`;
 document.getElementById('timelineKpis').innerHTML=[['calendar-range',list.length,'Elementos del cronograma'],['flag',milestones.length,'Hitos'],['git-branch',blocked.length,'Bloqueados'],['alert-triangle',over.length,'Retrasados'],['route',critical.length,'Ruta crítica']].map(([i,v,l])=>`<div class="kpi"><div class="kpi-icon"><i data-lucide="${i}"></i></div><div><strong>${v}</strong><span>${l}</span></div></div>`).join('');
 let html=`<div class="gantt-head activity-head">Actividad</div><div class="gantt-head owner-head">Responsable</div><div class="gantt-head timeline">${timelineHeader(totalDays,unit)}</div>`;
 const guides=trackGuides(totalDays,unit);
 list.forEach(e=>{
  const start=Math.max(0,daysBetween(T.from,e.date)-1),duration=daysBetween(e.date,e.endDate||e.date),left=start*unit,width=Math.max(e.type==='deadline'?20:duration*unit-8,20),p=Agenda.person((e.assignees||[])[0]),color=Agenda.calendar(e.calendar).color,criticalClass=T.critical&&(e.priority==='Crítica'||e.status==='En riesgo')?'critical':'',milestone=e.type==='deadline'&&duration===1;
  html+=`<div class="gantt-row"><div class="gantt-name" data-event="${e.id}" title="Abrir ${Agenda.escape(e.title)}"><span class="color-dot" style="background:${color}"></span><div><strong>${Agenda.escape(e.title)}</strong><span>${Agenda.escape(Agenda.office(e.office).name)} · ${e.status} · ${e.progress||0}%</span></div></div><div class="gantt-owner"><span class="person-chip"><span class="avatar">${p.avatar}</span>${Agenda.escape(p.name.split(' ')[0])}</span></div><div class="gantt-track" style="--unit:${unit}px;width:${totalDays*unit}px">${guides}<button data-event="${e.id}" class="gantt-bar ${criticalClass} ${milestone?'milestone':''}" style="left:${left}px;width:${width}px;--bar:${color}" title="${Agenda.escape(e.title)}"><span class="progress-handle" style="width:${e.progress||0}%"></span>${milestone?'':`<strong>${Agenda.escape(e.title)}</strong><span>${Agenda.dateLabel(e.date,{day:'2-digit',month:'short'})} – ${Agenda.dateLabel(e.endDate||e.date,{day:'2-digit',month:'short'})}</span>`}</button>${todayLine(totalDays,unit)}</div></div>`
 });
 const gantt=document.getElementById('gantt');gantt.style.gridTemplateColumns=`300px 130px ${totalDays*unit}px`;gantt.innerHTML=html;
 gantt.querySelectorAll('[data-event]').forEach(x=>x.onclick=()=>location.href=`../index.html?event=${x.dataset.event}`);
 renderDependencies(blocked);renderMilestones(milestones);ERP.refreshIcons()
}

function setZoom(delta){
 T.zoom=Math.min(1.75,Math.max(.55,Math.round((T.zoom+delta)*100)/100));
 render();
}
function scrollToToday(){
 if(Agenda.data.today<T.from||Agenda.data.today>T.to)return ERP.toast('La fecha de hoy está fuera del rango visible');
 const wrap=document.querySelector('.gantt-wrap');if(!wrap)return;
 const dayIndex=daysBetween(T.from,Agenda.data.today)-1;
 wrap.scrollTo({left:Math.max(0,dayIndex*T.unit-220),behavior:'smooth'});
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
