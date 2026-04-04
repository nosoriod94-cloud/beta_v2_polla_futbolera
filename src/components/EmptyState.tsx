import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  emoji?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const paddings = { sm: 'py-8', md: 'py-12', lg: 'py-16' }
  const iconSizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }
  const emojiSizes = { sm: 'text-3xl', md: 'text-4xl', lg: 'text-5xl' }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border',
        paddings[size],
        'px-6 animate-fade-up',
        className,
      )}
    >
      {emoji && (
        <span className={cn('mb-3 leading-none', emojiSizes[size])}>{emoji}</span>
      )}
      {Icon && !emoji && (
        <div className="mb-3 p-3 rounded-2xl bg-muted/60">
          <Icon className={cn(iconSizes[size], 'text-muted-foreground/50')} />
        </div>
      )}
      <p className="font-semibold text-sm text-foreground/80">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
