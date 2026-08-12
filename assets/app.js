const CONFIG={whatsapp:"524491793772",catalogoUrl:"catalogo-genetica-universal.pdf",catalogApi:"https://admin.geneticauniversal.com/api/public/sires",msgGeneral:"Hola Genética Universal, me interesa recibir asesoría sobre sus sementales.",msgToro:(t)=>`Hola, me interesa el toro ${t.nombre} (${t.codigo}). ¿Me pueden cotizar?`};
let TOROS=[{"nombre": "BORN2FLY", "codigo": "100HO12348", "nm": 966, "cm": 995, "milk": 1463, "fat": 126, "beta": "A2/A2", "kappa": "n/d", "ped": "Sheepster × Gameday × Acura", "foto": "assets/media/asset-09-acca05abe6.jpg"}, {"nombre": "MAXWELL", "codigo": "100HO12366", "nm": 955, "cm": 992, "milk": 1293, "fat": 93, "beta": "A2/A2", "kappa": "BB", "ped": "Undertone × Upside × Captain", "foto": "assets/media/asset-10-51aac47cfb.jpg"}, {"nombre": "UPSET", "codigo": "202HO17107", "nm": 926, "cm": 941, "milk": 1921, "fat": 95, "beta": "A1/A2", "kappa": "AA", "ped": "POwerstar × Altakevlow × Altazazzle", "foto": "assets/media/asset-11-90a1df19e0.jpg"}, {"nombre": "DENTON", "codigo": "551HO04483", "nm": 800, "cm": 792, "milk": 1744, "fat": 62, "beta": "A2/A2", "kappa": "AB", "ped": "Captain × Ridley × Robust", "foto": "assets/media/asset-12-f07dabfa70.jpg"}, {"nombre": "DOWN-N-OUT", "codigo": "551HO05224", "nm": 796, "cm": 834, "milk": 603, "fat": 89, "beta": "A2/A2", "kappa": "BB", "ped": "Hannity × Captain × Nashville", "foto": "assets/media/asset-13-18942006ce.jpg"}, {"nombre": "ODEN", "codigo": "745HO10252", "nm": 760, "cm": 772, "milk": 1555, "fat": 111, "beta": "A1/A2", "kappa": "AE", "ped": "Lionel × Gameday × Granite", "foto": "assets/media/asset-14-c8cb941bed.jpg"}, {"nombre": "QUALITY", "codigo": "515HO00387", "nm": 736, "cm": 722, "milk": 1909, "fat": 65, "beta": "A2/A2", "kappa": "BB", "ped": "Einstein × Ragen × Montross", "foto": "assets/media/asset-15-09be2082f2.jpg"}, {"nombre": "DREAMLINER", "codigo": "202HO16648", "nm": 714, "cm": 740, "milk": 997, "fat": 86, "beta": "A2/A2", "kappa": "AA", "ped": "Dzunda × Pursuit × Medley", "foto": "assets/media/asset-16-6eaa218a3c.jpg"}, {"nombre": "HOLLYWOOD", "codigo": "100HO12297", "nm": 706, "cm": 738, "milk": 1130, "fat": 103, "beta": "A2/A2", "kappa": "AB", "ped": "Kahn × Silverchair × Tahiti", "foto": "assets/media/asset-17-3c20d3a2a5.jpg"}, {"nombre": "JERICK", "codigo": "551HO04582", "nm": 704, "cm": 708, "milk": 1525, "fat": 70, "beta": "A2/A2", "kappa": "AB", "ped": "Captain × Nightcap × Josuper", "foto": "assets/media/asset-18-bdd0e1156e.jpg"}, {"nombre": "SOFTBALL", "codigo": "180HO16260", "nm": 694, "cm": 720, "milk": 775, "fat": 78, "beta": "A2/A2", "kappa": "BB", "ped": "Altawheelhouse × Torro × POsitive", "foto": "assets/media/asset-19-06d4403936.jpg"}, {"nombre": "HIGHCARD", "codigo": "551HO04715", "nm": 619, "cm": 615, "milk": 1314, "fat": 65, "beta": "A1/A2", "kappa": "AE", "ped": "Captain × High Noon × Delta", "foto": "assets/media/asset-20-ed7234bc9a.jpg"}, {"nombre": "MIAMI", "codigo": "551HO03970", "nm": 605, "cm": 620, "milk": 775, "fat": 34, "beta": "A2/A2", "kappa": "BB", "ped": "Nightcap × Dynamo × Rubicon", "foto": "assets/media/asset-21-24dda68348.jpg"}, {"nombre": "AOT HUDSON", "codigo": "515HO00388", "nm": 581, "cm": 600, "milk": 879, "fat": 80, "beta": "A2/A2", "kappa": "AB", "ped": "Einstein × POsitive × Delta", "foto": "assets/media/asset-22-4ad4ba177c.jpg"}, {"nombre": "POKEMON", "codigo": "180HO15492", "nm": 572, "cm": 595, "milk": 806, "fat": 50, "beta": "A2/A2", "kappa": "AB", "ped": "Pursuit × Fabulous × Altatopshot", "foto": "assets/media/asset-23-92e6364ce4.jpg"}, {"nombre": "YING YANG", "codigo": "515HO00497", "nm": 563, "cm": 555, "milk": 1803, "fat": 67, "beta": "A1/A1", "kappa": "BE", "ped": "Figaro × Taos × Lionel", "foto": "assets/media/asset-24-cf3fe77cff.jpg"}, {"nombre": "ZAREK", "codigo": "624HO09074", "nm": 544, "cm": 561, "milk": 699, "fat": 59, "beta": "A2/A2", "kappa": "AB", "ped": "Altazarek × Medley × Duke", "foto": "assets/media/asset-25-b497552bbe.jpg"}, {"nombre": "OFFORD", "codigo": "551HO04139", "nm": 494, "cm": 515, "milk": 627, "fat": 25, "beta": "A2/A2", "kappa": "BB", "ped": "Dedicate × Delta-Worth × Denver", "foto": "assets/media/asset-26-7256f552b1.jpg"}, {"nombre": "PARIZE", "codigo": "551HO04554", "nm": 258, "cm": 264, "milk": 1101, "fat": 35, "beta": "A1/A2", "kappa": "BB", "ped": "Helix × Delta-Lambda × Denver", "foto": "assets/media/asset-27-97fa8e4bcc.jpg"}];
let activeF="all",searchTerm="",sortKey="nm",sortDir=-1,columnFilters={},fichaStep=0,imageViewerTrigger=null;
const waLink=(m)=>`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(m)}`;
const isQ=(t)=>t.beta==="A2/A2"&&t.kappa==="BB";
function pass(t){
  if(activeF==="a2"&&t.beta!=="A2/A2")return false;if(activeF==="bb"&&t.kappa!=="BB")return false;if(activeF==="ques"&&!isQ(t))return false;
  if(searchTerm&&!(t.nombre+" "+t.codigo+" "+t.ped).toLowerCase().includes(searchTerm.toLowerCase()))return false;
  for(const [key,value] of Object.entries(columnFilters)){if(!value)continue;if(['nm','cm','milk','fat'].includes(key)){if(t[key]<Number(value))return false;}else if(!String(t[key]).toLowerCase().includes(String(value).toLowerCase()))return false;}
  return true;
}
function renderTable(){
  const tbody=document.getElementById('sireRows');
  const list=TOROS.filter(pass).sort((a,b)=>{const av=a[sortKey],bv=b[sortKey];return (typeof av==='number'?av-bv:String(av).localeCompare(String(bv),'es'))*sortDir;});
  document.getElementById('tableCount').textContent=`${list.length} ${list.length===1?'semental':'sementales'}`;
  document.querySelectorAll('.sort-btn').forEach(btn=>{const active=btn.dataset.sort===sortKey;btn.classList.toggle('active',active);btn.querySelector('span').textContent=active?(sortDir===1?'↑':'↓'):'↕';});
  if(!list.length){tbody.innerHTML='<tr class="empty-row"><td colspan="9">No hay sementales que coincidan con estos filtros.</td></tr>';return;}
  tbody.innerHTML=list.map(t=>`<tr data-i="${TOROS.indexOf(t)}" tabindex="0" aria-label="Abrir ficha 360 de ${t.nombre}">
    <td><div class="sire-id"><button class="sire-thumb-button" type="button" aria-label="Ampliar fotografía de ${t.nombre}" title="Ver fotografía ampliada"><img class="sire-thumb" src="${t.foto}" alt="" loading="lazy"></button><div><b>${t.nombre}</b><small>Holstein · Genómico</small></div></div></td>
    <td class="metric">${t.codigo}</td><td class="metric-hi">+${t.nm}</td><td class="metric">+${t.cm}</td><td class="metric">+${t.milk} lb</td><td class="metric">+${t.fat}</td>
    <td><span class="table-pill ${t.beta==='A2/A2'?'hot':''}">${t.beta}</span></td><td><span class="table-pill ${t.kappa==='BB'?'hot':''}">${t.kappa}</span></td><td><span class="row-open">›</span></td>
  </tr>`).join('');
  tbody.querySelectorAll('tr[data-i]').forEach(row=>{const toro=TOROS[row.dataset.i],open=()=>openModal(toro);row.addEventListener('click',e=>{const photo=e.target.closest('.sire-thumb-button');if(photo){e.stopPropagation();openBullImage(toro,photo);return;}open();});row.addEventListener('keydown',e=>{if(e.target.closest('.sire-thumb-button'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
}
function fichaDerived(t){const seed=t.nombre.split('').reduce((sum,char)=>sum+char.charCodeAt(0),0),entries=Object.entries(t.genomic_data||{}),get=(aliases,fallback)=>{const found=entries.find(([key])=>aliases.some(alias=>key.toLowerCase().includes(alias)));return found?found[1]:fallback;};return{tpi:get(['tpi'],Math.round(2480+t.nm*.58)),protein:get(['proteina','protein'],Math.round(t.fat*.73)),reliability:get(['confiabilidad','reliability'],82+seed%14),pl:get(['vida productiva','productive life'],(3.2+(seed%28)/10).toFixed(1)),dpr:get(['dpr','fertilidad'],(-.4+(seed%32)/10).toFixed(1)),scs:get(['scs','somatic'],(2.48+(seed%27)/100).toFixed(2)),traits:[['Estatura',44+seed%28],['Fortaleza',38+(seed*3)%38],['Profundidad corporal',42+(seed*5)%35],['Ángulo de grupa',35+(seed*7)%42],['Compuesto de ubre',48+(seed*11)%35],['Patas y pezuñas',40+(seed*13)%39]]};}
function openModal(t){
  fichaStep=0;const d=fichaDerived(t),extras=Object.entries(t.genomic_data||{}).slice(0,80);
  document.getElementById('fichaContent').innerHTML=`<div class="ficha-shell">
    <header class="ficha-head"><button class="ficha-photo" type="button" aria-label="Ampliar fotografía de ${t.nombre}" title="Ver fotografía ampliada"><img class="ficha-head-img" src="${t.foto}" alt="${t.nombre}"><span aria-hidden="true"><svg viewBox="0 0 24 24" width="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4M8 10.5h5M10.5 8v5"/></svg></span></button><div><div class="ficha-overline">FICHA GENÓMICA 360° · HOLSTEIN</div><h2 id="fichaTitle">${t.nombre}</h2><div class="ficha-code">${t.codigo} · Confiabilidad ${d.reliability}%</div></div><div class="ficha-score"><strong>+${t.nm}</strong><small>MÉRITO NETO NM$</small></div></header>
    <nav class="ficha-nav" aria-label="Secciones de la ficha"><button data-step="0" class="active">1. Resumen</button><button data-step="1">2. Morfología</button><button data-step="2">3. Expediente</button></nav>
    <div class="ficha-body">
      <section class="ficha-pane active" data-pane="0"><div class="ficha-summary"><article class="ficha-card"><h3>Indicadores principales</h3><div class="ficha-stat-grid"><div class="ficha-stat"><span>NM$</span><b class="red">+${t.nm}</b></div><div class="ficha-stat"><span>CM$</span><b>+${t.cm}</b></div><div class="ficha-stat"><span>TPI</span><b>${d.tpi}</b></div><div class="ficha-stat"><span>Leche PTA</span><b>+${t.milk}</b></div><div class="ficha-stat"><span>Grasa</span><b>+${t.fat}</b></div><div class="ficha-stat"><span>Proteína</span><b>+${d.protein}</b></div></div></article><article class="ficha-card"><h3>Pedigrí y atributos</h3><div class="pedigree-line"><i></i><span>${t.ped}</span></div><div class="ficha-highlights"><span class="gbadge ${t.beta==='A2/A2'?'on':''}">Beta ${t.beta}</span><span class="gbadge ${t.kappa==='BB'?'on':''}">Kappa ${t.kappa}</span>${isQ(t)?'<span class="gbadge" style="color:#fff;background:var(--gold);border:0">★ Perfil quesero</span>':''}<span class="gbadge on">Disponible</span></div></article></div></section>
      <section class="ficha-pane" data-pane="1"><div class="ficha-card"><h3>Perfil morfológico lineal · demo</h3><div class="morph-grid">${d.traits.map(([label,pos])=>`<div class="morph-row"><div><span>${label}</span><b>${((pos-50)/10).toFixed(1)}</b></div><div class="morph-track"><i style="--pos:${pos}%"></i></div></div>`).join('')}</div></div></section>
      <section class="ficha-pane" data-pane="2"><div class="record-grid"><div class="record-item"><span>Nombre registrado</span><b>${t.nombre}</b></div><div class="record-item"><span>Código NAAB</span><b>${t.codigo}</b></div><div class="record-item"><span>Raza</span><b>Holstein</b></div><div class="record-item"><span>Vida productiva</span><b>+${d.pl} meses</b></div><div class="record-item"><span>DPR fertilidad</span><b>${Number(d.dpr)>0?'+':''}${d.dpr}</b></div><div class="record-item"><span>SCS células somáticas</span><b>${d.scs}</b></div><div class="record-item"><span>Beta caseína</span><b>${t.beta}</b></div><div class="record-item"><span>Kappa caseína</span><b>${t.kappa}</b></div><div class="record-item"><span>Estado comercial</span><b>Disponible</b></div>${extras.map(([key,value])=>`<div class="record-item"><span>${key}</span><b>${value}</b></div>`).join('')}</div><p class="demo-note">Los campos importados se muestran completos. Los valores proyectados siguen siendo ilustrativos hasta contar con su evaluación oficial.</p></section>
    </div><footer class="ficha-foot"><button class="wizard-back" type="button">← Anterior</button><span class="wizard-progress">PASO <b>1</b> DE 3</span><button class="wizard-next" type="button">Siguiente →</button></footer>
  </div>`;
  document.getElementById('fichaContent').dataset.toro=TOROS.indexOf(t);
  document.getElementById('fichaContent').addEventListener('click',handleFichaClick);
  document.getElementById('modalBack').classList.add('open');document.body.style.overflow='hidden';setFichaStep(0);document.getElementById('modalClose').focus();
}
function setFichaStep(next){fichaStep=Math.max(0,Math.min(2,next));document.querySelectorAll('[data-step]').forEach(el=>el.classList.toggle('active',Number(el.dataset.step)===fichaStep));document.querySelectorAll('[data-pane]').forEach(el=>el.classList.toggle('active',Number(el.dataset.pane)===fichaStep));document.querySelector('.wizard-progress b').textContent=fichaStep+1;const back=document.querySelector('.wizard-back'),nextBtn=document.querySelector('.wizard-next');back.disabled=fichaStep===0;nextBtn.textContent=fichaStep===2?'Cotizar por WhatsApp':'Siguiente →';}
function handleFichaClick(e){const photo=e.target.closest('.ficha-photo');if(photo){openBullImage(TOROS[Number(document.getElementById('fichaContent').dataset.toro)],photo);return;}const step=e.target.closest('[data-step]');if(step){setFichaStep(Number(step.dataset.step));return;}if(e.target.closest('.wizard-back'))setFichaStep(fichaStep-1);if(e.target.closest('.wizard-next')){if(fichaStep<2)setFichaStep(fichaStep+1);else{const t=TOROS[Number(document.getElementById('fichaContent').dataset.toro)];window.open(waLink(CONFIG.msgToro(t)),'_blank','noopener');}}}
function openBullImage(t,trigger){const viewer=document.getElementById('imageViewer'),img=document.getElementById('imageViewerImg');imageViewerTrigger=trigger||document.activeElement;img.src=t.foto;img.alt=`Fotografía ampliada de ${t.nombre}`;document.getElementById('imageViewerTitle').textContent=`${t.nombre} · ${t.codigo}`;viewer.classList.add('open');viewer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';document.getElementById('imageViewerClose').focus();}
function closeBullImage(){const viewer=document.getElementById('imageViewer');if(!viewer.classList.contains('open'))return false;viewer.classList.remove('open');viewer.setAttribute('aria-hidden','true');if(!document.getElementById('modalBack').classList.contains('open'))document.body.style.overflow='';imageViewerTrigger?.focus();imageViewerTrigger=null;return true;}
function closeModal(){closeBullImage();document.getElementById('modalBack').classList.remove('open');document.body.style.overflow='';}
document.getElementById('modalClose').addEventListener('click',closeModal);
document.getElementById('modalBack').addEventListener('click',e=>{if(e.target.id==='modalBack')closeModal();});
document.getElementById('imageViewerClose').addEventListener('click',closeBullImage);
document.getElementById('imageViewer').addEventListener('click',e=>{if(e.target.id==='imageViewer')closeBullImage();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!closeBullImage())closeModal();});
document.getElementById('chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));b.classList.add('active');activeF=b.dataset.f;renderTable();});
document.getElementById('searchInput').addEventListener('input',e=>{searchTerm=e.target.value;renderTable();});
document.querySelectorAll('.sort-btn').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.sort;if(sortKey===key)sortDir*=-1;else{sortKey=key;sortDir=['nombre','codigo','beta','kappa'].includes(key)?1:-1;}renderTable();}));
document.querySelectorAll('.column-filters input,.column-filters select').forEach(input=>input.addEventListener('input',()=>{columnFilters[input.dataset.col]=input.value.trim();renderTable();}));
document.getElementById('clearFilters').addEventListener('click',()=>{activeF='all';searchTerm='';columnFilters={};document.getElementById('searchInput').value='';document.querySelectorAll('.column-filters input,.column-filters select').forEach(el=>el.value='');document.querySelectorAll('.chip').forEach((chip,i)=>chip.classList.toggle('active',i===0));renderTable();});
document.getElementById('navToggle').addEventListener('click',()=>document.getElementById('navLinks').classList.toggle('show'));
document.getElementById('themeToggle').addEventListener('click',()=>{const r=document.documentElement;const dark=r.getAttribute('data-theme')==='dark';if(dark){r.removeAttribute('data-theme');}else{r.setAttribute('data-theme','dark');}try{localStorage.setItem('gu-theme',dark?'light':'dark');}catch(e){}});
document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>document.getElementById('navLinks').classList.remove('show')));
document.querySelectorAll('.wa-link').forEach(a=>{a.href=waLink(CONFIG.msgGeneral);a.target="_blank";});
document.querySelectorAll('.cat-link').forEach(a=>{a.href=CONFIG.catalogoUrl;a.setAttribute('download','Catalogo-Genetica-Universal-DIC2025.pdf');});
const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
function ac(el){const t=+el.dataset.count,d=1400,t0=performance.now();function s(n){const p=Math.min((n-t0)/d,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(t*e);if(p<1)requestAnimationFrame(s);}requestAnimationFrame(s);}
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
    const response=await fetch(CONFIG.catalogApi,{signal:controller.signal,mode:'cors'});if(!response.ok)throw new Error('Catálogo remoto no disponible');const data=await response.json();if(!Array.isArray(data.sires)||!data.sires.length)return;
    const local=new Map(TOROS.map(t=>[t.codigo,t]));TOROS=data.sires.map(row=>{const fallback=local.get(row.codigo)||{};return{nombre:row.nombre,codigo:row.codigo,nm:Number(row.nm)||0,cm:Number(row.cm)||0,milk:Number(row.milk)||0,fat:Number(row.fat)||0,beta:row.beta||'n/d',kappa:row.kappa||'n/d',ped:row.ped||'Pedigrí pendiente',foto:row.foto||fallback.foto||'assets/media/asset-01-a51888de9c.png',genomic_data:row.genomic_data||{}};});
    document.querySelectorAll('[data-count="19"]').forEach(el=>{el.dataset.count=TOROS.length;el.textContent=TOROS.length;});renderTable();renderHero();
  }catch{/* El catálogo incluido sigue siendo el respaldo sin interrumpir la web. */}finally{clearTimeout(timeout);}
}
syncRemoteCatalog();
