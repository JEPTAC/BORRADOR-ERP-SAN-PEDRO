document.addEventListener('DOMContentLoaded', async () => {
  'use strict';
  const data = await ATT.load('data.json', 'erp-attention-notifications-v22');
  const save = () => ATT.save('', data);

  if (!data.notifications.length) {
    data.appointments.slice(0, 3).forEach(item => {
      ATT.notify(data, { title: 'Confirmación de cita', message: `${item.service} · ${item.date} ${item.time}`, channel: 'Correo', recipient: item.email || item.person, status: 'Enviada', relatedType: 'Cita', relatedId: item.id });
    });
    ATT.notify(data, { title: 'Aviso al anfitrión', message: 'Visitante en recepción', channel: 'Notificación interna', recipient: 'Secretaría General', status: 'Pendiente' });
    save();
  }

  function filtered() {
    const q = notificationSearch.value.trim().toLowerCase();
    return data.notifications.filter(item => (!q || [item.title,item.message,item.recipient,item.channel].some(v => String(v||'').toLowerCase().includes(q))) && (!statusFilter.value || item.status === statusFilter.value) && (!channelFilter.value || item.channel === channelFilter.value));
  }

  function render() {
    const rows = filtered();
    const pending = data.notifications.filter(i => i.status === 'Pendiente').length;
    const sent = data.notifications.filter(i => i.status === 'Enviada').length;
    const errors = data.notifications.filter(i => i.status === 'Error').length;
    metrics.innerHTML = [
      ['bell-ring', data.notifications.length, 'Notificaciones', 'Registro acumulado'],
      ['clock-3', pending, 'Pendientes', 'Requieren procesamiento'],
      ['send', sent, 'Enviadas', 'Entrega simulada'],
      ['triangle-alert', errors, 'Errores', 'Revisar canal']
    ].map(x => `<div class="att-kpi"><span class="att-kpi-icon"><i data-lucide="${x[0]}"></i></span><div class="att-kpi-copy"><span>${x[2]}</span><strong>${x[1]}</strong><small>${x[3]}</small></div></div>`).join('');

    notificationTable.innerHTML = rows.length ? `<div class="att-table-wrap"><table class="att-table"><thead><tr><th>Fecha</th><th>Notificación</th><th>Destinatario</th><th>Canal</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(item => `<tr><td><strong>${ATT.fmtDate(item.date)}</strong><small>${item.time}</small></td><td class="notification-message"><strong>${ATT.esc(item.title)}</strong><small>${ATT.esc(item.message)}</small></td><td>${ATT.esc(item.recipient)}</td><td><span class="channel-chip"><i data-lucide="${item.channel==='Correo'?'mail':item.channel==='SMS'?'message-square':'bell'}"></i>${ATT.esc(item.channel)}</span></td><td>${ATT.badge(item.status)}</td><td><div class="att-row-actions"><button class="icon-btn" data-view="${item.id}" title="Detalle"><i data-lucide="eye"></i></button>${item.status!=='Enviada'?`<button class="icon-btn" data-send="${item.id}" title="Enviar"><i data-lucide="send"></i></button>`:''}<button class="icon-btn" data-delete="${item.id}" title="Eliminar"><i data-lucide="trash-2"></i></button></div></td></tr>`).join('')}</tbody></table></div>` : '<div class="att-empty">No hay notificaciones para este filtro.</div>';

    ruleList.innerHTML = data.rules.filter(r=>r.active!==false).map(r => `<div class="att-item"><span class="att-item-icon"><i data-lucide="workflow"></i></span><div><strong>${ATT.esc(r.name)}</strong><span>${ATT.esc(r.event)} · ${ATT.esc(r.channel)}</span></div>${ATT.badge('Activa')}</div>`).join('') || '<div class="att-empty">No hay reglas activas.</div>';
    deliveryStatus.innerHTML = `<div class="att-notice"><strong>Modo ${ATT.esc(data.settings.notificationMode)}</strong><br>Los envíos se registran y simulan en esta fase. Para entrega real se requiere correo institucional o proveedor autorizado.</div>`;
    ATT.icons();
  }

  newNotification.onclick = () => ATT.modal('Nueva notificación', [
    {name:'title',label:'Asunto',required:true},{name:'recipient',label:'Destinatario',required:true},{name:'channel',label:'Canal',type:'select',options:['Correo','SMS','Notificación interna']},{name:'message',label:'Mensaje',type:'textarea',full:true,required:true}
  ], values => { const item = ATT.notify(data, values); ATT.audit(data,'Notificaciones','Crear notificación','Notificación',item.id,item.recipient); save(); render(); ERP.toast('Notificación creada'); });
  notificationSearch.oninput = render; statusFilter.onchange = render; channelFilter.onchange = render;
  document.addEventListener('click', event => {
    const view = event.target.closest('[data-view]');
    if (view) { const item=data.notifications.find(i=>i.id===view.dataset.view); if(item) ATT.detail(item.title,`<div class="att-grid att-grid-2"><div><strong>Destinatario</strong><p>${ATT.esc(item.recipient)}</p></div><div><strong>Canal</strong><p>${ATT.esc(item.channel)}</p></div><div><strong>Estado</strong><p>${ATT.esc(item.status)}</p></div><div><strong>Intentos</strong><p>${item.attempts||0}</p></div></div><div class="att-notice">${ATT.esc(item.message)}</div>`); }
    const send = event.target.closest('[data-send]');
    if(send){ const item=data.notifications.find(i=>i.id===send.dataset.send); item.status='Enviada'; item.attempts=Number(item.attempts||0)+1; item.sentAt=`${ATT.nowDate()} ${ATT.nowTime()}`; ATT.audit(data,'Notificaciones','Enviar notificación','Notificación',item.id,item.channel); save(); render(); ERP.toast('Envío simulado registrado'); }
    const del = event.target.closest('[data-delete]');
    if(del){ const item=data.notifications.find(i=>i.id===del.dataset.delete); ATT.confirm('¿Eliminar esta notificación?',()=>{data.notifications=data.notifications.filter(i=>i.id!==item.id); save(); render();}); }
  });
  render();
});
