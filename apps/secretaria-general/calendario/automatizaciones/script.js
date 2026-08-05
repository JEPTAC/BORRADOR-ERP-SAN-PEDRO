let META={templates:[],history:[]},Q='';
document.addEventListener('DOMContentLoaded',async()=>{await Agenda.init('../data.json');META=await ERP.fetchJSON('data.json',{templates:[],history:[]});bind();render();ERP.refreshIcons()});
function bind(){
 document.getElementById('ruleSearch').oninput=e=>{Q=e.target.value.toLowerCase();render()};
 document.getElementById('newRule').onclick=()=>{document.getElementById('ruleForm').reset();ERP.open('ruleModal')};
 document.getElementById('ruleForm').onsubmit=save;
 document.getElementById('testRules').onclick=testRules
}
function rules(){return Agenda.data.automations.filter(r=>!Q||`${r.name} ${r.trigger} ${r.action}`.toLowerCase().includes(Q))}
function render(){
 const list=rules(),active=list.filter(r=>r.active),runs=list.reduce((s,r)=>s+r.runs,0);
 document.getElementById('automationKpis').innerHTML=[['workflow',list.length,'Reglas configuradas'],['toggle-right',active.length,'Reglas activas'],['play',runs,'Ejecuciones acumuladas'],['bell',184,'Alertas generadas'],['clock',27,'Horas administrativas ahorradas']].map(([i,v,l])=>`<div class="kpi"><div class="kpi-icon"><i data-lucide="${i}"></i></div><div><strong>${v}</strong><span>${l}</span></div></div>`).join('');
 document.getElementById('ruleList').innerHTML=list.map(r=>`<article class="rule-card"><div class="rule-icon"><i data-lucide="workflow"></i></div><div class="rule-copy"><strong>${Agenda.escape(r.name)}</strong><div class="rule-flow"><span>${Agenda.escape(r.trigger)}</span><i data-lucide="arrow-right"></i><span>${Agenda.escape(r.action)}</span></div></div><div class="rule-stats"><strong>${r.runs}</strong><span>ejecuciones</span></div><label class="switch"><input type="checkbox" data-toggle="${r.id}" ${r.active?'checked':''}><span></span></label></article>`).join('');
 document.querySelectorAll('[data-toggle]').forEach(x=>x.onchange=()=>{const r=Agenda.data.automations.find(a=>a.id===x.dataset.toggle);r.active=x.checked;Agenda.persist();ERP.toast(x.checked?'Regla activada':'Regla pausada');render()});
 document.getElementById('runHistory').innerHTML=META.history.map(h=>`<div class="history-item"><div class="history-icon"><i data-lucide="check"></i></div><div><strong>${Agenda.escape(h.rule)}</strong><p>${Agenda.escape(h.result)} · ${h.at}</p></div></div>`).join('');
 document.getElementById('templates').innerHTML=META.templates.map((t,i)=>`<div class="template-card"><strong>${Agenda.escape(t.name)}</strong><p>${Agenda.escape(t.trigger)} → ${Agenda.escape(t.action)}</p><button class="btn btn-soft btn-sm" data-template="${i}">Usar plantilla</button></div>`).join('');
 document.querySelectorAll('[data-template]').forEach(x=>x.onclick=()=>useTemplate(Number(x.dataset.template)));ERP.refreshIcons()
}
function save(ev){
 ev.preventDefault();const f=new FormData(ev.target);
 Agenda.data.automations.unshift({id:Agenda.uid('AUT'),name:f.get('name'),trigger:f.get('trigger'),action:`${f.get('action')} · ${f.get('channel')}`,active:f.get('state')==='true',runs:0,scope:f.get('scope')});Agenda.persist();ERP.close('ruleModal');render();ERP.toast('Automatización creada')
}
function useTemplate(i){const t=META.templates[i],f=document.getElementById('ruleForm');f.reset();f.elements.name.value=t.name;[...f.elements.trigger.options].forEach(o=>{if(o.text.includes(t.trigger.split(' ')[0]))o.selected=true});ERP.open('ruleModal')}
function testRules(){
 const active=Agenda.data.automations.filter(r=>r.active);active.forEach(r=>r.runs++);Agenda.persist();META.history.unshift({rule:'Prueba manual de reglas',at:new Date().toLocaleString('es-CO'),result:`${active.length} reglas ejecutadas correctamente`});render();ERP.toast(`${active.length} reglas verificadas`)
}
