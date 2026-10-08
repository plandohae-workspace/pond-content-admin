import {build} from 'esbuild';
import {mkdirSync,writeFileSync} from 'node:fs';
const result=await build({entryPoints:['src/main.jsx'],bundle:true,write:false,outfile:'pond.js',format:'iife',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text.replaceAll('</script','<\\/script');
const css=result.outputFiles.find(f=>f.path.endsWith('.css'))?.text||'';
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/POND-Admin.html',`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>POND Admin 미리보기</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`);
console.log('artifacts/POND-Admin.html 생성 완료');
