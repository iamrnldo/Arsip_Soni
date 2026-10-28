import { google } from 'googleapis';
export function calendarClient(){
  if(!process.env.GOOGLE_CLIENT_EMAIL||!process.env.GOOGLE_PRIVATE_KEY) return null;
  const auth=new google.auth.JWT({email:process.env.GOOGLE_CLIENT_EMAIL,key:process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g,'\n'),scopes:['https://www.googleapis.com/auth/calendar.readonly']});
  return google.calendar({version:'v3',auth});
}
