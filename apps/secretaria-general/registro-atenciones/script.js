document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const LEGACY_KEY = 'erp-attention-center-v17';
  const data = await ATT.load('data.json', LEGACY_KEY);
  let filter = 'all';
  const today = data.settings.currentDate || ATT.nowDate();
  const save = () => ATT.save(LEGACY_KEY, data);

  ATT.insertLegalNotice('.page-heading');

  function metrics() {
    const appointments = data.appointments.filter(item => item.date === today);
    const onsite = data.visitors.filter(item => item.status === 'En sede');
    const completed = data.attentions.filter(item => item.date === today && item.status === 'Finalizada');
    const waiting = data.queue.filter(item => item.status === 'En espera');
    const avgWait = waiting.length ? Math.max(5, Math.round(waiting.reduce((sum, item) => sum + Number(item.waitMinutes || 18), 0) / waiting.length)) : 0;

    document.getElementById('metrics').innerHTML = [
      ['calendar-check', appointments.length, 'Citas de hoy', 'Agenda programada'],
      ['users', onsite.length, 'Personas en sede', 'Ingresos activos'],
      ['check-circle', completed.length, 'Atenciones cerradas', 'Registro del día'],
      ['clock', `${avgWait} min`, 'Espera promedio', 'Sala presencial']
    ].map(item => `<div class="att-kpi"><div class="att-kpi-icon"><i data-lucide="${item[0]}"></i></div><div class="att-kpi-copy"><span>${item[2]}</span><strong>${item[1]}</strong><small>${item[3]}</small></div></div>`).join('');
  }

  function quickActions() {
    document.getElementById('quickActions').innerHTML = [
      ['calendar-plus', 'Agendar cita', 'Reservar un espacio', 'appointment'],
      ['user-plus', 'Registrar ingreso', 'Visitante o atención espontánea', 'visitor'],
      ['list-ordered', 'Generar turno', 'Añadir a sala de espera', 'ticket'],
      ['clipboard-list', 'Registrar atención', 'Resultado y compromiso del servicio', 'attention']
    ].map(item => `<button class="att-quick-card" data-quick="${item[3]}" type="button"><span class="att-item-icon"><i data-lucide="${item[0]}"></i></span><span><strong>${item[1]}</strong><span>${item[2]}</span></span></button>`).join('');
  }

  function advancedOverview() {
    const waiting = data.queue.filter(item => item.status === 'En espera').sort((a,b) => String(a.arrival).localeCompare(String(b.arrival)));
    const oldest = waiting[0];
    const next = data.appointments.filter(item => item.date === today && !['Cancelada','Atendida'].includes(item.status) && item.time >= ATT.nowTime()).sort((a,b)=>a.time.localeCompare(b.time))[0];
    const unread = data.notifications.filter(item => item.status === 'Pendiente').length;
    const open = data.attentions.filter(item => item.commitment && !['Finalizada','Cerrada'].includes(item.status)).length;
    document.getElementById('advancedOverview').innerHTML = [
      ['timer', 'Mayor espera', oldest ? `${oldest.ticket} · ${oldest.arrival}` : 'Sin espera', 'turnos/index.html'],
      ['calendar-clock', 'Próxima cita', next ? `${next.time} · ${next.person}` : 'Sin citas próximas', 'agenda/index.html'],
      ['bell-ring', 'Notificaciones', `${unread} pendientes`, 'notificaciones/index.html'],
      ['flag', 'Compromisos', `${open} abiertos`, 'expedientes/index.html'],
      ['globe-2', 'Portal público', 'Reservas y autogestión', 'portal-citas/index.html'],
      ['qr-code', 'Check-in QR', 'Registrar llegada', 'checkin/index.html']
    ].map(item => `<a class="att-card att-card-body att-item" href="${item[3]}"><span class="att-item-icon"><i data-lucide="${item[0]}"></i></span><div><strong>${item[1]}</strong><span>${ATT.esc(item[2])}</span></div><i data-lucide="chevron-right"></i></a>`).join('');
  }

  function agenda() {
    let rows = data.appointments.filter(item => item.date === today);
    const query = document.getElementById('agendaSearch').value.trim().toLowerCase();
    if (query) rows = rows.filter(item => [item.person, item.service, item.host, item.document].some(value => String(value || '').toLowerCase().includes(query)));
    if (filter === 'pending') rows = rows.filter(item => !['Atendida', 'Cancelada', 'Ausente'].includes(item.status));
    if (filter === 'onsite') {
      const onsiteNames = new Set(data.visitors.filter(item => item.status === 'En sede').map(item => item.name));
      rows = rows.filter(item => onsiteNames.has(item.person));
    }
    rows.sort((a, b) => a.time.localeCompare(b.time));

    document.getElementById('todayAgenda').innerHTML = rows.length ? `<div class="att-table-wrap"><table class="att-table"><thead><tr><th>Hora</th><th>Persona</th><th>Servicio</th><th>Responsable</th><th>Modalidad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(item => `<tr>
      <td><strong>${ATT.esc(item.time)}</strong><small>${ATT.esc(item.end)}</small></td>
      <td><strong>${ATT.esc(item.person)}</strong><small>${ATT.maskDocument(item.document)}</small></td>
      <td>${ATT.esc(item.service)}</td><td>${ATT.esc(item.host)}</td><td>${ATT.esc(item.modality)}</td><td>${ATT.badge(item.status)}</td>
      <td><div class="att-action-menu">
        <button class="icon-btn" data-view-appointment="${item.id}" title="Ver detalle"><i data-lucide="eye"></i></button>
        ${item.modality === 'Presencial' && !['En sede', 'Atendida', 'Cancelada'].includes(item.status) ? `<button class="icon-btn" data-arrive="${item.id}" title="Registrar llegada"><i data-lucide="log-in"></i></button>` : ''}
        ${!['Atendida', 'Cancelada'].includes(item.status) ? `<button class="icon-btn" data-edit-appointment="${item.id}" title="Editar"><i data-lucide="pencil"></i></button>` : ''}
        ${!['Atendida', 'Cancelada'].includes(item.status) ? `<button class="icon-btn" data-cancel-appointment="${item.id}" title="Cancelar"><i data-lucide="calendar-x"></i></button>` : ''}
      </div></td></tr>`).join('')}</tbody></table></div>` : '<div class="att-empty">No hay citas para este filtro.</div>';
  }

  function visitors() {
    const rows = data.visitors.filter(item => item.status === 'En sede');
    document.getElementById('liveVisitors').innerHTML = rows.length ? rows.map(item => `<div class="att-item"><span class="att-item-icon"><i data-lucide="user"></i></span><div><strong>${ATT.esc(item.name)}</strong><span>${ATT.esc(item.host)} · ingreso ${ATT.esc(item.checkin)}</span></div><button class="btn btn-secondary btn-sm" data-checkout="${item.id}">Registrar salida</button></div>`).join('') : '<div class="att-empty">No hay visitantes en sede.</div>';
  }

  function alerts() {
    const commitments = data.attentions.filter(item => item.status !== 'Finalizada' && item.due && item.due <= today).map(item => ({
      title: `Seguimiento vencido: ${item.person}`,
      detail: `${item.service} · plazo ${ATT.fmtDate(item.due)}`,
      tone: 'danger'
    }));
    const items = [...commitments, ...(data.alerts || [])].slice(0, 8);
    document.getElementById('alerts').innerHTML = items.length ? items.map(item => `<div class="att-item"><span class="att-item-icon"><i data-lucide="alert-triangle"></i></span><div><strong>${ATT.esc(item.title)}</strong><span>${ATT.esc(item.detail)}</span></div>${ATT.badge(item.tone === 'danger' ? 'Crítico' : item.tone === 'warning' ? 'Revisar' : 'Activo')}</div>`).join('') : '<div class="att-empty">Sin alertas pendientes.</div>';
  }

  function render() {
    metrics();
    quickActions();
    advancedOverview();
    agenda();
    visitors();
    alerts();
    bindQuickActions();
    ATT.icons();
  }

  function appointmentFields(item = {}) {
    return [
      { name: 'person', label: 'Nombre completo', value: item.person || '', required: true },
      { name: 'document', label: 'Documento de identificación', value: item.document || '', required: true, help: 'Se muestra enmascarado en las vistas operativas.' },
      { name: 'date', label: 'Fecha', type: 'date', value: item.date || today, required: true },
      { name: 'time', label: 'Hora', type: 'time', value: item.time || '', required: true },
      { name: 'service', label: 'Servicio', type: 'select', value: item.service || '', options: data.services.filter(service => service.active !== false).map(service => service.name) },
      { name: 'host', label: 'Responsable', type: 'select', value: item.host || '', options: data.staff.filter(person => person.active !== false).map(person => person.name) },
      { name: 'modality', label: 'Modalidad', type: 'select', value: item.modality || 'Presencial', options: ['Presencial', 'Virtual', 'Telefónica'] },
      { name: 'phone', label: 'Teléfono', value: item.phone || '' },
      { name: 'email', label: 'Correo', type: 'email', value: item.email || '' },
      { name: 'status', label: 'Estado', type: 'select', value: item.status || 'Programada', options: ['Programada', 'Confirmada', 'Por llegar', 'En sede', 'Atendida', 'Ausente', 'Cancelada'] },
      { name: 'notes', label: 'Observaciones necesarias para la cita', type: 'textarea', value: item.notes || '', full: true, help: 'No registre información sensible que no sea indispensable.' },
      { name: 'privacyNoticeAccepted', label: 'Aviso de privacidad', type: 'checkbox', checkboxLabel: 'Se informó la finalidad del tratamiento y el uso institucional de los datos.', value: item.privacyNoticeAccepted !== false, required: true, full: true }
    ];
  }

  function appointmentForm(item = null) {
    ATT.modal(item ? 'Editar cita' : 'Nueva cita', appointmentFields(item || {}), values => {
      const service = data.services.find(entry => entry.name === values.service);
      const end = ATT.addMinutes(values.time, service?.duration || 30);
      const candidate = { ...values, end };
      const conflict = ATT.appointmentConflict(data, candidate, item?.id || '');
      if (conflict) throw new Error(`El responsable ya tiene la cita ${conflict.time}–${conflict.end}. Seleccione otro horario.`);
      candidate.privacyNoticeAccepted = values.privacyNoticeAccepted === 'true';
      candidate.informationClass = data.settings.informationClass;
      candidate.retentionRule = data.settings.retentionRule;

      if (item) Object.assign(item, candidate, { updatedAt: `${ATT.nowDate()} ${ATT.nowTime()}` });
      else data.appointments.push({ ...candidate, id: ATT.uid('CIT'), bookingCode: ATT.appointmentCode(data), source: 'Registro interno', createdAt: `${ATT.nowDate()} ${ATT.nowTime()}` });

      const record = item || data.appointments.at(-1);
      ATT.upsertContact(data, values);
      ATT.notify(data, { title: item ? 'Cita actualizada' : 'Confirmación de cita', message: `${record.service} · ${record.date} ${record.time}`, channel: 'Correo', recipient: record.email || record.person, status: 'Pendiente', relatedType: 'Cita', relatedId: record.id });
      ATT.notify(data, { title: item ? 'Agenda modificada' : 'Nueva cita asignada', message: `${record.person} · ${record.date} ${record.time}`, channel: 'Notificación interna', recipient: record.host, status: 'Pendiente', relatedType: 'Cita', relatedId: record.id });
      ATT.audit(data, 'Centro de Atención', item ? 'Editar cita' : 'Crear cita', 'Cita', record.id, `${values.date} ${values.time}`);
      save();
      render();
      ERP.toast(item ? 'Cita actualizada' : 'Cita registrada');
    });
  }

  function visitorForm() {
    ATT.modal('Registrar visitante', [
      { name: 'name', label: 'Nombre completo', required: true },
      { name: 'document', label: 'Documento de identificación', required: true },
      { name: 'company', label: 'Entidad o procedencia', value: 'Particular' },
      { name: 'host', label: 'Funcionario anfitrión', type: 'select', options: data.staff.filter(item => item.active !== false).map(item => item.name) },
      { name: 'purpose', label: 'Motivo general de la visita', required: true, help: 'Use una descripción general; evite incluir datos sensibles.' },
      { name: 'expected', label: 'Hora esperada', type: 'time', value: ATT.nowTime(), required: true },
      { name: 'phone', label: 'Teléfono de contacto' },
      { name: 'privacyNoticeAccepted', label: 'Aviso de privacidad', type: 'checkbox', checkboxLabel: 'La persona fue informada sobre el registro de ingreso, seguridad y atención institucional.', value: true, required: true, full: true }
    ], values => {
      const visitor = {
        ...values,
        id: ATT.uid('VIS'),
        date: today,
        checkin: ATT.nowTime(),
        checkout: '',
        status: 'En sede',
        badge: `V-${String(data.visitors.length + 84).padStart(3, '0')}`,
        consent: values.privacyNoticeAccepted === 'true',
        privacyNoticeAccepted: values.privacyNoticeAccepted === 'true',
        informationClass: data.settings.informationClass,
        retentionRule: data.settings.retentionRule
      };
      data.visitors.push(visitor);
      const contact = ATT.upsertContact(data, values);
      if (contact) {
        contact.visits = Number(contact.visits || 0) + 1;
        contact.lastVisit = today;
      }
      ATT.notify(data, { title: 'Visitante en recepción', message: `${visitor.name} llegó para ${visitor.purpose}`, channel: 'Notificación interna', recipient: visitor.host, status: 'Pendiente', relatedType: 'Visitante', relatedId: visitor.id });
      ATT.audit(data, 'Centro de Atención', 'Registrar ingreso', 'Visitante', visitor.id, visitor.host);
      save();
      render();
      ERP.toast('Ingreso registrado');
    });
  }

  function ticketForm() {
    ATT.modal('Generar turno', [
      { name: 'person', label: 'Nombre completo o identificador', required: true },
      { name: 'service', label: 'Servicio', type: 'select', options: data.services.filter(item => item.active !== false).map(item => item.name) },
      { name: 'priority', label: 'Prioridad', type: 'select', options: ['Normal', 'Prioritaria'] },
      { name: 'priorityReason', label: 'Motivo de prioridad', placeholder: 'Solo cuando aplique' }
    ], values => {
      const ticket = {
        ...values,
        id: ATT.uid('T'),
        ticket: `A${String(data.queue.length + 24).padStart(3, '0')}`,
        arrival: ATT.nowTime(),
        status: 'En espera',
        counter: '',
        waitMinutes: 0
      };
      data.queue.push(ticket);
      ATT.audit(data, 'Centro de Atención', 'Generar turno', 'Turno', ticket.id, ticket.ticket);
      save();
      ERP.toast(`Turno ${ticket.ticket} generado`);
      window.location.href = 'turnos/index.html';
    });
  }

  function attentionForm() {
    ATT.modal('Registrar atención', [
      { name: 'person', label: 'Nombre completo', required: true },
      { name: 'document', label: 'Documento', required: true },
      { name: 'channel', label: 'Canal', type: 'select', options: ['Presencial', 'Telefónica', 'Virtual', 'Correo'] },
      { name: 'service', label: 'Servicio', type: 'select', options: data.services.map(item => item.name) },
      { name: 'staff', label: 'Funcionario responsable', type: 'select', options: data.staff.filter(item => item.active !== false).map(item => item.name) },
      { name: 'category', label: 'Tipo de atención', type: 'select', options: ['Orientación', 'Entrega de documentos', 'Seguimiento', 'Reunión', 'Atención a proveedor', 'Otra'] },
      { name: 'outcome', label: 'Resultado de la atención', type: 'textarea', full: true, required: true },
      { name: 'commitment', label: 'Compromiso o siguiente paso', type: 'textarea', full: true },
      { name: 'due', label: 'Fecha de seguimiento', type: 'date' },
      { name: 'status', label: 'Estado', type: 'select', options: ['Finalizada', 'Seguimiento', 'Pendiente'] },
      { name: 'privacyNoticeAccepted', label: 'Aviso de privacidad', type: 'checkbox', checkboxLabel: 'Se informó el tratamiento de los datos para la gestión de esta atención.', value: true, required: true, full: true }
    ], values => {
      const attention = { ...values, id: ATT.uid('ATE'), date: today, time: ATT.nowTime(), rating: '', privacyNoticeAccepted: values.privacyNoticeAccepted === 'true', informationClass: data.settings.informationClass, retentionRule: data.settings.retentionRule };
      data.attentions.push(attention);
      ATT.upsertContact(data, values);
      if (values.commitment) ATT.notify(data, { title: 'Compromiso de atención', message: `${values.person} · ${values.commitment}`, channel: 'Notificación interna', recipient: values.staff, status: 'Pendiente', relatedType: 'Atención', relatedId: attention.id });
      ATT.audit(data, 'Centro de Atención', 'Registrar atención', 'Atención', attention.id, values.category);
      save(); ERP.toast('Atención registrada'); window.location.href = 'atenciones/index.html';
    });
  }

  function bindQuickActions() {
    document.getElementById('newAppointment').onclick = () => appointmentForm();
    document.getElementById('registerVisitor').onclick = visitorForm;
    document.getElementById('quickActions').onclick = event => {
      const button = event.target.closest('[data-quick]');
      if (!button) return;
      const actions = { appointment: () => appointmentForm(), visitor: visitorForm, ticket: ticketForm, attention: attentionForm };
      actions[button.dataset.quick]?.();
    };
  }

  document.getElementById('agendaSearch').addEventListener('input', agenda);
  document.getElementById('agendaTabs').onclick = event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    filter = button.dataset.filter;
    document.querySelectorAll('.att-tab').forEach(item => item.classList.toggle('active', item === button));
    agenda();
  };

  document.getElementById('exportToday').onclick = () => ATT.exportPublic('agenda-publica-anonimizada.csv', data.appointments.filter(item => item.date === today), [
    { label: 'Fecha', key: 'date' }, { label: 'Hora', key: 'time' }, { label: 'Servicio', key: 'service' },
    { label: 'Responsable', key: 'host' }, { label: 'Modalidad', key: 'modality' }, { label: 'Estado', key: 'status' }
  ]);

  document.addEventListener('click', event => {
    const view = event.target.closest('[data-view-appointment]');
    if (view) {
      const item = data.appointments.find(entry => entry.id === view.dataset.viewAppointment);
      if (!item) return;
      ATT.detail(item.id, `<div class="att-grid att-grid-2"><div class="att-card-body"><strong>Persona</strong><p>${ATT.esc(item.person)} · ${ATT.maskDocument(item.document)}</p></div><div class="att-card-body"><strong>Horario</strong><p>${ATT.fmtDate(item.date)} · ${item.time}–${item.end}</p></div><div class="att-card-body"><strong>Servicio</strong><p>${ATT.esc(item.service)}</p></div><div class="att-card-body"><strong>Responsable</strong><p>${ATT.esc(item.host)}</p></div></div><div class="att-notice">${ATT.esc(item.notes || 'Sin observaciones.')}</div><div class="att-audit-mini"><i data-lucide="shield-check"></i> ${ATT.esc(item.informationClass || data.settings.informationClass)}</div>`);
    }

    const edit = event.target.closest('[data-edit-appointment]');
    if (edit) {
      const item = data.appointments.find(entry => entry.id === edit.dataset.editAppointment);
      if (item) appointmentForm(item);
    }

    const cancel = event.target.closest('[data-cancel-appointment]');
    if (cancel) {
      const item = data.appointments.find(entry => entry.id === cancel.dataset.cancelAppointment);
      if (!item) return;
      ATT.confirm(`¿Cancelar la cita de ${item.person}?`, () => {
        item.status = 'Cancelada';
        ATT.notify(data, { title: 'Cita cancelada', message: `${item.service} · ${item.date} ${item.time}`, channel: 'Correo', recipient: item.email || item.person, status: 'Pendiente', relatedId: item.id });
        ATT.audit(data, 'Centro de Atención', 'Cancelar cita', 'Cita', item.id, item.person);
        save(); render(); ERP.toast('Cita cancelada');
      });
    }

    const arrive = event.target.closest('[data-arrive]');
    if (arrive) {
      const appointment = data.appointments.find(item => item.id === arrive.dataset.arrive);
      if (!appointment) return;
      if (!data.visitors.some(item => item.document === appointment.document && item.status === 'En sede')) {
        const visitor = {
          id: ATT.uid('VIS'), name: appointment.person, document: appointment.document, company: 'Particular', host: appointment.host,
          purpose: appointment.service, expected: appointment.time, checkin: ATT.nowTime(), checkout: '', status: 'En sede',
          badge: `V-${String(data.visitors.length + 84).padStart(3, '0')}`, consent: true, privacyNoticeAccepted: true,
          informationClass: data.settings.informationClass, retentionRule: data.settings.retentionRule
        };
        data.visitors.push(visitor);
        ATT.audit(data, 'Centro de Atención', 'Registrar llegada desde cita', 'Visitante', visitor.id, appointment.id);
      }
      appointment.status = 'En sede';
      ATT.notify(data, { title: 'Visitante en recepción', message: `${appointment.person} llegó para ${appointment.service}`, channel: 'Notificación interna', recipient: appointment.host, status: 'Pendiente', relatedId: appointment.id });
      save(); render(); ERP.toast('Llegada registrada');
    }

    const checkout = event.target.closest('[data-checkout]');
    if (checkout) {
      const visitor = data.visitors.find(item => item.id === checkout.dataset.checkout);
      if (!visitor) return;
      visitor.status = 'Finalizada';
      visitor.checkout = ATT.nowTime();
      ATT.audit(data, 'Centro de Atención', 'Registrar salida', 'Visitante', visitor.id, visitor.name);
      save(); render(); ERP.toast('Salida registrada');
    }
  });

  render();
});
