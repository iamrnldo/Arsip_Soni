import {useEffect,useState} from 'react';
import mammoth from 'mammoth/mammoth.browser.js';
import * as XLSX from 'xlsx';
import DOMPurify from 'dompurify';
import {ChevronDown,FileSpreadsheet,FileText} from 'lucide-react';
import '../../styles/office-preview.css';

export default function OfficePreview({url,type,filename}){
 const isWord=/\.docx$/i.test(filename)||type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
 const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [html,setHtml]=useState('');const [workbook,setWorkbook]=useState(null);const [sheet,setSheet]=useState('');
 useEffect(()=>{let alive=true;setLoading(true);setError('');setHtml('');setWorkbook(null);
  fetch(url).then(r=>{if(!r.ok)throw new Error('Berkas tidak dapat dibaca.');return r.arrayBuffer()}).then(async buffer=>{
   if(!alive)return;
   if(isWord){const result=await mammoth.convertToHtml({arrayBuffer:buffer});if(!alive)return;setHtml(DOMPurify.sanitize(result.value,{USE_PROFILES:{html:true}}))}
   else{const book=XLSX.read(buffer,{type:'array',cellDates:true});if(!book.SheetNames.length)throw new Error('Workbook tidak memiliki sheet.');if(!alive)return;setWorkbook(book);setSheet(book.SheetNames[0])}
   setLoading(false);
  }).catch(err=>{if(alive){console.error('Office preview error:',err);setError(isWord?'Dokumen Word gagal dibuka. Pastikan file berformat DOCX dan tidak rusak.':'File Excel gagal dibuka. Pastikan workbook tidak rusak atau dilindungi password.');setLoading(false)}});
  return()=>{alive=false};
 },[url,isWord]);
 const rows=workbook&&sheet?XLSX.utils.sheet_to_json(workbook.Sheets[sheet],{header:1,defval:'',blankrows:false,raw:false}):[];
 if(loading)return <div className="office-preview-state">Memuat pratinjau {isWord?'Word':'Excel'}…</div>;
 if(error)return <div className="office-preview-state office-preview-error">{error}</div>;
 if(isWord)return <div className="office-word-scroll"><article className="office-word-page"><div className="office-word-label"><FileText size={15}/> Pratinjau Word</div><div className="office-word-content" dangerouslySetInnerHTML={{__html:html||'<p>Dokumen ini kosong.</p>'}}/></article></div>;
 const visibleRows=rows.slice(0,500);const truncated=rows.length>500;
 return <div className="office-sheet-view"><div className="office-sheet-toolbar"><span><FileSpreadsheet size={16}/> {filename}</span><label className="sheet-select-wrap"><select value={sheet} onChange={e=>setSheet(e.target.value)} aria-label="Pilih sheet">{workbook.SheetNames.map(name=><option key={name} value={name}>{name}</option>)}</select><ChevronDown size={14}/></label></div><div className="office-sheet-scroll"><table className="office-sheet-table"><tbody>{visibleRows.map((row,ri)=><tr key={ri}>{row.slice(0,40).map((cell,ci)=>{const Tag=ri===0?'th':'td';return <Tag key={ci}>{cell===null||cell===undefined?'':String(cell)}</Tag>})}</tr>)}</tbody></table>{truncated&&<div className="office-limit-note">Pratinjau dibatasi sampai 500 baris dan 40 kolom.</div>}</div></div>;
}
