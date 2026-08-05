document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const LEGACY_KEY = 'erp-attention-config-v17';
  const data = await ATT.load('data.json', LEGACY_KEY);
  const save = () => ATT.save(LEGACY_KEY, data);

  ATT.insertLegalNotice('.att-heading');

  const grid = document.querySelector('.att-grid.att-grid-2');
  if (grid && !document.getElementById('policyPanel')) {
    grid.insertAdjacentHTML('beforeend', `
      <article class="att-card"><div class="att-card-head"><div><h2>Privacidad, transparencia y archivo</h2><p>Clasificación, publicación y retención documental.</p></div><button class="btn btn-secondary btn-sm" id="editPolicy"><i data-lucide="shield-check"></i> Editar</button></div><div class="att-card-body" id="policyPanel"></div></article>
      <article class="att-card"><div class="att-card-head"><div><h2>Respaldo y control</h2><p>Copias, restauración y auditoría local.</p></div></div><div class="att-card-body"><div class="att-grid att-grid-2"><button class="btn btn-secondary" id="backupData"><i data-lucide="download"></i> Descargar respaldo</button><button class="btn btn-secondary" id="importData"><i data-lucide="upload"></i> Importar respaldo</button><button class="btn btn-secondary" id="exportAudit"><i data-lucide="scroll-text"></i> Exportar auditoría</button><button class="btn btn-danger" id="resetData"><i data-lucide="rotate-ccw"></i> Restablecer demo</button></div><input id="importFile" type="file" accept="application/json" hidden><div class="att-public-note" style="margin-top:10px">Los respaldos pueden contener datos personales. Custódielos con acceso restringido y aplique la TRD institucional.</div></div></article>
    `);
    const rulesHeader = ruleList.closest('.att-card').querySelector('.att-card-head');
    rulesHeader.insertAdjacentHTML('beforeend', '<button class="btn btn-secondary btn-sm" id="newRule"><i data-lucide="plus"></i> Añadir</button>');
    const scheduleHeader = schedulePanel.closest('.att-card').querySelector('.att-card-head');
    scheduleHeader.insertAdjacentHTML('beforeend', '<button class="btn btn-secondary btn-sm" id="editSchedule"><i data-lucide="clock-3"></i> Editar</button>');
  }

  function render() {
    serviceList.innerHTML = data.services.map(service => `<div class="att-item"><span class="att-item-icon"><i data-lucide="briefcase"></i></span><div><strong>${ATT.esc(service.name)}</strong><span>${Number(service.duration)} min · ${ATT.esc(service.modality)} · ${service.active === false ? 'Inactivo' : 'Activo'}</span></div><div class="att-action-menu"><button class="icon-btn" data-edit-service="${service.id}" title="Editar"><i data-lucide="pencil"></i></button><button class="icon-btn" data-toggle-service="${service.id}" title="Activar o desactivar"><i data-lucide="power"></i></button><button class="icon-btn" data-delete-service="${service.id}" title="Eliminar"><i data-lucide="trash-2"></i></button></div></div>`).join('');

    staffList.innerHTML = data.staff.map(person => `<div class="att-item"><div class="avatar">${ATT.initials(person.name)}</div><div><strong>${ATT.esc(person.name)}</strong><span>${ATT.esc(person.role)} · ${ATT.esc(person.office || '')}</span></div><div class="att-action-menu">${ATT.badge(person.active === false ? 'Inactivo' : 'Disponible')}<button class="icon-btn" data-edit-staff="${person.id}" title="Editar"><i data-lucide="pencil"></i></button><button class="icon-btn" data-toggle-staff="${person.id}" title="Activar o desactivar"><i data-lucide="power"></i></button><button class="icon-btn" data-delete-staff="${person.id}" title="Eliminar"><i data-lucide="trash-2"></i></button></div></div>`).join('');

    schedulePanel.innerHTML = `<div class="att-grid att-grid-2"><div class="att-notice"><strong>Jornada</strong><br>${data.schedule.weekdays.join(', ')}<br>${data.schedule.open} – ${data.schedule.close}</div><div class="att-notice"><strong>Pausa institucional</strong><br>${data.schedule.lunchStart} – ${data.schedule.lunchEnd}</div></div>`;

    ruleList.innerHTML = data.rules.map(rule => `<div class="att-item"><span class="att-item-icon"><i data-lucide="bell"></i></span><div><strong>${ATT.esc(rule.name)}</strong><span>${ATT.esc(rule.event)} · ${ATT.esc(rule.channel)}</span></div><div class="att-action-menu"><button class="btn btn-secondary btn-sm" data-toggle-rule="${rule.id}">${rule.active ? 'Activo' : 'Inactivo'}</button><button class="icon-btn" data-edit-rule="${rule.id}" title="Editar"><i data-lucide="pencil"></i></button><button class="icon-btn" data-delete-rule="${rule.id}" title="Eliminar"><i data-lucide="trash-2"></i></button></div></div>`).join('');

    policyPanel.innerHTML = `<div class="att-grid att-grid-2"><div class="att-notice"><strong>Finalidad</strong><br>${ATT.esc(data.policy.purpose)}</div><div class="att-notice"><strong>Base funcional</strong><br>${ATT.esc(data.policy.legalBasis)}</div><div class="att-notice"><strong>Clasificación</strong><br>${ATT.esc(data.policy.classification)}</div><div class="att-notice"><strong>Retención</strong><br>${ATT.esc(data.policy.retentionRule)}</div></div><div class="att-public-note" style="margin-top:9px">${ATT.esc(data.policy.publicationRule)}</div>`;
    ATT.icons();
  }

  function serviceForm(service = null) {
    ATT.modal(service ? 'Editar servicio' : 'Nuevo servicio', [
      { name: 'name', label: 'Nombre del servicio', value: service?.name || '', required: true },
      { name: 'duration', label: 'Duración en minutos', type: 'number', min: 5, max: 240, step: 5, value: service?.duration || 30, required: true },
      { name: 'modality', label: 'Modalidad', type: 'select', value: service?.modality || 'Presencial', options: ['Presencial', 'Virtual', 'Presencial / virtual', 'Presencial / telefónica', 'Telefónica'] },
      { name: 'description', label: 'Descripción y alcance', type: 'textarea', value: service?.description || '', full: true },
      { name: 'requiresAppointment', label: 'Regla', type: 'checkbox', checkboxLabel: 'El servicio requiere cita previa.', value: service?.requiresAppointment || false, full: true },
      { name: 'active', label: 'Estado', type: 'checkbox', checkboxLabel: 'Servicio activo y disponible para agendar.', value: service?.active !== false, full: true }
    ], values => {
      const duplicate = data.services.find(item => item.name.toLowerCase() === values.name.toLowerCase() && item.id !== service?.id);
      if (duplicate) throw new Error('Ya existe un servicio con ese nombre.');
      const payload = { ...values, duration: Number(values.duration), requiresAppointment: values.requiresAppointment === 'true', active: values.active === 'true', color: service?.color || '#0f4c81' };
      if (service) Object.assign(service, payload);
      else data.services.push({ ...payload, id: ATT.uid('SER') });
      const record = service || data.services.at(-1);
      ATT.audit(data, 'Configuración', service ? 'Editar servicio' : 'Crear servicio', 'Servicio', record.id, record.name);
      save(); render(); ERP.toast('Servicio guardado');
    });
  }

  function staffForm(person = null) {
    ATT.modal(person ? 'Editar responsable' : 'Nuevo responsable', [
      { name: 'name', label: 'Nombre completo', value: person?.name || '', required: true },
      { name: 'role', label: 'Cargo o rol', value: person?.role || '', required: true },
      { name: 'office', label: 'Dependencia', value: person?.office || 'Secretaría General', required: true },
      { name: 'email', label: 'Correo institucional', type: 'email', value: person?.email || '' },
      { name: 'active', label: 'Estado', type: 'checkbox', checkboxLabel: 'Disponible para recibir citas y asignaciones.', value: person?.active !== false, full: true }
    ], values => {
      const payload = { ...values, active: values.active === 'true' };
      if (person) Object.assign(person, payload);
      else data.staff.push({ ...payload, id: ATT.uid('FUN') });
      const record = person || data.staff.at(-1);
      ATT.audit(data, 'Configuración', person ? 'Editar responsable' : 'Crear responsable', 'Responsable', record.id, record.name);
      save(); render(); ERP.toast('Responsable guardado');
    });
  }

  function ruleForm(rule = null) {
    ATT.modal(rule ? 'Editar automatización' : 'Nueva automatización', [
      { name: 'name', label: 'Nombre de la regla', value: rule?.name || '', required: true },
      { name: 'event', label: 'Evento', type: 'select', value: rule?.event || 'Nueva cita', options: ['Nueva cita', 'Antes de la cita', 'Check-in', 'Atención finalizada', 'Plazo próximo a vencer', 'PQRSD sin radicar'] },
      { name: 'channel', label: 'Canal', type: 'select', value: rule?.channel || 'Correo', options: ['Correo', 'SMS', 'Correo / SMS', 'Notificación interna'] },
      { name: 'leadTime', label: 'Anticipación o espera', value: rule?.leadTime || 'Inmediata' },
      { name: 'active', label: 'Estado', type: 'checkbox', checkboxLabel: 'Regla activa.', value: rule?.active !== false, full: true }
    ], values => {
      const payload = { ...values, active: values.active === 'true' };
      if (rule) Object.assign(rule, payload);
      else data.rules.push({ ...payload, id: ATT.uid('R') });
      const record = rule || data.rules.at(-1);
      ATT.audit(data, 'Configuración', rule ? 'Editar regla' : 'Crear regla', 'Regla', record.id, record.name);
      save(); render(); ERP.toast('Regla guardada');
    });
  }

  newService.onclick = () => serviceForm();
  newStaff.onclick = () => staffForm();
  document.getElementById('newRule').onclick = () => ruleForm();
  document.getElementById('editSchedule').onclick = () => ATT.modal('Editar horario institucional', [
    { name: 'weekdays', label: 'Días de atención', value: data.schedule.weekdays.join(', '), required: true, help: 'Separe los días con coma.' },
    { name: 'open', label: 'Apertura', type: 'time', value: data.schedule.open, required: true },
    { name: 'close', label: 'Cierre', type: 'time', value: data.schedule.close, required: true },
    { name: 'lunchStart', label: 'Inicio de pausa', type: 'time', value: data.schedule.lunchStart, required: true },
    { name: 'lunchEnd', label: 'Fin de pausa', type: 'time', value: data.schedule.lunchEnd, required: true }
  ], values => {
    if (ATT.minutes(values.open) >= ATT.minutes(values.close)) throw new Error('La hora de cierre debe ser posterior a la apertura.');
    data.schedule = { ...data.schedule, ...values, weekdays: values.weekdays.split(',').map(item => item.trim()).filter(Boolean) };
    data.settings.open = values.open; data.settings.close = values.close; data.settings.lunchStart = values.lunchStart; data.settings.lunchEnd = values.lunchEnd;
    ATT.audit(data, 'Configuración', 'Editar horario', 'Configuración', 'SCHEDULE', `${values.open}-${values.close}`);
    save(); render(); ERP.toast('Horario actualizado');
  });

  document.getElementById('editPolicy').onclick = () => ATT.modal('Privacidad, transparencia y archivo', [
    { name: 'purpose', label: 'Finalidad del tratamiento', type: 'textarea', value: data.policy.purpose, full: true, required: true },
    { name: 'legalBasis', label: 'Base funcional o jurídica', type: 'textarea', value: data.policy.legalBasis, full: true, required: true },
    { name: 'classification', label: 'Clasificación de información', value: data.policy.classification, required: true },
    { name: 'publicationRule', label: 'Regla de publicación', type: 'textarea', value: data.policy.publicationRule, full: true, required: true },
    { name: 'petitionRule', label: 'Regla para PQRSD', type: 'textarea', value: data.policy.petitionRule, full: true, required: true },
    { name: 'retentionRule', label: 'Regla de retención documental', type: 'textarea', value: data.policy.retentionRule, full: true, required: true }
  ], values => {
    data.policy = { ...data.policy, ...values };
    data.settings.informationClass = values.classification;
    data.settings.retentionRule = values.retentionRule;
    ATT.audit(data, 'Configuración', 'Editar política', 'Configuración', 'POLICY', values.classification);
    save(); render(); ERP.toast('Política actualizada');
  });

  document.getElementById('backupData').onclick = () => {
    ATT.audit(data, 'Configuración', 'Descargar respaldo', 'Base local', ATT.GLOBAL_KEY, 'JSON completo');
    save();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = `respaldo-atencion-${ATT.nowDate()}.json`; link.click(); URL.revokeObjectURL(link.href);
  };
  document.getElementById('importData').onclick = () => document.getElementById('importFile').click();
  document.getElementById('importFile').onchange = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported || typeof imported !== 'object' || !Array.isArray(imported.appointments)) throw new Error('El archivo no corresponde a un respaldo válido.');
      localStorage.setItem(ATT.GLOBAL_KEY, JSON.stringify(imported));
      ERP.toast('Respaldo importado. La página se recargará.');
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      ERP.toast(error.message, 'error');
    }
  };
  document.getElementById('exportAudit').onclick = () => ATT.exportProtected(data, 'auditoria-atencion.csv', data.auditLog, 'Configuración');
  document.getElementById('resetData').onclick = () => ATT.confirm('¿Restablecer todos los datos de demostración? Se perderán los cambios locales del módulo.', () => { ATT.reset(); location.reload(); });

  document.addEventListener('click', event => {
    const editService = event.target.closest('[data-edit-service]');
    if (editService) serviceForm(data.services.find(item => item.id === editService.dataset.editService));
    const toggleService = event.target.closest('[data-toggle-service]');
    if (toggleService) { const item = data.services.find(entry => entry.id === toggleService.dataset.toggleService); item.active = item.active === false; ATT.audit(data, 'Configuración', 'Cambiar estado', 'Servicio', item.id, String(item.active)); save(); render(); }
    const deleteService = event.target.closest('[data-delete-service]');
    if (deleteService) { const item = data.services.find(entry => entry.id === deleteService.dataset.deleteService); if (!item) return; const inUse = data.appointments.some(entry => entry.service === item.name) || data.attentions.some(entry => entry.service === item.name); if (inUse) return ERP.toast('No puede eliminarse porque tiene registros asociados. Desactívelo.', 'error'); ATT.confirm(`¿Eliminar ${item.name}?`, () => { data.services = data.services.filter(entry => entry.id !== item.id); save(); render(); }); }

    const editStaff = event.target.closest('[data-edit-staff]');
    if (editStaff) staffForm(data.staff.find(item => item.id === editStaff.dataset.editStaff));
    const toggleStaff = event.target.closest('[data-toggle-staff]');
    if (toggleStaff) { const item = data.staff.find(entry => entry.id === toggleStaff.dataset.toggleStaff); item.active = item.active === false; ATT.audit(data, 'Configuración', 'Cambiar estado', 'Responsable', item.id, String(item.active)); save(); render(); }
    const deleteStaff = event.target.closest('[data-delete-staff]');
    if (deleteStaff) { const item = data.staff.find(entry => entry.id === deleteStaff.dataset.deleteStaff); if (!item) return; const inUse = data.appointments.some(entry => entry.host === item.name) || data.attentions.some(entry => entry.staff === item.name) || data.visitors.some(entry => entry.host === item.name); if (inUse) return ERP.toast('No puede eliminarse porque tiene registros asociados. Desactívelo.', 'error'); ATT.confirm(`¿Eliminar ${item.name}?`, () => { data.staff = data.staff.filter(entry => entry.id !== item.id); save(); render(); }); }

    const toggleRule = event.target.closest('[data-toggle-rule]');
    if (toggleRule) { const item = data.rules.find(entry => entry.id === toggleRule.dataset.toggleRule); item.active = !item.active; ATT.audit(data, 'Configuración', 'Cambiar regla', 'Regla', item.id, String(item.active)); save(); render(); }
    const editRule = event.target.closest('[data-edit-rule]');
    if (editRule) ruleForm(data.rules.find(item => item.id === editRule.dataset.editRule));
    const deleteRule = event.target.closest('[data-delete-rule]');
    if (deleteRule) { const item = data.rules.find(entry => entry.id === deleteRule.dataset.deleteRule); ATT.confirm(`¿Eliminar la regla ${item.name}?`, () => { data.rules = data.rules.filter(entry => entry.id !== item.id); save(); render(); }); }
  });

  render();
});
