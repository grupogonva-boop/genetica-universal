const TRAIT_TEMPLATE=[
  ['Estatura','Baja','Alta'],['Fortaleza','Débil','Fuerte'],['Profundidad corporal','Poco profunda','Profunda'],
  ['Fortaleza lechera','Costilla cerrada','Costilla abierta'],['Ángulo de grupa','Isquiones altos','Isquiones bajos'],['Ancho de grupa','Angosta','Ancha'],
  ['Patas vista lateral','Rectas','Curvas'],['Patas vista posterior','Cerradas','Rectas'],['Ángulo de pie','Bajo','Alto'],['Score de patas','Bajo','Alto'],
  ['Inserción ubre anterior','Débil','Fuerte'],['Altura ubre posterior','Baja','Alta'],['Ancho ubre posterior','Angosta','Ancha'],['Hendidura de ubre','Débil','Fuerte'],
  ['Profundidad de ubre','Profunda','Poco profunda'],['Colocación pezones','Alejados','Centrados'],['Pezón posterior','Alejados','Centrados'],['Largo de pezones','Cortos','Largos'],
];
const FIELDS=[
  {key:'codigo',label:'Código NAAB',required:true,aliases:['codigo','codigo naab','naab','naab code','code','registro','registration number','reg number']},
  {key:'nombre',label:'Nombre',required:true,aliases:['nombre','semental','toro','bull','bull name','name','short name']},
  {key:'nombreRegistrado',label:'Nombre registrado',aliases:['nombre registrado','registered name']},
  {key:'disponibilidad',label:'Presentación',aliases:['presentacion','disponibilidad','availability']},
  {key:'raza',label:'Raza',aliases:['raza','breed']},
  {key:'beta',label:'Beta caseína',aliases:['beta','beta caseina','beta casein','a2','a2 genotype','a2 genotipo']},
  {key:'kappa',label:'Kappa caseína',aliases:['kappa','kappa caseina','kappa casein','k casein']},
  {key:'activo',label:'Activo',aliases:['activo','active','disponible','available','status']},
  {key:'ped',label:'Pedigrí corto',aliases:['pedigri','pedigree','ped','padre x abuelo']},
  {key:'sireName',label:'Sire (nombre completo)',aliases:['sire','sire nombre completo','padre']},
  {key:'damName',label:'Dam (nombre completo)',aliases:['dam','dam nombre completo','madre nombre']},
  {key:'dam',label:'Madre (texto libre)',aliases:['madre texto libre','madre']},
  {key:'mgd',label:'Abuela materna (MGD)',aliases:['mgd','abuela materna']},
  {key:'mgs',label:'Abuelo materno (MGS)',aliases:['mgs','abuelo materno']},
  {key:'mggs',label:'Bisabuelo materno (MGGS)',aliases:['mggs','bisabuelo materno']},
  {key:'mggd',label:'Bisabuela materna (MGGD)',aliases:['mggd','bisabuela materna']},
  {key:'reg',label:'Registro',aliases:['registro','reg']},
  {key:'dob',label:'Nacimiento',aliases:['nacimiento','dob','fecha de nacimiento','birth date']},
  {key:'haplotipos',label:'Haplotipos',aliases:['haplotipos','haplotypes']},
  {key:'aaa',label:'aAa',aliases:['aaa']},
  {key:'source',label:'Fuente',aliases:['fuente','source']},
  {key:'sourceUrl',label:'URL de fuente',aliases:['url de fuente','source url']},
  {key:'foto',label:'URL de foto principal',aliases:['foto','fotografia','photo','image','image url','photo url','url de foto principal']},
  {key:'fotoAlt',label:'URL de foto (otro ángulo)',aliases:['foto alt','otro angulo','url de foto otro angulo']},
  {key:'milk',label:'Leche PTA (lb)',aliases:['leche','milk','pta leche','pta milk','milk lbs','leche pta lb']},
  {key:'milkR',label:'Confiabilidad leche (%)',aliases:['confiabilidad leche','milk r','milkr']},
  {key:'fat',label:'Grasa PTA',aliases:['grasa','fat','pta grasa','fat lbs','grasa pta']},
  {key:'fatPct',label:'Grasa %',aliases:['grasa %','fat pct','fat percent']},
  {key:'protein',label:'Proteína PTA',aliases:['proteina','protein','proteina pta']},
  {key:'proteinPct',label:'Proteína %',aliases:['proteina %','protein pct']},
  {key:'tpi',label:'TPI',aliases:['tpi']},
  {key:'nm',label:'NM$',aliases:['nm','nm$','net merit','net merit $','merito neto','merito neto usd']},
  {key:'cm',label:'CM$',aliases:['cm','cm$','cheese merit','cheese merit $','merito quesero']},
  {key:'cfp',label:'CFP',aliases:['cfp']},
  {key:'feedSaved',label:'Feed Saved',aliases:['feed saved','feedsaved']},
  {key:'pl',label:'Vida productiva (PL)',aliases:['vida productiva','pl']},
  {key:'dpr',label:'DPR',aliases:['dpr']},
  {key:'ccr',label:'CCR',aliases:['ccr']},
  {key:'sce',label:'SCE',aliases:['sce']},
  {key:'scs',label:'SCS',aliases:['scs']},
  {key:'mastitis',label:'Mastitis',aliases:['mastitis']},
  {key:'fertIndex',label:'Índice de fertilidad',aliases:['indice de fertilidad','fert index']},
  {key:'livability',label:'Viabilidad',aliases:['viabilidad','livability']},
  {key:'ptat',label:'PTAT',aliases:['ptat']},
  {key:'udc',label:'UDC',aliases:['udc']},
  {key:'flc',label:'FLC',aliases:['flc']},
  {key:'hcc',label:'HCC',aliases:['hcc']},
  {key:'sta',label:'STA',aliases:['sta']},
  ...TRAIT_TEMPLATE.map(([label],i)=>({key:`trait_${i}`,label:`Rasgo: ${label}`,aliases:[label,`rasgo ${label}`]})),
];
const DISPONIBILIDAD_MAP={'sexado':'sex','convencional':'conv','sexado convencional':'conv-sex','sexado + convencional':'conv-sex','super convencional':'s-conv'};
const state={headers:[],rawRows:[],mapping:{},rows:[],errors:[],file:null};
const $=selector=>document.querySelector(selector);
const normalize=value=>String(value??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
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
    const disponibilidadRaw=normalize(valueAt(row,'disponibilidad'));const disponibilidad=DISPONIBILIDAD_MAP[disponibilidadRaw]||(['sex','conv','conv-sex','s-conv'].includes(disponibilidadRaw)?disponibilidadRaw:'');
    const traits=TRAIT_TEMPLATE.map(([label,left,right],i)=>{const value=cleanNumber(valueAt(row,`trait_${i}`))??0;return[label,value,left,right,value<0?left:right];});
    const normalized={
      codigo,nombre,
      nombreRegistrado:cleanText(valueAt(row,'nombreRegistrado'),160),
      disponibilidad,
      raza:cleanText(valueAt(row,'raza'),50)||'Holstein',
      beta:cleanText(valueAt(row,'beta'),20).toUpperCase(),
      kappa:cleanText(valueAt(row,'kappa'),20).toUpperCase(),
      activo,
      ped:cleanText(valueAt(row,'ped'),240),
      sireName:cleanText(valueAt(row,'sireName'),200),
      damName:cleanText(valueAt(row,'damName'),200),
      dam:cleanText(valueAt(row,'dam'),200),
      mgd:cleanText(valueAt(row,'mgd'),200),
      mgs:cleanText(valueAt(row,'mgs'),200),
      mggs:cleanText(valueAt(row,'mggs'),200),
      mggd:cleanText(valueAt(row,'mggd'),200),
      reg:cleanText(valueAt(row,'reg'),60),
      dob:cleanText(valueAt(row,'dob'),20),
      haplotipos:cleanText(valueAt(row,'haplotipos'),20),
      aaa:cleanText(valueAt(row,'aaa'),40),
      source:cleanText(valueAt(row,'source'),120),
      sourceUrl:cleanText(valueAt(row,'sourceUrl'),500),
      foto:cleanText(valueAt(row,'foto'),500),
      fotoAlt:cleanText(valueAt(row,'fotoAlt'),500),
      milk:cleanNumber(valueAt(row,'milk')),milkR:cleanNumber(valueAt(row,'milkR')),
      fat:cleanNumber(valueAt(row,'fat')),fatPct:cleanNumber(valueAt(row,'fatPct')),
      protein:cleanNumber(valueAt(row,'protein')),proteinPct:cleanNumber(valueAt(row,'proteinPct')),
      tpi:cleanNumber(valueAt(row,'tpi')),
      nm:cleanNumber(valueAt(row,'nm')),cm:cleanNumber(valueAt(row,'cm')),cfp:cleanNumber(valueAt(row,'cfp')),feedSaved:cleanNumber(valueAt(row,'feedSaved')),
      pl:cleanNumber(valueAt(row,'pl')),dpr:cleanNumber(valueAt(row,'dpr')),ccr:cleanNumber(valueAt(row,'ccr')),sce:cleanNumber(valueAt(row,'sce')),scs:cleanNumber(valueAt(row,'scs')),
      mastitis:cleanNumber(valueAt(row,'mastitis')),fertIndex:cleanNumber(valueAt(row,'fertIndex')),livability:cleanNumber(valueAt(row,'livability')),
      ptat:cleanNumber(valueAt(row,'ptat')),udc:cleanNumber(valueAt(row,'udc')),flc:cleanNumber(valueAt(row,'flc')),hcc:cleanNumber(valueAt(row,'hcc')),sta:cleanNumber(valueAt(row,'sta')),
      traits,genomic_data,
    };
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
  $('#existingRows').innerHTML=rows.length?rows.map(row=>`<tr><td>${escapeHtml(row.codigo)}</td><td>${escapeHtml(row.nombre)}</td><td>${row.nm??'—'}</td><td>${escapeHtml(row.beta||'—')}</td><td>${escapeHtml(row.kappa||'—')}</td><td><span class="status-pill ${row.activo?'on':'off'}">${row.activo?'Activo':'Inactivo'}</span></td><td>${row.updated_at?new Date(row.updated_at).toLocaleDateString('es-MX'):'—'}</td><td class="row-actions"><a class="text-btn" href="editor.html?codigo=${encodeURIComponent(row.codigo)}">Editar</a>${row.activo?`<button class="text-btn danger" data-deactivate="${escapeHtml(row.codigo)}">Eliminar</button>`:`<button class="text-btn" data-restore="${escapeHtml(row.codigo)}">Restaurar</button><button class="text-btn danger" data-purge="${escapeHtml(row.codigo)}">Borrar definitivo</button>`}</td></tr>`).join(''):'<tr><td colspan="8" class="empty">Sin resultados.</td></tr>';
}
$('#catalogSearch').addEventListener('input',event=>{catalogSearch=event.target.value;renderCatalogRows();});
$('#existingRows').addEventListener('click',async event=>{
  const deactivate=event.target.closest('[data-deactivate]'),restore=event.target.closest('[data-restore]'),purge=event.target.closest('[data-purge]');
  if(deactivate){const codigo=deactivate.dataset.deactivate;if(!confirm(`¿Desactivar a ${codigo}? Dejará de mostrarse en el sitio, pero podrás restaurarlo después.`))return;try{await api(`/api/sires/${encodeURIComponent(codigo)}`,{method:'DELETE'});await loadCatalog();}catch(error){alert(error.message);}return;}
  if(restore){const codigo=restore.dataset.restore;try{await api(`/api/sires/${encodeURIComponent(codigo)}/restore`,{method:'POST',body:'{}'});await loadCatalog();}catch(error){alert(error.message);}return;}
  if(purge){const codigo=purge.dataset.purge;if(!confirm(`¿Borrar definitivamente a ${codigo}? Esto elimina el registro y sus fotos/PDF. No se puede deshacer.`))return;try{await api(`/api/sires/${encodeURIComponent(codigo)}/purge`,{method:'DELETE'});await loadCatalog();}catch(error){alert(error.message);}}
});
$('#refresh').addEventListener('click',loadCatalog);
$('#downloadTemplate').addEventListener('click',()=>{
  const headers=FIELDS.map(field=>field.label);
  const exampleByKey={
    codigo:'100HO12366',nombre:'MAXWELL',nombreRegistrado:'Maxwell-ET',disponibilidad:'Sexado',raza:'Holstein',beta:'A2/A2',kappa:'BB',activo:'Sí',
    ped:'Undertone × Upside × Captain',sireName:'Peak Undertone-ET',damName:'Peak Upside-ET',dam:'Peak Upside-ET VG-86',
    mgd:'Peak Captain Dam-ET',mgs:'Peak Captain-ET',mggs:'Peak Sire Ancestro-ET',mggd:'Peak Dam Ancestro-ET',
    reg:'US123456789',dob:'03/2024',haplotipos:'HH1F',aaa:'1-2-6-4-5',source:'Catálogo oficial',sourceUrl:'',
    foto:'',fotoAlt:'',
    milk:1293,milkR:82,fat:93,fatPct:0.15,protein:60,proteinPct:0.08,tpi:3000,
    nm:955,cm:992,cfp:85,feedSaved:104,
    pl:5.4,dpr:1.2,ccr:1.5,sce:1.7,scs:2.68,mastitis:-0.4,fertIndex:0.1,livability:-1.6,
    ptat:0.99,udc:0.74,flc:0.09,hcc:1.38,sta:0.56,
  };
  const example=FIELDS.map(field=>field.key.startsWith('trait_')?0:(exampleByKey[field.key]??''));
  const book=XLSX.utils.book_new(),sheet=XLSX.utils.aoa_to_sheet([headers,example]);XLSX.utils.book_append_sheet(book,sheet,'Sementales');XLSX.writeFile(book,'plantilla-sementales-genetica-universal.xlsx');
});
restoreSession();
