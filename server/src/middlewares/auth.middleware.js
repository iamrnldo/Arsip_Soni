import jwt from 'jsonwebtoken';
export function authenticate(req,res,next){
  const token=req.get('authorization')?.replace(/^Bearer\s+/i,'');
  if(!token) return res.status(401).json({error:'Silakan masuk untuk mengakses layanan ini.'});
  try{req.user=jwt.verify(token,process.env.JWT_SECRET);next();}
  catch{return res.status(401).json({error:'Sesi tidak valid atau sudah kedaluwarsa.'});}
}
export function requireAdmin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({error:'Akses ini khusus Admin.'});next();}
