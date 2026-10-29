import {useEffect,useRef,useState} from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {ChevronLeft,ChevronRight,Minus,Plus,RotateCw} from 'lucide-react';
import '../../styles/pdf-preview.css';

pdfjsLib.GlobalWorkerOptions.workerSrc=pdfWorkerUrl;

export default function PdfPreview({url}){
 const containerRef=useRef(null);const canvasRef=useRef(null);
 const [pdf,setPdf]=useState(null);const [page,setPage]=useState(1);const [pages,setPages]=useState(0);
 const [zoom,setZoom]=useState(1);const [loading,setLoading]=useState(true);const [rendering,setRendering]=useState(false);const [error,setError]=useState('');

 useEffect(()=>{
  let alive=true;setPdf(null);setPage(1);setPages(0);setLoading(true);setError('');
  const task=pdfjsLib.getDocument({url});
  task.promise.then(doc=>{if(!alive)return;setPdf(doc);setPages(doc.numPages);setLoading(false)}).catch(err=>{
   if(alive){console.error('PDF load error:',err);setError('PDF tidak dapat dibuka. Pastikan berkas tidak rusak atau terenkripsi.');setLoading(false)}
  });
  return()=>{alive=false;task.destroy().catch(()=>{})};
 },[url]);

 useEffect(()=>{
  if(!pdf||!containerRef.current||!canvasRef.current)return;
  let alive=true;let renderTask=null;let frame=0;let generation=0;
  const draw=()=>{
   if(frame)cancelAnimationFrame(frame);
   frame=requestAnimationFrame(async()=>{
    const current=++generation;
    if(renderTask){try{renderTask.cancel()}catch{}renderTask=null}
    setRendering(true);setError('');
    try{
     const pg=await pdf.getPage(page);
     if(!alive||current!==generation)return;
     const base=pg.getViewport({scale:1});
     const available=Math.max(280,(containerRef.current?.clientWidth||800)-32);
     const viewport=pg.getViewport({scale:(available/base.width)*zoom});
     const ratio=window.devicePixelRatio||1;const canvas=canvasRef.current;
     canvas.width=Math.ceil(viewport.width*ratio);canvas.height=Math.ceil(viewport.height*ratio);
     canvas.style.width=`${Math.ceil(viewport.width)}px`;canvas.style.height=`${Math.ceil(viewport.height)}px`;
     const context=canvas.getContext('2d');
     const transform=ratio!==1?[ratio,0,0,ratio,0,0]:null;
     const task=pg.render({canvasContext:context,viewport,transform});renderTask=task;
     await task.promise;
     if(alive&&current===generation){renderTask=null;setRendering(false)}
    }catch(err){
     if(!alive||current!==generation||err?.name==='RenderingCancelledException')return;
     console.error('PDF page render error:',err);renderTask=null;setRendering(false);
     setError('Halaman PDF gagal dirender. Coba unggah ulang PDF atau unduh berkas untuk memeriksanya.');
    }
   });
  };
  draw();const observer=new ResizeObserver(draw);observer.observe(containerRef.current);
  return()=>{alive=false;generation++;cancelAnimationFrame(frame);observer.disconnect();if(renderTask){try{renderTask.cancel()}catch{}}};
 },[pdf,page,zoom]);

 const changePage=delta=>setPage(p=>Math.min(pages,Math.max(1,p+delta)));
 return <div className="pdf-viewer">
  <div className="pdf-toolbar">
   <div className="pdf-page-controls"><button onClick={()=>changePage(-1)} disabled={page<=1} aria-label="Halaman sebelumnya"><ChevronLeft size={17}/></button><span>Halaman <b>{page}</b> dari <b>{pages||'—'}</b></span><button onClick={()=>changePage(1)} disabled={page>=pages} aria-label="Halaman berikutnya"><ChevronRight size={17}/></button></div>
   <div className="pdf-zoom-controls"><button onClick={()=>setZoom(z=>Math.max(.65,+(z-.15).toFixed(2)))} aria-label="Perkecil"><Minus size={15}/></button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(z=>Math.min(2,+(z+.15).toFixed(2)))} aria-label="Perbesar"><Plus size={15}/></button><button onClick={()=>setZoom(1)} title="Sesuaikan lebar" aria-label="Atur ulang zoom"><RotateCw size={14}/></button></div>
  </div>
  <div className="pdf-canvas-area" ref={containerRef} data-lenis-prevent>
   {(loading||rendering)&&!error&&<div className="pdf-loading">{loading?'Memuat dokumen PDF…':'Merender halaman…'}</div>}
   {error?<div className="pdf-error">{error}</div>:<canvas ref={canvasRef} className="pdf-canvas"/>}
  </div>
 </div>;
}
