const CONFIG={whatsapp:"524491793772",catalogoUrl:"catalogo-genetica-universal.pdf",catalogApi:"https://admin.geneticauniversal.com/api/public/sires",msgGeneral:"Hola Genética Universal, me interesa recibir asesoría sobre sus sementales.",msgToro:(t)=>`Hola, me interesa el toro ${t.nombre} (${t.codigo}). ¿Me pueden cotizar?`};
let TOROS=Array.isArray(window.SIRE_CATALOG)?window.SIRE_CATALOG:[];
let activeF="all",searchTerm="",sortKey=null,sortDir=1,columnFilters={},fichaStep=0,imageViewerTrigger=null;
const waLink=(m)=>`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(m)}`;
const isQ=(t)=>t.beta==="A2/A2"&&t.kappa==="BB";
const AVAILABILITY={sex:{label:'Sexado',short:'SEX'},conv:{label:'Convencional',short:'CONV'},'conv-sex':{label:'Sexado + Convencional',short:'SEX + CONV'},'s-conv':{label:'Súper convencional',short:'S-CONV'}};
const availability=(key)=>AVAILABILITY[key]||{label:'Consultar',short:'CONSULTAR'};
function pass(t){
  if(activeF==="a2"&&t.beta!=="A2/A2")return false;
  if(activeF==="sex"&&!['sex','conv-sex'].includes(t.disponibilidad))return false;
  if(activeF==="conv"&&!['conv','conv-sex','s-conv'].includes(t.disponibilidad))return false;
  if(searchTerm&&!(t.nombre+" "+t.codigo+" "+t.ped+" "+availability(t.disponibilidad).label).toLowerCase().includes(searchTerm.toLowerCase()))return false;
  for(const [key,value] of Object.entries(columnFilters)){if(!value)continue;if(['nm','cm','milk','fat'].includes(key)){if(t[key]<Number(value))return false;}else if(!String(t[key]).toLowerCase().includes(String(value).toLowerCase()))return false;}
  return true;
}
function renderTable(){
  const tbody=document.getElementById('sireRows');
  const list=TOROS.filter(pass).sort((a,b)=>{if(!sortKey)return 0;const av=a[sortKey],bv=b[sortKey];return (typeof av==='number'?av-bv:String(av).localeCompare(String(bv),'es'))*sortDir;});
  document.getElementById('tableCount').textContent=`${list.length} ${list.length===1?'semental':'sementales'}`;
  document.querySelectorAll('.sort-btn').forEach(btn=>{const active=btn.dataset.sort===sortKey;btn.classList.toggle('active',active);btn.querySelector('span').textContent=active?(sortDir===1?'↑':'↓'):'↕';});
  if(!list.length){tbody.innerHTML='<tr class="empty-row"><td colspan="10">No hay sementales que coincidan con estos filtros.</td></tr>';return;}
  tbody.innerHTML=list.map(t=>`<tr data-i="${TOROS.indexOf(t)}" tabindex="0" aria-label="Abrir ficha 360 de ${t.nombre}">
    <td><div class="sire-id"><button class="sire-thumb-button" type="button" aria-label="Ampliar fotografía de ${t.nombre}" title="Ver fotografía ampliada"><img class="sire-thumb" src="${t.foto}" alt="" loading="lazy"></button><div><b>${t.nombre}</b><small>Holstein · Genómico</small></div></div></td>
    <td class="metric">${t.codigo}</td><td><span class="availability-tag availability-${t.disponibilidad}">${availability(t.disponibilidad).short}</span></td><td class="metric-hi">+${t.nm}</td><td class="metric">+${t.cm}</td><td class="metric">+${t.milk} lb</td><td class="metric">+${t.fat}</td>
    <td><span class="table-pill ${t.beta==='A2/A2'?'hot':''}">${t.beta}</span></td><td><span class="table-pill ${t.kappa==='BB'?'hot':''}">${t.kappa}</span></td><td><span class="row-open">›</span></td>
  </tr>`).join('');
  tbody.querySelectorAll('tr[data-i]').forEach(row=>{const toro=TOROS[row.dataset.i],open=()=>openModal(toro);row.addEventListener('click',e=>{const photo=e.target.closest('.sire-thumb-button');if(photo){e.stopPropagation();openBullImage(toro,photo);return;}open();});row.addEventListener('keydown',e=>{if(e.target.closest('.sire-thumb-button'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
}
function fichaDerived(t){const signed=n=>`${Number(n)>0?'+':''}${n}`,source=window.LINEAR_TRAITS?.[t.codigo]||t.traits||[];return{tpi:t.tpi,protein:t.protein,reliability:t.milkR,pl:t.pl,dpr:t.dpr,scs:t.scs,fatPct:Number(t.fatPct).toFixed(2),proteinPct:Number(t.proteinPct).toFixed(2),cfp:t.cfp,mastitis:t.mastitis,fertIndex:t.fertIndex,livability:t.livability,feedSaved:t.feedSaved,ptat:Number(t.ptat).toFixed(2),udc:Number(t.udc).toFixed(2),flc:Number(t.flc).toFixed(2),signed,traits:source.map(([label,value,left,right,descriptor])=>({label,value,left,right,descriptor,size:Math.min(Math.abs(Number(value))/2*50,50),direction:Number(value)>=0?'positive':'negative'}))};}
function metricRow(label,value,highlight=''){return `<div class="bull-metric-row"><span>${label}</span><b class="${highlight}">${value}</b></div>`;}
function openModal(t){
  const d=fichaDerived(t),extended=t.nombreRegistrado?`<section class="catalog-family-record"><div><small>NOMBRE REGISTRADO</small><b>${t.nombreRegistrado}</b></div><div><small>aAa</small><b>${t.aaa}</b></div><div><small>HAPLOTIPO</small><b>${t.haplotipos}</b></div><div><small>MADRE</small><b>${t.dam}</b></div><div><small>ABUELA MATERNA</small><b>${t.mgd}</b></div><a href="${t.sourceUrl}" target="_blank" rel="noopener noreferrer">Ver perfil complementario en AI-Total ↗</a></section>`:'';
  document.getElementById('fichaContent').innerHTML=`<div class="ficha-shell bull-sheet catalog-sheet">
    <div class="bull-sheet-scroll catalog-sheet-scroll">
      <header class="catalog-titlebar"><div><small>FICHA GENÓMICA 360° · HOLSTEIN · 08/2026</small><h2 id="fichaTitle">${t.nombre}</h2></div><div class="catalog-title-id"><span>${t.codigo}</span><small>${availability(t.disponibilidad).label}</small></div></header>
      <div class="catalog-overview">
        <div class="catalog-facts">
          <section class="bull-index-band catalog-index" aria-label="Índices principales"><div><small>GTPI</small><strong>${d.tpi}</strong></div><div><small>NM$</small><strong>+${t.nm}</strong></div><div><small>Leche</small><strong>+${t.milk}</strong><em>lb</em></div></section>
          <div class="catalog-data-grid">
            <article class="bull-data-card"><h4>Producción</h4>${metricRow('Leche PTA',`+${t.milk} lb`,'hot')}${metricRow('Grasa',`+${t.fat} lb`)}${metricRow('Grasa %',`${d.signed(d.fatPct)}%`)}${metricRow('Proteína',`+${d.protein} lb`)}${metricRow('Proteína %',`${d.signed(d.proteinPct)}%`)}</article>
            <article class="bull-data-card"><h4>Economía</h4>${metricRow('NM$',`+${t.nm}`,'hot')}${metricRow('CM$',`+${t.cm}`)}${metricRow('CFP',`+${d.cfp} lb`)}${metricRow('Confiabilidad',`${d.reliability}%`)}${metricRow('Feed Saved',d.signed(d.feedSaved))}</article>
            <article class="bull-data-card"><h4>Salud y fertilidad</h4>${metricRow('Índice fertilidad',d.signed(d.fertIndex))}${metricRow('SCS',d.scs)}${metricRow('Mastitis',d.signed(d.mastitis))}${metricRow('Vida productiva',`${d.signed(d.pl)} meses`)}${metricRow('Livability',d.signed(d.livability))}${metricRow('DPR',d.signed(d.dpr),'hot')}</article>
          </div>
        </div>
        <aside class="catalog-identity">
          <button class="ficha-photo bull-profile-photo" type="button" aria-label="Ampliar fotografía de ${t.nombre}" title="Ver fotografía ampliada"><img class="ficha-head-img" src="${t.foto}" alt="${t.nombre}"><span aria-hidden="true"><svg viewBox="0 0 24 24" width="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4M8 10.5h5M10.5 8v5"/></svg></span></button>
          <div class="catalog-pedigree"><small>PEDIGRÍ</small><strong>${t.ped}</strong></div>
          <div class="ficha-highlights"><span class="gbadge ${t.beta==='A2/A2'?'on':''}">Beta ${t.beta}</span><span class="gbadge ${t.kappa==='BB'?'on':''}">Kappa ${t.kappa}</span>${isQ(t)?'<span class="gbadge premium">★ Quesero</span>':''}</div>
        </aside>
      </div>
      <section class="catalog-type-zone full-linear-zone">
        <div class="catalog-section-title"><div><small>MORFOLOGÍA COMPLETA · 18 RASGOS</small><h3>Conformación funcional</h3></div><div class="catalog-type-summary"><span>PTAT <b>${d.signed(d.ptat)}</b></span><span>UDC <b>${d.signed(d.udc)}</b></span><span>FLC <b>${d.signed(d.flc)}</b></span></div></div>
        <div class="linear-axis" aria-hidden="true"><span>-2</span><span>-1</span><span>0</span><span>1</span><span>2</span></div>
        <div class="full-linear-list">${d.traits.map(trait=>`<div class="linear-catalog-row"><strong>${trait.label}</strong><div class="linear-catalog-chart" title="${trait.left} a ${trait.right}"><i class="${trait.direction}" style="--size:${trait.size}%"></i></div><b>${d.signed(trait.value)}</b><span>${trait.descriptor}</span></div>`).join('')}</div>
      </section>
      <section class="catalog-record"><div><small>REGISTRO</small><b>${t.reg}</b></div><div><small>NACIMIENTO</small><b>${t.dob}</b></div><div><small>RAZA</small><b>Holstein</b></div><div><small>PRESENTACIÓN</small><b>${availability(t.disponibilidad).label}</b></div><p>Evaluación oficial 08/2026 · Confirma existencias con un asesor.</p></section>${extended}
    </div>
    <footer class="bull-sheet-actions"><span><b>${t.nombre}</b><small>${t.codigo}</small></span><button class="ficha-quote" type="button"><svg class="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#whatsappIcon"/></svg>Solicitar información por WhatsApp</button></footer>
  </div>`;
  document.getElementById('fichaContent').dataset.toro=TOROS.indexOf(t);document.getElementById('fichaContent').addEventListener('click',handleFichaClick);document.getElementById('modalBack').classList.add('open');document.body.style.overflow='hidden';document.getElementById('modalClose').focus();
}
function handleFichaClick(e){const photo=e.target.closest('.ficha-photo');if(photo){openBullImage(TOROS[Number(document.getElementById('fichaContent').dataset.toro)],photo);return;}if(e.target.closest('.ficha-quote')){const t=TOROS[Number(document.getElementById('fichaContent').dataset.toro)];window.open(waLink(CONFIG.msgToro(t)),'_blank','noopener');}}
function openBullImage(t,trigger){const viewer=document.getElementById('imageViewer'),img=document.getElementById('imageViewerImg');imageViewerTrigger=trigger||document.activeElement;img.src=t.foto;img.alt=`Fotografía ampliada de ${t.nombre}`;document.getElementById('imageViewerTitle').textContent=`${t.nombre} · ${t.codigo}`;viewer.classList.add('open');viewer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';document.getElementById('imageViewerClose').focus();}
function closeBullImage(){const viewer=document.getElementById('imageViewer');if(!viewer.classList.contains('open'))return false;viewer.classList.remove('open');viewer.setAttribute('aria-hidden','true');if(!document.getElementById('modalBack').classList.contains('open'))document.body.style.overflow='';imageViewerTrigger?.focus();imageViewerTrigger=null;return true;}
function closeModal(){closeBullImage();document.getElementById('modalBack').classList.remove('open');document.body.style.overflow='';}
document.getElementById('modalClose').addEventListener('click',closeModal);
document.getElementById('modalBack').addEventListener('click',e=>{if(e.target.id==='modalBack')closeModal();});
document.getElementById('imageViewerClose').addEventListener('click',closeBullImage);
document.getElementById('imageViewer').addEventListener('click',e=>{if(e.target.id==='imageViewer')closeBullImage();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!closeBullImage())closeModal();});
document.getElementById('chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));b.classList.add('active');const mode=b.dataset.f;if(mode==='tpi'||mode==='nm'){activeF='all';sortKey=mode;sortDir=-1;}else{activeF=mode;sortKey=null;sortDir=1;}renderTable();});
document.getElementById('searchInput').addEventListener('input',e=>{searchTerm=e.target.value;renderTable();});
document.querySelectorAll('.sort-btn').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.sort;if(sortKey===key)sortDir*=-1;else{sortKey=key;sortDir=['nombre','codigo','beta','kappa','disponibilidad'].includes(key)?1:-1;}renderTable();}));
document.querySelectorAll('.column-filters input,.column-filters select').forEach(input=>input.addEventListener('input',()=>{columnFilters[input.dataset.col]=input.value.trim();renderTable();}));
document.getElementById('clearFilters').addEventListener('click',()=>{activeF='all';searchTerm='';sortKey=null;sortDir=1;columnFilters={};document.getElementById('searchInput').value='';document.querySelectorAll('.column-filters input,.column-filters select').forEach(el=>el.value='');document.querySelectorAll('.chip').forEach((chip,i)=>chip.classList.toggle('active',i===0));renderTable();});
document.getElementById('navToggle').addEventListener('click',()=>document.getElementById('navLinks').classList.toggle('show'));
document.getElementById('themeToggle').addEventListener('click',()=>{const r=document.documentElement;const dark=r.getAttribute('data-theme')==='dark';if(dark){r.removeAttribute('data-theme');}else{r.setAttribute('data-theme','dark');}try{localStorage.setItem('gu-theme',dark?'light':'dark');}catch(e){}});
document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>document.getElementById('navLinks').classList.remove('show')));
document.querySelectorAll('.wa-link').forEach(a=>{a.href=waLink(CONFIG.msgGeneral);a.target="_blank";a.rel="noopener noreferrer";});
document.querySelectorAll('.wa-genomic').forEach(a=>{a.href=waLink('Hola Genética Universal, me interesa conocer el mapeo genómico por pruebas de ADN para mi establo.');a.target='_blank';a.rel='noopener noreferrer';});
document.querySelectorAll('.cat-link').forEach(a=>{a.href=CONFIG.catalogoUrl;a.setAttribute('download','Catalogo-Genetica-Universal-AGOSTO-2026.pdf');});
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
function renderHero(){
  const HERO=TOROS.slice(0,6);
  const car=document.getElementById('heroCarousel');
  const dots=document.getElementById('heroDots');
  const back=document.getElementById('heroBack');
  if(!car) return;
  car.innerHTML=HERO.map((t,i)=>`<div class="hslide${i===0?' active':''}"><img src="${t.foto}" alt="${t.nombre}"><span class="breed-tag">Holstein</span><span class="nm-badge">+${t.nm}<small>NM$</small></span><div class="poster-scrim"><h3>${t.nombre}</h3><div class="code">${t.codigo} · ${t.beta}</div></div></div>`).join('');
  dots.innerHTML=HERO.map((_,i)=>`<i data-i="${i}" class="${i===0?'on':''}"></i>`).join('');
  if(back) back.innerHTML=`<img src="${(TOROS[3]||TOROS[1]).foto}" alt="">`;
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
