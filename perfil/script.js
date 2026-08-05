(() => {
  'use strict';

  const SESSION_KEY = 'erp_demo_session_v24';
  const PROFILE_KEY = 'erp_profile_overrides_v24';
  const PREFERENCES_KEY = 'erp_visual_preferences_v24';
  const $ = (selector, root = document) => root.querySelector(selector);

  let session = null;
  let baseSession = null;
  let data = { permissionLabels: {}, preferences: [] };

  const safeJSON = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };

  const readSession = () => safeJSON(localStorage.getItem(SESSION_KEY), null) || safeJSON(sessionStorage.getItem(SESSION_KEY), null);
  const getOverrides = () => safeJSON(localStorage.getItem(PROFILE_KEY), {});
  const getPreferences = () => safeJSON(localStorage.getItem(PREFERENCES_KEY), { compact: false, animations: true, rememberFilters: true });

  const showToast = (message) => {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2800);
  };

  const initialsFor = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'US';

  const setPhoto = () => {
    const element = $('#profilePhoto');
    element.innerHTML = session.photo
      ? `<img src="${session.photo}" alt="Foto de ${session.name}">`
      : `<span id="profileInitials">${session.initials || initialsFor(session.name)}</span>`;
  };

  const renderProfile = () => {
    $('#name').value = session.name || '';
    $('#email').value = session.email || '';
    $('#title').value = session.title || '';
    $('#department').value = session.department || '';
    $('#summaryName').textContent = session.name;
    $('#summaryTitle').textContent = session.title;
    $('#summaryDepartment').textContent = session.department;
    $('#summaryEmail').textContent = session.email;
    setPhoto();
  };

  const renderPermissions = () => {
    const permissions = session.permissions.includes('*') ? ['*'] : session.permissions;
    $('#permissions').innerHTML = permissions.map(permission => `
      <div class="permission-item">
        <span class="permission-icon"><img src="../assets/icons/erp/modules/security.svg" alt=""></span>
        <span><strong>${data.permissionLabels[permission] || permission}</strong><small>Habilitado para este perfil de demostración.</small></span>
        <span class="permission-check">✓</span>
      </div>
    `).join('');
  };

  const renderPreferences = () => {
    const preferences = getPreferences();
    $('#preferences').innerHTML = data.preferences.map(item => `
      <div class="preference-item">
        <span class="permission-icon"><img src="../assets/icons/erp/modules/settings.svg" alt=""></span>
        <span><strong>${item.label}</strong><small>${item.description}</small></span>
        <button class="switch ${preferences[item.id] ? 'active' : ''}" type="button" data-preference="${item.id}" aria-pressed="${Boolean(preferences[item.id])}"></button>
      </div>
    `).join('');
  };

  const saveProfile = (event) => {
    event.preventDefault();
    const next = {
      name: $('#name').value.trim(),
      email: $('#email').value.trim(),
      title: $('#title').value.trim(),
      department: $('#department').value.trim(),
      initials: initialsFor($('#name').value.trim()),
      photo: session.photo || ''
    };
    if (!next.name || !next.email || !next.title || !next.department) {
      showToast('Completa todos los campos del perfil.');
      return;
    }

    const overrides = getOverrides();
    overrides[session.id] = next;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(overrides));
    session = { ...session, ...next, permissions: session.permissions };

    const storage = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    renderProfile();
    showToast('Perfil actualizado en este navegador.');
  };

  const resetProfile = () => {
    const overrides = getOverrides();
    delete overrides[session.id];
    localStorage.setItem(PROFILE_KEY, JSON.stringify(overrides));
    session = { ...baseSession };
    const storage = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    renderProfile();
    showToast('Se restableció la información original del perfil.');
  };

  const resizePhoto = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
      image.onload = () => {
        const size = 360;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  const savePhoto = async (file) => {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      showToast('Selecciona una imagen de máximo 6 MB.');
      return;
    }
    try {
      session.photo = await resizePhoto(file);
      const overrides = getOverrides();
      overrides[session.id] = { ...(overrides[session.id] || {}), photo: session.photo };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(overrides));
      const storage = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
      storage.setItem(SESSION_KEY, JSON.stringify(session));
      setPhoto();
      showToast('Foto actualizada localmente.');
    } catch (error) {
      showToast(error.message || 'No fue posible procesar la imagen.');
    }
  };

  const initialize = async () => {
    session = readSession();
    if (!session) {
      window.location.replace('../acceso/index.html');
      return;
    }
    baseSession = { ...session };
    const override = getOverrides()[session.id] || {};
    session = { ...session, ...override, permissions: session.permissions };

    try {
      const response = await fetch('data.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    } catch (error) {
      console.error('No se pudo cargar perfil/data.json', error);
    }

    renderProfile();
    renderPermissions();
    renderPreferences();

    $('#profileForm').addEventListener('submit', saveProfile);
    $('#resetProfile').addEventListener('click', resetProfile);
    $('#photoInput').addEventListener('change', event => savePhoto(event.target.files?.[0]));
    $('#removePhoto').addEventListener('click', () => {
      session.photo = '';
      const overrides = getOverrides();
      overrides[session.id] = { ...(overrides[session.id] || {}), photo: '' };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(overrides));
      const storage = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
      storage.setItem(SESSION_KEY, JSON.stringify(session));
      setPhoto();
      showToast('Foto eliminada del perfil local.');
    });

    $('#preferences').addEventListener('click', event => {
      const button = event.target.closest('[data-preference]');
      if (!button) return;
      const preferences = getPreferences();
      preferences[button.dataset.preference] = !preferences[button.dataset.preference];
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      renderPreferences();
      showToast('Preferencia guardada en este navegador.');
    });

    $('#passwordForm').addEventListener('submit', event => {
      event.preventDefault();
      const next = $('#newPassword').value;
      const confirmation = $('#confirmPassword').value;
      if (next.length < 8 || next !== confirmation) {
        showToast('La nueva contraseña debe tener 8 caracteres y coincidir con la confirmación.');
        return;
      }
      event.target.reset();
      showToast('Cambio simulado. No se modificó ninguna contraseña real.');
    });

    $('#logout').addEventListener('click', () => {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      window.location.href = '../acceso/index.html';
    });
  };

  document.addEventListener('DOMContentLoaded', initialize);
})();
