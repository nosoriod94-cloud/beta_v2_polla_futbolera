import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'wordmark'
  className?: string
}

const sizes = {
  sm:  { icon: 24, text: 'text-lg',  gap: 'gap-1.5' },
  md:  { icon: 32, text: 'text-2xl', gap: 'gap-2'   },
  lg:  { icon: 42, text: 'text-3xl', gap: 'gap-2.5' },
  xl:  { icon: 56, text: 'text-4xl', gap: 'gap-3'   },
}

export function Logo({ size = 'md', variant = 'full', className }: LogoProps) {
  const s = sizes[size]

  return (
    <div className={cn('inline-flex items-center', s.gap, className)}>
      {(variant === 'full' || variant === 'icon') && (
        <LogoIcon size={s.icon} />
      )}
      {(variant === 'full' || variant === 'wordmark') && (
        <LogoWordmark className={s.text} />
      )}
    </div>
  )
}

function LogoIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer glow ring */}
      <circle cx="24" cy="24" r="22" stroke="hsl(154 100% 45% / 0.2)" strokeWidth="1.5" />

      {/* Ball base */}
      <circle cx="24" cy="24" r="18" fill="hsl(222 22% 10%)" stroke="hsl(154 100% 45%)" strokeWidth="1.5" />

      {/* Pentagon pattern - top center */}
      <path
        d="M24 10 L27.8 16.4 L34.8 17.2 L30.4 22.4 L31.6 29.4 L24 26.2 L16.4 29.4 L17.6 22.4 L13.2 17.2 L20.2 16.4 Z"
        fill="hsl(154 100% 45% / 0.15)"
        stroke="hsl(154 100% 45% / 0.6)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Center dot */}
      <circle cx="24" cy="24" r="2.5" fill="hsl(154 100% 45%)" />

      {/* Shine */}
      <ellipse cx="19" cy="18" rx="4" ry="2.5" fill="white" opacity="0.08" transform="rotate(-25 19 18)" />
    </svg>
  )
}

function LogoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn('font-display tracking-wide leading-none', className)}
      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
    >
      <span className="text-foreground">POLLA</span>
      <span
        className="ml-1.5"
        style={{ color: 'hsl(154 100% 45%)', textShadow: '0 0 16px hsl(154 100% 45% / 0.5)' }}
      >
        FUTBOLERA
      </span>
    </span>
  )
}
