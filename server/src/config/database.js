import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { Pool, Client } = pg;

function connectionSettings(){
  if(process.env.DATABASE_URL){
    const url=new URL(process.env.DATABASE_URL);
    return {host:url.hostname,port:Number(url.port||5432),user:decodeURIComponent(url.username),password:decodeURIComponent(url.password),database:decodeURIComponent(url.pathname.replace(/^\//,'')),ssl:['require','verify-ca','verify-full'].includes(url.searchParams.get('sslmode'))?{rejectUnauthorized:false}:undefined};
  }
  return {host:process.env.PGHOST||'localhost',port:Number(process.env.PGPORT||5432),user:process.env.PGUSER||'postgres',password:process.env.PGPASSWORD,database:process.env.PGDATABASE||'kediri_desa',ssl:process.env.PGSSL==='true'?{rejectUnauthorized:false}:undefined};
}
const target=connectionSettings();
export const pool=new Pool({...target,max:12,idleTimeoutMillis:30000,connectionTimeoutMillis:5000});
pool.on('error',err=>console.error('PostgreSQL pool error:',err.message));

/** Create the target database when absent, then apply idempotent schema DDL. */
export async function initializeDatabase(){
  const name=target.database;
  if(!name||name==='postgres')throw new Error('PGDATABASE / database name must be set to a project database (for example kediri_desa).');
  const admin=new Client({...target,database:process.env.PGMAINTENANCE_DATABASE||'postgres',connectionTimeoutMillis:5000});
  try{
    await admin.connect();
    const {rows}=await admin.query('SELECT 1 FROM pg_database WHERE datname=$1',[name]);
    if(!rows.length){
      const safeName='"'+name.replaceAll('"','""')+'"';
      try{await admin.query(`CREATE DATABASE ${safeName}`);console.log(`PostgreSQL database "${name}" created.`)}
      catch(err){if(err.code!=='42P04')throw err;console.log(`PostgreSQL database "${name}" was created by another process.`)}
    }else console.log(`PostgreSQL database "${name}" already exists.`);
  }finally{await admin.end().catch(()=>{});}

  const here=path.dirname(fileURLToPath(import.meta.url));
  const schema=await fs.readFile(path.join(here,'schema.sql'),'utf8');
  await pool.query(schema);
  console.log('Database schema checked/applied successfully.');
  await seedDefaultAdmin();
}

async function seedDefaultAdmin(){
  const name=process.env.BOOTSTRAP_ADMIN_NAME;
  const email=process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password=process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if(!name||!email||!password){console.warn('Default Admin seed skipped: set BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in server/.env.');return;}
  if(password.length<12)throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.');
  const {rows}=await pool.query("SELECT 1 FROM users WHERE role='admin' LIMIT 1");
  if(rows.length){console.log('Admin account already exists; default Admin seed skipped.');return;}
  const hash=await bcrypt.hash(password,12);
  const result=await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin') ON CONFLICT(email) DO NOTHING RETURNING id",[name,email,hash]);
  if(result.rowCount)console.log(`Default Admin account created for ${email}.`);
  else console.warn(`Default Admin seed not created: ${email} is already registered.`);
}
export async function checkDatabase(){await pool.query('SELECT 1');}
