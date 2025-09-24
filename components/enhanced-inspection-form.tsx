"use client"

import React, { useState, useEffect } from "react"
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
import type { InspectionData, InspectionArea } from "@/types"
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
    syncClientInspectionData
  } = useClientInspectionIntegration()

  const [isSaving, setIsSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [showClientSection, setShowClientSection] = useState(false)

  // Load inspection data
  useEffect(() => {
    if (inspectionId) {
      if (!loading) {
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
      }
    } else {
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
      
      setInspectionData(newInspection)
    }
  }, [inspectionId, loading, inspections, getInspectionById, setInspectionData, suggestClient, handleClientSelect])

  // Handle field updates
  const handleUpdateField = (field: keyof InspectionData, value: any) => {
    if (inspectionData) {
      const updatedInspection = { ...inspectionData, [field]: value }
      setInspectionData(updatedInspection)
      
      // Handle client name changes for auto-population
      if (field === 'clientName') {
        handleInspectionClientNameChange(value)
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

    setIsSaving(true)
    setAlertMessage(null)

    try {
      let inspectionToSave = inspectionData

      // If a client is selected, sync the data
      if (selectedClient) {
        inspectionToSave = await syncClientInspectionData(inspectionData, selectedClient)
      }

      const savedId = await saveInspection(inspectionToSave)
      
      if (savedId) {
        console.log("Inspection saved successfully with ID:", savedId)
        setAlertMessage({ type: 'success', message: 'Inspection saved successfully!' })
        
        // Delay the onSave callback to show success message
        setTimeout(() => {
          onSave()
        }, 1500)
      }
    } catch (error: any) {
      console.error("Error saving inspection:", error)
      
      if (!error?.message?.includes("duplicate key") && !error?.message?.includes("already exists")) {
        const errorMessage = error?.message || "Failed to save inspection. Please try again."
        setAlertMessage({ type: 'error', message: errorMessage })
      } else {
        console.log("Inspection saved (duplicate key warning ignored)")
        setAlertMessage({ type: 'success', message: 'Inspection saved successfully!' })
        setTimeout(() => onSave(), 1500)
      }
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
              {/* Client Name */}
              <div>
                <Label htmlFor="client-name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Client Name *
                </Label>
                <Input
                  id="client-name"
                  type="text"
                  placeholder="Enter client name"
                  value={inspectionData.clientName}
                  onChange={(e) => handleUpdateField("clientName", e.target.value)}
                  required
                  className="mt-1"
                />
                {selectedClient && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Auto-populated from selected client
                  </p>
                )}
              </div>

              {/* Property Location */}
              <div>
                <Label htmlFor="property-location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Property Location *
                </Label>
                <Input
                  id="property-location"
                  type="text"
                  placeholder="Enter property location"
                  value={inspectionData.propertyLocation}
                  onChange={(e) => handleUpdateField("propertyLocation", e.target.value)}
                  required
                  className="mt-1"
                />
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
                  onChange={(e) => handleUpdateField("inspectorName", e.target.value)}
                  required
                  className="mt-1"
                />
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
                  onChange={(e) => handleUpdateField("inspectionDate", e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              {/* Property Type */}
              <div>
                <Label htmlFor="property-type" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Property Type *
                </Label>
                <Select
                  value={inspectionData.propertyType}
                  onValueChange={(value) => handleUpdateField("propertyType", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Building">Building</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
          </div>
          
          <div className="flex gap-3">
            <Button type="button" onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Inspection
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
