import 'dotenv/config';
import bcrypt from 'bcryptjs';
import {pool} from '../config/database.js';
const [name,email,password]=process.argv.slice(2);
if(!name||!email||!password||password.length<10){console.error('Usage: npm run create-admin -- "Nama" email@example.id "password-min-10-char"');process.exit(1)}
try{const hash=await bcrypt.hash(password,12);await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin')",[name,email,hash]);console.log(`Admin ${email} created.`)}catch(e){console.error(e.message);process.exitCode=1}finally{await pool.end()}
