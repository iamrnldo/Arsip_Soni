import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../config/database.js';
const selectable=`l.id,l.code,l.name,l.type,l.category,to_char(l.letter_date,'DD Mon YYYY') AS date,l.letter_date::text AS letter_date,l.direction,u.name AS owner,l.original_filename,l.mime_type,l.file_size,l.created_at`;
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
  const {rows}=await pool.query(`INSERT INTO letters(code,name,type,category,letter_date,direction,original_filename,stored_filename,mime_type,file_size,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,code,name,type,category,to_char(letter_date,'DD Mon YYYY') AS date,letter_date::text AS letter_date,direction,original_filename,mime_type,file_size`,[code,name,type,category,letter_date,direction,f?.originalname||null,f?.filename||null,f?.mimetype||null,f?.size||null,req.user.sub]);
  await pool.query('INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,ip_address) VALUES($1,$2,$3,$4,$5)',[req.user.sub,'create','letter',rows[0].id,req.ip]);
  res.status(201).json({letter:rows[0]});
 }catch(err){if(f)await fs.unlink(f.path).catch(()=>{});throw err;}
}
async function getLetterFile(req,res){
 const {rows}=await pool.query('SELECT category,stored_filename,original_filename,mime_type FROM letters WHERE id=$1',[req.params.id]);
 const doc=rows[0];if(!doc){res.status(404).json({error:'Berkas surat tidak ditemukan.'});return null;}
 if(doc.category==='Rahasia'&&req.user.role!=='admin'){res.status(403).json({error:'Arsip rahasia hanya dapat dibuka Admin.'});return null;}
 if(!doc.stored_filename){res.status(404).json({error:'Surat ini belum memiliki berkas.'});return null;}
 return {doc,file:path.resolve(process.env.UPLOAD_DIR||'uploads',doc.stored_filename)};
}
export async function previewLetter(req,res){
 const entry=await getLetterFile(req,res);if(!entry)return;
 const {doc,file}=entry;
 const previewable=new Set(['application/pdf','image/jpeg','image/png','image/gif','image/webp','text/plain','text/csv','audio/mpeg','audio/wav','audio/ogg','video/mp4','video/webm']);
 if(!previewable.has((doc.mime_type||'').toLowerCase()))return res.status(415).json({error:'Tipe file ini belum dapat dipratinjau di browser. Silakan unduh berkasnya.'});
 const name=path.basename(doc.original_filename||'preview');
 res.set({'Content-Type':doc.mime_type,'Content-Disposition':`inline; filename="${name.replace(/["\\\\]/g,'_')}"`,'X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Cache-Control':'private, no-store'});
 res.sendFile(file);
}
export async function updateLetter(req,res){
 const id=req.params.id;const {code,name,type,category,letter_date,direction}=req.body||{};const file=req.file;
 const allowedCategories=['Umum','Penting','Rahasia'];const allowedDirections=['Masuk','Keluar'];
 if(category!==undefined&&!allowedCategories.includes(category)){if(file)await fs.unlink(file.path).catch(()=>{});return res.status(400).json({error:'Kategori surat tidak valid.'});}
 if(direction!==undefined&&!allowedDirections.includes(direction)){if(file)await fs.unlink(file.path).catch(()=>{});return res.status(400).json({error:'Arah surat tidak valid.'});}
 const fields={code,name,type,category,letter_date,direction};const values=[id];const sets=[];
 for(const [key,value] of Object.entries(fields)){if(value!==undefined){if(typeof value==='string'&&!value.trim()){if(file)await fs.unlink(file.path).catch(()=>{});return res.status(400).json({error:`Kolom ${key} tidak boleh kosong.`})}values.push(value);sets.push(`${key}=$${values.length}`)}}
 if(file){values.push(file.originalname,file.filename,file.mimetype,file.size);const n=values.length-3;sets.push(`original_filename=$${n}`,`stored_filename=$${n+1}`,`mime_type=$${n+2}`,`file_size=$${n+3}`)}
 if(!sets.length){return res.status(400).json({error:'Tidak ada perubahan untuk disimpan.'})}
 try{
  const old=await pool.query('SELECT stored_filename FROM letters WHERE id=$1',[id]);if(!old.rows[0]){if(file)await fs.unlink(file.path).catch(()=>{});return res.status(404).json({error:'Surat tidak ditemukan.'})}
  const {rows}=await pool.query(`UPDATE letters SET ${sets.join(',')} WHERE id=$1 RETURNING id,code,name,type,category,to_char(letter_date,'DD Mon YYYY') AS date,letter_date::text AS letter_date,direction,original_filename,mime_type,file_size`,values);
  if(file&&old.rows[0].stored_filename)await fs.unlink(path.resolve(process.env.UPLOAD_DIR||'uploads',old.rows[0].stored_filename)).catch(()=>{});
  res.json({letter:rows[0]});
 }catch(err){if(file)await fs.unlink(file.path).catch(()=>{});throw err;}
}
export async function deleteLetter(req,res){
 const {rows}=await pool.query('DELETE FROM letters WHERE id=$1 RETURNING id,stored_filename',[req.params.id]);
 if(!rows[0])return res.status(404).json({error:'Surat tidak ditemukan.'});
 if(rows[0].stored_filename)await fs.unlink(path.resolve(process.env.UPLOAD_DIR||'uploads',rows[0].stored_filename)).catch(()=>{});
 res.json({message:'Surat dan berkasnya berhasil dihapus.',id:rows[0].id});
}
export async function downloadLetter(req,res){
 const entry=await getLetterFile(req,res);if(!entry)return;
 const {doc,file}=entry;res.type(doc.mime_type||'application/octet-stream');res.download(file,doc.original_filename||'surat');
}
