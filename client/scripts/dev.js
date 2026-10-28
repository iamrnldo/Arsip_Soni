import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const clientDir=path.resolve(here,'..');
const serverDir=path.resolve(clientDir,'..','server');
const apiUrl='http://127.0.0.1:5000/api/health';
let apiProcess=null;
let webProcess=null;
let stopping=false;

async function apiIsRunning(){
  try{
    const response=await fetch(apiUrl,{signal:AbortSignal.timeout(1200)});
    const body=await response.json();
    return body?.service==='kediri-desa-api';
  }catch{return false;}
}
function spawnChild(command,args,cwd){
  return spawn(command,args,{cwd,stdio:'inherit',windowsHide:true});
}
function stopAll(code=0){
  if(stopping)return;
  stopping=true;
  if(webProcess&&!webProcess.killed)webProcess.kill();
  if(apiProcess&&!apiProcess.killed)apiProcess.kill();
  process.exitCode=code;
}
process.on('SIGINT',()=>stopAll(0));
process.on('SIGTERM',()=>stopAll(0));

if(await apiIsRunning()){
  console.log('[API] Existing Kediri API detected on port 5000; reusing it.');
}else{
  apiProcess=spawnChild(process.execPath,['--watch','src/server.js'],serverDir);
  apiProcess.on('exit',(code)=>{
    if(!stopping){console.error(`[API] Backend process exited (${code}).`);stopAll(code||1);}
  });
  let ready=false;
  for(let attempt=0;attempt<100;attempt++){
    if(stopping)process.exit(1);
    if(await apiIsRunning()){ready=true;break;}
    if(apiProcess.exitCode!==null){stopAll(apiProcess.exitCode||1);process.exit(apiProcess.exitCode||1);}
    await new Promise(resolve=>setTimeout(resolve,300));
  }
  if(!ready){console.error('[API] Did not become ready on port 5000. Check backend logs and server/.env.');stopAll(1);process.exit(1);}
}

console.log('[WEB] Starting Vite on port 5173.');
webProcess=spawnChild(process.execPath,[path.join(clientDir,'node_modules','vite','bin','vite.js'),'--host','0.0.0.0'],clientDir);
webProcess.on('exit',code=>stopAll(code||0));
