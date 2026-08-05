document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const LEGACY_KEY = 'erp-attention-records-v17';
  const data = await ATT.load('data.json', LEGACY_KEY);
  const save = () => ATT.save(LEGACY_KEY, data);

  ATT.insertLegalNotice('.page-heading');
  if (!document.getElementById('exportProtectedAttentions')) {
    exportAttentions.insertAdjacentHTML('afterend', '<button class="btn btn-secondary btn-sm" id="exportProtectedAttentions"><i data-lucide="lock-keyhole"></i> Exportación protegida</button>');
  }

  function filtered() {
    const query = attentionSearch.value.trim().toLowerCase();
    const channel = channelFilter.value;
    const status = statusFilter.value;
    return data.attentions.filter(item => {
      const matchesQuery = !query || [item.person, item.document, item.service, item.outcome, item.staff, item.radicado, item.requestType].some(value => String(value || '').toLowerCase().includes(query));
      return matchesQuery && (!channel || item.channel === channel) && (!status || item.status === status);
    }).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }

  function render() {
    const rows = filtered();
    const petitions = data.attentions.filter(item => item.petition || !['Orientación simple', 'No aplica', undefined, ''].includes(item.requestType));
    const overdue = petitions.filter(item => item.due && item.due < (data.settings.currentDate || ATT.nowDate()) && !['Finalizada', 'Cerrada'].includes(item.status));
    const rated = data.attentions.filter(item => Number(item.rating));
    const average = rated.length ? (rated.reduce((sum, item) => sum + Number(item.rating), 0) / rated.length).toFixed(1) : '—';

    metrics.innerHTML = [
      ['clipboard-list', data.attentions.length, 'Atenciones', 'Registros acumulados'],
      ['file-text', petitions.length, 'PQRSD identificadas', 'Requieren radicación'],
      ['alarm-clock', overdue.length, 'Plazos vencidos', 'Seguimientos críticos'],
      ['star', average, 'Satisfacción', 'Promedio registrado']
    ].map(item => `<div class="att-kpi"><span class="att-kpi-icon"><i data-lucide="${item[0]}"></i></span><div class="att-kpi-copy"><span>${item[2]}</span><strong>${item[1]}</strong><small>${item[3]}</small></div></div>`).join('');

    attentionTable.innerHTML = rows.length ? `<div class="att-table-wrap"><table class="att-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Canal / servicio</th><th>Clasificación</th><th>Resultado</th><th>Radicado / plazo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(item => `<tr>
      <td><strong>${ATT.fmtDate(item.date)}</strong><small>${ATT.esc(item.time)}</small></td>
      <td><strong>${ATT.esc(item.person)}</strong><small>${ATT.maskDocument(item.document)}</small></td>
      <td>${ATT.esc(item.channel)}<small>${ATT.esc(item.service)}</small></td>
      <td>${ATT.esc(item.requestType || 'Orientación simple')}<small>${ATT.esc(item.staff)}</small></td>
      <td><strong>${ATT.esc(item.outcome)}</strong><small>${ATT.esc(item.commitment || 'Sin compromiso')}</small></td>
      <td>${ATT.esc(item.radicado || 'Sin radicar')}<small>${item.due ? `Plazo: ${ATT.fmtDate(item.due)}` : 'Sin término legal'}</small></td>
      <td>${ATT.badge(item.status)}</td>
      <td><div class="att-action-menu"><button class="icon-btn" data-view="${item.id}" title="Ver"><i data-lucide="eye"></i></button><button class="icon-btn" data-edit="${item.id}" title="Editar"><i data-lucide="pencil"></i></button>${(item.petition || !['Orientación simple', 'No aplica', undefined, ''].includes(item.requestType)) && !item.radicado ? `<button class="icon-btn" data-radicate="${item.id}" title="Registrar radicado"><i data-lucide="stamp"></i></button>` : ''}${!['Finalizada', 'Cerrada'].includes(item.status) ? `<button class="icon-btn" data-close-attention="${item.id}" title="Cerrar"><i data-lucide="check-circle"></i></button>` : ''}<button class="icon-btn" data-rate="${item.id}" title="Calificar"><i data-lucide="star"></i></button></div></td>
    </tr>`).join('')}</tbody></table></div>` : '<div class="att-empty">No hay atenciones para este filtro.</div>';
    ATT.icons();
  }

  function fields(item = {}) {
    return [
      { name: 'person', label: 'Nombre completo', value: item.person || '', required: true },
      { name: 'document', label: 'Documento', value: item.document || '', required: true },
      { name: 'channel', label: 'Canal', type: 'select', value: item.channel || 'Presencial', options: ['Presencial', 'Telefónica', 'Virtual', 'Correo'] },
      { name: 'service', label: 'Servicio', type: 'select', value: item.service || '', options: data.services.filter(entry => entry.active !== false).map(entry => entry.name) },
      { name: 'staff', label: 'Funcionario responsable', type: 'select', value: item.staff || '', options: data.staff.filter(entry => entry.active !== false).map(entry => entry.name) },
      { name: 'requestType', label: 'Clasificación de la solicitud', type: 'select', value: item.requestType || 'Orientación simple', options: ['Orientación simple', 'Petición general', 'Solicitud de información o documentos', 'Consulta', 'Queja o reclamo', 'Denuncia', 'No aplica'] },
      { name: 'outcome', label: 'Resultado de la atención', type: 'textarea', value: item.outcome || '', full: true, required: true },
      { name: 'commitment', label: 'Compromiso o siguiente paso', type: 'textarea', value: item.commitment || '', full: true },
      { name: 'radicado', label: 'Número de radicado oficial', value: item.radicado || '', placeholder: 'Registre el número asignado por Ventanilla Única' },
      { name: 'assignedOffice', label: 'Dependencia competente', value: item.assignedOffice || 'Secretaría General' },
      { name: 'status', label: 'Estado', type: 'select', value: item.status || 'Finalizada', options: ['Finalizada', 'Seguimiento', 'Pendiente', 'Pendiente de radicación', 'Radicada', 'Trasladada', 'Cerrada'] },
      { name: 'privacyNoticeAccepted', label: 'Aviso de privacidad', type: 'checkbox', checkboxLabel: 'Se informó la finalidad del tratamiento y el canal oficial aplicable.', value: item.privacyNoticeAccepted !== false, required: true, full: true }
    ];
  }

  function openForm(item = null) {
    ATT.modal(item ? 'Editar atención' : 'Registrar atención', fields(item || {}), values => {
      const petition = !['Orientación simple', 'No aplica'].includes(values.requestType);
      const date = item?.date || data.settings.currentDate || ATT.nowDate();
      const due = petition ? ATT.petitionDeadline(values.requestType, date) : '';
      if (petition && !values.radicado && ['Finalizada', 'Cerrada'].includes(values.status)) {
        throw new Error('Una PQRSD no puede cerrarse sin número de radicado oficial.');
      }
      if (petition && !values.radicado) values.status = 'Pendiente de radicación';
      const payload = {
        ...values,
        petition,
        due,
        privacyNoticeAccepted: values.privacyNoticeAccepted === 'true',
        informationClass: data.settings.informationClass,
        retentionRule: data.settings.retentionRule
      };
      if (item) Object.assign(item, payload, { updatedAt: `${ATT.nowDate()} ${ATT.nowTime()}` });
      else data.attentions.push({ ...payload, id: ATT.uid('ATE'), date, time: ATT.nowTime(), rating: '', createdAt: `${ATT.nowDate()} ${ATT.nowTime()}` });
      const record = item || data.attentions.at(-1);
      ATT.upsertContact(data, values);
      ATT.audit(data, 'Atenciones', item ? 'Editar atención' : 'Crear atención', 'Atención', record.id, values.requestType);
      save(); render();
      ERP.toast(petition && !values.radicado ? 'Registro guardado. Debe radicarse en Ventanilla Única.' : 'Atención guardada', petition && !values.radicado ? 'error' : 'success');
    });
  }

  function showDetail(item) {
    ATT.detail(item.id, `<div class="att-grid att-grid-2"><div><strong>Usuario</strong><p>${ATT.esc(item.person)} · ${ATT.maskDocument(item.document)}</p></div><div><strong>Atención</strong><p>${ATT.fmtDate(item.date)} · ${item.time} · ${ATT.esc(item.channel)}</p></div><div><strong>Clasificación</strong><p>${ATT.esc(item.requestType || 'Orientación simple')}</p></div><div><strong>Responsable</strong><p>${ATT.esc(item.staff)}</p></div><div><strong>Resultado</strong><p>${ATT.esc(item.outcome)}</p></div><div><strong>Compromiso</strong><p>${ATT.esc(item.commitment || 'Sin compromiso')}</p></div><div><strong>Radicado</strong><p>${ATT.esc(item.radicado || 'Pendiente')}</p></div><div><strong>Plazo</strong><p>${item.due ? ATT.fmtDate(item.due) : 'No aplica'}</p></div></div><div class="att-audit-mini"><i data-lucide="shield-check"></i> ${ATT.esc(item.informationClass || data.settings.informationClass)} · ${ATT.esc(item.retentionRule || data.settings.retentionRule)}</div>`, `<button class="btn btn-primary" data-detail-edit="${item.id}">Editar</button>`);
  }

  newAttention.onclick = () => openForm();
  attentionSearch.oninput = render;
  channelFilter.onchange = render;
  statusFilter.onchange = render;

  exportAttentions.onclick = () => ATT.exportPublic('reporte-publico-atenciones-anonimizado.csv', data.attentions, [
    { label: 'Fecha', key: 'date' }, { label: 'Canal', key: 'channel' }, { label: 'Servicio', key: 'service' },
    { label: 'Clasificación', key: 'requestType' }, { label: 'Dependencia', key: 'assignedOffice' }, { label: 'Estado', key: 'status' },
    { label: 'Plazo', key: 'due' }, { label: 'Calificación', key: 'rating' }
  ]);

  document.getElementById('exportProtectedAttentions').onclick = () => ATT.exportProtected(data, 'registro-atenciones-protegido.csv', data.attentions, 'Atenciones');

  document.addEventListener('click', event => {
    const view = event.target.closest('[data-view]');
    if (view) {
      const item = data.attentions.find(entry => entry.id === view.dataset.view);
      if (item) showDetail(item);
    }
    const edit = event.target.closest('[data-edit],[data-detail-edit]');
    if (edit) {
      ERP.close('attDetailModal');
      const item = data.attentions.find(entry => entry.id === (edit.dataset.edit || edit.dataset.detailEdit));
      if (item) openForm(item);
    }
    const radicate = event.target.closest('[data-radicate]');
    if (radicate) {
      const item = data.attentions.find(entry => entry.id === radicate.dataset.radicate);
      if (!item) return;
      ATT.modal('Registrar radicado oficial', [
        { name: 'radicado', label: 'Número de radicado', required: true },
        { name: 'assignedOffice', label: 'Dependencia competente', value: item.assignedOffice || 'Ventanilla Única', required: true },
        { name: 'transferDate', label: 'Fecha de radicación o traslado', type: 'date', value: data.settings.currentDate || ATT.nowDate(), required: true }
      ], values => {
        item.radicado = values.radicado;
        item.assignedOffice = values.assignedOffice;
        item.transferDate = values.transferDate;
        item.status = 'Radicada';
        ATT.audit(data, 'Atenciones', 'Registrar radicado', 'Atención', item.id, values.radicado);
        save(); render(); ERP.toast('Radicado registrado');
      });
    }
    const closeButton = event.target.closest('[data-close-attention]');
    if (closeButton) {
      const item = data.attentions.find(entry => entry.id === closeButton.dataset.closeAttention);
      if (!item) return;
      if (item.petition && !item.radicado) return ERP.toast('Debe registrar el radicado oficial antes de cerrar', 'error');
      item.status = 'Finalizada';
      item.closedAt = `${ATT.nowDate()} ${ATT.nowTime()}`;
      ATT.audit(data, 'Atenciones', 'Cerrar atención', 'Atención', item.id, item.radicado || item.service);
      save(); render(); ERP.toast('Atención cerrada');
    }
    const rate = event.target.closest('[data-rate]');
    if (rate) {
      const item = data.attentions.find(entry => entry.id === rate.dataset.rate);
      if (!item) return;
      ATT.modal('Registrar satisfacción', [
        { name: 'rating', label: 'Calificación', type: 'select', value: item.rating || '5', options: ['1', '2', '3', '4', '5'] },
        { name: 'ratingComment', label: 'Comentario opcional', type: 'textarea', value: item.ratingComment || '', full: true }
      ], values => {
        item.rating = Number(values.rating);
        item.ratingComment = values.ratingComment;
        ATT.audit(data, 'Atenciones', 'Registrar satisfacción', 'Atención', item.id, values.rating);
        save(); render(); ERP.toast('Calificación registrada');
      });
    }
  });

  render();
});
