import { User } from 'lucide-react'

interface AvatarProps {
  name?: string
  profilePictureUrl?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
}

export const Avatar = ({ name, profilePictureUrl, size = 'md', className = '' }: AvatarProps) => {
  const getInitial = () => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-bold overflow-hidden ${className}`

  if (profilePictureUrl) {
    return (
      <div className={baseClasses}>
        <img
          src={profilePictureUrl}
          alt={name || 'User avatar'}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  if (name) {
    return (
      <div className={`${baseClasses} bg-gradient-to-br from-primary-400 to-primary-600 text-white`}>
        {getInitial()}
      </div>
    )
  }

  return (
    <div className={`${baseClasses} bg-slate-200 text-slate-500`}>
      <User className="w-1/2 h-1/2" />
    </div>
  )
}
