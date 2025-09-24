"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useClients } from "@/hooks/use-clients"
import { useInspections } from "@/hooks/use-inspections"
import type { Client, Property, InspectionData } from "@/types"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Plus, 
  Save, 
  AlertCircle, 
  CheckCircle,
  Search,
  RefreshCw
} from "lucide-react"

interface ClientSectionProps {
  inspectionData?: InspectionData
  onClientSelect?: (client: Client) => void
  onClientUpdate?: (client: Client) => void
  className?: string
}

export function ClientSection({ 
  inspectionData, 
  onClientSelect, 
  onClientUpdate,
  className = "" 
}: ClientSectionProps) {
  const { clients, loading: clientsLoading, saveClient, refreshClients } = useClients()
  const { inspections } = useInspections()
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  // Form state for new client
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    properties: []
  })

  // Auto-populate client data when inspection data changes
  useEffect(() => {
    if (inspectionData?.clientName && clients.length > 0) {
      const matchingClient = clients.find(client => 
        client.name.toLowerCase().includes(inspectionData.clientName.toLowerCase())
      )
      
      if (matchingClient && matchingClient.id !== selectedClient?.id) {
        setSelectedClient(matchingClient)
        onClientSelect?.(matchingClient)
      }
    }
  }, [inspectionData?.clientName, clients, selectedClient?.id, onClientSelect])

  // Auto-populate new client form with inspection data
  useEffect(() => {
    if (inspectionData && showNewClientForm) {
      setNewClient(prev => ({
        ...prev,
        name: inspectionData.clientName || "",
        properties: inspectionData.propertyLocation ? [{
          id: `prop_${Date.now()}`,
          location: inspectionData.propertyLocation,
          type: inspectionData.propertyType === 'Apartment' || inspectionData.propertyType === 'Villa' ? 'Residential' : 'Commercial',
          size: 0
        }] : []
      }))
    }
  }, [inspectionData, showNewClientForm])

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  )

  // Handle client selection
  const handleClientSelect = useCallback((client: Client) => {
    setSelectedClient(client)
    setIsEditing(false)
    setShowNewClientForm(false)
    setAlertMessage(null)
    onClientSelect?.(client)
  }, [onClientSelect])

  // Handle creating new client
  const handleCreateClient = async () => {
    if (!newClient.name?.trim()) {
      setAlertMessage({ type: 'error', message: 'Client name is required' })
      return
    }

    setIsSaving(true)
    try {
      const clientToSave: Client = {
        id: `client_${Date.now()}`,
        name: newClient.name.trim(),
        email: newClient.email?.trim() || "",
        phone: newClient.phone?.trim() || "",
        address: newClient.address?.trim() || "",
        properties: newClient.properties || []
      }

      await saveClient(clientToSave)
      await refreshClients()
      
      setAlertMessage({ type: 'success', message: 'Client created successfully!' })
      setShowNewClientForm(false)
      setNewClient({ name: "", email: "", phone: "", address: "", properties: [] })
      
      // Auto-select the newly created client
      const createdClient = clients.find(c => c.name === clientToSave.name) || clientToSave
      handleClientSelect(createdClient)
      
    } catch (error: any) {
      console.error('Error creating client:', error)
      setAlertMessage({ type: 'error', message: error.message || 'Failed to create client' })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle updating existing client
  const handleUpdateClient = async () => {
    if (!selectedClient) return

    setIsSaving(true)
    try {
      await saveClient(selectedClient)
      await refreshClients()
      
      setAlertMessage({ type: 'success', message: 'Client updated successfully!' })
      setIsEditing(false)
      onClientUpdate?.(selectedClient)
      
    } catch (error: any) {
      console.error('Error updating client:', error)
      setAlertMessage({ type: 'error', message: error.message || 'Failed to update client' })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle adding new property to client
  const handleAddProperty = () => {
    if (!selectedClient) return

    const newProperty: Property = {
      id: `prop_${Date.now()}`,
      location: "",
      type: "Residential",
      size: 0
    }

    setSelectedClient({
      ...selectedClient,
      properties: [...selectedClient.properties, newProperty]
    })
  }

  // Handle updating property
  const handleUpdateProperty = (propertyId: string, updates: Partial<Property>) => {
    if (!selectedClient) return

    setSelectedClient({
      ...selectedClient,
      properties: selectedClient.properties.map(prop =>
        prop.id === propertyId ? { ...prop, ...updates } : prop
      )
    })
  }

  // Handle removing property
  const handleRemoveProperty = (propertyId: string) => {
    if (!selectedClient) return

    setSelectedClient({
      ...selectedClient,
      properties: selectedClient.properties.filter(prop => prop.id !== propertyId)
    })
  }

  // Clear alert after 3 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [alertMessage])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <User className="w-6 h-6" />
            Client Management
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage client information and properties
          </p>
        </div>
        <Button
          onClick={() => refreshClients()}
          variant="outline"
          size="sm"
          disabled={clientsLoading}
        >
          <RefreshCw className={`w-4 h-4 ${clientsLoading ? 'animate-spin' : ''}`} />
          Refresh
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

      {/* Client Search and Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Select Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search clients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Client List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {clientsLoading ? (
              <div className="text-center py-4">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                <p className="text-sm text-slate-500 mt-2">Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-4">
                <User className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">
                  {searchTerm ? 'No clients found matching your search' : 'No clients found'}
                </p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedClient?.id === client.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  onClick={() => handleClientSelect(client)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-800 dark:text-slate-100">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {client.properties.length} {client.properties.length === 1 ? 'Property' : 'Properties'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create New Client Button */}
          <Button
            onClick={() => setShowNewClientForm(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Client
          </Button>
        </CardContent>
      </Card>

      {/* New Client Form */}
      {showNewClientForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client-name">Client Name *</Label>
                <Input
                  id="client-name"
                  value={newClient.name || ""}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={newClient.email || ""}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <Label htmlFor="client-phone">Phone</Label>
                <Input
                  id="client-phone"
                  value={newClient.phone || ""}
                  onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="client-address">Address</Label>
                <Input
                  id="client-address"
                  value={newClient.address || ""}
                  onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, City, State"
                />
              </div>
            </div>

            {/* Properties Section */}
            <div>
              <Label className="text-base font-medium">Properties</Label>
              <div className="space-y-3 mt-2">
                {(newClient.properties || []).map((property, index) => (
                  <div key={property.id} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Location</Label>
                        <Input
                          value={property.location}
                          onChange={(e) => {
                            const updatedProperties = [...(newClient.properties || [])]
                            updatedProperties[index] = { ...property, location: e.target.value }
                            setNewClient(prev => ({ ...prev, properties: updatedProperties }))
                          }}
                          placeholder="Property location"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={property.type}
                          onValueChange={(value: "Commercial" | "Residential") => {
                            const updatedProperties = [...(newClient.properties || [])]
                            updatedProperties[index] = { ...property, type: value }
                            setNewClient(prev => ({ ...prev, properties: updatedProperties }))
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Residential">Residential</SelectItem>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Size (sq m)</Label>
                        <Input
                          type="number"
                          value={property.size}
                          onChange={(e) => {
                            const updatedProperties = [...(newClient.properties || [])]
                            updatedProperties[index] = { ...property, size: parseInt(e.target.value) || 0 }
                            setNewClient(prev => ({ ...prev, properties: updatedProperties }))
                          }}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCreateClient}
                disabled={isSaving || !newClient.name?.trim()}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Client
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowNewClientForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Client Details */}
      {selectedClient && !showNewClientForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {selectedClient.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Client'}
                </Button>
                {isEditing && (
                  <Button
                    onClick={handleUpdateClient}
                    disabled={isSaving}
                    size="sm"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Client Name</Label>
                {isEditing ? (
                  <Input
                    value={selectedClient.name}
                    onChange={(e) => setSelectedClient(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                ) : (
                  <p className="text-slate-800 dark:text-slate-100 font-medium">{selectedClient.name}</p>
                )}
              </div>
              <div>
                <Label>Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={selectedClient.email}
                    onChange={(e) => setSelectedClient(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {selectedClient.email || 'No email provided'}
                  </p>
                )}
              </div>
              <div>
                <Label>Phone</Label>
                {isEditing ? (
                  <Input
                    value={selectedClient.phone}
                    onChange={(e) => setSelectedClient(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  />
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedClient.phone || 'No phone provided'}
                  </p>
                )}
              </div>
              <div>
                <Label>Address</Label>
                {isEditing ? (
                  <Input
                    value={selectedClient.address}
                    onChange={(e) => setSelectedClient(prev => prev ? { ...prev, address: e.target.value } : null)}
                  />
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedClient.address || 'No address provided'}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Properties Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Properties ({selectedClient.properties.length})
                </Label>
                {isEditing && (
                  <Button onClick={handleAddProperty} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Property
                  </Button>
                )}
              </div>

              {selectedClient.properties.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No properties added yet</p>
                  {isEditing && (
                    <Button onClick={handleAddProperty} variant="outline" className="mt-3">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Property
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedClient.properties.map((property) => (
                    <div key={property.id} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Location</Label>
                          {isEditing ? (
                            <Input
                              value={property.location}
                              onChange={(e) => handleUpdateProperty(property.id, { location: e.target.value })}
                            />
                          ) : (
                            <p className="text-slate-800 dark:text-slate-100 font-medium">{property.location}</p>
                          )}
                        </div>
                        <div>
                          <Label>Type</Label>
                          {isEditing ? (
                            <Select
                              value={property.type}
                              onValueChange={(value: "Commercial" | "Residential") => 
                                handleUpdateProperty(property.id, { type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Residential">Residential</SelectItem>
                                <SelectItem value="Commercial">Commercial</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={property.type === 'Commercial' ? 'default' : 'secondary'}>
                              {property.type}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <Label>Size</Label>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={property.size}
                              onChange={(e) => handleUpdateProperty(property.id, { size: parseInt(e.target.value) || 0 })}
                            />
                          ) : (
                            <p className="text-slate-600 dark:text-slate-400">{property.size} sq m</p>
                          )}
                        </div>
                      </div>
                      {isEditing && (
                        <div className="flex justify-end mt-3">
                          <Button
                            onClick={() => handleRemoveProperty(property.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            Remove Property
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
