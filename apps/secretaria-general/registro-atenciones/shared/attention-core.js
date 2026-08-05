(function () {
  'use strict';

  const GLOBAL_KEY = 'erp-attention-360-v18';
  const LEGACY_KEYS = [
    'erp-attention-center-v17',
    'erp-attention-agenda-v17',
    'erp-attention-reception-v17',
    'erp-attention-queue-v17',
    'erp-attention-directory-v17',
    'erp-attention-records-v17',
    'erp-attention-reports-v17',
    'erp-attention-config-v17'
  ];

  const ARRAY_KEYS = [
    'services', 'staff', 'appointments', 'visitors', 'queue', 'attentions',
    'contacts', 'alerts', 'counters', 'rules', 'auditLog'
  ];

  const nowDate = () => new Date().toISOString().slice(0, 10);
  const nowTime = () => new Date().toTimeString().slice(0, 5);

  function clone(value) {
    return JSON.parse(JSON.stringify(value ?? {}));
  }

  function mergeUnique(target = [], source = []) {
    const result = [...target];
    const seen = new Set(result.map(item => item && typeof item === 'object' ? item.id : JSON.stringify(item)));
    source.forEach(item => {
      const key = item && typeof item === 'object' ? item.id : JSON.stringify(item);
      if (!seen.has(key)) {
        result.push(item);
        seen.add(key);
      }
    });
    return result;
  }

  function deepMerge(target = {}, source = {}) {
    const output = clone(target);
    Object.entries(source || {}).forEach(([key, value]) => {
      if (ARRAY_KEYS.includes(key) && Array.isArray(value)) {
        output[key] = mergeUnique(output[key] || [], value);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        output[key] = deepMerge(output[key] || {}, value);
      } else if (output[key] === undefined || output[key] === null || output[key] === '') {
        output[key] = value;
      }
    });
    return output;
  }

  function normalize(data = {}) {
    ARRAY_KEYS.forEach(key => {
      if (!Array.isArray(data[key])) data[key] = [];
    });

    data.settings = {
      currentDate: nowDate(),
      office: 'Secretaría General',
      open: '08:00',
      close: '17:00',
      lunchStart: '12:00',
      lunchEnd: '13:30',
      privacyNoticeVersion: 'V1-2026',
      informationClass: 'Pública clasificada – datos personales',
      retentionRule: 'Conservar según la TRD vigente de la entidad',
      publicExportMode: 'Anonimizado',
      ...data.settings
    };

    data.schedule = {
      weekdays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
      open: data.settings.open || '08:00',
      close: data.settings.close || '17:00',
      lunchStart: data.settings.lunchStart || '12:00',
      lunchEnd: data.settings.lunchEnd || '13:30',
      ...(data.schedule || {})
    };

    data.policy = {
      purpose: 'Gestionar citas, ingreso, turnos y trazabilidad de la atención institucional.',
      legalBasis: 'Cumplimiento de funciones públicas y gestión del servicio al ciudadano.',
      classification: 'Pública clasificada – datos personales.',
      publicationRule: 'Los reportes públicos se generan anonimizados. Los datos identificables requieren autorización funcional y trazabilidad.',
      petitionRule: 'Toda solicitud que constituya petición, PQRSD o solicitud de información debe radicarse y trasladarse al canal oficial.',
      retentionRule: data.settings.retentionRule,
      ...(data.policy || {})
    };

    data.counters = data.counters.length ? data.counters : [
      { id: 'P1', name: 'Puesto 1', staff: 'Recepción', status: 'Disponible', current: '' },
      { id: 'P2', name: 'Puesto 2', staff: 'Auxiliar administrativa', status: 'Disponible', current: '' },
      { id: 'P3', name: 'Secretaría', staff: 'Secretaría General', status: 'Disponible', current: '' }
    ];

    data.rules = data.rules.length ? data.rules : [
      { id: 'R1', name: 'Confirmación inmediata', event: 'Nueva cita', channel: 'Correo', active: true },
      { id: 'R2', name: 'Recordatorio 24 horas', event: 'Antes de la cita', channel: 'Correo / SMS', active: true },
      { id: 'R3', name: 'Aviso al anfitrión', event: 'Check-in', channel: 'Correo', active: true },
      { id: 'R4', name: 'Encuesta posterior', event: 'Atención finalizada', channel: 'Correo', active: false }
    ];

    return data;
  }

  function readJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('No se pudo leer almacenamiento local', key, error);
      return null;
    }
  }

  function writeGlobal(data) {
    const normalized = normalize(data);
    localStorage.setItem(GLOBAL_KEY, JSON.stringify(normalized));
    return normalized;
  }

  const A = {
    GLOBAL_KEY,

    esc(value = '') {
      return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[char]));
    },

    async load(path, legacyKey) {
      const base = await ERP.fetchJSON(path, {});
      let global = readJSON(GLOBAL_KEY);

      if (!global) {
        global = clone(base);
        LEGACY_KEYS.forEach(key => {
          const legacy = readJSON(key);
          if (legacy) global = deepMerge(global, legacy);
        });
        const migrated = writeGlobal(global);
        LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
        return migrated;
      }

      global = deepMerge(global, base);
      return writeGlobal(global);
    },

    save(_legacyKey, data) {
      writeGlobal(data);
    },

    reset() {
      localStorage.removeItem(GLOBAL_KEY);
      LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    },

    uid(prefix = 'REG') {
      return ERP.uid(prefix);
    },

    nowDate,
    nowTime,

    fmtDate(value, opts = { weekday: 'short', day: '2-digit', month: 'short' }) {
      if (!value) return '—';
      return new Intl.DateTimeFormat('es-CO', opts).format(new Date(`${value}T12:00:00`));
    },

    fmtTime(value) {
      return value || '—';
    },

    minutes(time = '00:00') {
      const [hours, minutes] = String(time).split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    },

    addMinutes(time, amount) {
      const total = this.minutes(time) + Number(amount || 0);
      const hours = Math.floor((total % 1440) / 60);
      const minutes = total % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    },

    appointmentConflict(data, candidate, ignoreId = '') {
      const start = this.minutes(candidate.time);
      const end = this.minutes(candidate.end);
      return data.appointments.find(item => {
        if (item.id === ignoreId || item.date !== candidate.date || item.host !== candidate.host) return false;
        if (['Cancelada', 'Ausente'].includes(item.status)) return false;
        const itemStart = this.minutes(item.time);
        const itemEnd = this.minutes(item.end);
        return start < itemEnd && end > itemStart;
      });
    },

    badge(status = '') {
      const normalized = String(status).toLowerCase();
      let className = 'info';
      if (/confirm|atendid|finaliz|activo|ingres|disponible|cumpl/.test(normalized)) className = 'success';
      else if (/esper|pend|program|por llegar|seguimiento|radic/.test(normalized)) className = 'warning';
      else if (/cancel|ausente|bloque|rechaz|vencid|crít|crit/.test(normalized)) className = 'danger';
      return `<span class="att-badge ${className}">${this.esc(status)}</span>`;
    },

    initials(name = '') {
      return ERP.initials(name);
    },

    maskDocument(document = '') {
      const digits = String(document).replace(/\D/g, '');
      if (digits.length <= 4) return '***';
      return `${'*'.repeat(Math.max(3, digits.length - 4))}${digits.slice(-4)}`;
    },

    audit(data, module, action, entity, recordId, detail = '') {
      data.auditLog.unshift({
        id: this.uid('AUD'),
        date: nowDate(),
        time: nowTime(),
        module,
        action,
        entity,
        recordId,
        detail,
        actor: 'Usuario institucional',
        result: 'Exitoso'
      });
      data.auditLog = data.auditLog.slice(0, 500);
    },

    upsertContact(data, values = {}) {
      if (!values.document || !(values.name || values.person)) return;
      let contact = data.contacts.find(item => String(item.document) === String(values.document));
      if (!contact) {
        contact = {
          id: this.uid('USR'),
          name: values.name || values.person,
          document: values.document,
          type: values.type || 'Ciudadano',
          phone: values.phone || '',
          email: values.email || '',
          visits: 0,
          lastVisit: '',
          privacyNoticeAccepted: true,
          consent: true,
          notes: ''
        };
        data.contacts.push(contact);
      } else {
        if (values.name || values.person) contact.name = values.name || values.person;
        if (values.phone) contact.phone = values.phone;
        if (values.email) contact.email = values.email;
      }
      return contact;
    },

    csv(name, rows) {
      ERP.csv(name, rows);
    },

    exportProtected(data, name, rows, module, columns) {
      if (!rows.length) return ERP.toast('No hay datos para exportar', 'error');
      const accepted = window.confirm('Esta exportación contiene datos personales y quedará registrada en la auditoría. ¿Continuar?');
      if (!accepted) return;
      const output = columns
        ? rows.map(row => Object.fromEntries(columns.map(column => [column.label, row[column.key] ?? ''])))
        : rows;
      this.audit(data, module, 'Exportación protegida', 'Conjunto de datos', name, `${rows.length} registros`);
      writeGlobal(data);
      ERP.csv(name, output);
    },

    exportPublic(name, rows, columns) {
      if (!rows.length) return ERP.toast('No hay datos para exportar', 'error');
      const output = rows.map(row => {
        const item = {};
        columns.forEach(column => {
          item[column.label] = typeof column.value === 'function' ? column.value(row) : row[column.key] ?? '';
        });
        return item;
      });
      ERP.csv(name, output);
    },

    icons() {
      ERP.refreshIcons();
    },

    confirm(message, onAccept) {
      if (window.confirm(message)) onAccept();
    },

    legalNotice(compact = false) {
      return `<div class="att-legal${compact ? ' compact' : ''}">
        <i data-lucide="shield-check"></i>
        <div><strong>Tratamiento responsable de información</strong><span>Registre solo datos necesarios para la atención. Los reportes públicos deben ser anonimizados y las solicitudes que constituyan PQRSD o acceso a información deben trasladarse al canal oficial de radicación.</span></div>
      </div>`;
    },

    insertLegalNotice(afterSelector) {
      const target = document.querySelector(afterSelector);
      if (!target || document.querySelector('.att-legal')) return;
      target.insertAdjacentHTML('afterend', this.legalNotice());
      this.icons();
    },

    modal(title, fields, onSubmit, options = {}) {
      let element = document.getElementById('attDynamicModal');
      if (!element) {
        element = document.createElement('div');
        element.id = 'attDynamicModal';
        element.className = 'modal-backdrop hidden att-modal';
        element.innerHTML = `<div class="modal">
          <div class="modal-header">
            <div><h2 id="attModalTitle"></h2><p id="attModalSubtitle">Registro almacenado localmente durante la fase de diseño.</p></div>
            <button class="icon-btn" type="button" data-close="attDynamicModal"><i data-lucide="x"></i></button>
          </div>
          <form id="attDynamicForm">
            <div class="modal-body"><div class="att-form-grid" id="attModalFields"></div></div>
            <div class="modal-footer"><button type="button" class="btn btn-secondary" data-close="attDynamicModal">Cancelar</button><button class="btn btn-primary" id="attModalSubmit">Guardar</button></div>
          </form>
        </div>`;
        document.body.appendChild(element);
      }

      document.getElementById('attModalTitle').textContent = title;
      document.getElementById('attModalSubtitle').textContent = options.subtitle || 'La actuación quedará registrada en la trazabilidad del módulo.';
      document.getElementById('attModalSubmit').textContent = options.submitLabel || 'Guardar';

      const box = document.getElementById('attModalFields');
      box.innerHTML = fields.map(field => {
        const classes = `${field.full ? ' full' : ''}${field.type === 'checkbox' ? ' checkbox-field' : ''}`;
        const required = field.required ? 'required' : '';
        const disabled = field.disabled ? 'disabled' : '';
        const min = field.min !== undefined ? `min="${this.esc(field.min)}"` : '';
        const max = field.max !== undefined ? `max="${this.esc(field.max)}"` : '';
        const step = field.step !== undefined ? `step="${this.esc(field.step)}"` : '';
        const placeholder = this.esc(field.placeholder || '');
        let input = '';

        if (field.type === 'select') {
          input = `<select name="${field.name}" ${required} ${disabled}>${(field.options || []).map(option => {
            const value = typeof option === 'string' ? option : option.value;
            const label = typeof option === 'string' ? option : option.label;
            const selected = String(value) === String(field.value ?? '') ? 'selected' : '';
            return `<option value="${this.esc(value)}" ${selected}>${this.esc(label)}</option>`;
          }).join('')}</select>`;
        } else if (field.type === 'textarea') {
          input = `<textarea name="${field.name}" ${required} ${disabled} placeholder="${placeholder}" rows="${field.rows || 4}">${this.esc(field.value || '')}</textarea>`;
        } else if (field.type === 'checkbox') {
          input = `<label class="att-check"><input type="checkbox" name="${field.name}" value="true" ${field.value ? 'checked' : ''} ${required} ${disabled}><span>${this.esc(field.checkboxLabel || field.label)}</span></label>`;
        } else if (field.type === 'hidden') {
          return `<input type="hidden" name="${field.name}" value="${this.esc(field.value || '')}">`;
        } else {
          input = `<input type="${field.type || 'text'}" name="${field.name}" value="${this.esc(field.value || '')}" ${required} ${disabled} ${min} ${max} ${step} placeholder="${placeholder}">`;
        }

        const label = field.type === 'checkbox' ? '' : `<label>${this.esc(field.label)}</label>`;
        const help = field.help ? `<small>${this.esc(field.help)}</small>` : '';
        return `<div class="att-form-group${classes}">${label}${input}${help}</div>`;
      }).join('');

      const form = document.getElementById('attDynamicForm');
      form.onsubmit = event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const formData = new FormData(form);
        fields.filter(field => field.type === 'checkbox').forEach(field => {
          formData.set(field.name, form.elements[field.name]?.checked ? 'true' : 'false');
        });
        const values = Object.fromEntries(formData.entries());
        try {
          const result = onSubmit(values, form);
          if (result !== false) ERP.close('attDynamicModal');
        } catch (error) {
          console.error(error);
          ERP.toast(error.message || 'No fue posible guardar el registro', 'error');
        }
      };

      ERP.open('attDynamicModal');
      this.icons();
      const first = form.querySelector('input:not([type="hidden"]):not([type="checkbox"]),select,textarea');
      if (first) setTimeout(() => first.focus(), 50);
    },

    detail(title, html, actions = '') {
      let element = document.getElementById('attDetailModal');
      if (!element) {
        element = document.createElement('div');
        element.id = 'attDetailModal';
        element.className = 'modal-backdrop hidden att-modal';
        element.innerHTML = `<div class="modal">
          <div class="modal-header"><div><h2 id="attDetailTitle"></h2><p>Detalle y actuaciones disponibles.</p></div><button class="icon-btn" data-close="attDetailModal"><i data-lucide="x"></i></button></div>
          <div class="modal-body" id="attDetailBody"></div>
          <div class="modal-footer" id="attDetailActions"><button class="btn btn-secondary" data-close="attDetailModal">Cerrar</button></div>
        </div>`;
        document.body.appendChild(element);
      }
      document.getElementById('attDetailTitle').textContent = title;
      document.getElementById('attDetailBody').innerHTML = html;
      document.getElementById('attDetailActions').innerHTML = `${actions}<button class="btn btn-secondary" data-close="attDetailModal">Cerrar</button>`;
      ERP.open('attDetailModal');
      this.icons();
    },

    petitionDeadline(type, startDate = nowDate()) {
      const businessDays = /información|documentos/i.test(type) ? 10 : /consulta/i.test(type) ? 30 : 15;
      const date = new Date(`${startDate}T12:00:00`);
      let count = 0;
      while (count < businessDays) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) count += 1;
      }
      return date.toISOString().slice(0, 10);
    }
  };

  window.ATT = A;
})();
