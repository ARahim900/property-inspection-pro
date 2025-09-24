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
    if (!user) {
      const error = new Error("Please login to save inspections")
      console.error(error.message)
      throw error
    }

    try {
      console.log("Saving inspection:", inspection)

      // Check if this is an update or create
      // UUIDs from database don't have prefixes, temp IDs do
      const isUpdate = inspection.id && !inspection.id.startsWith('insp_') && inspection.id.length === 36

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

        // Refresh inspections to get the new data
        await fetchInspections()

        return inspectionData.id
      }
    } catch (error: any) {
      console.error("Error saving inspection:", error)

      // Provide more specific error messages
      if (error?.message?.includes('relation "inspections" does not exist')) {
        throw new Error("Database tables not set up. Please follow the setup instructions in DATABASE_SETUP.md")
      } else if (error?.message?.includes('permission denied')) {
        throw new Error("Permission denied. Please make sure you're logged in.")
      } else if (error?.message?.includes('violates foreign key constraint')) {
        throw new Error("Invalid data reference. Please refresh the page and try again.")
      } else if (error?.code === 'PGRST301') {
        throw new Error("Database tables not found. Please run the database migration first.")
      } else {
        throw new Error(error?.message || "Failed to save inspection. Please try again.")
      }
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
        if (item.photos && item.photos.length > 0) {
          for (const photo of item.photos) {
            try {
              // First, try to upload to storage if base64 data is available
              let storageUrl = null

              if (photo.base64) {
                // Convert base64 to blob
                const base64Data = photo.base64.replace(/^data:image\/\w+;base64,/, '')
                const byteCharacters = atob(base64Data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: 'image/jpeg' })

                // Upload to storage
                const fileName = `${userId}/${inspectionId}/${itemData.id}/${Date.now()}_${photo.name}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('inspection-photos')
                  .upload(fileName, blob, {
                    cacheControl: '3600',
                    upsert: false
                  })

                if (!uploadError && uploadData) {
                  const { data: urlData } = supabase.storage
                    .from('inspection-photos')
                    .getPublicUrl(fileName)
                  storageUrl = urlData.publicUrl
                }
              }

              // Save photo record in database
              const { error: photoError } = await supabase
                .from("inspection_photos")
                .insert({
                  user_id: userId,
                  inspection_id: inspectionId,
                  area_id: areaData.id,
                  item_id: itemData.id,
                  name: photo.name,
                  storage_url: storageUrl,
                  base64_data: storageUrl ? null : photo.base64 // Only save base64 if storage upload failed
                })

              if (photoError) {
                console.error("Error saving photo record:", photoError)
              }
            } catch (error) {
              console.error("Error processing photo:", error)
              // Continue with other photos even if one fails
            }
          }
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