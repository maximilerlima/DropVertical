import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { parseHTML, Event } from 'linkedom';
import { languages, slugs, route, text } from '../src/seo-content.mjs';
import { site } from '../config/site.mjs';

const root = new URL('../', import.meta.url).pathname;
const html = async (key, lang) => fs.readFile(path.join(root, 'dist', route(key, lang), 'index.html'), 'utf8');
const docs = [];
for (const key of Object.keys(slugs)) for (const lang of languages) docs.push({ key, lang, document: parseHTML(await html(key, lang)).document });
const production = site.environment === 'production';

test('21 complete static pages, unique titles and descriptions, one H1 each', () => {
  assert.equal(docs.length,21);
  assert.equal(new Set(docs.map(x=>x.document.title)).size,21);
  assert.equal(new Set(docs.map(x=>x.document.querySelector('meta[name=description]').content)).size,21);
  for (const {key,lang,document:d} of docs) {
    assert.equal(d.documentElement.lang,text[lang].htmlLang);
    assert.equal(d.querySelectorAll('h1').length,1,`${key}/${lang}`);
    assert.ok(d.querySelector('h1').textContent.trim());
    assert.ok(d.title.length<90);
    assert.ok(d.querySelector('main').textContent.length>300);
    assert.equal(d.querySelector('meta[name=robots]').content,production?'index,follow,max-image-preview:large':'noindex,follow');
  }
});

test('self canonical and reciprocal hreflang on all equivalent pages', () => {
  for(const {key,lang,document:d} of docs){
    const absolute = p => new URL(p,site.siteUrl).href;
    assert.equal(d.querySelector('link[rel=canonical]').href,absolute(route(key,lang)));
    const alternates=[...d.querySelectorAll('link[rel=alternate]')];
    assert.equal(alternates.length,4);
    for(const l of languages) assert.equal(alternates.find(a=>a.hreflang===text[l].htmlLang).href,absolute(route(key,l)));
    assert.equal(alternates.find(a=>a.hreflang==='x-default').href,absolute(route(key,'pt')));
  }
});

test('all local links, images, CSS, scripts and responsive image candidates resolve',async()=>{
  for(const {key,lang,document:d} of docs){
    const base=new URL(route(key,lang),site.siteUrl);
    const attrs=[...d.querySelectorAll('[href],[src]')].flatMap(el=>['href','src'].map(a=>el.getAttribute(a)).filter(Boolean));
    for(const img of d.querySelectorAll('img[srcset]'))attrs.push(...img.getAttribute('srcset').split(',').map(x=>x.trim().split(' ')[0]));
    for(const value of attrs){
      const url=new URL(value,base); if(url.origin!==base.origin)continue;
      let file=path.join(root,'dist',decodeURIComponent(url.pathname));
      if(url.pathname.endsWith('/'))file=path.join(file,'index.html');
      await fs.access(file);
      if(url.hash && url.pathname.endsWith('/')){
        const target=parseHTML(await fs.readFile(file,'utf8')).document;
        assert.ok(target.getElementById(url.hash.slice(1)),`${base.pathname}: missing ${url.hash}`);
      }
    }
  }
});

test('approved PT home copy, section order and founder photos are preserved',async()=>{
  const old=parseHTML(await fs.readFile(path.join(root,'src/home-template.html'),'utf8')).document;
  const current=docs.find(x=>x.key==='home'&&x.lang==='pt').document;
  const normalize=s=>s.replace(/\s+/g,' ').trim();
  const selectors=['.hero h1','.hero p','.section-head','.stage','.manifesto-grid','.history-copy','.final-cta h2','.final-cta p'];
  for(const selector of selectors)assert.equal(normalize(current.querySelector(selector).textContent),normalize(old.querySelector(selector).textContent),selector);
  assert.deepEqual([...current.querySelectorAll('main>section')].map(x=>x.className),[...old.querySelectorAll('main>section')].map(x=>x.className));
  assert.deepEqual([...current.querySelectorAll('.history img')].map(x=>x.src.split('/').pop()),['daniel-1.webp','daniel-2.webp','daniel-3.webp','daniel-4.webp']);
});

test('all images have localized alt text, intrinsic size, lazy loading and async decoding',()=>{
  for(const {document:d} of docs)for(const img of d.querySelectorAll('img')){
    assert.ok(img.alt?.trim());assert.ok(Number(img.getAttribute('width'))>0);assert.ok(Number(img.getAttribute('height'))>0);
    assert.equal(img.getAttribute('loading'),'lazy');assert.equal(img.getAttribute('decoding'),'async');
  }
});

test('JSON-LD uses shared business ID, Services and BreadcrumbList without unverified facts',()=>{
  for(const {key,document:d} of docs){
    const graph=JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
    const business=graph.find(x=>x['@type']==='LocalBusiness');
    assert.ok(business['@id'].endsWith('/#school'));
    for(const prop of ['aggregateRating','review','priceRange','geo','openingHoursSpecification','address'])assert.equal(business[prop],undefined);
    if(key==='home')assert.equal(graph.filter(x=>x['@type']==='Service').length,4);
    if(key!=='home')assert.equal(graph.filter(x=>x['@type']==='BreadcrumbList').length,1);
  }
});

