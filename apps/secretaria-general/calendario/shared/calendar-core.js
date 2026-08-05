(function(){
  const STORE_KEY='erp-agenda-360-v06';
  const PREF_KEY='erp-agenda-360-prefs-v06';
  const Agenda={
    data:null,
    async init(relative='../data.json'){
      const seed=await ERP.fetchJSON(relative,{events:[],people:[],offices:[],calendars:[],settings:{}});
      const saved=JSON.parse(localStorage.getItem(STORE_KEY)||'null');
      this.data=saved&&saved.version===seed.version?saved:structuredClone(seed);
      if(!saved||saved.version!==seed.version)this.persist();
      return this.data;
    },
    persist(){localStorage.setItem(STORE_KEY,JSON.stringify(this.data))},
    reset(){localStorage.removeItem(STORE_KEY);localStorage.removeItem(PREF_KEY);location.reload()},
    prefs(){
      const base={view:this.data?.settings?.defaultView||'month',focusDate:this.data?.today||new Date().toISOString().slice(0,10),office:'',person:'',query:'',showWeekends:this.data?.settings?.showWeekends!==false};
      return Object.assign(base,JSON.parse(localStorage.getItem(PREF_KEY)||'{}'));
    },
    setPrefs(next){localStorage.setItem(PREF_KEY,JSON.stringify(Object.assign(this.prefs(),next)))},
    uid(prefix='EVT'){return `${prefix}-${new Date().toISOString().slice(2,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`},
    office(id){return this.data.offices.find(x=>x.id===id)||{id,name:id||'Sin dependencia',color:'#667085'}},
    person(id){return this.data.people.find(x=>x.id===id)||{id,name:id||'Sin asignar',role:'',avatar:'NA',office:''}},
    calendar(id){return this.data.calendars.find(x=>x.id===id)||{id,name:'Agenda',color:'#0f4c81',visible:true}},
    type(id){return this.data.eventTypes.find(x=>x.id===id)||{id,name:'Actividad',icon:'calendar',color:'#0f4c81'}},
    parseDate(value){return new Date(`${value}T12:00:00`)},
    iso(date){const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`},
    addDays(value,n){const d=this.parseDate(value);d.setDate(d.getDate()+n);return this.iso(d)},
    startOfWeek(value){const d=this.parseDate(value),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return this.iso(d)},
    minutes(t){const [h,m]=String(t||'00:00').split(':').map(Number);return h*60+m},
    duration(e){if(e.allDay)return 8;return Math.max(0,(this.minutes(e.end)-this.minutes(e.start))/60)},
    dateLabel(value,opts={weekday:'short',day:'2-digit',month:'short'}){return new Intl.DateTimeFormat('es-CO',opts).format(this.parseDate(value))},
    timeLabel(e){return e.allDay?'Todo el día':`${e.start} – ${e.end}`},
    eventDateTime(e){return `${e.date}T${e.allDay?'00:00':e.start}:00`},
    eventsForDate(date){return this.data.events.filter(e=>date>=e.date&&date<=(e.endDate||e.date))},
    visibleEvents(filters={}){
      const visibleCals=new Set(this.data.calendars.filter(x=>x.visible!==false).map(x=>x.id));
      const q=(filters.query||'').toLowerCase().trim();
      return this.data.events.filter(e=>{
        if(!visibleCals.has(e.calendar))return false;
        if(filters.office&&e.office!==filters.office)return false;
        if(filters.person&&![...(e.assignees||[]),...(e.attendees||[])].includes(filters.person))return false;
        if(filters.status&&e.status!==filters.status)return false;
        if(filters.type&&e.type!==filters.type)return false;
        if(q&&!`${e.title} ${e.description||''} ${e.location||''}`.toLowerCase().includes(q))return false;
        return true;
      });
    },
    conflicts(candidate,ignoreId=''){
      if(candidate.allDay)return [];
      const people=new Set([...(candidate.assignees||[]),...(candidate.attendees||[])]);
      const a0=this.minutes(candidate.start),a1=this.minutes(candidate.end);
      return this.data.events.filter(e=>{
        if(e.id===ignoreId||e.allDay||candidate.date!==e.date)return false;
        const shared=[...(e.assignees||[]),...(e.attendees||[])].some(id=>people.has(id));
        if(!shared)return false;
        const b0=this.minutes(e.start),b1=this.minutes(e.end);
        return a0<b1&&b0<a1;
      });
    },
    upsert(event){
      const i=this.data.events.findIndex(x=>x.id===event.id);
      if(i>=0)this.data.events[i]=event;else this.data.events.unshift(event);
      this.persist();return event;
    },
    remove(id){this.data.events=this.data.events.filter(x=>x.id!==id);this.persist()},
    update(id,patch){const e=this.data.events.find(x=>x.id===id);if(!e)return null;Object.assign(e,patch);this.persist();return e},
    createOccurrences(base,repeat,count=6){
      const list=[base];if(!repeat||repeat==='No se repite')return list;
      const step=repeat==='Diario'?1:repeat==='Semanal'?7:repeat==='Quincenal'?14:null;
      for(let i=1;i<count;i++){
        const next=structuredClone(base);next.id=this.uid('EVT');
        if(step){next.date=this.addDays(base.date,step*i);next.endDate=this.addDays(base.endDate||base.date,step*i)}
        else if(repeat==='Mensual'){
          const d=this.parseDate(base.date);d.setMonth(d.getMonth()+i);next.date=this.iso(d);
          const e=this.parseDate(base.endDate||base.date);e.setMonth(e.getMonth()+i);next.endDate=this.iso(e)
        }else break;
        next.seriesId=base.seriesId||base.id;list.push(next)
      }
      return list;
    },
    peopleHtml(ids=[],limit=4){
      const shown=ids.slice(0,limit).map(id=>{const p=this.person(id);return `<span class="avatar" title="${this.escape(p.name)}">${this.escape(p.avatar)}</span>`}).join('');
      const extra=ids.length>limit?`<span class="avatar">+${ids.length-limit}</span>`:'';
      return `<div class="avatar-stack">${shown}${extra}</div>`
    },
    escape(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))},
    downloadICS(events=this.data.events){
      const fmt=v=>String(v).replaceAll('-','');
      const esc=v=>String(v||'').replace(/([,;])/g,'\\$1').replace(/\n/g,'\\n');
      const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Alcaldia San Pedro//Agenda 360//ES','CALSCALE:GREGORIAN'];
      events.forEach(e=>{
        const start=e.allDay?`DTSTART;VALUE=DATE:${fmt(e.date)}`:`DTSTART:${fmt(e.date)}T${e.start.replace(':','')}00`;
        const end=e.allDay?`DTEND;VALUE=DATE:${fmt(this.addDays(e.endDate||e.date,1))}`:`DTEND:${fmt(e.endDate||e.date)}T${e.end.replace(':','')}00`;
        lines.push('BEGIN:VEVENT',`UID:${e.id}@sanpedro-valle.gov.co`,start,end,`SUMMARY:${esc(e.title)}`,`DESCRIPTION:${esc(e.description)}`,`LOCATION:${esc(e.location)}`,'END:VEVENT')
      });
      lines.push('END:VCALENDAR');
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/calendar'}));a.download='agenda-institucional.ics';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)
    },
    csvEvents(events=this.data.events){
      ERP.csv('agenda-institucional.csv',events.map(e=>({
        Código:e.id,Actividad:e.title,Fecha:e.date,Inicio:e.start,Fin:e.end,Tipo:this.type(e.type).name,
        Dependencia:this.office(e.office).name,Estado:e.status,Prioridad:e.priority,
        Responsables:(e.assignees||[]).map(id=>this.person(id).name).join(', '),Avance:`${e.progress||0}%`
      })))
    },
    findSlots(personIds,dateFrom,duration=30,days=7){
      const result=[],start=this.parseDate(dateFrom),settings=this.data.availability||{};
      for(let day=0;day<days&&result.length<12;day++){
        const d=new Date(start);d.setDate(start.getDate()+day);const iso=this.iso(d);
        if(!(settings.workingDays||[1,2,3,4,5]).includes(d.getDay())||(settings.holidays||[]).includes(iso))continue;
        const workStart=this.minutes(this.data.settings.workingStart||'07:00');
        const workEnd=this.minutes(this.data.settings.workingEnd||'17:30');
        const lunch0=this.minutes(settings.lunch?.start||'12:00'),lunch1=this.minutes(settings.lunch?.end||'13:00');
        for(let m=workStart;m+duration<=workEnd;m+=this.data.settings.slotMinutes||30){
          if(m<lunch1&&m+duration>lunch0)continue;
          const startTime=`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
          const endM=m+duration,endTime=`${String(Math.floor(endM/60)).padStart(2,'0')}:${String(endM%60).padStart(2,'0')}`;
          const candidate={date:iso,start:startTime,end:endTime,allDay:false,assignees:personIds,attendees:[]};
          if(!this.conflicts(candidate).length)result.push({date:iso,start:startTime,end:endTime});
          if(result.length>=12)break;
        }
      }
      return result;
    },
    percent(n,d){return d?Math.round(n/d*100):0}
  };
  window.Agenda=Agenda;
})();
