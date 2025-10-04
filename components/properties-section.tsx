"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { useClients } from "@/hooks/use-clients"
import { useInspections } from "@/hooks/use-inspections"
import type { Property, Client, InspectionData } from "@/types"
import {
  Building,
  MapPin,
  Home,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Calendar
} from "lucide-react"

export function PropertiesSection() {
  const { clients, loading: clientsLoading, saveClient } = useClients()
  const { inspections } = useInspections()
  const [properties, setProperties] = useState<(Property & { clientName: string, clientId: string })[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<'All' | 'Residential' | 'Commercial'>('All')
  const [isAddingProperty, setIsAddingProperty] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const [newProperty, setNewProperty] = useState<Partial<Property>>({
    location: "",
    type: "Residential",
    size: 0
  })

  // Extract all properties from clients
  useEffect(() => {
    const allProperties = clients.flatMap(client =>
      client.properties.map(prop => ({
        ...prop,
        clientName: client.name,
        clientId: client.id
      }))
    )
    setProperties(allProperties)
  }, [clients])

  // Filter properties
  const filteredProperties = properties.filter(prop => {
    const matchesSearch = prop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prop.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All' || prop.type === typeFilter
    return matchesSearch && matchesType
  })

  // Get property statistics
  const getPropertyStats = () => {
    const totalProperties = properties.length
    const residentialCount = properties.filter(p => p.type === 'Residential').length
    const commercialCount = properties.filter(p => p.type === 'Commercial').length
    const totalSize = properties.reduce((sum, p) => sum + p.size, 0)

    return { totalProperties, residentialCount, commercialCount, totalSize }
  }

  // Get inspections for a property
  const getPropertyInspections = (propertyLocation: string): InspectionData[] => {
    return inspections.filter(insp =>
      insp.propertyLocation.toLowerCase().includes(propertyLocation.toLowerCase()) ||
      propertyLocation.toLowerCase().includes(insp.propertyLocation.toLowerCase())
    )
  }

  const handleAddProperty = async () => {
    if (!selectedClient || !newProperty.location || !newProperty.size) {
      setAlertMessage({ type: 'error', message: 'Please fill all fields' })
      return
    }

    setIsSaving(true)
    try {
      const property: Property = {
        id: `prop_${Date.now()}`,
        location: newProperty.location!,
        type: newProperty.type as 'Residential' | 'Commercial',
        size: newProperty.size!
      }

      const updatedClient: Client = {
        ...selectedClient,
        properties: [...selectedClient.properties, property]
      }

      await saveClient(updatedClient)

      setAlertMessage({ type: 'success', message: 'Property added successfully!' })
      setIsAddingProperty(false)
      setNewProperty({ location: "", type: "Residential", size: 0 })
      setSelectedClient(null)
      setTimeout(() => setAlertMessage(null), 3000)
    } catch (error) {
      console.error('Error adding property:', error)
      setAlertMessage({ type: 'error', message: 'Failed to add property' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProperty = async (propertyId: string, clientId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return

    try {
      const client = clients.find(c => c.id === clientId)
      if (!client) return

      const updatedClient: Client = {
        ...client,
        properties: client.properties.filter(p => p.id !== propertyId)
      }

      await saveClient(updatedClient)
      setAlertMessage({ type: 'success', message: 'Property deleted successfully!' })
      setTimeout(() => setAlertMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting property:', error)
      setAlertMessage({ type: 'error', message: 'Failed to delete property' })
    }
  }

  const stats = getPropertyStats()

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-0">
      {alertMessage && (
        <Alert className={alertMessage.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}>
          {alertMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <AlertDescription className={alertMessage.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
            {alertMessage.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Properties</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalProperties}</p>
              </div>
              <Building className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Residential</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.residentialCount}</p>
              </div>
              <Home className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Commercial</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.commercialCount}</p>
              </div>
              <Building className="h-10 w-10 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Area</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSize.toLocaleString()} m²</p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by location or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Residential">Residential</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAddingProperty} onOpenChange={setIsAddingProperty}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                  <DialogDescription>Add a new property to a client's portfolio</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Client</Label>
                    <Select
                      value={selectedClient?.id}
                      onValueChange={(value) => {
                        const client = clients.find(c => c.id === value)
                        setSelectedClient(client || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Property Location</Label>
                    <Input
                      id="location"
                      value={newProperty.location}
                      onChange={(e) => setNewProperty({ ...newProperty, location: e.target.value })}
                      placeholder="Enter property address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Property Type</Label>
                    <Select
                      value={newProperty.type}
                      onValueChange={(value: 'Residential' | 'Commercial') =>
                        setNewProperty({ ...newProperty, type: value })
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Size (m²)</Label>
                    <Input
                      id="size"
                      type="number"
                      value={newProperty.size || ''}
                      onChange={(e) => setNewProperty({ ...newProperty, size: Number(e.target.value) })}
                      placeholder="Enter property size"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingProperty(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddProperty} disabled={isSaving}>
                    {isSaving ? 'Adding...' : 'Add Property'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.length > 0 ? (
          filteredProperties.map((property) => {
            const propertyInspections = getPropertyInspections(property.location)
            return (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{property.location}</CardTitle>
                      <CardDescription className="mt-1">
                        Client: {property.clientName}
                      </CardDescription>
                    </div>
                    <Badge variant={property.type === 'Residential' ? 'default' : 'secondary'}>
                      {property.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4" />
                      <span>{property.size.toLocaleString()} m²</span>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Inspections</span>
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          {propertyInspections.length}
                        </Badge>
                      </div>
                      {propertyInspections.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Last Inspection</span>
                          <span className="text-slate-900 dark:text-slate-100">
                            {new Date(propertyInspections[0].inspectionDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteProperty(property.id, property.clientId)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <Building className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No properties found</p>
                  <p className="text-sm mt-2">
                    {searchTerm || typeFilter !== 'All'
                      ? 'Try adjusting your search or filters'
                      : 'Add your first property to get started'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
