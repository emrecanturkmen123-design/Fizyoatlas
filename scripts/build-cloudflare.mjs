import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['scripts/build-full.mjs'],{stdio:'inherit',env:{...process.env,VITE_AUTH_PROVIDER:'cloudflare'}});
process.exit(result.status??1);
