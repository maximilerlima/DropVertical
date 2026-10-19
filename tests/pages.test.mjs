import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {parseHTML} from 'linkedom';
const root=new URL('../',import.meta.url).pathname;
const config=JSON.parse(await fs.readFile(path.join(root,'reports/github-pages.json'),'utf8'));
const origin=new URL(config.url).origin;
const prefix=config.basePath;
const routes=JSON.parse(await fs.readFile(path.join(root,'reports/routes.json'),'utf8')).pages;

test('21 localized documents use the actual GitHub Pages project prefix',async()=>{
 for(const p of routes){
  const file=path.join(root,'docs',p.route,'index.html');
  const {document:d}=parseHTML(await fs.readFile(file,'utf8'));
  assert.equal(d.querySelector('link[rel=canonical]').href,config.url.replace(/\/$/,'')+p.route);
  assert.equal(d.querySelector('meta[property="og:url"]').content,config.url.replace(/\/$/,'')+p.route);
  for(const link of d.querySelectorAll('[data-language]'))assert.ok(link.href.startsWith(prefix+'/'));
  for(const el of d.querySelectorAll('[src],[href]'))for(const attr of ['src','href']){
   const value=el.getAttribute(attr);if(!value)continue;
   const url=new URL(value,config.url+p.route.slice(1));if(url.origin!==origin)continue;
   assert.ok(url.pathname.startsWith(prefix+'/'),`${file}: ${url.pathname}`);
   const relative=url.pathname.slice(prefix.length);
   let target=path.join(root,'docs',relative);if(url.pathname.endsWith('/'))target=path.join(target,'index.html');
   await fs.access(target);
  }
 }
});
test('CSS image URLs are adapted, images are local, no Jekyll is enabled',async()=>{
 const css=await fs.readFile(path.join(root,'docs/assets/site.css'),'utf8');
 assert.ok(!css.includes("url('/assets/"));
 for(const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)){
  const value=match[1];if(!value.startsWith('/'))continue;
  assert.ok(value.startsWith(prefix+'/'));
  await fs.access(path.join(root,'docs',value.slice(prefix.length)));
 }
 await fs.access(path.join(root,'docs','.nojekyll'));
});
test('sitemap and structured data do not retain Sites or unprefixed GitHub URLs',async()=>{
 const sitemap=await fs.readFile(path.join(root,'docs/sitemap.xml'),'utf8');
 assert.equal((sitemap.match(/<loc>/g)||[]).length,21);
 assert.ok(sitemap.includes(config.url));assert.ok(!sitemap.includes('chatgpt.site'));
 for(const p of routes){
  const {document:d}=parseHTML(await fs.readFile(path.join(root,'docs',p.route,'index.html'),'utf8'));
  const json=d.querySelector('script[type="application/ld+json"]').textContent;
  assert.ok(!json.includes('chatgpt.site'));
  const values=[...json.matchAll(/https:\/\/maximilerlima\.github\.io[^" ]*/g)].map(x=>x[0]);
  assert.ok(values.every(x=>x.startsWith(config.url)));
 }
});
