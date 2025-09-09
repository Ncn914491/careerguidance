'use client'

import { useState, useEffect } from 'react'
import LoadingAnimation from '@/components/ui/LoadingAnimation'

interface AppProviderProps {
  children: React.ReactNode
}

export default function AppProvider({ children }: AppProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showContent, setShowContent] = useState(true) // Default to true to prevent blocking
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Only show loading animation on the home page and if not seen before
    const isHomePage = window.location.pathname === '/'
    const hasSeenAnimation = sessionStorage.getItem('hasSeenAnimation')
    
    if (isHomePage && !hasSeenAnimation) {
      setIsLoading(true)
      setShowContent(false)
    } else {
      // For all other cases, show content immediately
      setIsLoading(false)
      setShowContent(true)
      if (!hasSeenAnimation) {
        try {
          sessionStorage.setItem('hasSeenAnimation', 'true')
        } catch (error) {
          console.warn('Could not save to sessionStorage:', error)
        }
      }
    }
  }, [])

  const handleAnimationComplete = () => {
    try {
      sessionStorage.setItem('hasSeenAnimation', 'true')
    } catch (error) {
      console.warn('Could not save to sessionStorage:', error)
    }
    setIsLoading(false)
    setShowContent(true)
  }

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
        <div className="animate-spin rounded-full h-16 w-16 border-2 border-purple-500/30 border-t-purple-500"></div>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingAnimation onComplete={handleAnimationComplete} />
  }

  return (
    <div className={`transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  )
}