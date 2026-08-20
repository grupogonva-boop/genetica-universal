// Lógica de armado de la ficha 360°, compartida entre el sitio público
// (assets/app.js) y la vista previa en vivo del panel de administración
// (admin/vendor/ficha-render.js, copia idéntica de este archivo).
(function(global){
  const isQ=(t)=>t.beta==="A2/A2"&&t.kappa==="BB";
  const AVAILABILITY={sex:{label:'Sexado',short:'SEX'},conv:{label:'Convencional',short:'CONV'},'conv-sex':{label:'Sexado + Convencional',short:'SEX + CONV'},'s-conv':{label:'Súper convencional',short:'S-CONV'}};
  const availability=(key)=>AVAILABILITY[key]||{label:'Consultar',short:'CONSULTAR'};
  const signed=n=>`${Number(n)>0?'+':''}${n}`;
  function fichaDerived(t,linearTraits){
    const source=(linearTraits&&linearTraits[t.codigo])||t.traits||[];
    return{tpi:t.tpi,protein:t.protein,reliability:t.milkR,pl:t.pl,dpr:t.dpr,scs:t.scs,fatPct:Number(t.fatPct).toFixed(2),proteinPct:Number(t.proteinPct).toFixed(2),cfp:t.cfp,mastitis:t.mastitis,fertIndex:t.fertIndex,livability:t.livability,feedSaved:t.feedSaved,ptat:Number(t.ptat).toFixed(2),udc:Number(t.udc).toFixed(2),flc:Number(t.flc).toFixed(2),hcc:Number(t.hcc).toFixed(2),signed,traits:source.map(([label,value,left,right,descriptor])=>({label,value,left,right,descriptor,size:Math.min(Math.abs(Number(value))/2*50,50),direction:Number(value)>=0?'positive':'negative'}))};
  }
  function metricRow(label,value,highlight=''){return `<div class="bull-metric-row"><span>${label}</span><b class="${highlight}">${value}</b></div>`;}
  function ancestorsBlock(t){
    const list=Array.isArray(t.ancestors)&&t.ancestors.length?t.ancestors:(t.ancestorPhoto?[t.ancestorPhoto]:[]);
    if(!list.length)return '';
    return list.map((a,i)=>`<div class="catalog-ancestor"><button class="catalog-ancestor-photo" type="button" data-ancestor-index="${i}" aria-label="Ampliar fotografía de ${a.name}" title="Ver fotografía ampliada"><img src="${a.foto}" alt="${a.name}"></button><div><small>${a.label||a.relation}</small><b>${a.name}</b></div></div>`).join('');
  }
  function renderFichaHTML(t,linearTraits){
    const d=fichaDerived(t,linearTraits),extended=t.nombreRegistrado?`<section class="catalog-family-record"><div><small>NOMBRE REGISTRADO</small><b>${t.nombreRegistrado}</b></div><div><small>aAa</small><b>${t.aaa}</b></div><div><small>HAPLOTIPO</small><b>${t.haplotipos}</b></div><div><small>MADRE</small><b>${t.dam}</b></div><div><small>ABUELA MATERNA</small><b>${t.mgd}</b></div>${t.sourceUrl?`<a href="${t.sourceUrl}" target="_blank" rel="noopener noreferrer">Ver perfil complementario en AI-Total ↗</a>`:''}</section>`:'';
    return `<div class="ficha-shell bull-sheet catalog-sheet">
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
          ${ancestorsBlock(t)}
        </aside>
      </div>
      <section class="catalog-type-zone full-linear-zone">
        <div class="catalog-section-title"><div><small>MORFOLOGÍA COMPLETA · 18 RASGOS</small><h3>Conformación funcional</h3></div><div class="catalog-type-summary"><span>PTAT <b>${d.signed(d.ptat)}</b></span><span>UDC <b>${d.signed(d.udc)}</b></span><span>FLC <b>${d.signed(d.flc)}</b></span><span>HCC <b>${d.signed(d.hcc)}</b></span></div></div>
        <div class="linear-axis" aria-hidden="true"><span>-2</span><span>-1</span><span>0</span><span>1</span><span>2</span></div>
        <div class="full-linear-list">${d.traits.map(trait=>`<div class="linear-catalog-row"><strong>${trait.label}</strong><div class="linear-catalog-chart" title="${trait.left} a ${trait.right}"><i class="${trait.direction}" style="--size:${trait.size}%"></i></div><b>${d.signed(trait.value)}</b><span>${trait.descriptor}</span></div>`).join('')}</div>
      </section>
      <section class="catalog-record"><div><small>REGISTRO</small><b>${t.reg}</b></div><div><small>NACIMIENTO</small><b>${t.dob}</b></div><div><small>RAZA</small><b>Holstein</b></div><div><small>PRESENTACIÓN</small><b>${availability(t.disponibilidad).label}</b></div><p>Evaluación oficial 08/2026 · Confirma existencias con un asesor.</p></section>${extended}
    </div>
    <footer class="bull-sheet-actions"><div class="ficha-nav-btns"><button class="ficha-nav-prev" type="button" aria-label="Toro anterior" title="Toro anterior"><svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button><button class="ficha-nav-next" type="button" aria-label="Siguiente toro" title="Siguiente toro"><svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button></div><span><b>${t.nombre}</b><small>${t.codigo}</small></span><div class="bull-sheet-actions-btns"><a class="ficha-download" href="${t.fichaPdfUrl||`assets/media/fichas/${t.codigo}.pdf`}" download="Ficha-${t.nombre}-${t.codigo}.pdf"><svg viewBox="0 0 24 24" width="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Descargar PDF</a><button class="ficha-quote" type="button"><svg class="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#whatsappIcon"/></svg>Solicitar información por WhatsApp</button></div></footer>
  </div>`;
  }
  function buildGallery(t){
    const gallery=[{foto:t.foto,label:`${t.nombre} · ${t.codigo}`}];
    if(t.fotoAlt)gallery.push({foto:t.fotoAlt,label:`${t.nombre} · otro ángulo`});
    const ancestors=Array.isArray(t.ancestors)&&t.ancestors.length?t.ancestors:(t.ancestorPhoto?[t.ancestorPhoto]:[]);
    ancestors.forEach(a=>gallery.push({foto:a.foto,label:`${a.label||a.relation} · ${a.name}`}));
    return gallery;
  }
  global.FichaRender={isQ,AVAILABILITY,availability,signed,fichaDerived,metricRow,renderFichaHTML,buildGallery};
})(window);
