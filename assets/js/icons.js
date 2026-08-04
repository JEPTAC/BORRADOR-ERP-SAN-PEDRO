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
function pick(n){
 if(n==='menu')return S.menu;if(n.includes('search'))return S.search;if(n.includes('bell'))return S.bell;if(n==='x')return S.x;if(n.includes('plus')||n==='plus')return S.plus;
 if(n.includes('chevron-left')||n==='arrow-left')return S.left;if(n.includes('chevron-right')||n.includes('arrow-right'))return S.right;
 if(n.includes('sun')||n.includes('moon'))return S.sun;if(n.includes('layout')||n.includes('grid')||n.includes('blocks')||n.includes('panels'))return S.grid;
 if(n.includes('building')||n.includes('landmark'))return S.building;if(n.includes('user')||n.includes('person')||n.includes('accessibility'))return S.users;
 if(n.includes('calendar')||n.includes('date'))return S.calendar;if(n.includes('file')||n.includes('clipboard')||n.includes('receipt')||n.includes('book')||n.includes('archive'))return S.file;
 if(n.includes('shield')||n.includes('badge-check')||n.includes('circle-check'))return S.shield;if(n.includes('heart')||n.includes('activity'))return S.heart;
 if(n.includes('wallet')||n.includes('dollar')||n.includes('calculator')||n.includes('coins'))return S.wallet;if(n.includes('briefcase'))return S.briefcase;
 if(n.includes('scale')||n.includes('gavel')||n.includes('handshake'))return S.scale;if(n.includes('headset')||n.includes('ticket')||n.includes('circle-help'))return S.headset;
 if(n.includes('workflow')||n.includes('network')||n.includes('route')||n.includes('refresh'))return S.workflow;if(n.includes('monitor')||n.includes('laptop'))return S.monitor;
 if(n.includes('download')||n.includes('down'))return S.download;if(n.includes('upload')||n.includes('up'))return S.upload;if(n.includes('check')||n.includes('list-todo')||n.includes('list-check'))return S.check;
 if(n.includes('alert')||n.includes('warning')||n.includes('triangle'))return S.alert;if(n.includes('folder'))return S.folder;if(n.includes('map')||n.includes('compass')||n.includes('construction')||n.includes('scan'))return S.map;
 if(n.includes('tool')||n.includes('cog')||n.includes('paint'))return S.tool;if(n.includes('message')||n.includes('mail'))return S.message;if(n.includes('chart')||n.includes('gauge')||n.includes('presentation'))return S.chart;
 if(n.includes('arrow'))return S.arrow;return S.circle;
}
window.lucide={createIcons:function(options){const attrs=(options&&options.attrs)||{};document.querySelectorAll('[data-lucide]').forEach(el=>{const n=el.getAttribute('data-lucide')||'';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('stroke-width',attrs['stroke-width']||'1.8');svg.setAttribute('aria-hidden','true');svg.innerHTML=pick(n);for(const c of el.classList)svg.classList.add(c);el.replaceWith(svg);});}};
})();
