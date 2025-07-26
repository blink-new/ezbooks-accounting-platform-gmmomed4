import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import blink from '@/blink/client'

interface CompanyProfile {
  id?: string
  userId: string
  companyName: string
  businessType: string
  taxId: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  email: string
  website: string
  logoUrl: string
  fiscalYearStart: string
  currency: string
  timezone: string
  createdAt?: string
  updatedAt?: string
}

export function useCompanyProfile(userId?: string) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadProfile = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      const profiles = await blink.db.companyProfiles.list({
        where: { userId }
      })
      
      if (profiles.length > 0) {
        setProfile(profiles[0])
      }
    } catch (error) {
      console.error('Error loading company profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load company profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (userId) {
      loadProfile(userId)
    }
  }, [userId, loadProfile])

  const saveProfile = async (profileData: Partial<CompanyProfile>) => {
    if (!userId) return { success: false, error: 'User ID required' }

    setSaving(true)
    try {
      if (profile?.id) {
        // Update existing profile
        await blink.db.companyProfiles.update(profile.id, {
          ...profileData,
          updatedAt: new Date().toISOString()
        })
        setProfile(prev => prev ? { ...prev, ...profileData } : null)
      } else {
        // Create new profile
        const newProfile = await blink.db.companyProfiles.create({
          id: `company_${Date.now()}`,
          userId,
          ...profileData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        setProfile(newProfile)
      }

      toast({
        title: 'Success',
        description: 'Company profile saved successfully'
      })
      return { success: true }
    } catch (error) {
      console.error('Error saving company profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to save company profile',
        variant: 'destructive'
      })
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const uploadLogo = async (file: File) => {
    if (!userId) return { success: false, error: 'User ID required' }

    try {
      const { publicUrl } = await blink.storage.upload(
        file,
        `logos/${userId}/${file.name}`,
        { upsert: true }
      )
      
      // Update profile with new logo URL
      await saveProfile({ logoUrl: publicUrl })
      
      toast({
        title: 'Success',
        description: 'Logo uploaded successfully'
      })
      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive'
      })
      return { success: false, error }
    }
  }

  return {
    profile,
    loading,
    saving,
    saveProfile,
    uploadLogo,
    refreshProfile: () => userId && loadProfile(userId)
  }
}