"use client"

import { useState, useEffect, useCallback } from "react"
import { useClients } from "./use-clients"
import { useInspections } from "./use-inspections"
import type { Client, InspectionData } from "@/types"

export function useClientInspectionIntegration() {
  const { clients, saveClient, refreshClients } = useClients()
  const { inspections, saveInspection } = useInspections()
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [inspectionData, setInspectionData] = useState<InspectionData | null>(null)
  const [isAutoPopulating, setIsAutoPopulating] = useState(false)

  // Auto-populate inspection data when client is selected
  const handleClientSelect = useCallback((client: Client) => {
    setSelectedClient(client)
    
    // Auto-populate inspection form with client data
    if (inspectionData) {
      setIsAutoPopulating(true)
      
      const updatedInspection: InspectionData = {
        ...inspectionData,
        clientName: client.name,
        // If client has properties, use the first one as default property location
        propertyLocation: client.properties.length > 0 ? client.properties[0].location : inspectionData.propertyLocation,
        // Set property type based on client's property type
        propertyType: client.properties.length > 0 
          ? client.properties[0].type === 'Commercial' ? 'Building' : 'Apartment'
          : inspectionData.propertyType
      }
      
      setInspectionData(updatedInspection)
      
      // Reset auto-populating flag after a short delay
      setTimeout(() => setIsAutoPopulating(false), 1000)
    }
  }, [inspectionData])

  // Auto-populate client data when inspection client name changes
  const handleInspectionClientNameChange = useCallback((clientName: string) => {
    if (!clientName.trim()) {
      setSelectedClient(null)
      return
    }

    // Find matching client
    const matchingClient = clients.find(client => 
      client.name.toLowerCase().includes(clientName.toLowerCase()) ||
      clientName.toLowerCase().includes(client.name.toLowerCase())
    )

    if (matchingClient && matchingClient.id !== selectedClient?.id) {
      setSelectedClient(matchingClient)
    }
  }, [clients, selectedClient?.id])

  // Create client from inspection data
  const createClientFromInspection = useCallback(async (inspection: InspectionData): Promise<Client | null> => {
    if (!inspection.clientName.trim()) return null

    try {
      const newClient: Client = {
        id: `client_${Date.now()}`,
        name: inspection.clientName.trim(),
        email: "",
        phone: "",
        address: "",
        properties: inspection.propertyLocation ? [{
          id: `prop_${Date.now()}`,
          location: inspection.propertyLocation,
          type: inspection.propertyType === 'Apartment' || inspection.propertyType === 'Villa' ? 'Residential' : 'Commercial',
          size: 0
        }] : []
      }

      await saveClient(newClient)
      await refreshClients()
      
      return newClient
    } catch (error) {
      console.error('Error creating client from inspection:', error)
      return null
    }
  }, [saveClient, refreshClients])

  // Get client's inspection history
  const getClientInspectionHistory = useCallback((clientId: string) => {
    return inspections.filter(inspection => 
      inspection.clientName.toLowerCase().includes(
        clients.find(c => c.id === clientId)?.name.toLowerCase() || ''
      )
    )
  }, [inspections, clients])

  // Suggest client based on inspection data
  const suggestClient = useCallback((inspection: InspectionData): Client | null => {
    if (!inspection.clientName.trim()) return null

    // First, try exact match
    let suggestedClient = clients.find(client => 
      client.name.toLowerCase() === inspection.clientName.toLowerCase()
    )

    // If no exact match, try partial match
    if (!suggestedClient) {
      suggestedClient = clients.find(client => 
        client.name.toLowerCase().includes(inspection.clientName.toLowerCase()) ||
        inspection.clientName.toLowerCase().includes(client.name.toLowerCase())
      )
    }

    // If still no match, try matching by property location
    if (!suggestedClient && inspection.propertyLocation) {
      suggestedClient = clients.find(client =>
        client.properties.some(prop =>
          prop.location.toLowerCase().includes(inspection.propertyLocation.toLowerCase()) ||
          inspection.propertyLocation.toLowerCase().includes(prop.location.toLowerCase())
        )
      )
    }

    return suggestedClient || null
  }, [clients])

  // Update inspection with client data
  const updateInspectionWithClientData = useCallback((inspection: InspectionData, client: Client): InspectionData => {
    return {
      ...inspection,
      clientName: client.name,
      propertyLocation: client.properties.length > 0 ? client.properties[0].location : inspection.propertyLocation,
      propertyType: client.properties.length > 0 
        ? client.properties[0].type === 'Commercial' ? 'Building' : 'Apartment'
        : inspection.propertyType
    }
  }, [])

  // Sync client and inspection data
  const syncClientInspectionData = useCallback(async (inspection: InspectionData, client: Client) => {
    try {
      // Update inspection with client data
      const updatedInspection = updateInspectionWithClientData(inspection, client)
      
      // Save inspection
      await saveInspection(updatedInspection)
      
      // Update local state
      setInspectionData(updatedInspection)
      setSelectedClient(client)
      
      return updatedInspection
    } catch (error) {
      console.error('Error syncing client and inspection data:', error)
      throw error
    }
  }, [saveInspection, updateInspectionWithClientData])

  return {
    // State
    selectedClient,
    inspectionData,
    isAutoPopulating,
    
    // Actions
    setInspectionData,
    handleClientSelect,
    handleInspectionClientNameChange,
    createClientFromInspection,
    getClientInspectionHistory,
    suggestClient,
    updateInspectionWithClientData,
    syncClientInspectionData,
    
    // Utilities
    clients,
    inspections
  }
}
