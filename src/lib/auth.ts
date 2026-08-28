export function getAdminEmails(): string[] { return (process.env.ADMIN_EMAILS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean) }
export function isAdminEmail(email?: string|null) {
  if (!email) return false
  const list = getAdminEmails()
  if (list.length===0) return true
  return list.includes(email.toLowerCase())
}
