import { UserButton } from '@clerk/clerk-react'

export function CustomUserButton() {
  return (
    <UserButton 
      appearance={{
        elements: {
          avatarBox: 'w-8 h-8',
          userButtonPopoverCard: 'bg-gray-800 border-gray-700',
          userButtonPopoverActionButton: 'text-white hover:bg-gray-700',
          userButtonPopoverActionButtonText: 'text-gray-300',
          userButtonPopoverFooter: 'hidden'
        }
      }}
    />
  )
}