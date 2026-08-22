const FIELDS=[
  {key:'codigo',label:'Código NAAB / registro',required:true,aliases:['codigo','codigo naab','naab','naab code','code','registro','registration number','reg number']},
  {key:'nombre',label:'Nombre del semental',required:true,aliases:['nombre','nombre registrado','semental','toro','bull','bull name','name','short name']},
  {key:'nm',label:'Mérito Neto NM$',aliases:['nm','nm$','net merit','net merit $','merito neto','merito neto usd']},
  {key:'cm',label:'Mérito Quesero CM$',aliases:['cm','cm$','cheese merit','cheese merit $','merito quesero']},
  {key:'milk',label:'Leche PTA (lb)',aliases:['leche','milk','pta leche','pta milk','milk lbs']},
  {key:'fat',label:'Grasa PTA',aliases:['grasa','fat','pta grasa','fat lbs']},
  {key:'beta',label:'Beta caseína',aliases:['beta','beta caseina','beta casein','a2','a2 genotype','a2 genotipo']},
  {key:'kappa',label:'Kappa caseína',aliases:['kappa','kappa caseina','kappa casein','k casein']},
  {key:'ped',label:'Pedigrí',aliases:['pedigri','pedigree','ped','padre x abuelo']},
  {key:'foto',label:'URL de fotografía',aliases:['foto','fotografia','photo','image','image url','photo url']},
  {key:'raza',label:'Raza',aliases:['raza','breed']},
  {key:'activo',label:'Activo / disponible',aliases:['activo','active','disponible','available','status']},
];
const state={headers:[],rawRows:[],mapping:{},rows:[],errors:[],file:null};
const $=selector=>document.querySelector(selector);
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cleanNumber=value=>{if(value===''||value==null)return null;const parsed=Number(String(value).replace(/[$,%\s]/g,'').replace(/,/g,''));return Number.isFinite(parsed)?parsed:null;};
const cleanText=(value,max=220)=>String(value??'').trim().slice(0,max);
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

async function api(path,options={}){
  const response=await fetch(path,{credentials:'same-origin',...options,headers:{...(options.body?{'content-type':'application/json'}:{}),...(options.headers||{})}});
  const data=await response.json().catch(()=>({error:'Respuesta inválida del servidor'}));
  if(!response.ok)throw new Error(data.error||'No se pudo completar la operación');return data;
}
let sessionEmail=null;
function showDashboard(email){sessionEmail=email;$('#loginView').hidden=true;$('#changePasswordView').hidden=true;$('#dashboard').hidden=false;$('#currentUser').textContent=email;loadCatalog();}
function showChangePassword(email){sessionEmail=email;$('#loginView').hidden=true;$('#dashboard').hidden=true;$('#changePasswordView').hidden=false;}
function enterApp(email,forceChange){forceChange?showChangePassword(email):showDashboard(email);}
async function restoreSession(){try{const data=await api('/api/session');if(data.authenticated)enterApp(data.email,data.mustChangePassword);}catch{}}
$('#loginForm').addEventListener('submit',async event=>{event.preventDefault();const status=$('#loginStatus');status.textContent='Validando…';try{const data=await api('/api/login',{method:'POST',body:JSON.stringify({email:$('#email').value,password:$('#password').value})});$('#password').value='';status.textContent='';enterApp(data.email,data.mustChangePassword);}catch(error){status.textContent=error.message;}});
$('#changePasswordForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const status=$('#changePasswordStatus'),current=$('#cpCurrent').value,next=$('#cpNew').value,confirm=$('#cpConfirm').value;
  if(next!==confirm){status.textContent='Las contraseñas nuevas no coinciden.';return;}
  status.textContent='Guardando…';
  try{await api('/api/change-password',{method:'POST',body:JSON.stringify({currentPassword:current,newPassword:next})});$('#cpCurrent').value='';$('#cpNew').value='';$('#cpConfirm').value='';status.textContent='';showDashboard(sessionEmail);}
  catch(error){status.textContent=error.message;}
});
$('#logout').addEventListener('click',async()=>{try{await api('/api/logout',{method:'POST',body:'{}'});}finally{location.reload();}});

const drop=$('#dropZone'),fileInput=$('#fileInput');
['dragenter','dragover'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('drag');}));
['dragleave','drop'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove('drag');}));
drop.addEventListener('drop',event=>{const file=event.dataTransfer.files[0];if(file)readWorkbook(file);});
fileInput.addEventListener('change',()=>{if(fileInput.files[0])readWorkbook(fileInput.files[0]);});
$('#removeFile').addEventListener('click',resetFile);

