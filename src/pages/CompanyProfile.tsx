import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Building2, Save, Upload } from 'lucide-react'
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
}

const businessTypes = [
  'Sole Proprietorship',
  'Partnership',
  'LLC',
  'Corporation',
  'S-Corporation',
  'Non-Profit',
  'Other'
]

const currencies = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' }
]

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CompanyProfile() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<CompanyProfile>({
    userId: '',
    companyName: '',
    businessType: '',
    taxId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    fiscalYearStart: 'January',
    currency: 'USD',
    timezone: 'America/New_York'
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadCompanyProfile = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      const profiles = await blink.db.companyProfiles.list({
        where: { userId }
      })
      
      if (profiles.length > 0) {
        const existingProfile = profiles[0]
        setProfile({
          id: existingProfile.id,
          userId: existingProfile.userId,
          companyName: existingProfile.companyName || '',
          businessType: existingProfile.businessType || '',
          taxId: existingProfile.taxId || '',
          address: existingProfile.address || '',
          city: existingProfile.city || '',
          state: existingProfile.state || '',
          zipCode: existingProfile.zipCode || '',
          country: existingProfile.country || 'United States',
          phone: existingProfile.phone || '',
          email: existingProfile.email || '',
          website: existingProfile.website || '',
          logoUrl: existingProfile.logoUrl || '',
          fiscalYearStart: existingProfile.fiscalYearStart || 'January',
          currency: existingProfile.currency || 'USD',
          timezone: existingProfile.timezone || 'America/New_York'
        })
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
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        setProfile(prev => ({ ...prev, userId: state.user.id }))
        loadCompanyProfile(state.user.id)
      }
    })
    return unsubscribe
  }, [loadCompanyProfile])

  const handleSave = async () => {
    if (!profile.companyName.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    try {
      if (profile.id) {
        // Update existing profile
        await blink.db.companyProfiles.update(profile.id, {
          companyName: profile.companyName,
          businessType: profile.businessType,
          taxId: profile.taxId,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zipCode: profile.zipCode,
          country: profile.country,
          phone: profile.phone,
          email: profile.email,
          website: profile.website,
          logoUrl: profile.logoUrl,
          fiscalYearStart: profile.fiscalYearStart,
          currency: profile.currency,
          timezone: profile.timezone,
          updatedAt: new Date().toISOString()
        })
      } else {
        // Create new profile
        const newProfile = await blink.db.companyProfiles.create({
          id: `company_${Date.now()}`,
          userId: profile.userId,
          companyName: profile.companyName,
          businessType: profile.businessType,
          taxId: profile.taxId,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zipCode: profile.zipCode,
          country: profile.country,
          phone: profile.phone,
          email: profile.email,
          website: profile.website,
          logoUrl: profile.logoUrl,
          fiscalYearStart: profile.fiscalYearStart,
          currency: profile.currency,
          timezone: profile.timezone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        setProfile(prev => ({ ...prev, id: newProfile.id }))
      }

      toast({
        title: 'Success',
        description: 'Company profile saved successfully'
      })
    } catch (error) {
      console.error('Error saving company profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to save company profile',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const { publicUrl } = await blink.storage.upload(
        file,
        `logos/${profile.userId}/${file.name}`,
        { upsert: true }
      )
      setProfile(prev => ({ ...prev, logoUrl: publicUrl }))
      toast({
        title: 'Success',
        description: 'Logo uploaded successfully'
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading company profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Company Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your company information and settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential company details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={profile.companyName}
                  onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Your Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Select
                  value={profile.businessType}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, businessType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / EIN</Label>
                <Input
                  id="taxId"
                  value={profile.taxId}
                  onChange={(e) => setProfile(prev => ({ ...prev, taxId: e.target.value }))}
                  placeholder="XX-XXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.company.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Company location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main Street, Suite 100"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profile.state}
                  onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="NY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={profile.zipCode}
                  onChange={(e) => setProfile(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="10001"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo & Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Logo & Branding</CardTitle>
            <CardDescription>Upload your company logo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {profile.logoUrl && (
                <img
                  src={profile.logoUrl}
                  alt="Company Logo"
                  className="h-16 w-16 object-contain border rounded"
                />
              )}
              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('logo')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    PNG, JPG up to 2MB
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Settings</CardTitle>
            <CardDescription>Configure your accounting preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={profile.currency}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
                <Select
                  value={profile.fiscalYearStart}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, fiscalYearStart: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}