export function notFound(req,res){res.status(404).json({error:'Endpoint tidak ditemukan.'});}
export function errorHandler(err,req,res,next){
  if(err?.code==='LIMIT_FILE_SIZE') return res.status(413).json({error:'Ukuran file melebihi batas 25 MB.'});
  if(err?.code==='LIMIT_UNEXPECTED_FILE') return res.status(400).json({error:'Hanya satu berkas yang dapat diunggah.'});
  if(err?.code==='23505') return res.status(409).json({error:'Kode surat atau email sudah digunakan.'});
  console.error(err);
  res.status(err.status||500).json({error:err.status?err.message:'Terjadi kesalahan pada server.'});
}
