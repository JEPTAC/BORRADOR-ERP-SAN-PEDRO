document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const LEGACY_KEY = 'erp-attention-reports-v17';
  const data = await ATT.load('data.json', LEGACY_KEY);
  const save = () => ATT.save(LEGACY_KEY, data);

  ATT.insertLegalNotice('.page-heading');

  const headingActions = document.querySelector('.heading-actions');
  if (headingActions && !document.getElementById('reportFrom')) {
    headingActions.insertAdjacentHTML('afterbegin', `<input id="reportFrom" class="input" type="date" aria-label="Fecha inicial"><input id="reportTo" class="input" type="date" aria-label="Fecha final"><button class="btn btn-secondary" id="refreshReport"><i data-lucide="refresh-cw"></i> Actualizar</button>`);
    exportReport.insertAdjacentHTML('afterend', '<button class="btn btn-secondary" id="exportProtectedReport"><i data-lucide="lock-keyhole"></i> Base protegida</button>');
  }

  const from = document.getElementById('reportFrom');
  const to = document.getElementById('reportTo');
  from.value = data.reportFilters?.from || '';
  to.value = data.reportFilters?.to || '';

  function dateInRange(date) {
    return (!from.value || date >= from.value) && (!to.value || date <= to.value);
  }

  function count(array, key) {
    return array.reduce((result, item) => {
      const value = item[key] || 'Sin clasificar';
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }

  function bars(element, object) {
    const values = Object.values(object);
    const max = Math.max(...values, 1);
    element.innerHTML = Object.entries(object).length ? Object.entries(object).map(([key, value]) => `<div class="att-bar-wrap"><div class="att-bar" style="--h:${Math.max(12, Math.round(value / max * 160))}px" title="${value}"></div><div class="att-bar-label">${ATT.esc(key)}</div></div>`).join('') : '<div class="att-empty">Sin datos para el periodo.</div>';
  }

  function render() {
    const appointments = data.appointments.filter(item => dateInRange(item.date));
    const attentions = data.attentions.filter(item => dateInRange(item.date));
    const visitors = data.visitors.filter(item => !item.date || dateInRange(item.date || data.settings.currentDate));
    const queue = data.queue;
    const service = count([...appointments, ...attentions], 'service');
    const channel = count(attentions, 'channel');
    const noShows = appointments.filter(item => item.status === 'Ausente').length;
    const ratings = attentions.filter(item => Number(item.rating));
    const average = ratings.length ? (ratings.reduce((sum, item) => sum + Number(item.rating), 0) / ratings.length).toFixed(1) : '—';
    const petitions = attentions.filter(item => item.petition || !['Orientación simple', 'No aplica', undefined, ''].includes(item.requestType));
    const overdue = petitions.filter(item => item.due && item.due < (data.settings.currentDate || ATT.nowDate()) && !['Finalizada', 'Cerrada'].includes(item.status));

    bars(serviceChart, service);
    bars(channelChart, channel);

    metrics.innerHTML = [
      ['calendar', appointments.length, 'Citas', 'Periodo consultado'],
      ['users', visitors.length, 'Visitantes', 'Ingresos registrados'],
      ['clipboard-list', attentions.length, 'Atenciones', 'Con trazabilidad'],
      ['star', average, 'Satisfacción', 'Escala de 1 a 5']
    ].map(item => `<div class="att-kpi"><span class="att-kpi-icon"><i data-lucide="${item[0]}"></i></span><div class="att-kpi-copy"><span>${item[2]}</span><strong>${item[1]}</strong><small>${item[3]}</small></div></div>`).join('');

    const waitValues = queue.filter(item => Number(item.waitMinutes) >= 0).map(item => Number(item.waitMinutes || 0));
    const avgWait = waitValues.length ? Math.round(waitValues.reduce((sum, value) => sum + value, 0) / waitValues.length) : 0;
    experienceStats.innerHTML = [
      ['Asistencia a citas', `${Math.round((appointments.length - noShows) / Math.max(appointments.length, 1) * 100)}%`],
      ['Tiempo medio de espera', `${avgWait} min`],
      ['PQRSD identificadas', petitions.length],
      ['Plazos vencidos', overdue.length]
    ].map(item => `<div class="att-stat-row"><div><strong>${item[0]}</strong><div class="att-progress"><span style="width:${typeof item[1] === 'string' && item[1].includes('%') ? item[1] : '62%'}"></span></div></div><span>${item[1]}</span></div>`).join('');

    summaryList.innerHTML = [
      ['Demanda principal', Object.entries(service).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'],
      ['Canal predominante', Object.entries(channel).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'],
      ['Citas confirmadas', appointments.filter(item => item.status === 'Confirmada').length],
      ['Compromisos abiertos', attentions.filter(item => item.commitment && !['Finalizada', 'Cerrada'].includes(item.status)).length],
      ['Registros con datos personales', appointments.length + visitors.length + attentions.length],
      ['Exportación pública', 'Siempre anonimizada']
    ].map(item => `<div class="att-item"><span class="att-item-icon"><i data-lucide="chart-no-axes-combined"></i></span><div><strong>${ATT.esc(item[0])}</strong><span>${ATT.esc(item[1])}</span></div></div>`).join('');

    ATT.icons();
  }

  function saveFilters() {
    data.reportFilters = { from: from.value, to: to.value };
    save();
  }

  document.getElementById('refreshReport').onclick = () => { saveFilters(); render(); ERP.toast('Reporte actualizado'); };
  from.onchange = () => { saveFilters(); render(); };
  to.onchange = () => { saveFilters(); render(); };

  exportReport.onclick = () => {
    const attentions = data.attentions.filter(item => dateInRange(item.date));
    ATT.exportPublic('informe-transparencia-atencion-anonimizado.csv', attentions, [
      { label: 'Fecha', key: 'date' }, { label: 'Canal', key: 'channel' }, { label: 'Servicio', key: 'service' },
      { label: 'Clasificación', key: 'requestType' }, { label: 'Dependencia', key: 'assignedOffice' },
      { label: 'Estado', key: 'status' }, { label: 'Plazo', key: 'due' }, { label: 'Satisfacción', key: 'rating' }
    ]);
  };

  document.getElementById('exportProtectedReport').onclick = () => {
    const rows = data.attentions.filter(item => dateInRange(item.date));
    ATT.exportProtected(data, 'base-operativa-atenciones-protegida.csv', rows, 'Reportes');
  };

  render();
});
