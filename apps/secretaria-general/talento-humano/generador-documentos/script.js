document.addEventListener('DOMContentLoaded',()=>HR.init({init:()=>HROps.init({after(data){
 const newBtn=document.getElementById('opsNew'); if(newBtn)newBtn.innerHTML='<i data-lucide="file-text"></i> Generar borrador';
 const form=document.getElementById('opsForm');
 form?.addEventListener('submit',()=>setTimeout(()=>{
  const rows=HR.load('generador-documentos-generados',[]),r=rows[0];if(!r)return;
  const body=`ALCALDÍA MUNICIPAL DE SAN PEDRO - VALLE DEL CAUCA\n\n${String(r.document||'DOCUMENTO').toUpperCase()}\nCódigo: ${r.code||'Sin código'}\nPersona: ${r.person||'Sin definir'}\nFecha: ${r.created||''}\nResponsable: ${r.owner||''}\n\nBORRADOR GENERADO PARA REVISIÓN, FIRMA Y NOTIFICACIÓN.\n`;
  const blob=new Blob([body],{type:'application/msword'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${r.code||'documento'}.doc`;a.click();URL.revokeObjectURL(a.href);ERP.toast('Borrador generado y asociado al expediente');
 },30));ERP.refreshIcons();}})}));
