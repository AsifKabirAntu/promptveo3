"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { User } from "@supabase/supabase-js"
import { 
  User as UserIcon, 
  Mail, 
  Bell, 
  Shield, 
  Key, 
  Trash2,
  Save,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function AccountPage() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    emailNotifications: true,
    pushNotifications: false,
  })

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          // Load user profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profile) {
            setFormData({
              fullName: profile.full_name || "",
              email: user.email || "",
              emailNotifications: profile.email_notifications ?? true,
              pushNotifications: profile.push_notifications ?? false,
            })
          } else {
            setFormData(prev => ({
              ...prev,
              email: user.email || ""
            }))
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [supabase])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.fullName,
          email_notifications: formData.emailNotifications,
          push_notifications: formData.pushNotifications,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || !confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      
      // Delete user data from profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) throw profileError

      // Delete user data from favorites
      const { error: favoritesError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)

      if (favoritesError) throw favoritesError

      // Delete user data from user_prompts
      const { error: promptsError } = await supabase
        .from('user_prompts')
        .delete()
        .eq('user_id', user.id)

      if (promptsError) throw promptsError

      // Delete auth user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      if (deleteError) throw deleteError

      // Sign out
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-500" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={formData.email}
                  disabled
                  className="bg-gray-50"
                />
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Verified
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-gray-200 cursor-pointer"
                onClick={() => handleInputChange('emailNotifications', !formData.emailNotifications)}
              >
                <span
                  className={`${
                    formData.emailNotifications ? 'translate-x-6 bg-blue-600' : 'translate-x-1 bg-white'
                  } inline-block h-4 w-4 transform rounded-full transition-transform`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-500">Receive browser notifications</p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-gray-200 cursor-pointer"
                onClick={() => handleInputChange('pushNotifications', !formData.pushNotifications)}
              >
                <span
                  className={`${
                    formData.pushNotifications ? 'translate-x-6 bg-blue-600' : 'translate-x-1 bg-white'
                  } inline-block h-4 w-4 transform rounded-full transition-transform`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* Save Changes */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="min-w-[120px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
} 