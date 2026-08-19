const CONFIG={whatsapp:"524491793772",catalogApi:"https://admin.geneticauniversal.com/api/public/sires",msgGeneral:"Hola Genética Universal, me interesa recibir asesoría sobre sus sementales.",msgToro:(t)=>`Hola, me interesa el toro ${t.nombre} (${t.codigo}). ¿Me pueden cotizar?`};
let TOROS=Array.isArray(window.SIRE_CATALOG)?window.SIRE_CATALOG:[];
let activeF="all",searchTerm="",sortKey=null,sortDir=1,columnFilters={},fichaStep=0,imageViewerTrigger=null;
const waLink=(m)=>`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(m)}`;
const isQ=(t)=>t.beta==="A2/A2"&&t.kappa==="BB";
const AVAILABILITY={sex:{label:'Sexado',short:'SEX'},conv:{label:'Convencional',short:'CONV'},'conv-sex':{label:'Sexado + Convencional',short:'SEX + CONV'},'s-conv':{label:'Súper convencional',short:'S-CONV'}};
const availability=(key)=>AVAILABILITY[key]||{label:'Consultar',short:'CONSULTAR'};
const signed=n=>`${Number(n)>0?'+':''}${n}`;
const NUMERIC_COLS=['tpi','nm','milk','cfp','fat','fatPct','protein','proteinPct','sce','scs','pl','dpr','ccr','ptat','udc','flc','hcc'];
const MAX_FILTER_COLS=['sce','scs'];
function pass(t){
  if(activeF==="a2"&&t.beta!=="A2/A2")return false;
  if(activeF==="sex"&&!['sex','conv-sex'].includes(t.disponibilidad))return false;
  if(activeF==="conv"&&!['conv','conv-sex','s-conv'].includes(t.disponibilidad))return false;
  if(activeF==="proven"&&Number(t.milkR)<=90)return false;
  if(activeF==="genomic"&&Number(t.milkR)>90)return false;
  if(searchTerm&&!(t.nombre+" "+t.codigo+" "+t.ped+" "+t.sireName+" "+t.damName+" "+availability(t.disponibilidad).label).toLowerCase().includes(searchTerm.toLowerCase()))return false;
  for(const [key,value] of Object.entries(columnFilters)){if(!value)continue;if(NUMERIC_COLS.includes(key)){const metric=Number(t[key]),limit=Number(value);if(MAX_FILTER_COLS.includes(key)?metric>limit:metric<limit)return false;}else if(!String(t[key]).toLowerCase().includes(String(value).toLowerCase()))return false;}
  return true;
}
function renderTable(){
  const tbody=document.getElementById('sireRows');
  const list=TOROS.filter(pass).sort((a,b)=>{if(!sortKey)return 0;const av=a[sortKey],bv=b[sortKey];return (typeof av==='number'?av-bv:String(av).localeCompare(String(bv),'es'))*sortDir;});
  document.getElementById('tableCount').textContent=`${list.length} ${list.length===1?'semental':'sementales'}`;
  document.querySelectorAll('.sort-btn').forEach(btn=>{const active=btn.dataset.sort===sortKey;btn.classList.toggle('active',active);btn.querySelector('span').textContent=active?(sortDir===1?'↑':'↓'):'↕';});
  if(!list.length){tbody.innerHTML='<tr class="empty-row"><td colspan="25">No hay sementales que coincidan con estos filtros.</td></tr>';return;}
  tbody.innerHTML=list.map(t=>`<tr data-i="${TOROS.indexOf(t)}" tabindex="0" aria-label="Abrir ficha 360 de ${t.nombre}">
    <td class="sire-primary-cell"><div class="sire-id"><button class="sire-thumb-button" type="button" aria-label="Ampliar fotografía de ${t.nombre}" title="Ver fotografía ampliada"><img class="sire-thumb" src="${t.foto}" alt="" loading="lazy"></button><div><b>${t.nombre}</b><small>${Number(t.milkR)>90?'Probado':'Genómico'} · ${t.milkR}%</small></div></div></td>
    <td class="metric">${t.codigo}</td>
    <td><span class="availability-tag availability-${t.disponibilidad}">${availability(t.disponibilidad).short}</span></td>
    <td class="metric">${t.tpi}</td>
    <td class="metric-hi">+${t.nm}</td>
    <td class="metric">+${t.milk} lb</td>
    <td class="metric">+${t.cfp}</td>
    <td class="metric">+${t.fat}</td>
    <td class="metric">${signed(Number(t.fatPct).toFixed(2))}%</td>
    <td class="metric">+${t.protein}</td>
    <td class="metric">${signed(Number(t.proteinPct).toFixed(2))}%</td>
    <td class="metric">${signed(t.sce)}</td>
    <td class="metric">${t.scs}</td>
    <td class="metric">${signed(t.pl)}</td>
    <td class="metric">${signed(t.dpr)}</td>
    <td class="metric">${signed(t.ccr)}</td>
    <td class="metric">${signed(Number(t.ptat).toFixed(2))}</td>
    <td class="metric">${signed(Number(t.udc).toFixed(2))}</td>
    <td class="metric">${signed(Number(t.flc).toFixed(2))}</td>
    <td class="metric">${signed(Number(t.hcc).toFixed(2))}</td>
    <td><span class="table-pill ${t.beta==='A2/A2'?'hot':''}">${t.beta}</span></td>
    <td><span class="table-pill ${t.kappa==='BB'?'hot':''}">${t.kappa}</span></td>
    <td class="table-name-cell" title="${t.sireName}"><span class="table-name-text">${t.sireName}</span></td>
    <td class="table-name-cell" title="${t.damName}"><span class="table-name-text">${t.damName}</span></td>
    <td><span class="row-open">›</span></td>
  </tr>`).join('');
  tbody.querySelectorAll('tr[data-i]').forEach(row=>{const toro=TOROS[row.dataset.i],open=()=>openModal(toro);row.addEventListener('click',e=>{const photo=e.target.closest('.sire-thumb-button');if(photo){e.stopPropagation();openBullImage(toro,photo);return;}open();});row.addEventListener('keydown',e=>{if(e.target.closest('.sire-thumb-button'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
}
function fichaDerived(t){const source=window.LINEAR_TRAITS?.[t.codigo]||t.traits||[];return{tpi:t.tpi,protein:t.protein,reliability:t.milkR,pl:t.pl,dpr:t.dpr,scs:t.scs,fatPct:Number(t.fatPct).toFixed(2),proteinPct:Number(t.proteinPct).toFixed(2),cfp:t.cfp,mastitis:t.mastitis,fertIndex:t.fertIndex,livability:t.livability,feedSaved:t.feedSaved,ptat:Number(t.ptat).toFixed(2),udc:Number(t.udc).toFixed(2),flc:Number(t.flc).toFixed(2),hcc:Number(t.hcc).toFixed(2),signed,traits:source.map(([label,value,left,right,descriptor])=>({label,value,left,right,descriptor,size:Math.min(Math.abs(Number(value))/2*50,50),direction:Number(value)>=0?'positive':'negative'}))};}
function metricRow(label,value,highlight=''){return `<div class="bull-metric-row"><span>${label}</span><b class="${highlight}">${value}</b></div>`;}
function openModal(t){
  const d=fichaDerived(t),extended=t.nombreRegistrado?`<section class="catalog-family-record"><div><small>NOMBRE REGISTRADO</small><b>${t.nombreRegistrado}</b></div><div><small>aAa</small><b>${t.aaa}</b></div><div><small>HAPLOTIPO</small><b>${t.haplotipos}</b></div><div><small>MADRE</small><b>${t.dam}</b></div><div><small>ABUELA MATERNA</small><b>${t.mgd}</b></div><a href="${t.sourceUrl}" target="_blank" rel="noopener noreferrer">Ver perfil complementario en AI-Total ↗</a></section>`:'';
  document.getElementById('fichaContent').innerHTML=`<div class="ficha-shell bull-sheet catalog-sheet">
    <div class="bull-sheet-scroll catalog-sheet-scroll">
      <div class="ficha-print-header"><img src="assets/media/asset-01-a51888de9c.png" alt=""><span>Genética Universal</span></div>
      <header class="catalog-titlebar"><div><small>FICHA 360° · HOLSTEIN · 08/2026</small><h2 id="fichaTitle">${t.nombre}</h2></div><div class="catalog-title-id"><span>${t.codigo}</span><small>${availability(t.disponibilidad).label}</small></div></header>
      <div class="catalog-overview">
        <div class="catalog-facts">
          <section class="bull-index-band catalog-index" aria-label="Índices principales"><div><small>GTPI</small><strong>${d.tpi}</strong></div><div><small>NM$</small><strong>+${t.nm}</strong></div><div><small>Leche</small><strong>+${t.milk}</strong><em>lb</em></div></section>
          <div class="catalog-data-grid">
            <article class="bull-data-card"><h4>Producción</h4>${metricRow('Leche PTA',`+${t.milk} lb`,'hot')}${metricRow('Grasa',`+${t.fat} lb`)}${metricRow('Grasa %',`${d.signed(d.fatPct)}%`)}${metricRow('Proteína',`+${d.protein} lb`)}${metricRow('Proteína %',`${d.signed(d.proteinPct)}%`)}</article>
            <article class="bull-data-card"><h4>Economía</h4>${metricRow('NM$',`+${t.nm}`,'hot')}${metricRow('CM$',`+${t.cm}`)}${metricRow('CFP',`+${d.cfp} lb`)}${metricRow('Confiabilidad',`${d.reliability}%`)}${metricRow('Feed Saved',d.signed(d.feedSaved))}</article>
            <article class="bull-data-card"><h4>Salud y fertilidad</h4>${metricRow('Vida productiva',`${d.signed(d.pl)} meses`,'hot')}${metricRow('Viabilidad',d.signed(d.livability))}${metricRow('SCS',d.scs)}${metricRow('Índice de fertilidad',d.signed(d.fertIndex))}${metricRow('Mastitis',d.signed(d.mastitis))}${metricRow('DPR',d.signed(d.dpr))}</article>
          </div>
        </div>
        <aside class="catalog-identity">
          <button class="ficha-photo bull-profile-photo" type="button" aria-label="Ampliar fotografía de ${t.nombre}" title="Ver fotografía ampliada"><img class="ficha-head-img" src="${t.foto}" alt="${t.nombre}"><span aria-hidden="true"><svg viewBox="0 0 24 24" width="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4M8 10.5h5M10.5 8v5"/></svg></span></button>
          <div class="catalog-pedigree"><small>PEDIGRÍ</small><strong>${t.ped}</strong></div>
          <div class="catalog-parents">${t.sireName?`<div><small>SIRE</small><b>${t.sireName}</b></div>`:''}${t.damName?`<div><small>DAM</small><b>${t.damName}</b></div>`:''}</div>
          <div class="ficha-highlights"><span class="gbadge ${t.beta==='A2/A2'?'on':''}">Beta ${t.beta}</span><span class="gbadge ${t.kappa==='BB'?'on':''}">Kappa ${t.kappa}</span>${isQ(t)?'<span class="gbadge premium">★ Quesero</span>':''}</div>
          ${t.ancestorPhoto?`<div class="catalog-ancestor"><button class="catalog-ancestor-photo" type="button" aria-label="Ampliar fotografía de ${t.ancestorPhoto.name}" title="Ver fotografía ampliada"><img src="${t.ancestorPhoto.foto}" alt="${t.ancestorPhoto.name}"></button><div><small>${t.ancestorPhoto.label}</small><b>${t.ancestorPhoto.name}</b></div></div>`:''}
        </aside>
      </div>
      <section class="catalog-type-zone full-linear-zone">
        <div class="catalog-section-title"><div><small>MORFOLOGÍA COMPLETA · 18 RASGOS</small><h3>Conformación funcional</h3></div><div class="catalog-type-summary"><span>PTAT <b>${d.signed(d.ptat)}</b></span><span>UDC <b>${d.signed(d.udc)}</b></span><span>FLC <b>${d.signed(d.flc)}</b></span><span>HCC <b>${d.signed(d.hcc)}</b></span></div></div>
        <div class="linear-axis" aria-hidden="true"><span>-2</span><span>-1</span><span>0</span><span>1</span><span>2</span></div>
        <div class="full-linear-list">${d.traits.map(trait=>`<div class="linear-catalog-row"><strong>${trait.label}</strong><div class="linear-catalog-chart" title="${trait.left} a ${trait.right}"><i class="${trait.direction}" style="--size:${trait.size}%"></i></div><b>${d.signed(trait.value)}</b><span>${trait.descriptor}</span></div>`).join('')}</div>
      </section>
      <section class="catalog-record"><div><small>REGISTRO</small><b>${t.reg}</b></div><div><small>NACIMIENTO</small><b>${t.dob}</b></div><div><small>RAZA</small><b>Holstein</b></div><div><small>PRESENTACIÓN</small><b>${availability(t.disponibilidad).label}</b></div><p>Evaluación oficial 08/2026 · Confirma existencias con un asesor.</p></section>${extended}
    </div>
    <footer class="bull-sheet-actions"><span><b>${t.nombre}</b><small>${t.codigo}</small></span><div class="bull-sheet-actions-btns"><a class="ficha-download" href="assets/media/fichas/${t.codigo}.pdf" download="Ficha-${t.nombre}-${t.codigo}.pdf"><svg viewBox="0 0 24 24" width="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Descargar PDF</a><button class="ficha-quote" type="button"><svg class="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#whatsappIcon"/></svg>Solicitar información por WhatsApp</button></div></footer>
  </div>`;
  document.getElementById('fichaContent').dataset.toro=TOROS.indexOf(t);document.getElementById('fichaContent').addEventListener('click',handleFichaClick);document.getElementById('modalBack').classList.add('open');document.body.style.overflow='hidden';document.getElementById('modalClose').focus();
}
function handleFichaClick(e){const photo=e.target.closest('.ficha-photo');if(photo){openBullImage(TOROS[Number(document.getElementById('fichaContent').dataset.toro)],photo);return;}const ancestorPhoto=e.target.closest('.catalog-ancestor-photo');if(ancestorPhoto){const t=TOROS[Number(document.getElementById('fichaContent').dataset.toro)];openBullImage(t,ancestorPhoto,buildGallery(t).length-1);return;}if(e.target.closest('.ficha-quote')){const t=TOROS[Number(document.getElementById('fichaContent').dataset.toro)];window.open(waLink(CONFIG.msgToro(t)),'_blank','noopener');}}
function buildGallery(t){const gallery=[{foto:t.foto,label:`${t.nombre} · ${t.codigo}`}];if(t.fotoAlt)gallery.push({foto:t.fotoAlt,label:`${t.nombre} · otro ángulo`});if(t.ancestorPhoto)gallery.push({foto:t.ancestorPhoto.foto,label:`${t.ancestorPhoto.label} · ${t.ancestorPhoto.name}`});return gallery;}
let galleryImages=[],galleryIndex=0;
function renderGalleryImage(){const item=galleryImages[galleryIndex],img=document.getElementById('imageViewerImg');img.src=item.foto;img.alt=`Fotografía ampliada de ${item.label}`;document.getElementById('imageViewerTitle').textContent=item.label;const multi=galleryImages.length>1;document.getElementById('imageViewerPrev').hidden=!multi;document.getElementById('imageViewerNext').hidden=!multi;}
function navGallery(delta){galleryIndex=(galleryIndex+delta+galleryImages.length)%galleryImages.length;renderGalleryImage();}
function openBullImage(t,trigger,startIndex=0){const viewer=document.getElementById('imageViewer');imageViewerTrigger=trigger||document.activeElement;galleryImages=buildGallery(t);galleryIndex=startIndex;renderGalleryImage();viewer.classList.add('open');viewer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';document.getElementById('imageViewerClose').focus();}
function closeBullImage(){const viewer=document.getElementById('imageViewer');if(!viewer.classList.contains('open'))return false;viewer.classList.remove('open');viewer.setAttribute('aria-hidden','true');if(!document.getElementById('modalBack').classList.contains('open'))document.body.style.overflow='';imageViewerTrigger?.focus();imageViewerTrigger=null;return true;}
function closeModal(){closeBullImage();document.getElementById('modalBack').classList.remove('open');document.body.style.overflow='';}
document.getElementById('modalClose').addEventListener('click',closeModal);
document.getElementById('modalBack').addEventListener('click',e=>{if(e.target.id==='modalBack')closeModal();});
document.getElementById('imageViewerClose').addEventListener('click',closeBullImage);
document.getElementById('imageViewer').addEventListener('click',e=>{if(e.target.id==='imageViewer')closeBullImage();});
document.getElementById('imageViewerPrev').addEventListener('click',()=>navGallery(-1));
document.getElementById('imageViewerNext').addEventListener('click',()=>navGallery(1));
document.addEventListener('keydown',e=>{if(!document.getElementById('imageViewer').classList.contains('open'))return;if(e.key==='ArrowLeft')navGallery(-1);else if(e.key==='ArrowRight')navGallery(1);});
function openCatalogModal(){document.getElementById('catalogModalSlot').appendChild(document.getElementById('catalogInteractive'));document.getElementById('catalogModalBack').classList.add('open');document.body.style.overflow='hidden';document.getElementById('catalogModalClose').focus();}
function closeCatalogModal(){const back=document.getElementById('catalogModalBack');if(!back.classList.contains('open'))return false;const anchor=document.getElementById('catalogHomeAnchor');anchor.parentNode.insertBefore(document.getElementById('catalogInteractive'),anchor);back.classList.remove('open');if(!document.getElementById('modalBack').classList.contains('open')&&!document.getElementById('imageViewer').classList.contains('open'))document.body.style.overflow='';return true;}
document.getElementById('openCatalogModal').addEventListener('click',openCatalogModal);
document.getElementById('catalogModalClose').addEventListener('click',closeCatalogModal);
document.getElementById('catalogModalBack').addEventListener('click',e=>{if(e.target.id==='catalogModalBack')closeCatalogModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(closeBullImage())return;if(closeCatalogModal())return;closeModal();}});
document.getElementById('chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));b.classList.add('active');const mode=b.dataset.f;if(mode==='tpi'||mode==='nm'){activeF='all';sortKey=mode;sortDir=-1;}else{activeF=mode;sortKey=null;sortDir=1;}renderTable();});
document.getElementById('searchInput').addEventListener('input',e=>{searchTerm=e.target.value;renderTable();});
document.querySelectorAll('.sort-btn').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.sort;if(sortKey===key)sortDir*=-1;else{sortKey=key;sortDir=['nombre','codigo','beta','kappa','disponibilidad','sireName','damName'].includes(key)?1:-1;}renderTable();}));
document.querySelectorAll('.column-filters input,.column-filters select').forEach(input=>input.addEventListener('input',()=>{columnFilters[input.dataset.col]=input.value.trim();renderTable();}));
document.getElementById('clearFilters').addEventListener('click',()=>{activeF='all';searchTerm='';sortKey=null;sortDir=1;columnFilters={};document.getElementById('searchInput').value='';document.querySelectorAll('.column-filters input,.column-filters select').forEach(el=>el.value='');document.querySelectorAll('.chip').forEach((chip,i)=>chip.classList.toggle('active',i===0));renderTable();});
const nameColumnToggle=document.getElementById('toggleNameColumn');
nameColumnToggle?.addEventListener('click',()=>{const table=document.querySelector('.sire-table'),collapsed=table.classList.toggle('name-collapsed');nameColumnToggle.setAttribute('aria-expanded',String(!collapsed));nameColumnToggle.setAttribute('aria-label',collapsed?'Expandir la columna del nombre':'Contraer la columna del nombre');nameColumnToggle.title=collapsed?'Expandir nombre del toro':'Contraer nombre del toro';nameColumnToggle.querySelector('span').textContent=collapsed?'›':'‹';});
document.getElementById('navToggle').addEventListener('click',()=>document.getElementById('navLinks').classList.toggle('show'));
document.getElementById('themeToggle').addEventListener('click',()=>{const r=document.documentElement;const dark=r.getAttribute('data-theme')==='dark';if(dark){r.removeAttribute('data-theme');}else{r.setAttribute('data-theme','dark');}try{localStorage.setItem('gu-theme',dark?'light':'dark');}catch(e){}});
document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>document.getElementById('navLinks').classList.remove('show')));
document.querySelectorAll('.wa-link').forEach(a=>{a.href=waLink(CONFIG.msgGeneral);a.target="_blank";a.rel="noopener noreferrer";});
document.querySelectorAll('.wa-genomic').forEach(a=>{a.href=waLink('Hola Genética Universal, me interesa conocer el mapeo genómico por pruebas de ADN para mi establo.');a.target='_blank';a.rel='noopener noreferrer';});
document.documentElement.classList.remove('no-js');document.documentElement.classList.add('js');
const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
function ac(el){const t=+el.dataset.count,d=1400,t0=performance.now(),format=new Intl.NumberFormat('es-MX');function s(n){const p=Math.min((n-t0)/d,1),e=1-Math.pow(1-p,3);el.textContent=format.format(Math.round(t*e));if(p<1)requestAnimationFrame(s);}requestAnimationFrame(s);}
const cio=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){ac(en.target);cio.unobserve(en.target);}}),{threshold:.5});
document.querySelectorAll('[data-count]').forEach(el=>cio.observe(el));
renderTable();

