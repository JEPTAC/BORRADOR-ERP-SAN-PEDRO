(() => {
  'use strict';

  const SESSION_KEY = 'erp_demo_session_v24';
  const PROFILE_KEY = 'erp_profile_overrides_v24';
  const LAST_PROFILE_KEY = 'erp_last_profile_v24';
  const $ = (selector, root = document) => root.querySelector(selector);

  let appData = { profiles: [] };

  const safeJSON = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };

  const showToast = (message) => {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.add('hidden'), 3200);
  };

  const getOverrides = () => safeJSON(localStorage.getItem(PROFILE_KEY), {});

  const applyOverride = (profile) => {
    const override = getOverrides()[profile.id] || {};
    return { ...profile, ...override, permissions: profile.permissions };
  };

  const fillProfile = (id, focusPassword = false) => {
    const profile = appData.profiles.find(item => item.id === id) || appData.profiles[0];
    if (!profile) return;
    const resolved = applyOverride(profile);
    $('#profile').value = profile.id;
    $('#email').value = resolved.email || '';
    $('#profileHint').textContent = `${resolved.title} · ${resolved.department}`;
    if (focusPassword) $('#password').focus();
  };

  const renderProfiles = () => {
    const select = $('#profile');
    select.innerHTML = appData.profiles.map(profile => (
      `<option value="${profile.id}">${profile.name} — ${profile.title}</option>`
    )).join('');

    const preferredIds = ['secretaria-general', 'mesa-tic', 'recepcion'];
    const quick = preferredIds
      .map(id => appData.profiles.find(profile => profile.id === id))
      .filter(Boolean);

    $('#quickProfiles').innerHTML = quick.map(profile => `
      <button class="quick-profile" type="button" data-profile="${profile.id}">
        <span class="quick-avatar">${profile.initials}</span>
        <span><strong>${profile.name}</strong><small>${profile.title}</small></span>
      </button>
    `).join('');

    $('#quickProfiles').addEventListener('click', (event) => {
      const button = event.target.closest('[data-profile]');
      if (!button) return;
      fillProfile(button.dataset.profile, true);
      showToast('Perfil cargado. Escribe cualquier contraseña de 4 caracteres o más.');
    });

    const remembered = localStorage.getItem(LAST_PROFILE_KEY);
    fillProfile(remembered && appData.profiles.some(item => item.id === remembered) ? remembered : appData.profiles[1]?.id || appData.profiles[0]?.id);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formMessage = $('#formMessage');
    formMessage.classList.add('hidden');

    const profile = appData.profiles.find(item => item.id === $('#profile').value);
    const email = $('#email').value.trim();
    const password = $('#password').value;

    if (!profile || !email || password.length < 4) {
      formMessage.textContent = 'Completa el perfil, el correo y una contraseña de demostración de mínimo 4 caracteres.';
      formMessage.classList.remove('hidden');
      return;
    }

    const resolved = applyOverride(profile);
    const session = {
      id: profile.id,
      name: resolved.name,
      email,
      title: resolved.title,
      department: resolved.department,
      role: profile.role,
      initials: resolved.initials || profile.initials,
      photo: resolved.photo || '',
      permissions: profile.permissions,
      startedAt: new Date().toISOString(),
      demo: true
    };

    const storage = $('#remember').checked ? localStorage : sessionStorage;
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    if ($('#remember').checked) localStorage.setItem(LAST_PROFILE_KEY, profile.id);

    const button = $('.login-button');
    button.disabled = true;
    button.querySelector('span').textContent = 'Preparando tu espacio…';
    setTimeout(() => { window.location.href = '../launcher/index.html'; }, 520);
  };

  const initialize = async () => {
    try {
      const response = await fetch('data.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      appData = await response.json();
      renderProfiles();
    } catch (error) {
      $('#formMessage').textContent = 'No fue posible cargar los perfiles de demostración. Verifica que data.json esté publicado.';
      $('#formMessage').classList.remove('hidden');
      console.error('No se pudo cargar acceso/data.json', error);
    }

    $('#profile').addEventListener('change', () => fillProfile($('#profile').value));
    $('#loginForm').addEventListener('submit', handleSubmit);
    $('#togglePassword').addEventListener('click', () => {
      const input = $('#password');
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      $('#togglePassword').textContent = visible ? 'Ver' : 'Ocultar';
      $('#togglePassword').setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
    $('#forgotPassword').addEventListener('click', () => {
      showToast('Recuperación simulada. Esta función se conectará con la autenticación real más adelante.');
    });
  };

  document.addEventListener('DOMContentLoaded', initialize);
})();
