import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
export async function login(req,res){
 const {email,password}=req.body||{};
 if(!email||!password)return res.status(400).json({error:'Email dan kata sandi wajib diisi.'});
 const {rows}=await pool.query('SELECT id,name,email,password_hash,role,is_active FROM users WHERE lower(email)=lower($1)',[email]);
 const user=rows[0]; if(!user||!user.is_active||!(await bcrypt.compare(password,user.password_hash)))return res.status(401).json({error:'Email atau kata sandi tidak cocok.'});
 const token=jwt.sign({sub:user.id,name:user.name,email:user.email,role:user.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'8h'});
 res.json({token,user:{id:user.id,name:user.name,email:user.email,role:user.role}});
}
export async function me(req,res){const {rows}=await pool.query('SELECT id,name,email,role FROM users WHERE id=$1 AND is_active=TRUE',[req.user.sub]);if(!rows[0])return res.status(404).json({error:'Pengguna tidak ditemukan.'});res.json({user:rows[0]});}
