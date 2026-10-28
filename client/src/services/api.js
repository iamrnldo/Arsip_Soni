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
