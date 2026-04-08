import { Logo } from '@/components/Logo'

export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{ background: 'hsl(222 22% 5%)' }}
    >
      <Logo size="lg" variant="full" />
      <div
        className="h-8 w-8 rounded-full border-2 border-transparent animate-spin"
        style={{ borderTopColor: '#22C55E' }}
      />
    </div>
  )
}
