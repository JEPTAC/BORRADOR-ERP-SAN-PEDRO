(function(){
"use strict";
const VERSION="29.0.0";
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
const today=new Date();
const formatDate=(value)=>new Intl.DateTimeFormat("es-CO",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value));
const formatShort=(value)=>new Intl.DateTimeFormat("es-CO",{day:"2-digit",month:"short"}).format(new Date(value));
const formatDateTime=(value)=>new Intl.DateTimeFormat("es-CO",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(value));
const initials=(name)=>String(name||"Usuario").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();
const iconPaths={
 dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 ticket:'<path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4z"/><path d="M9 8v8"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 grid:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
 monitor:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
 wrench:'<path d="M14 6a4 4 0 0 0-5 5L3 17l4 4 6-6a4 4 0 0 0 5-5l-3 3-4-4 3-3Z"/>',
 image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 17 5-5 4 4 2-2 5 5"/>',
 book:'<path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-6a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h6z"/>',
 chart:'<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
 building:'<path d="M4 21V8l8-4 8 4v13M8 10h2m4 0h2M8 14h2m4 0h2M9 21v-4h6v4"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 alert:'<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/>',
 filter:'<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
 x:'<path d="m6 6 12 12M18 6 6 18"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
 folder:'<path d="M3 6h7l2 2h9v11H3z"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
 printer:'<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>',
 network:'<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-2h12v2"/>',
 shield:'<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
 save:'<path d="M5 3h12l2 2v16H5z"/><path d="M8 3v6h8V3M8 17h8"/>'
};
function icon(name,cls=""){
 const path=iconPaths[name]||iconPaths.info;
 return `<svg class="itsm-icon ${cls}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
}
const seed={
 tickets:[
  {id:"TIC-2026-041",title:"Equipo sin acceso a la red institucional",description:"El computador de Tesorería perdió conectividad después de una actualización.",category:"Redes",priority:"Crítica",status:"En proceso",requester:"María Fernanda Rojas",dependency:"Hacienda",assignee:"Juan E. Pérez",created:"2026-08-05T08:10:00",sla:78,channel:"Portal",history:["Ticket radicado por la dependencia","Prioridad validada por Mesa TIC","Diagnóstico remoto iniciado"]},
  {id:"TIC-2026-040",title:"Instalación de impresora en Contratación",description:"Configurar impresora de red y validar permisos de impresión.",category:"Equipos",priority:"Media",status:"Abierto",requester:"Carlos Muñoz",dependency:"Contratación",assignee:"Sin asignar",created:"2026-08-05T07:35:00",sla:24,channel:"Portal",history:["Ticket radicado por la dependencia"]},
  {id:"TIC-2026-039",title:"Publicación de pieza para jornada comunitaria",description:"Validar formato y publicar pieza institucional en canales digitales.",category:"Comunicaciones",priority:"Alta",status:"En espera",requester:"Laura Gómez",dependency:"Despacho",assignee:"Juan E. Pérez",created:"2026-08-04T15:20:00",sla:64,channel:"Correo",history:["Solicitud recibida","Diseño validado","Pendiente visto bueno de Despacho"]},
  {id:"TIC-2026-038",title:"Actualización del portal de transparencia",description:"Incorporar documentos del módulo de planes y políticas.",category:"Portal web",priority:"Alta",status:"En proceso",requester:"Ana Lucía Torres",dependency:"Secretaría General",assignee:"Juan E. Pérez",created:"2026-08-04T10:05:00",sla:82,channel:"Portal",history:["Solicitud clasificada","Documentos revisados","Actualización en curso"]},
  {id:"TIC-2026-037",title:"Cambio de contraseña de correo institucional",description:"Restablecimiento de credenciales para funcionario de Planeación.",category:"Cuentas",priority:"Baja",status:"Cerrado",requester:"Pedro Ruiz",dependency:"Planeación",assignee:"Juan E. Pérez",created:"2026-08-03T09:00:00",sla:100,channel:"Teléfono",history:["Solicitud registrada","Identidad verificada","Contraseña restablecida","Cierre confirmado"]},
  {id:"TIC-2026-036",title:"Revisión preventiva de portátil",description:"El equipo presenta calentamiento y lentitud intermitente.",category:"Mantenimiento",priority:"Media",status:"Cerrado",requester:"Diana Castro",dependency:"Gobierno",assignee:"Juan E. Pérez",created:"2026-08-02T11:30:00",sla:100,channel:"Portal",history:["Equipo recibido","Limpieza y diagnóstico ejecutados","Equipo entregado"]}
 ],
 services:[
  {id:"support",name:"Soporte técnico",icon:"wrench",description:"Incidentes de software, hardware, periféricos y operación de equipos.",sla:"4–24 horas",category:"Soporte"},
  {id:"accounts",name:"Cuentas y accesos",icon:"shield",description:"Creación, recuperación o ajuste de accesos institucionales.",sla:"4–12 horas",category:"Identidad"},
  {id:"network",name:"Redes y conectividad",icon:"network",description:"Internet, red local, puntos de red, Wi-Fi y conectividad segura.",sla:"2–12 horas",category:"Infraestructura"},
  {id:"design",name:"Diseño y publicaciones",icon:"image",description:"Piezas gráficas, contenidos, publicación web y redes institucionales.",sla:"24–72 horas",category:"Comunicaciones"},
  {id:"equipment",name:"Equipos e inventario",icon:"monitor",description:"Asignación, traslado, diagnóstico y control de activos TIC.",sla:"8–48 horas",category:"Activos"},
  {id:"portal",name:"Portales y aplicativos",icon:"grid",description:"Ajustes en páginas, formularios, módulos y aplicaciones internas.",sla:"24–72 horas",category:"Desarrollo"}
 ],
 assets:[
  {code:"SP-TIC-001",name:"Portátil Dell Latitude 5420",type:"Portátil",dependency:"Secretaría General",user:"Juan E. Pérez",status:"Operativo",health:92,last:"2026-07-22"},
  {code:"SP-TIC-014",name:"Impresora HP LaserJet Pro",type:"Impresora",dependency:"Contratación",user:"Área compartida",status:"En revisión",health:61,last:"2026-08-05"},
  {code:"SP-TIC-027",name:"Equipo Lenovo ThinkCentre",type:"Escritorio",dependency:"Hacienda",user:"Tesorería",status:"Operativo",health:84,last:"2026-07-30"},
  {code:"SP-TIC-033",name:"Switch administrable 24 puertos",type:"Red",dependency:"Centro de datos",user:"Infraestructura",status:"Operativo",health:96,last:"2026-06-19"},
  {code:"SP-TIC-041",name:"Portátil HP ProBook",type:"Portátil",dependency:"Gobierno",user:"Diana Castro",status:"Mantenimiento",health:48,last:"2026-08-02"}
 ],
 maintenance:[
  {id:"MAN-028",asset:"SP-TIC-041",title:"Limpieza interna y revisión térmica",type:"Preventivo",date:"2026-08-08",status:"Programado",responsible:"Juan E. Pérez"},
  {id:"MAN-027",asset:"SP-TIC-014",title:"Diagnóstico de bandeja y controlador",type:"Correctivo",date:"2026-08-06",status:"En proceso",responsible:"Juan E. Pérez"},
  {id:"MAN-026",asset:"SP-TIC-033",title:"Revisión de puertos y respaldo de configuración",type:"Preventivo",date:"2026-08-14",status:"Programado",responsible:"Proveedor / TIC"},
  {id:"MAN-025",asset:"SP-TIC-001",title:"Actualización y limpieza lógica",type:"Preventivo",date:"2026-07-22",status:"Completado",responsible:"Juan E. Pérez"}
 ],
 communications:[
  {id:"COM-019",title:"Pieza jornada Carrera Sexta",type:"Diseño gráfico",dependency:"Despacho",date:"2026-08-05",status:"En aprobación",responsible:"Juan E. Pérez"},
  {id:"COM-018",title:"Publicación informe de gestión",type:"Portal web",dependency:"Secretaría General",date:"2026-08-04",status:"En proceso",responsible:"Juan E. Pérez"},
  {id:"COM-017",title:"Actualización banner de salud",type:"Diseño y portal",dependency:"Salud",date:"2026-08-02",status:"Publicado",responsible:"Juan E. Pérez"},
  {id:"COM-016",title:"Convocatoria participación ciudadana",type:"Redes sociales",dependency:"Gobierno",date:"2026-07-31",status:"Publicado",responsible:"Juan E. Pérez"}
 ],
 knowledge:[
  {id:"KB-01",title:"Cómo restablecer una contraseña institucional",category:"Cuentas",views:86,updated:"2026-07-29",description:"Procedimiento de verificación, cambio seguro y cierre de sesión."},
  {id:"KB-02",title:"Solución rápida cuando no hay conexión a Internet",category:"Redes",views:73,updated:"2026-07-27",description:"Validaciones básicas antes de escalar un incidente de conectividad."},
  {id:"KB-03",title:"Cómo solicitar una publicación institucional",category:"Comunicaciones",views:61,updated:"2026-07-31",description:"Información, formatos, tiempos y aprobaciones necesarias."},
  {id:"KB-04",title:"Buenas prácticas para el cuidado de equipos",category:"Equipos",views:54,updated:"2026-07-22",description:"Medidas preventivas para prolongar la vida útil de los activos TIC."},
  {id:"KB-05",title:"Guía para crear un ticket completo",category:"Mesa TIC",views:102,updated:"2026-08-01",description:"Cómo describir la necesidad y adjuntar evidencia útil."},
  {id:"KB-06",title:"Lineamientos para publicación en el portal web",category:"Portal web",views:47,updated:"2026-07-30",description:"Criterios de accesibilidad, peso, formato y aprobación."}
 ]
};
const memory={};
const STORAGE_PREFIX="sp_itsm_v29_";
const LEGACY_PREFIX="sp_itsm_v28_";
const store={
 get(key,fallback){
  try{
   const current=localStorage.getItem(`${STORAGE_PREFIX}${key}`);
   if(current)return JSON.parse(current);
   const legacy=localStorage.getItem(`${LEGACY_PREFIX}${key}`);
   if(legacy){const parsed=JSON.parse(legacy);localStorage.setItem(`${STORAGE_PREFIX}${key}`,JSON.stringify(parsed));return parsed}
   return fallback;
  }catch(_){return memory[key]??fallback}
 },
 set(key,value){try{localStorage.setItem(`${STORAGE_PREFIX}${key}`,JSON.stringify(value))}catch(_){memory[key]=value}}
};
function getData(key){const current=store.get(key,null);if(current)return current;const value=JSON.parse(JSON.stringify(seed[key]));store.set(key,value);return value}
function statusClass(status){return ({"Abierto":"status-open","En proceso":"status-progress","En espera":"status-waiting","Resuelto":"status-resolved","Cerrado":"status-closed","Programado":"status-planned","Completado":"status-closed","En revisión":"status-progress","Operativo":"status-closed","Mantenimiento":"status-waiting","En aprobación":"status-waiting","Publicado":"status-closed"}[status]||"status-open")}
function priorityClass(priority){return ({"Crítica":"priority-critical","Alta":"priority-high","Media":"priority-medium","Baja":"priority-low"}[priority]||"priority-low")}
function statusPill(status){return `<span class="itsm-status ${statusClass(status)}">${escapeHtml(status)}</span>`}
function priorityPill(priority){return `<span class="itsm-priority ${priorityClass(priority)}">${escapeHtml(priority)}</span>`}
const nav=[
 {group:"Operación",items:[
  {id:"dashboard",label:"Centro de control",icon:"dashboard",href:"index.html"},
  {id:"tickets",label:"Tickets",icon:"ticket",href:"tickets/index.html",count:()=>getData("tickets").filter(x=>!["Resuelto","Cerrado"].includes(x.status)).length},
  {id:"new",label:"Nuevo ticket",icon:"plus",href:"nuevo-ticket/index.html"},
  {id:"catalog",label:"Catálogo de servicios",icon:"grid",href:"catalogo/index.html"}
 ]},
 {group:"Gestión TIC",items:[
  {id:"assets",label:"Inventario TIC",icon:"monitor",href:"inventario/index.html"},
  {id:"maintenance",label:"Mantenimientos",icon:"wrench",href:"mantenimientos/index.html"},
  {id:"communications",label:"Diseño y publicaciones",icon:"image",href:"comunicaciones/index.html"},
  {id:"knowledge",label:"Base de conocimiento",icon:"book",href:"conocimiento/index.html"},
  {id:"reports",label:"Indicadores y reportes",icon:"chart",href:"reportes/index.html"}
 ]}
];
function renderNav(){return nav.map(group=>`<div class="itsm-nav-group">${group.group}</div>${group.items.map(item=>`<a class="itsm-nav-link ${page===item.id?'active':''}" href="${url(item.href)}">${icon(item.icon)}<span>${item.label}</span>${item.count?`<b class="itsm-nav-count">${item.count()}</b>`:""}</a>`).join("")}`).join("")}
function shell(content,title,subtitle){return `<div class="itsm-layout">
 <aside class="itsm-sidebar" id="itsmSidebar">
  <a class="itsm-brand" href="${url('index.html')}"><span class="itsm-brand-logo"><img src="${url('shared/san-pedro.svg')}" alt="Alcaldía de San Pedro"></span><span class="itsm-brand-copy"><strong>Mesa de Servicios TIC</strong><span>ERP Municipal</span></span></a>
  <div class="itsm-context"><span class="itsm-pulse"></span>Operación local · sin Supabase</div>
  <nav class="itsm-nav" aria-label="Módulos de Mesa TIC">${renderNav()}</nav>
  <div class="itsm-sidebar-footer"><div class="itsm-user"><span class="itsm-avatar">JP</span><span class="itsm-user-copy"><strong>Juan E. Pérez</strong><span>Administrador TIC</span></span>${icon('settings','itsm-icon-sm')}</div></div>
 </aside>
 <div class="itsm-sidebar-backdrop" id="itsmSidebarBackdrop"></div>
 <main class="itsm-main">
  <header class="itsm-topbar">
   <button class="itsm-top-action itsm-menu-btn" id="itsmMenuBtn" aria-label="Abrir menú">${icon('menu')}</button>
   <div class="itsm-top-title"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(subtitle)}</span></div>
   <label class="itsm-top-search">${icon('search')}<input id="itsmGlobalSearch" type="search" placeholder="Buscar en esta pantalla…" autocomplete="off"></label>
   <a class="itsm-dependencies" href="${rootUrl('launcher/index.html')}">${icon('building','itsm-icon-sm')}<span>Todas las dependencias</span></a>
   <button class="itsm-top-action" id="itsmBell" aria-label="Notificaciones">${icon('bell')}</button>
  </header>
  <section class="itsm-content" id="itsmContent">${content}</section>
 </main>
</div>
<div class="itsm-modal-backdrop" id="itsmModalBackdrop" role="presentation"><section class="itsm-modal" id="itsmModal" role="dialog" aria-modal="true" aria-labelledby="itsmModalTitle"></section></div>
<div class="itsm-toast" id="itsmToast" role="status" aria-live="polite"></div>`}
function head(eyebrow,title,description,actions=""){return `<div class="itsm-page-head"><div><div class="itsm-eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>${actions?`<div class="itsm-actions">${actions}</div>`:""}</div>`}
function metric(iconName,value,label,trend="",tone=""){return `<article class="itsm-metric searchable"><div class="itsm-metric-head"><span class="itsm-icon-box ${tone}">${icon(iconName)}</span>${trend?`<span class="itsm-trend ${trend.includes('-')?'risk':'up'}">${trend}</span>`:""}</div><div class="itsm-metric-value">${value}</div><div class="itsm-metric-label">${label}</div></article>`}
function quick(iconName,title,desc,href,meta){return `<a class="itsm-quick-card searchable" href="${url(href)}"><span class="itsm-icon-box">${icon(iconName)}</span><h3>${title}</h3><p>${desc}</p><div class="itsm-card-meta"><span>${meta}</span>${icon('arrow','itsm-icon-sm')}</div></a>`}
function ticketRow(t){return `<tr class="searchable" data-ticket="${escapeHtml(t.id)}"><td><span class="itsm-code">${escapeHtml(t.id)}</span></td><td><strong>${escapeHtml(t.title)}</strong><span class="itsm-subline">${escapeHtml(t.dependency)} · ${escapeHtml(t.category)}</span></td><td>${priorityPill(t.priority)}</td><td>${statusPill(t.status)}</td><td>${escapeHtml(t.assignee)}</td><td>${escapeHtml(formatShort(t.created))}</td><td><div class="itsm-progress ${t.sla<40?'danger':t.sla<70?'warning':'success'}"><span style="width:${Math.min(100,t.sla)}%"></span></div><span class="itsm-subline">${t.sla}% del SLA</span></td><td class="itsm-action-cell"><button class="itsm-btn itsm-btn-sm js-open-ticket" data-id="${escapeHtml(t.id)}">${icon('settings','itsm-icon-sm')}Gestionar</button></td></tr>`}
function ticketCard(t){return `<article class="itsm-ticket-card searchable js-open-ticket" data-id="${escapeHtml(t.id)}"><div class="itsm-card-meta" style="margin:0;padding:0;border:0"><span class="itsm-code">${escapeHtml(t.id)}</span>${priorityPill(t.priority)}</div><h4>${escapeHtml(t.title)}</h4><p>${escapeHtml(t.dependency)} · ${escapeHtml(t.category)}</p><footer><span class="itsm-mini-avatar">${initials(t.assignee)}</span>${statusPill(t.status)}</footer></article>`}
function dashboard(){
 const tickets=getData('tickets');
 const active=tickets.filter(x=>!["Resuelto","Cerrado"].includes(x.status));
 const completed=tickets.filter(x=>["Resuelto","Cerrado"].includes(x.status));
 const critical=tickets.filter(x=>x.priority==="Crítica"&&!["Resuelto","Cerrado"].includes(x.status));
 const recent=[...tickets].sort((a,b)=>new Date(b.updatedAt||b.created)-new Date(a.updatedAt||a.created)).slice(0,5);
 return head('Mesa de Servicios TIC','Centro de control','Gestión integral de soporte, activos, mantenimientos, publicaciones y conocimiento institucional.',`<a class="itsm-btn itsm-btn-primary" href="${url('nuevo-ticket/index.html')}">${icon('plus','itsm-icon-sm')}Nuevo ticket</a>`)+
 `<section class="itsm-hero itsm-surface-blue"><div><div class="itsm-eyebrow">Operación institucional</div><h2>Soporte organizado, trazable y resolutivo</h2><p>Cada solicitud tiene prioridad, responsable, tiempos, actuaciones y una solución documentada antes de su cierre.</p><div class="itsm-hero-actions"><a class="itsm-btn itsm-btn-primary" href="${url('tickets/index.html')}">${icon('ticket','itsm-icon-sm')}Ver tickets</a><a class="itsm-btn" href="${url('reportes/index.html')}">${icon('chart','itsm-icon-sm')}Indicadores</a></div></div><div class="itsm-score"><strong>91%</strong><span>Cumplimiento del SLA</span><div class="itsm-score-bar"><i style="width:91%"></i></div></div></section>`+
 `<section class="itsm-metrics">${metric('ticket',active.length,'Tickets activos','Flujo operativo')}${metric('alert',critical.length,'Casos críticos','Atención inmediata','danger')}${metric('check',completed.length,'Resueltos o cerrados','Con solución documentada','success')}${metric('clock','6,4 h','Tiempo medio de atención','-12%','warning')}</section>`+
 `<section class="itsm-grid itsm-grid-4" style="margin-bottom:16px">${quick('plus','Radicar solicitud','Crear un caso con datos completos y prioridad definida.','nuevo-ticket/index.html','Formulario guiado')}${quick('monitor','Inventario TIC','Consultar equipos, estado, usuario y mantenimiento.','inventario/index.html',`${getData('assets').length} activos`)}${quick('image','Diseño y publicaciones','Controlar piezas, portales y aprobaciones institucionales.','comunicaciones/index.html',`${getData('communications').length} solicitudes`)}${quick('book','Base de conocimiento','Resolver necesidades frecuentes con guías institucionales.','conocimiento/index.html',`${getData('knowledge').length} artículos`)}</section>`+
 `<section class="itsm-grid itsm-grid-2"><article class="itsm-card"><div class="itsm-card-head"><div><h2>Actividad reciente</h2><p>Abre un caso para gestionarlo, resolverlo o cerrarlo</p></div><a class="itsm-btn itsm-btn-sm" href="${url('tickets/index.html')}">Ver todos</a></div><div class="itsm-list">${recent.map(t=>`<button class="itsm-list-row js-open-ticket searchable" data-id="${escapeHtml(t.id)}" style="width:100%;border-left:0;border-right:0;border-top:0;text-align:left;cursor:pointer"><span class="itsm-icon-box">${icon(t.category==='Comunicaciones'?'image':t.category==='Redes'?'network':'ticket')}</span><span class="itsm-list-main"><strong>${escapeHtml(t.title)}</strong><span>${escapeHtml(t.id)} · ${escapeHtml(t.dependency)}</span></span><span class="itsm-list-side"><strong>${escapeHtml(formatShort(t.updatedAt||t.created))}</strong>${statusPill(t.status)}</span></button>`).join('')}</div></article><article class="itsm-card"><div class="itsm-card-head"><div><h2>Estado de servicios</h2><p>Disponibilidad operativa de componentes</p></div></div><div class="itsm-card-body"><div class="itsm-list">${[['Portal ERP','Disponible','health-good'],['Red institucional','Disponible','health-good'],['Correo institucional','Operativo','health-good'],['Impresión Contratación','En revisión','health-warning']].map(x=>`<div class="itsm-list-row" style="padding-left:0;padding-right:0"><span class="itsm-health-dot ${x[2]}"></span><span class="itsm-list-main"><strong>${x[0]}</strong><span>Supervisión local</span></span><span class="itsm-list-side"><strong>${x[1]}</strong></span></div>`).join('')}</div></div></article></section>`;
}
function ticketsPage(){
 const tickets=getData('tickets');
 return head('Gestión de casos','Tickets','Consulta, asigna, documenta, resuelve y cierra las solicitudes TIC.',`<a class="itsm-btn itsm-btn-primary" href="${url('nuevo-ticket/index.html')}">${icon('plus','itsm-icon-sm')}Nuevo ticket</a><button class="itsm-btn" id="exportTickets">${icon('download','itsm-icon-sm')}Exportar CSV</button>`)+
 `<div class="itsm-toolbar"><div class="itsm-filter-row" id="ticketFilters"><button class="itsm-chip active" data-status="Todos">Todos</button><button class="itsm-chip" data-status="Abierto">Abiertos</button><button class="itsm-chip" data-status="En proceso">En proceso</button><button class="itsm-chip" data-status="En espera">En espera</button><button class="itsm-chip" data-status="Resuelto">Resueltos</button><button class="itsm-chip" data-status="Cerrado">Cerrados</button></div><span style="color:var(--tic-muted);font-size:10px"><b id="ticketCount">${tickets.length}</b> casos visibles</span></div><div class="itsm-table-wrap"><table class="itsm-table"><thead><tr><th>Ticket</th><th>Solicitud</th><th>Prioridad</th><th>Estado</th><th>Responsable</th><th>Fecha</th><th>SLA</th><th>Acción</th></tr></thead><tbody id="ticketRows">${tickets.map(ticketRow).join('')}</tbody></table></div>`;
}
function newTicketPage(){const service=new URLSearchParams(location.search).get('service')||'';return head('Radicación','Nuevo ticket','Registra la necesidad con información suficiente para clasificarla y atenderla correctamente.')+`<section class="itsm-grid itsm-grid-2"><article class="itsm-card"><div class="itsm-card-head"><div><h2>Datos de la solicitud</h2><p>Los campos marcados son necesarios para crear el caso</p></div></div><div class="itsm-card-body"><form class="itsm-form" id="newTicketForm"><div class="itsm-form-grid"><div class="itsm-field"><label for="requester">Solicitante *</label><input id="requester" name="requester" required placeholder="Nombre completo"></div><div class="itsm-field"><label for="dependency">Dependencia *</label><select id="dependency" name="dependency" required><option value="">Seleccionar…</option>${['Despacho','Secretaría General','Gobierno','Hacienda','Planeación','Contratación','Salud','Control Interno'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="itsm-field"><label for="category">Categoría *</label><select id="category" name="category" required><option value="">Seleccionar…</option>${['Soporte técnico','Redes','Equipos','Cuentas','Portal web','Comunicaciones','Mantenimiento'].map(x=>`<option ${normalize(service).includes(normalize(x.split(' ')[0]))?'selected':''}>${x}</option>`).join('')}</select></div><div class="itsm-field"><label for="priority">Prioridad sugerida *</label><select id="priority" name="priority" required><option>Media</option><option>Baja</option><option>Alta</option><option>Crítica</option></select></div><div class="itsm-field full"><label for="title">Asunto *</label><input id="title" name="title" required maxlength="120" placeholder="Resume la necesidad en una frase"></div><div class="itsm-field full"><label for="description">Descripción detallada *</label><textarea id="description" name="description" required minlength="15" placeholder="Describe qué ocurre, desde cuándo, en qué equipo o servicio y qué acciones ya intentaste."></textarea><span class="itsm-help">No incluyas contraseñas ni información sensible.</span></div></div><div class="itsm-form-actions"><a class="itsm-btn" href="${url('tickets/index.html')}">Cancelar</a><button class="itsm-btn itsm-btn-primary" type="submit">${icon('save','itsm-icon-sm')}Crear ticket</button></div></form></div></article><aside class="itsm-card"><div class="itsm-card-head"><div><h2>Antes de radicar</h2><p>Información que mejora la atención</p></div></div><div class="itsm-card-body"><div class="itsm-info">${icon('info')}<div><strong>Describe el impacto real</strong><p>Indica cuántas personas están afectadas y si el proceso se encuentra detenido.</p></div></div><div class="itsm-list" style="margin-top:10px">${[['1','Ubica el equipo o servicio'],['2','Explica el mensaje de error'],['3','Adjunta evidencia cuando aplique'],['4','Selecciona una prioridad realista']].map(x=>`<div class="itsm-list-row" style="padding-left:0;padding-right:0"><span class="itsm-count">${x[0]}</span><span class="itsm-list-main"><strong>${x[1]}</strong><span>Dato necesario para clasificación</span></span></div>`).join('')}</div></div></aside></section>`}
function catalogPage(){const services=getData('services');return head('Servicios TIC','Catálogo de servicios','Selecciona el tipo de atención que corresponde a tu necesidad.',`<a class="itsm-btn itsm-btn-primary" href="${url('nuevo-ticket/index.html')}">${icon('plus','itsm-icon-sm')}Solicitud libre</a>`)+`<section class="itsm-grid itsm-grid-3">${services.map(s=>`<article class="itsm-service-card searchable"><span class="itsm-icon-box">${icon(s.icon)}</span><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.description)}</p><div class="itsm-card-meta"><span>SLA ${escapeHtml(s.sla)}</span><a class="itsm-btn itsm-btn-sm" href="${url(`nuevo-ticket/index.html?service=${encodeURIComponent(s.id)}`)}">Solicitar</a></div></article>`).join('')}</section>`}
function assetsPage(){const assets=getData('assets');return head('Activos tecnológicos','Inventario TIC','Estado, asignación y salud de los equipos institucionales.',`<button class="itsm-btn" id="exportAssets">${icon('download','itsm-icon-sm')}Exportar CSV</button>`)+`<section class="itsm-metrics">${metric('monitor',assets.length,'Activos registrados')}${metric('check',assets.filter(x=>x.status==='Operativo').length,'Operativos','','success')}${metric('wrench',assets.filter(x=>x.status!=='Operativo').length,'En intervención','','warning')}${metric('chart',`${Math.round(assets.reduce((a,x)=>a+x.health,0)/assets.length)}%`,'Salud promedio')}</section><div class="itsm-table-wrap"><table class="itsm-table"><thead><tr><th>Código</th><th>Activo</th><th>Dependencia</th><th>Usuario</th><th>Estado</th><th>Salud</th><th>Última revisión</th></tr></thead><tbody>${assets.map(a=>`<tr class="searchable"><td class="itsm-code">${escapeHtml(a.code)}</td><td><strong>${escapeHtml(a.name)}</strong><span class="itsm-subline">${escapeHtml(a.type)}</span></td><td>${escapeHtml(a.dependency)}</td><td>${escapeHtml(a.user)}</td><td>${statusPill(a.status)}</td><td><div class="itsm-progress ${a.health<60?'danger':a.health<80?'warning':'success'}"><span style="width:${a.health}%"></span></div><span class="itsm-subline">${a.health}%</span></td><td>${formatDate(a.last)}</td></tr>`).join('')}</tbody></table></div>`}
function maintenancePage(){const data=getData('maintenance');return head('Ciclo técnico','Mantenimientos','Programación y trazabilidad de intervenciones preventivas y correctivas.',`<button class="itsm-btn itsm-btn-primary" id="addMaintenance">${icon('plus','itsm-icon-sm')}Programar</button>`)+`<section class="itsm-grid itsm-grid-3">${data.map(m=>`<article class="itsm-asset-card searchable"><div class="itsm-card-meta" style="margin:0;padding:0;border:0"><span class="itsm-code">${escapeHtml(m.id)}</span>${statusPill(m.status)}</div><span class="itsm-icon-box" style="margin-top:11px">${icon('wrench')}</span><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.asset)} · ${escapeHtml(m.type)}</p><div class="itsm-card-meta"><span>${formatDate(m.date)} · ${escapeHtml(m.responsible)}</span>${m.status!=='Completado'?`<button class="itsm-btn itsm-btn-sm js-complete-maintenance" data-id="${escapeHtml(m.id)}">Completar</button>`:''}</div></article>`).join('')}</section>`}
function communicationsPage(){const data=getData('communications');return head('Comunicaciones digitales','Diseño y publicaciones','Control de piezas, contenidos, portales y aprobaciones institucionales.',`<a class="itsm-btn itsm-btn-primary" href="${url('nuevo-ticket/index.html?service=design')}">${icon('plus','itsm-icon-sm')}Nueva solicitud</a>`)+`<section class="itsm-grid itsm-grid-3">${data.map(c=>`<article class="itsm-service-card searchable"><div class="itsm-card-meta" style="margin:0;padding:0;border:0"><span class="itsm-code">${escapeHtml(c.id)}</span>${statusPill(c.status)}</div><span class="itsm-icon-box" style="margin-top:11px">${icon(c.type.includes('Portal')||c.type.includes('portal')?'grid':'image')}</span><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.type)} · ${escapeHtml(c.dependency)}</p><div class="itsm-card-meta"><span>${formatDate(c.date)}</span><span>${escapeHtml(c.responsible)}</span></div></article>`).join('')}</section>`}
function knowledgePage(){const data=getData('knowledge');return head('Autoservicio','Base de conocimiento','Guías cortas para resolver necesidades frecuentes y radicar mejores casos.')+`<section class="itsm-grid itsm-grid-3">${data.map(k=>`<article class="itsm-kb-card searchable"><span class="itsm-icon-box">${icon('book')}</span><h3>${escapeHtml(k.title)}</h3><p>${escapeHtml(k.description)}</p><div class="itsm-card-meta"><span>${escapeHtml(k.category)} · ${k.views} consultas</span><span>${formatShort(k.updated)}</span></div></article>`).join('')}</section>`}
function reportsPage(){
 const tickets=getData('tickets');
 const byCat={};tickets.forEach(t=>byCat[t.category]=(byCat[t.category]||0)+1);
 const cats=Object.entries(byCat);const max=Math.max(...cats.map(x=>x[1]),1);
 const completed=tickets.filter(x=>["Resuelto","Cerrado"].includes(x.status)).length;
 return head('Inteligencia operativa','Indicadores y reportes','Lectura ejecutiva de volumen, prioridades, cumplimiento y resolución del servicio.',`<button class="itsm-btn" id="exportReport">${icon('download','itsm-icon-sm')}Exportar resumen</button>`)+
 `<section class="itsm-metrics">${metric('ticket',tickets.length,'Tickets del periodo')}${metric('check',`${Math.round(completed/Math.max(tickets.length,1)*100)}%`,'Tasa de resolución','','success')}${metric('clock','6,4 h','Tiempo medio','','warning')}${metric('shield','91%','Cumplimiento SLA')}</section><section class="itsm-grid itsm-grid-2"><article class="itsm-card"><div class="itsm-card-head"><div><h2>Casos por categoría</h2><p>Distribución de la muestra operativa</p></div></div><div class="itsm-card-body"><div class="itsm-bars">${cats.map(([cat,n])=>`<div class="itsm-bar" style="height:${Math.max(20,n/max*100)}%"><strong>${n}</strong><span>${escapeHtml(cat)}</span></div>`).join('')}</div></div></article><article class="itsm-card"><div class="itsm-card-head"><div><h2>Estado del flujo</h2><p>Participación por estado</p></div></div><div class="itsm-card-body"><div class="itsm-grid itsm-grid-2" style="align-items:center"><div class="itsm-donut"></div><div class="itsm-legend">${[['En proceso','#0b64a0',tickets.filter(x=>x.status==='En proceso').length],['Abierto','#0b7f83',tickets.filter(x=>x.status==='Abierto').length],['En espera','#99550a',tickets.filter(x=>x.status==='En espera').length],['Resuelto','#70b6aa',tickets.filter(x=>x.status==='Resuelto').length],['Cerrado','#dce4ed',tickets.filter(x=>x.status==='Cerrado').length]].map(x=>`<div class="itsm-legend-row"><span class="itsm-legend-label"><i class="itsm-legend-dot" style="background:${x[1]}"></i>${x[0]}</span><strong>${x[2]}</strong></div>`).join('')}</div></div></div></article></section>`;
}
const renderers={dashboard,tickets:ticketsPage,new:newTicketPage,catalog:catalogPage,assets:assetsPage,maintenance:maintenancePage,communications:communicationsPage,knowledge:knowledgePage,reports:reportsPage};
const titles={dashboard:['Centro de control','Mesa de Servicios TIC'],tickets:['Tickets','Gestión de solicitudes'],new:['Nuevo ticket','Radicación institucional'],catalog:['Catálogo','Servicios disponibles'],assets:['Inventario TIC','Activos tecnológicos'],maintenance:['Mantenimientos','Ciclo técnico'],communications:['Diseño y publicaciones','Comunicaciones digitales'],knowledge:['Base de conocimiento','Autoservicio'],reports:['Indicadores','Inteligencia operativa']};
function render(){const meta=titles[page]||titles.dashboard;const content=(renderers[page]||dashboard)();document.getElementById('itsm-root').innerHTML=shell(content,meta[0],meta[1]);bindCommon();bindPage()}
function toast(title,message){const box=$('#itsmToast');if(!box)return;box.innerHTML=`${icon('check')}<div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span></div>`;box.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.classList.remove('show'),2800)}
let lastFocusedElement=null;
function historyMarkup(ticket){
 const items=Array.isArray(ticket.history)?ticket.history:[];
 return items.map((h,i)=>`<div class="itsm-thread-item"><i class="itsm-thread-dot"></i><strong>${escapeHtml(typeof h==='string'?h:h.text||'Actuación registrada')}</strong><span>${typeof h==='object'&&h.at?escapeHtml(formatDateTime(h.at)):(i===items.length-1?'Última actuación':'Actuación registrada')}</span></div>`).join('');
}
function openTicket(id){
 const ticket=getData('tickets').find(x=>x.id===id);if(!ticket)return;
 const modal=$('#itsmModal'),backdrop=$('#itsmModalBackdrop');if(!modal||!backdrop)return;
 lastFocusedElement=document.activeElement;
 const assignees=['Sin asignar','Juan E. Pérez','Equipo Mesa TIC','Proveedor / TIC'];
 if(ticket.assignee&&!assignees.includes(ticket.assignee))assignees.push(ticket.assignee);
 const workingStatus=['Abierto','En proceso','En espera'].includes(ticket.status)?ticket.status:'En proceso';
 modal.innerHTML=`
  <header class="itsm-modal-head">
   <div class="itsm-modal-title"><span class="itsm-code">${escapeHtml(ticket.id)}</span><h2 id="itsmModalTitle">${escapeHtml(ticket.title)}</h2><p>Gestiona el caso, registra actuaciones y documenta la solución antes del cierre.</p></div>
   <button class="itsm-top-action" id="closeModal" type="button" aria-label="Cerrar ventana">${icon('x')}</button>
  </header>
  <div class="itsm-modal-body">
   <div class="itsm-modal-grid">
    <div>
     <section class="itsm-modal-section">
      <div class="itsm-actions" style="justify-content:flex-start;margin-bottom:10px">${priorityPill(ticket.priority)}${statusPill(ticket.status)}</div>
      <p style="margin:0;color:var(--tic-muted);font-size:11px;white-space:pre-wrap">${escapeHtml(ticket.description)}</p>
     </section>
     <section class="itsm-modal-section">
      <div class="itsm-section-title"><div><h3>Información del caso</h3><p>Datos de radicación y atención</p></div></div>
      <div class="itsm-facts">
       <div class="itsm-fact"><span>Solicitante</span><strong>${escapeHtml(ticket.requester)}</strong></div>
       <div class="itsm-fact"><span>Dependencia</span><strong>${escapeHtml(ticket.dependency)}</strong></div>
       <div class="itsm-fact"><span>Responsable actual</span><strong>${escapeHtml(ticket.assignee)}</strong></div>
       <div class="itsm-fact"><span>Canal</span><strong>${escapeHtml(ticket.channel)}</strong></div>
       <div class="itsm-fact"><span>Radicado</span><strong>${formatDateTime(ticket.created)}</strong></div>
       <div class="itsm-fact"><span>Cumplimiento SLA</span><strong>${ticket.sla}%</strong></div>
       <div class="itsm-fact"><span>Tiempo registrado</span><strong>${Number(ticket.timeSpent||0)} minutos</strong></div>
       <div class="itsm-fact"><span>Última actualización</span><strong>${ticket.updatedAt?formatDateTime(ticket.updatedAt):'Sin actualización posterior'}</strong></div>
      </div>
     </section>
     ${ticket.solution?`<section class="itsm-modal-section"><div class="itsm-section-title"><div><h3>Solución documentada</h3><p>Resultado técnico del caso</p></div></div><div class="itsm-resolution-box"><strong>${escapeHtml(ticket.status)} por ${escapeHtml(ticket.resolvedBy||ticket.assignee)}</strong><p>${escapeHtml(ticket.solution)}</p></div></section>`:''}
     <section class="itsm-modal-section">
      <div class="itsm-section-title"><div><h3>Trazabilidad</h3><p>Historial completo de actuaciones</p></div></div>
      <div class="itsm-thread">${historyMarkup(ticket)}</div>
     </section>
    </div>
    <aside class="itsm-workflow-card">
     <h3>Atender y resolver</h3><p>Los cambios quedan guardados localmente mientras se conecta el backend.</p>
     <form class="itsm-form" id="ticketWorkflowForm" novalidate>
      <div class="itsm-field"><label for="workflowAssignee">Responsable</label><select id="workflowAssignee" name="assignee">${assignees.map(x=>`<option ${x===ticket.assignee?'selected':''}>${escapeHtml(x)}</option>`).join('')}</select></div>
      <div class="itsm-field"><label for="workflowStatus">Estado operativo</label><select id="workflowStatus" name="status"><option ${workingStatus==='Abierto'?'selected':''}>Abierto</option><option ${workingStatus==='En proceso'?'selected':''}>En proceso</option><option ${workingStatus==='En espera'?'selected':''}>En espera</option></select></div>
      <div class="itsm-field"><label for="workflowMinutes">Tiempo invertido en esta actuación</label><input id="workflowMinutes" name="minutes" type="number" min="0" max="1440" step="5" value="0" inputmode="numeric"><span class="itsm-help">Registra minutos adicionales, no el acumulado.</span></div>
      <div class="itsm-field"><label for="workflowNote">Nota de trabajo</label><textarea id="workflowNote" name="note" minlength="5" placeholder="Describe el diagnóstico, contacto, prueba o avance realizado."></textarea></div>
      <div class="itsm-field"><label for="workflowSolution">Solución aplicada</label><textarea id="workflowSolution" name="solution" minlength="10" placeholder="Obligatoria para resolver o cerrar. Explica qué se hizo y cómo se verificó.">${escapeHtml(ticket.solution||'')}</textarea></div>
      <label class="itsm-check"><input type="checkbox" name="notify" checked><span>Registrar que el solicitante fue informado del cambio.</span></label>
      <div class="itsm-modal-actions">
       ${['Resuelto','Cerrado'].includes(ticket.status)?`<button class="itsm-btn" type="button" data-ticket-action="reopen">Reabrir</button>`:`<button class="itsm-btn" type="button" data-ticket-action="save">Guardar avance</button>`}
       <button class="itsm-btn itsm-btn-success" type="button" data-ticket-action="resolve">${icon('check','itsm-icon-sm')}Resolver</button>
       <button class="itsm-btn itsm-btn-primary" type="button" data-ticket-action="close">${icon('shield','itsm-icon-sm')}Cerrar ticket</button>
      </div>
     </form>
    </aside>
   </div>
  </div>`;
 backdrop.classList.add('open');document.body.style.overflow='hidden';
 $('#closeModal')?.addEventListener('click',closeModal);
 $('#ticketWorkflowForm')?.addEventListener('click',event=>{
  const button=event.target.closest('[data-ticket-action]');if(!button)return;
  updateTicket(id,button.dataset.ticketAction);
 });
 requestAnimationFrame(()=>$('#closeModal')?.focus());
}
function updateTicket(id,action){
 const form=$('#ticketWorkflowForm');if(!form)return;
 const data=getData('tickets'),index=data.findIndex(x=>x.id===id);if(index<0)return;
 const ticket=data[index],values=new FormData(form),now=new Date().toISOString();
 const assignee=String(values.get('assignee')||'Sin asignar');
 const status=String(values.get('status')||'En proceso');
 const note=String(values.get('note')||'').trim();
 const solution=String(values.get('solution')||'').trim();
 const minutes=Math.max(0,Number(values.get('minutes')||0));
 const notified=values.get('notify')==='on';
 if(['resolve','close'].includes(action)&&solution.length<10){
  const field=$('#workflowSolution');field.setCustomValidity('Describe la solución aplicada con al menos 10 caracteres.');field.reportValidity();field.addEventListener('input',()=>field.setCustomValidity(''),{once:true});return;
 }
 if(action==='save'&&!note&&assignee===ticket.assignee&&status===ticket.status&&minutes===0){
  const field=$('#workflowNote');field.setCustomValidity('Registra una nota o modifica algún dato del ticket.');field.reportValidity();field.addEventListener('input',()=>field.setCustomValidity(''),{once:true});return;
 }
 ticket.assignee=assignee;
 ticket.timeSpent=Number(ticket.timeSpent||0)+minutes;
 ticket.updatedAt=now;
 if(note)ticket.history.push({text:`${assignee}: ${note}`,at:now});
 if(action==='save'){
  ticket.status=status;
  if(notified)ticket.history.push({text:'Solicitante informado sobre el avance',at:now});
 }
 if(action==='resolve'){
  ticket.status='Resuelto';ticket.solution=solution;ticket.resolvedAt=now;ticket.resolvedBy=assignee;
  ticket.history.push({text:`Ticket resuelto: ${solution}`,at:now});
  if(notified)ticket.history.push({text:'Solución comunicada al solicitante',at:now});
 }
 if(action==='close'){
  ticket.status='Cerrado';ticket.solution=solution;ticket.resolvedAt=ticket.resolvedAt||now;ticket.closedAt=now;ticket.resolvedBy=assignee;
  ticket.history.push({text:`Cierre técnico confirmado: ${solution}`,at:now});
  if(notified)ticket.history.push({text:'Cierre comunicado al solicitante',at:now});
 }
 if(action==='reopen'){
  ticket.status='En proceso';ticket.closedAt=null;ticket.history.push({text:`Ticket reabierto por ${assignee}`,at:now});
 }
 data[index]=ticket;store.set('tickets',data);closeModal();render();
 const messages={save:['Avance guardado',`${ticket.id} fue actualizado correctamente.`],resolve:['Ticket resuelto',`${ticket.id} quedó con solución documentada.`],close:['Ticket cerrado',`${ticket.id} quedó cerrado y trazable.`],reopen:['Ticket reabierto',`${ticket.id} volvió al flujo de atención.`]};
 const message=messages[action]||messages.save;setTimeout(()=>toast(message[0],message[1]),0);
}
function closeModal(){
 $('#itsmModalBackdrop')?.classList.remove('open');document.body.style.overflow='';
 if(lastFocusedElement&&document.contains(lastFocusedElement))lastFocusedElement.focus();
}
function applySearch(value){const q=normalize(value);$$('.searchable').forEach(el=>{el.style.display=!q||normalize(el.textContent).includes(q)?'':'none'});if(page==='tickets')updateTicketCount()}
function updateTicketCount(){const rows=$$('#ticketRows tr').filter(x=>x.style.display!=='none');const count=$('#ticketCount');if(count)count.textContent=rows.length}
function csvDownload(filename,rows){const csv=rows.map(row=>row.map(value=>`"${String(value??'').replace(/"/g,'""')}"`).join(',')).join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
function bindCommon(){
 $('#itsmMenuBtn')?.addEventListener('click',()=>{$('#itsmSidebar').classList.add('open');$('#itsmSidebarBackdrop').classList.add('open')});
 $('#itsmSidebarBackdrop')?.addEventListener('click',()=>{$('#itsmSidebar').classList.remove('open');$('#itsmSidebarBackdrop').classList.remove('open')});
 $('#itsmModalBackdrop')?.addEventListener('click',e=>{if(e.target.id==='itsmModalBackdrop')closeModal()});
 document.onkeydown=e=>{if(e.key==='Escape'&&$('#itsmModalBackdrop')?.classList.contains('open'))closeModal()};
 $('#itsmGlobalSearch')?.addEventListener('input',e=>applySearch(e.target.value));
 $('#itsmBell')?.addEventListener('click',()=>toast('Mesa TIC al día','No hay alertas nuevas pendientes de lectura.'));
 $$('.js-open-ticket').forEach(el=>el.addEventListener('click',()=>openTicket(el.dataset.id)));
}
function bindPage(){
 if(page==='tickets'){
  $$('#ticketFilters .itsm-chip').forEach(btn=>btn.addEventListener('click',()=>{$$('#ticketFilters .itsm-chip').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const status=btn.dataset.status;$$('#ticketRows tr').forEach(row=>{const ticket=getData('tickets').find(x=>x.id===row.dataset.ticket);row.style.display=status==='Todos'||ticket.status===status?'':'none'});updateTicketCount()}));
  $('#exportTickets')?.addEventListener('click',()=>{const data=getData('tickets');csvDownload('tickets_mesa_tic.csv',[['ID','Asunto','Categoría','Prioridad','Estado','Dependencia','Responsable','Fecha','Tiempo minutos','Solución'],...data.map(t=>[t.id,t.title,t.category,t.priority,t.status,t.dependency,t.assignee,t.created,t.timeSpent||0,t.solution||''])])});
 }
 if(page==='new'){$('#newTicketForm')?.addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.currentTarget),tickets=getData('tickets'),year=new Date().getFullYear(),max=Math.max(0,...tickets.map(t=>Number((t.id.match(/(\d+)$/)||[])[1])||0)),id=`TIC-${year}-${String(max+1).padStart(3,'0')}`;tickets.unshift({id,title:form.get('title'),description:form.get('description'),category:form.get('category'),priority:form.get('priority'),status:'Abierto',requester:form.get('requester'),dependency:form.get('dependency'),assignee:'Sin asignar',created:new Date().toISOString(),sla:100,channel:'Portal',history:['Ticket radicado desde el portal']});store.set('tickets',tickets);toast('Ticket creado',`${id} fue registrado correctamente.`);e.currentTarget.reset();setTimeout(()=>location.href=url('tickets/index.html'),900)})}
 if(page==='assets'){$('#exportAssets')?.addEventListener('click',()=>{const data=getData('assets');csvDownload('inventario_tic.csv',[['Código','Activo','Tipo','Dependencia','Usuario','Estado','Salud','Última revisión'],...data.map(a=>[a.code,a.name,a.type,a.dependency,a.user,a.status,a.health,a.last])])})}
 if(page==='maintenance'){$$('.js-complete-maintenance').forEach(btn=>btn.addEventListener('click',()=>{const data=getData('maintenance'),item=data.find(x=>x.id===btn.dataset.id);if(item){item.status='Completado';store.set('maintenance',data);toast('Mantenimiento actualizado',`${item.id} quedó completado.`);setTimeout(render,500)}}));$('#addMaintenance')?.addEventListener('click',()=>toast('Programación','La agenda de mantenimiento está lista para conexión futura.'))}
 if(page==='reports'){$('#exportReport')?.addEventListener('click',()=>{const data=getData('tickets');csvDownload('resumen_mesa_tic.csv',[['Indicador','Valor'],['Tickets',data.length],['Abiertos',data.filter(x=>x.status==='Abierto').length],['En proceso',data.filter(x=>x.status==='En proceso').length],['Resueltos',data.filter(x=>x.status==='Resuelto').length],['Cerrados',data.filter(x=>x.status==='Cerrado').length],['Cumplimiento SLA','91%']])})}
}
window.ITSM=Object.freeze({version:VERSION,render,openTicket,updateTicket,store,getData});
try{render()}catch(error){console.error('[Mesa TIC]',error);const root=$('#itsm-root');if(root)root.innerHTML=`<main style="padding:32px;font-family:Arial"><h1>No fue posible cargar la Mesa TIC</h1><p>${escapeHtml(error.message)}</p></main>`}
})();
