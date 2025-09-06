'use client'

import { useState, useEffect } from 'react'
import LoadingAnimation from '@/components/ui/LoadingAnimation'

interface AppProviderProps {
  children: React.ReactNode
}

export default function AppProvider({ children }: AppProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if this is the first visit in this session
    const hasSeenAnimation = sessionStorage.getItem('hasSeenAnimation')
    
    if (hasSeenAnimation) {
      // Skip animation if already seen in this session
      setIsLoading(false)
      setShowContent(true)
    } else {
      // Show animation for first visit only on home page
      const isHomePage = window.location.pathname === '/'
      if (isHomePage) {
        setIsLoading(true)
      } else {
        // Skip animation for other pages
        setIsLoading(false)
        setShowContent(true)
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
    setTimeout(() => setShowContent(true), 100)
  }

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return null
  }

  if (isLoading) {
    return <LoadingAnimation onComplete={handleAnimationComplete} />
  }

  return (
    <div className={`transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  )
}