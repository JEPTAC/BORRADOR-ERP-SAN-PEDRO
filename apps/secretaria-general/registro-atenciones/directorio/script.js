document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const LEGACY_KEY = 'erp-attention-directory-v17';
  const data = await ATT.load('data.json', LEGACY_KEY);
  const save = () => ATT.save(LEGACY_KEY, data);

  ATT.insertLegalNotice('.page-heading');

  function filtered() {
    const query = contactSearch.value.trim().toLowerCase();
    const type = typeFilter.value;
    return data.contacts.filter(item => {
      const matchesQuery = !query || [item.name, item.document, item.phone, item.email, item.type].some(value => String(value || '').toLowerCase().includes(query));
      return matchesQuery && (!type || item.type === type);
    });
  }

  function render() {
    const rows = filtered();
    const withConsent = data.contacts.filter(item => item.privacyNoticeAccepted !== false && item.consent !== false).length;
    const active = data.contacts.filter(item => item.lastVisit).length;
    const suppliers = data.contacts.filter(item => item.type === 'Proveedor').length;

    metrics.innerHTML = [
      ['contact', data.contacts.length, 'Usuarios registrados', 'Directorio operativo'],
      ['shield-check', withConsent, 'Aviso informado', 'Trazabilidad de privacidad'],
      ['history', active, 'Con historial', 'Citas o atenciones'],
      ['building-2', suppliers, 'Proveedores', 'Contactos institucionales']
    ].map(item => `<div class="att-kpi"><span class="att-kpi-icon"><i data-lucide="${item[0]}"></i></span><div class="att-kpi-copy"><span>${item[2]}</span><strong>${item[1]}</strong><small>${item[3]}</small></div></div>`).join('');

    contactGrid.innerHTML = rows.length ? rows.map(item => {
      const appointments = data.appointments.filter(entry => entry.document === item.document).length;
      const attentions = data.attentions.filter(entry => entry.document === item.document).length;
      return `<article class="att-contact-card"><div class="att-contact-head"><div class="avatar">${ATT.initials(item.name)}</div><div><strong>${ATT.esc(item.name)}</strong><span>${ATT.esc(item.type)}</span></div>${ATT.badge(item.privacyNoticeAccepted !== false ? 'Aviso informado' : 'Revisar')}</div><div class="att-contact-data"><span><i data-lucide="id-card"></i>${ATT.maskDocument(item.document)}</span><span><i data-lucide="phone"></i>${ATT.esc(item.phone || 'Sin teléfono')}</span><span><i data-lucide="mail"></i>${ATT.esc(item.email || 'Sin correo')}</span></div><footer><small>${appointments} citas · ${attentions} atenciones</small><div class="att-action-menu"><button class="icon-btn" data-view="${item.id}" title="Ver historial"><i data-lucide="eye"></i></button><button class="icon-btn" data-edit="${item.id}" title="Editar"><i data-lucide="pencil"></i></button><button class="icon-btn" data-anonymize="${item.id}" title="Anonimizar"><i data-lucide="user-minus"></i></button></div></footer></article>`;
    }).join('') : '<div class="att-empty">No hay contactos para este filtro.</div>';
    ATT.icons();
  }

  function fields(item = {}) {
    return [
      { name: 'name', label: 'Nombre completo', value: item.name || '', required: true },
      { name: 'document', label: 'Documento de identificación', value: item.document || '', required: true },
      { name: 'type', label: 'Tipo de usuario', type: 'select', value: item.type || 'Ciudadano', options: ['Ciudadano', 'Ciudadana', 'Proveedor', 'Entidad', 'Servidor público', 'Contratista'] },
      { name: 'phone', label: 'Teléfono', value: item.phone || '' },
      { name: 'email', label: 'Correo', type: 'email', value: item.email || '' },
      { name: 'preferredChannel', label: 'Canal preferido', type: 'select', value: item.preferredChannel || 'Teléfono', options: ['Teléfono', 'Correo', 'Presencial', 'No informado'] },
      { name: 'notes', label: 'Observaciones operativas', type: 'textarea', value: item.notes || '', full: true, help: 'No registre perfiles, opiniones, diagnósticos ni datos sensibles.' },
      { name: 'privacyNoticeAccepted', label: 'Aviso de privacidad', type: 'checkbox', checkboxLabel: 'La persona fue informada sobre la finalidad y los canales para ejercer sus derechos sobre los datos.', value: item.privacyNoticeAccepted !== false, required: true, full: true }
    ];
  }

  function openForm(item = null) {
    ATT.modal(item ? 'Editar usuario o contacto' : 'Nuevo usuario o contacto', fields(item || {}), values => {
      const duplicate = data.contacts.find(entry => entry.document === values.document && entry.id !== item?.id);
      if (duplicate) throw new Error('Ya existe un contacto con ese documento. Edite el registro existente.');
      const payload = {
        ...values,
        privacyNoticeAccepted: values.privacyNoticeAccepted === 'true',
        consent: values.privacyNoticeAccepted === 'true',
        informationClass: data.settings.informationClass,
        retentionRule: data.settings.retentionRule
      };
      if (item) Object.assign(item, payload, { updatedAt: `${ATT.nowDate()} ${ATT.nowTime()}` });
      else data.contacts.push({ ...payload, id: ATT.uid('USR'), visits: 0, lastVisit: '', createdAt: `${ATT.nowDate()} ${ATT.nowTime()}` });
      const record = item || data.contacts.at(-1);
      ATT.audit(data, 'Directorio', item ? 'Editar contacto' : 'Crear contacto', 'Contacto', record.id, record.type);
      save(); render(); ERP.toast(item ? 'Contacto actualizado' : 'Contacto registrado');
    });
  }

  function detail(item) {
    const appointments = data.appointments.filter(entry => entry.document === item.document).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
    const attentions = data.attentions.filter(entry => entry.document === item.document).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
    ATT.detail(item.name, `<div class="att-grid att-grid-2"><div class="att-card-body"><strong>Documento</strong><p>${ATT.maskDocument(item.document)}</p></div><div class="att-card-body"><strong>Contacto</strong><p>${ATT.esc(item.phone || '—')} · ${ATT.esc(item.email || '—')}</p></div><div class="att-card-body"><strong>Tipo</strong><p>${ATT.esc(item.type)}</p></div><div class="att-card-body"><strong>Clasificación</strong><p>${ATT.esc(item.informationClass || data.settings.informationClass)}</p></div></div><h3>Citas</h3>${appointments.slice(0, 8).map(entry => `<div class="att-item"><span class="att-item-icon"><i data-lucide="calendar"></i></span><div><strong>${ATT.fmtDate(entry.date)} · ${entry.time}</strong><span>${ATT.esc(entry.service)}</span></div>${ATT.badge(entry.status)}</div>`).join('') || '<p>Sin citas.</p>'}<h3>Atenciones</h3>${attentions.slice(0, 8).map(entry => `<div class="att-item"><span class="att-item-icon"><i data-lucide="clipboard"></i></span><div><strong>${ATT.fmtDate(entry.date)} · ${ATT.esc(entry.service)}</strong><span>${ATT.esc(entry.outcome)}</span></div>${ATT.badge(entry.status)}</div>`).join('') || '<p>Sin atenciones.</p>'}`, `<button class="btn btn-primary" data-detail-edit="${item.id}">Editar</button>`);
  }

  newContact.onclick = () => openForm();
  contactSearch.oninput = render;
  typeFilter.onchange = render;
  exportContacts.onclick = () => ATT.exportProtected(data, 'directorio-usuarios-protegido.csv', data.contacts, 'Directorio', [
    { label: 'Nombre', key: 'name' }, { label: 'Documento', key: 'document' }, { label: 'Tipo', key: 'type' },
    { label: 'Teléfono', key: 'phone' }, { label: 'Correo', key: 'email' }, { label: 'Última visita', key: 'lastVisit' },
    { label: 'Aviso informado', key: 'privacyNoticeAccepted' }
  ]);

  document.addEventListener('click', event => {
    const view = event.target.closest('[data-view]');
    if (view) {
      const item = data.contacts.find(entry => entry.id === view.dataset.view);
      if (item) detail(item);
    }
    const edit = event.target.closest('[data-edit],[data-detail-edit]');
    if (edit) {
      ERP.close('attDetailModal');
      const item = data.contacts.find(entry => entry.id === (edit.dataset.edit || edit.dataset.detailEdit));
      if (item) openForm(item);
    }
    const anonymize = event.target.closest('[data-anonymize]');
    if (anonymize) {
      const item = data.contacts.find(entry => entry.id === anonymize.dataset.anonymize);
      if (!item) return;
      ATT.confirm(`¿Anonimizar el contacto de ${item.name}? Esta acción no elimina los registros estadísticos vinculados.`, () => {
        const previous = item.name;
        item.name = `Usuario anonimizado ${item.id.slice(-4)}`;
        item.document = `ANON-${item.id}`;
        item.phone = '';
        item.email = '';
        item.notes = '';
        item.anonymizedAt = `${ATT.nowDate()} ${ATT.nowTime()}`;
        ATT.audit(data, 'Directorio', 'Anonimizar contacto', 'Contacto', item.id, previous);
        save(); render(); ERP.toast('Contacto anonimizado');
      });
    }
  });

  render();
});
