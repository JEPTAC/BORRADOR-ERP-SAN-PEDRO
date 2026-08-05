(() => {
  'use strict';

  const SESSION_KEY = 'erp_demo_session_v24';
  const PROFILE_KEY = 'erp_profile_overrides_v24';
  const FAVORITES_KEY = 'erp_favorites_v24';
  const RECENTS_KEY = 'erp_recent_transactions_v24';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  let session = null;
  let data = { categories: [], transactions: [] };
  let allowedTransactions = [];
  let currentView = 'all';
  let currentCategory = 'all';
  let searchTerm = '';

  const safeJSON = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };

  const readSession = () => safeJSON(localStorage.getItem(SESSION_KEY), null) || safeJSON(sessionStorage.getItem(SESSION_KEY), null);
  const readFavorites = () => safeJSON(localStorage.getItem(FAVORITES_KEY), []);
  const readRecents = () => safeJSON(localStorage.getItem(RECENTS_KEY), []);
  const getOverrides = () => safeJSON(localStorage.getItem(PROFILE_KEY), {});

  const showToast = (message) => {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2800);
  };

  const resolveProfile = () => {
    const override = getOverrides()[session.id] || {};
    session = { ...session, ...override, permissions: session.permissions };
  };

  const setPhoto = (element, initials) => {
    if (!element) return;
    element.innerHTML = session.photo
      ? `<img src="${session.photo}" alt="Foto de ${session.name}">`
      : `<span>${initials}</span>`;
  };

  const applyProfile = () => {
    const initials = session.initials || session.name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
    $('#profileName').textContent = session.name;
    $('#profileRole').textContent = session.title;
    $('#menuName').textContent = session.name;
    $('#menuEmail').textContent = session.email;
    $('#railInitials').textContent = initials;
    setPhoto($('#profilePhoto'), initials);
    setPhoto($('#menuPhoto'), initials);
  };

  const updateClock = () => {
    const now = new Date();
    $('#currentTime').textContent = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    $('#currentDate').textContent = now.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long' });
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    $('#welcomeTitle').textContent = `${greeting}, ${session.name.split(' ')[0]}`;
    $('#welcomeCopy').textContent = `Accede únicamente a los procesos habilitados para ${session.title}.`;
  };

  const isAllowed = (transaction) => session.permissions.includes('*') || session.permissions.includes(transaction.id);

  const renderCategories = () => {
    const allowedCategories = new Set(allowedTransactions.map(item => item.category));
    const categories = data.categories.filter(category => category.id === 'all' || allowedCategories.has(category.id));
    $('#categoryFilters').innerHTML = categories.map(category => `
      <button class="category-button ${category.id === currentCategory ? 'active' : ''}" type="button" data-category="${category.id}">${category.label}</button>
    `).join('');
  };

  const renderSpotlight = () => {
    const visible = currentView === 'all' && currentCategory === 'all' && !searchTerm;
    const section = $('#spotlightSection');
    if (!visible || !allowedTransactions.length) {
      section.classList.add('hidden');
      section.innerHTML = '';
      return;
    }

    const featured = allowedTransactions.find(item => item.featured) || allowedTransactions[0];
    section.classList.remove('hidden');
    section.innerHTML = `
      <article class="spotlight-card">
        <div class="spotlight-copy">
          <span class="spotlight-label">Acceso recomendado · ${featured.group}</span>
          <h2>${featured.name}</h2>
          <p>${featured.description}</p>
          <div class="spotlight-actions">
            <a class="spotlight-enter" href="${featured.href}" data-open-transaction="${featured.id}">
              Entrar al módulo <img src="../assets/icons/erp/actions/arrow-right.svg" alt="">
            </a>
            <button class="spotlight-secondary" type="button" data-favorite-spotlight="${featured.id}">${readFavorites().includes(featured.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}</button>
          </div>
        </div>
        <div class="spotlight-visual" aria-hidden="true">
          <div class="spotlight-icon-shell"><img src="../assets/icons/erp/modules/${featured.icon}" alt=""></div>
        </div>
      </article>
    `;
  };

  const getVisibleTransactions = () => {
    const favorites = readFavorites();
    const recentIds = readRecents().map(item => item.id);
    let items = [...allowedTransactions];

    if (currentView === 'favorites') items = items.filter(item => favorites.includes(item.id));
    if (currentView === 'recent') {
      items = recentIds.map(id => items.find(item => item.id === id)).filter(Boolean);
    }
    if (currentCategory !== 'all') items = items.filter(item => item.category === currentCategory);
    if (searchTerm) {
      items = items.filter(item => `${item.name} ${item.shortName} ${item.description} ${item.group}`.toLowerCase().includes(searchTerm));
    }

    const spotlightVisible = currentView === 'all' && currentCategory === 'all' && !searchTerm;
    const featured = allowedTransactions.find(item => item.featured) || allowedTransactions[0];
    if (spotlightVisible && featured) items = items.filter(item => item.id !== featured.id);
    return items;
  };

  const renderTransactions = () => {
    const favorites = readFavorites();
    const items = getVisibleTransactions();
    const grid = $('#transactionGrid');

    grid.innerHTML = items.map(item => `
      <article class="transaction-card accent-${item.accent}" tabindex="0" role="link" data-id="${item.id}" data-href="${item.href}" aria-label="Abrir ${item.name}">
        <div class="card-top">
          <span class="transaction-icon"><img src="../assets/icons/erp/modules/${item.icon}" alt=""></span>
          <button class="favorite-button ${favorites.includes(item.id) ? 'active' : ''}" type="button" data-favorite="${item.id}" aria-label="${favorites.includes(item.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}">★</button>
        </div>
        <div class="transaction-copy">
          <span class="transaction-group">${item.group}</span>
          <h3>${item.shortName || item.name}</h3>
          <p>${item.description}</p>
        </div>
        <footer class="transaction-footer">
          <span class="transaction-status">${item.status}</span>
          <span class="transaction-meta">${item.meta}</span>
        </footer>
      </article>
    `).join('');

    $('#emptyState').classList.toggle('hidden', items.length > 0);
    grid.classList.toggle('hidden', items.length === 0);
    bindCardInteractions();
    updateSummary();
  };

  const updateSummary = () => {
    $('#availableCount').textContent = allowedTransactions.length;
    $('#favoriteCount').textContent = readFavorites().filter(id => allowedTransactions.some(item => item.id === id)).length;
    $('#recentCount').textContent = readRecents().filter(item => allowedTransactions.some(tx => tx.id === item.id)).length;
  };

  const updateSectionCopy = () => {
    const titles = {
      all: ['Tus transacciones', 'Accesos disponibles de acuerdo con el perfil seleccionado.'],
      favorites: ['Tus favoritos', 'Procesos guardados para entrar con mayor rapidez.'],
      recent: ['Accesos recientes', 'Últimas transacciones abiertas desde este navegador.']
    };
    $('#sectionTitle').textContent = titles[currentView][0];
    $('#sectionDescription').textContent = titles[currentView][1];
  };

  const setView = (view) => {
    currentView = view;
    currentCategory = 'all';
    $$('.rail-button[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    renderCategories();
    renderSpotlight();
    updateSectionCopy();
    renderTransactions();
  };

  const toggleFavorite = (id) => {
    const favorites = readFavorites();
    const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [id, ...favorites];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    showToast(next.includes(id) ? 'Transacción agregada a favoritos.' : 'Transacción eliminada de favoritos.');
    renderSpotlight();
    renderTransactions();
  };

  const addRecent = (id) => {
    const current = readRecents().filter(item => item.id !== id);
    current.unshift({ id, openedAt: new Date().toISOString() });
    localStorage.setItem(RECENTS_KEY, JSON.stringify(current.slice(0, 8)));
  };

  const openTransaction = (id, href) => {
    addRecent(id);
    window.location.href = href;
  };

  const bindCardInteractions = () => {
    $$('.transaction-card').forEach(card => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('[data-favorite]')) return;
        openTransaction(card.dataset.id, card.dataset.href);
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openTransaction(card.dataset.id, card.dataset.href);
        }
      });
    });
    bindTilt();
  };

  const bindTilt = () => {
    const canTilt = matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (!canTilt) return;
    $$('.transaction-card').forEach(card => {
      let frame = null;
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          card.classList.add('tilting');
          card.style.setProperty('--ry', `${(x - 0.5) * 5}deg`);
          card.style.setProperty('--rx', `${(0.5 - y) * 4}deg`);
        });
      });
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        card.classList.remove('tilting');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });
  };

  const bindEvents = () => {
    $('#categoryFilters').addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      currentCategory = button.dataset.category;
      $$('.category-button').forEach(item => item.classList.toggle('active', item.dataset.category === currentCategory));
      renderSpotlight();
      renderTransactions();
    });

    $$('.rail-button[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));

    $('#transactionSearch').addEventListener('input', (event) => {
      searchTerm = event.target.value.toLowerCase().trim();
      renderSpotlight();
      renderTransactions();
    });

    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        $('#transactionSearch').focus();
      }
      if (event.key === 'Escape') {
        $('#profileMenu').classList.add('hidden');
        closeNotifications();
      }
    });

    document.addEventListener('click', (event) => {
      const favorite = event.target.closest('[data-favorite]');
      const spotlightFavorite = event.target.closest('[data-favorite-spotlight]');
      const directOpen = event.target.closest('[data-open-transaction]');
      if (favorite) {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(favorite.dataset.favorite);
      }
      if (spotlightFavorite) toggleFavorite(spotlightFavorite.dataset.favoriteSpotlight);
      if (directOpen) addRecent(directOpen.dataset.openTransaction);
      if (!event.target.closest('#profileTrigger') && !event.target.closest('#profileMenu')) {
        $('#profileMenu').classList.add('hidden');
        $('#profileTrigger').setAttribute('aria-expanded', 'false');
      }
    });

    $('#profileTrigger').addEventListener('click', () => {
      const menu = $('#profileMenu');
      menu.classList.toggle('hidden');
      $('#profileTrigger').setAttribute('aria-expanded', String(!menu.classList.contains('hidden')));
    });
    $('#railProfile').addEventListener('click', () => window.location.href = '../perfil/index.html');
    $('#logout').addEventListener('click', () => {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      window.location.href = '../acceso/index.html';
    });
    $('#changeProfile').addEventListener('click', () => window.location.href = '../acceso/index.html');
    $('#clearFilters').addEventListener('click', () => {
      $('#transactionSearch').value = '';
      searchTerm = '';
      setView('all');
    });
    $('#notificationButton').addEventListener('click', openNotifications);
    $('#closeNotifications').addEventListener('click', closeNotifications);
    $('#panelBackdrop').addEventListener('click', closeNotifications);
  };

  const openNotifications = () => {
    $('#notificationPanel').classList.remove('hidden');
    $('#panelBackdrop').classList.remove('hidden');
  };
  const closeNotifications = () => {
    $('#notificationPanel').classList.add('hidden');
    $('#panelBackdrop').classList.add('hidden');
  };

  const initialize = async () => {
    session = readSession();
    if (!session) {
      window.location.replace('../acceso/index.html');
      return;
    }
    resolveProfile();
    applyProfile();
    updateClock();
    setInterval(updateClock, 30000);

    try {
      const response = await fetch('data.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
      allowedTransactions = data.transactions.filter(isAllowed);
      renderCategories();
      renderSpotlight();
      updateSectionCopy();
      renderTransactions();
      bindEvents();
    } catch (error) {
      $('#transactionGrid').innerHTML = '<div class="empty-state"><h3>No se pudo cargar el panel</h3><p>Verifica que launcher/data.json esté publicado.</p></div>';
      console.error('No se pudo cargar launcher/data.json', error);
    }
  };

  document.addEventListener('DOMContentLoaded', initialize);
})();
