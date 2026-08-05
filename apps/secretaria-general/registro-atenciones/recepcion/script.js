document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const LEGACY_KEY = 'erp-attention-reception-v17';
  const data = await ATT.load('data.json', LEGACY_KEY);
  let filter = 'all';
  const save = () => ATT.save(LEGACY_KEY, data);

  ATT.insertLegalNotice('.page-heading');

  function metrics() {
    const onsite = data.visitors.filter(item => item.status === 'En sede');
    const expected = data.visitors.filter(item => item.status === 'Esperada');
    const completed = data.visitors.filter(item => item.status === 'Finalizada');
    const averageStay = completed.filter(item => item.checkin && item.checkout).length
      ? Math.round(completed.filter(item => item.checkin && item.checkout).reduce((sum, item) => sum + Math.max(0, ATT.minutes(item.checkout) - ATT.minutes(item.checkin)), 0) / completed.filter(item => item.checkin && item.checkout).length)
      : 0;
    document.getElementById('metrics').innerHTML = [
      ['users', onsite.length, 'En sede', 'Permanencia activa'],
      ['calendar-clock', expected.length, 'Esperados', 'Pre-registros'],
      ['log-out', completed.length, 'Salidas', 'Registro acumulado'],
      ['timer', `${averageStay} min`, 'Permanencia media', 'Visitas finalizadas']
    ].map(item => `<div class="att-kpi"><span class="att-kpi-icon"><i data-lucide="${item[0]}"></i></span><div class="att-kpi-copy"><span>${item[2]}</span><strong>${item[1]}</strong><small>${item[3]}</small></div></div>`).join('');
  }

  function rows() {
    const query = visitorSearch.value.trim().toLowerCase();
    return data.visitors.filter(item => {
      const matchesQuery = !query || [item.name, item.document, item.company, item.host, item.purpose, item.badge].some(value => String(value || '').toLowerCase().includes(query));
      const matchesFilter = filter === 'all' || (filter === 'onsite' && item.status === 'En sede') || (filter === 'expected' && item.status === 'Esperada');
      return matchesQuery && matchesFilter;
    }).sort((a, b) => `${a.status} ${a.expected || ''}`.localeCompare(`${b.status} ${b.expected || ''}`));
  }

  function table() {
    const items = rows();
    visitorTable.innerHTML = items.length ? `<div class="att-table-wrap"><table class="att-table"><thead><tr><th>Visitante</th><th>Entidad</th><th>Anfitrión</th><th>Motivo</th><th>Ingreso</th><th>Salida</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${items.map(item => `<tr>
      <td><strong>${ATT.esc(item.name)}</strong><small>${ATT.maskDocument(item.document)} · ${ATT.esc(item.badge || 'Sin credencial')}</small></td>
      <td>${ATT.esc(item.company || 'Particular')}</td><td>${ATT.esc(item.host)}</td><td>${ATT.esc(item.purpose)}</td>
      <td>${ATT.esc(item.checkin || item.expected || '—')}</td><td>${ATT.esc(item.checkout || '—')}</td><td>${ATT.badge(item.status)}</td>
      <td><div class="att-action-menu">
        <button class="icon-btn" data-view="${item.id}" title="Detalle"><i data-lucide="eye"></i></button>
        ${item.status === 'Esperada' ? `<button class="icon-btn" data-checkin="${item.id}" title="Registrar ingreso"><i data-lucide="log-in"></i></button>` : ''}
        ${item.status === 'En sede' ? `<button class="icon-btn" data-notify="${item.id}" title="Avisar al anfitrión"><i data-lucide="bell-ring"></i></button><button class="icon-btn" data-checkout="${item.id}" title="Registrar salida"><i data-lucide="log-out"></i></button>` : ''}
        <button class="icon-btn" data-edit="${item.id}" title="Editar"><i data-lucide="pencil"></i></button>
      </div></td></tr>`).join('')}</tbody></table></div>` : '<div class="att-empty">No hay visitantes para este filtro.</div>';
  }

  function expectedListRender() {
    const expected = data.visitors.filter(item => item.status === 'Esperada').sort((a, b) => String(a.expected).localeCompare(String(b.expected)));
    expectedList.innerHTML = expected.length ? expected.map(item => `<div class="att-item"><span class="att-item-icon"><i data-lucide="calendar-clock"></i></span><div><strong>${ATT.esc(item.expected)} · ${ATT.esc(item.name)}</strong><span>${ATT.esc(item.host)} · ${ATT.esc(item.purpose)}</span></div><button class="btn btn-secondary btn-sm" data-checkin="${item.id}">Ingreso</button></div>`).join('') : '<div class="att-empty">Sin visitantes esperados.</div>';
  }

  function render() {
    metrics(); table(); expectedListRender(); ATT.icons();
  }

  function fields(item = {}) {
    return [
      { name: 'name', label: 'Nombre completo', value: item.name || '', required: true },
      { name: 'document', label: 'Documento de identificación', value: item.document || '', required: true },
      { name: 'company', label: 'Entidad o procedencia', value: item.company || 'Particular' },
      { name: 'host', label: 'Funcionario anfitrión', type: 'select', value: item.host || '', options: data.staff.filter(entry => entry.active !== false).map(entry => entry.name) },
      { name: 'purpose', label: 'Motivo general de la visita', value: item.purpose || '', required: true, help: 'Evite registrar detalles sensibles o innecesarios.' },
      { name: 'expected', label: 'Hora esperada', type: 'time', value: item.expected || ATT.nowTime(), required: true },
      { name: 'phone', label: 'Teléfono', value: item.phone || '' },
      { name: 'status', label: 'Estado', type: 'select', value: item.status || 'En sede', options: ['Esperada', 'En sede', 'Finalizada', 'Cancelada'] },
      { name: 'privacyNoticeAccepted', label: 'Aviso de privacidad', type: 'checkbox', checkboxLabel: 'Se informó la finalidad del registro de ingreso, seguridad y atención.', value: item.privacyNoticeAccepted !== false, required: true, full: true }
    ];
  }

  function openForm(item = null) {
    ATT.modal(item ? 'Editar visitante' : 'Registrar ingreso o pre-registro', fields(item || {}), values => {
      const privacy = values.privacyNoticeAccepted === 'true';
      const payload = {
        ...values,
        privacyNoticeAccepted: privacy,
        consent: privacy,
        informationClass: data.settings.informationClass,
        retentionRule: data.settings.retentionRule
      };
      if (item) {
        Object.assign(item, payload, { updatedAt: `${ATT.nowDate()} ${ATT.nowTime()}` });
        if (item.status === 'En sede' && !item.checkin) item.checkin = ATT.nowTime();
      } else {
        const status = values.status || 'En sede';
        const visitor = {
          ...payload,
          id: ATT.uid('VIS'),
          date: data.settings.currentDate || ATT.nowDate(),
          createdAt: `${ATT.nowDate()} ${ATT.nowTime()}`,
          checkin: status === 'En sede' ? ATT.nowTime() : '',
          checkout: status === 'Finalizada' ? ATT.nowTime() : '',
          badge: `V-${String(data.visitors.length + 84).padStart(3, '0')}`
        };
        data.visitors.push(visitor);
        item = visitor;
      }
      const contact = ATT.upsertContact(data, values);
      if (contact && item.status === 'En sede') {
        contact.visits = Number(contact.visits || 0) + 1;
        contact.lastVisit = data.settings.currentDate || ATT.nowDate();
      }
      ATT.audit(data, 'Recepción', item.updatedAt ? 'Editar visitante' : 'Registrar visitante', 'Visitante', item.id, item.status);
      save(); render(); ERP.toast('Registro guardado');
    });
  }

  newVisitor.onclick = () => openForm();
  visitorSearch.oninput = render;
  visitorTabs.onclick = event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    filter = button.dataset.filter;
    visitorTabs.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === button));
    render();
  };

  exportVisitors.onclick = () => ATT.exportProtected(data, 'libro-control-ingresos.csv', data.visitors, 'Recepción', [
    { label: 'Nombre', key: 'name' }, { label: 'Documento', key: 'document' }, { label: 'Entidad', key: 'company' },
    { label: 'Anfitrión', key: 'host' }, { label: 'Motivo general', key: 'purpose' }, { label: 'Ingreso', key: 'checkin' },
    { label: 'Salida', key: 'checkout' }, { label: 'Estado', key: 'status' }, { label: 'Credencial', key: 'badge' }
  ]);

  document.addEventListener('click', event => {
    const view = event.target.closest('[data-view]');
    if (view) {
      const item = data.visitors.find(entry => entry.id === view.dataset.view);
      if (item) ATT.detail(item.name, `<div class="att-grid att-grid-2"><div><strong>Documento</strong><p>${ATT.maskDocument(item.document)}</p></div><div><strong>Credencial</strong><p>${ATT.esc(item.badge || '—')}</p></div><div><strong>Anfitrión</strong><p>${ATT.esc(item.host)}</p></div><div><strong>Motivo</strong><p>${ATT.esc(item.purpose)}</p></div><div><strong>Ingreso</strong><p>${ATT.esc(item.checkin || 'Pendiente')}</p></div><div><strong>Salida</strong><p>${ATT.esc(item.checkout || 'Pendiente')}</p></div></div><div class="att-audit-mini"><i data-lucide="shield-check"></i> ${ATT.esc(item.informationClass || data.settings.informationClass)}</div>`);
    }

    const edit = event.target.closest('[data-edit]');
    if (edit) {
      const item = data.visitors.find(entry => entry.id === edit.dataset.edit);
      if (item) openForm(item);
    }

    const checkin = event.target.closest('[data-checkin]');
    if (checkin) {
      const item = data.visitors.find(entry => entry.id === checkin.dataset.checkin);
      if (!item) return;
      item.status = 'En sede'; item.checkin = ATT.nowTime();
      ATT.notify(data, { title: 'Visitante en recepción', message: `${item.name} llegó para ${item.purpose}`, channel: 'Notificación interna', recipient: item.host, status: 'Pendiente', relatedType: 'Visitante', relatedId: item.id });
      ATT.audit(data, 'Recepción', 'Registrar ingreso', 'Visitante', item.id, item.host);
      save(); render(); ERP.toast('Ingreso registrado');
    }

    const checkout = event.target.closest('[data-checkout]');
    if (checkout) {
      const item = data.visitors.find(entry => entry.id === checkout.dataset.checkout);
      if (!item) return;
      item.status = 'Finalizada'; item.checkout = ATT.nowTime();
      ATT.audit(data, 'Recepción', 'Registrar salida', 'Visitante', item.id, item.name);
      save(); render(); ERP.toast('Salida registrada');
    }

    const notify = event.target.closest('[data-notify]');
    if (notify) {
      const item = data.visitors.find(entry => entry.id === notify.dataset.notify);
      if (!item) return;
      item.hostNotifiedAt = `${ATT.nowDate()} ${ATT.nowTime()}`;
      ATT.notify(data, { title: 'Visitante en recepción', message: `${item.name} espera para ${item.purpose}`, channel: 'Notificación interna', recipient: item.host, status: 'Pendiente', relatedType: 'Visitante', relatedId: item.id });
      ATT.audit(data, 'Recepción', 'Avisar anfitrión', 'Visitante', item.id, item.host);
      save(); ERP.toast(`Aviso registrado para ${item.host}`);
    }
  });

  render();
});
