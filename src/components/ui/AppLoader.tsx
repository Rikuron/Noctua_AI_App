import clsx from 'clsx'

type AppLoaderProps = {
  label?: string
  fullscreen?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const containerHeights = {
  sm: 'h-20 w-20',
  md: 'h-28 w-28',
  lg: 'h-36 w-36',
}

const logoSizes = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
}

export function AppLoader({
  label = 'Loading…',
  fullscreen = false,
  size = 'md',
  className = '',
}: AppLoaderProps) {
  const spinner = (
    <div className={clsx('flex flex-col items-center gap-4 text-gray-300', className)}>
      <div className={clsx('relative flex items-center justify-center', containerHeights[size])}>
        {/* Rotating ring */}
        <div
          className={clsx(
            'absolute inset-0 rounded-full border-[3px]',
            'border-transparent border-t-blue-500 border-r-purple-500',
            'animate-spin'
          )}
        />
        {/* Logo */}
        <img
          src="/logo512.png"
          alt="Noctua AI"
          className={clsx('drop-shadow-lg', logoSizes[size])}
        />
      </div>
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  )

  if (!fullscreen) return spinner

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-950">
      {spinner}
    </div>
  )
}