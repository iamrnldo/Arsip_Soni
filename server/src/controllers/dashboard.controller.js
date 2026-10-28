import {pool} from '../config/database.js';
export async function summary(req,res){
 const {rows:[counts]}=await pool.query(`SELECT COUNT(*) FILTER(WHERE direction='Keluar')::int AS outgoing, COUNT(*) FILTER(WHERE direction='Masuk')::int AS incoming,COUNT(*)::int AS total,COUNT(*) FILTER(WHERE category='Rahasia')::int AS confidential FROM letters ${req.user.role==='admin'?'':'WHERE category <> \'Rahasia\''}`);
 const {rows:recent}=await pool.query(`SELECT l.id,l.code,l.name,l.type,l.category,to_char(l.letter_date,'DD Mon YYYY') AS date,l.direction,u.name AS owner FROM letters l JOIN users u ON u.id=l.uploaded_by ${req.user.role==='admin'?'':'WHERE l.category <> \'Rahasia\''} ORDER BY l.letter_date DESC,l.created_at DESC LIMIT 5`);
 res.json({counts,recent,updatedAt:new Date().toISOString()});
}
