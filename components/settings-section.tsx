"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import type { AppSettings } from "@/types"
import {
  User,
  Mail,
  Phone,
  Camera,
  Bell,
  Globe,
  DollarSign,
  FileText,
  Lock,
  LogOut,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Save
} from "lucide-react"

interface SettingsSectionProps {
  settings: AppSettings
  onSettingsUpdate: (settings: AppSettings) => void
}

export function SettingsSection({ settings, onSettingsUpdate }: SettingsSectionProps) {
  const { user, signOut } = useAuth()
  const supabase = createClient()
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings)
  const [isSaving, setIsSaving] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>(settings.profile.avatar)

  useEffect(() => {
    setLocalSettings(settings)
    setAvatarPreview(settings.profile.avatar)
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Upload avatar if changed
      if (avatarFile && user) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(filePath)

        localSettings.profile.avatar = publicUrl
      }

      // Save settings to Supabase user metadata
      if (user) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            settings: localSettings
          }
        })
        if (updateError) throw updateError
      }

      // Update local state
      onSettingsUpdate(localSettings)

      setAlertMessage({ type: 'success', message: 'Settings saved successfully!' })
      setTimeout(() => setAlertMessage(null), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setAlertMessage({ type: 'error', message: 'Failed to save settings. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setAlertMessage({ type: 'error', message: 'New passwords do not match' })
      return
    }

    if (passwordData.new.length < 6) {
      setAlertMessage({ type: 'error', message: 'Password must be at least 6 characters' })
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      })

      if (error) throw error

      setAlertMessage({ type: 'success', message: 'Password changed successfully!' })
      setPasswordData({ current: '', new: '', confirm: '' })
      setTimeout(() => setAlertMessage(null), 3000)
    } catch (error: any) {
      setAlertMessage({ type: 'error', message: error.message || 'Failed to change password' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className="w-full space-y-6">
      {alertMessage && (
        <Alert className={alertMessage.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}>
          {alertMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <AlertDescription className={alertMessage.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
            {alertMessage.message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Globe className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="invoice">
            <FileText className="h-4 w-4 mr-2" />
            Invoice Config
          </TabsTrigger>
          <TabsTrigger value="account">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Update your personal information and avatar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview} alt={localSettings.profile.name} />
                  <AvatarFallback>{localSettings.profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      <Camera className="h-4 w-4" />
                      Change Avatar
                    </div>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">JPG, PNG or GIF (max 2MB)</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="h-4 w-4 inline mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={localSettings.profile.name}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      profile: { ...localSettings.profile, name: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={localSettings.profile.email}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      profile: { ...localSettings.profile, email: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={localSettings.profile.phone}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      profile: { ...localSettings.profile, phone: e.target.value }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>Customize your app experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Theme</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Choose your preferred theme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <Switch
                    checked={localSettings.theme === 'dark'}
                    onCheckedChange={(checked) => setLocalSettings({
                      ...localSettings,
                      theme: checked ? 'dark' : 'light'
                    })}
                  />
                  <Moon className="h-4 w-4" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="language">
                  <Globe className="h-4 w-4 inline mr-2" />
                  Language
                </Label>
                <Select
                  value={localSettings.language}
                  onValueChange={(value: 'en' | 'ar') => setLocalSettings({
                    ...localSettings,
                    language: value
                  })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Receive email updates about inspections and invoices
                  </p>
                </div>
                <Switch
                  checked={localSettings.notifications.email}
                  onCheckedChange={(checked) => setLocalSettings({
                    ...localSettings,
                    notifications: { ...localSettings.notifications, email: checked }
                  })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Receive push notifications on your device
                  </p>
                </div>
                <Switch
                  checked={localSettings.notifications.push}
                  onCheckedChange={(checked) => setLocalSettings({
                    ...localSettings,
                    notifications: { ...localSettings.notifications, push: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Config Tab */}
        <TabsContent value="invoice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Configuration</CardTitle>
              <CardDescription>Set default values for invoices and pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vat-rate">
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    VAT Rate (%)
                  </Label>
                  <Input
                    id="vat-rate"
                    type="number"
                    placeholder="5"
                    defaultValue="5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="OMR">
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OMR">OMR (Omani Rial)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="residential-rate">Residential Rate (per m²)</Label>
                  <Input
                    id="residential-rate"
                    type="number"
                    step="0.01"
                    placeholder="1.50"
                    defaultValue="1.50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commercial-rate">Commercial Rate (per m²)</Label>
                  <Input
                    id="commercial-rate"
                    type="number"
                    step="0.01"
                    placeholder="2.00"
                    defaultValue="2.00"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="inspector-name">Default Inspector Name</Label>
                <Input
                  id="inspector-name"
                  value={localSettings.profile.name}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    profile: { ...localSettings.profile, name: e.target.value }
                  })}
                  placeholder="Enter default inspector name"
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This will be auto-filled in new inspections
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security & Account</CardTitle>
              <CardDescription>Manage your password and account access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Change Password</h3>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !passwordData.new || !passwordData.confirm}
                  className="w-full md:w-auto"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
                <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                    Once you log out, you'll need to sign in again to access your account.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full md:w-auto"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button - Fixed at bottom */}
      <div className="flex justify-end gap-4 pt-4 border-t dark:border-slate-700">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  )
}
