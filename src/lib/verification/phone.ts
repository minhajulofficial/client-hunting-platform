export type PhoneVerificationResult = { validFormat:boolean; country?:string; countryCode?:string; status:'VALID'|'INVALID'|'UNKNOWN' }
export function verifyPhone(phone:string, defaultCountry='US'): PhoneVerificationResult{
  const digits = phone.replace(/\D/g,'')
  if (digits.length<7 || digits.length>15) return { validFormat:false, status:'INVALID' }
  // Simple heuristic; replace with libphonenumber-js when installed
  return { validFormat:true, country: defaultCountry, countryCode:'+1', status:'VALID' }
}
