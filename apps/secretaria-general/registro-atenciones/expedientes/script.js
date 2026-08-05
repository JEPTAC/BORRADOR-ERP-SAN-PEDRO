document.addEventListener('DOMContentLoaded', async () => {
  'use strict';
  const data = await ATT.load('data.json', 'erp-attention-dossiers-v22');
  const save = () => ATT.save('', data);
  let selected = '';

  function people(){
    const map = new Map();
    const add=(name,document,type)=>{ if(!document)return; const key=String(document); if(!map.has(key)) map.set(key,{name:name||'Sin nombre',document:key,type,events:0}); map.get(key).events+=1; };
    data.contacts.forEach(i=>add(i.name,i.document,i.type)); data.appointments.forEach(i=>add(i.person,i.document,'Ciudadano')); data.visitors.forEach(i=>add(i.name,i.document,'Visitante')); data.attentions.forEach(i=>add(i.person,i.document,'Usuario'));
    const q=dossierSearch.value.trim().toLowerCase(); return [...map.values()].filter(i=>!q||[i.name,i.document].some(v=>String(v).toLowerCase().includes(q))).sort((a,b)=>a.name.localeCompare(b.name));
  }
  function renderList(){ const rows=people(); dossierList.innerHTML=rows.length?rows.map(p=>`<button class="dossier-person${selected===p.document?' active':''}" data-doc="${ATT.esc(p.document)}"><span class="avatar">${ATT.initials(p.name)}</span><div><strong>${ATT.esc(p.name)}</strong><span>${ATT.maskDocument(p.document)} · ${p.events} interacciones</span></div><i data-lucide="chevron-right"></i></button>`).join(''):'<div class="att-empty">Sin registros.</div>'; }
  function renderMetrics(){ const docs=people(); const notes=data.dossierNotes.length; const open=data.attentions.filter(i=>!['Finalizada','Cerrada'].includes(i.status)).length; metrics.innerHTML=[['folder-user',docs.length,'Expedientes','Personas consolidadas'],['calendar-check',data.appointments.length,'Citas','Historial registrado'],['clipboard-list',data.attentions.length,'Atenciones','Trazabilidad'],['flag',open+notes,'Seguimientos','Compromisos y notas']].map(x=>`<div class="att-kpi"><span class="att-kpi-icon"><i data-lucide="${x[0]}"></i></span><div class="att-kpi-copy"><span>${x[2]}</span><strong>${x[1]}</strong><small>${x[3]}</small></div></div>`).join(''); }
  function renderDossier(){
    if(!selected){ dossierBody.innerHTML='<div class="att-empty">Seleccione un registro del listado.</div>'; exportDossier.disabled=true; newNote.disabled=true; return; }
    const person=people().find(p=>p.document===selected)||{name:'Usuario',document:selected}; const events=ATT.dossierEvents(data,selected); dossierTitle.textContent=person.name; dossierSubtitle.textContent=`Documento ${ATT.maskDocument(selected)} · ${events.length} actuaciones`; exportDossier.disabled=false; newNote.disabled=false;
    const counts={Cita:events.filter(e=>e.type==='Cita').length,Visita:events.filter(e=>e.type==='Visita').length,Atención:events.filter(e=>e.type==='Atención').length,Seguimiento:events.filter(e=>e.type==='Seguimiento').length};
    dossierBody.innerHTML=`<div class="dossier-summary">${Object.entries(counts).map(([k,v])=>`<div class="att-kpi"><div class="att-kpi-copy"><span>${k}</span><strong>${v}</strong><small>Registros</small></div></div>`).join('')}</div><div class="dossier-timeline">${events.length?events.map(e=>`<div class="dossier-event"><header><h3>${ATT.esc(e.type)} · ${ATT.esc(e.title)}</h3>${ATT.badge(e.status||'Registrado')}</header><p>${ATT.fmtDate(e.date)} · ${ATT.esc(e.time||'')}</p><small>${ATT.esc(e.id)}</small></div>`).join(''):'<div class="att-empty">Sin actuaciones.</div>'}</div>`;
  }
  function render(){renderMetrics();renderList();renderDossier();ATT.icons();}
  dossierSearch.oninput=render;
  dossierList.onclick=e=>{const b=e.target.closest('[data-doc]');if(!b)return;selected=b.dataset.doc;render();};
  newNote.onclick=()=>ATT.modal('Nuevo seguimiento',[{name:'title',label:'Asunto',required:true},{name:'detail',label:'Detalle',type:'textarea',full:true,required:true},{name:'status',label:'Estado',type:'select',options:['Pendiente','En seguimiento','Finalizada']}],values=>{const note={...values,id:ATT.uid('SEG'),document:selected,date:ATT.nowDate(),time:ATT.nowTime()};data.dossierNotes.push(note);ATT.audit(data,'Expedientes','Crear seguimiento','Expediente',selected,values.title);save();render();ERP.toast('Seguimiento registrado');});
  exportDossier.onclick=()=>{const events=ATT.dossierEvents(data,selected);ATT.exportProtected(data,`expediente-${selected}.csv`,events,'Expedientes');};
  render();
});
