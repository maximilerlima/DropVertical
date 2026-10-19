import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseHTML } from 'linkedom';
import { site } from '../config/site.mjs';
import { languages, slugs, route, text } from '../src/seo-content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
await fs.mkdir(path.join(root,'reports'),{recursive:true});
const base = await fs.readFile(path.join(root, 'src/home-template.html'), 'utf8');
const original = parseHTML(base).document;
const originalScripts = [...original.querySelectorAll('script')].map(x => x.textContent);
const sourceCss = original.querySelector('style').textContent;
const production = site.environment === 'production';
const origin = new URL(site.siteUrl).origin;
if (!/^https?:$/.test(new URL(site.siteUrl).protocol)) throw Error('SITE_URL must be an absolute HTTP(S) origin');
if (!/^\d{10,15}$/.test(site.whatsapp)) throw Error('Invalid official WhatsApp configuration');
if (site.ga4Id && !/^G-[A-Z0-9]+$/.test(site.ga4Id)) throw Error('Invalid GA4 ID');
const esc = v => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const absolute = value => new URL(value, origin).href;
const keyToIndex = { surf: 0, sup: 1, kite: 2, rental: 3 };
const fileFor = key => key === 'home' ? 'index.html' : `${key}.html`;
const assetSizes = {};

// Preserve originals and the existing crop. This is encoding/resizing, not image regeneration.
for (const name of ['hero-surf.png', 'daniel-1.png', 'daniel-2.png', 'daniel-3.png', 'daniel-4.png']) {
  const source = path.join(out, 'assets', name);
  const target = path.join(out, 'assets', name.replace('.png', '.webp'));
  try { if(!(await fs.stat(target)).size)throw Error('Incomplete generated image'); } catch {
    execFileSync('convert', ['-limit','thread','1',source, '-quality', '86', target]);
  }
}
for (const name of ['hero-surf.webp', 'service-surf-v2.webp', 'service-sup-v2.webp', 'service-kite-v2.webp', 'equipment-v2.webp', 'class-1-v2.webp', 'class-2-v2.webp', 'class-3-v2.webp', 'class-4-v2.webp']) {
  const source = path.join(out, 'assets', name);
  for (const width of [480, 960]) {
    const target = source.replace('.webp', `-${width}.webp`);
    try { if(!(await fs.stat(target)).size)throw Error('Incomplete generated image'); } catch {
      execFileSync('convert', ['-limit','thread','1',source, '-resize', `${width}x>`, '-quality', '85', target]);
    }
  }
}
for (const name of (await fs.readdir(path.join(out, 'assets'))).filter(n => /\.(png|webp|jpg)$/.test(n))) {
  assetSizes[name] = execFileSync('identify', ['-format', '%w %h', path.join(out, 'assets', name)], { encoding: 'utf8' }).split(' ').map(Number);
}

