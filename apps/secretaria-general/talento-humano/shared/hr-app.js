(function(){
 const HR={
  data:null,
  async init(config){
   this.config=config||{};
   this.data=await ERP.fetchJSON('data.json',{});
   this.enhancePublicNav();
   this.renderMetrics();
   this.bindGeneric();
   if(this.config.init) this.config.init(this.data,this);
   ERP.refreshIcons();
  },

  enhancePublicNav(){
   const nav=document.querySelector('.hr-sidebar-nav'); if(!nav||nav.querySelector('[data-public-employment-nav]'))return;
   const isRoot=/\/talento-humano\/?(?:index\.html)?$/.test(location.pathname);
   const p=isRoot?'':'../';
   const active=(slug)=>location.pathname.includes(`/talento-humano/${slug}/`)?' active':'';
   const block=document.createElement('details');block.className='hr-nav-section';block.open=true;block.dataset.publicEmploymentNav='1';
   block.innerHTML=`<summary>Empleo público</summary>
    <a class="nav-item${active('empleo-publico')}" href="${p}empleo-publico/index.html"><i data-lucide="briefcase"></i><span class="nav-text">Planta y empleo público</span></a>
    <a class="nav-item${active('planeacion-th')}" href="${p}planeacion-th/index.html"><i data-lucide="chart"></i><span class="nav-text">Planeación estratégica TH</span></a>
    <a class="nav-item${active('situaciones-administrativas')}" href="${p}situaciones-administrativas/index.html"><i data-lucide="calendar"></i><span class="nav-text">Situaciones administrativas</span></a>
    <a class="nav-item${active('integridad-publica')}" href="${p}integridad-publica/index.html"><i data-lucide="shield"></i><span class="nav-text">Integridad y declaraciones</span></a>
    <a class="nav-item${active('retiro')}" href="${p}retiro/index.html"><i data-lucide="route"></i><span class="nav-text">Retiro y transferencia</span></a>`;
   const timeSection=[...nav.querySelectorAll('details')].find(x=>x.querySelector('summary')?.textContent.trim()==='Tiempo y pagos');
   nav.insertBefore(block,timeSection||nav.querySelector('.nav-label')||null);
   ERP.refreshIcons();
  },
  renderMetrics(){
   const el=document.getElementById('metrics'); if(!el||!this.data.metrics)return;
   el.innerHTML=this.data.metrics.map(m=>`<article class="card metric-card hr-kpi ${m.tone||''}"><div class="metric-copy"><span>${m.label}</span><strong>${m.value}</strong><small>${m.hint||''}</small>${m.delta?`<div class="metric-delta ${m.deltaTone||'up'}">${m.delta}</div>`:''}</div><div class="metric-icon"><i data-lucide="${m.icon||'chart'}"></i></div></article>`).join('');
  },
  bindGeneric(){
   document.addEventListener('click',e=>{
    const modal=e.target.closest('[data-modal-open]'); if(modal) ERP.open(modal.dataset.modalOpen);
    const demo=e.target.closest('[data-demo-action]'); if(demo) ERP.toast(demo.dataset.demoAction);
    const exp=e.target.closest('[data-export]'); if(exp){const key=exp.dataset.export;const rows=this.data[key]||[];ERP.csv(`${key}.csv`,rows)}
   });
  },
  status(value){
   const v=String(value||'').toLowerCase();
   if(/activo|aprob|complet|vigente|presente|firmado|pagado|cerrado|cumplido|finalizado|bajo/.test(v)) return 'status-success';
   if(/pendiente|proceso|próximo|proximo|revisión|revision|parcial|medio|tarde/.test(v)) return 'status-warning';
   if(/rechaz|venc|alto|ausente|incumpl|crítico|critico|retirado/.test(v)) return 'status-danger';
   if(/programado|radicado|nuevo|publicado|abierto|entrevista|oferta/.test(v)) return 'status-info';
   return 'status-neutral';
  },
  initials:ERP.initials,
  money(v){return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(v||0))},
  number(v){return new Intl.NumberFormat('es-CO').format(Number(v||0))},
  save(key,value){localStorage.setItem(`erp-th-${key}`,JSON.stringify(value))},
  load(key,fallback=[]){try{return JSON.parse(localStorage.getItem(`erp-th-${key}`)||'null')??fallback}catch{return fallback}},
  merge(key,base=[]){return [...this.load(key,[]),...base]},
  openDrawer(title,subtitle,html){
   const drawer=document.getElementById('hrDrawer'),back=document.getElementById('hrDrawerBackdrop'); if(!drawer||!back)return;
   document.getElementById('hrDrawerTitle').textContent=title;
   document.getElementById('hrDrawerSubtitle').textContent=subtitle||'';
   document.getElementById('hrDrawerContent').innerHTML=html;
   back.classList.remove('hidden');drawer.classList.remove('hidden');document.body.style.overflow='hidden';ERP.refreshIcons();
  },
  closeDrawer(){document.getElementById('hrDrawer')?.classList.add('hidden');document.getElementById('hrDrawerBackdrop')?.classList.add('hidden');document.body.style.overflow=''},
  bindForm(id,key,transform,onSaved){
   const f=document.getElementById(id);if(!f)return;
   f.addEventListener('submit',e=>{e.preventDefault();const obj=transform(new FormData(f),this);const saved=this.load(key,[]);saved.unshift(obj);this.save(key,saved);ERP.close(f.closest('.modal-backdrop').id);f.reset();ERP.toast('Registro guardado en modo demostración');if(onSaved)onSaved(obj);});
  },
  filterRows(rows,query,fields){const q=String(query||'').toLowerCase().trim();return !q?rows:rows.filter(r=>fields.some(f=>String(r[f]||'').toLowerCase().includes(q)))},
  uid(prefix){return ERP.uid(prefix)},
  date:ERP.formatDate
 };
 window.HR=HR;
 window.closeHRDrawer=()=>HR.closeDrawer();
})();
