"use client"

import { createClient } from "@/lib/supabase/client"
import type { Invoice } from "@/types"
import { useAuth } from "./use-auth"
import { useState, useEffect, useCallback } from "react"

export function useInvoices() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch all invoices for the current user
  const fetchInvoices = useCallback(async () => {
    if (!user) {
      setInvoices([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch invoices with their services
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(`
          *,
          invoice_services (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (invoicesError) throw invoicesError

      // Transform the data to match the existing Invoice interface
      const transformedInvoices: Invoice[] =
        invoicesData?.map((invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          invoiceDate: invoice.invoice_date,
          dueDate: invoice.due_date,
          clientId: invoice.client_id || "",
          clientName: invoice.client_name,
          clientAddress: invoice.client_address,
          clientEmail: invoice.client_email,
          propertyLocation: invoice.property_location,
          services:
            invoice.invoice_services?.map((service: any) => ({
              id: service.id,
              description: service.description,
              quantity: Number.parseFloat(service.quantity),
              unitPrice: Number.parseFloat(service.unit_price),
              total: Number.parseFloat(service.total),
            })) || [],
          subtotal: Number.parseFloat(invoice.subtotal),
          tax: Number.parseFloat(invoice.tax),
          totalAmount: Number.parseFloat(invoice.total_amount),
          amountPaid: Number.parseFloat(invoice.amount_paid),
          status: invoice.status,
          notes: invoice.notes,

        })) || []

      setInvoices(transformedInvoices)
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Save invoice (create or update)
  const saveInvoice = async (invoice: Invoice): Promise<string> => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Check if invoice exists
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("id", invoice.id)
        .eq("user_id", user.id)
        .single()

      let invoiceId = invoice.id

      if (existingInvoice) {
        // Update existing invoice
        const { error: updateError } = await supabase
          .from("invoices")
          .update({
            invoice_number: invoice.invoiceNumber,
            invoice_date: invoice.invoiceDate,
            due_date: invoice.dueDate,
            client_id: invoice.clientId || null,
            client_name: invoice.clientName,
            client_address: invoice.clientAddress,
            client_email: invoice.clientEmail,
            property_location: invoice.propertyLocation,
            subtotal: invoice.subtotal,
            tax: invoice.tax,
            total_amount: invoice.totalAmount,
            amount_paid: invoice.amountPaid,
            status: invoice.status,
            notes: invoice.notes,
            template: invoice.template,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoice.id)
          .eq("user_id", user.id)

        if (updateError) throw updateError
      } else {
        // Create new invoice
        const { data: newInvoice, error: insertError } = await supabase
          .from("invoices")
          .insert({
            id: invoice.id,
            user_id: user.id,
            invoice_number: invoice.invoiceNumber,
            invoice_date: invoice.invoiceDate,
            due_date: invoice.dueDate,
            client_id: invoice.clientId || null,
            client_name: invoice.clientName,
            client_address: invoice.clientAddress,
            client_email: invoice.clientEmail,
            property_location: invoice.propertyLocation,
            subtotal: invoice.subtotal,
            tax: invoice.tax,
            total_amount: invoice.totalAmount,
            amount_paid: invoice.amountPaid,
            status: invoice.status,
            notes: invoice.notes,
            template: invoice.template,
          })
          .select("id")
          .single()

        if (insertError) throw insertError
        invoiceId = newInvoice.id
      }

      // Delete existing services for this invoice
      await supabase.from("invoice_services").delete().eq("invoice_id", invoiceId).eq("user_id", user.id)

      // Insert new services
      for (const service of invoice.services) {
        await supabase.from("invoice_services").insert({
          id: service.id,
          user_id: user.id,
          invoice_id: invoiceId,
          description: service.description,
          quantity: service.quantity,
          unit_price: service.unitPrice,
          total: service.total,
        })
      }

      await fetchInvoices() // Refresh the list
      return invoiceId
    } catch (error) {
      console.error("Error saving invoice:", error)
      throw error
    }
  }

  // Delete invoice
  const deleteInvoice = async (id: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const { error } = await supabase.from("invoices").delete().eq("id", id).eq("user_id", user.id)

      if (error) throw error

      await fetchInvoices() // Refresh the list
    } catch (error) {
      console.error("Error deleting invoice:", error)
      throw error
    }
  }

  // Get invoice by ID
  const getInvoiceById = (id: string): Invoice | null => {
    return invoices.find((invoice) => invoice.id === id) || null
  }

  // Load invoices when user changes
  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  return {
    invoices,
    loading,
    saveInvoice,
    deleteInvoice,
    getInvoiceById,
    refreshInvoices: fetchInvoices,
  }
}
