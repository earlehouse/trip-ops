import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'amber' | 'green' | 'gray' | 'purple'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      variant === 'default' && 'bg-gray-100 text-gray-700',
      variant === 'amber' && 'bg-amber-100 text-amber-800',
      variant === 'green' && 'bg-green-100 text-green-800',
      variant === 'gray' && 'bg-gray-100 text-gray-500',
      variant === 'purple' && 'bg-purple-100 text-purple-800',
      className,
    )}>
      {children}
    </span>
  )
}