const extraCss = `
/* Progressive enhancement: the complete document stays visible without JavaScript. */
[data-reveal]{opacity:1;transform:none}.js-motion [data-reveal]:not(.visible){opacity:0;transform:translateY(30px)}.hero [data-reveal]{opacity:1!important;transform:none!important}
.skip-link{position:fixed;top:8px;left:5%;z-index:120;padding:.6rem 1rem;background:var(--lime);color:var(--ink);transform:translateY(-180%)}.skip-link:focus{transform:none}
.card-link::after{content:'';position:absolute;inset:0}.card:focus-within,.class-card:focus-within{outline:3px solid var(--petrol);outline-offset:3px}.class-card{position:relative}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #879619;outline-offset:4px}.nav-links:not(.open){visibility:visible}
.detail-hero{min-height:480px}.detail-hero .hero-inner{display:block;padding-top:150px}.detail-hero h1{font-size:clamp(3rem,6vw,6rem)}
.detail-body{padding:64px 0;background:var(--paper)}.detail-body h2{font:800 2.2rem/.95 var(--display);text-transform:uppercase}.detail-body p{max-width:760px}.detail-body .breadcrumb{font-size:.8rem;color:var(--muted);margin-bottom:2rem}.detail-body .breadcrumb a{text-decoration:underline}
.detail-body details{max-width:850px;border-bottom:1px solid var(--line);padding:1rem 0}.detail-body summary{cursor:pointer;font-weight:600}.detail-body .related{display:flex;gap:1rem 2rem;flex-wrap:wrap;margin-top:1.5rem}.related a{text-decoration:underline;text-underline-offset:4px}.detail-body h2:not(:first-child){margin-top:2.5rem}
.privacy-link{text-decoration:underline;text-underline-offset:3px}.consent{position:fixed;bottom:16px;left:5%;width:min(480px,90%);z-index:90;background:var(--petrol);color:white;border:1px solid var(--lime);padding:20px;box-shadow:0 6px 40px #0005}.consent h2{font:800 1.8rem/1 var(--display);margin:0}.consent p{font-size:.9rem}.consent button{margin:8px 8px 0 0;cursor:pointer}.consent button:last-child{background:transparent;color:white;border:1px solid white;padding:10px}
.hero{background-image:url('/assets/hero-surf.webp')}.phone a{color:inherit}.language-choice[aria-current="page"]{color:var(--lime)}
@media(max-width:900px){.nav-links:not(.open){visibility:hidden;pointer-events:none}.nav-links.open{visibility:visible;pointer-events:auto}.mobile-language-switcher{margin-left:auto}.menu-toggle{margin-left:0}.hero{background-image:url('/assets/hero-surf-960.webp')}}
@media(max-width:620px){.detail-hero{min-height:450px}.detail-hero .hero-inner{padding-top:110px}.detail-hero h1{font-size:clamp(2.8rem,12vw,4rem)}.detail-body{padding:42px 0}.detail-body h2{font-size:2rem}.detail-body p{font-size:.98rem}.nav{gap:.5rem}.language-choice{min-width:32px;min-height:38px}}
@media(prefers-reduced-motion:reduce){.js-motion [data-reveal]:not(.visible){opacity:1;transform:none}}
`;
let css = sourceCss.replaceAll("url('assets/", "url('/assets/").replaceAll('hero-surf.png','hero-surf.webp') + extraCss;
await fs.writeFile(path.join(out, 'assets/site.css'), css);
const cssVersion=createHash('sha256').update(css).digest('hex').slice(0,12);

// Retain the approved menu, animation, weather and dialog behavior; localize at build time.
let runtime = originalScripts[0]
  .replace("const reduced=matchMedia", "document.documentElement.classList.add('js-motion');\n    const reduced=matchMedia")
  .replace("window.siteLanguage='pt';updateSeaStatus();setInterval(updateSeaStatus,20*60*1000);", "window.siteLanguage=document.documentElement.lang==='pt-BR'?'pt':document.documentElement.lang;setTimeout(updateSeaStatus,1200);setInterval(updateSeaStatus,20*60*1000);")
  .replace("function openBooking(trigger){bookingTrigger=trigger;", "function openBooking(trigger){bookingTrigger=trigger;const activity=trigger?.dataset.service;const index={surf:0,sup:1,kite:2,rental:3}[activity];if(index!==undefined)form.querySelectorAll('input[name=modality]')[index].checked=true;const level=trigger?.dataset.level;if(level!==undefined)form.querySelectorAll('input[name=level]')[Number(level)].checked=true;window.dropTrack?.('booking_open',{service:activity||'general',placement:trigger?.dataset.placement||'page'});")
  .replace("document.querySelector('#bookingName').focus())", "closeBooking.focus())")
  .replace("window.open(`https://wa.me/5521996271203?text=${encodeURIComponent(message)}`,'_blank','noopener')", "window.dropTrack?.('whatsapp_click',{service:['surf','sup','kite','rental'][[...form.querySelectorAll('input[name=modality]')].findIndex(x=>x.checked)],placement:'booking_submit'});window.open(`https://wa.me/${window.DROP_CONFIG.whatsapp}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer')");
runtime += await fs.readFile(path.join(root, 'src/enhancements.js'), 'utf8');
await fs.writeFile(path.join(out, 'assets/site.js'), runtime);
const jsVersion=createHash('sha256').update(runtime).digest('hex').slice(0,12);

