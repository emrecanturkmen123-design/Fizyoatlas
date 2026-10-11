import {spawnSync} from 'node:child_process';import {mkdirSync,copyFileSync,cpSync,rmSync,writeFileSync} from 'node:fs';
// Remove only generated build output; keep source and the checked-in schema intact.
rmSync('dist',{recursive:true,force:true});
for(const args of [['node_modules/vite/bin/vite.js','build'],['node_modules/vite/bin/vite.js','build','--config','vite.worker.config.ts']]){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
const pages=spawnSync(process.execPath,['--import','./scripts/register-ui.mjs','scripts/build-study-pages.mjs'],{stdio:'inherit'});if(pages.status!==0)process.exit(pages.status??1);
mkdirSync('dist/.openai',{recursive:true});copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
writeFileSync('dist/server/wrangler.json',JSON.stringify({name:'fizyo-atlas',main:'index.js',compatibility_date:'2026-09-09',assets:{directory:'../client',binding:'ASSETS',run_worker_first:['/api/*'],not_found_handling:'single-page-application'}},null,2));
