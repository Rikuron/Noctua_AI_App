interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export function LoadingSpinner({ size = 'md', message = 'Loading...' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  const logoSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Blue circular loading ring */}
        <div className={`absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-secondary animate-spin ${sizeClasses[size]}`}></div>
        
        {/* Logo in the center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src="/logo512.png" 
            alt="Noctua AI Logo" 
            className={`${logoSizeClasses[size]} opacity-90`}
          />
        </div>
      </div>
      
      {message && (
        <p className="text-gray-400 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}

// Full screen loading component
export function FullScreenLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white items-center justify-center">
      <LoadingSpinner size="lg" message={message} />
    </div>
  )
}