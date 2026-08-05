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
    'contacts', 'alerts', 'counters', 'rules', 'auditLog', 'notifications', 'dossierNotes', 'roles', 'permissionMatrix', 'integrationStatus'
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
      serviceBoundary: 'Este módulo gestiona citas, visitas, turnos y atenciones. Las PQRSD se tramitan exclusivamente en el aplicativo institucional independiente.',
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


    data.notifications = Array.isArray(data.notifications) ? data.notifications : [];
    data.dossierNotes = Array.isArray(data.dossierNotes) ? data.dossierNotes : [];
    data.integrationStatus = Array.isArray(data.integrationStatus) && data.integrationStatus.length ? data.integrationStatus : [
      { id: 'INT-SUPA', name: 'Supabase', purpose: 'Datos multiusuario, autenticación y tiempo real', status: 'Preparado', connected: false },
      { id: 'INT-DRIVE', name: 'Google Drive', purpose: 'Soportes y documentos del expediente', status: 'Preparado', connected: false },
      { id: 'INT-MAIL', name: 'Correo institucional', purpose: 'Confirmaciones, recordatorios y avisos', status: 'Simulado', connected: false },
      { id: 'INT-CAL', name: 'Calendario institucional', purpose: 'Sincronización de disponibilidad', status: 'Preparado', connected: false }
    ];

    data.roles = Array.isArray(data.roles) && data.roles.length ? data.roles : [
      { id: 'ROL-ADMIN', name: 'Administrador', description: 'Configuración total y auditoría', active: true },
      { id: 'ROL-SECRETARIO', name: 'Secretaría General', description: 'Agenda, atenciones y compromisos', active: true },
      { id: 'ROL-RECEPCION', name: 'Recepción', description: 'Citas, visitantes y turnos', active: true },
      { id: 'ROL-PORTERIA', name: 'Portería', description: 'Ingreso, salida y personas presentes', active: true },
      { id: 'ROL-ANFITRION', name: 'Funcionario anfitrión', description: 'Sus citas y visitantes', active: true },
      { id: 'ROL-CONTROL', name: 'Control Interno', description: 'Consulta de auditoría y reportes', active: true }
    ];

    data.permissionMatrix = Array.isArray(data.permissionMatrix) && data.permissionMatrix.length ? data.permissionMatrix : [
      { role: 'Administrador', action: 'manage_all', allowed: true },
      { role: 'Secretaría General', action: 'manage_appointments', allowed: true },
      { role: 'Secretaría General', action: 'manage_attentions', allowed: true },
      { role: 'Secretaría General', action: 'view_reports', allowed: true },
      { role: 'Recepción', action: 'manage_appointments', allowed: true },
      { role: 'Recepción', action: 'manage_visitors', allowed: true },
      { role: 'Recepción', action: 'manage_queue', allowed: true },
      { role: 'Portería', action: 'checkin_checkout', allowed: true },
      { role: 'Funcionario anfitrión', action: 'view_own_visits', allowed: true },
      { role: 'Control Interno', action: 'view_audit', allowed: true },
      { role: 'Control Interno', action: 'view_reports', allowed: true }
    ];

    data.appointments.forEach((item, index) => {
      if (!item.bookingCode) item.bookingCode = `SG-${String(item.id || `CIT${index + 1}`).replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase()}-${String(index + 1).padStart(3, '0')}`;
    });

    data.settings.currentRole = data.settings.currentRole || localStorage.getItem('erp-attention-role') || 'Administrador';
    data.settings.publicPortalEnabled = data.settings.publicPortalEnabled !== false;
    data.settings.qrCheckinEnabled = data.settings.qrCheckinEnabled !== false;
    data.settings.notificationMode = data.settings.notificationMode || 'Simulado';

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
      const previousHash = data.auditLog?.[0]?.hash || 'GENESIS';
      const entry = {
        id: this.uid('AUD'),
        date: nowDate(),
        time: nowTime(),
        module,
        action,
        entity,
        recordId,
        detail,
        actor: data.settings?.currentRole || 'Usuario institucional',
        result: 'Exitoso',
        previousHash
      };
      entry.hash = this.hash(`${previousHash}|${entry.id}|${entry.date}|${entry.time}|${module}|${action}|${entity}|${recordId}|${detail}|${entry.actor}`);
      data.auditLog.unshift(entry);
      data.auditLog = data.auditLog.slice(0, 1000);
      return entry;
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
        <div><strong>Tratamiento responsable de información</strong><span>Registre solo datos necesarios para la atención. Los reportes públicos deben ser anonimizados. Este módulo no reemplaza ni integra el aplicativo institucional independiente de PQRSD.</span></div>
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

    hash(value = '') {
      let hash = 2166136261;
      for (let index = 0; index < String(value).length; index += 1) {
        hash ^= String(value).charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return `H${(hash >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
    },

    appointmentCode(data) {
      let code = '';
      do {
        code = `SG-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${String(Date.now()).slice(-4)}`;
      } while (data.appointments.some(item => item.bookingCode === code));
      return code;
    },

    notify(data, payload = {}) {
      const notification = {
        id: this.uid('NOT'),
        date: nowDate(),
        time: nowTime(),
        title: payload.title || 'Notificación institucional',
        message: payload.message || '',
        channel: payload.channel || 'Notificación interna',
        recipient: payload.recipient || 'Equipo de atención',
        status: payload.status || 'Pendiente',
        relatedType: payload.relatedType || '',
        relatedId: payload.relatedId || '',
        read: false,
        attempts: 0
      };
      data.notifications.unshift(notification);
      return notification;
    },

    currentRole(data) {
      return data?.settings?.currentRole || localStorage.getItem('erp-attention-role') || 'Administrador';
    },

    setRole(data, role) {
      data.settings.currentRole = role;
      localStorage.setItem('erp-attention-role', role);
      writeGlobal(data);
    },

    can(data, action) {
      const role = this.currentRole(data);
      if (role === 'Administrador') return true;
      return data.permissionMatrix.some(item => item.role === role && item.action === action && item.allowed !== false);
    },

    guard(data, action, callback) {
      if (!this.can(data, action)) {
        ERP.toast(`El rol ${this.currentRole(data)} no tiene permiso para esta acción`, 'error');
        return false;
      }
      callback();
      return true;
    },

    checkinUrl(code = '') {
      const path = window.location.pathname;
      const marker = '/registro-atenciones/';
      const index = path.indexOf(marker);
      const root = index >= 0 ? path.slice(0, index + marker.length) : './';
      return `${window.location.origin}${root}checkin/index.html?code=${encodeURIComponent(code)}`;
    },

    publicPortalUrl() {
      const path = window.location.pathname;
      const marker = '/registro-atenciones/';
      const index = path.indexOf(marker);
      const root = index >= 0 ? path.slice(0, index + marker.length) : './';
      return `${window.location.origin}${root}portal-citas/index.html`;
    },

    downloadICS(appointment) {
      const clean = value => String(value || '').replace(/[\,;]/g, ' ');
      const start = `${appointment.date.replaceAll('-', '')}T${String(appointment.time || '08:00').replace(':', '')}00`;
      const end = `${appointment.date.replaceAll('-', '')}T${String(appointment.end || appointment.time || '08:30').replace(':', '')}00`;
      const content = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ERP San Pedro//Atencion 360//ES',
        'BEGIN:VEVENT', `UID:${appointment.id}@sanpedro-valle.gov.co`, `DTSTART:${start}`, `DTEND:${end}`,
        `SUMMARY:${clean(appointment.service)}`, `DESCRIPTION:Código de cita: ${clean(appointment.bookingCode)}. Responsable: ${clean(appointment.host)}`,
        `LOCATION:${clean(appointment.modality === 'Virtual' ? appointment.virtualUrl || 'Reunión virtual' : 'Alcaldía de San Pedro')}`,
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
      const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cita-${appointment.bookingCode || appointment.id}.ics`;
      link.click();
      URL.revokeObjectURL(link.href);
    },

    verifyAudit(data) {
      const ordered = [...data.auditLog].reverse();
      let previous = 'GENESIS';
      for (const item of ordered) {
        if (!item.hash) continue;
        const expected = this.hash(`${previous}|${item.id}|${item.date}|${item.time}|${item.module}|${item.action}|${item.entity}|${item.recordId}|${item.detail}|${item.actor}`);
        if (item.previousHash !== previous || item.hash !== expected) return { valid: false, item };
        previous = item.hash;
      }
      return { valid: true };
    },

    dossierEvents(data, document) {
      const doc = String(document || '');
      const events = [];
      data.appointments.filter(item => String(item.document) === doc).forEach(item => events.push({ date: item.date, time: item.time, type: 'Cita', title: item.service, status: item.status, id: item.id }));
      data.visitors.filter(item => String(item.document) === doc).forEach(item => events.push({ date: item.date || data.settings.currentDate, time: item.checkin || item.expected, type: 'Visita', title: item.purpose, status: item.status, id: item.id }));
      data.attentions.filter(item => String(item.document) === doc).forEach(item => events.push({ date: item.date, time: item.time, type: 'Atención', title: item.service, status: item.status, id: item.id }));
      data.dossierNotes.filter(item => String(item.document) === doc).forEach(item => events.push({ date: item.date, time: item.time, type: 'Seguimiento', title: item.title, status: item.status, id: item.id }));
      return events.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
    }
  };


  function installExtendedNavigation() {
    const path = window.location.pathname;
    const marker = '/registro-atenciones/';
    const index = path.indexOf(marker);
    if (index < 0) return;
    const root = path.slice(0, index + marker.length);
    const pages = [
      ['globe-2', 'Portal público de citas', 'portal-citas/index.html'],
      ['qr-code', 'Check-in QR', 'checkin/index.html'],
      ['folder-user', 'Expedientes de atención', 'expedientes/index.html'],
      ['bell-ring', 'Notificaciones', 'notificaciones/index.html'],
      ['shield-check', 'Roles y permisos', 'permisos/index.html'],
      ['history', 'Auditoría', 'auditoria/index.html'],
      ['plug-zap', 'Integraciones', 'integraciones/index.html']
    ];
    const sidebar = document.querySelector('.att-sidebar-nav');
    if (sidebar && !sidebar.querySelector('[data-att-extended]')) {
      const labels = [...sidebar.querySelectorAll('.nav-label')];
      const before = labels.find(item => item.textContent.trim() === 'Secretaría General');
      const html = `<div class="nav-label" data-att-extended>Operación avanzada</div>${pages.map(([icon, label, url]) => {
        const active = path.endsWith(`/${url}`) || path.endsWith(url);
        return `<a class="nav-item${active ? ' active' : ''}" href="${root}${url}"><i data-lucide="${icon}"></i><span class="nav-text">${label}</span></a>`;
      }).join('')}`;
      (before || sidebar.lastElementChild)?.insertAdjacentHTML(before ? 'beforebegin' : 'afterend', html);
    }
    const subnav = document.querySelector('.att-subnav');
    if (subnav && !subnav.querySelector('[data-att-advanced]')) {
      subnav.insertAdjacentHTML('beforeend', `<a data-att-advanced href="${root}expedientes/index.html">Expedientes</a><a data-att-advanced href="${root}auditoria/index.html">Auditoría</a>`);
    }
    if (window.ERP?.refreshIcons) ERP.refreshIcons();
  }

  document.addEventListener('DOMContentLoaded', installExtendedNavigation);

  window.ATT = A;
})();
