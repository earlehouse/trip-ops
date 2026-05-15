'use client'
import { cn } from '@/lib/utils'
import { nextStatus, statusLabel } from '@/components/ui/StatusDot'

interface Props {
  status: string
  onCycle: (next: string) => void
}

export function StatusPill({ status, onCycle }: Props) {
  return (
    <button
      onClick={() => onCycle(nextStatus(status))}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        status === 'needed' && 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        status === 'in_progress' && 'bg-amber-100 text-amber-800 hover:bg-amber-200',
        status === 'booked' && 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
        status === 'na' && 'bg-gray-50 text-gray-400 cursor-default',
      )}
      disabled={status === 'na'}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'needed' && 'bg-gray-400',
        status === 'in_progress' && 'bg-amber-500',
        status === 'booked' && 'bg-emerald-500',
        status === 'na' && 'bg-gray-300',
      )} />
      {statusLabel(status)}
    </button>
  )
}
