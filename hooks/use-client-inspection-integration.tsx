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

  // Enhanced auto-populate client data when inspection client name changes
  const handleInspectionClientNameChange = useCallback((clientName: string) => {
    if (!clientName.trim()) {
      setSelectedClient(null)
      return
    }

    // Enhanced client matching algorithm
    const matchingClient = findBestMatchingClient(clientName, clients)

    if (matchingClient && matchingClient.id !== selectedClient?.id) {
      setSelectedClient(matchingClient)
      
      // Auto-populate inspection data with client's property information
      if (inspectionData && matchingClient.properties.length > 0) {
        setIsAutoPopulating(true)
        
        const updatedInspection: InspectionData = {
          ...inspectionData,
          clientName: matchingClient.name,
          propertyLocation: inspectionData.propertyLocation || matchingClient.properties[0].location,
          propertyType: inspectionData.propertyType || 
            (matchingClient.properties[0].type === 'Commercial' ? 'Building' : 'Apartment')
        }
        
        setInspectionData(updatedInspection)
        
        setTimeout(() => setIsAutoPopulating(false), 1000)
      }
    }
  }, [clients, selectedClient?.id, inspectionData])

  // Enhanced client matching algorithm
  const findBestMatchingClient = useCallback((clientName: string, clientList: Client[]): Client | null => {
    if (!clientName.trim() || clientList.length === 0) return null

    const searchTerm = clientName.toLowerCase().trim()
    
    // Scoring system for better matching
    const scoredClients = clientList.map(client => {
      let score = 0
      const clientNameLower = client.name.toLowerCase()
      
      // Exact match gets highest score
      if (clientNameLower === searchTerm) {
        score = 100
      }
      // Starts with search term
      else if (clientNameLower.startsWith(searchTerm)) {
        score = 80
      }
      // Contains search term
      else if (clientNameLower.includes(searchTerm)) {
        score = 60
      }
      // Search term contains client name
      else if (searchTerm.includes(clientNameLower)) {
        score = 40
      }
      // Fuzzy matching for similar names
      else if (calculateSimilarity(clientNameLower, searchTerm) > 0.7) {
        score = 30
      }
      
      // Bonus points for property location matches
      if (inspectionData?.propertyLocation) {
        const hasMatchingProperty = client.properties.some(prop =>
          prop.location.toLowerCase().includes(inspectionData.propertyLocation.toLowerCase()) ||
          inspectionData.propertyLocation.toLowerCase().includes(prop.location.toLowerCase())
        )
        if (hasMatchingProperty) {
          score += 20
        }
      }
      
      return { client, score }
    })
    
    // Sort by score and return the best match
    scoredClients.sort((a, b) => b.score - a.score)
    return scoredClients[0]?.score > 20 ? scoredClients[0].client : null
  }, [inspectionData])

  // Simple string similarity calculation
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // Enhanced create client from inspection data
  const createClientFromInspection = useCallback(async (inspection: InspectionData): Promise<Client | null> => {
    if (!inspection.clientName.trim()) return null

    try {
      // Extract additional information from inspection data
      const extractedInfo = extractClientInfoFromInspection(inspection)
      
      const newClient: Client = {
        id: `client_${Date.now()}`,
        name: inspection.clientName.trim(),
        email: extractedInfo.email || "",
        phone: extractedInfo.phone || "",
        address: extractedInfo.address || "",
        properties: inspection.propertyLocation ? [{
          id: `prop_${Date.now()}`,
          location: inspection.propertyLocation,
          type: inspection.propertyType === 'Apartment' || inspection.propertyType === 'Villa' ? 'Residential' : 'Commercial',
          size: extractedInfo.propertySize || 0
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

  // Extract client information from inspection data
  const extractClientInfoFromInspection = useCallback((inspection: InspectionData) => {
    const info = {
      email: "",
      phone: "",
      address: "",
      propertySize: 0
    }

    // Try to extract email from AI summary or other fields
    if (inspection.aiSummary) {
      const emailMatch = inspection.aiSummary.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
      if (emailMatch) {
        info.email = emailMatch[0]
      }

      // Try to extract phone number
      const phoneMatch = inspection.aiSummary.match(/(\+?[\d\s\-\(\)]{10,})/)
      if (phoneMatch) {
        info.phone = phoneMatch[0].trim()
      }

      // Try to extract address
      const addressMatch = inspection.aiSummary.match(/(\d+\s+[A-Za-z\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl))/i)
      if (addressMatch) {
        info.address = addressMatch[0].trim()
      }

      // Try to extract property size
      const sizeMatch = inspection.aiSummary.match(/(\d+)\s*(?:sq\s*m|square\s*meters?|m²)/i)
      if (sizeMatch) {
        info.propertySize = parseInt(sizeMatch[1])
      }
    }

    return info
  }, [])

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

  // Auto-update client properties from inspection data
  const updateClientPropertiesFromInspection = useCallback(async (inspection: InspectionData, client: Client): Promise<Client> => {
    if (!inspection.propertyLocation) return client

    // Check if client already has this property
    const existingProperty = client.properties.find(prop => 
      prop.location.toLowerCase() === inspection.propertyLocation.toLowerCase()
    )

    if (!existingProperty) {
      // Add new property to client
      const newProperty = {
        id: `prop_${Date.now()}`,
        location: inspection.propertyLocation,
        type: inspection.propertyType === 'Apartment' || inspection.propertyType === 'Villa' ? 'Residential' : 'Commercial',
        size: 0
      }

      const updatedClient = {
        ...client,
        properties: [...client.properties, newProperty]
      }

      await saveClient(updatedClient)
      await refreshClients()
      
      return updatedClient
    }

    return client
  }, [saveClient, refreshClients])

  // Enhanced sync client and inspection data
  const syncClientInspectionData = useCallback(async (inspection: InspectionData, client: Client) => {
    try {
      // Update inspection with client data
      const updatedInspection = updateInspectionWithClientData(inspection, client)
      
      // Auto-update client properties if needed
      const updatedClient = await updateClientPropertiesFromInspection(updatedInspection, client)
      
      // Save inspection
      await saveInspection(updatedInspection)
      
      // Update local state
      setInspectionData(updatedInspection)
      setSelectedClient(updatedClient)
      
      return updatedInspection
    } catch (error) {
      console.error('Error syncing client and inspection data:', error)
      throw error
    }
  }, [saveInspection, updateInspectionWithClientData, updateClientPropertiesFromInspection])

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
    updateClientPropertiesFromInspection,
    extractClientInfoFromInspection,
    findBestMatchingClient,
    
    // Utilities
    clients,
    inspections
  }
}
