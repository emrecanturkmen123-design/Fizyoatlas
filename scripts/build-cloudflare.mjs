import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['scripts/build-full.mjs'],{stdio:'inherit',env:{...process.env,VITE_AUTH_PROVIDER:'cloudflare',FIZYO_PUBLIC_ORIGIN:process.env.FIZYO_PUBLIC_ORIGIN??'https://atlas.fizyoatlas.workers.dev'}});
process.exit(result.status??1);
