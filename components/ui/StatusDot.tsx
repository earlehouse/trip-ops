import { cn } from '@/lib/utils'

export type BookingStatus = 'needed' | 'in_progress' | 'booked' | 'na'

interface StatusDotProps {
  status: string
  className?: string
}

export function StatusDot({ status, className }: StatusDotProps) {
  if (status === 'na') return null
  return (
    <span className={cn(
      'inline-block w-2 h-2 rounded-full flex-shrink-0',
      status === 'needed' && 'bg-gray-400',
      status === 'in_progress' && 'bg-amber-400',
      status === 'booked' && 'bg-emerald-500',
      className,
    )} />
  )
}

export function statusLabel(status: string): string {
  return ({ needed: 'Needed', in_progress: 'In Progress', booked: 'Booked', na: 'N/A' } as Record<string, string>)[status] ?? status
}

export function nextStatus(status: string): string {
  const cycle: Record<string, string> = { needed: 'in_progress', in_progress: 'booked', booked: 'needed', na: 'na' }
  return cycle[status] ?? 'needed'
}