/* La simulación del laboratorio sólo se anima al entrar en pantalla. */
(function(){
  const consoleEl=document.getElementById('labConsole');if(!consoleEl)return;
  function animateLab(){consoleEl.classList.remove('play');consoleEl.querySelectorAll('[data-lab-count]').forEach(el=>el.textContent='0');void consoleEl.offsetWidth;consoleEl.classList.add('play');const start=performance.now(),duration=1300;function frame(now){const progress=Math.min((now-start)/duration,1),ease=1-Math.pow(1-progress,3);consoleEl.querySelectorAll('[data-lab-count]').forEach(el=>el.textContent=Math.round(Number(el.dataset.labCount)*ease));if(progress<1)requestAnimationFrame(frame);}requestAnimationFrame(frame);}
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){animateLab();observer.disconnect();}}),{threshold:.35});observer.observe(consoleEl);
  document.getElementById('replayLab').addEventListener('click',animateLab);
})();

/* Hero carousel of elite bulls */
let heroTimer;
const HERO_CAROUSEL=[
  {foto:'assets/media/hero/dominance.jpg',nombre:'DOMINANCE'},
  {foto:'assets/media/hero/mountie-red.jpg',nombre:'MOUNTIE-RED'},
  {foto:'assets/media/hero/quality.jpg',nombre:'QUALITY'},
  {foto:'assets/media/hero/sweet-dreams.jpg',nombre:'SWEET DREAMS'},
  {foto:'assets/media/hero/brevin.jpg',nombre:'BREVIN'},
];
function renderHero(){
  const HERO=HERO_CAROUSEL;
  const car=document.getElementById('heroCarousel');
  const dots=document.getElementById('heroDots');
  const back=document.getElementById('heroBack');
  if(!car) return;
  car.innerHTML=HERO.map((t,i)=>`<div class="hslide${i===0?' active':''}"><img src="${t.foto}" alt="${t.nombre}"></div>`).join('');
  dots.innerHTML=HERO.map((_,i)=>`<i data-i="${i}" class="${i===0?'on':''}"></i>`).join('');
  if(back) back.innerHTML=`<img src="${HERO[2].foto}" alt="">`;
  const slides=[...car.children], dd=[...dots.children]; let hi=0;
  function go(n){slides[hi].classList.remove('active');dd[hi].classList.remove('on');hi=(n+HERO.length)%HERO.length;slides[hi].classList.add('active');dd[hi].classList.add('on');}
  function play(){clearInterval(heroTimer);heroTimer=setInterval(()=>go(hi+1),3800);}
  dots.onclick=e=>{const b=e.target.closest('i');if(!b)return;clearInterval(heroTimer);go(+b.dataset.i);play();};
  play();
}
renderHero();

/* Cuando el administrador esté publicado, D1 sustituye al catálogo local. */
async function syncRemoteCatalog(){
  if(!CONFIG.catalogApi||!['geneticauniversal.com','www.geneticauniversal.com'].includes(location.hostname))return;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),3500);
  try{
    const response=await fetch(CONFIG.catalogApi,{signal:controller.signal,mode:'cors'});if(!response.ok)throw new Error('Catálogo remoto no disponible');const data=await response.json();if(!Array.isArray(data.sires)||data.sires.length<TOROS.length)return;
    const remote=new Map(data.sires.map(row=>[String(row.codigo||'').toUpperCase(),row]));
    TOROS=TOROS.map(base=>{const row=remote.get(base.codigo);if(!row)return base;return{...base,...row,codigo:base.codigo,nombre:row.nombre||base.nombre,disponibilidad:row.disponibilidad||base.disponibilidad,foto:row.foto||base.foto,genomic_data:row.genomic_data||{}};});
    renderTable();renderHero();
  }catch{/* El catálogo incluido sigue siendo el respaldo sin interrumpir la web. */}finally{clearTimeout(timeout);}
}
syncRemoteCatalog();
