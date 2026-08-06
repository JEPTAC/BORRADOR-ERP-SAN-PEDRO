(function(){
"use strict";
var VERSION="32.0.0";
var body=document.body;
var page=body.dataset.page||"dashboard";
var moduleRoot=new URL(body.dataset.moduleBase||"./",location.href);
var erpRoot=new URL(body.dataset.erpRoot||"../../../",location.href);
var moduleUrl=function(relative){return new URL(relative,moduleRoot).href};
var rootUrl=function(relative){return new URL(relative,erpRoot).href};
var root=document.getElementById("calendar-root");
var clone=function(value){return JSON.parse(JSON.stringify(value))};
var pad=function(value){return String(value).padStart(2,"0")};
var escapeHtml=function(value){return String(value==null?"":value).replace(/[&<>'"]/g,function(char){return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]})};
var normalize=function(value){return String(value==null?"":value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()};
var slug=function(value){return normalize(value).replace(/[^a-z0-9]+/g,"").trim()};
var uid=function(prefix){return prefix+"-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase()};
var parseLocal=function(value){
  if(value instanceof Date)return new Date(value.getTime());
  var text=String(value||"");
  var parts=text.split("T");
  var date=parts[0].split("-").map(Number);
  var time=(parts[1]||"00:00").split(":").map(Number);
  return new Date(date[0],(date[1]||1)-1,date[2]||1,time[0]||0,time[1]||0,0,0);
};
var isoDate=function(date){return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate())};
var isoDateTime=function(date){return isoDate(date)+"T"+pad(date.getHours())+":"+pad(date.getMinutes())};
var addDays=function(date,days){var result=new Date(date);result.setDate(result.getDate()+days);return result};
var addMonths=function(date,months){var result=new Date(date);result.setDate(1);result.setMonth(result.getMonth()+months);return result};
var startOfWeek=function(date){var result=new Date(date);var day=result.getDay();var offset=day===0?-6:1-day;result.setDate(result.getDate()+offset);result.setHours(0,0,0,0);return result};
var endOfWeek=function(date){var result=addDays(startOfWeek(date),6);result.setHours(23,59,59,999);return result};
var sameDay=function(a,b){return isoDate(parseLocal(a))===isoDate(parseLocal(b))};
var minutesOfDay=function(value){var d=parseLocal(value);return d.getHours()*60+d.getMinutes()};
var formatDate=function(value){return new Intl.DateTimeFormat("es-CO",{day:"2-digit",month:"short",year:"numeric"}).format(parseLocal(value))};
var formatLong=function(value){return new Intl.DateTimeFormat("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(parseLocal(value))};
var formatTime=function(value){return new Intl.DateTimeFormat("es-CO",{hour:"2-digit",minute:"2-digit",hour12:true}).format(parseLocal(value))};
var formatClock=function(value){return pad(parseLocal(value).getHours())+":"+pad(parseLocal(value).getMinutes())};
var formatDateTime=function(value){return new Intl.DateTimeFormat("es-CO",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true}).format(parseLocal(value))};
var capitalizeFirst=function(value){var text=String(value||"");return text.charAt(0).toUpperCase()+text.slice(1)};
var monthLabel=function(date){return capitalizeFirst(new Intl.DateTimeFormat("es-CO",{month:"long",year:"numeric"}).format(date))};
var shortWeekday=function(date){return new Intl.DateTimeFormat("es-CO",{weekday:"short"}).format(date).replace(".","")};
var initials=function(name){return String(name||"Usuario").split(/\s+/).filter(Boolean).slice(0,2).map(function(item){return item.charAt(0)}).join("").toUpperCase()};
var actualToday=new Date();
actualToday.setHours(0,0,0,0);

var iconPaths={
  home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  building:'<path d="M4 21V8l8-4 8 4v13M8 10h2m4 0h2M8 14h2m4 0h2M9 21v-4h6v4"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  chart:'<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
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
  link:'<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  print:'<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/>',
  today:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18M8 14h3m-3 3h7"/>'
};
function icon(name,cls){
  var path=iconPaths[name]||iconPaths.info;
  return '<svg class="cal-icon '+(cls||"")+'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+path+'</svg>';
}

var seed={
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
var keys={events:"sp_calendar_events_v30",resources:"sp_calendar_resources_v30",commitments:"sp_calendar_commitments_v30",preferences:"sp_calendar_preferences_v32"};
function readArray(key,fallback){
  try{var value=JSON.parse(localStorage.getItem(key));return Array.isArray(value)?value:clone(fallback)}catch(error){return clone(fallback)}
}
function readObject(key,fallback){
  try{var value=JSON.parse(localStorage.getItem(key));return value&&typeof value==="object"&&!Array.isArray(value)?Object.assign({},fallback,value):Object.assign({},fallback)}catch(error){return Object.assign({},fallback)}
}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(error){}}
function migrate(){
  try{
    if(!localStorage.getItem(keys.events)){
      ["erp-calendar-events","calendar-events","sp_calendar_events_v29"].some(function(legacy){
        try{var data=JSON.parse(localStorage.getItem(legacy));if(Array.isArray(data)&&data.length){write(keys.events,data);return true}}catch(error){}return false;
      });
    }
  }catch(error){}
}
migrate();
var events=readArray(keys.events,seed.events);
var resources=readArray(keys.resources,seed.resources);
var commitments=readArray(keys.commitments,seed.commitments);
var dependencies=Array.from(new Set(events.map(function(event){return event.dependency||"Sin dependencia"}))).sort(function(a,b){return a.localeCompare(b,"es")});
var defaultDate=events.some(function(event){return sameDay(event.start,actualToday)})?isoDate(actualToday):(events[0]?String(events[0].start).slice(0,10):isoDate(actualToday));
var query=new URLSearchParams(location.search);
var preferences=readObject(keys.preferences,{view:page==="dashboard"?"week":"month",selectedDate:defaultDate,visibleDependencies:dependencies,miniMonth:defaultDate});
var state={
  events:events,
  resources:resources,
  commitments:commitments,
  view:query.get("view")||preferences.view||(page==="dashboard"?"week":"month"),
  selectedDate:query.get("date")||preferences.selectedDate||defaultDate,
  anchor:parseLocal(query.get("date")||preferences.selectedDate||defaultDate),
  miniMonth:parseLocal(preferences.miniMonth||query.get("date")||defaultDate),
  visibleDependencies:new Set(Array.isArray(preferences.visibleDependencies)&&preferences.visibleDependencies.length?preferences.visibleDependencies:dependencies),
  globalSearch:"",
  eventSearch:"",
  eventStatus:"Todos",
  eventCategory:"Todas",
  eventDependency:"Todas",
  modalOpen:false
};
state.anchor.setHours(0,0,0,0);
state.miniMonth.setDate(1);state.miniMonth.setHours(0,0,0,0);
var categoryColors={"Institucional":"#5b5fc7","Reunión":"#2563eb","Atención ciudadana":"#0f766e","Evento público":"#2f6d3f","Capacitación":"#9a6700","Vencimiento":"#b42318"};
var dependencyColors=["#2563eb","#5b5fc7","#0f766e","#2f6d3f","#9a6700","#b42318","#0f4c81","#6d28d9","#365314"];
function categoryColor(category){return categoryColors[category]||"#0f4c81"}
function dependencyColor(name){var index=Math.max(0,dependencies.indexOf(name));return dependencyColors[index%dependencyColors.length]}
function persist(){
  write(keys.events,state.events);write(keys.resources,state.resources);write(keys.commitments,state.commitments);
  write(keys.preferences,{view:state.view,selectedDate:state.selectedDate,visibleDependencies:Array.from(state.visibleDependencies),miniMonth:isoDate(state.miniMonth)});
}
function visibleEvents(){
  return state.events.filter(function(event){return state.visibleDependencies.has(event.dependency||"Sin dependencia")}).sort(function(a,b){return String(a.start).localeCompare(String(b.start))});
}
function eventsOn(date){var value=isoDate(parseLocal(date));return visibleEvents().filter(function(event){return String(event.start).slice(0,10)===value})}
function upcomingEvents(limit){
  var from=new Date(state.anchor);from.setHours(0,0,0,0);
  return visibleEvents().filter(function(event){return parseLocal(event.end)>=from&&event.status!=="Cancelado"}).slice(0,limit||8);
}
function statusClass(status){return "cal-status-"+slug(status)}
function statusPill(status){return '<span class="cal-status '+statusClass(status)+'">'+escapeHtml(status)+'</span>'}
function priorityPill(priority){return '<span class="cal-priority cal-priority-'+slug(priority)+'">'+escapeHtml(priority)+'</span>'}
function eventStyle(event){return '--event-color:'+categoryColor(event.category)}
function shell(content){
  var calendarPage=page==="dashboard"||page==="agenda";
  return '<div class="cal-app">'+rail()+panel()+'<div class="cal-mobile-backdrop" id="calMobileBackdrop"></div><main class="cal-main">'+topbar(calendarPage)+'<div class="cal-content">'+content+'</div></main><div id="calModalRoot"></div><div class="cal-toast-region" id="calToastRegion" aria-live="polite"></div></div>';
}
function rail(){
  var items=[
    ["home",rootUrl("launcher/"),"Todas las dependencias",""],
    ["calendar",moduleUrl("./"),"Calendario",page==="dashboard"||page==="agenda"?"active":""],
    ["list",moduleUrl("./eventos/"),"Eventos",page==="events"?"active":""],
    ["building",moduleUrl("./espacios/"),"Recursos",page==="resources"?"active":""],
    ["check",moduleUrl("./compromisos/"),"Compromisos",page==="commitments"?"active":""],
    ["chart",moduleUrl("./reportes/"),"Reportes",page==="reports"?"active":""]
  ];
  return '<aside class="cal-rail" aria-label="Accesos del calendario"><a class="cal-rail-brand" href="'+rootUrl("launcher/")+'" aria-label="Ir a todas las dependencias"><img src="'+rootUrl("assets/branding/san-pedro.svg")+'" alt="San Pedro"></a><nav class="cal-rail-nav">'+items.map(function(item){return '<a class="cal-rail-link '+item[3]+'" href="'+item[1]+'" data-label="'+escapeHtml(item[2])+'" aria-label="'+escapeHtml(item[2])+'">'+icon(item[0])+'</a>'}).join("")+'</nav><div class="cal-rail-footer"><span class="cal-rail-avatar" title="Juan E. Pérez">JP</span></div></aside>';
}
function panel(){
  var panelLinks=[
    ["dashboard",moduleUrl("./"),"calendar","Mi agenda"],
    ["events",moduleUrl("./eventos/"),"list","Todos los eventos"],
    ["resources",moduleUrl("./espacios/"),"building","Espacios y recursos"],
    ["commitments",moduleUrl("./compromisos/"),"check","Compromisos"],
    ["reports",moduleUrl("./reportes/"),"chart","Reportes"]
  ];
  return '<aside class="cal-panel" id="calPanel"><div class="cal-panel-head"><div class="cal-panel-title"><div><strong>Calendario</strong><span>Agenda institucional</span></div><button class="cal-icon-button cal-panel-close" type="button" data-action="close-panel" aria-label="Cerrar navegación">'+icon("x","cal-icon-sm")+'</button></div></div><div class="cal-panel-body"><button class="cal-new-button" type="button" data-action="quick-create">'+icon("plus","cal-icon-sm")+'Nuevo evento</button>'+miniCalendar()+'<section class="cal-panel-section"><div class="cal-panel-section-head"><strong>Mis calendarios</strong><button class="cal-icon-button" type="button" data-action="toggle-all-calendars" aria-label="Mostrar u ocultar todos">'+icon("more","cal-icon-sm")+'</button></div>'+dependencies.map(function(dep){var on=state.visibleDependencies.has(dep);return '<button class="cal-calendar-toggle '+(on?"on":"")+'" type="button" data-dependency-toggle="'+escapeHtml(dep)+'" style="--toggle-color:'+dependencyColor(dep)+'"><span class="cal-calendar-check">'+(on?icon("check","cal-icon-sm"):"")+'</span><span class="cal-calendar-dot"></span><span>'+escapeHtml(dep)+'</span></button>'}).join("")+'</section><section class="cal-panel-section"><div class="cal-panel-section-head"><strong>Administración</strong></div>'+panelLinks.map(function(item){return '<a class="cal-panel-link '+(page===item[0]?"active":"")+'" href="'+item[1]+'">'+icon(item[2],"cal-icon-sm")+'<span>'+item[3]+'</span></a>'}).join("")+'</section></div><div class="cal-panel-footer"><div class="cal-panel-user"><span class="cal-panel-avatar">JP</span><span><strong>Juan E. Pérez</strong><span>Administrador de agenda</span></span></div></div></aside>';
}
function miniCalendar(){
  var first=new Date(state.miniMonth.getFullYear(),state.miniMonth.getMonth(),1);
  var start=startOfWeek(first);
  var days=[];
  for(var i=0;i<42;i++){
    var date=addDays(start,i);var value=isoDate(date);
    days.push('<button class="cal-mini-day '+(date.getMonth()!==first.getMonth()?"other ":"")+(sameDay(date,actualToday)?"today ":"")+(value===state.selectedDate?"selected":"")+'" type="button" data-mini-date="'+value+'" aria-label="'+escapeHtml(formatLong(date))+'">'+date.getDate()+'</button>');
  }
  return '<section class="cal-mini"><div class="cal-mini-head"><strong>'+escapeHtml(monthLabel(first))+'</strong><div class="cal-mini-nav"><button class="cal-icon-button" type="button" data-action="mini-prev" aria-label="Mes anterior">'+icon("chevronLeft","cal-icon-sm")+'</button><button class="cal-icon-button" type="button" data-action="mini-next" aria-label="Mes siguiente">'+icon("chevronRight","cal-icon-sm")+'</button></div></div><div class="cal-mini-weekdays"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="cal-mini-grid">'+days.join("")+'</div></section>';
}
function topbar(calendarPage){
  var title=calendarPage?rangeTitle():pageTitle();
  return '<header class="cal-topbar"><div class="cal-topbar-left"><button class="cal-icon-button cal-menu-button" type="button" data-action="open-panel" aria-label="Abrir navegación">'+icon("menu")+'</button><div class="cal-title-block"><strong>'+escapeHtml(title)+'</strong><span>'+escapeHtml(pageSubtitle())+'</span></div>'+(calendarPage?'<div class="cal-date-nav"><button class="cal-icon-button" type="button" data-action="previous-period" aria-label="Periodo anterior">'+icon("chevronLeft","cal-icon-sm")+'</button><button class="cal-icon-button" type="button" data-action="next-period" aria-label="Periodo siguiente">'+icon("chevronRight","cal-icon-sm")+'</button><button class="cal-today-button" type="button" data-action="today">Hoy</button></div>':"")+'</div><div class="cal-topbar-right">'+searchBox()+(calendarPage?viewSwitch():"")+'<button class="cal-icon-button" type="button" data-action="notifications" aria-label="Notificaciones">'+icon("bell","cal-icon-sm")+'</button></div></header>';
}
function searchBox(){return '<div class="cal-search">'+icon("search","cal-icon-sm")+'<input id="calGlobalSearch" type="search" autocomplete="off" value="'+escapeHtml(state.globalSearch)+'" placeholder="Buscar eventos" aria-label="Buscar eventos"><button class="cal-search-clear" type="button" data-action="clear-search" aria-label="Limpiar búsqueda" '+(!state.globalSearch?'hidden':'')+'>'+icon("x","cal-icon-sm")+'</button><div class="cal-search-results" id="calSearchResults" '+(!state.globalSearch?'hidden':'')+'>'+searchResultsMarkup()+'</div></div>'}
function searchResultsMarkup(){
  var q=normalize(state.globalSearch).trim();if(!q)return "";
  var results=state.events.filter(function(event){return normalize([event.title,event.description,event.dependency,event.responsible,event.location].join(" ")).indexOf(q)>=0}).slice(0,7);
  if(!results.length)return '<div class="cal-side-empty">No se encontraron coincidencias.</div>';
  return results.map(function(event){return '<button class="cal-search-result" type="button" data-event-id="'+escapeHtml(event.id)+'" style="'+eventStyle(event)+'"><span class="cal-search-result-dot"></span><span><strong>'+escapeHtml(event.title)+'</strong><span>'+escapeHtml(formatDateTime(event.start))+' · '+escapeHtml(event.dependency)+'</span></span></button>'}).join("");
}
function viewSwitch(){
  var items=[["day","calendar","Día"],["week","calendar","Semana"],["month","calendar","Mes"],["agenda","list","Agenda"]];
  return '<div class="cal-view-switch" aria-label="Vista del calendario">'+items.map(function(item){return '<button class="cal-view-button '+(state.view===item[0]?"active":"")+'" type="button" data-view="'+item[0]+'">'+icon(item[1],"cal-icon-sm")+'<span>'+item[2]+'</span></button>'}).join("")+'</div>';
}
function pageTitle(){return {events:"Eventos",new:"Nuevo evento",resources:"Espacios y recursos",commitments:"Compromisos",reports:"Reportes"}[page]||"Calendario"}
function pageSubtitle(){return {dashboard:"Vista de trabajo",agenda:"Planeación institucional",events:"Gestión y seguimiento",new:"Programación",resources:"Reservas institucionales",commitments:"Tareas derivadas",reports:"Indicadores de agenda"}[page]||"Agenda institucional"}
function rangeTitle(){
  if(state.view==="month")return monthLabel(state.anchor);
  if(state.view==="day")return formatLong(state.anchor);
  if(state.view==="agenda")return "Agenda desde "+formatDate(state.anchor);
  var start=startOfWeek(state.anchor),end=endOfWeek(state.anchor);
  return new Intl.DateTimeFormat("es-CO",{day:"numeric",month:"short"}).format(start)+" – "+new Intl.DateTimeFormat("es-CO",{day:"numeric",month:"short",year:"numeric"}).format(end);
}
function pageHead(eyebrow,title,description,actions){return '<div class="cal-page-head"><div><h1>'+escapeHtml(title)+'</h1><p>'+escapeHtml(description)+'</p></div><div class="cal-page-actions">'+(actions||"")+'</div></div>'}
function metric(iconName,value,label){return '<article class="cal-metric"><span class="cal-metric-icon">'+icon(iconName)+'</span><span><strong>'+escapeHtml(value)+'</strong><span>'+escapeHtml(label)+'</span></span></article>'}
function empty(iconName,title,text){return '<div class="cal-empty"><span class="cal-empty-icon">'+icon(iconName)+'</span><strong>'+escapeHtml(title)+'</strong><span>'+escapeHtml(text||"")+'</span></div>'}
function calendarPage(){return '<section class="cal-workspace"><article class="cal-calendar-card"><div class="cal-calendar-toolbar"><div><strong>'+escapeHtml(rangeTitle())+'</strong><span> · '+visibleEvents().length+' actividades visibles</span></div><div class="cal-page-actions"><button class="cal-toolbar-button" type="button" data-action="print">'+icon("print","cal-icon-sm")+'Imprimir</button><button class="cal-btn cal-btn-primary cal-btn-sm" type="button" data-action="quick-create">'+icon("plus","cal-icon-sm")+'Nuevo</button></div></div>'+calendarView()+'</article>'+inspector()+'</section>'}
function calendarView(){if(state.view==="month")return monthView();if(state.view==="day")return timeView(1);if(state.view==="agenda")return agendaView();return timeView(7)}
function monthView(){
  var first=new Date(state.anchor.getFullYear(),state.anchor.getMonth(),1);var start=startOfWeek(first);var cells=[];
  for(var i=0;i<42;i++){
    var date=addDays(start,i),dateIso=isoDate(date),items=eventsOn(date).sort(function(a,b){return a.start.localeCompare(b.start)});var shown=items.slice(0,3);
    cells.push('<div class="cal-month-day '+(date.getMonth()!==first.getMonth()?"other ":"")+(sameDay(date,actualToday)?"today ":"")+(dateIso===state.selectedDate?"selected":"")+'" data-select-date="'+dateIso+'" tabindex="0" role="button" aria-label="'+escapeHtml(formatLong(date))+', '+items.length+' eventos"><span class="cal-day-number">'+date.getDate()+'</span><div class="cal-month-events">'+shown.map(function(event){return '<button class="cal-event-chip" type="button" data-event-id="'+escapeHtml(event.id)+'" style="'+eventStyle(event)+'"><time>'+escapeHtml(formatClock(event.start))+'</time><span>'+escapeHtml(event.title)+'</span></button>'}).join("")+'</div>'+(items.length>3?'<span class="cal-more-events">+'+(items.length-3)+' más</span>':"")+'</div>');
  }
  return '<div class="cal-month-scroll"><div class="cal-month"><div class="cal-month-weekdays"><div>Lunes</div><div>Martes</div><div>Miércoles</div><div>Jueves</div><div>Viernes</div><div>Sábado</div><div>Domingo</div></div><div class="cal-month-grid">'+cells.join("")+'</div></div></div>';
}
function timeView(dayCount){
  var start=dayCount===1?new Date(state.anchor):startOfWeek(state.anchor);var days=[];for(var i=0;i<dayCount;i++)days.push(addDays(start,i));
  var minHour=7,maxHour=20,hourHeight=52;
  var header='<div class="cal-week-corner"></div>'+days.map(function(date){return '<div class="cal-week-day-head '+(sameDay(date,actualToday)?"today":"")+'"><span>'+escapeHtml(shortWeekday(date))+'</span><strong>'+date.getDate()+'</strong></div>'}).join("");
  var labels="";for(var hour=minHour;hour<=maxHour;hour++)labels+='<span class="cal-time-label" style="top:'+((hour-minHour)*hourHeight)+'px">'+pad(hour)+':00</span>';
  var columns=days.map(function(date){
    var items=eventsOn(date).filter(function(event){return minutesOfDay(event.end)>minHour*60&&minutesOfDay(event.start)<maxHour*60});
    var eventHtml=items.map(function(event){var startMin=Math.max(minutesOfDay(event.start),minHour*60),endMin=Math.min(minutesOfDay(event.end),maxHour*60),top=(startMin-minHour*60)*hourHeight/60,height=Math.max(28,(endMin-startMin)*hourHeight/60-2);return '<button class="cal-week-event" type="button" data-event-id="'+escapeHtml(event.id)+'" style="'+eventStyle(event)+';top:'+top+'px;height:'+height+'px"><strong>'+escapeHtml(event.title)+'</strong><span>'+escapeHtml(formatTime(event.start))+' · '+escapeHtml(event.location)+'</span></button>'}).join("");
    var nowLine="";if(sameDay(date,actualToday)){var now=new Date();var minute=now.getHours()*60+now.getMinutes();if(minute>=minHour*60&&minute<=maxHour*60)nowLine='<span class="cal-now-line" style="top:'+((minute-minHour*60)*hourHeight/60)+'px"></span>'}
    return '<div class="cal-week-day-column" data-time-column="'+isoDate(date)+'">'+nowLine+eventHtml+'</div>';
  }).join("");
  return '<div class="cal-week-scroll"><div class="cal-week" style="--cal-days:'+dayCount+'"><div class="cal-week-header">'+header+'</div><div class="cal-week-body"><div class="cal-time-column">'+labels+'</div>'+columns+'</div></div></div>';
}
function agendaView(){
  var from=new Date(state.anchor);from.setHours(0,0,0,0);var to=addDays(from,45);var items=visibleEvents().filter(function(event){var date=parseLocal(event.start);return date>=from&&date<=to});var groups={};items.forEach(function(event){var key=String(event.start).slice(0,10);(groups[key]||(groups[key]=[])).push(event)});
  var keysList=Object.keys(groups).sort();if(!keysList.length)return empty("calendar","No hay actividades próximas","Crea un evento o activa más calendarios.");
  return '<div class="cal-agenda-view">'+keysList.map(function(key){var date=parseLocal(key);return '<section class="cal-agenda-group"><div class="cal-agenda-date"><strong>'+escapeHtml(formatLong(date))+'</strong><span>'+groups[key].length+' actividades</span></div>'+groups[key].map(function(event){return '<button class="cal-agenda-item" type="button" data-event-id="'+escapeHtml(event.id)+'" style="'+eventStyle(event)+'"><span class="cal-agenda-time">'+escapeHtml(formatTime(event.start))+'<br>'+escapeHtml(formatTime(event.end))+'</span><span class="cal-agenda-bar"></span><span class="cal-agenda-copy"><strong>'+escapeHtml(event.title)+'</strong><span>'+escapeHtml(event.location)+' · '+escapeHtml(event.dependency)+'</span></span>'+statusPill(event.status)+'</button>'}).join("")+'</section>'}).join("")+'</div>';
}
function inspector(){
  var dayEvents=eventsOn(state.selectedDate).sort(function(a,b){return a.start.localeCompare(b.start)});var pending=state.commitments.filter(function(item){return !item.done}).sort(function(a,b){return a.due.localeCompare(b.due)}).slice(0,5);
  return '<aside class="cal-inspector"><section class="cal-side-card"><div class="cal-side-head"><div><strong>'+escapeHtml(formatLong(state.selectedDate))+'</strong><span>'+dayEvents.length+' actividades</span></div><button class="cal-icon-button" type="button" data-action="quick-create" data-date="'+state.selectedDate+'" aria-label="Crear evento">'+icon("plus","cal-icon-sm")+'</button></div><div class="cal-side-body">'+(dayEvents.length?dayEvents.map(function(event){return '<button class="cal-side-event" type="button" data-event-id="'+escapeHtml(event.id)+'"><span class="cal-side-time">'+escapeHtml(formatClock(event.start))+'</span><span><strong>'+escapeHtml(event.title)+'</strong><span>'+escapeHtml(event.location)+' · '+escapeHtml(event.responsible)+'</span></span></button>'}).join(""):'<div class="cal-side-empty">No hay actividades programadas para este día.</div>')+'</div></section><section class="cal-side-card"><div class="cal-side-head"><div><strong>Compromisos próximos</strong><span>'+state.commitments.filter(function(item){return !item.done}).length+' pendientes</span></div><a class="cal-icon-button" href="'+moduleUrl("./compromisos/")+'" aria-label="Ver compromisos">'+icon("chevronRight","cal-icon-sm")+'</a></div><div class="cal-side-body">'+(pending.length?pending.map(function(item){return '<div class="cal-commit-mini"><span class="cal-commit-dot"></span><span><strong>'+escapeHtml(item.title)+'</strong><span>'+escapeHtml(item.responsible)+' · '+escapeHtml(formatDate(item.due))+'</span></span></div>'}).join(""):'<div class="cal-side-empty">No hay compromisos pendientes.</div>')+'</div></section></aside>';
}
function eventsPage(){
  var filtered=state.events.filter(function(event){
    var text=normalize([event.title,event.description,event.responsible,event.location,event.dependency].join(" "));
    return (!state.eventSearch||text.indexOf(normalize(state.eventSearch))>=0)&&(state.eventStatus==="Todos"||event.status===state.eventStatus)&&(state.eventCategory==="Todas"||event.category===state.eventCategory)&&(state.eventDependency==="Todas"||event.dependency===state.eventDependency);
  }).sort(function(a,b){return a.start.localeCompare(b.start)});
  var active=state.events.filter(function(event){return event.status!=="Realizado"&&event.status!=="Cancelado"}).length;
  return pageHead("Gestión","Eventos institucionales","Consulta, filtra y administra las actividades programadas por todas las dependencias.",'<button class="cal-btn" type="button" data-action="export-events">'+icon("download","cal-icon-sm")+'Exportar</button><button class="cal-btn cal-btn-primary" type="button" data-action="quick-create">'+icon("plus","cal-icon-sm")+'Nuevo evento</button>')+'<section class="cal-metrics">'+metric("calendar",state.events.length,"Eventos registrados")+metric("clock",active,"En programación")+metric("check",state.events.filter(function(e){return e.status==="Realizado"}).length,"Realizados")+metric("users",state.events.filter(function(e){return e.public}).length,"Agenda pública")+metric("building",dependencies.length,"Dependencias")+'</section><section class="cal-card"><div class="cal-filterbar"><input id="eventSearch" type="search" value="'+escapeHtml(state.eventSearch)+'" placeholder="Buscar por evento, responsable o lugar"><select id="eventStatus"><option>Todos</option>'+["Programado","Confirmado","En curso","Realizado","Cancelado"].map(function(value){return '<option '+(state.eventStatus===value?"selected":"")+'>'+value+'</option>'}).join("")+'</select><select id="eventCategory"><option>Todas</option>'+Object.keys(categoryColors).map(function(value){return '<option '+(state.eventCategory===value?"selected":"")+'>'+value+'</option>'}).join("")+'</select><select id="eventDependency"><option>Todas</option>'+dependencies.map(function(value){return '<option '+(state.eventDependency===value?"selected":"")+'>'+escapeHtml(value)+'</option>'}).join("")+'</select><span style="margin-left:auto;color:var(--cal-muted);font-size:8.5px">'+filtered.length+' resultados</span></div><div class="cal-table-wrap"><table class="cal-table"><thead><tr><th>Evento</th><th>Fecha y hora</th><th>Responsable</th><th>Estado</th><th>Acción</th></tr></thead><tbody>'+filtered.map(function(event){return '<tr><td><div class="cal-table-title" style="'+eventStyle(event)+'"><span class="cal-table-color"></span><span><strong>'+escapeHtml(event.title)+'</strong><span>'+escapeHtml(event.category)+' · '+escapeHtml(event.location)+'</span></span></div></td><td>'+escapeHtml(formatDate(event.start))+'<br><span style="color:var(--cal-muted);font-size:8px">'+escapeHtml(formatTime(event.start))+' – '+escapeHtml(formatTime(event.end))+'</span></td><td><div class="cal-person"><span class="cal-avatar">'+initials(event.responsible)+'</span><span><strong>'+escapeHtml(event.responsible)+'</strong><span>'+escapeHtml(event.dependency)+'</span></span></div></td><td>'+statusPill(event.status)+'</td><td><button class="cal-btn cal-btn-sm" type="button" data-event-id="'+escapeHtml(event.id)+'">Gestionar</button></td></tr>'}).join("")+(filtered.length?"":'<tr><td colspan="5">'+empty("search","No se encontraron eventos","Ajusta los filtros o crea una actividad.")+'</td></tr>')+'</tbody></table></div></section>';
}
function eventForm(event){
  event=event||{};var date=query.get("date")||String(event.start||state.selectedDate).slice(0,10);var startTime=event.start?String(event.start).slice(11,16):"09:00";var endTime=event.end?String(event.end).slice(11,16):"10:00";
  return '<form class="cal-form" id="eventForm"><input type="hidden" name="id" value="'+escapeHtml(event.id||"")+'"><div class="cal-form-grid"><div class="cal-field full"><label>Nombre del evento</label><input name="title" required minlength="5" maxlength="120" value="'+escapeHtml(event.title||"")+'" placeholder="Ej. Comité Institucional de Gestión y Desempeño"></div><div class="cal-field"><label>Fecha</label><input name="date" type="date" required value="'+escapeHtml(date)+'"></div><div class="cal-field"><label>Categoría</label><select name="category">'+Object.keys(categoryColors).map(function(value){return '<option '+((event.category||"Institucional")===value?"selected":"")+'>'+value+'</option>'}).join("")+'</select></div><div class="cal-field"><label>Hora inicial</label><input name="startTime" type="time" required value="'+escapeHtml(startTime)+'"></div><div class="cal-field"><label>Hora final</label><input name="endTime" type="time" required value="'+escapeHtml(endTime)+'"></div><div class="cal-field"><label>Dependencia</label><input name="dependency" required value="'+escapeHtml(event.dependency||"Secretaría General")+'" list="dependencyOptions"></div><div class="cal-field"><label>Responsable</label><input name="responsible" required value="'+escapeHtml(event.responsible||"")+'" placeholder="Nombre o equipo responsable"></div><div class="cal-field"><label>Lugar o modalidad</label><input name="location" required value="'+escapeHtml(event.location||"")+'" placeholder="Sala, auditorio o enlace virtual"></div><div class="cal-field"><label>Espacio o recurso</label><select name="resourceId"><option value="">Sin reserva</option>'+state.resources.map(function(resource){return '<option value="'+resource.id+'" '+(event.resourceId===resource.id?"selected":"")+' '+(resource.status!=="Disponible"&&event.resourceId!==resource.id?"disabled":"")+'>'+escapeHtml(resource.name)+(resource.status!=="Disponible"?" · "+escapeHtml(resource.status):"")+'</option>'}).join("")+'</select></div><div class="cal-field"><label>Estado</label><select name="status">'+["Programado","Confirmado","En curso","Realizado","Cancelado"].map(function(value){return '<option '+((event.status||"Programado")===value?"selected":"")+'>'+value+'</option>'}).join("")+'</select></div><div class="cal-field"><label>Participantes estimados</label><input name="attendees" type="number" min="1" max="2000" value="'+Number(event.attendees||1)+'"></div><div class="cal-field full"><label>Descripción</label><textarea name="description" required minlength="10" placeholder="Propósito, alcance y resultado esperado">'+escapeHtml(event.description||"")+'</textarea></div><div class="cal-field full"><label>Notas operativas</label><textarea name="notes" placeholder="Documentos, logística, convocatoria o recomendaciones">'+escapeHtml(event.notes||"")+'</textarea></div></div><label class="cal-check"><input type="checkbox" name="public" '+(event.public?"checked":"")+'><span>Publicar esta actividad en la agenda ciudadana.</span></label><datalist id="dependencyOptions">'+dependencies.map(function(value){return '<option value="'+escapeHtml(value)+'">'}).join("")+'</datalist><div class="cal-card-footer" style="margin:0 -12px -12px"><a class="cal-btn" href="'+moduleUrl("./eventos/")+'">Cancelar</a><button class="cal-btn cal-btn-primary" type="submit">'+icon("save","cal-icon-sm")+(event.id?"Guardar cambios":"Programar evento")+'</button></div></form>';
}
function newEventPage(){return pageHead("Programación","Nuevo evento","Registra la actividad, responsables, participantes y recursos en un formulario único y validado.")+'<section class="cal-grid cal-grid-2"><article class="cal-card"><div class="cal-card-head"><div><h2>Información del evento</h2><p>Los campos principales son obligatorios</p></div></div><div class="cal-card-body">'+eventForm()+'</div></article><aside class="cal-card"><div class="cal-card-head"><div><h2>Antes de programar</h2><p>Buenas prácticas institucionales</p></div></div><div class="cal-card-body"><div class="cal-detail-section" style="margin-top:0;padding-top:0;border:0"><h4>Evita cruces</h4><p>El sistema valida que el recurso seleccionado no esté reservado en el mismo horario.</p></div><div class="cal-detail-section"><h4>Asigna un responsable</h4><p>Cada actividad debe tener una persona o equipo encargado del resultado y la evidencia.</p></div><div class="cal-detail-section"><h4>Registra compromisos</h4><p>Después del evento podrás generar tareas de seguimiento desde la ventana de gestión.</p></div></div></aside></section>'}
function resourceBookings(resourceId){return state.events.filter(function(event){return event.resourceId===resourceId&&event.status!=="Cancelado"}).sort(function(a,b){return a.start.localeCompare(b.start)})}
function resourcesPage(){
  return pageHead("Reservas","Espacios y recursos","Consulta disponibilidad y programa salas, auditorios, vehículos o equipos institucionales.",'<button class="cal-btn cal-btn-primary" type="button" data-action="new-booking">'+icon("plus","cal-icon-sm")+'Nueva reserva</button>')+'<section class="cal-resource-grid">'+state.resources.map(function(resource){var next=resourceBookings(resource.id).filter(function(event){return parseLocal(event.end)>=actualToday}).slice(0,1)[0];return '<article class="cal-resource-card"><div class="cal-resource-head"><span class="cal-resource-icon">'+icon(resource.icon||"building")+'</span>'+statusPill(resource.status==="Disponible"?"Confirmado":"En curso")+'</div><h3>'+escapeHtml(resource.name)+'</h3><p>'+escapeHtml(resource.features)+'</p><div class="cal-resource-meta"><div><span>Capacidad</span><strong>'+resource.capacity+' personas</strong></div><div><span>Ubicación</span><strong>'+escapeHtml(resource.location)+'</strong></div></div><div class="cal-detail-section"><h4>Próxima reserva</h4><p>'+(next?escapeHtml(formatDateTime(next.start))+" · "+escapeHtml(next.title):"Sin reservas próximas")+'</p></div><button class="cal-btn cal-btn-soft cal-btn-sm" type="button" data-resource-book="'+resource.id+'" '+(resource.status!=="Disponible"?'disabled aria-disabled="true"':"")+'>'+(resource.status==="Disponible"?"Reservar recurso":"No disponible")+'</button></article>'}).join("")+'</section>';
}
function commitmentsPage(){
  var pending=state.commitments.filter(function(item){return !item.done}).sort(function(a,b){return a.due.localeCompare(b.due)});var soon=pending.filter(function(item){return parseLocal(item.due)<=addDays(actualToday,7)});var later=pending.filter(function(item){return soon.indexOf(item)<0});var done=state.commitments.filter(function(item){return item.done});
  return pageHead("Seguimiento","Compromisos","Organiza las acciones derivadas de reuniones y eventos con una vista clara por estado.",'<button class="cal-btn cal-btn-primary" type="button" data-action="new-commitment">'+icon("plus","cal-icon-sm")+'Nuevo compromiso</button>')+'<section class="cal-metrics">'+metric("clipboard",state.commitments.length,"Compromisos totales")+metric("clock",pending.length,"Pendientes")+metric("flag",pending.filter(function(item){return item.priority==="Alta"}).length,"Prioridad alta")+metric("check",done.length,"Completados")+metric("chart",Math.round(done.length/Math.max(state.commitments.length,1)*100)+"%","Avance")+'</section><section class="cal-board">'+boardColumn("Próximos",soon,"clock")+boardColumn("Pendientes",later,"clipboard")+boardColumn("Completados",done,"check")+'</section>';
}
function boardColumn(title,items,iconName){return '<article class="cal-board-column"><div class="cal-board-head"><strong>'+icon(iconName,"cal-icon-sm")+' '+escapeHtml(title)+'</strong><span>'+items.length+'</span></div>'+items.map(function(item){var event=state.events.find(function(candidate){return candidate.id===item.eventId});return '<div class="cal-task"><strong>'+escapeHtml(item.title)+'</strong><span>'+escapeHtml(item.responsible)+' · '+escapeHtml(formatDate(item.due))+(event?" · "+escapeHtml(event.title):"")+'</span><div class="cal-task-actions">'+priorityPill(item.priority)+'<button class="cal-btn cal-btn-sm" type="button" data-toggle-commitment="'+item.id+'">'+(item.done?"Reabrir":"Completar")+'</button></div></div>'}).join("")+(items.length?"":'<div class="cal-side-empty">No hay elementos en esta columna.</div>')+'</article>'}
function reportsPage(){
  var categories=Object.keys(categoryColors).map(function(category){return [category,state.events.filter(function(event){return event.category===category}).length,categoryColor(category)]});var deps=dependencies.map(function(dep){return [dep,state.events.filter(function(event){return event.dependency===dep}).length,dependencyColor(dep)]}).sort(function(a,b){return b[1]-a[1]});var maxCategory=Math.max.apply(null,categories.map(function(item){return item[1]}).concat([1]));var maxDep=Math.max.apply(null,deps.map(function(item){return item[1]}).concat([1]));
  return pageHead("Análisis","Reportes del calendario","Revisa el volumen, distribución y cumplimiento de la agenda institucional.",'<button class="cal-btn" type="button" data-action="export-report">'+icon("download","cal-icon-sm")+'Exportar resumen</button>')+'<section class="cal-metrics">'+metric("calendar",state.events.length,"Eventos registrados")+metric("clock",state.events.filter(function(event){return ["Programado","Confirmado","En curso"].indexOf(event.status)>=0}).length,"En programación")+metric("check",state.events.filter(function(event){return event.status==="Realizado"}).length,"Realizados")+metric("users",state.events.filter(function(event){return event.public}).length,"Actividades públicas")+metric("building",state.resources.length,"Recursos controlados")+'</section><section class="cal-grid cal-grid-2"><article class="cal-card"><div class="cal-card-head"><div><h2>Eventos por categoría</h2><p>Distribución de la agenda</p></div></div><div class="cal-card-body"><div class="cal-report-bars">'+categories.map(function(item){return reportRow(item[0],item[1],maxCategory,item[2])}).join("")+'</div></div></article><article class="cal-card"><div class="cal-card-head"><div><h2>Eventos por dependencia</h2><p>Participación institucional</p></div></div><div class="cal-card-body"><div class="cal-report-bars">'+deps.map(function(item){return reportRow(item[0],item[1],maxDep,item[2])}).join("")+'</div></div></article></section>';
}
function reportRow(label,value,max,color){return '<div class="cal-report-row"><span>'+escapeHtml(label)+'</span><div class="cal-bar"><i style="--bar-color:'+color+';width:'+Math.max(4,Math.round(value/max*100))+'%"></i></div><strong>'+value+'</strong></div>'}
function render(){
  var content=page==="dashboard"||page==="agenda"?calendarPage():page==="events"?eventsPage():page==="new"?newEventPage():page==="resources"?resourcesPage():page==="commitments"?commitmentsPage():reportsPage();
  root.innerHTML=shell(content);syncPanelState();
}
function syncPanelState(){var panel=document.getElementById("calPanel");if(panel&&window.innerWidth>900)panel.classList.remove("open")}
function openPanel(){var panel=document.getElementById("calPanel"),backdrop=document.getElementById("calMobileBackdrop");if(panel)panel.classList.add("open");if(backdrop)backdrop.classList.add("open")}
function closePanel(){var panel=document.getElementById("calPanel"),backdrop=document.getElementById("calMobileBackdrop");if(panel)panel.classList.remove("open");if(backdrop)backdrop.classList.remove("open")}
function openModal(html,small){var host=document.getElementById("calModalRoot");if(!host)return;host.innerHTML='<div class="cal-modal-backdrop" data-modal-backdrop><section class="cal-modal '+(small?"cal-modal-sm":"")+'" role="dialog" aria-modal="true" aria-labelledby="calModalTitle" data-modal-panel>'+html+'</section></div>';state.modalOpen=true;setTimeout(function(){var input=host.querySelector("input:not([type=hidden]),select,textarea,button");if(input)input.focus()},20)}
function closeModal(){var host=document.getElementById("calModalRoot");if(host)host.innerHTML="";state.modalOpen=false}
function toast(title,message){var region=document.getElementById("calToastRegion");if(!region)return;var item=document.createElement("div");item.className="cal-toast";item.innerHTML='<strong>'+escapeHtml(title)+'</strong><span>'+escapeHtml(message)+'</span>';region.appendChild(item);setTimeout(function(){item.remove()},3300)}
function quickCreateModal(date,time,resourceId){
  date=date||state.selectedDate;time=time||"09:00";var endDate=parseLocal(date+"T"+time);endDate.setHours(endDate.getHours()+1);var end=pad(endDate.getHours())+":"+pad(endDate.getMinutes());
  openModal('<header class="cal-modal-head"><div><h2 id="calModalTitle">Nuevo evento</h2><p>Agrega una actividad sin salir del calendario</p></div><button class="cal-icon-button" type="button" data-action="close-modal" aria-label="Cerrar">'+icon("x","cal-icon-sm")+'</button></header><div class="cal-modal-body"><form class="cal-form" id="quickEventForm"><div class="cal-field"><label>Nombre del evento</label><input name="title" required minlength="5" autofocus placeholder="¿Qué actividad vas a programar?"></div><div class="cal-quick-grid"><div class="cal-field"><label>Fecha</label><input name="date" type="date" required value="'+escapeHtml(date)+'"></div><div class="cal-field"><label>Categoría</label><select name="category">'+Object.keys(categoryColors).map(function(value){return '<option>'+value+'</option>'}).join("")+'</select></div><div class="cal-field"><label>Hora inicial</label><input name="startTime" type="time" required value="'+escapeHtml(time)+'"></div><div class="cal-field"><label>Hora final</label><input name="endTime" type="time" required value="'+escapeHtml(end)+'"></div><div class="cal-field"><label>Dependencia</label><input name="dependency" required value="Secretaría General" list="quickDependencies"></div><div class="cal-field"><label>Responsable</label><input name="responsible" required placeholder="Persona o equipo"></div><div class="cal-field"><label>Lugar o modalidad</label><input name="location" required placeholder="Sala, auditorio o virtual"></div><div class="cal-field"><label>Recurso</label><select name="resourceId"><option value="">Sin reserva</option>'+state.resources.map(function(resource){return '<option value="'+resource.id+'" '+(resource.id===resourceId?"selected":"")+' '+(resource.status!=="Disponible"?"disabled":"")+'>'+escapeHtml(resource.name)+'</option>'}).join("")+'</select></div></div><datalist id="quickDependencies">'+dependencies.map(function(value){return '<option value="'+escapeHtml(value)+'">'}).join("")+'</datalist></form></div><footer class="cal-modal-actions"><a class="cal-btn" href="'+moduleUrl("./nuevo-evento/?date="+encodeURIComponent(date))+'">Más opciones</a><button class="cal-btn cal-btn-primary" type="submit" form="quickEventForm">'+icon("save","cal-icon-sm")+'Guardar evento</button></footer>',true);
}
function eventDetailModal(event){
  var resource=state.resources.find(function(item){return item.id===event.resourceId});
  openModal('<header class="cal-modal-head"><div><h2 id="calModalTitle">Detalle del evento</h2><p>'+escapeHtml(event.id)+'</p></div><button class="cal-icon-button" type="button" data-action="close-modal" aria-label="Cerrar">'+icon("x","cal-icon-sm")+'</button></header><div class="cal-modal-body"><div class="cal-event-detail-head" style="'+eventStyle(event)+'"><span class="cal-event-detail-bar"></span><div><h3>'+escapeHtml(event.title)+'</h3><p>'+escapeHtml(event.category)+' · '+statusPill(event.status)+'</p></div></div><div class="cal-detail-grid"><div class="cal-detail-item">'+icon("clock","cal-icon-sm")+'<span><span>Fecha y hora</span><strong>'+escapeHtml(formatDateTime(event.start))+' – '+escapeHtml(formatTime(event.end))+'</strong></span></div><div class="cal-detail-item">'+icon("location","cal-icon-sm")+'<span><span>Lugar</span><strong>'+escapeHtml(event.location)+'</strong></span></div><div class="cal-detail-item">'+icon("users","cal-icon-sm")+'<span><span>Responsable</span><strong>'+escapeHtml(event.responsible)+'</strong></span></div><div class="cal-detail-item">'+icon("building","cal-icon-sm")+'<span><span>Dependencia</span><strong>'+escapeHtml(event.dependency)+'</strong></span></div><div class="cal-detail-item">'+icon("users","cal-icon-sm")+'<span><span>Participantes</span><strong>'+Number(event.attendees||0)+' estimados</strong></span></div><div class="cal-detail-item">'+icon("room","cal-icon-sm")+'<span><span>Recurso</span><strong>'+escapeHtml(resource?resource.name:"Sin reserva")+'</strong></span></div></div><div class="cal-detail-section"><h4>Descripción</h4><p>'+escapeHtml(event.description||"Sin descripción")+'</p></div>'+(event.notes?'<div class="cal-detail-section"><h4>Notas operativas</h4><p>'+escapeHtml(event.notes)+'</p></div>':"")+'</div><footer class="cal-modal-actions"><button class="cal-btn cal-btn-danger" type="button" data-delete-event="'+event.id+'">'+icon("trash","cal-icon-sm")+'Eliminar</button><button class="cal-btn" type="button" data-duplicate-event="'+event.id+'">'+icon("copy","cal-icon-sm")+'Duplicar</button><button class="cal-btn cal-btn-primary" type="button" data-edit-event="'+event.id+'">'+icon("edit","cal-icon-sm")+'Editar</button></footer>');
}
function editEventModal(event){openModal('<header class="cal-modal-head"><div><h2 id="calModalTitle">Editar evento</h2><p>'+escapeHtml(event.id)+'</p></div><button class="cal-icon-button" type="button" data-action="close-modal" aria-label="Cerrar">'+icon("x","cal-icon-sm")+'</button></header><div class="cal-modal-body">'+eventForm(event)+'</div>')}
function commitmentModal(eventId){openModal('<header class="cal-modal-head"><div><h2 id="calModalTitle">Nuevo compromiso</h2><p>Registra una acción de seguimiento</p></div><button class="cal-icon-button" type="button" data-action="close-modal" aria-label="Cerrar">'+icon("x","cal-icon-sm")+'</button></header><div class="cal-modal-body"><form class="cal-form" id="commitmentForm"><div class="cal-field"><label>Compromiso</label><input name="title" required minlength="5" placeholder="Acción verificable"></div><div class="cal-quick-grid"><div class="cal-field"><label>Evento relacionado</label><select name="eventId"><option value="">Sin evento asociado</option>'+state.events.map(function(event){return '<option value="'+event.id+'" '+(event.id===eventId?"selected":"")+'>'+escapeHtml(event.title)+'</option>'}).join("")+'</select></div><div class="cal-field"><label>Responsable</label><input name="responsible" required></div><div class="cal-field"><label>Fecha límite</label><input name="due" type="date" value="'+isoDate(addDays(actualToday,3))+'" required></div><div class="cal-field"><label>Prioridad</label><select name="priority"><option>Media</option><option>Alta</option><option>Baja</option></select></div></div></form></div><footer class="cal-modal-actions"><button class="cal-btn" type="button" data-action="close-modal">Cancelar</button><button class="cal-btn cal-btn-primary" type="submit" form="commitmentForm">'+icon("save","cal-icon-sm")+'Guardar compromiso</button></footer>',true)}
function bookingModal(resourceId){quickCreateModal(state.selectedDate,"09:00",resourceId||"")}
function hasResourceConflict(resourceId,start,end,ignoreId){if(!resourceId)return false;var a=parseLocal(start),b=parseLocal(end);return state.events.some(function(event){return event.id!==ignoreId&&event.resourceId===resourceId&&event.status!=="Cancelado"&&a<parseLocal(event.end)&&b>parseLocal(event.start)})}
function saveEventFromForm(form,quick){
  var fd=new FormData(form),id=String(fd.get("id")||"");var date=String(fd.get("date")||"");var start=date+"T"+String(fd.get("startTime")||"");var end=date+"T"+String(fd.get("endTime")||"");
  if(parseLocal(end)<=parseLocal(start)){toast("Revisa el horario","La hora final debe ser posterior a la inicial.");return false}
  var resourceId=String(fd.get("resourceId")||"");if(hasResourceConflict(resourceId,start,end,id)){toast("Recurso no disponible","Existe otra reserva en el mismo horario.");return false}
  var title=String(fd.get("title")||"").trim(),responsible=String(fd.get("responsible")||"").trim(),locationText=String(fd.get("location")||"").trim();
  if(title.length<5||!responsible||!locationText){toast("Faltan datos","Completa el nombre, responsable y lugar.");return false}
  var existing=state.events.find(function(event){return event.id===id});
  var item={id:id||uid("EVT"),title:title,description:String(fd.get("description")||(quick?"Actividad programada desde la creación rápida.":"")).trim(),start:start,end:end,category:String(fd.get("category")||"Institucional"),status:String(fd.get("status")||"Programado"),dependency:String(fd.get("dependency")||"Secretaría General").trim(),responsible:responsible,location:locationText,resourceId:resourceId,attendees:Number(fd.get("attendees")||1),priority:existing?existing.priority:"Media",public:fd.get("public")==="on",notes:String(fd.get("notes")||"").trim()};
  var index=state.events.findIndex(function(event){return event.id===id});if(index>=0)state.events[index]=Object.assign({},state.events[index],item);else state.events.push(item);
  if(dependencies.indexOf(item.dependency)<0){dependencies.push(item.dependency);dependencies.sort(function(a,b){return a.localeCompare(b,"es")});state.visibleDependencies.add(item.dependency)}
  state.selectedDate=date;state.anchor=parseLocal(date);state.miniMonth=new Date(state.anchor.getFullYear(),state.anchor.getMonth(),1);persist();closeModal();toast(id?"Evento actualizado":"Evento programado","La agenda institucional fue actualizada.");return true;
}
function csvDownload(filename,rows){var csv=rows.map(function(row){return row.map(function(value){return '"'+String(value==null?"":value).replace(/"/g,'""')+'"'}).join(",")}).join("\n");var blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});var link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(link.href)},0)}
function movePeriod(direction){if(state.view==="month")state.anchor=addMonths(state.anchor,direction);else if(state.view==="week")state.anchor=addDays(state.anchor,7*direction);else state.anchor=addDays(state.anchor,direction);state.selectedDate=isoDate(state.anchor);state.miniMonth=new Date(state.anchor.getFullYear(),state.anchor.getMonth(),1);persist();render()}
function goToday(){state.anchor=new Date(actualToday);state.selectedDate=isoDate(actualToday);state.miniMonth=new Date(actualToday.getFullYear(),actualToday.getMonth(),1);persist();render()}
function selectDate(value,navigate){state.selectedDate=value;state.anchor=parseLocal(value);state.miniMonth=new Date(state.anchor.getFullYear(),state.anchor.getMonth(),1);persist();if(navigate&&page!=="dashboard"&&page!=="agenda")location.href=moduleUrl("./agenda/?date="+encodeURIComponent(value)+"&view="+encodeURIComponent(state.view));else render()}
function toggleAllCalendars(){if(state.visibleDependencies.size===dependencies.length)state.visibleDependencies.clear();else dependencies.forEach(function(dep){state.visibleDependencies.add(dep)});persist();render()}
function updateSearchResults(){var input=document.getElementById("calGlobalSearch"),results=document.getElementById("calSearchResults"),clear=document.querySelector('[data-action="clear-search"]');if(input)state.globalSearch=input.value;if(results){results.innerHTML=searchResultsMarkup();results.hidden=!state.globalSearch}if(clear)clear.hidden=!state.globalSearch}
function handleClick(event){
  var target=event.target;
  if(target.matches("[data-modal-backdrop]")){closeModal();return}
  var actionTarget=target.closest("[data-action]");
  if(actionTarget){
    var action=actionTarget.dataset.action;
    if(action==="open-panel")openPanel();
    else if(action==="close-panel")closePanel();
    else if(action==="close-modal")closeModal()
    else if(action==="quick-create")quickCreateModal(actionTarget.dataset.date||state.selectedDate,"09:00","");
    else if(action==="mini-prev"){state.miniMonth=addMonths(state.miniMonth,-1);persist();render()}
    else if(action==="mini-next"){state.miniMonth=addMonths(state.miniMonth,1);persist();render()}
    else if(action==="toggle-all-calendars")toggleAllCalendars();
    else if(action==="previous-period")movePeriod(-1);
    else if(action==="next-period")movePeriod(1);
    else if(action==="today")goToday();
    else if(action==="notifications")toast("Agenda al día",state.commitments.filter(function(item){return !item.done}).length+" compromisos y "+upcomingEvents(20).length+" eventos próximos.");
    else if(action==="clear-search"){state.globalSearch="";var search=document.getElementById("calGlobalSearch");if(search){search.value="";search.focus()}updateSearchResults()}
    else if(action==="print")window.print();
    else if(action==="export-events")csvDownload("eventos-calendario-institucional.csv",[["ID","Evento","Inicio","Fin","Categoría","Estado","Dependencia","Responsable","Lugar"].concat([])].concat(state.events.map(function(item){return [item.id,item.title,item.start,item.end,item.category,item.status,item.dependency,item.responsible,item.location]})));
    else if(action==="export-report")csvDownload("resumen-calendario-institucional.csv",[["Indicador","Valor"],["Eventos registrados",state.events.length],["Eventos realizados",state.events.filter(function(item){return item.status==="Realizado"}).length],["Actividades públicas",state.events.filter(function(item){return item.public}).length],["Compromisos pendientes",state.commitments.filter(function(item){return !item.done}).length],["Recursos controlados",state.resources.length]]);
    else if(action==="new-booking")bookingModal("");
    else if(action==="new-commitment")commitmentModal("");
    return;
  }
  var viewButton=target.closest("[data-view]");if(viewButton){state.view=viewButton.dataset.view;persist();render();return}
  var dep=target.closest("[data-dependency-toggle]");if(dep){var name=dep.dataset.dependencyToggle;if(state.visibleDependencies.has(name))state.visibleDependencies.delete(name);else state.visibleDependencies.add(name);persist();render();return}
  var mini=target.closest("[data-mini-date]");if(mini){selectDate(mini.dataset.miniDate,page!=="dashboard"&&page!=="agenda");return}
  var eventButton=target.closest("[data-event-id]");if(eventButton){var item=state.events.find(function(candidate){return candidate.id===eventButton.dataset.eventId});if(item)eventDetailModal(item);return}
  var day=target.closest("[data-select-date]");if(day){selectDate(day.dataset.selectDate,false);return}
  var edit=target.closest("[data-edit-event]");if(edit){var editItem=state.events.find(function(candidate){return candidate.id===edit.dataset.editEvent});if(editItem)editEventModal(editItem);return}
  var duplicate=target.closest("[data-duplicate-event]");if(duplicate){var source=state.events.find(function(candidate){return candidate.id===duplicate.dataset.duplicateEvent});if(source){var copy=clone(source);copy.id=uid("EVT");copy.title=source.title+" · copia";var start=addDays(parseLocal(source.start),7),end=addDays(parseLocal(source.end),7);copy.start=isoDateTime(start);copy.end=isoDateTime(end);state.events.push(copy);persist();closeModal();render();toast("Evento duplicado","La copia se programó una semana después.")}return}
  var del=target.closest("[data-delete-event]");if(del){if(confirm("¿Eliminar este evento de la agenda institucional?")){state.events=state.events.filter(function(candidate){return candidate.id!==del.dataset.deleteEvent});persist();closeModal();render();toast("Evento eliminado","La actividad fue retirada del calendario.")}return}
  var resource=target.closest("[data-resource-book]");if(resource){bookingModal(resource.dataset.resourceBook);return}
  var toggle=target.closest("[data-toggle-commitment]");if(toggle){var task=state.commitments.find(function(item){return item.id===toggle.dataset.toggleCommitment});if(task){task.done=!task.done;persist();render();toast(task.done?"Compromiso completado":"Compromiso reabierto",task.title)}return}
  if(target.id==="calMobileBackdrop")closePanel();
  var searchContainer=target.closest(".cal-search");if(!searchContainer){var results=document.getElementById("calSearchResults");if(results)results.hidden=true}
}
function handleTimeColumnClick(event){var column=event.target.closest("[data-time-column]");if(!column||event.target.closest("[data-event-id]"))return;var rect=column.getBoundingClientRect();var relative=Math.max(0,Math.min(rect.height,event.clientY-rect.top));var minutes=7*60+Math.round((relative/52)*60/30)*30;minutes=Math.min(minutes,19*60);quickCreateModal(column.dataset.timeColumn,pad(Math.floor(minutes/60))+":"+pad(minutes%60),"")}
function handleSubmit(event){
  if(event.target.id==="quickEventForm"){event.preventDefault();if(saveEventFromForm(event.target,true)){render()}return}
  if(event.target.id==="eventForm"){event.preventDefault();if(saveEventFromForm(event.target,false)){if(page==="new")setTimeout(function(){location.href=moduleUrl("./eventos/")},350);else render()}return}
  if(event.target.id==="commitmentForm"){event.preventDefault();var fd=new FormData(event.target);state.commitments.push({id:uid("CMP"),title:String(fd.get("title")||"").trim(),eventId:String(fd.get("eventId")||""),responsible:String(fd.get("responsible")||"").trim(),due:String(fd.get("due")||""),priority:String(fd.get("priority")||"Media"),done:false});persist();closeModal();render();toast("Compromiso registrado","La acción fue agregada al seguimiento.")}
}
function handleInput(event){
  if(event.target.id==="calGlobalSearch"){updateSearchResults();return}
  if(event.target.id==="eventSearch"){state.eventSearch=event.target.value;var pos=event.target.selectionStart;render();setTimeout(function(){var input=document.getElementById("eventSearch");if(input){input.focus();input.setSelectionRange(pos,pos)}},0);return}
}
function handleChange(event){
  if(event.target.id==="eventStatus"){state.eventStatus=event.target.value;render()}
  else if(event.target.id==="eventCategory"){state.eventCategory=event.target.value;render()}
  else if(event.target.id==="eventDependency"){state.eventDependency=event.target.value;render()}
}
function handleKeydown(event){
  if(event.key==="Escape"){if(state.modalOpen)closeModal();else closePanel()}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();var input=document.getElementById("calGlobalSearch");if(input)input.focus()}
  if(event.key==="Enter"&&event.target.matches("[data-select-date]")){selectDate(event.target.dataset.selectDate,false)}
}
document.addEventListener("click",function(event){handleTimeColumnClick(event);handleClick(event)});
document.addEventListener("submit",handleSubmit);
document.addEventListener("input",handleInput);
document.addEventListener("change",handleChange);
document.addEventListener("keydown",handleKeydown);
window.addEventListener("resize",function(){if(window.innerWidth>900)closePanel()},{passive:true});
window.CalendarInstitutional={version:VERSION,getState:function(){return state},render:render,openEvent:function(id){var item=state.events.find(function(event){return event.id===id});if(item)eventDetailModal(item)}};
render();
})();
