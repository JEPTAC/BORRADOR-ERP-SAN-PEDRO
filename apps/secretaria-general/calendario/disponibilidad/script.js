let D={week:'2026-08-03',people:['P001','P003','P004'],duration:60,selected:null};
document.addEventListener('DOMContentLoaded',async()=>{await Agenda.init('../data.json');D.week=Agenda.startOfWeek(Agenda.data.today);buildPeople();bind();render();ERP.refreshIcons()});
function buildPeople(){
 document.getElementById('peopleSelection').innerHTML=Agenda.data.people.map(p=>`<span class="person-option"><input id="dp-${p.id}" value="${p.id}" type="checkbox" ${D.people.includes(p.id)?'checked':''}><label for="dp-${p.id}"><span class="avatar">${p.avatar}</span>${Agenda.escape(p.name.split(' ').slice(0,2).join(' '))}</label></span>`).join('');
 document.getElementById('weekDate').value=D.week
}
function bind(){
 document.getElementById('peopleSelection').onchange=()=>{D.people=[...document.querySelectorAll('#peopleSelection input:checked')].map(x=>x.value);render()};
 document.getElementById('duration').onchange=e=>{D.duration=Number(e.target.value);render()};
 document.getElementById('weekDate').onchange=e=>{D.week=Agenda.startOfWeek(e.target.value);render()};
 document.getElementById('findSlots').onclick=render;
 document.getElementById('previousWeek').onclick=()=>{D.week=Agenda.addDays(D.week,-7);document.getElementById('weekDate').value=D.week;render()};
 document.getElementById('nextWeek').onclick=()=>{D.week=Agenda.addDays(D.week,7);document.getElementById('weekDate').value=D.week;render()};
 document.getElementById('createFromSlot').onclick=()=>{if(!D.selected)return ERP.toast('Selecciona uno de los espacios sugeridos','error');const [date,start,end]=D.selected.split('|');location.href=`../index.html?new=1&date=${date}&start=${start}&end=${end}&people=${D.people.join(',')}`}
}
function render(){
 const days=Array.from({length:5},(_,i)=>Agenda.addDays(D.week,i)),start=7*60,end=18*60,step=30,rows=[];
 rows.push(`<div class="av-head"></div>${days.map(d=>`<div class="av-head"><strong>${Agenda.dateLabel(d,{weekday:'long'})}</strong><span>${Agenda.dateLabel(d,{day:'2-digit',month:'short'})}</span></div>`).join('')}`);
 for(let m=start;m<end;m+=step){
   const time=`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
   rows.push(`<div class="av-time">${time}</div>${days.map(d=>cell(d,time,step)).join('')}`)
 }
 const grid=document.getElementById('availabilityGrid');grid.innerHTML=rows.join('');
 grid.querySelectorAll('[data-slot]').forEach(x=>x.onclick=()=>{D.selected=x.dataset.slot;render()});
 const slots=Agenda.findSlots(D.people,D.week,D.duration,7).filter(s=>s.date<=Agenda.addDays(D.week,6)).slice(0,8);
 document.getElementById('bestSlots').innerHTML=slots.map((s,i)=>`<div class="slot-item ${D.selected===`${s.date}|${s.start}|${s.end}`?'active':''}" data-best="${s.date}|${s.start}|${s.end}"><strong>${Agenda.dateLabel(s.date,{weekday:'long',day:'2-digit',month:'short'})}</strong><span>${s.start} – ${s.end} · ${D.people.length} participantes</span></div>`).join('')||'<div class="empty-mini">No hay espacios comunes en la semana.</div>';
 document.querySelectorAll('[data-best]').forEach(x=>x.onclick=()=>{D.selected=x.dataset.best;render()});
 const a=Agenda.data.availability;
 document.getElementById('workRules').innerHTML=`<div class="rule-row"><span>Jornada</span><strong>${Agenda.data.settings.workingStart} – ${Agenda.data.settings.workingEnd}</strong></div><div class="rule-row"><span>Almuerzo</span><strong>${a.lunch.start} – ${a.lunch.end}</strong></div><div class="rule-row"><span>Separación</span><strong>${a.bufferMinutes} min</strong></div><div class="rule-row"><span>Festivos bloqueados</span><strong>${a.holidays.length}</strong></div>`;
 ERP.refreshIcons()
}
function cell(date,time,step){
 const m=Agenda.minutes(time),l0=Agenda.minutes(Agenda.data.availability.lunch.start),l1=Agenda.minutes(Agenda.data.availability.lunch.end);
 if(m>=l0&&m<l1)return `<div class="av-cell busy" data-label="Pausa institucional"></div>`;
 let free=0;D.people.forEach(id=>{const c={date,start:time,end:add(time,step),allDay:false,assignees:[id],attendees:[]};if(!Agenda.conflicts(c).length)free++});
 const cls=free===D.people.length?'free':free===0?'busy':'partial',slot=`${date}|${time}|${add(time,D.duration)}`;
 const valid=free===D.people.length && Agenda.minutes(time)+D.duration<=18*60;
 return `<div class="av-cell ${cls} ${D.selected===slot?'selected':''}" ${valid?`data-slot="${slot}"`:''} data-label="${free}/${D.people.length} disponibles"></div>`
}
function add(t,n){const m=Agenda.minutes(t)+n;return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
