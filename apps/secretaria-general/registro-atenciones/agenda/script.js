document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const LEGACY_KEY = 'erp-attention-agenda-v17';
  const data = await ATT.load('data.json', LEGACY_KEY);
  let start = new Date(`${data.settings.currentDate || ATT.nowDate()}T12:00:00`);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  let view = 'week';
  const save = () => ATT.save(LEGACY_KEY, data);
  const iso = date => date.toISOString().slice(0, 10);

  ATT.insertLegalNotice('.page-heading');

  function fillFilters() {
    serviceFilter.innerHTML = '<option value="">Todos los servicios</option>' + data.services.filter(item => item.active !== false).map(item => `<option>${ATT.esc(item.name)}</option>`).join('');
    staffFilter.innerHTML = '<option value="">Todo el equipo</option>' + data.staff.filter(item => item.active !== false).map(item => `<option>${ATT.esc(item.name)}</option>`).join('');
  }

  function weekDays() {
    return [0, 1, 2, 3, 4].map(index => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }

  function filteredAppointments(days) {
    const dates = new Set(days.map(iso));
    return data.appointments.filter(item => dates.has(item.date) && (!serviceFilter.value || item.service === serviceFilter.value) && (!staffFilter.value || item.host === staffFilter.value));
  }

  function renderMetrics() {
    const today = data.settings.currentDate || ATT.nowDate();
    const todayItems = data.appointments.filter(item => item.date === today);
    const conflicts = data.appointments.filter((item, index, list) => list.some((other, otherIndex) => otherIndex !== index && other.date === item.date && other.host === item.host && !['Cancelada', 'Ausente'].includes(other.status) && ATT.minutes(item.time) < ATT.minutes(other.end) && ATT.minutes(item.end) > ATT.minutes(other.time)));
    const average = data.services.length ? Math.round(data.services.reduce((sum, item) => sum + Number(item.duration || 0), 0) / data.services.length) : 0;
    metrics.innerHTML = [
      ['calendar', todayItems.length, 'Citas hoy', 'Programadas'],
      ['check-circle', todayItems.filter(item => item.status === 'Confirmada').length, 'Confirmadas', 'Asistencia esperada'],
      ['triangle-alert', conflicts.length, 'Cruces detectados', 'Requieren revisión'],
      ['clock', `${average} min`, 'Duración media', 'Por servicio']
    ].map(item => `<div class="att-kpi"><span class="att-kpi-icon"><i data-lucide="${item[0]}"></i></span><div class="att-kpi-copy"><span>${item[2]}</span><strong>${item[1]}</strong><small>${item[3]}</small></div></div>`).join('');
  }

  function renderWeek(days, rows) {
    const hours = [];
    for (let hour = 8; hour < 17; hour += 1) hours.push(hour);
    weekBoard.innerHTML = `<div class="att-week"><div class="att-week-head"></div>${days.map(day => `<div class="att-week-head"><strong>${ATT.fmtDate(iso(day), { weekday: 'long' })}</strong><span>${ATT.fmtDate(iso(day), { day: '2-digit', month: 'short' })}</span></div>`).join('')}${hours.map(hour => `<div class="att-time">${String(hour).padStart(2, '0')}:00</div>${days.map(day => {
      const date = iso(day);
      const appointments = rows.filter(item => item.date === date && Number(item.time.slice(0, 2)) === hour);
      return `<div class="att-day-slot" data-date="${date}" data-time="${String(hour).padStart(2, '0')}:00">${appointments.map(item => `<button type="button" class="att-appt ${item.status === 'Cancelada' ? 'cancelled' : ''}" data-id="${item.id}"><strong>${ATT.esc(item.time)} · ${ATT.esc(item.person)}</strong><span>${ATT.esc(item.service)} · ${ATT.esc(item.host)}</span></button>`).join('')}</div>`;
    }).join('')}`).join('')}</div>`;
  }

  function renderList(rows) {
    rows.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    weekBoard.innerHTML = rows.length ? `<div class="att-table-wrap"><table class="att-table"><thead><tr><th>Fecha y hora</th><th>Persona</th><th>Servicio</th><th>Responsable</th><th>Modalidad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(item => `<tr><td><strong>${ATT.fmtDate(item.date)}</strong><small>${item.time}–${item.end}</small></td><td><strong>${ATT.esc(item.person)}</strong><small>${ATT.maskDocument(item.document)}</small></td><td>${ATT.esc(item.service)}</td><td>${ATT.esc(item.host)}</td><td>${ATT.esc(item.modality)}</td><td>${ATT.badge(item.status)}</td><td><div class="att-action-menu"><button class="icon-btn" data-view="${item.id}" title="Ver"><i data-lucide="eye"></i></button><button class="icon-btn" data-edit="${item.id}" title="Editar"><i data-lucide="pencil"></i></button>${!['Cancelada', 'Atendida'].includes(item.status) ? `<button class="icon-btn" data-cancel="${item.id}" title="Cancelar"><i data-lucide="calendar-x"></i></button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : '<div class="att-empty">No hay citas en esta semana.</div>';
  }

  function render() {
    const days = weekDays();
    weekTitle.textContent = `${ATT.fmtDate(iso(days[0]), { day: '2-digit', month: 'long' })} – ${ATT.fmtDate(iso(days[4]), { day: '2-digit', month: 'long', year: 'numeric' })}`;
    const rows = filteredAppointments(days);
    renderMetrics();
    if (view === 'week') renderWeek(days, rows);
    else renderList(rows);
    ATT.icons();
  }

  function fields(item = {}, preset = {}) {
    return [
      { name: 'person', label: 'Nombre completo', value: item.person || '', required: true },
      { name: 'document', label: 'Documento', value: item.document || '', required: true },
      { name: 'date', label: 'Fecha', type: 'date', value: item.date || preset.date || data.settings.currentDate || ATT.nowDate(), required: true },
      { name: 'time', label: 'Hora', type: 'time', value: item.time || preset.time || '', required: true },
      { name: 'service', label: 'Servicio', type: 'select', value: item.service || '', options: data.services.filter(entry => entry.active !== false).map(entry => entry.name) },
      { name: 'host', label: 'Responsable', type: 'select', value: item.host || '', options: data.staff.filter(entry => entry.active !== false).map(entry => entry.name) },
      { name: 'modality', label: 'Modalidad', type: 'select', value: item.modality || 'Presencial', options: ['Presencial', 'Virtual', 'Telefónica'] },
      { name: 'phone', label: 'Teléfono', value: item.phone || '' },
      { name: 'email', label: 'Correo', type: 'email', value: item.email || '' },
      { name: 'status', label: 'Estado', type: 'select', value: item.status || 'Programada', options: ['Programada', 'Confirmada', 'Por llegar', 'En sede', 'Atendida', 'Ausente', 'Cancelada'] },
      { name: 'notes', label: 'Observaciones', type: 'textarea', value: item.notes || '', full: true, help: 'Registre únicamente información necesaria para preparar la atención.' },
      { name: 'privacyNoticeAccepted', label: 'Aviso de privacidad', type: 'checkbox', checkboxLabel: 'La persona fue informada sobre la finalidad institucional del tratamiento.', value: item.privacyNoticeAccepted !== false, required: true, full: true }
    ];
  }

  function openForm(item = null, preset = {}) {
    ATT.modal(item ? 'Editar cita' : 'Agendar cita', fields(item || {}, preset), values => {
      const duration = data.services.find(entry => entry.name === values.service)?.duration || 30;
      const candidate = { ...values, end: ATT.addMinutes(values.time, duration) };
      const conflict = ATT.appointmentConflict(data, candidate, item?.id || '');
      if (conflict) throw new Error(`Horario ocupado por ${conflict.person} (${conflict.time}–${conflict.end}).`);
      candidate.privacyNoticeAccepted = values.privacyNoticeAccepted === 'true';
      candidate.informationClass = data.settings.informationClass;
      candidate.retentionRule = data.settings.retentionRule;
      if (item) Object.assign(item, candidate, { updatedAt: `${ATT.nowDate()} ${ATT.nowTime()}` });
      else data.appointments.push({ ...candidate, id: ATT.uid('CIT'), createdAt: `${ATT.nowDate()} ${ATT.nowTime()}` });
      ATT.upsertContact(data, values);
      ATT.audit(data, 'Agenda', item ? 'Editar cita' : 'Crear cita', 'Cita', item?.id || data.appointments.at(-1).id, `${values.date} ${values.time}`);
      save(); render(); ERP.toast(item ? 'Cita actualizada' : 'Cita agendada');
    });
  }

  function showDetail(item) {
    ATT.detail(item.id, `<div class="att-grid att-grid-2"><div><strong>Persona</strong><p>${ATT.esc(item.person)} · ${ATT.maskDocument(item.document)}</p></div><div><strong>Horario</strong><p>${ATT.fmtDate(item.date)} · ${item.time}–${item.end}</p></div><div><strong>Servicio</strong><p>${ATT.esc(item.service)}</p></div><div><strong>Responsable</strong><p>${ATT.esc(item.host)}</p></div><div><strong>Modalidad</strong><p>${ATT.esc(item.modality)}</p></div><div><strong>Estado</strong><p>${ATT.esc(item.status)}</p></div></div><div class="att-notice">${ATT.esc(item.notes || 'Sin observaciones.')}</div>`, `<button class="btn btn-primary" data-detail-edit="${item.id}">Editar</button>`);
  }

  fillFilters();
  serviceFilter.onchange = render;
  staffFilter.onchange = render;
  prevWeek.onclick = () => { start.setDate(start.getDate() - 7); render(); };
  nextWeek.onclick = () => { start.setDate(start.getDate() + 7); render(); };
  todayWeek.onclick = () => { start = new Date(`${data.settings.currentDate || ATT.nowDate()}T12:00:00`); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); render(); };
  newAppointment.onclick = () => openForm();
  suggestSlot.onclick = () => {
    const host = staffFilter.value || data.staff.find(item => item.active !== false)?.name;
    const date = data.settings.currentDate || ATT.nowDate();
    const possible = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];
    const time = possible.find(value => !ATT.appointmentConflict(data, { date, time: value, end: ATT.addMinutes(value, 30), host }));
    if (!time) return ERP.toast('No hay espacios disponibles en la fecha actual', 'error');
    ERP.toast(`Espacio sugerido: ${ATT.fmtDate(date)} a las ${time}`);
    openForm(null, { date, time });
  };

  viewTabs.onclick = event => {
    const button = event.target.closest('[data-view]');
    if (!button) return;
    view = button.dataset.view;
    viewTabs.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('active', item === button));
    render();
  };

  document.addEventListener('dblclick', event => {
    const slot = event.target.closest('.att-day-slot');
    if (slot) openForm(null, { date: slot.dataset.date, time: slot.dataset.time });
  });

  document.addEventListener('click', event => {
    const appointmentButton = event.target.closest('.att-appt,[data-view]');
    if (appointmentButton && appointmentButton.dataset.id) {
      const item = data.appointments.find(entry => entry.id === appointmentButton.dataset.id);
      if (item) showDetail(item);
    }
    const viewButton = event.target.closest('[data-view]');
    if (viewButton && !viewButton.closest('#viewTabs')) {
      const item = data.appointments.find(entry => entry.id === viewButton.dataset.view);
      if (item) showDetail(item);
    }
    const editButton = event.target.closest('[data-edit],[data-detail-edit]');
    if (editButton) {
      ERP.close('attDetailModal');
      const id = editButton.dataset.edit || editButton.dataset.detailEdit;
      const item = data.appointments.find(entry => entry.id === id);
      if (item) openForm(item);
    }
    const cancelButton = event.target.closest('[data-cancel]');
    if (cancelButton) {
      const item = data.appointments.find(entry => entry.id === cancelButton.dataset.cancel);
      if (!item) return;
      ATT.confirm(`¿Cancelar la cita de ${item.person}?`, () => {
        item.status = 'Cancelada';
        ATT.audit(data, 'Agenda', 'Cancelar cita', 'Cita', item.id, item.person);
        save(); render(); ERP.toast('Cita cancelada');
      });
    }
  });

  render();
});
