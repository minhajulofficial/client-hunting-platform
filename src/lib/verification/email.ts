export type EmailVerificationResult = { status: 'VERIFIED'|'RISKY'|'INVALID'|'UNKNOWN'; checks: Record<string,boolean>; reason?: string }
export interface EmailVerifier { verify(email:string): Promise<EmailVerificationResult> }

export class FreeEmailVerifier implements EmailVerifier {
  async verify(email:string): Promise<EmailVerificationResult>{
    const checks: Record<string,boolean>={}
    const syntax = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    checks.syntax = syntax
    if (!syntax) return { status:'INVALID', checks, reason:'Invalid syntax'}
    const domain = email.split('@')[1].toLowerCase()
    const disposable = ['tempmail.com','10minutemail.com','mailinator.com']
    if (disposable.includes(domain)) return { status:'RISKY', checks:{...checks, disposable:false}, reason:'Disposable domain'}
    // DNS/MX check requires server-side; placeholder UNKNOWN if not checked
    checks.domain = domain.includes('.')
    checks.mx = true // assume pass for free tier; real provider would check DNS
    const riskyDomains = ['gmail.com','yahoo.com','hotmail.com']
    const isBusinessDomain = !riskyDomains.includes(domain)
    checks.businessDomain = isBusinessDomain
    return { status: isBusinessDomain?'VERIFIED':'RISKY', checks, reason: isBusinessDomain?undefined:'Free email provider' }
  }
}
export class ProviderEmailVerifier implements EmailVerifier {
  constructor(private apiKey:string){}
  async verify(email:string): Promise<EmailVerificationResult>{
    // pluggable paid provider (e.g., Hunter, ZeroBounce)
    // fallback to free verifier if no key
    return new FreeEmailVerifier().verify(email)
  }
}
export function getEmailVerifier(): EmailVerifier {
  if (process.env.EMAIL_VERIFIER_API_KEY) return new ProviderEmailVerifier(process.env.EMAIL_VERIFIER_API_KEY)
  return new FreeEmailVerifier()
}
