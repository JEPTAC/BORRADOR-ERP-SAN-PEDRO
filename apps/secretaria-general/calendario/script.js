let STATE={view:'month',focusDate:'2026-08-05',selectedDate:'2026-08-05',filters:{office:'',person:'',query:''},showWeekends:true,editingId:null};

document.addEventListener('DOMContentLoaded',async()=>{
  await Agenda.init('data.json');
  const p=Agenda.prefs();
  STATE={...STATE,view:p.view||'month',focusDate:p.focusDate||Agenda.data.today,selectedDate:p.focusDate||Agenda.data.today,
    filters:{office:p.office||'',person:p.person||'',query:p.query||''},showWeekends:p.showWeekends!==false};
  populateControls();
  bindEvents();
  renderAll();
  applyUrlIntent();
  ERP.refreshIcons();
});


function applyUrlIntent(){
  const q=new URLSearchParams(location.search);
  const eventId=q.get('event');
  if(eventId&&Agenda.data.events.some(e=>e.id===eventId)){openEventDrawer(eventId);history.replaceState({},'',location.pathname);return}
  if(q.get('new')){
    const date=q.get('date')||STATE.selectedDate,start=q.get('start')||'08:00',end=q.get('end'),people=(q.get('people')||'').split(',').filter(Boolean);
    openEventForm(null,date,start);
    if(end)document.getElementById('eventForm').elements.end.value=end;
    people.forEach(id=>{const x=document.getElementById(`assignees-${id}`);if(x)x.checked=true});
    checkFormConflicts();history.replaceState({},'',location.pathname)
  }
}

function populateControls(){
  const officeOptions=Agenda.data.offices.map(o=>`<option value="${o.id}">${Agenda.escape(o.name)}</option>`).join('');
  document.getElementById('officeFilter').insertAdjacentHTML('beforeend',officeOptions);
  document.getElementById('eventOffice').innerHTML=officeOptions;
  const peopleOptions=Agenda.data.people.map(p=>`<option value="${p.id}">${Agenda.escape(p.name)} · ${Agenda.escape(p.role)}</option>`).join('');
  document.getElementById('personFilter').insertAdjacentHTML('beforeend',peopleOptions);
  document.getElementById('eventType').innerHTML=Agenda.data.eventTypes.map(t=>`<option value="${t.id}">${Agenda.escape(t.name)}</option>`).join('');
  document.getElementById('eventCalendar').innerHTML=Agenda.data.calendars.map(c=>`<option value="${c.id}">${Agenda.escape(c.name)}</option>`).join('');
  document.getElementById('officeFilter').value=STATE.filters.office;
  document.getElementById('personFilter').value=STATE.filters.person;
  document.getElementById('eventSearch').value=STATE.filters.query;
  document.getElementById('slotDate').value=STATE.focusDate;
  fillPeoplePicker('assigneePicker','assignees');
  fillPeoplePicker('attendeePicker','attendees');
  fillPeoplePicker('slotPeoplePicker','slotPeople');
}
function fillPeoplePicker(containerId,name){
  document.getElementById(containerId).innerHTML=Agenda.data.people.map(p=>`
    <span class="people-option"><input id="${name}-${p.id}" name="${name}" value="${p.id}" type="checkbox">
      <label for="${name}-${p.id}"><span class="avatar">${p.avatar}</span><span>${Agenda.escape(p.name.split(' ').slice(0,2).join(' '))}</span></label></span>`).join('');
}
function bindEvents(){
  document.getElementById('prevPeriod').onclick=()=>movePeriod(-1);
  document.getElementById('nextPeriod').onclick=()=>movePeriod(1);
  document.getElementById('todayBtn').onclick=()=>{STATE.focusDate=Agenda.data.today;STATE.selectedDate=Agenda.data.today;persistPrefs();renderAll()};
  document.getElementById('miniPrev').onclick=()=>moveMonth(-1);
  document.getElementById('miniNext').onclick=()=>moveMonth(1);
  document.getElementById('newEventBtn').onclick=()=>openEventForm();
  document.getElementById('quickAdd').onclick=()=>openEventForm(null,STATE.selectedDate);
  document.getElementById('availabilityBtn').onclick=()=>openAvailability();
  document.getElementById('searchSlotsBtn').onclick=renderSlots;
  document.getElementById('suggestSlotInForm').onclick=suggestSlotInForm;
  document.getElementById('eventForm').addEventListener('submit',saveEvent);
  document.getElementById('eventForm').addEventListener('input',checkFormConflicts);
  document.getElementById('officeFilter').onchange=e=>setFilter('office',e.target.value);
  document.getElementById('personFilter').onchange=e=>setFilter('person',e.target.value);
  document.getElementById('eventSearch').oninput=e=>setFilter('query',e.target.value);
  document.getElementById('clearFilters').onclick=clearFilters;
  document.getElementById('toggleWeekends').onclick=()=>{STATE.showWeekends=!STATE.showWeekends;persistPrefs();renderStage();ERP.toast(STATE.showWeekends?'Fines de semana visibles':'Fines de semana ocultos')};
  bindWorkspaceNavigation();
  document.getElementById('viewSwitch').onclick=e=>{const b=e.target.closest('[data-view]');if(b)setView(b.dataset.view)};
  document.getElementById('closeDrawer').onclick=closeDrawer;
  document.getElementById('eventDrawerBackdrop').onclick=closeDrawer;
  document.getElementById('smartAction').onclick=showSmartSuggestion;
  document.getElementById('openCommand').onclick=openCommand;
  document.getElementById('commandBackdrop').addEventListener('click',e=>{if(e.target.id==='commandBackdrop')ERP.close('commandBackdrop')});
  document.getElementById('commandInput').oninput=renderCommands;
  document.getElementById('exportMenuBtn').onclick=e=>togglePopover('exportMenu',e.currentTarget);
  document.getElementById('moreMenuBtn').onclick=e=>togglePopover('moreMenu',e.currentTarget);
  document.getElementById('exportCsv').onclick=()=>{Agenda.csvEvents(filteredEvents());hidePopovers()};
  document.getElementById('exportIcs').onclick=()=>{Agenda.downloadICS(filteredEvents());hidePopovers()};
  document.getElementById('importIcsBtn').onclick=()=>document.getElementById('importIcs').click();
  document.getElementById('importIcs').onchange=importICS;
  document.getElementById('printAgenda').onclick=()=>{hidePopovers();window.print()};
  document.getElementById('resetDemo').onclick=()=>{if(confirm('¿Restablecer los datos de demostración del calendario?'))Agenda.reset()};
  document.getElementById('shortcutHelp').onclick=()=>{hidePopovers();ERP.toast('Atajos: N nueva · T hoy · M mes · W semana · D día · A agenda · Ctrl+K buscar')};
  document.addEventListener('click',e=>{if(!e.target.closest('.popover')&&!e.target.closest('#exportMenuBtn')&&!e.target.closest('#moreMenuBtn'))hidePopovers()});
  document.addEventListener('keydown',keyboardShortcuts);
}

