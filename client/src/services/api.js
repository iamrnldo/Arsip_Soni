// Same-origin proxy in development; set VITE_API_BASE_URL to the deployed API URL for production.
const API_URL=(import.meta.env.VITE_API_BASE_URL||'/api/v1').replace(/\/$/,'');
export const getToken=()=>localStorage.getItem('kediri_token');
export function setSession(token,user){localStorage.setItem('kediri_token',token);localStorage.setItem('kediri_user',JSON.stringify(user));}
export function clearSession(){localStorage.removeItem('kediri_token');localStorage.removeItem('kediri_user');}
export function getSessionUser(){try{return JSON.parse(localStorage.getItem('kediri_user')||'null')}catch{return null}}
export async function api(path,{method='GET',body,headers={}}={}){
 const token=getToken();const h={...headers};if(token)h.Authorization=`Bearer ${token}`;
 if(body&&!(body instanceof FormData))h['Content-Type']='application/json';
 const response=await fetch(`${API_URL}${path}`,{method,headers:h,body:body instanceof FormData?body:body?JSON.stringify(body):undefined});
 const data=await response.json().catch(()=>({error:'Respons server tidak valid.'}));
 if(!response.ok)throw new Error(data.error||`Request gagal (${response.status})`);return data;
}
export async function downloadFile(path,filename){
 const token=getToken();const response=await fetch(`${API_URL}${path}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
 if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||`Unduh gagal (${response.status})`)}
 const blob=await response.blob();const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename||'surat';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function previewFile(path){
 const token=getToken();const response=await fetch(`${API_URL}${path}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
 if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||`Pratinjau gagal (${response.status})`)}
 const blob=await response.blob();return {url:URL.createObjectURL(blob),type:blob.type};
}
