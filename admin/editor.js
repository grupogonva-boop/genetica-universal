const $=selector=>document.querySelector(selector);
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
async function api(path,options={}){
  const response=await fetch(path,{credentials:'same-origin',...options,headers:{...(options.body?{'content-type':'application/json'}:{}),...(options.headers||{})}});
  const data=await response.json().catch(()=>({error:'Respuesta inválida del servidor'}));
  if(!response.ok)throw new Error(data.error||'No se pudo completar la operación');return data;
}
async function upload(codigo,slot,file){
  const form=new FormData();form.append('codigo',codigo);form.append('slot',slot);form.append('file',file);
  const response=await fetch('/api/upload',{method:'POST',credentials:'same-origin',body:form});
  const data=await response.json().catch(()=>({error:'Respuesta inválida del servidor'}));
  if(!response.ok)throw new Error(data.error||'No se pudo subir el archivo');return data;
}

const SECTIONS={
  fieldsIdentidad:[
    {key:'codigo',label:'Código NAAB',required:true},
    {key:'nombre',label:'Nombre',required:true},
    {key:'nombreRegistrado',label:'Nombre registrado'},
    {key:'disponibilidad',label:'Presentación',type:'select',options:[['','Consultar'],['sex','Sexado'],['conv','Convencional'],['conv-sex','Sexado + Convencional'],['s-conv','Súper convencional']]},
    {key:'raza',label:'Raza'},{key:'beta',label:'Beta caseína'},{key:'kappa',label:'Kappa caseína'},
  ],
  fieldsPedigri:[
    {key:'ped',label:'Pedigrí corto (Sire × MGS × MGGS)'},{key:'sireName',label:'Sire (nombre completo)'},{key:'damName',label:'Dam (nombre completo)'},
    {key:'dam',label:'Madre (texto libre)'},{key:'mgd',label:'Abuela materna (MGD)'},{key:'mgs',label:'Abuelo materno (MGS)'},{key:'mggs',label:'Bisabuelo materno (MGGS)'},{key:'mggd',label:'Bisabuela materna (MGGD)'},{key:'reg',label:'Registro'},{key:'dob',label:'Nacimiento'},
    {key:'haplotipos',label:'Haplotipos'},{key:'aaa',label:'aAa'},{key:'source',label:'Fuente'},{key:'sourceUrl',label:'URL de fuente'},
  ],
  fieldsProduccion:[
    {key:'milk',label:'Leche PTA (lb)',type:'number'},{key:'milkR',label:'Confiabilidad leche (%)',type:'number'},
    {key:'fat',label:'Grasa (lb)',type:'number'},{key:'fatPct',label:'Grasa %',type:'number',step:'0.01'},
    {key:'protein',label:'Proteína (lb)',type:'number'},{key:'proteinPct',label:'Proteína %',type:'number',step:'0.01'},{key:'tpi',label:'TPI',type:'number'},
  ],
  fieldsEconomia:[
    {key:'nm',label:'NM$',type:'number'},{key:'cm',label:'CM$',type:'number'},{key:'cfp',label:'CFP',type:'number'},{key:'feedSaved',label:'Feed Saved',type:'number'},
  ],
  fieldsSalud:[
    {key:'pl',label:'Vida productiva (PL)',type:'number',step:'0.1'},{key:'dpr',label:'DPR',type:'number',step:'0.1'},{key:'ccr',label:'CCR',type:'number',step:'0.1'},
    {key:'sce',label:'SCE',type:'number',step:'0.1'},{key:'scs',label:'SCS',type:'number',step:'0.01'},{key:'mastitis',label:'Mastitis',type:'number',step:'0.1'},
    {key:'fertIndex',label:'Índice de fertilidad',type:'number',step:'0.1'},{key:'livability',label:'Viabilidad',type:'number',step:'0.1'},
  ],
  fieldsConformacion:[
    {key:'ptat',label:'PTAT',type:'number',step:'0.01'},{key:'udc',label:'UDC',type:'number',step:'0.01'},{key:'flc',label:'FLC',type:'number',step:'0.01'},
    {key:'hcc',label:'HCC',type:'number',step:'0.01'},{key:'sta',label:'STA',type:'number',step:'0.01'},
  ],
};
const TRAIT_TEMPLATE=[
  ['Estatura','Baja','Alta'],['Fortaleza','Débil','Fuerte'],['Profundidad corporal','Poco profunda','Profunda'],
  ['Fortaleza lechera','Costilla cerrada','Costilla abierta'],['Ángulo de grupa','Isquiones altos','Isquiones bajos'],['Ancho de grupa','Angosta','Ancha'],
  ['Patas vista lateral','Rectas','Curvas'],['Patas vista posterior','Cerradas','Rectas'],['Ángulo de pie','Bajo','Alto'],['Score de patas','Bajo','Alto'],
  ['Inserción ubre anterior','Débil','Fuerte'],['Altura ubre posterior','Baja','Alta'],['Ancho ubre posterior','Angosta','Ancha'],['Hendidura de ubre','Débil','Fuerte'],
  ['Profundidad de ubre','Profunda','Poco profunda'],['Colocación pezones','Alejados','Centrados'],['Pezón posterior','Alejados','Centrados'],['Largo de pezones','Cortos','Largos'],
];

