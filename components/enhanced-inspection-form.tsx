"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ClientSection } from "./client-section"
import { useInspections } from "@/hooks/use-inspections"
import { useClientInspectionIntegration } from "@/hooks/use-client-inspection-integration"
import { createClient } from "@/lib/supabase/client"
import type { InspectionData, InspectionArea, Client } from "@/types"
import { 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  Building, 
  Save, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Users
} from "lucide-react"

interface EnhancedInspectionFormProps {
  inspectionId?: string
  onSave: () => void
  onCancel: () => void
  className?: string
}

export function EnhancedInspectionForm({ 
  inspectionId, 
  onSave, 
  onCancel,
  className = "" 
}: EnhancedInspectionFormProps) {
  const { getInspectionById, saveInspection, inspections, loading } = useInspections()
  const {
    selectedClient,
    inspectionData,
    isAutoPopulating,
    setInspectionData,
    handleClientSelect,
    handleInspectionClientNameChange,
    suggestClient,
    syncClientInspectionData,
    clients
  } = useClientInspectionIntegration()

  const [isSaving, setIsSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [showClientSection, setShowClientSection] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})
  const [isAddingPhoto, setIsAddingPhoto] = useState<{ [key: string]: boolean }>({})

  // ----- Area & Item Editing Helpers -----
  const updateInspectionField = (updater: (prev: InspectionData) => InspectionData) => {
    setInspectionData((prev) => (prev ? updater(prev) : prev))
  }

  // Create collision-resistant numeric IDs to avoid duplicates during rapid interactions
  const uniqueId = () => Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`)

  // Focus management for accessibility after inserting rows
  const lastInsertedAreaIdRef = useRef<number | null>(null)
  const lastInsertedItemRef = useRef<{ areaId: number; itemId: number } | null>(null)

  useEffect(() => {
    // Focus the newly added area name input
    if (lastInsertedAreaIdRef.current != null) {
      const el = document.querySelector<HTMLInputElement>(`input[data-area-id="${lastInsertedAreaIdRef.current}"]`)
      if (el) {
        el.focus()
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      lastInsertedAreaIdRef.current = null
    }
    // Focus the newly added item point input
    if (lastInsertedItemRef.current) {
      const { itemId } = lastInsertedItemRef.current
      const el = document.querySelector<HTMLInputElement>(`input[data-item-id="${itemId}"]`)
      if (el) {
        el.focus()
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      lastInsertedItemRef.current = null
    }
  }, [inspectionData])

  const handleAddArea = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault()
    if (!inspectionData) return
    const id = uniqueId()
    const newArea: InspectionArea = { id, name: `New Area ${inspectionData.areas.length + 1}`, items: [] }
    updateInspectionField(prev => ({ ...prev, areas: [...prev.areas, newArea] }))
    lastInsertedAreaIdRef.current = id
  }

  const handleUpdateArea = (updatedArea: InspectionArea) => {
    if (!inspectionData) return
    updateInspectionField(prev => ({
      ...prev,
      areas: prev.areas.map(a => a.id === updatedArea.id ? updatedArea : a)
    }))
  }

  const handleRemoveArea = (areaId: number) => {
    if (!inspectionData) return
    updateInspectionField(prev => ({ ...prev, areas: prev.areas.filter(a => a.id !== areaId) }))
  }

  const handleAddItem = (area: InspectionArea, e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault()
    const id = uniqueId()
    const newItem = {
      id,
      category: "Custom",
      point: "New Point",
      status: 'N/A' as const,
      comments: "",
      location: "",
      photos: [] as { base64: string; name: string }[],
    }
    handleUpdateArea({ ...area, items: [...area.items, newItem] })
    lastInsertedItemRef.current = { areaId: area.id, itemId: id }
  }

  const handleUpdateItem = (area: InspectionArea, itemId: number, updates: Partial<InspectionArea['items'][number]>) => {
    const updatedItems = area.items.map(it => it.id === itemId ? { ...it, ...updates } : it)
    handleUpdateArea({ ...area, items: updatedItems })
  }

  const handleRemoveItem = (area: InspectionArea, itemId: number) => {
    handleUpdateArea({ ...area, items: area.items.filter(it => it.id !== itemId) })
  }

  // Validation function
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (!inspectionData) {
      errors.general = 'Inspection data is missing'
      return false
    }

    if (!inspectionData.clientName.trim()) {
      errors.clientName = 'Client name is required'
    }

    if (!inspectionData.propertyLocation.trim()) {
      errors.propertyLocation = 'Property location is required'
    }

    if (!inspectionData.inspectorName.trim()) {
      errors.inspectorName = 'Inspector name is required'
    }

    if (!inspectionData.inspectionDate) {
      errors.inspectionDate = 'Inspection date is required'
    }

    if (!inspectionData.propertyType) {
      errors.propertyType = 'Property type is required'
    }

    // Validate areas and items
    if (inspectionData.areas.length === 0) {
      errors.areas = 'At least one inspection area is required'
    } else {
      inspectionData.areas.forEach((area, areaIndex) => {
        if (!area.name.trim()) {
          errors[`area_${areaIndex}_name`] = 'Area name is required'
        }

        area.items.forEach((item, itemIndex) => {
          if (!item.point.trim()) {
            errors[`area_${areaIndex}_item_${itemIndex}_point`] = 'Inspection point is required'
          }
        })
      })
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddPhoto = async (area: InspectionArea, itemId: number, file: File) => {
    const itemKey = `${area.id}_${itemId}`

    try {
      setIsAddingPhoto(prev => ({ ...prev, [itemKey]: true }))

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setAlertMessage({ type: 'error', message: 'Please select a valid image file' })
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setAlertMessage({ type: 'error', message: 'Image file size must be less than 10MB' })
        return
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      const item = area.items.find(i => i.id === itemId)
      if (!item) {
        setAlertMessage({ type: 'error', message: 'Item not found' })
        return
      }

      const nextPhotos = [...(item.photos || []), { base64, name: file.name }]
      handleUpdateItem(area, itemId, { photos: nextPhotos })

      setAlertMessage({ type: 'success', message: `Photo "${file.name}" added successfully` })
    } catch (e) {
      console.error('Failed to add photo', e)
      setAlertMessage({ type: 'error', message: 'Failed to add photo. Please try again.' })
    } finally {
      setIsAddingPhoto(prev => ({ ...prev, [itemKey]: false }))
    }
  }

  const handleRemovePhoto = (area: InspectionArea, itemId: number, index: number) => {
    const item = area.items.find(i => i.id === itemId)
    if (!item) return
    const nextPhotos = (item.photos || []).filter((_, i) => i !== index)
    handleUpdateItem(area, itemId, { photos: nextPhotos })
  }

  // Load inspection data (split into two effects to avoid render loops tied to changing function identities)

  // 1) Initialize a new inspection only once when creating
  useEffect(() => {
    if (!inspectionId) {
      setInspectionData(prev => {
        if (prev) return prev
        const today = new Date()
        const localTodayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

        const newInspection: InspectionData = {
          id: `insp_${Date.now()}`,
          clientName: "",
          propertyLocation: "",
          propertyType: "Apartment",
          inspectorName: "",
          inspectionDate: localTodayString,
          areas: [{ id: Date.now(), name: "General", items: [] }],
        }

        return newInspection
      })
    }
    // Intentionally only depend on inspectionId to run once per create/edit mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionId])

  // 2) Load an existing inspection after data finished loading
  useEffect(() => {
    if (!inspectionId) return
    if (loading) return

    const foundInspection = getInspectionById(inspectionId)
    if (foundInspection) {
      setInspectionData(foundInspection)
      setNotFound(false)

      // Auto-suggest client based on inspection data
      const suggestedClient = suggestClient(foundInspection)
      if (suggestedClient) {
        handleClientSelect(suggestedClient)
      }
    } else {
      console.error(`Inspection with ID ${inspectionId} not found`)
      setNotFound(true)
    }
    // Avoid depending on function identities which can cause infinite loops with Radix compose-refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionId, loading])

  // Enhanced handle field updates with real-time client suggestions
  const handleUpdateField = (field: keyof InspectionData, value: any) => {
    if (inspectionData) {
      const updatedInspection = { ...inspectionData, [field]: value }
      setInspectionData(updatedInspection)
      
      // Handle client name changes for auto-population
      if (field === 'clientName') {
        handleInspectionClientNameChange(value)
      }
      
      // Handle property location changes for client suggestions
      if (field === 'propertyLocation') {
        // Trigger client suggestion based on property location
        const matchingClient = clients.find(client =>
          client.properties.some(prop =>
            prop.location.toLowerCase().includes(value.toLowerCase()) ||
            value.toLowerCase().includes(prop.location.toLowerCase())
          )
        )
        
        if (matchingClient && matchingClient.id !== selectedClient?.id) {
          handleClientSelect(matchingClient)
        }
      }
    }
  }

  // Handle client selection from Client section
  const handleClientSelection = (client: any) => {
    handleClientSelect(client)
    setShowClientSection(false)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inspectionData || isSaving) return

    // Clear previous validation errors
    setValidationErrors({})
    setAlertMessage(null)

    // Validate form
    if (!validateForm()) {
      setAlertMessage({ type: 'error', message: 'Please fix the validation errors before saving' })
      return
    }

    setIsSaving(true)

    try {
      let inspectionToSave = inspectionData

      // Check if this is a new client (not in existing clients list)
      const existingClient = clients.find(
        client => client.name.toLowerCase() === inspectionData.clientName.toLowerCase()
      )

      // If client doesn't exist and we have a name, create a new client automatically
      if (!existingClient && inspectionData.clientName.trim()) {
        try {
          // Create a new client with basic information
          const newClient: Client = {
            id: `client_${Date.now()}`,
            name: inspectionData.clientName.trim(),
            email: '', // Will be empty initially
            phone: '',
            address: '',
            properties: inspectionData.propertyLocation ? [{
              id: `prop_${Date.now()}`,
              location: inspectionData.propertyLocation,
              type: inspectionData.propertyType === 'Building' || inspectionData.propertyType === 'Other'
                ? 'Commercial' as const
                : 'Residential' as const,
              size: 0
            }] : []
          }

          // Save the new client to the database
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()

          if (user) {
            await supabase.from("clients").insert({
              id: newClient.id,
              user_id: user.id,
              name: newClient.name,
              email: newClient.email,
              phone: newClient.phone,
              address: newClient.address
            })

            // If we have a property, save it too
            if (newClient.properties.length > 0) {
              await supabase.from("properties").insert({
                id: newClient.properties[0].id,
                client_id: newClient.id,
                user_id: user.id,
                location: newClient.properties[0].location,
                type: newClient.properties[0].type,
                size: newClient.properties[0].size
              })
            }

            console.log("New client created automatically:", newClient.name)
            setAlertMessage({
              type: 'success',
              message: `New client "${newClient.name}" added to your clients list!`
            })
          }
        } catch (clientError) {
          console.warn("Failed to auto-create client, continuing with inspection save:", clientError)
          // Don't block inspection save if client creation fails
        }
      }

      // If a client is selected, sync the data
      if (selectedClient) {
        try {
          inspectionToSave = await syncClientInspectionData(inspectionData, selectedClient)
        } catch (syncError) {
          console.warn("Client sync failed, continuing with original data:", syncError)
          // Continue with original data if sync fails
        }
      }

      const savedId = await saveInspection(inspectionToSave)

      if (savedId) {
        console.log("Inspection saved successfully with ID:", savedId)
        setAlertMessage({
          type: 'success',
          message: inspectionId
            ? 'Inspection updated successfully!'
            : 'Inspection created successfully!'
        })

        // Delay the onSave callback to show success message
        setTimeout(() => {
          onSave()
        }, 2000)
      }
    } catch (error: any) {
      console.error("Error saving inspection:", error)

      // Provide more specific error messages
      let errorMessage = "Failed to save inspection. Please try again."

      if (error?.message?.includes('relation "inspections" does not exist')) {
        errorMessage = "Database tables not set up. Please follow the setup instructions."
      } else if (error?.message?.includes('permission denied')) {
        errorMessage = "Permission denied. Please make sure you're logged in."
      } else if (error?.message?.includes('violates foreign key constraint')) {
        errorMessage = "Invalid data reference. Please refresh the page and try again."
      } else if (error?.message?.includes('duplicate key') || error?.message?.includes('already exists')) {
        errorMessage = "An inspection with this information already exists."
      } else if (error?.message) {
        errorMessage = error.message
      }

      setAlertMessage({ type: 'error', message: errorMessage })
    } finally {
      setIsSaving(false)
    }
  }

  // Clear alert after 3 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [alertMessage])

  // Show loading spinner
  if (loading && inspectionId) {
    return (
      <div className="text-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading inspection...</p>
      </div>
    )
  }

  // Show error message if inspection not found
  if (notFound) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 dark:text-red-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">Inspection not found</p>
          <p className="mt-2">The inspection you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={onCancel} variant="outline" className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!inspectionData) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            {inspectionId ? 'Edit Inspection' : 'New Inspection'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {inspectionId ? 'Update inspection details' : 'Create a new property inspection'}
          </p>
        </div>
        
        {/* Client Management Button */}
        <Button
          onClick={() => setShowClientSection(!showClientSection)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          {showClientSection ? 'Hide Clients' : 'Manage Clients'}
        </Button>
      </div>

      {/* Alert Messages */}
      {alertMessage && (
        <Alert className={alertMessage.type === 'error' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'}>
          {alertMessage.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          )}
          <AlertDescription className={alertMessage.type === 'error' ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'}>
            {alertMessage.message}
          </AlertDescription>
        </Alert>
      )}

      {/* General Validation Errors */}
      {validationErrors.general && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {validationErrors.general}
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-population indicator */}
      {isAutoPopulating && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Auto-populating form with client data...
          </AlertDescription>
        </Alert>
      )}

      {/* Client Section */}
      {showClientSection && (
        <ClientSection
          inspectionData={inspectionData}
          onClientSelect={handleClientSelection}
          onClientUpdate={(client) => {
            handleClientSelect(client)
          }}
        />
      )}

      {/* Selected Client Info */}
      {selectedClient && !showClientSection && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    Selected Client: {selectedClient.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedClient.properties.length} {selectedClient.properties.length === 1 ? 'Property' : 'Properties'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowClientSection(true)}
                variant="outline"
                size="sm"
              >
                Change Client
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspection Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Inspection Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Enhanced Client Name with Smart Suggestions */}
              <div>
                <Label htmlFor="client-name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Client Name *
                  {selectedClient && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Auto-selected
                    </Badge>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="client-name"
                    type="text"
                    placeholder="Enter client name"
                    value={inspectionData.clientName}
                    onChange={(e) => {
                      handleUpdateField("clientName", e.target.value)
                      // Clear validation error when user starts typing
                      if (validationErrors.clientName) {
                        setValidationErrors(prev => ({ ...prev, clientName: '' }))
                      }
                    }}
                    required
                    className={`mt-1 ${validationErrors.clientName ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {validationErrors.clientName && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.clientName}
                    </p>
                  )}
                  {/* Smart suggestions dropdown */}
                  {inspectionData.clientName && !selectedClient && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {clients
                        .filter(client => 
                          client.name.toLowerCase().includes(inspectionData.clientName.toLowerCase())
                        )
                        .slice(0, 3)
                        .map(client => (
                          <div
                            key={client.id}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm"
                            onClick={() => handleClientSelect(client)}
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {client.properties.length} {client.properties.length === 1 ? 'Property' : 'Properties'}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {selectedClient && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Auto-populated from selected client
                  </p>
                )}
              </div>

              {/* Enhanced Property Location with Smart Suggestions */}
              <div>
                <Label htmlFor="property-location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Property Location *
                  {selectedClient && selectedClient.properties.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Auto-suggested
                    </Badge>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="property-location"
                    type="text"
                    placeholder="Enter property location"
                    value={inspectionData.propertyLocation}
                    onChange={(e) => {
                      handleUpdateField("propertyLocation", e.target.value)
                      if (validationErrors.propertyLocation) {
                        setValidationErrors(prev => ({ ...prev, propertyLocation: '' }))
                      }
                    }}
                    required
                    className={`mt-1 ${validationErrors.propertyLocation ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {validationErrors.propertyLocation && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.propertyLocation}
                    </p>
                  )}
                  {/* Property location suggestions */}
                  {inspectionData.propertyLocation && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {clients
                        .flatMap(client => 
                          client.properties
                            .filter(prop => 
                              prop.location.toLowerCase().includes(inspectionData.propertyLocation.toLowerCase())
                            )
                            .map(prop => ({ ...prop, clientName: client.name }))
                        )
                        .slice(0, 5)
                        .map((property, index) => (
                          <div
                            key={`${property.clientName}-${index}`}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm"
                            onClick={() => {
                              handleUpdateField("propertyLocation", property.location)
                              const client = clients.find(c => c.name === property.clientName)
                              if (client) handleClientSelect(client)
                            }}
                          >
                            <div className="font-medium">{property.location}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {property.clientName} • {property.type}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {selectedClient && selectedClient.properties.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Auto-populated from client's first property
                  </p>
                )}
              </div>

              {/* Inspector Name */}
              <div>
                <Label htmlFor="inspector-name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Inspector Name *
                </Label>
                <Input
                  id="inspector-name"
                  type="text"
                  placeholder="Enter inspector name"
                  value={inspectionData.inspectorName}
                  onChange={(e) => {
                    handleUpdateField("inspectorName", e.target.value)
                    if (validationErrors.inspectorName) {
                      setValidationErrors(prev => ({ ...prev, inspectorName: '' }))
                    }
                  }}
                  required
                  className={`mt-1 ${validationErrors.inspectorName ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {validationErrors.inspectorName && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.inspectorName}
                  </p>
                )}
              </div>

              {/* Inspection Date */}
              <div>
                <Label htmlFor="inspection-date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Inspection Date *
                </Label>
                <Input
                  id="inspection-date"
                  type="date"
                  value={inspectionData.inspectionDate}
                  onChange={(e) => {
                    handleUpdateField("inspectionDate", e.target.value)
                    if (validationErrors.inspectionDate) {
                      setValidationErrors(prev => ({ ...prev, inspectionDate: '' }))
                    }
                  }}
                  required
                  className={`mt-1 ${validationErrors.inspectionDate ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {validationErrors.inspectionDate && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.inspectionDate}
                  </p>
                )}
              </div>

              {/* Property Type */}
              <div>
                <Label htmlFor="property-type" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Property Type *
                </Label>
                <Select
                  value={inspectionData.propertyType}
                  onValueChange={(value) => {
                    handleUpdateField("propertyType", value)
                    if (validationErrors.propertyType) {
                      setValidationErrors(prev => ({ ...prev, propertyType: '' }))
                    }
                  }}
                >
                  <SelectTrigger className={`mt-1 ${validationErrors.propertyType ? 'border-red-500 focus:border-red-500' : ''}`}>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Building">Building</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.propertyType && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.propertyType}
                  </p>
                )}
                {selectedClient && selectedClient.properties.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Auto-populated from client's property type
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Summary Section */}
        <Card>
          <CardHeader>
            <CardTitle>AI Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              placeholder="Enter AI-generated summary or notes about this inspection..."
              value={inspectionData.aiSummary || ""}
              onChange={(e) => handleUpdateField("aiSummary", e.target.value)}
              className="w-full min-h-[100px] p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </CardContent>
        </Card>

        {/* Areas & Items Editor */}
        <div className="space-y-6">
          {inspectionData.areas.map((area, areaIndex) => (
            <Card key={area.id} className="relative">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                      Area {areaIndex + 1}
                    </span>
                    <Input
                      value={area.name}
                      onChange={(e) => handleUpdateArea({ ...area, name: e.target.value })}
                      placeholder="Area name"
                      className="text-lg font-semibold"
                      data-area-id={area.id}
                      aria-label={`Area ${areaIndex + 1} name`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={(e) => { e.preventDefault(); handleRemoveArea(area.id) }}
                    className="flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Area
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items list */}
                {area.items.length === 0 && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">No inspection items yet.</p>
                    <p className="text-xs mt-1">Click "Add Item" to get started.</p>
                  </div>
                )}
                <div className="space-y-4">
                  {area.items.map((item, itemIndex) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-4 bg-slate-50/50 dark:bg-slate-800/50">
                      {/* Item Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                            Item {itemIndex + 1}
                          </span>
                          <Badge variant={item.status === 'Pass' ? 'default' : item.status === 'Fail' ? 'destructive' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.preventDefault(); handleRemoveItem(area, item.id) }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove Item
                        </Button>
                      </div>

                      {/* Item Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Category</Label>
                          <Input
                            value={item.category}
                            onChange={(e) => handleUpdateItem(area, item.id, { category: e.target.value })}
                            placeholder="e.g., Electrical, Plumbing, Structure"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Inspection Point</Label>
                          <Input
                            value={item.point}
                            onChange={(e) => handleUpdateItem(area, item.id, { point: e.target.value })}
                            placeholder="e.g., Check outlet functionality"
                            data-item-id={item.id}
                            aria-label={`Item ${itemIndex + 1} inspection point`}
                          />
                        </div>
                      </div>

                      {/* Status and Location */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Select
                            value={item.status}
                            onValueChange={(value) => handleUpdateItem(area, item.id, { status: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pass">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Pass
                                </div>
                              </SelectItem>
                              <SelectItem value="Fail">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  Fail
                                </div>
                              </SelectItem>
                              <SelectItem value="N/A">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                  N/A
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Location</Label>
                          <Input
                            value={item.location}
                            onChange={(e) => handleUpdateItem(area, item.id, { location: e.target.value })}
                            placeholder="e.g., Master Bedroom, Kitchen, Living Room"
                          />
                        </div>
                      </div>

                      {/* Comments */}
                      <div>
                        <Label className="text-sm font-medium">Comments & Notes</Label>
                        <textarea
                          value={item.comments}
                          onChange={(e) => handleUpdateItem(area, item.id, { comments: e.target.value })}
                          placeholder="Add detailed comments, observations, or recommendations..."
                          className="w-full min-h-[80px] p-3 border rounded-md bg-white dark:bg-slate-800 text-sm resize-y"
                          rows={3}
                        />
                      </div>

                      {/* Photos Section */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Photos</Label>
                        {item.photos && item.photos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {item.photos.map((photo, idx) => (
                              <div key={idx} className="relative group">
                                <div className="aspect-square border rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
                                  <img
                                    src={photo.base64}
                                    alt={photo.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                    <button
                                      type="button"
                                      className="opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-700 transition-all"
                                      onClick={() => handleRemovePhoto(area, item.id, idx)}
                                      title="Remove photo"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" title={photo.name}>
                                  {photo.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={isAddingPhoto[`${area.id}_${item.id}`]}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || [])
                              files.forEach(file => handleAddPhoto(area, item.id, file))
                              e.currentTarget.value = ''
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isAddingPhoto[`${area.id}_${item.id}`]}
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = 'image/*'
                              input.multiple = true
                              input.onchange = (e) => {
                                const files = Array.from((e.target as HTMLInputElement).files || [])
                                files.forEach(file => handleAddPhoto(area, item.id, file))
                              }
                              input.click()
                            }}
                            className="flex items-center gap-1"
                          >
                            {isAddingPhoto[`${area.id}_${item.id}`] ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Photos
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={(e) => handleAddItem(area, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleAddItem(area, e)
                    }}
                    className="flex items-center gap-2"
                    aria-label={`Add item to Area ${areaIndex + 1}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-center pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleAddArea(e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleAddArea(e)
              }}
              className="flex items-center gap-2"
              aria-label="Add another area"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Another Area
            </Button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            {selectedClient && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Client: {selectedClient.name}
              </Badge>
            )}
            {inspectionData.areas.length > 0 && (
              <Badge variant="outline">
                {inspectionData.areas.length} {inspectionData.areas.length === 1 ? 'Area' : 'Areas'}
              </Badge>
            )}
            {inspectionData.areas.some(area => area.items.length > 0) && (
              <Badge variant="outline">
                {inspectionData.areas.reduce((total, area) => total + area.items.length, 0)} Items
              </Badge>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" onClick={onCancel} variant="outline" disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || Object.keys(validationErrors).length > 0}>
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {inspectionId ? 'Update Inspection' : 'Save Inspection'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Validation Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <div className="font-medium">Please fix the following errors:</div>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {Object.entries(validationErrors).map(([key, message]) => (
                  <li key={key} className="text-sm">{message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}
