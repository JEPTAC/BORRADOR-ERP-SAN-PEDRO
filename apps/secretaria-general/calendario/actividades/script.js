let A={mode:'table',mine:false,query:'',status:'',office:''};
document.addEventListener('DOMContentLoaded',async()=>{
 await Agenda.init('../data.json');populate();bind();render();ERP.refreshIcons()
});
function populate(){
 const offices=Agenda.data.offices.map(o=>`<option value="${o.id}">${Agenda.escape(o.name)}</option>`).join('');
 document.getElementById('activityOffice').insertAdjacentHTML('beforeend',offices);document.getElementById('newActivityOffice').innerHTML=offices;
 document.getElementById('newActivityPerson').innerHTML=Agenda.data.people.map(p=>`<option value="${p.id}">${Agenda.escape(p.name)} · ${Agenda.escape(p.role)}</option>`).join('')
}
function bind(){
 document.getElementById('activitySearch').oninput=e=>{A.query=e.target.value;render()};
 document.getElementById('activityStatus').onchange=e=>{A.status=e.target.value;render()};
 document.getElementById('activityOffice').onchange=e=>{A.office=e.target.value;render()};
 document.getElementById('activityViews').onclick=e=>{const b=e.target.closest('[data-mode]');if(!b)return;A.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));render()};
 document.getElementById('mineBtn').onclick=()=>{A.mine=!A.mine;document.getElementById('mineBtn').classList.toggle('btn-primary',A.mine);render()};
 document.getElementById('exportActivities').onclick=()=>Agenda.csvEvents(events());
 document.getElementById('newActivity').onclick=()=>{const f=document.getElementById('activityForm');f.reset();f.elements.date.value=Agenda.data.today;f.elements.endDate.value=Agenda.data.today;ERP.open('activityModal')};
 document.getElementById('activityForm').onsubmit=save
}
function events(){
 const q=A.query.toLowerCase().trim();
 return Agenda.data.events.filter(e=>e.type!=='out'&&(!A.status||e.status===A.status)&&(!A.office||e.office===A.office)&&(!A.mine||(e.assignees||[]).includes('P004'))&&(!q||`${e.title} ${e.description}`.toLowerCase().includes(q))).sort((a,b)=>Agenda.eventDateTime(a).localeCompare(Agenda.eventDateTime(b)))
}
function render(){
 const list=events(),open=list.filter(e=>e.status!=='Cumplida'),late=open.filter(e=>(e.endDate||e.date)<Agenda.data.today),risk=open.filter(e=>e.status==='En riesgo'||e.priority==='Crítica'),done=list.filter(e=>e.status==='Cumplida');
 document.getElementById('activityKpis').innerHTML=[
 ['list-checks',list.length,'Actividades registradas'],['clock',open.length,'Compromisos abiertos'],['alert-triangle',late.length,'Vencidas'],['shield-alert',risk.length,'En riesgo'],['circle-check',done.length,'Cumplidas']
 ].map(([i,v,l])=>`<div class="kpi"><div class="kpi-icon"><i data-lucide="${i}"></i></div><div><strong>${v}</strong><span>${l}</span></div></div>`).join('');
 A.mode==='table'?renderTable(list):renderBoard(list);ERP.refreshIcons()
}
function renderTable(list){
 document.getElementById('activityContent').innerHTML=`<div class="table-wrap activity-table"><table><thead><tr><th>Actividad</th><th>Fecha</th><th>Responsable</th><th>Dependencia</th><th>Estado</th><th>Avance</th><th>Prioridad</th><th></th></tr></thead><tbody>${list.map(e=>{
 const p=Agenda.person((e.assignees||[])[0]);return `<tr><td class="activity-title"><strong>${Agenda.escape(e.title)}</strong><span>${Agenda.escape(e.description||'Sin descripción')}</span></td><td>${Agenda.dateLabel(e.date)}<br><small>${Agenda.timeLabel(e)}</small></td><td><div class="table-person"><span class="avatar">${p.avatar}</span><div><strong>${Agenda.escape(p.name)}</strong><span>${Agenda.escape(p.role)}</span></div></div></td><td>${Agenda.escape(Agenda.office(e.office).name)}</td><td><select data-status="${e.id}">${['Programada','Pendiente','En curso','En riesgo','Cumplida'].map(s=>`<option ${s===e.status?'selected':''}>${s}</option>`).join('')}</select></td><td class="progress-cell"><div class="progress ${e.progress>=100?'success':e.status==='En riesgo'?'danger':''}"><span style="width:${Math.min(e.progress||0,100)}%"></span></div><small>${e.progress||0}% · ${e.actualHours||0}/${e.estimatedHours||0} h</small></td><td><span class="tag">${e.priority}</span></td><td><div class="row-actions"><button class="icon-btn" data-open="${e.id}"><i data-lucide="calendar"></i></button><button class="icon-btn" data-done="${e.id}"><i data-lucide="check"></i></button></div></td></tr>`}).join('')}</tbody></table></div>`;
 document.querySelectorAll('[data-status]').forEach(x=>x.onchange=()=>{Agenda.update(x.dataset.status,{status:x.value,progress:x.value==='Cumplida'?100:Agenda.data.events.find(e=>e.id===x.dataset.status).progress});render()});
 document.querySelectorAll('[data-done]').forEach(x=>x.onclick=()=>{Agenda.update(x.dataset.done,{status:'Cumplida',progress:100});render();ERP.toast('Actividad completada')});
 document.querySelectorAll('[data-open]').forEach(x=>x.onclick=()=>location.href=`../index.html?event=${x.dataset.open}`)
}
function renderBoard(list){
 const statuses=['Programada','Pendiente','En curso','En riesgo','Cumplida'];
 document.getElementById('activityContent').innerHTML=`<div class="board">${statuses.map(s=>`<section class="board-column"><div class="board-head"><strong>${s}</strong><span>${list.filter(e=>e.status===s).length}</span></div><div class="board-body">${list.filter(e=>e.status===s).map(e=>{const p=Agenda.person((e.assignees||[])[0]);return `<article class="task-card" draggable="true" data-id="${e.id}"><div class="task-top"><span class="tag">${e.priority}</span><span class="muted">${Agenda.dateLabel(e.date,{day:'2-digit',month:'short'})}</span></div><strong>${Agenda.escape(e.title)}</strong><p>${Agenda.escape(Agenda.office(e.office).name)}</p><div class="task-foot"><span class="avatar">${p.avatar}</span><span class="muted">${e.progress||0}%</span></div></article>`}).join('')}</div></section>`).join('')}</div>`;
 document.querySelectorAll('.task-card').forEach(x=>x.ondblclick=()=>location.href=`../index.html?event=${x.dataset.id}`)
}
function save(ev){
 ev.preventDefault();const f=new FormData(ev.target),id=Agenda.uid('EVT');
 Agenda.upsert({id,title:f.get('title'),date:f.get('date'),endDate:f.get('endDate'),start:f.get('start'),end:f.get('end'),allDay:false,type:'task',calendar:'CAL-INST',office:f.get('office'),assignees:[f.get('assignee')],attendees:[],status:'Programada',priority:f.get('priority'),location:'',meetingUrl:'',description:f.get('description'),progress:0,visibility:'Institucional',reminders:[30],recurrence:'No se repite',checklist:[],comments:[],dependencies:[],attachments:[],estimatedHours:Number(f.get('estimatedHours')),actualHours:0});
 ERP.close('activityModal');render();ERP.toast('Actividad creada')
}
