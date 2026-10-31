import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
const dir=path.resolve(process.env.UPLOAD_DIR||'uploads'); fs.mkdirSync(dir,{recursive:true});
const storage=multer.diskStorage({destination:dir,filename:(req,file,cb)=>cb(null,`${crypto.randomUUID()}${path.extname(file.originalname).slice(0,16)}`)});
// Accept all file types as requested, while limiting upload size and using randomized storage names.
export const upload=multer({storage,limits:{fileSize:Number(process.env.MAX_UPLOAD_BYTES||26214400),files:1}});
export const newsImageUpload=multer({storage,fileFilter:(req,file,cb)=>{if(!['image/jpeg','image/png','image/webp'].includes(file.mimetype))return cb(Object.assign(new Error('Foto berita harus JPG, PNG, atau WebP.'),{status:400}));cb(null,true)},limits:{fileSize:5*1024*1024,files:1}});
