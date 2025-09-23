"use client"

import { createClient } from "@/lib/supabase/client"
import type { InspectionData } from "@/types"
import { useAuth } from "./use-auth"
import { useState, useEffect, useCallback } from "react"

export function useInspections() {
  const { user } = useAuth()
  const [inspections, setInspections] = useState<InspectionData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch all inspections for the current user
  const fetchInspections = useCallback(async () => {
    if (!user) {
      setInspections([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from("inspections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (inspectionsError) throw inspectionsError

      // For demo purposes, return empty array since we don't have real data
      // In production, this would transform the relational data
      setInspections([])
    } catch (error) {
      console.error("Error fetching inspections:", error)
      setInspections([])
    } finally {
      setLoading(false)
    }
  }, [user]) // Removed supabase from dependencies to prevent infinite loop

  // Save inspection (create or update)
  const saveInspection = async (inspection: InspectionData): Promise<string> => {
    if (!user) throw new Error("User not authenticated")

    try {
      console.log("[v0] Saving inspection:", inspection)

      // For demo purposes, add the inspection to local state
      setInspections((prev) => {
        const existingIndex = prev.findIndex((i) => i.id === inspection.id)
        if (existingIndex >= 0) {
          // Update existing
          const updated = [...prev]
          updated[existingIndex] = inspection
          return updated
        } else {
          // Add new
          return [inspection, ...prev]
        }
      })

      return inspection.id
    } catch (error) {
      console.error("Error saving inspection:", error)
      throw error
    }
  }

  // Delete inspection
  const deleteInspection = async (id: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      console.log("[v0] Deleting inspection:", id)

      // For demo purposes, remove from local state
      setInspections((prev) => prev.filter((i) => i.id !== id))
    } catch (error) {
      console.error("Error deleting inspection:", error)
      throw error
    }
  }

  // Get inspection by ID
  const getInspectionById = (id: string): InspectionData | null => {
    return inspections.find((inspection) => inspection.id === id) || null
  }

  // Load inspections when user changes
  useEffect(() => {
    fetchInspections()
  }, [fetchInspections])

  return {
    inspections,
    loading,
    saveInspection,
    deleteInspection,
    getInspectionById,
    refreshInspections: fetchInspections,
  }
}
