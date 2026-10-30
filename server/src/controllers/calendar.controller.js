import {calendarClient} from '../config/calendar.js';
export async function listEvents(req,res){
 const calendar=calendarClient();
 if(!calendar||!process.env.GOOGLE_CALENDAR_ID)return res.json({events:[],connected:false,message:'Isi GOOGLE_CALENDAR_ID serta kredensial Service Account pada server/.env.'});
 try{
  const {data}=await calendar.events.list({calendarId:process.env.GOOGLE_CALENDAR_ID,timeMin:new Date().toISOString(),maxResults:20,singleEvents:true,orderBy:'startTime'});
  return res.json({connected:true,message:'',events:(data.items||[]).map(e=>({id:e.id,title:e.summary||'Agenda tanpa judul',start:e.start?.dateTime||e.start?.date,end:e.end?.dateTime||e.end?.date,location:e.location||'',description:e.description||'',htmlLink:e.htmlLink||''}))});
 }catch(err){
  console.error('Google Calendar read failed:',err.message||err);
  return res.status(502).json({connected:false,events:[],message:'Gagal membaca Google Calendar. Pastikan kalender dibagikan ke Service Account dan Calendar ID/kredensial di server/.env benar.'});
 }
}
