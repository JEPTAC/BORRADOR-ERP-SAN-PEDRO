document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const LEGACY_KEY = 'erp-attention-queue-v17';
  const data = await ATT.load('data.json', LEGACY_KEY);
  const save = () => ATT.save(LEGACY_KEY, data);

  ATT.insertLegalNotice('.page-heading');

  function waitingQueue() {
    return data.queue.filter(item => item.status === 'En espera').sort((a, b) => {
      const priority = value => value === 'Prioritaria' ? 0 : 1;
      return priority(a.priority) - priority(b.priority) || String(a.arrival).localeCompare(String(b.arrival));
    });
  }

  function render() {
    const query = queueSearch.value.trim().toLowerCase();
    const rows = data.queue.filter(item => !query || [item.ticket, item.person, item.service, item.counter, item.status].some(value => String(value || '').toLowerCase().includes(query)));
    const waiting = waitingQueue();
    const activeCounters = data.counters.filter(item => item.status === 'Atendiendo');
    const average = waiting.length ? Math.max(5, Math.round(waiting.reduce((sum, item) => sum + Number(item.waitMinutes || 7), 0) / waiting.length)) : 0;

    metrics.innerHTML = [
      ['ticket', waiting.length, 'En espera', 'Turnos activos'],
      ['clock', `${average} min`, 'Espera estimada', 'Promedio actual'],
      ['headset', activeCounters.length, 'Puestos activos', 'Atendiendo ahora'],
      ['check-circle', data.queue.filter(item => item.status === 'Finalizado').length, 'Finalizados', 'Jornada actual']
    ].map(item => `<div class="att-kpi"><span class="att-kpi-icon"><i data-lucide="${item[0]}"></i></span><div class="att-kpi-copy"><span>${item[2]}</span><strong>${item[1]}</strong><small>${item[3]}</small></div></div>`).join('');

    counterGrid.innerHTML = data.counters.map(counter => `<article class="att-counter"><header><h3>${ATT.esc(counter.name)}</h3>${ATT.badge(counter.status)}</header><div class="ticket">${ATT.esc(counter.current || '—')}</div><p>${ATT.esc(counter.staff)}</p><footer>${counter.current ? `<button class="btn btn-primary btn-sm" data-finish="${counter.id}">Finalizar</button><button class="btn btn-secondary btn-sm" data-transfer="${counter.id}">Devolver</button>` : `<button class="btn btn-secondary btn-sm" data-counter="${counter.id}">Tomar siguiente</button>`}</footer></article>`).join('');

    queueTable.innerHTML = rows.length ? `<div class="att-table-wrap"><table class="att-table"><thead><tr><th>Turno</th><th>Usuario</th><th>Servicio</th><th>Llegada</th><th>Prioridad</th><th>Estado</th><th>Puesto</th><th>Acciones</th></tr></thead><tbody>${rows.map(item => `<tr><td><strong>${ATT.esc(item.ticket)}</strong></td><td>${ATT.esc(item.person)}</td><td>${ATT.esc(item.service)}</td><td>${ATT.esc(item.arrival)}</td><td>${ATT.badge(item.priority)}</td><td>${ATT.badge(item.status)}</td><td>${ATT.esc(item.counter || '—')}</td><td><div class="att-action-menu"><button class="icon-btn" data-view="${item.id}" title="Detalle"><i data-lucide="eye"></i></button>${item.status === 'En espera' ? `<button class="icon-btn" data-priority="${item.id}" title="Cambiar prioridad"><i data-lucide="arrow-up"></i></button><button class="icon-btn" data-cancel="${item.id}" title="Cancelar turno"><i data-lucide="x"></i></button>` : ''}${item.status === 'Llamado' || item.status === 'En atención' ? `<button class="icon-btn" data-noshow="${item.id}" title="Marcar ausente"><i data-lucide="user-x"></i></button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : '<div class="att-empty">No hay turnos para este filtro.</div>';

    callBoard.innerHTML = data.queue.filter(item => ['Llamado', 'En atención'].includes(item.status)).slice(-5).reverse().map(item => `<div class="att-item"><span class="att-item-icon"><i data-lucide="volume-2"></i></span><div><strong>${ATT.esc(item.ticket)} · ${ATT.esc(item.person)}</strong><span>${ATT.esc(item.counter || 'Puesto pendiente')}</span></div>${ATT.badge(item.status)}</div>`).join('') || '<div class="att-empty">Sin llamados activos.</div>';
    ATT.icons();
  }

  function take(counterId = '') {
    let counter = counterId ? data.counters.find(item => item.id === counterId) : data.counters.find(item => !item.current && item.status !== 'Inactivo');
    if (!counter) return ERP.toast('No hay puestos disponibles', 'error');
    if (counter.current) return ERP.toast('El puesto ya está atendiendo un turno', 'error');
    const next = waitingQueue()[0];
    if (!next) return ERP.toast('No hay turnos en espera', 'error');

    next.status = 'En atención';
    next.counter = counter.name;
    next.calledAt = ATT.nowTime();
    next.waitMinutes = Math.max(0, ATT.minutes(next.calledAt) - ATT.minutes(next.arrival));
    counter.current = next.ticket;
    counter.status = 'Atendiendo';
    ATT.audit(data, 'Turnos', 'Llamar turno', 'Turno', next.id, `${next.ticket} → ${counter.name}`);
    save(); render(); ERP.toast(`Turno ${next.ticket} asignado a ${counter.name}`);
  }

  function newTicketForm() {
    ATT.modal('Generar turno', [
      { name: 'person', label: 'Nombre completo o identificador', required: true },
      { name: 'service', label: 'Servicio', type: 'select', options: data.services.filter(item => item.active !== false).map(item => item.name) },
      { name: 'priority', label: 'Prioridad', type: 'select', options: ['Normal', 'Prioritaria'] },
      { name: 'priorityReason', label: 'Motivo de prioridad', placeholder: 'Persona mayor, discapacidad, embarazo u otra condición aplicable' },
      { name: 'privacyNoticeAccepted', label: 'Aviso de privacidad', type: 'checkbox', checkboxLabel: 'Se informó que los datos se usarán únicamente para organizar y documentar la atención.', value: true, required: true, full: true }
    ], values => {
      const ticket = {
        ...values,
        id: ATT.uid('T'),
        ticket: `A${String(data.queue.length + 24).padStart(3, '0')}`,
        arrival: ATT.nowTime(),
        status: 'En espera',
        counter: '',
        waitMinutes: 0,
        privacyNoticeAccepted: values.privacyNoticeAccepted === 'true',
        informationClass: data.settings.informationClass
      };
      data.queue.push(ticket);
      ATT.audit(data, 'Turnos', 'Crear turno', 'Turno', ticket.id, ticket.ticket);
      save(); render(); ERP.toast(`Turno ${ticket.ticket} generado`);
    });
  }

  newTicket.onclick = newTicketForm;
  callNext.onclick = () => take();
  queueSearch.oninput = render;
  exportQueue.onclick = () => ATT.exportPublic('reporte-turnos-anonimizado.csv', data.queue, [
    { label: 'Turno', key: 'ticket' }, { label: 'Servicio', key: 'service' }, { label: 'Llegada', key: 'arrival' },
    { label: 'Prioridad', key: 'priority' }, { label: 'Estado', key: 'status' }, { label: 'Puesto', key: 'counter' },
    { label: 'Espera minutos', key: 'waitMinutes' }
  ]);

  document.addEventListener('click', event => {
    const counterButton = event.target.closest('[data-counter]');
    if (counterButton) take(counterButton.dataset.counter);

    const finish = event.target.closest('[data-finish]');
    if (finish) {
      const counter = data.counters.find(item => item.id === finish.dataset.finish);
      if (!counter) return;
      const ticket = data.queue.find(item => item.ticket === counter.current);
      if (ticket) {
        ticket.status = 'Finalizado';
        ticket.finishedAt = ATT.nowTime();
        ticket.serviceMinutes = Math.max(0, ATT.minutes(ticket.finishedAt) - ATT.minutes(ticket.calledAt || ticket.arrival));
        ATT.audit(data, 'Turnos', 'Finalizar turno', 'Turno', ticket.id, counter.name);
      }
      counter.current = '';
      counter.status = 'Disponible';
      save(); render(); ERP.toast('Atención finalizada');
    }

    const transfer = event.target.closest('[data-transfer]');
    if (transfer) {
      const counter = data.counters.find(item => item.id === transfer.dataset.transfer);
      if (!counter) return;
      const ticket = data.queue.find(item => item.ticket === counter.current);
      if (ticket) {
        ticket.status = 'En espera';
        ticket.counter = '';
        ticket.calledAt = '';
        ATT.audit(data, 'Turnos', 'Devolver a sala', 'Turno', ticket.id, counter.name);
      }
      counter.current = '';
      counter.status = 'Disponible';
      save(); render(); ERP.toast('Turno devuelto a la sala');
    }

    const priority = event.target.closest('[data-priority]');
    if (priority) {
      const ticket = data.queue.find(item => item.id === priority.dataset.priority);
      if (!ticket) return;
      ticket.priority = ticket.priority === 'Prioritaria' ? 'Normal' : 'Prioritaria';
      ATT.audit(data, 'Turnos', 'Cambiar prioridad', 'Turno', ticket.id, ticket.priority);
      save(); render(); ERP.toast(`Prioridad: ${ticket.priority}`);
    }

    const cancel = event.target.closest('[data-cancel]');
    if (cancel) {
      const ticket = data.queue.find(item => item.id === cancel.dataset.cancel);
      if (!ticket) return;
      ATT.confirm(`¿Cancelar el turno ${ticket.ticket}?`, () => {
        ticket.status = 'Cancelado';
        ATT.audit(data, 'Turnos', 'Cancelar turno', 'Turno', ticket.id, ticket.ticket);
        save(); render(); ERP.toast('Turno cancelado');
      });
    }

    const noShow = event.target.closest('[data-noshow]');
    if (noShow) {
      const ticket = data.queue.find(item => item.id === noShow.dataset.noshow);
      if (!ticket) return;
      ticket.status = 'Ausente';
      const counter = data.counters.find(item => item.current === ticket.ticket);
      if (counter) { counter.current = ''; counter.status = 'Disponible'; }
      ATT.audit(data, 'Turnos', 'Marcar ausente', 'Turno', ticket.id, ticket.ticket);
      save(); render(); ERP.toast('Turno marcado como ausente');
    }

    const view = event.target.closest('[data-view]');
    if (view) {
      const ticket = data.queue.find(item => item.id === view.dataset.view);
      if (ticket) ATT.detail(ticket.ticket, `<div class="att-grid att-grid-2"><div><strong>Servicio</strong><p>${ATT.esc(ticket.service)}</p></div><div><strong>Estado</strong><p>${ATT.esc(ticket.status)}</p></div><div><strong>Llegada</strong><p>${ATT.esc(ticket.arrival)}</p></div><div><strong>Llamado</strong><p>${ATT.esc(ticket.calledAt || 'Pendiente')}</p></div><div><strong>Prioridad</strong><p>${ATT.esc(ticket.priority)}</p></div><div><strong>Puesto</strong><p>${ATT.esc(ticket.counter || 'Sin asignar')}</p></div></div>`);
    }
  });

  render();
});
