let C={section:'general',meta:null};
document.addEventListener('DOMContentLoaded',async()=>{await Agenda.init('../data.json');C.meta=await ERP.fetchJSON('data.json',{integrations:[]});bind();render();ERP.refreshIcons()});
function bind(){
 document.querySelector('.settings-nav').onclick=e=>{const b=e.target.closest('[data-section]');if(!b)return;C.section=b.dataset.section;document.querySelectorAll('[data-section]').forEach(x=>x.classList.toggle('active',x===b));render()};
 document.getElementById('saveSettings').onclick=saveSettings
}
function render(){
 const panel=document.getElementById('settingsPanel');
 if(C.section==='general')panel.innerHTML=general();
 else if(C.section==='calendars')panel.innerHTML=calendars();
 else if(C.section==='notifications')panel.innerHTML=notifications();
 else if(C.section==='permissions')panel.innerHTML=permissions();
 else if(C.section==='integrations')panel.innerHTML=integrations();
 else panel.innerHTML=dataPanel();
 bindPanel();ERP.refreshIcons()
}
function head(title,text){return `<div class="settings-head"><h2>${title}</h2><p>${text}</p></div>`}
function general(){
 const s=Agenda.data.settings;
 return `<div class="settings-section">${head('Configuración general','Ajusta el comportamiento predeterminado de la agenda institucional.')}<div class="settings-grid">
 <div class="setting-card"><label>Vista inicial</label><p>Vista que aparece al abrir el calendario.</p><select data-setting="defaultView"><option value="month" ${s.defaultView==='month'?'selected':''}>Mes</option><option value="week" ${s.defaultView==='week'?'selected':''}>Semana</option><option value="day" ${s.defaultView==='day'?'selected':''}>Día</option><option value="agenda" ${s.defaultView==='agenda'?'selected':''}>Agenda</option></select></div>
 <div class="setting-card"><label>Formato de hora</label><p>Presentación de horas en la interfaz.</p><select data-setting="timeFormat"><option value="24h" ${s.timeFormat==='24h'?'selected':''}>24 horas</option><option value="12h" ${s.timeFormat==='12h'?'selected':''}>12 horas</option></select></div>
 <div class="setting-card"><label>Inicio de jornada</label><p>Primera hora visible en las vistas detalladas.</p><input type="time" data-setting="workingStart" value="${s.workingStart}"></div>
 <div class="setting-card"><label>Fin de jornada</label><p>Última hora visible en las vistas detalladas.</p><input type="time" data-setting="workingEnd" value="${s.workingEnd}"></div>
 <div class="setting-card"><label>Intervalos</label><p>Duración mínima de cada bloque de agenda.</p><select data-setting="slotMinutes"><option value="15" ${s.slotMinutes===15?'selected':''}>15 minutos</option><option value="30" ${s.slotMinutes===30?'selected':''}>30 minutos</option><option value="60" ${s.slotMinutes===60?'selected':''}>60 minutos</option></select></div>
 <div class="setting-card"><label>Primer día de semana</label><p>Orden de la vista mensual y semanal.</p><select data-setting="weekStartsOn"><option value="1" ${s.weekStartsOn===1?'selected':''}>Lunes</option><option value="0" ${s.weekStartsOn===0?'selected':''}>Domingo</option></select></div>
 <div class="setting-card full"><div class="toggle-row"><div class="toggle-copy"><strong>Mostrar fines de semana</strong><span>Incluye sábado y domingo en las vistas.</span></div>${switcher('showWeekends',s.showWeekends)}</div>
 <div class="toggle-row"><div class="toggle-copy"><strong>Modo compacto</strong><span>Reduce alturas y espacios para mostrar más información.</span></div>${switcher('compactMode',s.compactMode)}</div></div></div></div>`
}
function calendars(){
 return `<div class="settings-section">${head('Calendarios y colores','Organiza agendas temáticas, personales y compartidas.')}<div class="calendar-config">${Agenda.data.calendars.map(c=>`<div class="calendar-config-card"><div class="calendar-color" style="background:${c.color}"><i data-lucide="calendar"></i></div><div><strong>${Agenda.escape(c.name)}</strong><span>${Agenda.escape(c.scope)}</span></div><input type="color" data-cal-color="${c.id}" value="${c.color}"></div>`).join('')}</div><div class="split-line"></div><button class="btn btn-secondary" id="addCalendar"><i data-lucide="plus"></i> Crear calendario</button></div>`
}
function notifications(){
 const n=Agenda.data.settings.notifications;
 return `<div class="settings-section">${head('Notificaciones','Define cómo y cuándo recibir alertas de compromisos.')}<div class="setting-card">
 ${toggleRow('email','Correo institucional','Envía invitaciones, cambios y recordatorios al correo.',n.email)}
 ${toggleRow('inApp','Notificaciones dentro del ERP','Muestra alertas y centro de novedades.',n.inApp)}
 ${toggleRow('dailyDigest','Resumen diario','Consolida agenda, pendientes y cambios cada mañana.',n.dailyDigest)}
 ${toggleRow('overdue','Escalamiento de vencidos','Avisa cuando una actividad supera su fecha límite.',n.overdue)}</div>
 <div class="settings-grid" style="margin-top:10px"><div class="setting-card"><label>Recordatorio predeterminado</label><p>Se aplicará a nuevas actividades.</p><select><option>10 minutos antes</option><option selected>30 minutos antes</option><option>1 hora antes</option><option>1 día antes</option></select></div><div class="setting-card"><label>Hora del resumen</label><p>Momento de generación del resumen diario.</p><input type="time" value="06:30"></div></div></div>`
}
function permissions(){
 const p=Agenda.data.settings.permissions;
 return `<div class="settings-section">${head('Roles y permisos','Controla quién puede crear, editar, consultar información reservada y administrar el calendario.')}<div class="table-wrap permission-table"><table><thead><tr><th>Rol</th><th>Crear</th><th>Editar todo</th><th>Ver privados</th><th>Configuración</th></tr></thead><tbody>${p.map((r,i)=>`<tr><td><strong>${Agenda.escape(r.role)}</strong></td>${['create','editAll','viewPrivate','manageSettings'].map(k=>`<td class="permission-check"><input type="checkbox" data-perm="${i}|${k}" ${r[k]?'checked':''}></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="note" style="margin-top:10px">En la versión conectada, estos permisos se reforzarán con autenticación y políticas de base de datos.</div></div>`
}
function integrations(){
 return `<div class="settings-section">${head('Integraciones','Conecta la agenda con servicios externos sin perder la trazabilidad institucional.')}${C.meta.integrations.map(i=>`<div class="integration-card"><div class="integration-icon"><i data-lucide="${i.icon}"></i></div><div><strong>${Agenda.escape(i.name)}</strong><p>${Agenda.escape(i.description)}</p><span class="tag">${Agenda.escape(i.status)}</span></div><button class="btn btn-secondary btn-sm" data-connect="${i.id}">Configurar</button></div>`).join('')}</div>`
}
function dataPanel(){
 return `<div class="settings-section">${head('Datos y respaldo','Exporta, restaura o elimina los datos locales de demostración.')}<div class="settings-grid"><div class="setting-card"><label>Exportación completa</label><p>Descarga actividades y configuración en formato JSON.</p><button class="btn btn-secondary" id="downloadJson"><i data-lucide="download"></i> Descargar JSON</button></div>
 <div class="setting-card"><label>Importar respaldo</label><p>Restaura un archivo JSON compatible con Agenda 360.</p><button class="btn btn-secondary" id="importJsonBtn"><i data-lucide="upload"></i> Seleccionar archivo</button><input id="importJson" type="file" accept=".json" hidden></div>
 <div class="setting-card full danger-zone"><label>Restablecer demostración</label><p>Elimina los cambios guardados en este navegador y recupera la información inicial.</p><button class="btn btn-danger" id="resetData"><i data-lucide="trash-2"></i> Restablecer datos</button></div></div></div>`
}
function switcher(name,checked){return `<label class="switch"><input data-setting="${name}" type="checkbox" ${checked?'checked':''}><span></span></label>`}
function toggleRow(name,title,text,checked){return `<div class="toggle-row"><div class="toggle-copy"><strong>${title}</strong><span>${text}</span></div><label class="switch"><input data-notification="${name}" type="checkbox" ${checked?'checked':''}><span></span></label></div>`}
function bindPanel(){
 document.querySelectorAll('[data-setting]').forEach(x=>x.onchange=()=>{const v=x.type==='checkbox'?x.checked:(x.type==='number'||['slotMinutes','weekStartsOn'].includes(x.dataset.setting)?Number(x.value):x.value);Agenda.data.settings[x.dataset.setting]=v});
 document.querySelectorAll('[data-notification]').forEach(x=>x.onchange=()=>Agenda.data.settings.notifications[x.dataset.notification]=x.checked);
 document.querySelectorAll('[data-cal-color]').forEach(x=>x.oninput=()=>{Agenda.calendar(x.dataset.calColor).color=x.value;x.closest('.calendar-config-card').querySelector('.calendar-color').style.background=x.value});
 document.querySelectorAll('[data-perm]').forEach(x=>x.onchange=()=>{const [i,k]=x.dataset.perm.split('|');Agenda.data.settings.permissions[Number(i)][k]=x.checked});
 document.querySelectorAll('[data-connect]').forEach(x=>x.onclick=()=>ERP.toast('La integración se habilitará al conectar el backend institucional'));
 const add=document.getElementById('addCalendar');if(add)add.onclick=()=>{const name=prompt('Nombre del nuevo calendario');if(name){Agenda.data.calendars.push({id:Agenda.uid('CAL'),name,color:'#0f4c81',visible:true,scope:'Institucional'});Agenda.persist();render()}};
 const down=document.getElementById('downloadJson');if(down)down.onclick=downloadJson;
 const importBtn=document.getElementById('importJsonBtn'),input=document.getElementById('importJson');if(importBtn)importBtn.onclick=()=>input.click();if(input)input.onchange=importJson;
 const reset=document.getElementById('resetData');if(reset)reset.onclick=()=>{if(confirm('¿Restablecer todos los datos de demostración?'))Agenda.reset()}
}
function saveSettings(){Agenda.persist();ERP.toast('Configuración guardada')}
function downloadJson(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(Agenda.data,null,2)],{type:'application/json'}));a.download='agenda-360-respaldo.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
async function importJson(e){const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!d.events||!d.settings)throw new Error();Agenda.data=d;Agenda.persist();ERP.toast('Respaldo restaurado');render()}catch{ERP.toast('El archivo no es compatible','error')}}