const params=new URLSearchParams(location.search);
const editCodigo=(params.get('codigo')||'').trim().toUpperCase();
let sire={activo:true,ancestors:[],traits:TRAIT_TEMPLATE.map(([label,left,right])=>[label,0,left,right,right])};

function renderFields(){
  for(const [containerId,fields] of Object.entries(SECTIONS)){
    $(`#${containerId}`).innerHTML=fields.map(field=>`<label>${field.label}${field.required?' <em style="color:#ff646a">*</em>':''}<${field.type==='select'?'select':'input'} data-key="${field.key}" ${field.type==='number'?`type="number" step="${field.step||'any'}"`:''}>${field.type==='select'?field.options.map(([value,label])=>`<option value="${value}">${escapeHtml(label)}</option>`).join(''):''}</${field.type==='select'?'select':'input'}></label>`).join('');
  }
  document.querySelectorAll('.field-grid [data-key]').forEach(input=>input.addEventListener('input',()=>{sire[input.dataset.key]=input.type==='number'?(input.value===''?null:Number(input.value)):input.value;refreshPreview();}));
}
function fillFields(){
  document.querySelectorAll('.field-grid [data-key]').forEach(input=>{const value=sire[input.dataset.key];input.value=value==null?'':value;});
  $('#activoCheck').checked=sire.activo!==false;
}

function renderAncestors(){
  $('#ancestorList').innerHTML=sire.ancestors.map((a,i)=>`<div class="ancestor-row" data-i="${i}">
    <label class="mini-drop${a.foto?' has-img':''}" data-ancestor="${i}">${a.foto?`<img src="${a.foto}" alt="">`:''}<input type="file" accept="image/jpeg,image/png,image/webp"><span>Foto</span></label>
    <label>Relación<input data-ancestor-field="relation" data-i="${i}" value="${escapeHtml(a.relation||'')}" placeholder="Madre, Padre, Abuela…"></label>
    <label>Nombre<input data-ancestor-field="name" data-i="${i}" value="${escapeHtml(a.name||'')}"></label>
    <button type="button" class="remove-ancestor" data-remove="${i}" aria-label="Quitar">×</button>
  </div>`).join('')||'<p style="color:#707583;font-size:.72rem">Sin familiares agregados.</p>';
  document.querySelectorAll('[data-ancestor-field]').forEach(input=>input.addEventListener('input',()=>{sire.ancestors[Number(input.dataset.i)][input.dataset.ancestorField]=input.value;refreshPreview();}));
  document.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{sire.ancestors.splice(Number(btn.dataset.remove),1);renderAncestors();refreshPreview();}));
  document.querySelectorAll('[data-ancestor]').forEach(drop=>{
    const input=drop.querySelector('input');
    drop.addEventListener('click',event=>{if(event.target===input)return;});
    input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;await handleAncestorUpload(Number(drop.dataset.ancestor),file);});
  });
}
async function handleAncestorUpload(index,file){
  const codigo=(sire.codigo||'').toUpperCase();
  if(!/^[A-Z0-9]{3,20}$/.test(codigo)){$('#editorStatus').textContent='Escribe primero un código NAAB válido antes de subir fotos.';return;}
  $('#editorStatus').textContent='Subiendo fotografía…';
  try{const {url}=await upload(codigo,'ancestor',file);sire.ancestors[index].foto=url;renderAncestors();refreshPreview();$('#editorStatus').textContent='';}
  catch(error){$('#editorStatus').textContent=error.message;}
}
$('#addAncestor').addEventListener('click',()=>{sire.ancestors.push({relation:'',name:'',foto:''});renderAncestors();});

function renderTraits(){
  $('#traitsGrid').innerHTML=sire.traits.map((trait,i)=>`<div class="trait-row"><label>${escapeHtml(trait[0])} <small style="color:#686d79">(${trait[2]} → ${trait[3]})</small></label><input type="number" step="0.01" data-trait="${i}" value="${trait[1]}"></div>`).join('');
  document.querySelectorAll('[data-trait]').forEach(input=>input.addEventListener('input',()=>{const i=Number(input.dataset.trait),value=input.value===''?0:Number(input.value);sire.traits[i][1]=value;sire.traits[i][4]=value<0?sire.traits[i][2]:sire.traits[i][3];refreshPreview();}));
}

