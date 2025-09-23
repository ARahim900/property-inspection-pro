"use client"

import { createClient } from "@/lib/supabase/client"
import type { AppSettings } from "@/types"
import { useAuth } from "./use-auth"
import { useState, useEffect, useCallback } from "react"

export function useAppSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const defaultAvatar = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>')}`

  const defaultSettings: AppSettings = {
    theme: "dark",
    notifications: { email: true, push: false },
    language: "en",
    profile: {
      name: "Inspector",
      email: "",
      phone: "",
      avatar: defaultAvatar,
    },
  }

  // Fetch user settings
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings)
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Get user profile from Supabase
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error
      }

      // Merge with default settings
      const userSettings: AppSettings = {
        ...defaultSettings,
        profile: {
          name: profile?.name || user.user_metadata?.name || defaultSettings.profile.name,
          email: profile?.email || user.email || defaultSettings.profile.email,
          phone: profile?.phone || defaultSettings.profile.phone,
          avatar: profile?.avatar || defaultSettings.profile.avatar,
        },
      }

      // Try to get additional settings from localStorage as fallback
      try {
        const stored = localStorage.getItem("appSettings")
        if (stored) {
          const parsed = JSON.parse(stored)
          userSettings.theme = parsed.theme || userSettings.theme
          userSettings.notifications = { ...userSettings.notifications, ...parsed.notifications }
          userSettings.language = parsed.language || userSettings.language
        }
      } catch (e) {
        console.error("Failed to parse stored settings:", e)
      }

      setSettings(userSettings)
    } catch (error) {
      console.error("Error fetching settings:", error)
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Save settings
  const saveSettings = async (newSettings: AppSettings) => {
    if (!user) {
      // Save to localStorage only if not authenticated
      localStorage.setItem("appSettings", JSON.stringify(newSettings))
      localStorage.setItem("theme", newSettings.theme)
      setSettings(newSettings)
      return
    }

    try {
      // Update profile in Supabase
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        name: newSettings.profile.name,
        email: newSettings.profile.email,
        phone: newSettings.profile.phone,
        avatar: newSettings.profile.avatar,
        updated_at: new Date().toISOString(),
      })

      if (profileError) throw profileError

      // Save other settings to localStorage
      localStorage.setItem("appSettings", JSON.stringify(newSettings))
      localStorage.setItem("theme", newSettings.theme)

      setSettings(newSettings)
    } catch (error) {
      console.error("Error saving settings:", error)
      throw error
    }
  }

  // Get current settings
  const getSettings = (): AppSettings => {
    return settings || defaultSettings
  }

  // Load settings when user changes
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings: getSettings(),
    loading,
    saveSettings,
    refreshSettings: fetchSettings,
  }
}
