(function(){
const S={
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
 x:'<path d="m6 6 12 12M18 6 6 18"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',
 left:'<path d="M19 12H5m5-5-5 5 5 5"/>',
 right:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 grid:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
 building:'<path d="M4 21V8l8-4 8 4v13M8 10h2m4 0h2M8 14h2m4 0h2M9 21v-4h6v4"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18M8 14h3m2 0h3M8 17h3"/>',
 file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6m-6 4h6"/>',
 shield:'<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
 heart:'<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6"/><path d="M7 12h3l1-3 2 6 1-3h3"/>',
 wallet:'<path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12"/><path d="M15 11h6v4h-6a2 2 0 0 1 0-4"/>',
 briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/>',
 scale:'<path d="M12 3v18M5 6h14M7 6 3 14h8L7 6Zm10 0-4 8h8l-4-8ZM8 21h8"/>',
 headset:'<path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a1 1 0 0 1-1-1zm16 0h-3v6h2a1 1 0 0 0 1-1zM17 20c0 1-2 2-5 2"/>',
 workflow:'<rect x="3" y="3" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><rect x="15" y="3" width="6" height="5" rx="1"/><path d="M9 5.5h6M6 8v6a4 4 0 0 0 4 4h5"/>',
 monitor:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/>',
 upload:'<path d="M12 16V4m-5 5 5-5 5 5M5 21h14"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 alert:'<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
 folder:'<path d="M3 6h7l2 2h9v11H3z"/>',
 map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>',
 tool:'<path d="M14 6a4 4 0 0 0-5 5L3 17l4 4 6-6a4 4 0 0 0 5-5l-3 3-4-4 3-3Z"/>',
 message:'<path d="M4 5h16v12H8l-4 4z"/><path d="M8 9h8m-8 4h5"/>',
 chart:'<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
 circle:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4m0 4h.01"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
};
function pick(name){
 const n=String(name||'').toLowerCase();
 if(S[n])return S[n];
 if(/chevron-left|arrow-left|move-left/.test(n))return S.left;
 if(/chevron-right|arrow-right|external|log-in|log-out/.test(n))return S.right;
 if(/calendar|date|clock/.test(n))return S.calendar;
 if(/user|contact|people|team/.test(n))return S.users;
 if(/building|landmark|bank|home/.test(n))return S.building;
 if(/shield|lock|key|security/.test(n))return S.shield;
 if(/heart|health|activity/.test(n))return S.heart;
 if(/wallet|money|credit|dollar|banknote/.test(n))return S.wallet;
 if(/briefcase|work|job/.test(n))return S.briefcase;
 if(/scale|gavel|law/.test(n))return S.scale;
 if(/headset|support|phone/.test(n))return S.headset;
 if(/workflow|route|git|network/.test(n))return S.workflow;
 if(/monitor|laptop|computer|tv/.test(n))return S.monitor;
 if(/download/.test(n))return S.download;
 if(/upload/.test(n))return S.upload;
 if(/check|done|success/.test(n))return S.check;
 if(/alert|warning|triangle/.test(n))return S.alert;
 if(/folder|archive/.test(n))return S.folder;
 if(/map|location|pin/.test(n))return S.map;
 if(/tool|settings|wrench|cog/.test(n))return S.tool;
 if(/message|mail|chat/.test(n))return S.message;
 if(/chart|analytics|bar-chart|pie-chart/.test(n))return S.chart;
 if(/file|document|clipboard|book/.test(n))return S.file;
 if(/grid|apps|layout/.test(n))return S.grid;
 if(/plus|add/.test(n))return S.plus;
 if(/search/.test(n))return S.search;
 if(/bell|notification/.test(n))return S.bell;
 if(/menu/.test(n))return S.menu;
 if(/close|x/.test(n))return S.x;
 return S.circle;
}
window.lucide={createIcons:function(){
 document.querySelectorAll('[data-lucide]').forEach(function(el){
  if(el.tagName&&el.tagName.toLowerCase()==='svg')return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  const classes=Array.from(el.classList||[]).filter(Boolean);
  classes.push('erp-icon');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('width','24');
  svg.setAttribute('height','24');
  svg.setAttribute('fill','none');
  svg.setAttribute('stroke','currentColor');
  svg.setAttribute('stroke-width','1.8');
  svg.setAttribute('stroke-linecap','round');
  svg.setAttribute('stroke-linejoin','round');
  svg.setAttribute('focusable','false');
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('class',classes.join(' '));
  svg.dataset.lucide=el.dataset.lucide||'';
  svg.innerHTML=pick(el.dataset.lucide);
  el.replaceWith(svg);
 });
}};
})();