function localize(lang) {
  const { document } = parseHTML(base);
  const s = originalScripts[1];
  const i = s.indexOf("      document.querySelectorAll('[data-language]').forEach(btn=>btn.addEventListener");
  if (i < 0) throw Error('Translation source marker missing');
  vm.runInNewContext(s.slice(0, i) + `applyLanguage('${lang}');})();`, { document, window: {}, updateSeaStatus() {} });
  // Restore stable numeric participant values. Translated labels must not enter business logic.
  document.querySelectorAll('input[name=people]').forEach((x, i) => { x.value = ['1', '2', '3', '4+'][i]; });
  document.querySelectorAll('input[name=modality]').forEach((x, i) => x.setAttribute('data-service', ['surf', 'sup', 'kite', 'rental'][i]));
  document.querySelectorAll('#bookingTime option').forEach(x => { x.value = x.textContent; });
  return document;
}

function makeHead(d, key, lang) {
  const t = text[lang];
  const [title, description] = t.meta[key] || t.services[key];
  d.documentElement.lang = t.htmlLang;
  d.title = title;
  d.querySelector('meta[name=description]').content = description;
  d.querySelectorAll('style,script,link[rel=canonical],link[rel=alternate]').forEach(x => x.remove());
  const add = html => d.head.insertAdjacentHTML('beforeend', html);
  d.querySelector('link[href*="fonts.googleapis.com/css2"]').href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap';
  add(`<link rel="stylesheet" href="/assets/site.css?v=${cssVersion}">`);
  add(`<link rel="canonical" href="${esc(absolute(route(key, lang)))}">`);
  for (const language of languages) add(`<link rel="alternate" hreflang="${text[language].htmlLang}" href="${esc(absolute(route(key, language)))}">`);
  add(`<link rel="alternate" hreflang="x-default" href="${esc(absolute(route(key, 'pt')))}">`);
  add(`<meta name="robots" content="${production ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">`);
  for (const [name, value] of Object.entries({ 'og:type': 'website', 'og:site_name': 'Drop Vertical', 'og:title': title, 'og:description': description, 'og:url': absolute(route(key, lang)), 'og:locale': t.locale, 'og:image': absolute('/assets/hero-surf.webp') })) add(`<meta property="${name}" content="${esc(value)}">`);
  add('<meta name="twitter:card" content="summary_large_image">');
  for (const [name, value] of [['google-site-verification', site.googleVerification], ['msvalidate.01', site.bingVerification]]) if (value) add(`<meta name="${name}" content="${esc(value)}">`);
  if (!['privacy'].includes(key)) add('<link rel="preload" as="image" href="/assets/hero-surf.webp" media="(min-width:901px)" fetchpriority="high"><link rel="preload" as="image" href="/assets/hero-surf-960.webp" media="(max-width:900px)" fetchpriority="high">');
}

