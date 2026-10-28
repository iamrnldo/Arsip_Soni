import 'dotenv/config';
import app from './app.js';
import {initializeDatabase} from './config/database.js';
const port=Number(process.env.PORT||5000);

async function checkPort(){
  try{
    const response=await fetch(`http://127.0.0.1:${port}/api/health`,{signal:AbortSignal.timeout(1200)});
    const body=await response.json().catch(()=>null);
    if(body?.service==='kediri-desa-api')return 'same-api';
    return 'occupied';
  }catch(error){
    if(error.name==='TimeoutError'||error.name==='AbortError')return 'unknown';
    return 'free';
  }
}

const portState=await checkPort();
if(portState==='same-api'){
  // Let Node exit naturally. process.exit() inside --watch can trigger a Windows libuv assertion.
  console.log(`Kediri Desa API is already running on port ${port}; reusing existing instance.`);
}else if(portState==='occupied'){
  console.error(`Port ${port} is in use by another service (not the Kediri API). Stop it or change PORT in server/.env.`);
  process.exitCode=1;
}else if(portState==='unknown'){
  console.error(`Could not determine whether port ${port} is available. Check the existing server process.`);
  process.exitCode=1;
}else{
  try{
    await initializeDatabase();
  }catch(err){
    console.error('Automatic PostgreSQL setup failed:',err.message||err.code||err);
    console.error('Check PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE and database creation privileges.');
  }
  const server=app.listen(port,'0.0.0.0',()=>console.log(`Kediri Desa REST API listening on 0.0.0.0:${port}`));
  server.on('error',err=>{
    if(err.code==='EADDRINUSE')console.error(`Port ${port} became occupied before the API could start. Stop the other process or reuse the running API.`);
    else console.error('API listener failed:',err);
    process.exitCode=1;
  });
}
