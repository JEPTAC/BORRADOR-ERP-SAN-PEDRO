(function(){
"use strict";
const VERSION="30.0.0";
const body=document.body;
const page=body.dataset.page||"dashboard";
const moduleRoot=new URL(body.dataset.moduleBase||"./",location.href);
const erpRoot=new URL(body.dataset.erpRoot||"../../../",location.href);
const url=(relative)=>new URL(relative,moduleRoot).href;
const rootUrl=(relative)=>new URL(relative,erpRoot).href;
const $=(selector,context=document)=>context.querySelector(selector);
const $$=(selector,context=document)=>Array.from(context.querySelectorAll(selector));
const escapeHtml=(value)=>String(value??"").replace(/[&<>'"]/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const normalize=(value)=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const pad=(value)=>String(value).padStart(2,"0");
const isoDate=(date)=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
const parseLocal=(value)=>{
  if(value instanceof Date)return value;
  const text=String(value||"");
  const [datePart,timePart="00:00"]=text.split("T");
  const [y,m,d]=datePart.split("-").map(Number);
  const [hh,mm]=timePart.split(":").map(Number);
  return new Date(y,m-1,d,hh||0,mm||0,0,0);
};
const formatDate=(value)=>new Intl.DateTimeFormat("es-CO",{day:"2-digit",month:"short",year:"numeric"}).format(parseLocal(value));
const formatLong=(value)=>new Intl.DateTimeFormat("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(parseLocal(value));
const formatTime=(value)=>new Intl.DateTimeFormat("es-CO",{hour:"2-digit",minute:"2-digit",hour12:true}).format(parseLocal(value));
const formatDateTime=(value)=>new Intl.DateTimeFormat("es-CO",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true}).format(parseLocal(value));
const monthLabel=(date)=>new Intl.DateTimeFormat("es-CO",{month:"long",year:"numeric"}).format(date);
const initials=(name)=>String(name||"Usuario").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();
const slug=(value)=>normalize(value).replace(/[^a-z0-9]+/g,"").trim();
const uid=(prefix)=>`${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
const iconPaths={
 dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
 list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 building:'<path d="M4 21V8l8-4 8 4v13M8 10h2m4 0h2M8 14h2m4 0h2M9 21v-4h6v4"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 chart:'<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 location:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/>',
 edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
 x:'<path d="m6 6 12 12M18 6 6 18"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/>',
 filter:'<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
 chevronLeft:'<path d="m15 18-6-6 6-6"/>',
 chevronRight:'<path d="m9 18 6-6-6-6"/>',
 room:'<path d="M4 21V3h12v18M8 7h4M8 11h4M8 15h4M16 9h4v12"/>',
 laptop:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M2 21h20"/>',
 car:'<path d="m5 17-2-2 2-7h14l2 7-2 2"/><path d="M5 17v3m14-3v3M5 13h14"/><circle cx="7" cy="16" r="1"/><circle cx="17" cy="16" r="1"/>',
 flag:'<path d="M5 21V4m0 1h12l-2 4 2 4H5"/>',
 clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6m-6 4h6m-6 4h4"/>',
 save:'<path d="M5 3h12l2 2v16H5z"/><path d="M8 3v6h8V3M8 17h8"/>',
 trash:'<path d="M4 7h16m-10 4v6m4-6v6M9 7V4h6v3m-9 0 1 14h10l1-14"/>',
 copy:'<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
 refresh:'<path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-3L4 8m2 7a7 7 0 0 0 12 3l2-2"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
};
function icon(name,cls=""){
 const path=iconPaths[name]||iconPaths.info;
 return `<svg class="cal-icon ${cls}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
}
const seed={
 events:[
  {id:"EVT-2026-081",title:"Comité Institucional de Gestión y Desempeño",description:"Seguimiento a compromisos MIPG, planes institucionales y decisiones de gestión.",start:"2026-08-05T09:00",end:"2026-08-05T11:00",category:"Reunión",status:"Confirmado",dependency:"Secretaría General",responsible:"Einar González",location:"Sala de Juntas Principal",resourceId:"RES-01",attendees:12,priority:"Alta",public:false,notes:"Presentar matriz consolidada de compromisos."},
  {id:"EVT-2026-082",title:"Atención descentralizada a la ciudadanía",description:"Jornada de orientación y recepción de solicitudes de la comunidad.",start:"2026-08-06T08:00",end:"2026-08-06T12:00",category:"Atención ciudadana",status:"Programado",dependency:"Gobierno",responsible:"Equipo de Atención",location:"Corregimiento Presidente",resourceId:"RES-04",attendees:35,priority:"Media",public:true,notes:"Llevar formatos y equipo portátil."},
  {id:"EVT-2026-083",title:"Vencimiento de informe trimestral",description:"Fecha límite para consolidar y remitir el informe de seguimiento institucional.",start:"2026-08-07T16:00",end:"2026-08-07T17:00",category:"Vencimiento",status:"Programado",dependency:"Control Interno",responsible:"Profesional de Control",location:"Entrega digital",resourceId:"",attendees:4,priority:"Alta",public:false,notes:"Validar firmas antes de radicar."},
  {id:"EVT-2026-084",title:"Mesa técnica de transparencia",description:"Revisión de documentos pendientes y actualización del portal institucional.",start:"2026-08-11T14:00",end:"2026-08-11T16:00",category:"Reunión",status:"Confirmado",dependency:"Secretaría General",responsible:"Juan E. Pérez",location:"Sala TIC",resourceId:"RES-02",attendees:7,priority:"Media",public:false,notes:"Llevar matriz ITA actualizada."},
  {id:"EVT-2026-085",title:"Consejo de Gobierno",description:"Sesión ordinaria para seguimiento al plan de desarrollo y asuntos estratégicos.",start:"2026-08-13T08:30",end:"2026-08-13T11:30",category:"Institucional",status:"Confirmado",dependency:"Despacho",responsible:"Despacho del Alcalde",location:"Despacho Municipal",resourceId:"RES-01",attendees:16,priority:"Alta",public:false,notes:"Convocatoria confirmada."},
  {id:"EVT-2026-086",title:"Rendición de cuentas sector salud",description:"Espacio público de diálogo y presentación de resultados del sector.",start:"2026-08-18T15:00",end:"2026-08-18T17:30",category:"Evento público",status:"Programado",dependency:"Salud y Bienestar",responsible:"Secretaría de Salud",location:"Casa de la Cultura",resourceId:"RES-03",attendees:80,priority:"Alta",public:true,notes:"Publicar convocatoria con cinco días de anticipación."},
  {id:"EVT-2026-087",title:"Capacitación en gestión documental",description:"Jornada práctica para organización de expedientes y transferencias documentales.",start:"2026-08-21T09:00",end:"2026-08-21T12:00",category:"Capacitación",status:"Programado",dependency:"Secretaría General",responsible:"Archivo Central",location:"Auditorio Municipal",resourceId:"RES-03",attendees:28,priority:"Media",public:false,notes:"Confirmar asistencia de enlaces documentales."},
  {id:"EVT-2026-078",title:"Revisión de agenda regulatoria",description:"Validación técnica de proyectos normativos previstos para la vigencia.",start:"2026-08-03T10:00",end:"2026-08-03T12:00",category:"Reunión",status:"Realizado",dependency:"Jurídica",responsible:"Oficina Jurídica",location:"Sala de Juntas Principal",resourceId:"RES-01",attendees:9,priority:"Media",public:false,notes:"Acta y compromisos registrados."}
 ],
 resources:[
  {id:"RES-01",name:"Sala de Juntas Principal",type:"Sala",capacity:18,location:"Primer piso",features:"Pantalla, videoconferencia, aire acondicionado",status:"Disponible",icon:"room"},
  {id:"RES-02",name:"Sala TIC",type:"Sala",capacity:8,location:"Segundo piso",features:"Pantalla, red cableada, tablero",status:"Disponible",icon:"laptop"},
  {id:"RES-03",name:"Auditorio Municipal",type:"Auditorio",capacity:110,location:"Casa de la Cultura",features:"Sonido, proyección, tarima",status:"Disponible",icon:"building"},
  {id:"RES-04",name:"Vehículo institucional 01",type:"Vehículo",capacity:5,location:"Parqueadero municipal",features:"Desplazamiento territorial",status:"Disponible",icon:"car"},
  {id:"RES-05",name:"Kit de transmisión",type:"Equipo",capacity:1,location:"Comunicaciones",features:"Cámara, trípode, micrófonos",status:"Mantenimiento",icon:"laptop"}
 ],
 commitments:[
  {id:"CMP-031",title:"Publicar acta del Comité de Gestión",eventId:"EVT-2026-081",responsible:"Secretaría Técnica",due:"2026-08-07",priority:"Alta",done:false},
  {id:"CMP-032",title:"Consolidar documentos pendientes de transparencia",eventId:"EVT-2026-084",responsible:"Juan E. Pérez",due:"2026-08-10",priority:"Alta",done:false},
  {id:"CMP-033",title:"Enviar convocatoria de rendición de cuentas",eventId:"EVT-2026-086",responsible:"Comunicaciones",due:"2026-08-12",priority:"Media",done:false},
  {id:"CMP-034",title:"Cargar evidencia de atención descentralizada",eventId:"EVT-2026-082",responsible:"Equipo de Atención",due:"2026-08-08",priority:"Media",done:false},
  {id:"CMP-030",title:"Registrar compromisos de agenda regulatoria",eventId:"EVT-2026-078",responsible:"Oficina Jurídica",due:"2026-08-04",priority:"Media",done:true}
 ]
};
const keys={events:"sp_calendar_events_v30",resources:"sp_calendar_resources_v30",commitments:"sp_calendar_commitments_v30"};
function read(key,fallback){
 try{const parsed=JSON.parse(localStorage.getItem(key));return Array.isArray(parsed)?parsed:structuredClone(fallback)}catch{return structuredClone(fallback)}
}
function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
function migrate(){
 if(!localStorage.getItem(keys.events)){
  const legacy=["erp-calendar-events","calendar-events","sp_calendar_events_v29"];
  for(const key of legacy){
   try{const data=JSON.parse(localStorage.getItem(key));if(Array.isArray(data)&&data.length){write(keys.events,data);break}}catch{}
  }
 }
}
migrate();
let searchTimer=null;
const state={
 events:read(keys.events,seed.events),
 resources:read(keys.resources,seed.resources),
 commitments:read(keys.commitments,seed.commitments),
 month:new Date(2026,7,1),
 selectedDate:"2026-08-05",
 search:"",status:"Todos",category:"Todas",dependency:"Todas"
};
function persist(){write(keys.events,state.events);write(keys.resources,state.resources);write(keys.commitments,state.commitments)}
const nav=[
 ["dashboard","dashboard","Centro de agenda",""],
 ["agenda","calendar","Calendario",""],
 ["events","list","Eventos",String(state.events.filter(e=>!["Realizado","Cancelado"].includes(e.status)).length)],
 ["new","plus","Nuevo evento",""],
 ["resources","building","Espacios y recursos",""],
 ["commitments","check","Compromisos",String(state.commitments.filter(c=>!c.done).length)],
 ["reports","chart","Reportes",""]
];
const pageMeta={
 dashboard:["Centro de agenda","Calendario Institucional"],agenda:["Calendario","Planeación mensual"],events:["Eventos","Gestión institucional"],new:["Nuevo evento","Programación"],resources:["Espacios y recursos","Reservas institucionales"],commitments:["Compromisos","Seguimiento"],reports:["Reportes","Analítica de agenda"]
};
function statusPill(status){return `<span class="cal-status cal-status-${slug(status)}">${escapeHtml(status)}</span>`}
function navMarkup(){
 return nav.map(([id,ico,label,badge],index)=>`${index===0?'<div class="cal-nav-label">Calendario</div>':''}${index===4?'<div class="cal-nav-label">Administración</div>':''}<a class="cal-nav-item ${page===id?'active':''}" href="${id==='dashboard'?url('./'):url(`./${id==='events'?'eventos':id==='new'?'nuevo-evento':id==='resources'?'espacios':id==='commitments'?'compromisos':id==='reports'?'reportes':'agenda'}/`)}">${icon(ico)}<span>${label}</span>${badge?`<span class="cal-nav-badge">${badge}</span>`:''}</a>`).join('');
}
function shell(content){
 const meta=pageMeta[page]||pageMeta.dashboard;
 return `<div class="cal-app">
  <aside class="cal-sidebar" id="calSidebar">
   <a class="cal-brand" href="${url('./')}"><span class="cal-brand-mark"><img src="${url('./shared/san-pedro.svg')}" alt="Alcaldía de San Pedro"></span><span class="cal-brand-copy"><strong>Alcaldía de San Pedro</strong><span>Valle del Cauca</span></span></a>
   <div class="cal-context"><small>Secretaría General</small><strong>Calendario Institucional</strong></div>
   <nav class="cal-nav" aria-label="Navegación del calendario">${navMarkup()}</nav>
   <div class="cal-sidebar-footer"><div class="cal-user"><span class="cal-avatar">JP</span><span><strong>Juan E. Pérez</strong><span>Administrador de agenda</span></span></div></div>
  </aside>
  <div class="cal-mobile-backdrop" id="calMobileBackdrop"></div>
  <main class="cal-main">
   <header class="cal-topbar">
    <div class="cal-topbar-left"><button class="cal-top-action cal-menu-btn" id="calMenuBtn" type="button" aria-label="Abrir navegación">${icon('menu')}</button><div class="cal-topbar-title"><strong>${meta[0]}</strong><span>${meta[1]} · V${VERSION}</span></div></div>
    <div class="cal-topbar-actions"><a class="cal-top-action" href="${rootUrl('launcher/index.html')}" aria-label="Todas las dependencias">${icon('building')}</a><button class="cal-top-action" type="button" id="calBell" aria-label="Notificaciones">${icon('bell')}</button></div>
   </header>
   <div class="cal-content">${content}</div>
  </main>
  <div class="cal-backdrop" id="calModalBackdrop" aria-hidden="true"><section class="cal-modal" id="calModal" role="dialog" aria-modal="true" aria-labelledby="calModalTitle"></section></div>
  <div class="cal-toast" id="calToast" role="status" aria-live="polite"></div>
 </div>`;
}
function breadcrumb(current){return `<div class="cal-breadcrumb"><a href="${rootUrl('launcher/index.html')}">Dependencias</a><span>›</span><a href="${rootUrl('apps/secretaria-general/index.html')}">Secretaría General</a><span>›</span><strong>${escapeHtml(current)}</strong></div>`}
function head(kicker,title,description,actions=""){
 return `${breadcrumb(title)}<div class="cal-page-head"><div><span class="cal-eyebrow">${icon('calendar','cal-icon-sm')}${escapeHtml(kicker)}</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div><div class="cal-head-actions">${actions}</div></div>`;
}
function metric(ico,value,label){return `<article class="cal-metric"><span class="cal-metric-icon">${icon(ico)}</span><span class="cal-metric-copy"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></span></article>`}
function eventDateBlock(event){const d=parseLocal(event.start);return `<span class="cal-date-block"><strong>${d.getDate()}</strong><span>${new Intl.DateTimeFormat('es-CO',{month:'short'}).format(d).replace('.','')}</span></span>`}
function eventRow(event){return `<article class="cal-event-row" data-event-id="${escapeHtml(event.id)}">${eventDateBlock(event)}<div class="cal-event-copy"><strong>${escapeHtml(event.title)}</strong><span>${formatTime(event.start)} · ${escapeHtml(event.location)} · ${escapeHtml(event.dependency)}</span></div><div class="cal-event-actions">${statusPill(event.status)}<button class="cal-icon-btn" type="button" data-open-event="${escapeHtml(event.id)}" aria-label="Ver evento">${icon('arrow','cal-icon-sm')}</button></div></article>`}
function upcoming(limit=6){
 const now=new Date(2026,7,5,0,0);
 return state.events.filter(e=>parseLocal(e.end)>=now&&!['Cancelado'].includes(e.status)).sort((a,b)=>parseLocal(a.start)-parseLocal(b.start)).slice(0,limit);
}
function dashboardPage(){
 const active=state.events.filter(e=>!["Realizado","Cancelado"].includes(e.status));
 const thisMonth=state.events.filter(e=>parseLocal(e.start).getMonth()===7&&parseLocal(e.start).getFullYear()===2026);
 const publicEvents=active.filter(e=>e.public).length;
 const pending=state.commitments.filter(c=>!c.done).length;
 const occupied=new Set(active.map(e=>e.resourceId).filter(Boolean)).size;
 return `<section class="cal-hero"><div class="cal-hero-copy"><span class="cal-eyebrow">Agenda unificada</span><h1>Organiza la gestión institucional sin perder trazabilidad</h1><p>Programa reuniones, jornadas, vencimientos, espacios y compromisos desde un único módulo claro y operativo.</p><div class="cal-hero-actions"><a class="cal-btn cal-btn-primary" href="${url('./nuevo-evento/')}">${icon('plus','cal-icon-sm')}Programar evento</a><a class="cal-btn cal-btn-soft" href="${url('./agenda/')}">${icon('calendar','cal-icon-sm')}Abrir calendario</a></div></div><div class="cal-hero-side"><div class="cal-today-card"><span>Hoy</span><strong>${formatLong('2026-08-05')}</strong><small>${active.filter(e=>e.start.startsWith('2026-08-05')).length} actividades programadas</small></div><div class="cal-today-card"><span>Próximo compromiso</span><strong>${escapeHtml(state.commitments.find(c=>!c.done)?.title||'Sin pendientes')}</strong><small>${state.commitments.find(c=>!c.done)?`Vence ${formatDate(state.commitments.find(c=>!c.done).due)}`:'Agenda al día'}</small></div></div></section>
 <section class="cal-metrics">${metric('calendar',thisMonth.length,'Eventos en agosto')}${metric('users',publicEvents,'Actividades públicas')}${metric('check',pending,'Compromisos pendientes')}${metric('building',occupied,'Recursos reservados')}${metric('clock','92%','Cumplimiento estimado')}</section>
 <section class="cal-grid cal-grid-2"><article class="cal-card"><div class="cal-card-head"><div><h2>Próximos eventos</h2><p>Agenda priorizada por fecha y estado</p></div><a class="cal-btn cal-btn-sm" href="${url('./eventos/')}">Ver todos</a></div><div class="cal-card-body"><div class="cal-list">${upcoming().map(eventRow).join('')||empty('calendar','No hay eventos próximos')}</div></div></article><article class="cal-card"><div class="cal-card-head"><div><h2>Compromisos próximos</h2><p>Acciones derivadas de reuniones y jornadas</p></div><a class="cal-btn cal-btn-sm" href="${url('./compromisos/')}">Gestionar</a></div><div class="cal-card-body"><div class="cal-list">${state.commitments.filter(c=>!c.done).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,6).map(commitmentRow).join('')||empty('check','No hay compromisos pendientes')}</div></div></article></section>`;
}
function empty(ico,text){return `<div class="cal-empty">${icon(ico)}<span>${escapeHtml(text)}</span></div>`}
function buildMonth(date){
 const year=date.getFullYear(),month=date.getMonth();
 const first=new Date(year,month,1),start=new Date(year,month,1-first.getDay());
 const cells=[];
 for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);cells.push(d)}
 return cells;
}
function dayEvents(date){const key=isoDate(date);return state.events.filter(e=>e.start.slice(0,10)===key).sort((a,b)=>a.start.localeCompare(b.start))}
function calendarMarkup(){
 const cells=buildMonth(state.month);
 return `<div class="cal-calendar-shell"><section class="cal-calendar-card"><div class="cal-calendar-toolbar"><div class="cal-calendar-controls"><button class="cal-icon-btn" id="prevMonth" type="button" aria-label="Mes anterior">${icon('chevronLeft','cal-icon-sm')}</button><button class="cal-btn cal-btn-sm" id="todayMonth" type="button">Hoy</button><button class="cal-icon-btn" id="nextMonth" type="button" aria-label="Mes siguiente">${icon('chevronRight','cal-icon-sm')}</button></div><h2>${monthLabel(state.month)}</h2><a class="cal-btn cal-btn-primary cal-btn-sm" href="${url('./nuevo-evento/')}">${icon('plus','cal-icon-sm')}Nuevo evento</a></div><div class="cal-weekdays"><span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span></div><div class="cal-month-grid">${cells.map(d=>{const items=dayEvents(d);const key=isoDate(d);const other=d.getMonth()!==state.month.getMonth();return `<button class="cal-day ${other?'other':''} ${key==='2026-08-05'?'today':''} ${key===state.selectedDate?'selected':''}" type="button" data-select-date="${key}"><span class="cal-day-number">${d.getDate()}</span><span class="cal-day-events">${items.slice(0,3).map(e=>`<span class="cal-day-event" data-category="${escapeHtml(e.category)}" data-open-event="${escapeHtml(e.id)}">${formatTime(e.start)} · ${escapeHtml(e.title)}</span>`).join('')}${items.length>3?`<span class="cal-more">+${items.length-3} más</span>`:''}</span></button>`}).join('')}</div></section>${selectedDayPanel()}</div>`;
}
function selectedDayPanel(){
 const date=parseLocal(state.selectedDate);const items=dayEvents(date);
 return `<aside class="cal-day-panel"><div class="cal-day-panel-head"><span>Agenda del día</span><strong>${formatLong(state.selectedDate)}</strong></div><div class="cal-day-panel-body">${items.map(e=>`<button class="cal-mini-event" type="button" data-open-event="${escapeHtml(e.id)}"><strong>${escapeHtml(e.title)}</strong><span>${formatTime(e.start)}–${formatTime(e.end)} · ${escapeHtml(e.location)}</span></button>`).join('')||empty('calendar','No hay actividades este día')}</div><div class="cal-card-footer"><a class="cal-btn cal-btn-primary cal-btn-sm" href="${url(`./nuevo-evento/?date=${state.selectedDate}`)}">${icon('plus','cal-icon-sm')}Agregar</a></div></aside>`;
}
function agendaPage(){return head('Planeación mensual','Calendario institucional','Visualiza la programación completa, selecciona una fecha y gestiona cada actividad desde una ventana central.',`<a class="cal-btn cal-btn-primary" href="${url('./nuevo-evento/')}">${icon('plus','cal-icon-sm')}Nuevo evento</a>`)+calendarMarkup()}
function filteredEvents(){
 return state.events.filter(e=>{
  const hay=normalize([e.title,e.description,e.dependency,e.responsible,e.location,e.category].join(' ')).includes(normalize(state.search));
  return hay&&(state.status==='Todos'||e.status===state.status)&&(state.category==='Todas'||e.category===state.category)&&(state.dependency==='Todas'||e.dependency===state.dependency);
 }).sort((a,b)=>parseLocal(a.start)-parseLocal(b.start));
}
function eventsPage(){
 const events=filteredEvents();const categories=[...new Set(state.events.map(e=>e.category))].sort();const dependencies=[...new Set(state.events.map(e=>e.dependency))].sort();
 return head('Gestión institucional','Eventos','Consulta, filtra, actualiza y cierra actividades sin paneles laterales ni información amontonada.',`<a class="cal-btn cal-btn-primary" href="${url('./nuevo-evento/')}">${icon('plus','cal-icon-sm')}Nuevo evento</a><button class="cal-btn" id="exportEvents" type="button">${icon('download','cal-icon-sm')}Exportar</button>`)+`<section class="cal-card"><div class="cal-card-body"><div class="cal-toolbar"><div class="cal-toolbar-group"><label class="cal-search">${icon('search')}<input id="eventSearch" type="search" value="${escapeHtml(state.search)}" placeholder="Buscar por evento, responsable o dependencia"></label><select id="statusFilter" aria-label="Filtrar por estado"><option>Todos</option>${['Programado','Confirmado','En curso','Realizado','Cancelado'].map(x=>`<option ${state.status===x?'selected':''}>${x}</option>`).join('')}</select><select id="categoryFilter" aria-label="Filtrar por categoría"><option>Todas</option>${categories.map(x=>`<option ${state.category===x?'selected':''}>${escapeHtml(x)}</option>`).join('')}</select><select id="dependencyFilter" aria-label="Filtrar por dependencia"><option>Todas</option>${dependencies.map(x=>`<option ${state.dependency===x?'selected':''}>${escapeHtml(x)}</option>`).join('')}</select></div><span class="cal-badge">${events.length} resultados</span></div><div class="cal-table-wrap"><table class="cal-table"><thead><tr><th>Evento</th><th>Fecha y hora</th><th>Dependencia</th><th>Responsable</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${events.map(e=>`<tr><td><strong>${escapeHtml(e.title)}</strong><br><span style="color:var(--cal-muted);font-size:8px">${escapeHtml(e.category)} · ${escapeHtml(e.location)}</span></td><td>${formatDate(e.start)}<br><span style="color:var(--cal-muted);font-size:8px">${formatTime(e.start)}–${formatTime(e.end)}</span></td><td>${escapeHtml(e.dependency)}</td><td><div class="cal-person"><span class="cal-avatar">${initials(e.responsible)}</span><span><strong>${escapeHtml(e.responsible)}</strong><span>${e.attendees} participantes</span></span></div></td><td>${statusPill(e.status)}</td><td><button class="cal-btn cal-btn-sm" type="button" data-open-event="${escapeHtml(e.id)}">Gestionar</button></td></tr>`).join('')||`<tr><td colspan="6">${empty('search','No se encontraron eventos')}</td></tr>`}</tbody></table></div></div></section>`;
}
function eventFormMarkup(event={}){
 const query=new URLSearchParams(location.search);const suggested=query.get('date')||event.start?.slice(0,10)||'2026-08-05';
 const startTime=event.start?.slice(11,16)||'09:00',endTime=event.end?.slice(11,16)||'10:00';
 return `<form class="cal-form" id="eventForm" novalidate><input type="hidden" name="id" value="${escapeHtml(event.id||'')}"><div class="cal-form-grid"><div class="cal-field full"><label for="eventTitle">Nombre del evento</label><input id="eventTitle" name="title" type="text" required minlength="5" maxlength="120" value="${escapeHtml(event.title||'')}" placeholder="Ej. Comité Institucional de Gestión y Desempeño"></div><div class="cal-field"><label for="eventDate">Fecha</label><input id="eventDate" name="date" type="date" required value="${suggested}"></div><div class="cal-field"><label for="eventCategory">Categoría</label><select id="eventCategory" name="category">${['Institucional','Reunión','Atención ciudadana','Evento público','Capacitación','Vencimiento'].map(x=>`<option ${event.category===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="cal-field"><label for="eventStart">Hora inicial</label><input id="eventStart" name="startTime" type="time" required value="${startTime}"></div><div class="cal-field"><label for="eventEnd">Hora final</label><input id="eventEnd" name="endTime" type="time" required value="${endTime}"></div><div class="cal-field"><label for="eventDependency">Dependencia</label><input id="eventDependency" name="dependency" type="text" required value="${escapeHtml(event.dependency||'Secretaría General')}" list="dependencyOptions"></div><div class="cal-field"><label for="eventResponsible">Responsable</label><input id="eventResponsible" name="responsible" type="text" required value="${escapeHtml(event.responsible||'')}" placeholder="Nombre o equipo responsable"></div><div class="cal-field"><label for="eventLocation">Lugar o modalidad</label><input id="eventLocation" name="location" type="text" required value="${escapeHtml(event.location||'')}" placeholder="Sala, auditorio o enlace virtual"></div><div class="cal-field"><label for="eventResource">Espacio o recurso</label><select id="eventResource" name="resourceId"><option value="">Sin reserva</option>${state.resources.map(r=>`<option value="${r.id}" ${event.resourceId===r.id?'selected':''} ${r.status!=='Disponible'&&event.resourceId!==r.id?'disabled':''}>${escapeHtml(r.name)}${r.status!=='Disponible'?` · ${escapeHtml(r.status)}`:''}</option>`).join('')}</select></div><div class="cal-field"><label for="eventStatus">Estado inicial</label><select id="eventStatus" name="status">${['Programado','Confirmado','En curso','Realizado','Cancelado'].map(x=>`<option ${event.status===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="cal-field"><label for="eventAttendees">Participantes estimados</label><input id="eventAttendees" name="attendees" type="number" min="1" max="2000" value="${Number(event.attendees||1)}"></div><div class="cal-field full"><label for="eventDescription">Descripción</label><textarea id="eventDescription" name="description" required minlength="10" placeholder="Propósito, alcance y resultado esperado">${escapeHtml(event.description||'')}</textarea></div><div class="cal-field full"><label for="eventNotes">Notas operativas</label><textarea id="eventNotes" name="notes" placeholder="Documentos, logística, convocatoria o recomendaciones">${escapeHtml(event.notes||'')}</textarea></div></div><label class="cal-check"><input type="checkbox" name="public" ${event.public?'checked':''}><span>La actividad es pública y puede aparecer en la agenda ciudadana.</span></label><datalist id="dependencyOptions">${['Secretaría General','Gobierno','Hacienda','Planeación','Salud y Bienestar','Jurídica','Control Interno','Contratación','Despacho'].map(x=>`<option value="${x}">`).join('')}</datalist><div class="cal-card-footer" style="margin:4px -13px -13px"><a class="cal-btn" href="${url('./eventos/')}">Cancelar</a><button class="cal-btn cal-btn-primary" type="submit">${icon('save','cal-icon-sm')}${event.id?'Guardar cambios':'Programar evento'}</button></div></form>`;
}
function newEventPage(){return head('Programación','Nuevo evento','Registra la actividad, asigna responsables y reserva recursos desde un formulario claro y validado.')+`<section class="cal-grid cal-grid-2"><article class="cal-card"><div class="cal-card-head"><div><h2>Información del evento</h2><p>Los campos principales son obligatorios</p></div></div><div class="cal-card-body">${eventFormMarkup()}</div></article><aside class="cal-card"><div class="cal-card-head"><div><h2>Buenas prácticas</h2><p>Antes de confirmar la programación</p></div></div><div class="cal-card-body"><div class="cal-list"><div class="cal-detail-section"><h3>Evita cruces de agenda</h3><p class="cal-help">El sistema verifica automáticamente conflictos del espacio o recurso seleccionado.</p></div><div class="cal-detail-section"><h3>Define un responsable</h3><p class="cal-help">Cada actividad debe tener una persona o equipo encargado del resultado y la evidencia.</p></div><div class="cal-detail-section"><h3>Documenta compromisos</h3><p class="cal-help">Después del evento podrás agregar acciones de seguimiento desde su ventana de gestión.</p></div></div></div></aside></section>`}
function resourceBookings(resourceId){return state.events.filter(e=>e.resourceId===resourceId&&!['Cancelado'].includes(e.status)).sort((a,b)=>a.start.localeCompare(b.start))}
function resourcesPage(){
 return head('Reservas institucionales','Espacios y recursos','Consulta disponibilidad, identifica próximas reservas y programa el uso de salas, auditorios, equipos o vehículos.',`<button class="cal-btn cal-btn-primary" id="newBooking" type="button">${icon('plus','cal-icon-sm')}Nueva reserva</button>`)+`<section class="cal-resource-grid">${state.resources.map(r=>{const next=resourceBookings(r.id).filter(e=>parseLocal(e.end)>=new Date(2026,7,5)).slice(0,1)[0];return `<article class="cal-resource-card"><div class="cal-resource-head"><span class="cal-resource-icon">${icon(r.icon||'building')}</span><span class="cal-status ${r.status==='Disponible'?'cal-status-confirmado':'cal-status-pendiente'}">${escapeHtml(r.status)}</span></div><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(r.features)}</p><div class="cal-resource-meta"><div><span>Capacidad</span><strong>${r.capacity} personas</strong></div><div><span>Ubicación</span><strong>${escapeHtml(r.location)}</strong></div></div><div class="cal-detail-section" style="margin-top:9px"><h3>Próxima reserva</h3><p class="cal-help">${next?`${formatDateTime(next.start)} · ${escapeHtml(next.title)}`:'Sin reservas próximas'}</p></div><button class="cal-btn cal-btn-soft cal-btn-sm" type="button" data-book-resource="${r.id}" ${r.status!=='Disponible'?'disabled aria-disabled="true"':''}>${r.status==='Disponible'?'Reservar recurso':'No disponible'}</button></article>`}).join('')}</section>`;
}
function commitmentRow(c){const event=state.events.find(e=>e.id===c.eventId);return `<article class="cal-commitment ${c.done?'done':''}"><button class="cal-commitment-check" type="button" data-toggle-commitment="${c.id}" aria-label="${c.done?'Reabrir':'Completar'} compromiso">${c.done?icon('check','cal-icon-sm'):icon('clock','cal-icon-sm')}</button><div class="cal-commitment-copy"><strong>${escapeHtml(c.title)}</strong><span>${escapeHtml(c.responsible)} · vence ${formatDate(c.due)}${event?` · ${escapeHtml(event.title)}`:''}</span></div><span class="cal-badge">${escapeHtml(c.priority)}</span></article>`}
function commitmentsPage(){
 const pending=state.commitments.filter(c=>!c.done),done=state.commitments.filter(c=>c.done);
 return head('Seguimiento','Compromisos','Controla las tareas derivadas de reuniones y eventos, con responsable, fecha límite y trazabilidad.',`<button class="cal-btn cal-btn-primary" id="newCommitment" type="button">${icon('plus','cal-icon-sm')}Nuevo compromiso</button>`)+`<section class="cal-metrics">${metric('clipboard',state.commitments.length,'Compromisos totales')}${metric('clock',pending.length,'Pendientes')}${metric('check',done.length,'Completados')}${metric('flag',pending.filter(c=>c.priority==='Alta').length,'Prioridad alta')}${metric('chart',`${Math.round(done.length/Math.max(state.commitments.length,1)*100)}%`,'Avance')}</section><section class="cal-grid cal-grid-2"><article class="cal-card"><div class="cal-card-head"><div><h2>Pendientes</h2><p>Ordenados por fecha de vencimiento</p></div></div><div class="cal-card-body"><div class="cal-list">${pending.sort((a,b)=>a.due.localeCompare(b.due)).map(commitmentRow).join('')||empty('check','No hay compromisos pendientes')}</div></div></article><article class="cal-card"><div class="cal-card-head"><div><h2>Completados</h2><p>Acciones cerradas y verificadas</p></div></div><div class="cal-card-body"><div class="cal-list">${done.map(commitmentRow).join('')||empty('clipboard','Todavía no hay compromisos completados')}</div></div></article></section>`;
}
function reportsPage(){
 const byCategory={};state.events.forEach(e=>byCategory[e.category]=(byCategory[e.category]||0)+1);const cats=Object.entries(byCategory);const max=Math.max(...cats.map(x=>x[1]),1);
 const realized=state.events.filter(e=>e.status==='Realizado').length;const active=state.events.filter(e=>!['Realizado','Cancelado'].includes(e.status)).length;const publicCount=state.events.filter(e=>e.public).length;
 return head('Analítica de agenda','Reportes','Lectura ejecutiva de programación, cumplimiento, participación y uso de recursos.',`<button class="cal-btn" id="exportReport" type="button">${icon('download','cal-icon-sm')}Exportar resumen</button>`)+`<section class="cal-metrics">${metric('calendar',state.events.length,'Eventos registrados')}${metric('clock',active,'En programación')}${metric('check',realized,'Realizados')}${metric('users',publicCount,'Actividades públicas')}${metric('building',state.resources.length,'Recursos controlados')}</section><section class="cal-grid cal-grid-2"><article class="cal-card"><div class="cal-card-head"><div><h2>Eventos por categoría</h2><p>Distribución de la programación actual</p></div></div><div class="cal-card-body" style="padding-bottom:42px"><div class="cal-bars">${cats.map(([cat,n])=>`<div class="cal-bar" style="height:${Math.max(18,n/max*100)}%"><strong>${n}</strong><span>${escapeHtml(cat)}</span></div>`).join('')}</div></div></article><article class="cal-card"><div class="cal-card-head"><div><h2>Estado de la agenda</h2><p>Participación de estados operativos</p></div></div><div class="cal-card-body"><div class="cal-grid cal-grid-2" style="align-items:center"><div class="cal-donut"></div><div class="cal-legend">${[['Programado',varColor('--cal-blue'),state.events.filter(e=>e.status==='Programado').length],['Confirmado',varColor('--cal-teal'),state.events.filter(e=>e.status==='Confirmado').length],['Realizado',varColor('--cal-amber'),realized],['Otros','#dce5ed',state.events.filter(e=>!['Programado','Confirmado','Realizado'].includes(e.status)).length]].map(x=>`<div class="cal-legend-row"><span class="cal-legend-label"><i class="cal-legend-dot" style="background:${x[1]}"></i>${x[0]}</span><strong>${x[2]}</strong></div>`).join('')}</div></div></div></article></section>`;
}
function varColor(name){return getComputedStyle(document.documentElement).getPropertyValue(name).trim()||'#0f67a7'}
const renderers={dashboard:dashboardPage,agenda:agendaPage,events:eventsPage,new:newEventPage,resources:resourcesPage,commitments:commitmentsPage,reports:reportsPage};
function render(){document.getElementById('calendar-root').innerHTML=shell((renderers[page]||dashboardPage)());bindCommon();bindPage()}
function toast(title,message){const box=$('#calToast');if(!box)return;box.innerHTML=`${icon('check')}<div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span></div>`;box.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.classList.remove('show'),2800)}
function closeModal(){const backdrop=$('#calModalBackdrop');if(!backdrop)return;backdrop.classList.remove('open');backdrop.setAttribute('aria-hidden','true');document.body.style.overflow=''}
function openModal(html){const backdrop=$('#calModalBackdrop'),modal=$('#calModal');if(!backdrop||!modal)return;modal.innerHTML=html;backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#closeCalModal')?.addEventListener('click',closeModal)}
function eventModal(event){
 const resource=state.resources.find(r=>r.id===event.resourceId);
 openModal(`<header class="cal-modal-head"><div><h2 id="calModalTitle">${escapeHtml(event.title)}</h2><p>${escapeHtml(event.id)} · ${escapeHtml(event.category)}</p></div><button class="cal-top-action" id="closeCalModal" type="button" aria-label="Cerrar">${icon('x')}</button></header><div class="cal-modal-body"><div class="cal-modal-grid"><div><section class="cal-detail-section"><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${statusPill(event.status)}<span class="cal-badge">${escapeHtml(event.priority)}</span>${event.public?'<span class="cal-badge">Agenda pública</span>':''}</div><p style="margin:0;color:var(--cal-muted);font-size:10px">${escapeHtml(event.description)}</p></section><section class="cal-detail-section"><h3>Información de la actividad</h3><div class="cal-facts"><div class="cal-fact"><span>Inicio</span><strong>${formatDateTime(event.start)}</strong></div><div class="cal-fact"><span>Finalización</span><strong>${formatDateTime(event.end)}</strong></div><div class="cal-fact"><span>Dependencia</span><strong>${escapeHtml(event.dependency)}</strong></div><div class="cal-fact"><span>Responsable</span><strong>${escapeHtml(event.responsible)}</strong></div><div class="cal-fact"><span>Lugar</span><strong>${escapeHtml(event.location)}</strong></div><div class="cal-fact"><span>Recurso</span><strong>${escapeHtml(resource?.name||'Sin reserva')}</strong></div><div class="cal-fact"><span>Participantes</span><strong>${event.attendees}</strong></div><div class="cal-fact"><span>Estado</span><strong>${escapeHtml(event.status)}</strong></div></div></section><section class="cal-detail-section"><h3>Notas operativas</h3><p class="cal-help">${escapeHtml(event.notes||'Sin notas adicionales.')}</p></section></div><aside class="cal-detail-section"><h3>Gestionar evento</h3><form class="cal-form" id="eventWorkflow"><div class="cal-field"><label>Estado</label><select name="status">${['Programado','Confirmado','En curso','Realizado','Cancelado'].map(x=>`<option ${event.status===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="cal-field"><label>Responsable</label><input name="responsible" value="${escapeHtml(event.responsible)}"></div><div class="cal-field"><label>Lugar</label><input name="location" value="${escapeHtml(event.location)}"></div><div class="cal-field"><label>Nota de actualización</label><textarea name="updateNote" placeholder="Decisión, cambio o resultado del evento"></textarea></div><button class="cal-btn cal-btn-primary" type="submit">${icon('save','cal-icon-sm')}Guardar cambios</button><button class="cal-btn" type="button" data-duplicate-event="${event.id}">${icon('copy','cal-icon-sm')}Duplicar evento</button><button class="cal-btn cal-btn-danger" type="button" data-delete-event="${event.id}">${icon('trash','cal-icon-sm')}Eliminar</button></form></aside></div></div><footer class="cal-modal-footer"><button class="cal-btn" type="button" id="closeCalModalFooter">Cerrar</button><button class="cal-btn cal-btn-soft" type="button" data-edit-event="${event.id}">${icon('edit','cal-icon-sm')}Editar información</button></footer>`);
 $('#closeCalModalFooter')?.addEventListener('click',closeModal);
 $('#eventWorkflow')?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget);event.status=fd.get('status');event.responsible=String(fd.get('responsible')).trim()||event.responsible;event.location=String(fd.get('location')).trim()||event.location;const note=String(fd.get('updateNote')).trim();if(note)event.notes=[event.notes,note].filter(Boolean).join('\n');persist();closeModal();render();toast('Evento actualizado','Los cambios quedaron guardados localmente.')});
 $(`[data-duplicate-event="${CSS.escape(event.id)}"]`)?.addEventListener('click',()=>{const copy={...event,id:uid('EVT'),title:`Copia · ${event.title}`,status:'Programado'};state.events.push(copy);persist();closeModal();render();toast('Evento duplicado','Se creó una copia para ajustar su programación.')});
 $(`[data-delete-event="${CSS.escape(event.id)}"]`)?.addEventListener('click',()=>{if(!confirm('¿Eliminar este evento del calendario?'))return;state.events=state.events.filter(e=>e.id!==event.id);state.commitments=state.commitments.filter(c=>c.eventId!==event.id);persist();closeModal();render();toast('Evento eliminado','La actividad y sus compromisos asociados fueron retirados.')});
 $(`[data-edit-event="${CSS.escape(event.id)}"]`)?.addEventListener('click',()=>openEditEvent(event));
}
function openEditEvent(event){openModal(`<header class="cal-modal-head"><div><h2 id="calModalTitle">Editar evento</h2><p>${escapeHtml(event.id)} · Actualización completa</p></div><button class="cal-top-action" id="closeCalModal" type="button" aria-label="Cerrar">${icon('x')}</button></header><div class="cal-modal-body">${eventFormMarkup(event)}</div>`);$('#eventForm')?.addEventListener('submit',handleEventForm)}
function hasConflict(resourceId,start,end,ignoreId=""){
 if(!resourceId)return false;
 const a=parseLocal(start),b=parseLocal(end);
 return state.events.some(e=>e.id!==ignoreId&&e.resourceId===resourceId&&e.status!=='Cancelado'&&a<parseLocal(e.end)&&b>parseLocal(e.start));
}
function handleEventForm(e){
 e.preventDefault();const fd=new FormData(e.currentTarget);const id=String(fd.get('id')||'');const date=fd.get('date'),start=`${date}T${fd.get('startTime')}`,end=`${date}T${fd.get('endTime')}`;
 if(parseLocal(end)<=parseLocal(start)){toast('Revisa el horario','La hora final debe ser posterior a la inicial.');return}
 const resourceId=String(fd.get('resourceId')||'');if(hasConflict(resourceId,start,end,id)){toast('Recurso no disponible','Ya existe otra reserva en ese horario.');return}
 const item={id:id||uid('EVT'),title:String(fd.get('title')).trim(),description:String(fd.get('description')).trim(),start,end,category:String(fd.get('category')),status:String(fd.get('status')),dependency:String(fd.get('dependency')).trim(),responsible:String(fd.get('responsible')).trim(),location:String(fd.get('location')).trim(),resourceId,attendees:Number(fd.get('attendees')||1),priority:'Media',public:fd.get('public')==='on',notes:String(fd.get('notes')||'').trim()};
 if(item.title.length<5||item.description.length<10||!item.responsible||!item.location){toast('Faltan datos','Completa el nombre, descripción, responsable y lugar.');return}
 const index=state.events.findIndex(x=>x.id===id);if(index>=0)state.events[index]={...state.events[index],...item};else state.events.push(item);persist();closeModal();toast(id?'Evento actualizado':'Evento programado','La agenda y las reservas fueron actualizadas.');setTimeout(()=>location.href=url('./eventos/'),500)
}
function bookingModal(resourceId=""){
 openModal(`<header class="cal-modal-head"><div><h2 id="calModalTitle">Nueva reserva</h2><p>Programa un espacio o recurso institucional</p></div><button class="cal-top-action" id="closeCalModal" type="button" aria-label="Cerrar">${icon('x')}</button></header><div class="cal-modal-body"><form class="cal-form" id="bookingForm"><div class="cal-form-grid"><div class="cal-field full"><label>Actividad</label><input name="title" required minlength="5" placeholder="Nombre de la reunión o actividad"></div><div class="cal-field"><label>Recurso</label><select name="resourceId" required><option value="">Seleccione</option>${state.resources.map(r=>`<option value="${r.id}" ${r.id===resourceId?'selected':''} ${r.status!=='Disponible'?'disabled':''}>${escapeHtml(r.name)}${r.status!=='Disponible'?` · ${escapeHtml(r.status)}`:''}</option>`).join('')}</select></div><div class="cal-field"><label>Dependencia</label><input name="dependency" value="Secretaría General" required></div><div class="cal-field"><label>Fecha</label><input name="date" type="date" value="2026-08-05" required></div><div class="cal-field"><label>Hora inicial</label><input name="startTime" type="time" value="09:00" required></div><div class="cal-field"><label>Hora final</label><input name="endTime" type="time" value="10:00" required></div><div class="cal-field"><label>Responsable</label><input name="responsible" required></div><div class="cal-field full"><label>Descripción</label><textarea name="description" required minlength="10"></textarea></div></div><button class="cal-btn cal-btn-primary" type="submit">${icon('save','cal-icon-sm')}Confirmar reserva</button></form></div>`);
 $('#bookingForm')?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget),date=fd.get('date'),start=`${date}T${fd.get('startTime')}`,end=`${date}T${fd.get('endTime')}`,rid=String(fd.get('resourceId'));if(parseLocal(end)<=parseLocal(start)){toast('Revisa el horario','La hora final debe ser posterior.');return}if(hasConflict(rid,start,end)){toast('Recurso ocupado','Existe una reserva que se cruza con este horario.');return}const resource=state.resources.find(r=>r.id===rid);state.events.push({id:uid('EVT'),title:String(fd.get('title')).trim(),description:String(fd.get('description')).trim(),start,end,category:'Reunión',status:'Confirmado',dependency:String(fd.get('dependency')).trim(),responsible:String(fd.get('responsible')).trim(),location:resource?.name||'Por definir',resourceId:rid,attendees:1,priority:'Media',public:false,notes:'Reserva creada desde Espacios y recursos.'});persist();closeModal();render();toast('Reserva confirmada','El recurso quedó asociado a la actividad.')})
}
function commitmentModal(){openModal(`<header class="cal-modal-head"><div><h2 id="calModalTitle">Nuevo compromiso</h2><p>Registra una acción de seguimiento</p></div><button class="cal-top-action" id="closeCalModal" type="button" aria-label="Cerrar">${icon('x')}</button></header><div class="cal-modal-body"><form class="cal-form" id="commitmentForm"><div class="cal-field"><label>Compromiso</label><input name="title" required minlength="5"></div><div class="cal-form-grid"><div class="cal-field"><label>Evento relacionado</label><select name="eventId"><option value="">Sin evento asociado</option>${state.events.map(e=>`<option value="${e.id}">${escapeHtml(e.title)}</option>`).join('')}</select></div><div class="cal-field"><label>Responsable</label><input name="responsible" required></div><div class="cal-field"><label>Fecha límite</label><input name="due" type="date" value="2026-08-08" required></div><div class="cal-field"><label>Prioridad</label><select name="priority"><option>Media</option><option>Alta</option><option>Baja</option></select></div></div><button class="cal-btn cal-btn-primary" type="submit">${icon('save','cal-icon-sm')}Guardar compromiso</button></form></div>`);$('#commitmentForm')?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget);state.commitments.push({id:uid('CMP'),title:String(fd.get('title')).trim(),eventId:String(fd.get('eventId')||''),responsible:String(fd.get('responsible')).trim(),due:String(fd.get('due')),priority:String(fd.get('priority')),done:false});persist();closeModal();render();toast('Compromiso registrado','La acción fue agregada al seguimiento.')})}
function csvDownload(filename,rows){const csv=rows.map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href)}
function bindCommon(){
 const sidebar=$('#calSidebar'),backdrop=$('#calMobileBackdrop');$('#calMenuBtn')?.addEventListener('click',()=>{sidebar?.classList.add('open');backdrop?.classList.add('open')});backdrop?.addEventListener('click',()=>{sidebar?.classList.remove('open');backdrop.classList.remove('open')});
 $('#calModalBackdrop')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()},{once:true});
 $('#calBell')?.addEventListener('click',()=>toast('Agenda al día',`${state.commitments.filter(c=>!c.done).length} compromisos y ${upcoming(20).length} eventos próximos.`));
 $$('[data-open-event]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();const event=state.events.find(x=>x.id===el.dataset.openEvent);if(event)eventModal(event)}));
}
function bindPage(){
 if(page==='agenda'){
  $('#prevMonth')?.addEventListener('click',()=>{state.month=new Date(state.month.getFullYear(),state.month.getMonth()-1,1);render()});$('#nextMonth')?.addEventListener('click',()=>{state.month=new Date(state.month.getFullYear(),state.month.getMonth()+1,1);render()});$('#todayMonth')?.addEventListener('click',()=>{state.month=new Date(2026,7,1);state.selectedDate='2026-08-05';render()});$$('[data-select-date]').forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('[data-open-event]'))return;state.selectedDate=el.dataset.selectDate;const d=parseLocal(state.selectedDate);if(d.getMonth()!==state.month.getMonth())state.month=new Date(d.getFullYear(),d.getMonth(),1);render()}));
 }
 if(page==='events'){
  $('#eventSearch')?.addEventListener('input',e=>{state.search=e.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{render();const input=$('#eventSearch');if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length)}},180)});$('#statusFilter')?.addEventListener('change',e=>{state.status=e.target.value;render()});$('#categoryFilter')?.addEventListener('change',e=>{state.category=e.target.value;render()});$('#dependencyFilter')?.addEventListener('change',e=>{state.dependency=e.target.value;render()});$('#exportEvents')?.addEventListener('click',()=>csvDownload('eventos-calendario-institucional.csv',[["ID","Evento","Inicio","Fin","Categoría","Estado","Dependencia","Responsable","Lugar"],...filteredEvents().map(e=>[e.id,e.title,e.start,e.end,e.category,e.status,e.dependency,e.responsible,e.location])]));
 }
 if(page==='new')$('#eventForm')?.addEventListener('submit',handleEventForm);
 if(page==='resources'){$('#newBooking')?.addEventListener('click',()=>bookingModal());$$('[data-book-resource]').forEach(el=>el.addEventListener('click',()=>bookingModal(el.dataset.bookResource)))}
 if(page==='commitments'){$('#newCommitment')?.addEventListener('click',commitmentModal);$$('[data-toggle-commitment]').forEach(el=>el.addEventListener('click',()=>{const c=state.commitments.find(x=>x.id===el.dataset.toggleCommitment);if(c){c.done=!c.done;persist();render();toast(c.done?'Compromiso completado':'Compromiso reabierto',c.title)}}))}
 if(page==='reports')$('#exportReport')?.addEventListener('click',()=>csvDownload('resumen-calendario-institucional.csv',[["Indicador","Valor"],["Eventos registrados",state.events.length],["Eventos realizados",state.events.filter(e=>e.status==='Realizado').length],["Actividades públicas",state.events.filter(e=>e.public).length],["Compromisos pendientes",state.commitments.filter(c=>!c.done).length],["Recursos controlados",state.resources.length]]));
}
window.CalendarInstitutional={version:VERSION,state,render,openEvent:(id)=>{const event=state.events.find(e=>e.id===id);if(event)eventModal(event)}};
render();
})();
