import { cn } from '@/lib/utils'
export function Button({className, variant='default', size='default', ...props}: React.ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'default'|'outline'|'ghost', size?:'default'|'sm'}){
  const base='inline-flex items-center justify-center rounded-lg font-medium transition text-sm'
  const variants={default:'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900', outline:'border bg-white hover:bg-zinc-50', ghost:'hover:bg-zinc-100'}
  const sizes={default:'px-4 py-2', sm:'px-3 py-1.5 text-xs'}
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props}/>
}
