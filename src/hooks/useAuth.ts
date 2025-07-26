import { useState, useEffect } from 'react'
import blink from '@/blink/client'

interface User {
  id: string
  email: string
  displayName?: string
  avatar?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setAuthState({
        user: state.user,
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated
      })
    })
    return unsubscribe
  }, [])

  const login = () => {
    blink.auth.login()
  }

  const logout = () => {
    blink.auth.logout()
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      await blink.auth.updateMe(updates)
      return { success: true }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { success: false, error }
    }
  }

  return {
    ...authState,
    login,
    logout,
    updateProfile
  }
}