(function () {
  function loadPremiumUI() {
    if (document.querySelector('link[data-erp-premium-ui]')) return;
    const source = document.currentScript?.src || document.querySelector('script[src*="assets/js/shell.js"]')?.src || '';
    if (!source) return;
    const href = new URL('../css/erp-premium-v23.css?v=23.0.0', source).href;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.erpPremiumUi = '23';
    document.head.appendChild(link);
  }

  loadPremiumUI();

  const ERP = {
    init() {
      document.documentElement.dataset.erpUi = 'premium';
      const storedTheme = localStorage.getItem('erp-theme') || 'light';
      document.documentElement.dataset.theme = storedTheme;
      document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('erp-theme', next);
        this.refreshIcons();
      }));
      document.querySelectorAll('[data-menu-toggle]').forEach(btn => btn.addEventListener('click', () => document.body.classList.toggle('sidebar-open')));
      document.addEventListener('click', e => {
        if (document.body.classList.contains('sidebar-open') && !e.target.closest('.sidebar') && !e.target.closest('[data-menu-toggle]')) document.body.classList.remove('sidebar-open');
        const closer = e.target.closest('[data-close]');
        if (closer) this.close(closer.dataset.close);
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') this.closeAll(); });
      this.bindTabs();
      this.refreshIcons();
      this.setToday();
    },
    refreshIcons() { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } }); },
    setToday() {
      document.querySelectorAll('[data-today]').forEach(el => {
        el.textContent = new Intl.DateTimeFormat('es-CO', { weekday:'long', day:'2-digit', month:'long', year:'numeric' }).format(new Date());
      });
    },
    bindTabs() {
      document.querySelectorAll('[data-tabs]').forEach(group => {
        group.addEventListener('click', e => {
          const btn = e.target.closest('[data-tab]'); if (!btn) return;
          const id = btn.dataset.tab;
          group.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === btn));
          const scope = group.closest('[data-tab-scope]') || document;
          scope.querySelectorAll('[data-panel]').forEach(p => p.classList.toggle('active', p.dataset.panel === id));
        });
      });
    },
    open(id) { const el = document.getElementById(id); if (el) { el.classList.remove('hidden'); document.body.style.overflow='hidden'; this.refreshIcons(); } },
    close(id) { const el = document.getElementById(id); if (el) { el.classList.add('hidden'); document.body.style.overflow=''; } },
    closeAll() { document.querySelectorAll('.modal-backdrop:not(.hidden), .drawer-backdrop:not(.hidden), .drawer:not(.hidden)').forEach(el => el.classList.add('hidden')); document.body.style.overflow=''; },
    toast(message, type='success') {
      let stack = document.querySelector('.toast-stack');
      if (!stack) { stack=document.createElement('div'); stack.className='toast-stack'; document.body.appendChild(stack); }
      const toast=document.createElement('div'); toast.className=`toast ${type}`; toast.innerHTML=`<i data-lucide="${type==='error'?'circle-alert':'circle-check'}"></i><span>${message}</span>`;
      stack.appendChild(toast); this.refreshIcons(); setTimeout(()=>toast.remove(), 3600);
    },
    async fetchJSON(path, fallback={}) { try { const r=await fetch(path); if(!r.ok) throw new Error(r.status); return await r.json(); } catch(e) { console.warn('No se pudo cargar', path, e); return fallback; } },
    initials(name='') { return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); },
    formatDate(value, opts={day:'2-digit',month:'short',year:'numeric'}) { if(!value) return '—'; const d=new Date(value+'T12:00:00'); return new Intl.DateTimeFormat('es-CO',opts).format(d); },
    csv(filename, rows) {
      if (!rows.length) return this.toast('No hay datos para exportar','error');
      const headers=Object.keys(rows[0]); const clean=v=>`"${String(v??'').replaceAll('"','""')}"`;
      const content='\ufeff'+[headers.map(clean).join(';'),...rows.map(r=>headers.map(h=>clean(r[h])).join(';'))].join('\n');
      const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'})); a.download=filename; a.click(); URL.revokeObjectURL(a.href);
    },
    uid(prefix='ID') { return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }
  };
  window.ERP=ERP;
  document.addEventListener('DOMContentLoaded',()=>ERP.init());
})();