function bindWorkspaceNavigation(){
  const workspace=document.getElementById('agendaWorkspace');
  const filterBtn=document.getElementById('toggleFilterPanel');
  const dayBtn=document.getElementById('toggleDayPanel');
  const focusBtn=document.getElementById('focusCalendar');
  if(!workspace||!filterBtn||!dayBtn||!focusBtn)return;
  let layout={filters:true,details:true,focus:false};
  try{layout={...layout,...JSON.parse(localStorage.getItem('agenda360-layout')||'{}')}}catch(_){ }
  const apply=()=>{
    workspace.classList.toggle('filters-collapsed',!layout.filters&&!layout.focus);
    workspace.classList.toggle('details-collapsed',!layout.details&&!layout.focus);
    workspace.classList.toggle('focus-mode',layout.focus);
    filterBtn.classList.toggle('active',layout.filters&&!layout.focus);
    dayBtn.classList.toggle('active',layout.details&&!layout.focus);
    focusBtn.classList.toggle('active',layout.focus);
    filterBtn.setAttribute('aria-pressed',String(layout.filters&&!layout.focus));
    dayBtn.setAttribute('aria-pressed',String(layout.details&&!layout.focus));
    focusBtn.setAttribute('aria-pressed',String(layout.focus));
    localStorage.setItem('agenda360-layout',JSON.stringify(layout));
  };
  filterBtn.onclick=()=>{layout.focus=false;layout.filters=!layout.filters;apply()};
  dayBtn.onclick=()=>{layout.focus=false;layout.details=!layout.details;apply()};
  focusBtn.onclick=()=>{layout.focus=!layout.focus;apply();ERP.toast(layout.focus?'Modo enfoque activado':'Modo enfoque desactivado')};
  apply();
}

