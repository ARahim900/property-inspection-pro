"use client"

import { createClient } from "@/lib/supabase/client"
import type { Client } from "@/types"
import { useAuth } from "./use-auth"
import { useState, useEffect, useCallback } from "react"

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch all clients for the current user
  const fetchClients = useCallback(async () => {
    if (!user) {
      setClients([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch clients with their properties
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select(`
          *,
          properties (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (clientsError) throw clientsError

      // Transform the data to match the existing Client interface
      const transformedClients: Client[] =
        clientsData?.map((client) => ({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone || "",
          address: client.address || "",
          properties:
            client.properties?.map((property: any) => ({
              id: property.id,
              location: property.location,
              type: property.type as "Commercial" | "Residential",
              size: property.size || 0,
            })) || [],
        })) || []

      setClients(transformedClients)
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Save client (create or update)
  const saveClient = async (client: Client): Promise<string> => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Check if client exists
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("id", client.id)
        .eq("user_id", user.id)
        .single()

      let clientId = client.id

      if (existingClient) {
        // Update existing client
        const { error: updateError } = await supabase
          .from("clients")
          .update({
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            updated_at: new Date().toISOString(),
          })
          .eq("id", client.id)
          .eq("user_id", user.id)

        if (updateError) throw updateError
      } else {
        // Create new client
        const { data: newClient, error: insertError } = await supabase
          .from("clients")
          .insert({
            id: client.id,
            user_id: user.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
          })
          .select("id")
          .single()

        if (insertError) throw insertError
        clientId = newClient.id
      }

      // Delete existing properties for this client
      await supabase.from("properties").delete().eq("client_id", clientId).eq("user_id", user.id)

      // Insert new properties
      for (const property of client.properties) {
        await supabase.from("properties").insert({
          id: property.id,
          user_id: user.id,
          client_id: clientId,
          location: property.location,
          type: property.type,
          size: property.size,
        })
      }

      await fetchClients() // Refresh the list
      return clientId
    } catch (error) {
      console.error("Error saving client:", error)
      throw error
    }
  }

  // Delete client
  const deleteClient = async (id: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const { error } = await supabase.from("clients").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error

      await fetchClients() // Refresh the list
    } catch (error) {
      console.error("Error deleting client:", error)
      throw error
    }
  }

  // Get client by ID
  const getClientById = (id: string): Client | null => {
    return clients.find((client) => client.id === id) || null
  }

  // Load clients when user changes
  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return {
    clients,
    loading,
    saveClient,
    deleteClient,
    getClientById,
    refreshClients: fetchClients,
  }
}
