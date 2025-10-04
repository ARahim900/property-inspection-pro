"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type {
  InspectionData,
  InspectionArea,
  InspectionItem,
  InspectionPhoto,
  InspectionStatus,
  Client,
  Invoice,
  AppSettings,
} from "./types"
import { INSPECTION_CATEGORIES, MOCK_CLIENTS } from "./constants"

import { useInspections } from "./hooks/use-inspections"
import { useClients } from "./hooks/use-clients"
import { useInvoices } from "./hooks/use-invoices"
import { useAuth, AuthProvider } from "./hooks/use-auth"
import { ClientSection } from "./components/client-section"
import { EnhancedInspectionForm } from "./components/enhanced-inspection-form"
import { InvoiceSection } from "./components/invoice-section"
import { SettingsSection } from "./components/settings-section"

import { WaslaLogo } from "./components/wasla-logo"
import { PropertiesSection } from "./components/properties-section"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar"
import { Button } from "./components/ui/button"
import { cn } from "./lib/utils"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "./components/ui/chart"
import { LayoutDashboard, ClipboardCheck, Users, Building2, FileText, Settings2, Sun, Moon, ArrowUpRight, ArrowDownRight, Minus, CircleDollarSign, Wallet, CheckCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Area, Bar, CartesianGrid, ComposedChart, Pie, PieChart, Cell, XAxis, YAxis } from "recharts"

// Removed local useClients hook - now using Supabase-based hook from hooks/use-clients.tsx



const useAppSettings = () => {
  const defaultAvatar = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>')}`

  const defaultSettings: AppSettings = {
    theme: "dark", // Default to dark, will be updated on client
    notifications: { email: true, push: false },
    language: "en",
    profile: {
      name: "Alex Johnson",
      email: "alex.j@inspectorpro.dev",
      phone: "+1-555-123-4567",
      avatar: defaultAvatar,
    },
  }

  const getSettings = (): AppSettings => {
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const stored = localStorage.getItem("appSettings")
        if (stored) {
          const parsed = JSON.parse(stored)
          // Deep merge with defaults to handle new settings being added
          return {
            ...defaultSettings,
            ...parsed,
            notifications: { ...defaultSettings.notifications, ...parsed.notifications },
            profile: { ...defaultSettings.profile, ...parsed.profile },
          }
        }
        localStorage.setItem("appSettings", JSON.stringify(defaultSettings))
      }
      return defaultSettings
    } catch (e) {
      console.error("Failed to parse app settings:", e)
      return defaultSettings
    }
  }

  const saveSettings = (settings: AppSettings) => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem("appSettings", JSON.stringify(settings))
      localStorage.setItem("theme", settings.theme) // Also save theme separately for initial load
    }
  }

  return { getSettings, saveSettings }
}

// --- Helper Functions ---
const resizeAndCompressImage = (file: File, maxSize = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`resizeAndCompressImage called with file: ${file.name}, maxSize: ${maxSize}, quality: ${quality}`)

    const reader = new FileReader()

    reader.onload = (event) => {
      console.log("FileReader onload triggered")
      if (!event.target?.result) {
        console.error("FileReader did not return a result")
        return reject(new Error("FileReader did not return a result."))
      }

      console.log(`FileReader result type: ${typeof event.target.result}`)
      const img = new Image()

      img.onload = () => {
        console.log(`Image loaded: ${img.width}x${img.height}`)
        const canvas = document.createElement("canvas")
        let { width, height } = img

        // Calculate new dimensions
        if (width > height) {
          if (width > maxSize) {
            height = Math.round(height * (maxSize / width))
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = Math.round(width * (maxSize / height))
            height = maxSize
          }
        }

        console.log(`Resizing to: ${width}x${height}`)
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          console.error("Failed to get canvas context")
          return reject(new Error("Failed to get canvas context"))
        }

        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL("image/jpeg", quality)
        console.log(`Generated dataUrl length: ${dataUrl.length}`)
        console.log(`DataUrl starts with: ${dataUrl.substring(0, 30)}`)
        resolve(dataUrl)
      }

      img.onerror = (error) => {
        console.error("Image load error:", error)
        reject(new Error("Failed to load image"))
      }

      img.src = event.target.result as string
      console.log("Image src set")
    }

    reader.onerror = (error) => {
      console.error("FileReader error:", error)
      reject(error)
    }

    console.log("Starting FileReader.readAsDataURL")
    reader.readAsDataURL(file)
  })
}

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A"
  // Handles 'YYYY-MM-DD' format from date inputs
  const date = new Date(dateString)
  const timeZoneOffset = date.getTimezoneOffset() * 60000
  const adjustedDate = new Date(date.getTime() + timeZoneOffset)

  return adjustedDate.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const formatCurrency = (amount: number, currency = "OMR") => {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return currency ? `${currency} ${formattedAmount}` : formattedAmount
}

const formatCompactNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return "0"
  }
  const absValue = Math.abs(value)
  if (absValue >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1).replace(/\.0$/, "")
    return `${formatted}M`
  }
  if (absValue >= 1_000) {
    const formatted = (value / 1_000).toFixed(1).replace(/\.0$/, "")
    return `${formatted}k`
  }
  return Math.round(value).toLocaleString()
}

// --- UI Components ---
const buttonClasses = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-2.5 px-5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600",
  destructive:
    "bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
}

const inputClasses =
  "block w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors"

// Alert Circle Icon Component
const AlertCircle: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
)