function bookingLink(lang, key = 'surf') {
  const title = text[lang].services[key]?.[2] || text[lang].book;
  const message = lang === 'en' ? `Hi Daniel and Drop Vertical team! I would like to ask about ${title.toLowerCase()} at Posto 6, Barra da Tijuca. Could you share availability and prices?` : lang === 'es' ? `¡Hola, Daniel y equipo Drop Vertical! Me gustaría consultar ${title.toLowerCase()} en el Posto 6 de Barra da Tijuca. ¿Podrían informarme sobre horarios y precios?` : `Olá, Daniel e equipe Drop Vertical! Gostaria de consultar ${title.toLowerCase()} no Posto 6 da Barra da Tijuca. Podem me informar os horários e valores?`;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

function customize(d, key, lang) {
  const t = text[lang];
  makeHead(d, key, lang);
  // Every language choice is an ordinary crawlable URL and preserves the equivalent page.
  d.querySelectorAll('[data-language]').forEach(btn => {
    const a = d.createElement('a');
    for (const { name, value } of [...btn.attributes]) if (name !== 'aria-pressed') a.setAttribute(name, value);
    a.href = route(key, btn.dataset.language);
    a.hreflang = text[btn.dataset.language].htmlLang;
    a.lang = text[btn.dataset.language].htmlLang;
    if (btn.dataset.language === lang) a.setAttribute('aria-current', 'page');
    a.innerHTML = btn.innerHTML;
    btn.replaceWith(a);
  });
  d.querySelectorAll('.language-switcher').forEach(x => x.setAttribute('aria-label', t.language));
  d.querySelector('.menu-toggle').setAttribute('aria-controls', 'primary-navigation');
  d.querySelector('.nav-links').id = 'primary-navigation';
  d.querySelector('.menu-toggle').setAttribute('aria-label', t.menu);
  d.querySelector('.booking-close').setAttribute('aria-label', t.close);
  d.querySelector('.footer-social').setAttribute('aria-label', 'Instagram Drop Vertical');
  d.querySelector('.wa-float').setAttribute('aria-label', t.whatsapp);
  const weatherDescription=d.querySelector('#seaDescription');
  if(weatherDescription) weatherDescription.textContent=lang==='en'?'Loading conditions at Posto 6…':lang==='es'?'Cargando condiciones en el Posto 6…':'Carregando dados do Posto 6…';
  d.querySelector('.logo').setAttribute('aria-label', `Drop Vertical, ${t.home}`);
  d.querySelector('.footer-links').setAttribute('aria-label', t.related);
  d.querySelector('.footer-bottom span:first-child').textContent = t.copyright;
  d.querySelector('.footer-bottom').insertAdjacentHTML('beforeend', `<a class="privacy-link" href="${route('privacy', lang)}">${t.privacy}</a>`);
  // Preserve the visually approved name, address, opening hours and Google review copy.
  // Unconfirmed details are NOT promoted into structured business facts.
  const home = route('home', lang);
  d.querySelectorAll('a[href^="#"]').forEach(a => {
    if (!a.hasAttribute('data-booking')) a.href = key === 'home' ? a.getAttribute('href') : home + a.getAttribute('href');
  });
  d.querySelectorAll('a[data-booking]').forEach(a => {
    a.href = bookingLink(lang, ['surf', 'sup', 'kite', 'rental'].includes(key) ? key : 'surf');
    a.dataset.placement = a.closest('header') ? 'header' : a.classList.contains('wa-float') ? 'floating' : 'content';
    if (keyToIndex[key] !== undefined) a.dataset.service = key;
  });
  d.querySelectorAll('.service-grid .card').forEach((card, index) => {
    const service = Object.keys(keyToIndex)[index];
    const h = card.querySelector('h3');
    h.innerHTML = `<a class="card-link" href="${route(service, lang)}">${h.innerHTML}</a>`;
  });
  d.querySelectorAll('.class-card').forEach((card, index) => {
    const h = card.querySelector('h3');
    h.innerHTML = `<a class="card-link" href="${esc(bookingLink(lang))}" data-booking data-service="surf" data-level="${index}" data-placement="class">${h.innerHTML}</a>`;
  });
  const imageOrder = ['service-surf-v2.webp','service-sup-v2.webp','service-kite-v2.webp','equipment-v2.webp','class-1-v2.webp','class-2-v2.webp','class-3-v2.webp','class-4-v2.webp','daniel-1.webp','daniel-2.webp','daniel-3.webp','daniel-4.webp'];
  d.querySelectorAll('img').forEach(img => {
    const name = img.getAttribute('src').split('/').pop().replace(/^(daniel-\d)\.png$/, '$1.webp');
    const i = imageOrder.indexOf(name);
    img.alt = t.alts[i] || img.alt;
    img.src = '/assets/' + name;
    const [width, height] = assetSizes[name];
    img.setAttribute('width', width); img.setAttribute('height', height);
    img.setAttribute('decoding', 'async');
    if (!name.startsWith('daniel-')) {
      img.setAttribute('srcset', `/assets/${name.replace('.webp', '-480.webp')} 480w, /assets/${name.replace('.webp', '-960.webp')} 960w, /assets/${name} ${width}w`);
      img.setAttribute('sizes', '(max-width:620px) 84vw, (max-width:900px) 46vw, 400px');
    }
  });
  const phone = d.querySelector('.phone');
  if(phone) phone.innerHTML = `<a href="tel:+${site.whatsapp}" data-track="phone_click">${phone.textContent}</a>`;
  const loc = d.querySelector('.location');
  if(loc) loc.innerHTML = `<a href="${esc(site.mapsUrl || 'https://www.google.com/maps/search/?api=1&query=Posto+6+Barra+da+Tijuca+Rio+de+Janeiro')}" target="_blank" rel="noopener noreferrer" data-track="location_click">${loc.innerHTML}</a>`;
  d.querySelector('main').id = 'top';
  d.body.insertAdjacentHTML('afterbegin', `<a class="skip-link" href="#top">${lang === 'pt' ? 'Pular para o conteúdo' : lang === 'en' ? 'Skip to content' : 'Ir al contenido'}</a>`);
  d.querySelector('.sea-status')?.setAttribute('title', lang === 'pt' ? 'Estimativa Open-Meteo, atualizada no site a cada 20 minutos. Confirme as condições com a equipe.' : lang === 'en' ? 'Open-Meteo estimates, refreshed every 20 minutes. Confirm conditions with the team.' : 'Estimaciones de Open-Meteo, actualizadas cada 20 minutos. Confirma las condiciones con el equipo.');
  d.querySelectorAll('.benefit-icon,.fact-icon,.service-badge,.arrow').forEach(x => x.setAttribute('aria-hidden', 'true'));
  const config = { language: lang, page: key, whatsapp: site.whatsapp, ga4Id: site.ga4Id, consent: t.consent };
  const cfg = d.createElement('script'); cfg.id = 'drop-config'; cfg.type = 'application/json'; cfg.textContent = JSON.stringify(config).replaceAll('<', '\\u003c'); d.body.append(cfg);
  const script = d.createElement('script'); script.src = '/assets/site.js?v='+jsVersion; script.defer = true; d.body.append(script);
  return d;
}

function innerPage(d, key, lang) {
  const t = text[lang];
  const m = d.querySelector('main');
  const school = key === 'school';
  const privacy = key === 'privacy';
  const heading = school ? t.school : privacy ? t.privacy : t.services[key][2];
  const intro = privacy ? '' : school ? t.meta.school[1] : t.services[key][3];
  const history = d.querySelector('.history').outerHTML;
  const final = d.querySelector('.final-cta').outerHTML;
  const cta = `<a class="btn" href="${esc(bookingLink(lang, school ? 'surf' : key))}" data-booking ${keyToIndex[key] !== undefined ? `data-service="${key}"` : ''}>${key === 'rental' ? t.rent : t.book} <span class="arrow" aria-hidden="true">→</span></a>`;
  m.innerHTML = `<section class="hero detail-hero"><div class="shell hero-inner"><div class="hero-copy"><div class="eyebrow">Drop Vertical · Posto 6 · Barra da Tijuca</div><h1 class="display">${esc(heading)}</h1>${intro ? `<p>${esc(intro)}</p>${cta}` : ''}</div></div></section><section class="detail-body"><div class="shell"><nav class="breadcrumb" aria-label="${lang === 'en' ? 'Breadcrumb' : 'Breadcrumbs'}"><a href="${route('home', lang)}">${t.home}</a> / <span aria-current="page">${heading}</span></nav>${privacy ? t.privacyText.map(x => `<p>${esc(x)}</p>`).join('') : `<h2>${t.location}</h2><p>${t.place}</p><p>${t.contact}</p><a href="${esc(site.mapsUrl || 'https://www.google.com/maps/search/?api=1&query=Posto+6+Barra+da+Tijuca+Rio+de+Janeiro')}" data-track="location_click" target="_blank" rel="noopener noreferrer">${t.map}</a><h2>${t.how}</h2><p>${t.process}</p>${cta}<h2>${t.faq}</h2>${t.questions.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}<h2>${t.related}</h2><div class="related">${Object.keys(keyToIndex).filter(x => x !== key).map(x => `<a href="${route(x, lang)}">${t.services[x][2]}</a>`).join('')}<a href="${route('school', lang)}">${t.school}</a></div>`}</div></section>${school ? history : ''}${privacy ? '' : final}`;
}

function schema(d, key, lang) {
  const t = text[lang];
  const id = suffix => absolute('/#' + suffix);
  const business = { '@type': 'LocalBusiness', '@id': id('school'), name: site.name, url: origin + '/', areaServed: { '@type': 'Place', name: 'Posto 6, Barra da Tijuca, Rio de Janeiro, Brasil' }, sameAs: [site.instagram], contactPoint: { '@type': 'ContactPoint', telephone: '+' + site.whatsapp, contactType: 'reservations', availableLanguage: ['pt-BR', 'en', 'es'] } };
  if (site.confirmedAddress) business.address = { '@type': 'PostalAddress', ...site.confirmedAddress };
  if (site.confirmedOpeningHours) business.openingHoursSpecification = site.confirmedOpeningHours;
  if (site.mapsUrl) business.hasMap = site.mapsUrl;
  const graph = [business, { '@type': 'WebSite', '@id': id('website'), url: origin + '/', name: site.name, publisher: { '@id': id('school') }, inLanguage: ['pt-BR', 'en', 'es'] }, { '@type': 'WebPage', '@id': absolute(route(key, lang)) + '#page', url: absolute(route(key, lang)), name: d.title, description: d.querySelector('meta[name=description]').content, inLanguage: t.htmlLang, isPartOf: { '@id': id('website') }, about: { '@id': id('school') } }];
  const services = key === 'home' ? Object.keys(keyToIndex) : keyToIndex[key] !== undefined ? [key] : [];
  for (const service of services) graph.push({ '@type': 'Service', '@id': absolute(route(service, lang)) + '#service', name: t.services[service][2], description: t.services[service][3], url: absolute(route(service, lang)), provider: { '@id': id('school') }, areaServed: { '@type': 'City', name: 'Rio de Janeiro' } });
  if (key !== 'home') graph.push({ '@type': 'BreadcrumbList', '@id': absolute(route(key, lang)) + '#breadcrumbs', itemListElement: [{ '@type': 'ListItem', position: 1, name: t.home, item: absolute(route('home', lang)) }, { '@type': 'ListItem', position: 2, name: t.services[key]?.[2] || t[key], item: absolute(route(key, lang)) }] });
  const script = d.createElement('script'); script.type = 'application/ld+json'; script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c'); d.head.append(script);
}

const pages = [];
for (const key of Object.keys(slugs)) for (const lang of languages) {
  const d = localize(lang);
  // Build the inner page after approved copy translation but before adding common metadata.
  if (key !== 'home') innerPage(d, key, lang);
  customize(d, key, lang);
  schema(d, key, lang);
  const dir = path.join(out, route(key, lang));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.html'), '<!doctype html>\n' + d.documentElement.outerHTML);
  pages.push({ key, lang, route: route(key, lang) });
}

const notFound = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>404 | Drop Vertical</title><link rel="stylesheet" href="/assets/site.css"></head><body><main class="detail-body"><div class="shell"><h1>404</h1><p>Página não encontrada / Page not found / Página no encontrada</p><nav><a href="/">Português</a> · <a href="/en/">English</a> · <a href="/es/">Español</a></nav></div></main></body></html>`;
await fs.writeFile(path.join(out, '404.html'), notFound);
// sitemap.xml includes the configured (real) origin. Production is opt-in.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${pages.map(({ key, lang }) => `<url><loc>${esc(absolute(route(key, lang)))}</loc>${languages.map(l => `<xhtml:link rel="alternate" hreflang="${text[l].htmlLang}" href="${esc(absolute(route(key, l)))}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${esc(absolute(route(key, 'pt')))}"/></url>`).join('\n')}</urlset>`;
await fs.writeFile(path.join(out, 'sitemap.xml'), sitemap);
await fs.writeFile(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n${production ? `Sitemap: ${origin}/sitemap.xml\n` : '# Preview: noindex is on every HTML document and response. Crawling stays allowed so robots can read it.\n'}`);
await fs.writeFile(path.join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n  ${production ? 'X-Robots-Tag: index,follow' : 'X-Robots-Tag: noindex,follow'}\n/assets/*\n  Cache-Control: public, max-age=86400\n`);
await fs.writeFile(path.join(out, '_redirects'), '/pt/ / 301\n/pt/index.html / 301\n');
await fs.writeFile(path.join(root, 'reports/routes.json'), JSON.stringify({ origin, environment: site.environment, pages }, null, 2));
console.log(`Built ${pages.length} localized documents + 404; ${site.environment}; origin ${origin}`);
