import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
const dir=path.resolve(process.env.UPLOAD_DIR||'uploads'); fs.mkdirSync(dir,{recursive:true});
const storage=multer.diskStorage({destination:dir,filename:(req,file,cb)=>cb(null,`${crypto.randomUUID()}${path.extname(file.originalname).slice(0,16)}`)});
// Accept all file types as requested, while limiting upload size and using randomized storage names.
export const upload=multer({storage,limits:{fileSize:Number(process.env.MAX_UPLOAD_BYTES||26214400),files:1}});