const Spinner: React.FC<{ className?: string }> = ({ className = "text-white" }) => (
  <svg
    className={`animate-spin h-5 w-5 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
  </svg>
)

const Modal: React.FC<{
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
}> = ({ isOpen, onClose, title, children, size = "2xl" }) => {
  if (!isOpen) return null
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-80 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto transition-all transform scale-95 opacity-0 animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b dark:border-slate-700 pb-3 mb-4">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-2xl transition-colors"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
      <style>{`
                @keyframes scale-in {
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out forwards;
                }
            `}</style>
    </div>
  )
}

const ConfirmationModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: React.ReactNode
  confirmText?: string
  confirmButtonClass?: string
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm" }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div>
        <p className="text-slate-700 dark:text-slate-300">{message}</p>
        <div className="flex justify-end gap-4 mt-6">
          <button type="button" onClick={onClose} className={buttonClasses.secondary}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={buttonClasses.destructive}>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

const PhotoUpload: React.FC<{
  photos: InspectionPhoto[]
  onUpload: (photo: InspectionPhoto) => void
  onRemove: (index: number) => void
}> = ({ photos, onUpload, onRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange triggered")
    if (event.target.files && event.target.files.length > 0) {
      console.log(`Processing ${event.target.files.length} file(s)`)
      // Fix: The 'file' variable was being incorrectly inferred as 'unknown'. By iterating directly over `event.target.files` (a FileList) instead of using `Array.from`, TypeScript can correctly infer the type of 'file' as a `File` object, resolving the type errors.
      for (const file of event.target.files) {
        console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`)
        try {
          console.log("Starting image resize and compress...")
          const base64WithMime = await resizeAndCompressImage(file, 1024, 0.8)
          console.log(`Image processed successfully. Base64 length: ${base64WithMime?.length || 0}`)
          console.log(`Base64 preview: ${base64WithMime?.substring(0, 50)}...`)

          // Keep the full data URL including MIME type for proper display in reports
          onUpload({ base64: base64WithMime, name: file.name })
          console.log(`Photo uploaded: ${file.name}`)
        } catch (error) {
          console.error("Error processing image:", error)
          alert(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    } else {
      console.log("No files selected")
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
        {photos.map((photo, index) => {
          // Skip rendering if no base64, but keep index consistent
          if (!photo.base64) return null

          return (
            <div key={index} className="relative group aspect-square">
              <img
                src={photo.base64.startsWith('data:') ? photo.base64 : `data:image/jpeg;base64,${photo.base64}`}
                alt={`upload-preview-${index}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  console.log(`Removing photo at index ${index}`)
                  onRemove(index)
                }}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>
          )
        })}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-blue-500 hover:text-blue-600 transition"
          aria-label="Add Photo"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"></path>
          </svg>
          <span className="text-xs mt-1">Add Photo</span>
        </button>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*" />
    </div>
  )
}

const InspectionItemRow: React.FC<{
  item: InspectionItem
  onUpdate: (updatedItem: InspectionItem) => void
  onRemove: () => void
}> = ({ item, onUpdate, onRemove }) => {
  const handleUpdate = (field: keyof InspectionItem, value: any) => {
    console.log(`InspectionItemRow handleUpdate: field=${field}, value=`, value)
    if (field === 'photos') {
      console.log(`Updating photos. Current count: ${item.photos.length}, New count: ${value.length}`)
    }
    onUpdate({ ...item, [field]: value })
  }

  const statusClasses: { [key in InspectionStatus]: string } = {
    Pass: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
    Fail: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
    "N/A": "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
  }

  return (
    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{item.point}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-xl font-bold transition-colors"
        >
          &times;
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
          <select
            value={item.status}
            onChange={(e) => handleUpdate("status", e.target.value)}
            className={`w-full p-2 rounded-lg border ${statusClasses[item.status]}`}
          >
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
            <option value="N/A">N/A</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
          <input
            type="text"
            value={item.location}
            onChange={(e) => handleUpdate("location", e.target.value)}
            placeholder="e.g., Master Bedroom Ceiling"
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Comments</label>
        <textarea
          value={item.comments}
          onChange={(e) => handleUpdate("comments", e.target.value)}
          placeholder="Add comments..."
          rows={3}
          className={inputClasses}
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Photos</label>
        <PhotoUpload
          photos={item.photos}
          onUpload={(photo) => handleUpdate("photos", [...item.photos, photo])}
          onRemove={(index) =>
            handleUpdate(
              "photos",
              item.photos.filter((_, i) => i !== index),
            )
          }
        />
      </div>
    </div>
  )
}

const InspectionAreaCard: React.FC<{
  area: InspectionArea
  onUpdate: (updatedArea: InspectionArea) => void
  onRemove: () => void
}> = ({ area, onUpdate, onRemove }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customPoint, setCustomPoint] = useState("")
  const [customCategory, setCustomCategory] = useState("Custom")

  const handleNameChange = (newName: string) => {
    onUpdate({ ...area, name: newName })
  }

  const handleAddItem = (category: string, point: string) => {
    const newItem: InspectionItem = {
      id: Date.now(),
      category,
      point,
      status: "N/A",
      comments: "",
      location: "",
      photos: [],
    }
    onUpdate({ ...area, items: [...area.items, newItem] })
  }

  const handleUpdateItem = (updatedItem: InspectionItem) => {
    const newItems = area.items.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    onUpdate({ ...area, items: newItems })
  }

  const handleRemoveItem = (itemId: number) => {
    const newItems = area.items.filter((item) => item.id !== itemId)
    onUpdate({ ...area, items: newItems })
  }

  const handleAddCustomItem = () => {
    if (customPoint.trim() === "") {
      alert("Please enter a name for the custom inspection point.")
      return
    }
    handleAddItem(customCategory.trim() || "Custom", customPoint.trim())
    setCustomPoint("")
    setCustomCategory("Custom")
    setIsModalOpen(false)
  }

  return (
    <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-4 shadow-sm mb-6 border dark:border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          value={area.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="text-xl font-bold bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 transition-colors"
          placeholder="Area Name"
        />
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold transition-colors"
        >
          Remove Area
        </button>
      </div>

      <div className="space-y-4">
        {area.items.map((item) => (
          <InspectionItemRow
            key={item.id}
            item={item}
            onUpdate={handleUpdateItem}
            onRemove={() => handleRemoveItem(item.id)}
          />
        ))}
      </div>

      <button type="button" onClick={() => setIsModalOpen(true)} className={`mt-4 w-full ${buttonClasses.primary}`}>
        Add Inspection Point
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Inspection Point">
        <div className="p-4 mb-4 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-600">
          <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-300 mb-2">Add Custom Point</h4>
          <div className="space-y-2">
            <input
              type="text"
              value={customPoint}
              onChange={(e) => setCustomPoint(e.target.value)}
              placeholder="e.g., Check for window seal drafts"
              className={inputClasses}
            />
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Category (e.g., Windows)"
              className={inputClasses}
            />
            <button type="button" onClick={handleAddCustomItem} className={`w-full ${buttonClasses.primary}`}>
              Add Custom Point
            </button>
          </div>
        </div>

        <div className="border-t dark:border-slate-600 pt-4">
          <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-300 mb-2">
            Or Select a Predefined Point
          </h4>
          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
            {Object.entries(INSPECTION_CATEGORIES).map(([category, points]) => (
              <div key={category}>
                <h4 className="font-semibold text-lg text-slate-700 dark:text-slate-300 mb-2 border-b dark:border-slate-600 pb-1">
                  {category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {points.map((point) => (
                    <button
                      type="button"
                      key={point}
                      onClick={() => {
                        handleAddItem(category, point)
                        setIsModalOpen(false)
                      }}
                      className="text-left p-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-sm transition text-slate-800 dark:text-slate-300"
                    >
                      {point}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}

const InspectionForm: React.FC<{ inspectionId?: string; onSave: () => void; onCancel: () => void }> = ({
  inspectionId,
  onSave,
  onCancel,
}) => {
  const { getInspectionById, saveInspection, inspections, loading } = useInspections()
  const [inspection, setInspection] = useState<InspectionData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (inspectionId) {
      // Wait for inspections to load before trying to get the specific one
      if (!loading) {
        const foundInspection = getInspectionById(inspectionId)
        if (foundInspection) {
          setInspection(foundInspection)
          setNotFound(false)
        } else {
          // Inspection not found
          console.error(`Inspection with ID ${inspectionId} not found`)
          setNotFound(true)
        }
      }
    } else {
      const today = new Date()
      const localTodayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

      setInspection({
        id: `insp_${Date.now()}`,
        clientName: "",
        propertyLocation: "",
        propertyType: "Apartment",
        inspectorName: "",
        inspectionDate: localTodayString,
        areas: [{ id: Date.now(), name: "General", items: [] }],
      })
    }
  }, [inspectionId, loading, inspections])

  const handleUpdateField = (field: keyof InspectionData, value: any) => {
    if (inspection) {
      setInspection({ ...inspection, [field]: value })
    }
  }

  const handleAddArea = () => {
    if (inspection) {
      const newArea: InspectionArea = { id: Date.now(), name: `New Area ${inspection.areas.length + 1}`, items: [] }
      handleUpdateField("areas", [...inspection.areas, newArea])
    }
  }

  const handleUpdateArea = (updatedArea: InspectionArea) => {
    if (inspection) {
      const newAreas = inspection.areas.map((area) => (area.id === updatedArea.id ? updatedArea : area))
      handleUpdateField("areas", newAreas)
    }
  }

  const handleRemoveArea = (areaId: number) => {
    if (inspection) {
      const newAreas = inspection.areas.filter((area) => area.id !== areaId)
      handleUpdateField("areas", newAreas)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inspection && !isSaving) {
      setIsSaving(true)
      try {
        const savedId = await saveInspection(inspection)
        // If saveInspection returns successfully, the save worked
        if (savedId) {
          console.log("Inspection saved successfully with ID:", savedId)
          onSave()
          return // Exit early on success
        }
      } catch (error: any) {
        console.error("Error saving inspection:", error)
        // Only show error if it's a real error, not a constraint check warning
        if (!error?.message?.includes("duplicate key") &&
            !error?.message?.includes("already exists")) {
          const errorMessage = error?.message || "Failed to save inspection. Please try again."
          alert(errorMessage)
        } else {
          // If it's a duplicate key error, the save actually worked
          console.log("Inspection saved (duplicate key warning ignored)")
          onSave()
        }
      } finally {
        setIsSaving(false)
      }
    }
  }

  // Show loading spinner while data is loading
  if (loading && inspectionId) {
    return (
      <div className="text-center p-8">
        <Spinner className="text-blue-600 dark:text-blue-400 mx-auto" />
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
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Don't show anything if inspection is still null (shouldn't happen)
  if (!inspection) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">Inspection Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Client Name"
            value={inspection.clientName}
            onChange={(e) => handleUpdateField("clientName", e.target.value)}
            required
            className={inputClasses}
          />
          <input
            type="text"
            placeholder="Property Location"
            value={inspection.propertyLocation}
            onChange={(e) => handleUpdateField("propertyLocation", e.target.value)}
            required
            className={inputClasses}
          />
          <input
            type="text"
            placeholder="Inspector Name"
            value={inspection.inspectorName}
            onChange={(e) => handleUpdateField("inspectorName", e.target.value)}
            required
            className={inputClasses}
          />
          <input
            type="date"
            value={inspection.inspectionDate}
            onChange={(e) => handleUpdateField("inspectionDate", e.target.value)}
            required
            className={inputClasses}
          />
          <div>
            <select
              value={inspection.propertyType}
              onChange={(e) => handleUpdateField("propertyType", e.target.value)}
              required
              className={`${inputClasses} w-full`}
            >
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Building">Building</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        {inspection.areas.map((area) => (
          <InspectionAreaCard
            key={area.id}
            area={area}
            onUpdate={handleUpdateArea}
            onRemove={() => handleRemoveArea(area.id)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={handleAddArea} className={buttonClasses.secondary}>
          Add Another Area
        </button>
        <div className="flex gap-4">
          <button type="button" onClick={onCancel} className={buttonClasses.secondary}>
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className={buttonClasses.primary}>
            {isSaving ? (
              <>
                <Spinner className="text-white mr-2" />
                Saving...
              </>
            ) : (
              "Save Inspection"
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

const ReportTemplate: React.FC<{ inspection: InspectionData }> = ({ inspection }) => {
  // This component is now only used for the hidden print view.
  // PDF generation is handled programmatically by WaslaReportGenerator.
  const Watermark = () => (
    <div className="absolute inset-0 flex items-center justify-center -z-10" aria-hidden="true">
      <div className="text-gray-200/60 dark:text-gray-700/40 opacity-50 select-none transform -rotate-45 scale-150">
        <WaslaLogo />
      </div>
    </div>
  )

  return (
    <div className="print:block hidden">
      {/* Page 1 */}
      <div className="printable-a4 bg-white dark:bg-gray-800 p-8 text-sm break-after-page relative">
        <Watermark />
        <header className="flex justify-center items-center flex-col mb-8">
          <WaslaLogo />
        </header>

        <div className="flex space-x-8">
          {/* English Column */}
          <div className="w-1/2 space-y-3 text-justify">
            <h2 className="font-bold text-base text-center uppercase">OVERVIEW</h2>
            <p>
              <span className="font-bold">Dear Mr. {inspection.clientName},</span>
            </p>
            <p>
              Thank you for choosing Wasla Real Estate Solutions to carry out the inspection of your property. This
              report presents the inspection findings and measurements as documented on site on the date of the visit,
              and the presence of certain observations is common in property inspections.
            </p>
            <p>
              Please review the attached report carefully before making your final decision. If you require any further
              clarification regarding the condition of the property, please feel free to contact us by phone or email
              between 9:00 a.m. and 5:00 p.m.
            </p>
            <p className="text-left dir-ltr">Email: info@waslaoman.com</p>
            <p className="text-left dir-ltr">Mobile: +968 90699799</p>

            <section className="pt-2">
              <h3 className="font-bold">No property is perfect.</h3>
              <p>
                Every building has imperfections or items that are ready for maintenance. It's the inspector's task to
                discover and report these so you can make informed decisions. This report should not be used as a tool
                to demean property, but rather as a way to illuminate the realities of the property.
              </p>
            </section>

            <section className="pt-2">
              <h3 className="font-bold">This report is not an appraisal.</h3>
              <p>
                When an appraiser determines worth, only the most obvious conditions of a property are taken into
                account to establish a safe loan amount. In effect, the appraiser is representing the interests of the
                lender. Home inspectors focus more on the interests of the prospective buyer; and, although inspectors
                must be careful not to make any statements relating to property value, their findings can help buyers
                more completely understand the true costs of ownership.
              </p>
            </section>
          </div>

          {/* Arabic Column */}
          <div className="w-1/2 space-y-3 text-right" dir="rtl">
            <h2 className="font-bold text-base text-center">نظرة عامة</h2>
            <p>
              <span className="font-bold">الأفاضل/ {inspection.clientName} المحترمون،</span>
            </p>
            <p>
              نشكر لكم اختياركم "وصلة للحلول العقارية" للقيام بفحص العقار الخاص بكم. يُقدم هذا التقرير نتائج الفحص
              والقياسات كما تم توثيقها ميدانيًا في تاريخ الزيارة، ووجود بعض الملاحظات يُعد أمر شائع في عمليات الفحص
              العقاري.
            </p>
            <p>
              يرجى مراجعة التقرير المرفق بعناية قبل اتخاذ قراركم النهائي، و إذا كنتم بحاجة إلى توضيحات إضافية حول حالة
              العقار، فلا تترددوا بالتواصل معنا عبر الهاتف أو البريد الإلكتروني من الساعة 9 صباحًا حتى 5 مساءً على وسائل
              التواصل التالية:
            </p>
            <p>البريد الإلكتروني: info@waslaoman.com</p>
            <p>الهاتف: +968 90699799</p>

            <section className="pt-2">
              <h3 className="font-bold">لا يوجد عقار مثالي</h3>
              <p>
                كل عقار يحتوي على بعض العيوب أو الأجزاء التي تحتاج إلى صيانة. دور المفتش هو تحديد هذه النقاط وتقديمها
                بوضوح لمساعدتكم في اتخاذ قرارات مستنيرة. هذا التقرير لا يُقصد به التقليل من قيمة العقار، وإنما يهدف إلى
                توضيح الحالة الواقعية له.
              </p>
            </section>

            <section className="pt-2">
              <h3 className="font-bold">هذا التقرير ليس تقييمًا سعريًا</h3>
              <p>
                عند قيام المثمن بتحديد قيمة العقار، فإنه يأخذ بعين الاعتبار فقط العيوب الظاهرة لتقدير مبلغ قرض آمن.
                بمعنى آخر، فإن المثمن يُمثل مصلحة الجهة المُقرضة. أما فاحص العقار، فيركز على مصلحة المشتري المحتمل. ورغم
                أن المفتش لا يحدد قيمة العقار، إلا أن نتائج الفحص تساعد المشتري في فهم التكاليف الحقيقية لامتلاك العقار.
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Page 2 */}
      <div className="printable-a4 bg-white dark:bg-gray-800 p-8 text-sm break-after-page relative">
        <Watermark />
        <div className="flex space-x-8">
          {/* English Column */}
          <div className="w-1/2 space-y-3 text-justify">
            <section className="pt-2">
              <h3 className="font-bold">Maintenance costs are normal.</h3>
              <p>
                Homeowners should plan to spend around 1% of the total value of a property in maintenance costs,
                annually. (Annual costs of rental property maintenance are often 2%, or more.) If considerably less than
                this percentage has been invested during several years preceding an inspection, the property will
                usually show the obvious signs of neglect; and the new property owners may be required to invest
                significant time and money to address accumulated maintenance needs.
              </p>
            </section>

            <section className="pt-2">
              <h3 className="font-bold">SCOPE OF THE INSPECTION:</h3>
              <p>
                This report details the outcome of a visual survey of the property detailed in the annexed inspection
                checklist in order to check the quality of workmanship against applicable standards. It covers both the
                interior and the exterior of the property as well as garden, driveway and garage if relevant. Areas not
                inspected, for whatever reason, cannot guarantee that these areas are free from defects.
              </p>
              <p>
                This report was formed as per the client request as a supportive opinion to enable him to have better
                understanding about property conditions. Our opinion does not study the property value or the
                engineering of the structure rather it studies the functionality of the property. This report will be
                listing the property defects supported by images and videos, by showing full study of the standards of
                property status and functionality including other relevant elements of the property as stated in the
                checklist.
              </p>
            </section>

            <section className="pt-2">
              <h3 className="font-bold">CONFIDENTIALITY OF THE REPORT:</h3>
              <p>
                The inspection report is to be prepared for the Client for the purpose of informing of the major
                deficiencies in the condition of the subject property and is solely and exclusively for Client's own
                information and may not be relied upon by any other person. Client may distribute copies of the
                inspection report to the seller and the real estate agents directly involved in this transaction, but
                Client and Inspector do not in any way intend to benefit said seller or the real estate agents directly
                or indirectly through this Agreement or the inspection report. In the event that the inspection report
                has been prepared for the SELLER of the subject property, an authorized representative of Wasla Real
                Estate Solutions will return to the property, for a fee, to meet with the BUYER for a consultation to
                provide a better understanding of the reported conditions and answer.
              </p>
            </section>
          </div>

          {/* Arabic Column */}
          <div className="w-1/2 space-y-3 text-right" dir="rtl">
            <section className="pt-2">
              <h3 className="font-bold">تكاليف الصيانة أمر طبيعي</h3>
              <p>
                ينبغي على مالكي العقارات تخصيص ما يُعادل 1% من قيمة العقار سنويًا لأعمال الصيانة الدورية. أما العقارات
                المؤجرة فقد تصل النسبة إلى 2% أو أكثر. وإذا لم يتم استثمار هذه النسبة على مدى عدة سنوات، فستظهر مؤشرات
                واضحة على الإهمال، مما يُحتم على المالك الجديد دفع تكاليف كبيرة لاحقًا لمعالجة هذه الإهمالات.
              </p>
            </section>
            <section className="pt-2">
              <h3 className="font-bold">نطاق الفحص</h3>
              <p>
                يوضح هذا التقرير نتيجة الفحص البصري للعقار كما هو مفصل في قائمة الفحص المرفقة، بهدف تقييم جودة التنفيذ
                مقارنة بالمعايير المعتمدة. يشمل الفحص المناطق الداخلية والخارجية، بالإضافة إلى الحديقة، والممر، والجراج
                ( إن وُجد). كما لا يمكن ضمان خلو المناطق غير المفحوصة من العيوب لأي سببٍ كان.
              </p>
              <p>
                وقد تم إعداد هذا التقرير بناءً على طلب العميل لتقديم رأي داعم يساعده على فهم حالة العقار بشكل أفضل. رأينا
                الفني لا يشمل تقييم القيمة السوقية أو التحليل الإنشائي، بل يركز على حالة العقار ووظائفه العامة. كما سيتم
                سرد العيوب المرصودة بناءً على دراسة كاملة لمعايير الحالة والأداء الوظيفي للعقار مشمولة بالصور
                والفيديوهات، إلى جانب العناصر الأخرى ذات الصلة كما هو موضح في قائمة الفحص.
              </p>
            </section>
            <section className="pt-2">
              <h3 className="font-bold">سرية التقرية</h3>
              <p>
                تم إعداد تقرير الفحص هذا خصيصًا للعميل بغرض إعلامه بالنواقص الجوهرية في حالة العقار محل الفحص، وهو
                للاستخدام الشخصي فقط ولا يجوز الاعتماد عليه من قبل أي طرف آخر. يجوز للعميل مشاركة نسخة من التقرير مع
                البائع أو وكلاء العقارات المعنيين بهذه الصفقة، إلا أن كل من العميل والفاحص لا يقصدان من خلال هذا التقرير
                تحقيق أي منفعة مباشرة أو غير مباشرة لهؤلاء الأطراف. وفي حال تم إعداد هذا التقرير بطلب من البائع، فإن
                ممثلًا معتمدًا من شركة وصلة لحلول العقار سيعود إلى العقار – مقابل رسوم – لعقد جلسة استشارية مع المشتري
                بهدف توضيح الملاحظات الواردة في التقرير والإجابة عن استفساراته.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

const InspectionReport: React.FC<{ inspectionId: string; onBack: () => void; onEdit: (id: string) => void }> = ({
  inspectionId,
  onBack,
  onEdit,
}) => {
  const { getInspectionById } = useInspections()
  const [inspection, setInspection] = useState<InspectionData | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    setInspection(getInspectionById(inspectionId))
  }, [inspectionId, getInspectionById])

  const handleExportPDF = async () => {
    if (!inspection) return

    setIsExporting(true)
    try {
      // Try HTML-based report first for better formatting and print support
      const { generateInspectionReport } = await import('@/lib/pdf/html-report-generator')
      await generateInspectionReport(inspection, { autoPrint: false })
      console.log('HTML Inspection Report with complete disclaimer generated successfully')
    } catch (error) {
      console.error('Error generating HTML report:', error)
      // Fallback to PDF generator
      try {
        const { generateWaslaFinalReport } = await import('@/lib/pdf/wasla-report-final')
        await generateWaslaFinalReport(inspection)
        console.log('Wasla PDF Report exported successfully (fallback)')
      } catch (fallbackError) {
        console.error('Fallback PDF also failed:', fallbackError)
        alert('Failed to generate report. Please check the console for details.')
      }
    } finally {
      setIsExporting(false)
    }
  }

  if (!inspection) return <div className="text-center p-8 text-slate-600 dark:text-slate-400">Report not found.</div>

  const statusColors: { [key in InspectionStatus]: string } = {
    Pass: "text-green-600 dark:text-green-400",
    Fail: "text-red-600 dark:text-red-400",
    "N/A": "text-slate-500 dark:text-slate-400",
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button onClick={onBack} className={buttonClasses.secondary}>
          &larr; Back to Inspections
        </button>
        <div className="flex gap-2">
          <button onClick={() => onEdit(inspectionId)} className={buttonClasses.secondary}>
            Edit
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`${buttonClasses.primary} flex items-center gap-2 bg-orange-500 hover:bg-orange-600`}
          >
            {isExporting ? (
              <>
                <Spinner /> Exporting...
              </>
            ) : (
              "Export to PDF"
            )}
          </button>
        </div>
      </div>

      <div id="full-report-container">
        <ReportTemplate inspection={inspection} />
        <div
          id="report-content"
          className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border dark:border-slate-700 printable-a4"
        >
          <header className="flex justify-between items-start border-b-2 border-blue-500 pb-4 mb-8">
            <div>
              <WaslaLogo />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Inspection Report</h1>
              <p className="text-md text-slate-600 dark:text-slate-300">{inspection.propertyLocation}</p>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
            <div className="flex justify-between">
              <strong className="text-slate-600 dark:text-slate-400">Client:</strong>{" "}
              <span className="text-slate-800 dark:text-slate-200">{inspection.clientName}</span>
            </div>
            <div className="flex justify-between">
              <strong className="text-slate-600 dark:text-slate-400">Inspector:</strong>{" "}
              <span className="text-slate-800 dark:text-slate-200">{inspection.inspectorName}</span>
            </div>
            <div className="flex justify-between">
              <strong className="text-slate-600 dark:text-slate-400">Date:</strong>{" "}
              <span className="text-slate-800 dark:text-slate-200">{formatDate(inspection.inspectionDate)}</span>
            </div>
            <div className="flex justify-between">
              <strong className="text-slate-600 dark:text-slate-400">Property Type:</strong>{" "}
              <span className="text-slate-800 dark:text-slate-200">{inspection.propertyType}</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 border-b-2 border-blue-200 dark:border-blue-800 pb-2">
                Executive Summary
              </h2>
            </div>
            {inspection.aiSummary ? (
              <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {inspection.aiSummary}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic">No summary was generated for this report.</p>
            )}
          </div>

          {inspection.areas.map((area) => (
            <div key={area.id} className="mb-8 break-inside-avoid">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 pb-2 mb-4 border-b-2 border-blue-500">
                {area.name}
              </h3>
              <div className="space-y-4">
                {area.items.length > 0 ? (
                  area.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-white dark:bg-slate-700/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 break-inside-avoid-page"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-slate-900 dark:text-slate-200">{item.point}</p>
                        <span className={`font-bold text-lg ${statusColors[item.status]}`}>{item.status}</span>
                      </div>
                      {item.location && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          <strong>Location:</strong> {item.location}
                        </p>
                      )}
                      {item.comments && (
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">
                          <strong>Comments:</strong> {item.comments}
                        </p>
                      )}
                      {item.photos.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                          {item.photos.filter(photo => photo.base64).map((photo, index) => (
                            <img
                              key={index}
                              src={photo.base64.startsWith('data:') ? photo.base64 : `data:image/jpeg;base64,${photo.base64}`}
                              alt={`${item.point} photo ${index + 1}`}
                              className="rounded-lg shadow-sm w-full object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-slate-500 dark:text-slate-400">No items inspected in this area.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body { -webkit-print-color-adjust: exact; color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    html, body {
                        background-color: #fff !important;
                        color: #000 !important;
                    }
                    .dark * {
                        color: #000 !important;
                        background-color: transparent !important;
                        border-color: #ccc !important;
                    }
                    .break-inside-avoid-page { page-break-inside: avoid; }
                }
                .printable-a4 {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    margin: 1rem auto;
                    box-sizing: border-box;
                    position: relative;
                    z-index: 0;
                }
            `}</style>
    </div>
  )
}

const InspectionsDashboard: React.FC<{
  onView: (id: string) => void
  onEdit: (id: string) => void
  onCreate: () => void
}> = ({ onView, onEdit, onCreate }) => {
  const { inspections, deleteInspection, loading } = useInspections()
  const [filter, setFilter] = useState<string>("All")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteRequest = (id: string) => {
    setDeletingId(id)
  }

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        await deleteInspection(deletingId)
        setDeletingId(null)
      } catch (error) {
        console.error("Error deleting inspection:", error)
        alert("Failed to delete inspection. Please try again.")
      }
    }
  }

  const filteredInspections = inspections.filter((insp: InspectionData) => filter === "All" || insp.propertyType === filter)

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center p-12">
        <Spinner className="text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading inspections...</span>
      </div>
    )
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex-grow">
            <label htmlFor="propertyTypeFilter" className="sr-only">
              Filter by property type
            </label>
            <select
              id="propertyTypeFilter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={inputClasses}
            >
              <option value="All">All Property Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Building">Building</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <button onClick={onCreate} className={`${buttonClasses.primary} w-full sm:w-auto`}>
          New Inspection
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        {filteredInspections.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-slate-700">
            {filteredInspections.map((insp: InspectionData) => (
              <li
                key={insp.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-all duration-200"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-slate-50 mb-1.5">{insp.propertyLocation}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm text-gray-600 dark:text-slate-300 font-medium">{insp.clientName}</p>
                    <span className="text-gray-300 dark:text-slate-600">•</span>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {formatDate(insp.inspectionDate)}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                      {insp.propertyType}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto self-end md:self-center flex-shrink-0">
                  <button onClick={() => onView(insp.id)} className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">
                    View Report
                  </button>
                  <button
                    onClick={() => onEdit(insp.id)}
                    className="px-3 sm:px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(insp.id)}
                    className="px-3 sm:px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center p-12 text-slate-500 dark:text-slate-400">
            <h3 className="text-xl font-semibold">No inspections found.</h3>
            <p>
              {filter === "All"
                ? 'Click "New Inspection" to get started.'
                : `No inspections match the filter "${filter}".`}
            </p>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Delete Inspection"
        message="Are you sure you want to delete this inspection? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  )
}

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center p-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700">
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p>This section is under construction. Check back soon!</p>
    </div>
  </div>
)

// --- New Dashboard Components ---
type TrendDirection = "up" | "down" | "steady"

const MetricCard: React.FC<{
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  accent: string
  trend: {
    direction: TrendDirection
    label: string
  }
}> = ({ title, value, subtitle, icon: Icon, accent, trend }) => {
  const TrendIcon =
    trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : Minus
  const trendColor =
    trend.direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend.direction === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-slate-500 dark:text-slate-400"

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-slate-50">{value}</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className={`inline-flex items-center gap-1 font-medium ${trendColor}`}>
              <TrendIcon className="size-4" aria-hidden="true" />
              {trend.label}
            </span>
            <span className="text-gray-500 dark:text-slate-400">{subtitle}</span>
          </div>
        </div>
        <div className={`rounded-lg p-3 ${accent}`}>
          <Icon className="size-6" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

const buildTrend = (current: number, previous: number): { direction: TrendDirection; label: string } => {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return { direction: "steady", label: "0%" }
  }

  if (previous === 0) {
    if (current === 0) {
      return { direction: "steady", label: "0%" }
    }

    return { direction: current > 0 ? "up" : "down", label: `${current > 0 ? "+" : "-"}100%` }
  }

  const raw = ((current - previous) / Math.abs(previous)) * 100
  const rounded = Math.round(raw * 10) / 10

  if (rounded === 0) {
    return { direction: "steady", label: "0%" }
  }

  const label = `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}%`
  return { direction: rounded > 0 ? "up" : "down", label }
}

const DashboardOverview: React.FC = () => {
  const { inspections } = useInspections()
  const { clients } = useClients()
  const { invoices } = useInvoices()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const isWithinRange = (dateString: string, start: Date, end?: Date) => {
    const parsed = new Date(dateString)
    if (Number.isNaN(parsed.getTime())) {
      return false
    }
    return parsed >= start && (!end || parsed < end)
  }

  const inspectionsThisMonth = inspections.filter((inspection) =>
    isWithinRange(inspection.inspectionDate, startOfMonth, endOfMonth),
  )
  const inspectionsPrevMonth = inspections.filter((inspection) =>
    isWithinRange(inspection.inspectionDate, startOfPrevMonth, startOfMonth),
  )

  const activeClientsThisMonth = new Set(
    inspectionsThisMonth.map((inspection) => inspection.clientName),
  ).size
  const activeClientsPrevMonth = new Set(
    inspectionsPrevMonth.map((inspection) => inspection.clientName),
  ).size

  const revenueThisMonth = invoices
    .filter((invoice) => isWithinRange(invoice.invoiceDate, startOfMonth, endOfMonth))
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0)

  const revenuePrevMonth = invoices
    .filter((invoice) => isWithinRange(invoice.invoiceDate, startOfPrevMonth, startOfMonth))
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0)

  const outstandingBalance = invoices
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + Math.max(invoice.totalAmount - invoice.amountPaid, 0), 0)

  const outstandingPrevBalance = invoices
    .filter(
      (invoice) =>
        invoice.status !== "Paid" &&
        isWithinRange(invoice.invoiceDate, startOfPrevMonth, startOfMonth),
    )
    .reduce((sum, invoice) => sum + Math.max(invoice.totalAmount - invoice.amountPaid, 0), 0)

  const collectStatuses = (list: InspectionData[]) =>
    list.reduce(
      (acc, inspection) => {
        inspection.areas.forEach((area) => {
          area.items.forEach((item) => {
            if (item.status === "Pass" || item.status === "Fail" || item.status === "N/A") {
              acc[item.status] += 1
            }
          })
        })
        return acc
      },
      { Pass: 0, Fail: 0, "N/A": 0 } as Record<InspectionStatus, number>,
    )

  const statusCountsThisMonth = collectStatuses(inspectionsThisMonth)
  const statusCountsPrevMonth = collectStatuses(inspectionsPrevMonth)
  const statusCountsOverall = collectStatuses(inspections)

  const evaluatedThisMonth = statusCountsThisMonth.Pass + statusCountsThisMonth.Fail
  const evaluatedPrevMonth = statusCountsPrevMonth.Pass + statusCountsPrevMonth.Fail

  const passRateCurrent =
    evaluatedThisMonth > 0 ? (statusCountsThisMonth.Pass / evaluatedThisMonth) * 100 : 0
  const passRatePrev =
    evaluatedPrevMonth > 0 ? (statusCountsPrevMonth.Pass / evaluatedPrevMonth) * 100 : 0

  const inspectionsTrend = buildTrend(inspectionsThisMonth.length, inspectionsPrevMonth.length)
  const clientsTrend = buildTrend(activeClientsThisMonth, activeClientsPrevMonth)
  const revenueTrend = buildTrend(revenueThisMonth, revenuePrevMonth)
  const outstandingTrend = buildTrend(outstandingBalance, outstandingPrevBalance)
  const passRateTrend = buildTrend(passRateCurrent, passRatePrev)

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]

  const monthlyPerformance: { month: string; inspections: number; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    const monthLabel = monthNames[monthStart.getMonth()]
    const monthInspections = inspections.filter((inspection) =>
      isWithinRange(inspection.inspectionDate, monthStart, monthEnd),
    ).length
    const monthRevenue = invoices
      .filter((invoice) => isWithinRange(invoice.invoiceDate, monthStart, monthEnd))
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0)

    monthlyPerformance.push({
      month: monthLabel,
      inspections: monthInspections,
      revenue: monthRevenue,
    })
  }

  const statusDefinitions = [
    { key: "pass", label: "Pass", value: statusCountsOverall.Pass, color: "hsl(142, 70%, 45%)" },
    { key: "fail", label: "Fail", value: statusCountsOverall.Fail, color: "hsl(0, 84%, 60%)" },
    { key: "na", label: "N/A", value: statusCountsOverall["N/A"], color: "hsl(215, 20%, 65%)" },
  ] as const

  const statusChartConfig = statusDefinitions.reduce(
    (acc, item) => {
      acc[item.key] = { label: item.label, color: item.color }
      return acc
    },
    {} as Record<(typeof statusDefinitions)[number]["key"], { label: string; color: string }>,
  )

  const statusPieData = statusDefinitions.map((item) => ({
    key: item.key,
    label: item.label,
    value: item.value,
  }))

  const totalFindings = statusDefinitions.reduce((sum, item) => sum + item.value, 0)
  const passRateOverall =
    totalFindings > 0 ? Math.round((statusCountsOverall.Pass / totalFindings) * 100) : 0

  const performanceChartConfig = {
    inspections: { label: "Inspections", color: "hsl(221, 83%, 53%)" },
    revenue: { label: "Revenue (OMR)", color: "hsl(161, 73%, 46%)" },
  } as const

  const summarizeInspection = (inspection: InspectionData) =>
    inspection.areas.reduce(
      (acc, area) => {
        area.items.forEach((item) => {
          if (item.status === "Pass") {
            acc.pass += 1
          } else if (item.status === "Fail") {
            acc.fail += 1
          } else {
            acc.na += 1
          }
        })
        return acc
      },
      { pass: 0, fail: 0, na: 0 },
    )

  const recentInspections = inspections.slice(0, 5)

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-0">
      <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Inspections"
          value={inspectionsThisMonth.length.toString()}
          subtitle="vs last month"
          icon={ClipboardCheck}
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-300"
          trend={inspectionsTrend}
        />
        <MetricCard
          title="Active clients"
          value={activeClientsThisMonth.toString()}
          subtitle={`vs last month � ${clients.length} total`}
          icon={Users}
          accent="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
          trend={clientsTrend}
        />
        <MetricCard
          title="Revenue (this month)"
          value={formatCurrency(revenueThisMonth)}
          subtitle="vs last month"
          icon={CircleDollarSign}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
          trend={revenueTrend}
        />
        <MetricCard
          title="Outstanding balance"
          value={formatCurrency(outstandingBalance)}
          subtitle="vs last month"
          icon={Wallet}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-300"
          trend={outstandingTrend}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Monthly Performance</h3>
            <span className="text-xs text-gray-500 dark:text-slate-400">Last 6 months</span>
          </div>
          <ChartContainer config={performanceChartConfig} className="mt-4 sm:mt-8 h-64 sm:h-[320px] w-full overflow-x-auto">
            <ComposedChart data={monthlyPerformance}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillInspections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-inspections)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-inspections)" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis yAxisId="inspections" tickLine={false} axisLine={false} allowDecimals={false} className="text-xs" />
              <YAxis
                yAxisId="revenue"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCompactNumber(value)}
                className="text-xs"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="rounded-lg border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95"
                    formatter={(value, name) => {
                      if (name === "revenue") {
                        return [formatCurrency(Number(value)), "Revenue"]
                      }
                      return [String(value), "Inspections"]
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                yAxisId="inspections"
                dataKey="inspections"
                radius={[10, 10, 0, 0]}
                fill="url(#fillInspections)"
                barSize={28}
              />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={3}
                fill="url(#fillRevenue)"
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-50">Inspection Quality</h3>
            <span className="text-xs text-gray-500 dark:text-slate-400">All inspections</span>
          </div>
          <div className="relative mt-4 sm:mt-8 h-64 sm:h-[320px]">
            <ChartContainer config={statusChartConfig} className="h-full w-full overflow-visible">
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={75}
                  outerRadius={115}
                  strokeWidth={0}
                  paddingAngle={2}
                >
                  {statusPieData.map((item) => (
                    <Cell key={item.key} fill={statusChartConfig[item.key].color} className="transition-all hover:opacity-80" />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="rounded-lg border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95"
                      labelKey="label"
                      formatter={(value) => [String(value), "Findings"]}
                    />
                  }
                />
                <ChartLegend verticalAlign="bottom" content={<ChartLegendContent nameKey="key" />} />
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pass Rate</span>
              <span className="mt-1 bg-gradient-to-br from-emerald-600 to-blue-600 bg-clip-text text-4xl font-bold text-transparent dark:from-emerald-400 dark:to-blue-400">
                {passRateOverall}%
              </span>
              <span className="text-xs text-slate-400">{totalFindings} total checks</span>
              <span
                className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                  passRateTrend.direction === "up"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : passRateTrend.direction === "down"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {passRateTrend.direction === "up" ? (
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                ) : passRateTrend.direction === "down" ? (
                  <ArrowDownRight className="size-3.5" aria-hidden="true" />
                ) : (
                  <Minus className="size-3.5" aria-hidden="true" />
                )}
                {passRateTrend.label} vs last month
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-50">Recent Inspections</h3>
          <span className="text-xs text-gray-500 dark:text-slate-400">Most recent {recentInspections.length} records</span>
        </div>
        {recentInspections.length > 0 ? (
          <div className="space-y-3">
            {recentInspections.map((inspection) => {
              const summary = summarizeInspection(inspection)
              const total = summary.pass + summary.fail + summary.na
              const passShare = total > 0 ? Math.round((summary.pass / total) * 100) : 0

              return (
                <div
                  key={inspection.id}
                  className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-gray-200 dark:border-slate-700 dark:bg-slate-900/50 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-base font-medium text-slate-900 dark:text-slate-50">
                      {inspection.propertyLocation}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {inspection.clientName} � {formatDate(inspection.inspectionDate)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <span className="inline-block size-2 rounded-full bg-emerald-500" />
                        {summary.pass} pass
                      </span>
                      <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-400">
                        <span className="inline-block size-2 rounded-full bg-rose-500" />
                        {summary.fail} fail
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block size-2 rounded-full bg-slate-400" />
                        {summary.na} n/a
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                      {passShare}% pass
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {total} checkpoints
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200/70 bg-white/60 p-10 text-center dark:border-slate-700/60 dark:bg-slate-900/40">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No inspections recorded yet. Create your first inspection to see live analytics here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main App Component ---
const App: React.FC = () => {
  const { getSettings, saveSettings } = useAppSettings()
  const [settings, setSettings] = useState<AppSettings>(getSettings())
  const [currentView, setCurrentView] = useState<string>("dashboard")
  const [currentInspectionId, setCurrentInspectionId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { user, loading } = useAuth()
  const { inspections } = useInspections()
  // Lazy import to avoid ssr import issues in non-next environments
  // Default to false to avoid premature redirects before config check completes
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(false)

  useEffect(() => {
    // Load theme from localStorage BEFORE mounting to prevent flicker
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const storedSettings = getSettings()
      setSettings(storedSettings)
      // Apply theme immediately to prevent flicker
      if (storedSettings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    // Dynamically check configuration at runtime
    import("@/lib/supabase/client").then(m => {
      try {
        // if function exists use it, default to true to avoid blocking
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ok = (m as any).isSupabaseConfigured ? (m as any).isSupabaseConfigured() : true
        setSupabaseConfigured(!!ok)
      } catch {
        setSupabaseConfigured(true)
      }
    }).catch(() => setSupabaseConfigured(true))
  }, [])

  useEffect(() => {
    if (mounted) {
      // Update theme using classList for better control
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [settings.theme, mounted])

  // In environments without Supabase configuration, skip auth gating and open the form directly for QA.
  useEffect(() => {
    if (!supabaseConfigured) {
      setCurrentView("form")
    }
  }, [supabaseConfigured])

  const handleSettingsUpdate = (newSettings: AppSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
    document.documentElement.className = newSettings.theme
  }

  // Show loading state while checking authentication (only when Supabase is configured)
  if (loading && supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login only when Supabase is configured.
  // In local/dev without .env, allow full access so we can QA features.
  if (!user && supabaseConfigured) {
    if (typeof window !== "undefined" && window.location.pathname !== '/auth/login') {
      window.location.href = '/auth/login'
    }
    // If we're already on the login route, let Next render it
    if (typeof window !== "undefined" && window.location.pathname === '/auth/login') {
      return null
    }
    return null
  }

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardOverview />
      case "inspections":
        return (
          <InspectionsDashboard
            onView={(id) => {
              setCurrentInspectionId(id)
              setCurrentView("report")
            }}
            onEdit={(id) => {
              setCurrentInspectionId(id)
              setCurrentView("form")
            }}
            onCreate={() => {
              setCurrentInspectionId(null)
              setCurrentView("form")
            }}
          />
        )
      case "form":
        return (
          <EnhancedInspectionForm
            inspectionId={currentInspectionId || undefined}
            onSave={() => setCurrentView("inspections")}
            onCancel={() => setCurrentView("inspections")}
          />
        )
      case "report":
        return currentInspectionId ? (
          <InspectionReport
            inspectionId={currentInspectionId}
            onBack={() => setCurrentView("inspections")}
            onEdit={(id) => {
              setCurrentInspectionId(id)
              setCurrentView("form")
            }}
          />
        ) : (
          <div>Report not found</div>
        )
      case "clients":
        return <ClientSection />
      case "properties":
        return <PropertiesSection />
      case "invoices":
        return <InvoiceSection />
      case "settings":
        return <SettingsSection settings={settings} onSettingsUpdate={handleSettingsUpdate} />
      default:
        return <DashboardOverview />
    }
  }

  type NavigationItem = {
    id: string
    label: string
    description?: string
    icon: LucideIcon
  }

  const navigationItems: NavigationItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Performance overview",
      icon: LayoutDashboard,
    },
    {
      id: "inspections",
      label: "Inspections",
      description: "Manage site visits",
      icon: ClipboardCheck,
    },
    {
      id: "clients",
      label: "Clients",
      description: "Relationship manager",
      icon: Users,
    },
    {
      id: "properties",
      label: "Properties",
      description: "Portfolio tracker",
      icon: Building2,
    },
    {
      id: "invoices",
      label: "Invoices",
      description: "Billing and payments",
      icon: FileText,
    },
    {
      id: "settings",
      label: "Settings",
      description: "Team preferences",
      icon: Settings2,
    },
    {
      id: "form",
      label: currentInspectionId ? "Edit Inspection" : "New Inspection",
      description: currentInspectionId ? "Update inspection details" : "Create a new property inspection",
      icon: ClipboardCheck,
    },
    {
      id: "report",
      label: "Inspection Report",
      description: "View detailed report",
      icon: FileText,
    },
  ]

  const activeNav = navigationItems.find((item) => item.id === currentView) ?? navigationItems[0]
  const headerSubtitle = activeNav.description ?? "Workspace"

  const getNameInitials = (value: string) =>
    value
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2)

  const userDisplayName = user?.email?.split("@")[0] || settings.profile.name
  const userInitials = user?.email?.charAt(0).toUpperCase() || getNameInitials(settings.profile.name)
  const scheduledInspections = inspections.filter((inspection) => inspection.status === "Scheduled").length

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
        <Sidebar collapsible="icon" className="border-r border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <SidebarHeader className="border-b border-gray-200 px-4 pb-4 pt-5 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500 p-2">
                <WaslaLogo />
              </div>
              <div className="flex-1 space-y-0.5 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-50">Property Inspector</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Professional</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-4">
            <SidebarMenu className="gap-0.5">
              {navigationItems.slice(0, 6).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setCurrentView(item.id)}
                    isActive={currentView === item.id}
                    tooltip={item.label}
                    className={cn(
                      "group relative items-center justify-start rounded-lg px-3 py-2 transition-colors",
                      currentView === item.id
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    <item.icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className="ml-3 font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-gray-200 p-4 dark:border-slate-700">
            <div className="group-data-[collapsible=icon]:hidden">
              <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border border-blue-100 dark:border-blue-800/30">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Scheduled Inspections</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{scheduledInspections}</p>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Awaiting site visits
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
              <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="md:hidden" />
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-50">{activeNav.label}</h1>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg"
                    onClick={() =>
                      handleSettingsUpdate({
                        ...settings,
                        theme: settings.theme === "dark" ? "light" : "dark",
                      })
                    }
                    aria-label="Toggle theme"
                  >
                    {mounted ? (
                      settings.theme === "dark" ? (
                        <Sun className="size-5" aria-hidden="true" />
                      ) : (
                        <Moon className="size-5" aria-hidden="true" />
                      )
                    ) : (
                      <Sun className="size-5" aria-hidden="true" />
                    )}
                  </Button>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarImage src={settings.profile.avatar} alt={userDisplayName} />
                      <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-50">
                        {userDisplayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {user?.email || settings.profile.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1 bg-gray-50 px-4 py-6 dark:bg-slate-900 sm:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-[1600px]">{renderContent()}</div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// Main App with Auth Provider
const AppWithAuth: React.FC = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}

export default AppWithAuth