function persistPrefs(){Agenda.setPrefs({view:STATE.view,focusDate:STATE.focusDate,office:STATE.filters.office,person:STATE.filters.person,query:STATE.filters.query,showWeekends:STATE.showWeekends})}
function setFilter(key,value){STATE.filters[key]=value;persistPrefs();renderAll()}
function clearFilters(){
  STATE.filters={office:'',person:'',query:''};
  document.getElementById('officeFilter').value='';document.getElementById('personFilter').value='';document.getElementById('eventSearch').value='';
  persistPrefs();renderAll()
}
function filteredEvents(){return Agenda.visibleEvents(STATE.filters)}
function renderAll(){
  renderKpis();renderMiniCalendar();renderCalendarList();renderStage();renderRightPanel();renderSmart();updateTodayBadge();ERP.refreshIcons()
}
function renderKpis(){
  const events=filteredEvents(),today=Agenda.data.today;
  const todayEvents=events.filter(e=>today>=e.date&&today<=(e.endDate||e.date));
  const pending=events.filter(e=>!['Cumplida','Cancelada'].includes(e.status));
  const overdue=pending.filter(e=>(e.endDate||e.date)<today);
  const risk=pending.filter(e=>e.status==='En riesgo'||e.priority==='Crítica');
  const weekEnd=Agenda.addDays(Agenda.startOfWeek(today),6);
  const completedWeek=events.filter(e=>e.status==='Cumplida'&&e.date>=Agenda.startOfWeek(today)&&e.date<=weekEnd).length;
  const totalWeek=events.filter(e=>e.date>=Agenda.startOfWeek(today)&&e.date<=weekEnd).length;
  const items=[
    ['calendar',todayEvents.length,'Actividades hoy','info'],
    ['clock',pending.length,'Compromisos abiertos','warning'],
    ['alert-triangle',overdue.length,'Actividades vencidas','danger'],
    ['shield-alert',risk.length,'En riesgo o críticas','danger'],
    ['circle-check',`${Agenda.percent(completedWeek,totalWeek)}%`,'Cumplimiento semanal','success']
  ];
  document.getElementById('kpiRow').innerHTML=items.map(([i,v,l,c])=>`<div class="kpi"><div class="kpi-icon ${c}"><i data-lucide="${i}"></i></div><div><strong>${v}</strong><span>${l}</span></div></div>`).join('')
}
function updateTodayBadge(){
  document.getElementById('todayBadge').textContent=filteredEvents().filter(e=>e.date===Agenda.data.today).length
}
function renderMiniCalendar(){
  const d=Agenda.parseDate(STATE.focusDate),y=d.getFullYear(),m=d.getMonth(),first=new Date(y,m,1);
  document.getElementById('miniTitle').textContent=new Intl.DateTimeFormat('es-CO',{month:'long',year:'numeric'}).format(first);
  const start=new Date(y,m,1);start.setDate(1-((start.getDay()+6)%7));
  let html='';
  for(let i=0;i<42;i++){
    const day=new Date(start);day.setDate(start.getDate()+i);const iso=Agenda.iso(day);
    const has=filteredEvents().some(e=>iso>=e.date&&iso<=(e.endDate||e.date));
    html+=`<button class="mini-day ${day.getMonth()!==m?'other':''} ${iso===Agenda.data.today?'today':''} ${iso===STATE.selectedDate?'selected':''} ${has?'has-events':''}" data-date="${iso}">${day.getDate()}</button>`
  }
  const grid=document.getElementById('miniGrid');grid.innerHTML=html;
  grid.onclick=e=>{const b=e.target.closest('[data-date]');if(!b)return;STATE.focusDate=b.dataset.date;STATE.selectedDate=b.dataset.date;persistPrefs();renderAll()}
}
function renderCalendarList(){
  document.getElementById('calendarList').innerHTML=Agenda.data.calendars.map(c=>`
    <label class="calendar-toggle"><input type="checkbox" data-calendar="${c.id}" ${c.visible!==false?'checked':''}>
      <span class="check" style="background:${c.visible!==false?c.color:'transparent'};border-color:${c.color}"></span>
      <span>${Agenda.escape(c.name)}</span></label>`).join('');
  document.getElementById('calendarList').onchange=e=>{
    const id=e.target.dataset.calendar;if(!id)return;const c=Agenda.calendar(id);c.visible=e.target.checked;Agenda.persist();renderAll()
  }
}
function setView(view){STATE.view=view;persistPrefs();renderStage();ERP.refreshIcons()}
function moveMonth(n){const d=Agenda.parseDate(STATE.focusDate);d.setMonth(d.getMonth()+n);STATE.focusDate=Agenda.iso(d);persistPrefs();renderAll()}
function movePeriod(n){
  const d=Agenda.parseDate(STATE.focusDate);
  if(STATE.view==='month')d.setMonth(d.getMonth()+n);
  else if(STATE.view==='week')d.setDate(d.getDate()+7*n);
  else d.setDate(d.getDate()+n);
  STATE.focusDate=Agenda.iso(d);STATE.selectedDate=STATE.focusDate;persistPrefs();renderAll()
}
function renderStage(){
  document.querySelectorAll('#viewSwitch [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===STATE.view));
  const d=Agenda.parseDate(STATE.focusDate);
  if(STATE.view==='month'){
    document.getElementById('periodTitle').textContent=new Intl.DateTimeFormat('es-CO',{month:'long',year:'numeric'}).format(d);
    document.getElementById('periodSubtitle').textContent='Vista mensual';
    renderMonth()
  }else if(STATE.view==='week'){
    const start=Agenda.startOfWeek(STATE.focusDate),end=Agenda.addDays(start,6);
    document.getElementById('periodTitle').textContent=`${Agenda.dateLabel(start,{day:'2-digit',month:'short'})} – ${Agenda.dateLabel(end,{day:'2-digit',month:'short',year:'numeric'})}`;
    document.getElementById('periodSubtitle').textContent='Plan semanal y bloques de tiempo';renderWeek(false)
  }else if(STATE.view==='day'){
    document.getElementById('periodTitle').textContent=Agenda.dateLabel(STATE.focusDate,{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    document.getElementById('periodSubtitle').textContent='Agenda detallada del día';renderWeek(true)
  }else{
    document.getElementById('periodTitle').textContent='Agenda consolidada';
    document.getElementById('periodSubtitle').textContent='Próximos 30 días';renderAgenda()
  }
}
function renderMonth(){
  const focus=Agenda.parseDate(STATE.focusDate),y=focus.getFullYear(),m=focus.getMonth();
  const start=new Date(y,m,1);start.setDate(1-((start.getDay()+6)%7));
  const days=[];for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);if(STATE.showWeekends||![0,6].includes(d.getDay()))days.push(d)}
  const cols=STATE.showWeekends?7:5;
  const names=STATE.showWeekends?['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']:['Lun','Mar','Mié','Jue','Vie'];
  const events=filteredEvents();
  document.getElementById('calendarStage').innerHTML=`<div class="month-weekdays" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${names.map(n=>`<span>${n}</span>`).join('')}</div>
    <div class="month-grid" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${days.map(d=>monthDayHtml(d,m,events)).join('')}</div>`;
  const grid=document.querySelector('.month-grid');
  grid.addEventListener('click',e=>{
    const ev=e.target.closest('[data-event]');if(ev){openEventDrawer(ev.dataset.event);return}
    const more=e.target.closest('[data-more-date]');if(more){STATE.selectedDate=more.dataset.moreDate;renderRightPanel();return}
    const day=e.target.closest('[data-date]');if(day){STATE.selectedDate=day.dataset.date;renderMiniCalendar();renderRightPanel()}
  });
  grid.addEventListener('dblclick',e=>{const day=e.target.closest('[data-date]');if(day)openEventForm(null,day.dataset.date)});
  grid.querySelectorAll('.month-event').forEach(el=>el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',el.dataset.event);el.classList.add('dragging')}));
  grid.querySelectorAll('.month-day').forEach(el=>{
    el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('drop-target')});
    el.addEventListener('dragleave',()=>el.classList.remove('drop-target'));
    el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('drop-target');const id=e.dataTransfer.getData('text/plain');rescheduleEvent(id,el.dataset.date)})
  })
}
function monthDayHtml(d,currentMonth,events){
  const iso=Agenda.iso(d),list=events.filter(e=>iso>=e.date&&iso<=(e.endDate||e.date)).sort(sortEvents);
  return `<div class="month-day ${d.getMonth()!==currentMonth?'other':''} ${iso===Agenda.data.today?'today':''} ${iso===STATE.selectedDate?'selected':''}" data-date="${iso}">
    <div class="month-day-head"><button class="day-number">${d.getDate()}</button>${list.length?`<span class="day-count">${list.length}</span>`:''}</div>
    <div class="month-events">${list.slice(0,4).map(e=>eventChip(e)).join('')}${list.length>4?`<button class="month-more" data-more-date="${iso}">+${list.length-4} más</button>`:''}</div></div>`
}
function eventChip(e){
  const color=Agenda.calendar(e.calendar).color;
  return `<button draggable="true" class="month-event ${e.status==='Cumplida'?'done':''} ${e.priority==='Crítica'?'critical':''}" style="--event-color:${color}" data-event="${e.id}" title="${Agenda.escape(Agenda.timeLabel(e)+' · '+e.title)}">${e.allDay?'':e.start+' '}${Agenda.escape(e.title)}</button>`
}
function renderWeek(singleDay){
  const days=singleDay?[STATE.focusDate]:Array.from({length:7},(_,i)=>Agenda.addDays(Agenda.startOfWeek(STATE.focusDate),i)).filter(date=>STATE.showWeekends||![0,6].includes(Agenda.parseDate(date).getDay()));
  const events=filteredEvents(),hourStart=6,hourEnd=19,hourPx=48;
  const allDay=days.map(date=>events.filter(e=>e.allDay&&date>=e.date&&date<=(e.endDate||e.date)));
  let columns=days.map(date=>{
    const list=events.filter(e=>!e.allDay&&date>=e.date&&date<=(e.endDate||e.date)).sort(sortEvents);
    return `<div class="time-column ${date===Agenda.data.today?'today':''}" data-date="${date}" style="height:${(hourEnd-hourStart)*hourPx}px">
      ${list.map(e=>timeEventHtml(e,hourStart,hourPx)).join('')}
      ${date===Agenda.data.today?currentTimeHtml(hourStart,hourEnd,hourPx):''}</div>`
  }).join('');
  document.getElementById('calendarStage').innerHTML=`<div class="week-shell" style="--days:${days.length}">
    <div class="week-header"><div class="timezone">COL</div>${days.map(date=>{const d=Agenda.parseDate(date);return `<div class="week-day-head ${date===Agenda.data.today?'today':''}"><strong>${new Intl.DateTimeFormat('es-CO',{weekday:'short'}).format(d)}</strong><span>${d.getDate()}</span></div>`}).join('')}</div>
    <div class="all-day-row"><div class="all-day-label">Todo el día</div>${allDay.map(list=>`<div class="all-day-cell">${list.map(eventChip).join('')}</div>`).join('')}</div>
    <div class="time-grid" style="grid-template-columns:52px repeat(${days.length},minmax(112px,1fr));height:${(hourEnd-hourStart)*hourPx}px">
      <div class="time-labels">${Array.from({length:hourEnd-hourStart+1},(_,i)=>`<span class="time-label" style="top:${i*hourPx}px">${String(hourStart+i).padStart(2,'0')}:00</span>`).join('')}</div>${columns}</div></div>`;
  document.getElementById('calendarStage').querySelectorAll('[data-event]').forEach(el=>el.onclick=e=>{e.stopPropagation();openEventDrawer(el.dataset.event)});
  document.getElementById('calendarStage').querySelectorAll('.time-column').forEach(col=>col.addEventListener('dblclick',e=>{
    if(e.target.closest('[data-event]'))return;const rect=col.getBoundingClientRect(),min=Math.max(0,Math.round(((e.clientY-rect.top)/hourPx*60)/30)*30);
    const total=hourStart*60+min;openEventForm(null,col.dataset.date,`${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`)
  }))
}
function timeEventHtml(e,hourStart,hourPx){
  const top=(Agenda.minutes(e.start)-hourStart*60)/60*hourPx,height=Math.max(20,Agenda.duration(e)*hourPx),color=Agenda.calendar(e.calendar).color;
  const conflicts=Agenda.conflicts(e,e.id).length;
  return `<button class="time-event ${conflicts?'conflict':''}" data-event="${e.id}" style="top:${top}px;height:${height}px;--event-color:${color}"><strong>${Agenda.escape(e.title)}</strong><span>${e.start}–${e.end}${conflicts?' · conflicto':''}</span></button>`
}
function currentTimeHtml(start,end,px){
  const now=new Date(),m=now.getHours()*60+now.getMinutes();if(m<start*60||m>end*60)return'';
  return `<span class="current-time" style="top:${(m-start*60)/60*px}px"></span>`
}
function renderAgenda(){
  const from=STATE.focusDate,to=Agenda.addDays(from,30),events=filteredEvents().filter(e=>(e.endDate||e.date)>=from&&e.date<=to).sort(sortEvents);
  const groups={};events.forEach(e=>(groups[e.date]??=[]).push(e));
  document.getElementById('calendarStage').innerHTML=`<div class="agenda-view">${Object.entries(groups).map(([date,list])=>`
    <section><div class="agenda-group-title">${Agenda.dateLabel(date,{weekday:'long',day:'2-digit',month:'long'})}</div>
      ${list.map(e=>{const color=Agenda.calendar(e.calendar).color;return `<div class="agenda-event-row" data-event="${e.id}" style="--event-color:${color}">
        <div class="agenda-time">${Agenda.timeLabel(e)}</div><div class="agenda-color"></div><div class="agenda-copy"><strong>${Agenda.escape(e.title)}</strong><p>${Agenda.escape(Agenda.office(e.office).name)} · ${Agenda.escape(e.location||'Sin lugar')}</p></div>
        <div class="agenda-meta"><span class="status ${statusClass(e.status)}">${e.status}</span>${Agenda.peopleHtml(e.assignees||[],3)}</div></div>`}).join('')}</section>`).join('')||'<div class="empty-mini">No hay actividades en los próximos 30 días.</div>'}</div>`;
  document.getElementById('calendarStage').querySelectorAll('[data-event]').forEach(el=>el.onclick=()=>openEventDrawer(el.dataset.event))
}
function sortEvents(a,b){return `${a.date}${a.allDay?'00:00':a.start}`.localeCompare(`${b.date}${b.allDay?'00:00':b.start}`)}
function statusClass(s){return s==='Cumplida'?'status-success':s==='En riesgo'?'status-danger':s==='En curso'?'status-info':s==='Cancelada'?'status-neutral':'status-warning'}
function renderRightPanel(){
  const date=STATE.selectedDate,list=filteredEvents().filter(e=>date>=e.date&&date<=(e.endDate||e.date)).sort(sortEvents);
  document.getElementById('selectedDateTitle').textContent=date===Agenda.data.today?'Hoy':Agenda.dateLabel(date,{weekday:'long',day:'2-digit',month:'long'});
  document.getElementById('selectedDateMeta').textContent=`${list.length} actividades · ${list.reduce((s,e)=>s+Agenda.duration(e),0).toFixed(1)} h programadas`;
  document.getElementById('daySummary').innerHTML=list.map(e=>{const color=Agenda.calendar(e.calendar).color;return `<article class="day-event" data-event="${e.id}" style="--event-color:${color}">
    <div class="day-event-time">${Agenda.timeLabel(e)}</div><strong>${Agenda.escape(e.title)}</strong><div class="day-event-meta"><span class="tag">${Agenda.escape(Agenda.office(e.office).name)}</span>${Agenda.peopleHtml(e.assignees||[],2)}</div></article>`}).join('')||'<div class="empty-mini">La fecha está libre. Haz doble clic en el calendario para programar.</div>';
  document.querySelectorAll('#daySummary [data-event]').forEach(el=>el.onclick=()=>openEventDrawer(el.dataset.event));
  const deadlines=filteredEvents().filter(e=>e.type==='deadline'&&e.status!=='Cumplida'&&(e.endDate||e.date)>=Agenda.data.today).sort(sortEvents).slice(0,4);
  document.getElementById('deadlineList').innerHTML=deadlines.map(e=>`<div class="deadline-item" data-event="${e.id}"><div class="deadline-date">${Agenda.parseDate(e.date).getDate()}</div><div><strong>${Agenda.escape(e.title)}</strong><span>${Agenda.dateLabel(e.date)} · ${e.progress||0}%</span></div></div>`).join('')||'<div class="empty-mini">Sin fechas límite próximas.</div>';
  document.querySelectorAll('#deadlineList [data-event]').forEach(el=>el.onclick=()=>openEventDrawer(el.dataset.event));
  const persons=Agenda.data.people.slice().sort((a,b)=>b.workload-a.workload).slice(0,4);
  document.getElementById('capacityMini').innerHTML=persons.map(p=>{const pct=Math.round(p.workload/p.capacity*100);return `<div class="capacity-row"><span class="avatar">${p.avatar}</span><div class="capacity-copy"><strong>${Agenda.escape(p.name.split(' ').slice(0,2).join(' '))}</strong><div class="progress ${pct>100?'danger':pct>85?'warning':'success'}"><span style="width:${Math.min(pct,100)}%"></span></div></div><span>${pct}%</span></div>`}).join('')
}
function renderSmart(){
  const people=Agenda.data.people.slice().sort((a,b)=>(a.workload/a.capacity)-(b.workload/b.capacity));
  const light=people[0],heavy=people.at(-1);
  document.getElementById('smartMessage').textContent=`${light.name.split(' ')[0]} tiene ${Math.max(0,light.capacity-light.workload)} h disponibles. ${heavy.name.split(' ')[0]} está al ${Math.round(heavy.workload/heavy.capacity*100)}% de capacidad.`
}
function showSmartSuggestion(){
  const slots=Agenda.findSlots(['P001','P003'],Agenda.data.today,60,5);
  if(slots.length){const s=slots[0];ERP.toast(`Espacio sugerido: ${Agenda.dateLabel(s.date)} de ${s.start} a ${s.end}`)}
  else ERP.toast('No se encontraron espacios comunes','error')
}
function openEventForm(id=null,date=STATE.selectedDate,start='08:00'){
  STATE.editingId=id;
  const f=document.getElementById('eventForm');f.reset();
  document.getElementById('eventModalTitle').textContent=id?'Editar actividad':'Nueva actividad';
  document.querySelectorAll('#assigneePicker input,#attendeePicker input').forEach(x=>x.checked=false);
  const e=id?Agenda.data.events.find(x=>x.id===id):null;
  const base=e||{date,endDate:date,start,end:addMinutes(start,60),type:'task',calendar:'CAL-INST',office:'SG',priority:'Media',visibility:'Institucional',status:'Programada',recurrence:'No se repite',estimatedHours:1,assignees:['P004'],attendees:[]};
  Object.entries(base).forEach(([k,v])=>{
    const input=f.elements[k];if(!input||Array.isArray(v)||typeof v==='object')return;
    if(input.type==='checkbox')input.checked=!!v;else input.value=v??''
  });
  f.elements.id.value=e?.id||'';
  (base.assignees||[]).forEach(id=>{const x=document.getElementById(`assignees-${id}`);if(x)x.checked=true});
  (base.attendees||[]).forEach(id=>{const x=document.getElementById(`attendees-${id}`);if(x)x.checked=true});
  toggleTimeFields();checkFormConflicts();ERP.open('eventModal')
}
function addMinutes(time,n){const m=Agenda.minutes(time)+n;return `${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
function formEvent(){
  const f=document.getElementById('eventForm'),fd=new FormData(f),allDay=f.elements.allDay.checked;
  return {
    id:fd.get('id')||Agenda.uid('EVT'),title:fd.get('title')?.trim(),date:fd.get('date'),endDate:fd.get('endDate')||fd.get('date'),
    start:allDay?'00:00':fd.get('start'),end:allDay?'23:59':fd.get('end'),allDay,type:fd.get('type'),calendar:fd.get('calendar'),
    office:fd.get('office'),assignees:fd.getAll('assignees'),attendees:fd.getAll('attendees'),status:fd.get('status'),
    priority:fd.get('priority'),location:fd.get('location')?.trim(),meetingUrl:fd.get('meetingUrl')?.trim(),description:fd.get('description')?.trim(),
    progress:STATE.editingId?(Agenda.data.events.find(x=>x.id===STATE.editingId)?.progress||0):0,visibility:fd.get('visibility'),
    reminders:[Number(fd.get('reminder'))],recurrence:fd.get('recurrence'),checklist:STATE.editingId?(Agenda.data.events.find(x=>x.id===STATE.editingId)?.checklist||[]):[],
    comments:STATE.editingId?(Agenda.data.events.find(x=>x.id===STATE.editingId)?.comments||[]):[],dependencies:STATE.editingId?(Agenda.data.events.find(x=>x.id===STATE.editingId)?.dependencies||[]):[],
    attachments:STATE.editingId?(Agenda.data.events.find(x=>x.id===STATE.editingId)?.attachments||[]):[],estimatedHours:Number(fd.get('estimatedHours')||0),actualHours:STATE.editingId?(Agenda.data.events.find(x=>x.id===STATE.editingId)?.actualHours||0):0
  }
}
function toggleTimeFields(){
  const all=document.getElementById('eventForm').elements.allDay.checked;
  document.querySelectorAll('.time-field').forEach(x=>x.style.opacity=all?'.45':'1');
  document.getElementById('eventForm').elements.start.disabled=all;document.getElementById('eventForm').elements.end.disabled=all
}
function checkFormConflicts(){
  toggleTimeFields();const f=document.getElementById('eventForm');if(!f.elements.date.value)return;
  const e=formEvent(),conflicts=Agenda.conflicts(e,STATE.editingId||'');const box=document.getElementById('conflictAlert');
  box.classList.toggle('hidden',!conflicts.length);
  box.innerHTML=conflicts.length?`<strong>Conflicto detectado:</strong> coincide con ${conflicts.map(x=>Agenda.escape(x.title)).join(', ')}. Puedes guardar o solicitar otro horario.`:''
}
function saveEvent(ev){
  ev.preventDefault();const item=formEvent();
  if(!item.title||!item.date)return ERP.toast('Completa el nombre y la fecha','error');
  if(!item.allDay&&Agenda.minutes(item.end)<=Agenda.minutes(item.start))return ERP.toast('La hora final debe ser posterior a la inicial','error');
  const isNew=!STATE.editingId,series=Agenda.createOccurrences(item,item.recurrence,isNew?6:1);
  series.forEach(x=>Agenda.upsert(x));ERP.close('eventModal');STATE.focusDate=item.date;STATE.selectedDate=item.date;persistPrefs();renderAll();
  ERP.toast(isNew?(series.length>1?`Actividad creada con ${series.length} repeticiones`:'Actividad programada'):'Actividad actualizada')
}
function suggestSlotInForm(){
  const e=formEvent(),people=[...e.assignees,...e.attendees];if(!people.length)return ERP.toast('Selecciona al menos una persona','error');
  const duration=Math.max(30,Agenda.minutes(e.end)-Agenda.minutes(e.start)),slots=Agenda.findSlots(people,e.date,duration,7);
  if(!slots.length)return ERP.toast('No hay espacios comunes disponibles','error');
  const s=slots[0],f=document.getElementById('eventForm');f.elements.date.value=s.date;f.elements.endDate.value=s.date;f.elements.start.value=s.start;f.elements.end.value=s.end;checkFormConflicts();
  ERP.toast(`Horario sugerido: ${Agenda.dateLabel(s.date)} ${s.start}`)
}
function rescheduleEvent(id,date){
  const e=Agenda.data.events.find(x=>x.id===id);if(!e)return;
  const days=Math.round((Agenda.parseDate(date)-Agenda.parseDate(e.date))/86400000);e.date=date;e.endDate=Agenda.addDays(e.endDate||e.date,days);Agenda.persist();STATE.selectedDate=date;renderAll();ERP.toast('Actividad reprogramada')
}
function openEventDrawer(id){
  const e=Agenda.data.events.find(x=>x.id===id);if(!e)return;const cal=Agenda.calendar(e.calendar),people=[...(e.assignees||[]),...(e.attendees||[])];
  document.getElementById('drawerTitle').textContent=e.id;
  document.getElementById('eventDetail').innerHTML=`<div class="event-hero" style="--event-color:${cal.color}">
    <div class="event-hero-top"><span class="status ${statusClass(e.status)}">${e.status}</span><span class="tag">${e.priority}</span></div>
    <h2>${Agenda.escape(e.title)}</h2><p>${Agenda.escape(Agenda.type(e.type).name)} · ${Agenda.escape(cal.name)}</p>
    <div class="detail-grid"><div class="detail-box"><span>Fecha y hora</span><strong>${Agenda.dateLabel(e.date,{weekday:'short',day:'2-digit',month:'short'})} · ${Agenda.timeLabel(e)}</strong></div>
    <div class="detail-box"><span>Dependencia</span><strong>${Agenda.escape(Agenda.office(e.office).name)}</strong></div>
    <div class="detail-box"><span>Lugar</span><strong>${Agenda.escape(e.location||'Sin ubicación')}</strong></div>
    <div class="detail-box"><span>Visibilidad</span><strong>${Agenda.escape(e.visibility||'Institucional')}</strong></div></div></div>
    <div class="detail-section"><h3>Avance de la actividad</h3><div class="progress ${e.progress>=100?'success':e.status==='En riesgo'?'danger':'warning'}"><span style="width:${Math.min(e.progress||0,100)}%"></span></div><div class="inline-actions" style="justify-content:space-between;margin-top:5px"><small>${e.progress||0}% completado</small><small>${e.actualHours||0} h de ${e.estimatedHours||0} h</small></div></div>
    <div class="detail-section"><h3>Personas vinculadas</h3><div class="inline-actions">${people.map(id=>{const p=Agenda.person(id);return `<span class="person-chip"><span class="avatar">${p.avatar}</span>${Agenda.escape(p.name)}</span>`}).join('')||'<span class="muted">Sin personas asignadas</span>'}</div></div>
    <div class="detail-section"><h3>Descripción</h3><p class="muted" style="font-size:9.5px">${Agenda.escape(e.description||'Sin descripción')}</p></div>
    <div class="detail-section"><h3>Lista de verificación</h3><div id="drawerChecklist">${(e.checklist||[]).map((x,i)=>`<label class="check-row"><input type="checkbox" data-check="${i}" ${x.done?'checked':''}><span>${Agenda.escape(x.text)}</span></label>`).join('')||'<div class="empty-mini">No hay pasos definidos.</div>'}</div>
      <div class="inline-actions" style="margin-top:7px"><input id="newCheckText" class="input" placeholder="Agregar paso…" style="flex:1;min-height:31px"><button class="btn btn-secondary btn-sm" data-add-check="${e.id}">Agregar</button></div></div>
    <div class="detail-section"><h3>Comentarios</h3>${(e.comments||[]).map(c=>`<div class="comment"><strong>${Agenda.escape(c.author)}</strong><span>${new Date(c.at).toLocaleString('es-CO')}</span><p>${Agenda.escape(c.text)}</p></div>`).join('')||'<div class="empty-mini">Sin comentarios.</div>'}
      <div class="inline-actions" style="margin-top:7px"><input id="newCommentText" class="input" placeholder="Escribe una actualización…" style="flex:1;min-height:31px"><button class="btn btn-secondary btn-sm" data-add-comment="${e.id}">Enviar</button></div></div>
    <div class="split-line"></div><div class="inline-actions">
      <button class="btn btn-primary btn-sm" data-complete="${e.id}"><i data-lucide="circle-check"></i>${e.status==='Cumplida'?'Reabrir':'Marcar cumplida'}</button>
      <button class="btn btn-secondary btn-sm" data-edit="${e.id}"><i data-lucide="pencil"></i>Editar</button>
      <button class="btn btn-danger btn-sm" data-delete="${e.id}"><i data-lucide="trash-2"></i>Eliminar</button></div>`;
  const detail=document.getElementById('eventDetail');
  detail.querySelectorAll('[data-check]').forEach(x=>x.onchange=()=>{e.checklist[Number(x.dataset.check)].done=x.checked;e.progress=e.checklist.length?Agenda.percent(e.checklist.filter(a=>a.done).length,e.checklist.length):e.progress;Agenda.persist();renderAll();openEventDrawer(id)});
  detail.querySelector('[data-add-check]').onclick=()=>{const t=document.getElementById('newCheckText').value.trim();if(t){e.checklist??=[];e.checklist.push({text:t,done:false});Agenda.persist();openEventDrawer(id)}};
  detail.querySelector('[data-add-comment]').onclick=()=>{const t=document.getElementById('newCommentText').value.trim();if(t){e.comments??=[];e.comments.push({author:'Usuario institucional',at:new Date().toISOString(),text:t});Agenda.persist();openEventDrawer(id)}};
  detail.querySelector('[data-complete]').onclick=()=>{e.status=e.status==='Cumplida'?'Programada':'Cumplida';e.progress=e.status==='Cumplida'?100:Math.min(e.progress||0,95);Agenda.persist();renderAll();openEventDrawer(id);ERP.toast(e.status==='Cumplida'?'Actividad completada':'Actividad reabierta')};
  detail.querySelector('[data-edit]').onclick=()=>{closeDrawer();openEventForm(id)};
  detail.querySelector('[data-delete]').onclick=()=>{if(confirm('¿Eliminar esta actividad?')){Agenda.remove(id);closeDrawer();renderAll();ERP.toast('Actividad eliminada')}};
  ERP.open('eventDrawerBackdrop');document.getElementById('eventDrawer').classList.remove('hidden');ERP.refreshIcons()
}
function closeDrawer(){ERP.close('eventDrawerBackdrop');document.getElementById('eventDrawer').classList.add('hidden')}
function openAvailability(){
  document.querySelectorAll('#slotPeoplePicker input').forEach(x=>x.checked=false);
  ['P001','P003'].forEach(id=>{const x=document.getElementById(`slotPeople-${id}`);if(x)x.checked=true});
  document.getElementById('slotDate').value=STATE.selectedDate;renderSlots();ERP.open('availabilityModal')
}
function renderSlots(){
  const people=[...document.querySelectorAll('#slotPeoplePicker input:checked')].map(x=>x.value),date=document.getElementById('slotDate').value||Agenda.data.today,duration=Number(document.getElementById('slotDuration').value);
  const slots=Agenda.findSlots(people,date,duration,10);
  document.getElementById('slotResults').innerHTML=slots.map(s=>`<button class="slot-card" data-slot="${s.date}|${s.start}|${s.end}"><strong>${Agenda.dateLabel(s.date,{weekday:'long',day:'2-digit',month:'short'})}</strong><span>${s.start} – ${s.end} · ${duration} min</span></button>`).join('')||'<div class="empty-mini">No hay espacios comunes con los criterios actuales.</div>';
  document.querySelectorAll('[data-slot]').forEach(x=>x.onclick=()=>{const [d,s,e]=x.dataset.slot.split('|');ERP.close('availabilityModal');openEventForm(null,d,s);document.getElementById('eventForm').elements.end.value=e;people.forEach(id=>{const c=document.getElementById(`assignees-${id}`);if(c)c.checked=true});checkFormConflicts()});
  ERP.refreshIcons()
}
function openCommand(){
  document.getElementById('commandInput').value='';renderCommands();ERP.open('commandBackdrop');setTimeout(()=>document.getElementById('commandInput').focus(),30)
}
function renderCommands(){
  const q=document.getElementById('commandInput').value.toLowerCase().trim();
  const actions=[
    {icon:'plus',label:'Crear nueva actividad',key:'N',run:()=>openEventForm()},
    {icon:'calendar-check',label:'Ir a hoy',key:'T',run:()=>{STATE.focusDate=Agenda.data.today;renderAll()}},
    {icon:'clock',label:'Buscar horario disponible',key:'',run:openAvailability},
    {icon:'list-checks',label:'Abrir gestión de actividades',key:'',href:'actividades/index.html'},
    {icon:'gauge',label:'Revisar carga de trabajo',key:'',href:'carga-trabajo/index.html'}
  ];
  const eventItems=filteredEvents().filter(e=>!q||e.title.toLowerCase().includes(q)).slice(0,8).map(e=>({icon:Agenda.type(e.type).icon,label:e.title,key:Agenda.dateLabel(e.date),run:()=>openEventDrawer(e.id)}));
  const items=[...actions.filter(a=>!q||a.label.toLowerCase().includes(q)),...eventItems];
  document.getElementById('commandList').innerHTML=items.map((a,i)=>`<div class="command-item ${i===0?'active':''}" data-command="${i}"><i data-lucide="${a.icon}"></i><span>${Agenda.escape(a.label)}</span>${a.key?`<kbd>${Agenda.escape(a.key)}</kbd>`:''}</div>`).join('');
  document.querySelectorAll('[data-command]').forEach(el=>el.onclick=()=>{const a=items[Number(el.dataset.command)];ERP.close('commandBackdrop');if(a.href)location.href=a.href;else a.run?.()});ERP.refreshIcons()
}
function keyboardShortcuts(e){
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand();return}
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
  const k=e.key.toLowerCase();
  if(k==='n')openEventForm();else if(k==='t'){STATE.focusDate=Agenda.data.today;STATE.selectedDate=Agenda.data.today;renderAll()}
  else if(k==='m')setView('month');else if(k==='w')setView('week');else if(k==='d')setView('day');else if(k==='a')setView('agenda');else if(k==='/'){e.preventDefault();document.getElementById('eventSearch').focus()}
}
function togglePopover(id,anchor){
  const el=document.getElementById(id),open=el.classList.contains('hidden');hidePopovers();if(!open)return;
  const r=anchor.getBoundingClientRect();el.style.top=`${r.bottom+6}px`;el.style.left=`${Math.max(8,r.right-190)}px`;el.classList.remove('hidden');ERP.refreshIcons()
}
function hidePopovers(){document.querySelectorAll('.popover').forEach(x=>x.classList.add('hidden'))}
async function importICS(e){
  const file=e.target.files[0];if(!file)return;const text=await file.text(),blocks=text.split('BEGIN:VEVENT').slice(1);
  let count=0;blocks.forEach((b,i)=>{
    const line=name=>b.split(/\r?\n/).find(x=>x.startsWith(name))?.split(':').slice(1).join(':')||'';
    const raw=line('DTSTART'),date=raw.slice(0,8),time=raw.includes('T')?raw.slice(9,13):'0800';
    if(!date)return;
    Agenda.upsert({id:Agenda.uid('ICS'),title:line('SUMMARY')||`Evento importado ${i+1}`,date:`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`,endDate:`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`,
      start:`${time.slice(0,2)}:${time.slice(2,4)}`,end:addMinutes(`${time.slice(0,2)}:${time.slice(2,4)}`,60),allDay:!raw.includes('T'),type:'meeting',calendar:'CAL-INST',office:'SG',assignees:[],attendees:[],
      status:'Programada',priority:'Media',location:line('LOCATION'),meetingUrl:'',description:line('DESCRIPTION'),progress:0,visibility:'Institucional',reminders:[],recurrence:'No se repite',checklist:[],comments:[],dependencies:[],attachments:[],estimatedHours:1,actualHours:0});count++
  });
  renderAll();ERP.toast(`${count} eventos importados`);e.target.value=''
}
window.openEventDrawer=openEventDrawer;