async function readWorkbook(file){
  const status=$('#publishStatus');status.textContent='';
  if(!/\.(xlsx|xls|csv)$/i.test(file.name)){status.textContent='Usa un archivo .xlsx, .xls o .csv.';return;}
  if(file.size>8*1024*1024){status.textContent='El archivo supera el máximo de 8 MB.';return;}
  try{
    const workbook=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});
    const sheetName=workbook.SheetNames[0],matrix=XLSX.utils.sheet_to_json(workbook.Sheets[sheetName],{header:1,defval:'',raw:false});
    if(matrix.length<2)throw new Error('La primera hoja no contiene filas de datos.');
    state.file={name:file.name,size:file.size,sheet:sheetName};state.headers=matrix[0].map((value,index)=>cleanText(value)||`Columna ${index+1}`);state.rawRows=matrix.slice(1).filter(row=>row.some(value=>cleanText(value)!==''));
    if(state.rawRows.length>500)throw new Error('El archivo tiene más de 500 filas. Divide la carga en varios archivos.');
    autoMap();renderMapping();normalizeRows();
    $('#fileName').textContent=file.name;$('#fileMeta').textContent=`${state.rawRows.length} filas · hoja “${sheetName}” · ${(file.size/1024).toFixed(0)} KB`;$('#fileChip').hidden=false;drop.hidden=true;$('#mappingPanel').hidden=false;$('#previewPanel').hidden=false;
  }catch(error){status.textContent=error.message||'No fue posible leer el archivo.';}
}
function autoMap(){state.mapping={};const normalized=state.headers.map(normalize);FIELDS.forEach(field=>{const aliases=field.aliases.map(normalize);const exact=normalized.findIndex(header=>aliases.includes(header));const partial=normalized.findIndex(header=>aliases.some(alias=>header.includes(alias)||alias.includes(header)));state.mapping[field.key]=exact>=0?exact:(partial>=0?partial:'');});}
function renderMapping(){
  $('#mappingGrid').innerHTML=FIELDS.map(field=>`<div class="map-field"><label>${field.label}${field.required?' <em>*</em>':''}<select data-field="${field.key}"><option value="">Sin asignar</option>${state.headers.map((header,index)=>`<option value="${index}" ${String(state.mapping[field.key])===String(index)?'selected':''}>${escapeHtml(header)}</option>`).join('')}</select></label></div>`).join('');
  document.querySelectorAll('[data-field]').forEach(select=>select.addEventListener('change',()=>{state.mapping[select.dataset.field]=select.value===''?'':Number(select.value);normalizeRows();}));
}
function valueAt(row,key){const index=state.mapping[key];return index===''||index==null?'':row[index];}
function normalizeRows(){
  const used=new Set(Object.values(state.mapping).filter(value=>value!==''));const seen=new Set();state.errors=[];
  state.rows=state.rawRows.map((row,index)=>{
    const codigo=cleanText(valueAt(row,'codigo'),60).toUpperCase(),nombre=cleanText(valueAt(row,'nombre'),120).toUpperCase();const rowErrors=[];
    if(!codigo)rowErrors.push('Falta código');if(!nombre)rowErrors.push('Falta nombre');if(codigo&&seen.has(codigo))rowErrors.push('Código duplicado');seen.add(codigo);
    const genomic_data={};state.headers.forEach((header,col)=>{if(!used.has(col)&&cleanText(row[col])!=='')genomic_data[header]=cleanText(row[col],500);});
    const activeRaw=normalize(valueAt(row,'activo'));const activo=!['no','false','0','inactivo','inactive','agotado'].includes(activeRaw);
    const normalized={codigo,nombre,nm:cleanNumber(valueAt(row,'nm')),cm:cleanNumber(valueAt(row,'cm')),milk:cleanNumber(valueAt(row,'milk')),fat:cleanNumber(valueAt(row,'fat')),beta:cleanText(valueAt(row,'beta'),20).toUpperCase(),kappa:cleanText(valueAt(row,'kappa'),20).toUpperCase(),ped:cleanText(valueAt(row,'ped'),240),foto:cleanText(valueAt(row,'foto'),500),raza:cleanText(valueAt(row,'raza'),50)||'Holstein',activo,genomic_data};
    if(rowErrors.length)state.errors.push({row:index+2,errors:rowErrors});return{...normalized,_errors:rowErrors};
  });renderPreview();
}
function renderPreview(){
  const valid=state.rows.length-state.errors.length;$('#validationSummary').textContent=`${state.rows.length} filas · ${valid} listas · ${state.errors.length} con observaciones`;
  const alert=$('#validationAlert');alert.hidden=!state.errors.length;alert.textContent=state.errors.length?state.errors.slice(0,5).map(item=>`Fila ${item.row}: ${item.errors.join(', ')}`).join(' · '):'';
  $('#previewRows').innerHTML=state.rows.slice(0,12).map(row=>`<tr><td>${escapeHtml(row.codigo||'—')}</td><td>${escapeHtml(row.nombre||'—')}</td><td>${row.nm??'—'}</td><td>${row.cm??'—'}</td><td>${row.milk??'—'}</td><td>${escapeHtml(row.beta||'—')}</td><td>${escapeHtml(row.kappa||'—')}</td><td class="${row._errors.length?'bad':'ok'}">${row._errors.length?'Revisar':'Listo'}</td></tr>`).join('');
  $('#publish').disabled=!state.rows.length||state.errors.length>0;
}
function resetFile(){state.headers=[];state.rawRows=[];state.mapping={};state.rows=[];state.errors=[];state.file=null;fileInput.value='';drop.hidden=false;$('#fileChip').hidden=true;$('#mappingPanel').hidden=true;$('#previewPanel').hidden=true;}
$('#publish').addEventListener('click',async()=>{const button=$('#publish'),status=$('#publishStatus');button.disabled=true;status.textContent='Guardando el catálogo…';try{const rows=state.rows.map(({_errors,...row})=>row);const data=await api('/api/import',{method:'POST',body:JSON.stringify({filename:state.file.name,sheet:state.file.sheet,rows})});status.textContent=`✓ ${data.imported} sementales guardados correctamente.`;await loadCatalog();}catch(error){status.textContent=error.message;button.disabled=false;}});
let catalogRows=[],catalogSearch='';
async function loadCatalog(){try{const data=await api('/api/sires');catalogRows=data.sires||[];$('#totalSires').textContent=catalogRows.length;$('#activeSires').textContent=catalogRows.filter(row=>row.activo).length;$('#a2Sires').textContent=catalogRows.filter(row=>row.beta==='A2/A2').length;$('#lastImport').textContent=data.lastImport?new Date(data.lastImport).toLocaleDateString('es-MX'):'—';renderCatalogRows();}catch(error){$('#existingRows').innerHTML=`<tr><td colspan="8" class="empty">${escapeHtml(error.message)}</td></tr>`;}}
function renderCatalogRows(){
  const term=normalize(catalogSearch);
  const rows=catalogRows.filter(row=>!term||normalize(row.codigo).includes(term)||normalize(row.nombre).includes(term));
  $('#existingRows').innerHTML=rows.length?rows.map(row=>`<tr><td>${escapeHtml(row.codigo)}</td><td>${escapeHtml(row.nombre)}</td><td>${row.nm??'—'}</td><td>${escapeHtml(row.beta||'—')}</td><td>${escapeHtml(row.kappa||'—')}</td><td><span class="status-pill ${row.activo?'on':'off'}">${row.activo?'Activo':'Inactivo'}</span></td><td>${row.updated_at?new Date(row.updated_at).toLocaleDateString('es-MX'):'—'}</td><td class="row-actions"><a class="text-btn" href="editor.html?codigo=${encodeURIComponent(row.codigo)}">Editar</a>${row.activo?`<button class="text-btn danger" data-deactivate="${escapeHtml(row.codigo)}">Eliminar</button>`:`<button class="text-btn" data-restore="${escapeHtml(row.codigo)}">Restaurar</button>`}</td></tr>`).join(''):'<tr><td colspan="8" class="empty">Sin resultados.</td></tr>';
}
$('#catalogSearch').addEventListener('input',event=>{catalogSearch=event.target.value;renderCatalogRows();});
$('#existingRows').addEventListener('click',async event=>{
  const deactivate=event.target.closest('[data-deactivate]'),restore=event.target.closest('[data-restore]');
  if(deactivate){const codigo=deactivate.dataset.deactivate;if(!confirm(`¿Desactivar a ${codigo}? Dejará de mostrarse en el sitio, pero podrás restaurarlo después.`))return;try{await api(`/api/sires/${encodeURIComponent(codigo)}`,{method:'DELETE'});await loadCatalog();}catch(error){alert(error.message);}return;}
  if(restore){const codigo=restore.dataset.restore;try{await api(`/api/sires/${encodeURIComponent(codigo)}/restore`,{method:'POST',body:'{}'});await loadCatalog();}catch(error){alert(error.message);}}
});
$('#refresh').addEventListener('click',loadCatalog);
$('#downloadTemplate').addEventListener('click',()=>{const headers=['Código NAAB','Nombre','NM$','CM$','Leche PTA','Grasa PTA','Beta caseína','Kappa caseína','Pedigrí','URL fotografía','Raza','Activo','TPI','DPR','SCS','Vida productiva'];const example=['100HO12366','MAXWELL',955,992,1293,93,'A2/A2','BB','Undertone × Upside × Captain','','Holstein','Sí',3000,1.2,2.68,5.4];const book=XLSX.utils.book_new(),sheet=XLSX.utils.aoa_to_sheet([headers,example]);XLSX.utils.book_append_sheet(book,sheet,'Sementales');XLSX.writeFile(book,'plantilla-sementales-genetica-universal.xlsx');});
restoreSession();
