'use strict';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js-ready');
function installLoadingIntro() {
  const root = document.documentElement;
  if (!root.classList.contains('loading-intro')) return;
  const loader = document.querySelector('.site-loader');
  if (!loader) {root.classList.remove('loading-intro'); return;}
  // Start the hold once the intro is ready to display and accept input.
  const start = performance.now();
  let finished = false, removed = false;
  function removeIntro() {
    if (removed) return;
    removed = true;
    root.classList.remove('loading-intro', 'intro-leaving');
    root.classList.add('intro-finished');
    loader.remove();
    clearTimeout(window.__saanjhIntroFallback);
  }
  function finish(immediate = false) {
    if (finished) {if (immediate) removeIntro();return;}
    finished = true;
    try {sessionStorage.setItem('saanjh-intro-seen-v2', '1');} catch {}
    root.classList.add('intro-leaving');
    if (immediate || reduced) removeIntro();
    else setTimeout(removeIntro, 1000);
  }
  loader.querySelector('button')?.addEventListener('click', () => finish(true));
  document.addEventListener('focusin', event => {if (!loader.contains(event.target)) finish(true);});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', event => {if(event.matches) finish(true);});
  const hero = document.querySelector('.hero > img');
  const heroReady = !hero || hero.complete ? Promise.resolve() : new Promise(resolve => {
    hero.addEventListener('load', resolve, {once:true}); hero.addEventListener('error', resolve, {once:true});
  });
  const fontReady = document.fonts?.ready || Promise.resolve();
  Promise.race([Promise.all([heroReady, fontReady]),new Promise(resolve=>setTimeout(resolve,2200))]).then(() => {
    setTimeout(() => finish(), Math.max(0, 3000 - (performance.now() - start)));
  });
  setTimeout(() => finish(true), 5000);
}
installLoadingIntro();
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navlinks');
function closeMenu() {
  navigation?.classList.remove('open');
  menu?.setAttribute('aria-expanded', 'false');
  if (menu) menu.textContent = 'Menu';
}
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
  menu.textContent = open ? 'Close' : 'Menu';
});
navigation?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navigation?.classList.contains('open')) {
    closeMenu();menu.focus();
  }
});
document.addEventListener('click', e=>{if(navigation?.classList.contains('open')&&!e.target.closest('.nav')) closeMenu();});
matchMedia('(min-width:641px)').addEventListener?.('change',e=>{if(e.matches) closeMenu();});
// Content stays visible without animation support. Motion enhances the page,
// rather than becoming a prerequisite for reading or using it.
function installReveals() {
  if (reduced || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  const targets = new Set();
  document.querySelectorAll('.hero h1, .intro h2, .section-title h2, .event h3, .brief-intro h2, .story-heading h1, .story-design h2, .run-show h2, .story-end .display').forEach(heading => {
    const fragment = document.createDocumentFragment();
    let line = document.createElement('span'), inner = document.createElement('span');
    let index = 0;
    function prepareLine() {
      line.className = 'reveal-line'; inner.className = 'reveal-line-inner';
      inner.style.setProperty('--line-delay', `${index++ * 100}ms`);
      line.append(inner); fragment.append(line);
    }
    prepareLine();
    [...heading.childNodes].forEach(node => {
      if (node.nodeName === 'BR') {
        inner.append(document.createTextNode(' '));
        line = document.createElement('span'); inner = document.createElement('span'); prepareLine();
      } else inner.append(node);
    });
    heading.replaceChildren(fragment); heading.classList.add('heading-reveal'); targets.add(heading);
  });
  // Observe unmasked parents, and animate images only AFTER they enter view.
  // The map is a working control, so it never participates in a reveal mask.
  const imageSelector = '.photo-stage, .mobile-event-img, .story-cover, .comparison, .mobile-story-photo';
  const imageTargets = new Set(document.querySelectorAll(imageSelector));
  imageTargets.forEach(el => el.classList.add('image-reveal'));
  document.querySelectorAll('.intro .eyebrow, .intro p, .hero-copy, .section-title > p, .event .num, .event .moment, .event > p, .event .detail, .ledger-row, .venue-select, .brief-intro > p, .brief-form fieldset, .brief-preview, .story-meta > div, .story-heading > p, .story-design p, .palette, .solved > p, .run-layout > div > p, .run-row').forEach(el => {
    el.classList.add('scroll-reveal'); targets.add(el);
  });
  document.querySelectorAll('.ledger-row, .venue-select, .story-meta > div').forEach((el, i) => el.style.setProperty('--reveal-delay', `${(i % 4) * 60}ms`));
  const observed = new Map();
  function reveal(el) {
    el.classList.add('visible');
    if (imageTargets.has(el)) {
      el.classList.add('reveal-playing');
      el.addEventListener('animationend', () => el.classList.remove('reveal-playing'), {once:true});
    }
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {observed.get(entry.target)?.forEach(reveal); observer.unobserve(entry.target);}
  }), {threshold: .08, rootMargin:'0px 0px -35px 0px'});
  function track(observedElement, target) {
    if (!observed.has(observedElement)) observed.set(observedElement, []);
    observed.get(observedElement).push(target);
  }
  targets.forEach(el => track(el, el));
  imageTargets.forEach(el => track(el.parentElement, el));
  try {
    observed.forEach((_,el) => observer.observe(el));
    document.documentElement.classList.add('motion-on');
  } catch {
    document.documentElement.classList.remove('motion-on');
    observer.disconnect();
  }
  // Keyboard navigation and in-page links must never land on concealed content.
  document.addEventListener('focusin', event => {
    let el = event.target;
    while (el && el !== document) {
      if (targets.has(el) || imageTargets.has(el)) {el.classList.add('visible');el.classList.remove('reveal-playing');}
      el = el.parentElement;
    }
  });
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  preference.addEventListener?.('change', event => {
    if (event.matches) {document.documentElement.classList.remove('motion-on'); targets.forEach(el=>el.classList.add('visible'));imageTargets.forEach(el=>el.classList.remove('reveal-playing'));observer.disconnect();}
  });
  // Reveal restored-scroll and fragment destinations without relying on a mask
  // intersection. Geometry checks are inexpensive and only run once per frame.
  let checking = false;
  function revealInViewport() {
    checking = false;
    targets.forEach(el => {
      if (el.classList.contains('visible')) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight - 20 && rect.width > 0) reveal(el);
    });
  }
  addEventListener('scroll',()=>{if(!checking){checking=true;requestAnimationFrame(revealInViewport);}}, {passive:true});
  addEventListener('pageshow',revealInViewport);
  requestAnimationFrame(revealInViewport);
}
try {installReveals();} catch {document.documentElement.classList.remove('motion-on');}
const weekend = document.querySelector('.weekend');
if (weekend) {
  const events = [...document.querySelectorAll('.event')];
  const photos = [...document.querySelectorAll('.photo-stage img')];
  const links = [...document.querySelectorAll('.weekend-progress a')];
  let active = -1, pending = false;
  function updateWeekend() {
    pending = false;
    const center = innerHeight * .5;
    let selected = events.findIndex(e => {const r = e.getBoundingClientRect(); return r.top <= center && r.bottom > center;});
    if (selected < 0) return;
    if (selected === active) return;
    active = selected;
    const e = events[selected];
    weekend.style.setProperty('--event-bg', e.dataset.bg);
    weekend.style.setProperty('--event-ink', e.dataset.ink);
    photos.forEach((p, i) => p.classList.toggle('active', i === selected));
    links.forEach((a, i) => {a.classList.toggle('active', i === selected); if (i === selected) a.setAttribute('aria-current','step'); else a.removeAttribute('aria-current');});
    document.querySelector('#photo-day').textContent = e.querySelector('.moment').textContent;
    document.querySelector('#photo-count').textContent = `0${selected + 1} / 06`;
    if (innerWidth <= 640) links[selected].parentElement.scrollTo({left:links[selected].offsetLeft - 20,behavior:reduced ? 'instant' : 'smooth'});
  }
  addEventListener('scroll', () => {if (!pending) {pending = true; requestAnimationFrame(updateWeekend);}}, {passive:true});
  addEventListener('resize', updateWeekend); updateWeekend();
}
const hover = document.querySelector('.hover-photo');
if (hover && matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced) {
  document.querySelectorAll('.ledger-row').forEach(row => {
    row.addEventListener('pointerenter', () => {hover.querySelector('img').src = `/assets/${row.dataset.photo}.webp`; hover.style.opacity = '1';});
    row.addEventListener('pointermove', e => {const x = Math.min(e.clientX + 25,innerWidth - 270),y = Math.max(15,Math.min(e.clientY - 155,innerHeight - 325));hover.style.left = `${x}px`;hover.style.top = `${y}px`;});
    row.addEventListener('pointerleave', () => hover.style.opacity = '0');
    row.addEventListener('click', () => hover.style.opacity = '0');
  });
}
document.querySelectorAll('.comparison').forEach(el => {
  const range = el.querySelector('input');
  function updateComparison() {
    el.querySelector('.mood-board').style.clipPath = `inset(0 ${100 - Number(range.value)}% 0 0)`;
    el.querySelector('.comparison-divider').style.left = `${range.value}%`;
    range.setAttribute('aria-valuetext', `${range.value}% moodboard revealed`);
  }
  range.addEventListener('input', updateComparison);
  updateComparison();
});
const venues = [
  {name:'Taj Lake Palace',city:'Udaipur',point:[24.5854,73.7125],url:'https://www.tajhotels.com/en-in/hotels/taj-lake-palace-udaipur',query:'Taj Lake Palace Udaipur'},
  {name:'Sofitel Bahrain',city:'Zallaq',point:[26.047,50.487],url:'https://sofitel.accor.com/en/hotels/6722/weddings.html',query:'Sofitel Bahrain Zallaq Thalassa Sea Spa'},
  {name:'Alila Diwa',city:'Majorda',point:[15.315,73.913],url:'https://www.hyatt.com/alila-hotels-and-resorts/en-US/goial-alila-diwa-goa/weddings',query:'Alila Diwa Goa'},
  {name:'Fairmont Jaipur',city:'Jaipur',point:[26.9124,75.7873],url:'https://www.fairmont.com/en/hotels/jaipur/fairmont-jaipur/weddings.html',query:'Fairmont Jaipur'}
];
const mapElement = document.querySelector('#venue-map');
if (mapElement) {
  let map,markers=[];
  function selectVenue(i,move=true) {
    document.querySelectorAll('.venue-select').forEach((b,j) => b.setAttribute('aria-pressed',String(i===j)));
    document.querySelector('#venue-official').href = venues[i].url;
    document.querySelector('#venue-directions').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venues[i].query)}`;
    if (map && move) {map.flyTo(venues[i].point, 7, {animate:!reduced,duration:1});markers[i].openPopup();}
  }
  document.querySelectorAll('.venue-select').forEach(b=>b.addEventListener('click',()=>selectVenue(Number(b.dataset.venue))));
  try {if (window.L) {
    map = L.map('venue-map',{zoomControl:false,scrollWheelZoom:false, dragging:!L.Browser.mobile}).fitBounds(venues.map(v=>v.point), {padding:[55,55]});
    L.control.zoom({position:'bottomleft'}).addTo(map);
    // Bundled geography keeps the destination map independent of tile services.
    if (window.SAANJH_MAP) {
      L.geoJSON(window.SAANJH_MAP,{interactive:false,style:{color:'#baae9c',weight:1,fillColor:'#f2ebdd',fillOpacity:1}}).addTo(map);
      map.attributionControl.addAttribution('Geography: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>');
    }
    map.setMinZoom(3);map.setMaxZoom(7);
    markers=venues.map((v,i)=>L.marker(v.point,{title:v.city,icon:L.divIcon({html:`<span class="venue-pin">${i+1}</span>`,className:'map-pin',iconSize:[30,30],iconAnchor:[15,15]})}).addTo(map).bindPopup(`${v.city}<br>Suggested: ${v.name}`).on('click',()=>selectVenue(i,false)));
  } else document.querySelector('.map-label').textContent='Choose a destination from the shortlist';
  } catch {
    try {map?.remove();} catch {}
    map=undefined;markers=[];
    document.querySelector('.map-label').textContent='Choose a destination from the shortlist';
  }
}
const form = document.querySelector('#brief-form');
if (form) {
  const message = document.querySelector('#brief-message'),status = document.querySelector('#brief-status'),other = document.querySelector('#other-city');
  const allowed = {city:['Udaipur','Bahrain','Goa','Jaipur','Other','Still deciding'],season:['Winter','Spring','Summer','Autumn','Still deciding'],guests:['Under 100','100–200','200–400','400+','Still deciding'],events:['Haldi','Mehendi','Sangeet','Pheras','Reception','Farewell']};
  function state() {const data=new FormData(form);return {city:data.get('city')==='Other' ? (other.value.trim() || 'Other destination (to be confirmed)') : data.get('city'),season:data.get('season'),guests:data.get('guests'),events:data.getAll('events')};}
  function rebuild() {
    other.hidden = form.querySelector('input[name=city]:checked').value !== 'Other';
    const brief = state();
    message.value = `Hello! I'd like to discuss planning our wedding weekend.\n\nDestination: ${brief.city}\nSeason: ${brief.season}\nGuest count: ${brief.guests}\nEvents: ${brief.events.length ? brief.events.join(', ') : 'Still deciding'}\n\nCould we talk about the possibilities and next steps?`;
    status.textContent='';
  }
  form.addEventListener('submit',e=>e.preventDefault());
  form.addEventListener('change',e=>{if(e.target.matches('input')) rebuild();});other.addEventListener('input',rebuild);rebuild();
  document.querySelector('#copy-brief').addEventListener('click',async()=> {
    if(!message.value.trim()){status.textContent='Add a message to your brief first.';message.focus();return;}
    try {await navigator.clipboard.writeText(message.value);status.textContent='Your brief is copied. Paste it into a conversation with your planner.';}
    catch {message.focus();message.select();status.textContent='Your brief is selected. Use Copy to take it with you.';}
  });
  document.querySelector('#whatsapp-brief').addEventListener('click',()=> {
    if(!message.value.trim()){status.textContent='Add a message to your brief first.';message.focus();return;}
    const link=document.createElement('a');link.href=`https://wa.me/?text=${encodeURIComponent(message.value)}`;link.target='_blank';link.rel='noopener noreferrer';link.click();
    status.textContent='Choose your recipient in WhatsApp and review the brief before sending.';
  });
  if(document.modelContext?.registerTool) {
    const controller=new AbortController();
    const tool={name:'configure_wedding_brief',title:'Configure wedding brief',description:'Stage city, season, guest count and events in the visible wedding brief. Returns the generated message; does not send it.',annotations:{readOnlyHint:false,untrustedContentHint:false},inputSchema:{type:'object',properties:{city:{type:'string',enum:allowed.city},season:{type:'string',enum:allowed.season},guests:{type:'string',enum:allowed.guests},events:{type:'array',items:{type:'string',enum:allowed.events},uniqueItems:true},customCity:{type:'string',maxLength:100}},required:['city','season','guests','events'],additionalProperties:false},execute(input){
      if(!input || typeof input!=='object' || Object.keys(input).some(k=>!['city','season','guests','events','customCity'].includes(k))) throw new Error('Invalid brief fields.');
      for(const key of ['city','season','guests']) if(!allowed[key].includes(input[key])) throw new Error(`Invalid ${key}.`);
      if(!Array.isArray(input.events) || input.events.some(e=>!allowed.events.includes(e)) || new Set(input.events).size!==input.events.length) throw new Error('Invalid events.');
      if(input.customCity!==undefined && (typeof input.customCity!=='string' || input.customCity.length>100)) throw new Error('Invalid custom city.');
      for(const key of ['city','season','guests']) form.querySelectorAll(`input[name=${key}]`).forEach(el=>el.checked=el.value===input[key]);
      form.querySelectorAll('input[name=events]').forEach(el=>el.checked=input.events.includes(el.value));
      other.value=input.customCity || '';rebuild();return {brief:state(),message:message.value,status:'prepared'};
    }};
    try {Promise.resolve(document.modelContext.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}
    addEventListener('pagehide',()=>controller.abort(),{once:true});
  }
}