function setupDropzone(id,slot,getUrl,setUrl){
  const drop=$(id),input=drop.querySelector('input');
  const removeBtn=document.createElement('button');
  removeBtn.type='button';removeBtn.className='mini-drop-remove';removeBtn.hidden=true;removeBtn.setAttribute('aria-label','Quitar archivo');removeBtn.textContent='×';
  drop.appendChild(removeBtn);
  removeBtn.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();input.value='';setUrl('');paintDropzone(drop,slot,'');refreshPreview();});
  ['dragenter','dragover'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('drag');}));
  ['dragleave','drop'].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove('drag');}));
  drop.addEventListener('drop',event=>{const file=event.dataTransfer.files[0];if(file)handleUpload(file);});
  input.addEventListener('change',()=>{const file=input.files[0];if(file)handleUpload(file);});
  async function handleUpload(file){
    const codigo=(sire.codigo||'').toUpperCase();
    if(!/^[A-Z0-9]{3,20}$/.test(codigo)){$('#editorStatus').textContent='Escribe primero un código NAAB válido antes de subir archivos.';return;}
    $('#editorStatus').textContent='Subiendo archivo…';
    try{const {url}=await upload(codigo,slot,file);setUrl(url);paintDropzone(drop,slot,url);refreshPreview();$('#editorStatus').textContent='';}
    catch(error){$('#editorStatus').textContent=error.message;}
  }
  return()=>paintDropzone(drop,slot,getUrl());
}
function paintDropzone(drop,slot,url){
  drop.querySelectorAll('img').forEach(img=>img.remove());
  const span=drop.querySelector('span'),removeBtn=drop.querySelector('.mini-drop-remove');
  if(removeBtn)removeBtn.hidden=!url;
  if(url&&slot!=='ficha'){drop.classList.add('has-img');const img=document.createElement('img');img.src=url;drop.insertBefore(img,drop.firstChild);span.textContent=slot==='main'?'Foto principal':'Otro ángulo';}
  else if(url&&slot==='ficha'){drop.classList.remove('has-img');span.textContent='PDF cargado ✓';}
  else{drop.classList.remove('has-img');span.textContent=slot==='main'?'Foto principal':slot==='alt'?'Otro ángulo':'Ficha PDF';}
}

const paintMain=setupDropzone('#dropMain','main',()=>sire.foto,url=>sire.foto=url);
const paintAlt=setupDropzone('#dropAlt','alt',()=>sire.fotoAlt,url=>sire.fotoAlt=url);
const paintFicha=setupDropzone('#dropFicha','ficha',()=>sire.fichaPdfUrl,url=>sire.fichaPdfUrl=url);

const PLACEHOLDER_PHOTO="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="220"><rect width="300" height="220" fill="#dce8e4"/><text x="150" y="115" font-family="sans-serif" font-size="14" fill="#888" text-anchor="middle">Sin fotografía</text></svg>');
function refreshPreview(){
  const t={...sire,ancestors:sire.ancestors.filter(a=>a.name&&a.foto),foto:sire.foto||PLACEHOLDER_PHOTO,nm:sire.nm??0,milk:sire.milk??0,fat:sire.fat??0,cm:sire.cm??0,cfp:sire.cfp??0,milkR:sire.milkR??0,pl:sire.pl??0,livability:sire.livability??0,scs:sire.scs??0,fertIndex:sire.fertIndex??0,mastitis:sire.mastitis??0,dpr:sire.dpr??0,fatPct:sire.fatPct??0,proteinPct:sire.proteinPct??0,protein:sire.protein??0,feedSaved:sire.feedSaved??0,ptat:sire.ptat??0,udc:sire.udc??0,flc:sire.flc??0,hcc:sire.hcc??0,tpi:sire.tpi??0,codigo:sire.codigo||'—',nombre:sire.nombre||'Nuevo semental',reg:sire.reg||'—',dob:sire.dob||'—',disponibilidad:sire.disponibilidad||''};
  $('#fichaPreview').innerHTML=window.FichaRender.renderFichaHTML(t,{});
}

function collectPayload(){
  return{...sire,activo:$('#activoCheck').checked,traits:sire.traits,ancestors:sire.ancestors.filter(a=>a.name&&a.foto)};
}

async function loadExisting(){
  if(!editCodigo)return;
  $('#editorEyebrow').textContent='EDITAR SEMENTAL';$('#editorHeading').textContent=`Editando ${editCodigo}`;$('#editorTitle').textContent=`Editar ${editCodigo} · Genética Universal`;
  try{
    const data=await api(`/api/sires/${encodeURIComponent(editCodigo)}`);
    sire={...sire,...data,traits:data.traits?.length?data.traits:sire.traits,ancestors:data.ancestors||[]};
  }catch(error){$('#editorStatus').textContent=error.message;}
}

$('#editorForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const button=$('#saveButton'),status=$('#editorStatus');button.disabled=true;status.textContent='Guardando…';
  try{
    const payload=collectPayload();
    const saved=editCodigo?await api(`/api/sires/${encodeURIComponent(editCodigo)}`,{method:'PUT',body:JSON.stringify(payload)}):await api('/api/sires',{method:'POST',body:JSON.stringify(payload)});
    status.textContent='✓ Guardado correctamente.';
    if(!editCodigo&&saved?.codigo)location.href=`editor.html?codigo=${encodeURIComponent(saved.codigo)}`;
  }catch(error){status.textContent=error.message;}
  finally{button.disabled=false;}
});

(async function init(){
  try{const session=await api('/api/session');if(!session.authenticated){location.href='index.html';return;}}catch{location.href='index.html';return;}
  renderFields();
  await loadExisting();
  fillFields();
  renderAncestors();
  renderTraits();
  paintMain();paintAlt();paintFicha();
  refreshPreview();
})();
