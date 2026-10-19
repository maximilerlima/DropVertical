import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

const root=fileURLToPath(new URL('../',import.meta.url));
const url=new URL(process.env.PAGES_URL || 'https://maximilerlima.github.io/DropVertical/');
if(!['http:','https:'].includes(url.protocol))throw Error('PAGES_URL must be an absolute HTTP(S) URL');
if(url.search||url.hash)throw Error('PAGES_URL cannot include a query or fragment');
const basePath=url.pathname.replace(/\/$/,'');
const origin=url.origin;
const prefix=origin+basePath;
const local=p=>basePath+p;
execFileSync(process.execPath,[path.join(root,'scripts/build.mjs')],{cwd:root,env:{...process.env,SITE_URL:origin},stdio:'inherit'});

async function walk(dir){
 const result=[];
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const p=path.join(dir,entry.name);
  if(entry.isDirectory())result.push(...await walk(p));else result.push(p);
 }
 return result;
}

for(const source of await walk(path.join(root,'dist'))){
 const relative=path.relative(path.join(root,'dist'),source);
 if(['_headers','_redirects'].includes(relative))continue; // GitHub Pages does not execute these formats.
 const dest=path.join(root,'docs',relative);
 await fs.mkdir(path.dirname(dest),{recursive:true});
 if(relative.endsWith('.html')){
  const {document:d}=parseHTML(await fs.readFile(source,'utf8'));
  for(const el of d.querySelectorAll('[href],[src],[srcset]')){
   for(const attr of ['href','src']){
    const val=el.getAttribute(attr);
    if(val?.startsWith('/')&&!val.startsWith('//'))el.setAttribute(attr,local(val));
    else if(val?.startsWith(origin+'/'))el.setAttribute(attr,prefix+val.slice(origin.length));
   }
   const srcset=el.getAttribute('srcset');
   if(srcset)el.setAttribute('srcset',srcset.split(',').map(x=>{
    const [src,...descriptor]=x.trim().split(/\s+/);return (src.startsWith('/')?local(src):src)+' '+descriptor.join(' ');
   }).join(', '));
  }
  for(const meta of d.querySelectorAll('meta[property="og:url"],meta[property="og:image"]')){
   if(meta.content.startsWith(origin+'/'))meta.content=prefix+meta.content.slice(origin.length);
  }
  for(const script of d.querySelectorAll('script[type="application/ld+json"]'))script.textContent=script.textContent.replaceAll(origin+'/',prefix+'/');
  await fs.writeFile(dest,'<!doctype html>\n'+d.documentElement.outerHTML);
 }else if(relative.endsWith('.css')){
  const css=(await fs.readFile(source,'utf8')).replace(/url\((['"]?)(\/(?!\/))/g,(_,quote)=>`url(${quote}${basePath}/`);
  await fs.writeFile(dest,css);
 }else if(['sitemap.xml','robots.txt'].includes(relative)){
  await fs.writeFile(dest,(await fs.readFile(source,'utf8')).replaceAll(origin+'/',prefix+'/'));
 }else await fs.copyFile(source,dest);
}
await fs.writeFile(path.join(root,'docs','.nojekyll'),'');
await fs.writeFile(path.join(root,'reports','github-pages.json'),JSON.stringify({url:prefix+'/',basePath,source:'main:/docs',environment:process.env.SITE_ENV||'preview'},null,2));
console.log(`GitHub Pages files generated in docs/ for ${prefix}/`);
