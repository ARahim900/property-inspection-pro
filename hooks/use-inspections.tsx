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

      // Fetch inspections
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from("inspections")
        .select(`
          *,
          inspection_areas (
            *,
            inspection_items (
              *,
              inspection_photos (*)
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (inspectionsError) throw inspectionsError

      // Transform the relational data to match our frontend structure
      const transformedInspections: InspectionData[] = (inspectionsData || []).map(inspection => ({
        id: inspection.id,
        clientName: inspection.client_name,
        propertyLocation: inspection.property_location,
        propertyType: inspection.property_type,
        inspectorName: inspection.inspector_name,
        inspectionDate: inspection.inspection_date,
        aiSummary: inspection.ai_summary,
        areas: (inspection.inspection_areas || []).map((area: any) => ({
          id: area.id,
          name: area.name,
          items: (area.inspection_items || []).map((item: any) => ({
            id: item.id,
            category: item.category,
            point: item.point,
            status: item.status,
            comments: item.comments || '',
            location: item.location || '',
            photos: (item.inspection_photos || []).map((photo: any) => ({
              base64: photo.base64_data,
              name: photo.name
            }))
          }))
        }))
      }))

      setInspections(transformedInspections)
    } catch (error) {
      console.error("Error fetching inspections:", error)
      setInspections([])
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Save inspection (create or update)
  const saveInspection = async (inspection: InspectionData): Promise<string> => {
    if (!user) throw new Error("User not authenticated")

    try {
      console.log("Saving inspection:", inspection)

      // Check if this is an update or create
      const isUpdate = inspection.id && inspection.id.startsWith('insp_') === false

      if (isUpdate) {
        // Update existing inspection
        const { data: inspectionData, error: inspectionError } = await supabase
          .from("inspections")
          .update({
            client_name: inspection.clientName,
            property_location: inspection.propertyLocation,
            property_type: inspection.propertyType,
            inspector_name: inspection.inspectorName,
            inspection_date: inspection.inspectionDate,
            ai_summary: inspection.aiSummary,
            updated_at: new Date().toISOString()
          })
          .eq("id", inspection.id)
          .eq("user_id", user.id)
          .select()
          .single()

        if (inspectionError) throw inspectionError

        // Update areas
        await updateInspectionAreas(inspection.id, inspection.areas, user.id)

        return inspection.id
      } else {
        // Create new inspection
        const { data: inspectionData, error: inspectionError } = await supabase
          .from("inspections")
          .insert({
            user_id: user.id,
            client_name: inspection.clientName,
            property_location: inspection.propertyLocation,
            property_type: inspection.propertyType,
            inspector_name: inspection.inspectorName,
            inspection_date: inspection.inspectionDate,
            ai_summary: inspection.aiSummary
          })
          .select()
          .single()

        if (inspectionError) throw inspectionError

        // Save areas and items
        await saveInspectionAreas(inspectionData.id, inspection.areas, user.id)

        // Update local state with the new ID
        setInspections(prev => {
          const updated = prev.map(insp => 
            insp.id === inspection.id ? { ...insp, id: inspectionData.id } : insp
          )
          return updated
        })

        return inspectionData.id
      }
    } catch (error) {
      console.error("Error saving inspection:", error)
      throw error
    }
  }

  // Helper function to save inspection areas and items
  const saveInspectionAreas = async (inspectionId: string, areas: any[], userId: string) => {
    for (const area of areas) {
      const { data: areaData, error: areaError } = await supabase
        .from("inspection_areas")
        .insert({
          user_id: userId,
          inspection_id: inspectionId,
          name: area.name
        })
        .select()
        .single()

      if (areaError) throw areaError

      // Save items for this area
      for (const item of area.items) {
        const { data: itemData, error: itemError } = await supabase
          .from("inspection_items")
          .insert({
            user_id: userId,
            inspection_id: inspectionId,
            area_id: areaData.id,
            category: item.category,
            point: item.point,
            status: item.status,
            comments: item.comments,
            location: item.location
          })
          .select()
          .single()

        if (itemError) throw itemError

        // Save photos for this item
        for (const photo of item.photos) {
          await supabase
            .from("inspection_photos")
            .insert({
              user_id: userId,
              inspection_id: inspectionId,
              area_id: areaData.id,
              item_id: itemData.id,
              name: photo.name,
              base64_data: photo.base64
            })
        }
      }
    }
  }

  // Helper function to update inspection areas and items
  const updateInspectionAreas = async (inspectionId: string, areas: any[], userId: string) => {
    // First, delete existing areas and their related data
    await supabase
      .from("inspection_photos")
      .delete()
      .eq("inspection_id", inspectionId)
      .eq("user_id", userId)

    await supabase
      .from("inspection_items")
      .delete()
      .eq("inspection_id", inspectionId)
      .eq("user_id", userId)

    await supabase
      .from("inspection_areas")
      .delete()
      .eq("inspection_id", inspectionId)
      .eq("user_id", userId)

    // Then save the updated areas
    await saveInspectionAreas(inspectionId, areas, userId)
  }

  // Delete inspection
  const deleteInspection = async (id: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      console.log("Deleting inspection:", id)

      // Delete photos first
      await supabase
        .from("inspection_photos")
        .delete()
        .eq("inspection_id", id)
        .eq("user_id", user.id)

      // Delete items
      await supabase
        .from("inspection_items")
        .delete()
        .eq("inspection_id", id)
        .eq("user_id", user.id)

      // Delete areas
      await supabase
        .from("inspection_areas")
        .delete()
        .eq("inspection_id", id)
        .eq("user_id", user.id)

      // Finally delete the inspection
      const { error } = await supabase
        .from("inspections")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error

      // Update local state
      setInspections(prev => prev.filter(inspection => inspection.id !== id))
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