test('language flags are ordinary links and PT return exists on desktop and mobile',()=>{
  for(const {key,lang,document:d}of docs){
    for(const selector of ['.nav-links .language-switcher','.mobile-language-switcher']){
      const links=[...d.querySelectorAll(selector+' a')]; assert.equal(links.length,3);
      assert.equal(links.filter(a=>a.getAttribute('aria-current')==='page').length,1);
      for(const link of links){assert.ok(link.querySelector('svg'));assert.equal(link.href,route(key,link.dataset.language));assert.ok(link.querySelector('small').textContent);}
    }
  }
});

test('sitemap covers all pages and robots follows the configured environment',async()=>{
  const sitemap=await fs.readFile(path.join(root,'dist/sitemap.xml'),'utf8');
  assert.equal((sitemap.match(/<loc>/g)||[]).length,21);
  assert.equal((sitemap.match(/hreflang=/g)||[]).length,84);
  for(const {key,lang}of docs)assert.ok(sitemap.includes(new URL(route(key,lang),site.siteUrl).href));
  const robots=await fs.readFile(path.join(root,'dist/robots.txt'),'utf8');
  assert.ok(robots.includes('Allow: /'));
  assert.equal(robots.includes('Sitemap:'),production);
  const unknown=await fs.readFile(path.join(root,'dist/404.html'),'utf8'); assert.ok(unknown.includes('noindex,follow'));
});

test('external JS parses, no visitor PII is included in event allowlist',async()=>{
  const js=await fs.readFile(path.join(root,'dist/assets/site.js'),'utf8');new vm.Script(js);
  assert.ok(js.includes("['service', 'placement', 'target_language']"));
  assert.ok(js.includes('if (!consent || !config.ga4Id || analyticsLoaded) return;'));
  assert.ok(!js.includes("window.siteLanguage='pt'"));
  assert.ok(js.includes('noopener,noreferrer'));
});

for(const lang of languages)test(`booking in ${lang}: contextual modality, numeric people, localized WhatsApp and no analytics without consent`,async()=>{
  const {document:d,window:w}=parseHTML(await html('home',lang));
  const opened=[];const store=new Map();const timers=[];
  w.open=(url)=>opened.push(url);w.dropTrack=undefined;
  class MockFormData{constructor(form){this.form=form;}get(name){const input=this.form.querySelector(`[name="${name}"]:checked`)||this.form.querySelector(`[name="${name}"]`);if(name==='time')return [...input.querySelectorAll('option')].find(x=>x.hasAttribute('selected'))?.getAttribute('value');return input?.getAttribute('value')||'';}}
  const context={document:d,window:w,console,URL,Intl,Date,Number,Math,FormData:MockFormData,location:{reload(){},href:''},scrollY:0,innerWidth:390,innerHeight:844,matchMedia:()=>({matches:true}),addEventListener(){},setInterval(){},setTimeout(fn){timers.push(fn)},requestAnimationFrame(fn){fn()},MutationObserver:class{observe(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
  vm.runInNewContext(await fs.readFile(path.join(root,'dist/assets/site.js'),'utf8'),context);
  assert.equal(w.siteLanguage,lang);assert.equal(store.get('drop-language'),lang);
  const modal=d.querySelector('.booking-modal');
  const trigger=d.querySelector('.hero [data-booking]');trigger.dataset.service='kite';
  trigger.dispatchEvent(new Event('click',{bubbles:true,cancelable:true}));
  assert.equal(modal.hidden,false);
  const form=d.querySelector('#bookingForm');d.querySelector('#bookingName').setAttribute('value','Test Visitor');
  // linkedom does not implement checked radio-group mutual exclusion. Emulate native radio behavior.
  form.querySelectorAll('input[name=modality]').forEach((x,i)=>{x.checked=i===2;if(i===2)x.setAttribute('checked','');else x.removeAttribute('checked')});
  form.querySelectorAll('input[name=people]').forEach((x,i)=>{x.checked=i===1;if(i===1)x.setAttribute('checked','');else x.removeAttribute('checked')});
  form.dispatchEvent(new Event('submit',{cancelable:true}));
  assert.equal(opened.length,1);const url=new URL(opened[0]);assert.equal(url.pathname,'/'+site.whatsapp);
  const message=url.searchParams.get('text');assert.ok(message.includes('Test Visitor'));assert.ok(message.includes('Kitesurf'));
  assert.ok(message.includes(lang==='pt'?'2 pessoa(s)':'Participants:* 2')||message.includes('Participantes:* 2'));
  assert.ok(message.startsWith(lang==='pt'?'Olá':lang==='en'?'Hi Daniel':'¡Hola'));
  assert.equal(d.querySelectorAll('script[src*="googletagmanager"]').length,0);
  d.querySelector('.booking-close').dispatchEvent(new Event('click'));assert.equal(modal.hidden,true);
});
