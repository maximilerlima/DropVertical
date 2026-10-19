
    const header=document.querySelector('#header'),menu=document.querySelector('.menu-toggle'),links=document.querySelector('.nav-links');
    const setHeader=()=>header.classList.toggle('scrolled',scrollY>24);setHeader();addEventListener('scroll',setHeader,{passive:true});
    menu.addEventListener('click',()=>{const open=links.classList.toggle('open');menu.setAttribute('aria-expanded',open);menu.textContent=open?'×':'☰'});links.addEventListener('click',e=>{if(e.target.closest('a')){links.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰'}});
    document.documentElement.classList.add('js-motion');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduced){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -35px'});document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el));addEventListener('scroll',()=>{if(innerWidth<=620)return;const hero=document.querySelector('.hero');if(scrollY<innerHeight)hero.style.backgroundPosition=`center calc(50% + ${scrollY*.1}px)`},{passive:true})}else document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('visible'));
    const compass=d=>{const pt=['N','NE','L','SE','S','SO','O','NO'],en=['N','NE','E','SE','S','SW','W','NW'],es=['N','NE','E','SE','S','SO','O','NO'];return (window.siteLanguage==='en'?en:window.siteLanguage==='es'?es:pt)[Math.round((Number(d)||0)/45)%8]};
    const windLabel=k=>window.siteLanguage==='en'?(k<7?'light':k<13?'moderate':k<20?'strong':'very strong'):window.siteLanguage==='es'?(k<7?'débil':k<13?'moderado':k<20?'fuerte':'muy fuerte'):(k<7?'fraco':k<13?'moderado':k<20?'forte':'muito forte');
    async function updateSeaStatus(){
      const lat=-23.013,lon=-43.37;
      const weatherUrl=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=kn&timezone=America%2FSao_Paulo`;
      const marineUrl=`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature,sea_level_height_msl&forecast_days=1&timezone=America%2FSao_Paulo`;
      try{
        const [weatherRes,marineRes]=await Promise.all([fetch(weatherUrl),fetch(marineUrl)]);if(!weatherRes.ok||!marineRes.ok)throw Error('weather unavailable');
        const [weather,marine]=await Promise.all([weatherRes.json(),marineRes.json()]);
        const localHour=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hour12:false}).format(new Date()).replace(' ','T')+':00';
        let i=marine.hourly.time.findIndex(t=>t>=localHour);if(i<0)i=marine.hourly.time.length-1;
        const wave=Number(marine.hourly.wave_height[i]),waveDir=Number(marine.hourly.wave_direction[i]),period=Number(marine.hourly.wave_period[i]),water=Number(marine.hourly.sea_surface_temperature[i]),sea=Number(marine.hourly.sea_level_height_msl[i]),previousSea=Number(marine.hourly.sea_level_height_msl[Math.max(0,i-1)]),tide=Number.isFinite(sea)&&Number.isFinite(previousSea)?(sea>=previousSea?(window.siteLanguage==='en'?'tide rising':window.siteLanguage==='es'?'marea subiendo':'maré enchendo'):(window.siteLanguage==='en'?'tide falling':window.siteLanguage==='es'?'marea bajando':'maré secando')):'';
        const wind=Number(weather.current.wind_speed_10m),windDir=Number(weather.current.wind_direction_10m);
        document.querySelector('#waveHeight').textContent=Number.isFinite(wave)?`${wave.toFixed(1)}m`:'—';document.querySelector('#waveDirection').textContent=Number.isFinite(waveDir)?compass(waveDir):'';
        document.querySelector('#windSpeed').textContent=Number.isFinite(wind)?`${Math.round(wind)} ${window.siteLanguage==='en'?'knots':window.siteLanguage==='es'?'nudos':'nós'}`:'—';document.querySelector('#windDirection').textContent=Number.isFinite(windDir)?compass(windDir):'';
        document.querySelector('#waterTemp').textContent=Number.isFinite(water)?`${Math.round(water)}°C`:`${Math.round(weather.current.temperature_2m)}°C ${window.siteLanguage==='en'?'air':window.siteLanguage==='es'?'aire':'ar'}`;
        const waveWord=window.siteLanguage==='en'?'Swell':window.siteLanguage==='es'?'Oleaje':'Ondulação',periodWord=window.siteLanguage==='en'?'Period':window.siteLanguage==='es'?'Período':'Período',windWord=window.siteLanguage==='en'?'Wind':window.siteLanguage==='es'?'Viento':'Vento';document.querySelector('#seaDescription').textContent=`${waveWord} ${wave.toFixed(1)}m ${window.siteLanguage==='en'?'from':window.siteLanguage==='es'?'de':'de'} ${compass(waveDir)} • ${periodWord} ${period.toFixed(0)}s • ${windWord} ${windLabel(wind)}${tide?` • ${tide}`:''}`;
        const rating=wave>=.4&&wave<=1.8&&wind<13?(window.siteLanguage==='en'?'Excellent for lessons':window.siteLanguage==='es'?'Excelente para clase':'Excelente para aula'):wave<2.5&&wind<18?(window.siteLanguage==='en'?'Good conditions':window.siteLanguage==='es'?'Buenas condiciones':'Boas condições'):(window.siteLanguage==='en'?'Check with the team':window.siteLanguage==='es'?'Consulte al equipo':'Consulte a equipe');document.querySelector('#seaRating').textContent=rating;
      }catch(e){document.querySelector('#seaDescription').textContent=window.siteLanguage==='en'?'Data temporarily unavailable • ask our team':window.siteLanguage==='es'?'Datos temporalmente no disponibles • consulte a nuestro equipo':'Dados temporariamente indisponíveis • consulte nossa equipe';document.querySelector('#seaRating').textContent='Posto 6';}
    }
    window.siteLanguage=document.documentElement.lang==='pt-BR'?'pt':document.documentElement.lang;setTimeout(updateSeaStatus,1200);setInterval(updateSeaStatus,20*60*1000);
    const modal=document.querySelector('.booking-modal'),panel=modal.querySelector('.booking-panel'),closeBooking=modal.querySelector('.booking-close'),form=document.querySelector('#bookingForm');let bookingTrigger;
    function openBooking(trigger){bookingTrigger=trigger;const activity=trigger?.dataset.service;const index={surf:0,sup:1,kite:2,rental:3}[activity];if(index!==undefined)form.querySelectorAll('input[name=modality]')[index].checked=true;const level=trigger?.dataset.level;if(level!==undefined)form.querySelectorAll('input[name=level]')[Number(level)].checked=true;window.dropTrack?.('booking_open',{service:activity||'general',placement:trigger?.dataset.placement||'page'});modal.hidden=false;document.body.classList.add('modal-open');requestAnimationFrame(()=>closeBooking.focus())}
    function hideBooking(){modal.hidden=true;document.body.classList.remove('modal-open');bookingTrigger?.focus()}
    document.querySelectorAll('[data-booking]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();links.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰';openBooking(a)}));
    closeBooking.addEventListener('click',hideBooking);modal.addEventListener('click',e=>{if(e.target===modal)hideBooking()});addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)hideBooking()});
    panel.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const f=[...panel.querySelectorAll('button,input,select')].filter(x=>!x.disabled);const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
    form.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form),name=String(data.get('name')).trim(),modality=data.get('modality'),level=data.get('level'),time=data.get('time'),people=data.get('people');if(!name){document.querySelector('#bookingName').focus();return}const message=window.siteLanguage==='en'?`Hi Daniel and Drop Vertical team! 🌊 I would like to book an experience:\n\n• *Activity:* ${modality}\n• *Level / Format:* ${level}\n• *Preferred time:* ${time}\n• *Participants:* ${people}\n• *My name:* ${name}\n\nCould you confirm availability and the next steps at Posto 6? Thank you!`:window.siteLanguage==='es'?`¡Hola, Daniel y equipo Drop Vertical! 🌊 Me gustaría agendar una experiencia:\n\n• *Modalidad:* ${modality}\n• *Nivel / Formato:* ${level}\n• *Horario preferido:* ${time}\n• *Participantes:* ${people}\n• *Mi nombre:* ${name}\n\n¿Podrían confirmar la disponibilidad y los próximos pasos en Posto 6? ¡Gracias!`:`Olá, Daniel e equipe Drop Vertical! 🌊 Gostaria de agendar uma experiência:\n\n• *Modalidade:* ${modality}\n• *Nível / Formato:* ${level}\n• *Horário preferido:* ${time}\n• *Participantes:* ${people} pessoa(s)\n• *Meu Nome:* ${name}\n\nPoderiam me confirmar a disponibilidade e os próximos passos no Posto 6? Obrigado!`;window.dropTrack?.('whatsapp_click',{service:['surf','sup','kite','rental'][[...form.querySelectorAll('input[name=modality]')].findIndex(x=>x.checked)],placement:'booking_submit'});window.open(`https://wa.me/${window.DROP_CONFIG.whatsapp}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer')});
  
// Explicit-language URLs are authoritative. No IP/browser-language redirect.
(() => {
  const config = JSON.parse(document.querySelector('#drop-config').textContent);
  window.DROP_CONFIG = config;
  const safeStore = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} },
  };
  safeStore.set('drop-language', config.language);
  const consentKey = 'drop-analytics-consent';
  let consent = safeStore.get(consentKey) === 'granted';
  let analyticsLoaded = false;
  function loadAnalytics() {
    if (!consent || !config.ga4Id || analyticsLoaded) return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', config.ga4Id, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.ga4Id);
    document.head.append(script);
  }
  window.dropTrack = (event, properties = {}) => {
    // Strict allowlist: never send name, phone, form text, participant count or a wa.me URL.
    const safe = { language: config.language, page: config.page };
    for (const name of ['service', 'placement', 'target_language']) if (typeof properties[name] === 'string') safe[name] = properties[name].slice(0, 32);
    if (consent && config.ga4Id) { loadAnalytics(); window.gtag('event', event, safe); }
  };
  document.querySelectorAll('[data-language]').forEach(link => link.addEventListener('click', () => {
    safeStore.set('drop-language', link.dataset.language);
    window.dropTrack('language_change', { target_language: link.dataset.language });
  }));
  document.querySelectorAll('[data-track]').forEach(link => link.addEventListener('click', () => window.dropTrack(link.dataset.track, { placement: 'contact' })));
  const root = document.querySelector('main');
  const modal = document.querySelector('.booking-modal');
  if (root && modal) new MutationObserver(() => {
    const open = !modal.hidden;
    for (const el of [root, document.querySelector('header'), document.querySelector('footer'), document.querySelector('.wa-float')]) if (el) el.inert = open;
  }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
  function chooseConsent(grant) {
    consent = grant;
    safeStore.set(consentKey, grant ? 'granted' : 'denied');
    document.querySelector('#analytics-consent')?.remove();
    if (!grant && analyticsLoaded) { window['ga-disable-' + config.ga4Id] = true; location.reload(); }
    loadAnalytics();
  }
  function showConsent() {
    if (!config.ga4Id || document.querySelector('#analytics-consent')) return;
    const t = config.consent;
    const block = document.createElement('section');
    block.id = 'analytics-consent'; block.className = 'consent';
    block.setAttribute('aria-label', t[0]);
    const title = document.createElement('h2'); title.textContent = t[0];
    const p = document.createElement('p'); p.textContent = t[1];
    block.append(title, p);
    for (const [label, grant] of [[t[2], true], [t[3], false]]) {
      const button = document.createElement('button'); button.textContent = label; button.type = 'button'; button.className = 'btn';
      button.addEventListener('click', () => chooseConsent(grant)); block.append(button);
    }
    document.body.append(block);
  }
  if (config.ga4Id) {
    const preferences = document.createElement('button'); preferences.type = 'button'; preferences.textContent = config.consent[4];
    preferences.style.cssText = 'color:inherit;background:none;border:0;text-decoration:underline;cursor:pointer;padding:0;font:inherit';
    preferences.addEventListener('click', showConsent); document.querySelector('.footer-bottom')?.append(preferences);
    if (safeStore.get(consentKey) === null) showConsent();
  }
  loadAnalytics();
})();
