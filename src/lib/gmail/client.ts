import { google } from 'googleapis'
export function getOAuth2Client(tokens:{access_token?:string; refresh_token?:string}){
  const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/callback`)
  oAuth2Client.setCredentials(tokens)
  return oAuth2Client
}
export async function sendEmailViaGmail(tokens:any, to:string, subject:string, body:string, opts:{cc?:string; bcc?:string}={}){
  const auth = getOAuth2Client(tokens)
  const gmail = google.gmail({ version:'v1', auth })
  const message = [`To: ${to}`, opts.cc?`Cc: ${opts.cc}`:'', opts.bcc?`Bcc: ${opts.bcc}`:'', `Subject: ${subject}`, 'Content-Type: text/html; charset=utf-8','', body].filter(Boolean).join('\n')
  const encoded = Buffer.from(message).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
  const res = await gmail.users.messages.send({ userId:'me', requestBody:{ raw: encoded }})
  return res.data
}
export async function listMessages(tokens:any, query=''){
  const auth = getOAuth2Client(tokens)
  const gmail = google.gmail({ version:'v1', auth })
  const res = await gmail.users.messages.list({ userId:'me', q: query, maxResults:20 })
  return res.data.messages || []
}
