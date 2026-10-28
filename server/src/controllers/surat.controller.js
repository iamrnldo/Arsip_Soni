import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../config/database.js';
const selectable=`l.id,l.code,l.name,l.type,l.category,to_char(l.letter_date,'DD Mon YYYY') AS date,l.direction,u.name AS owner,l.original_filename,l.mime_type,l.file_size,l.created_at`;
export async function listLetters(req,res){
 const {category,search}=req.query; const vals=[];
 // Confidential archive is restricted to admins; staff only see public/important records.
 let where=req.user.role==='admin'?'TRUE':`l.category <> 'Rahasia'`;
 if(category&&['Umum','Penting','Rahasia'].includes(category)){vals.push(category);where+=` AND l.category=$${vals.length}`;}
 if(search){vals.push(`%${search}%`);where+=` AND (l.name ILIKE $${vals.length} OR l.code ILIKE $${vals.length})`;}
 const {rows}=await pool.query(`SELECT ${selectable} FROM letters l JOIN users u ON u.id=l.uploaded_by WHERE ${where} ORDER BY l.letter_date DESC,l.created_at DESC LIMIT 200`,vals);
 res.json({letters:rows});
}
export async function createLetter(req,res){
 const {code,name,type,category,letter_date,direction}=req.body;
 if(!code||!name||!type||!category||!letter_date||!direction)return res.status(400).json({error:'Lengkapi semua data wajib surat.'});
 if(!['Umum','Penting','Rahasia'].includes(category)||!['Masuk','Keluar'].includes(direction))return res.status(400).json({error:'Kategori atau arah surat tidak valid.'});
 const f=req.file;
 try{
  const {rows}=await pool.query(`INSERT INTO letters(code,name,type,category,letter_date,direction,original_filename,stored_filename,mime_type,file_size,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,code,name,type,category,to_char(letter_date,'DD Mon YYYY') AS date,direction`,[code,name,type,category,letter_date,direction,f?.originalname||null,f?.filename||null,f?.mimetype||null,f?.size||null,req.user.sub]);
  await pool.query('INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,ip_address) VALUES($1,$2,$3,$4,$5)',[req.user.sub,'create','letter',rows[0].id,req.ip]);
  res.status(201).json({letter:rows[0]});
 }catch(err){if(f)await fs.unlink(f.path).catch(()=>{});throw err;}
}
export async function downloadLetter(req,res){
 const {rows}=await pool.query('SELECT category,stored_filename,original_filename,mime_type FROM letters WHERE id=$1',[req.params.id]);
 const doc=rows[0];if(!doc)return res.status(404).json({error:'Berkas surat tidak ditemukan.'});
 if(doc.category==='Rahasia'&&req.user.role!=='admin')return res.status(403).json({error:'Arsip rahasia hanya dapat dibuka Admin.'});
 if(!doc.stored_filename)return res.status(404).json({error:'Surat ini belum memiliki berkas.'});
 const file=path.resolve(process.env.UPLOAD_DIR||'uploads',doc.stored_filename);res.type(doc.mime_type||'application/octet-stream');res.download(file,doc.original_filename||'surat');
}
