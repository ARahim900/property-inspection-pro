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
import { useAuth, AuthProvider } from "./hooks/use-auth"

const useClients = () => {
  const getClients = (): Client[] => {
    try {
      const clients = localStorage.getItem("clients")
      if (clients) {
        return JSON.parse(clients) as Client[]
      }
      // If no clients, load mock data and save it
      localStorage.setItem("clients", JSON.stringify(MOCK_CLIENTS))
      return MOCK_CLIENTS
    } catch (error) {
      console.error("Error parsing clients from localStorage", error)
      return []
    }
  }

  const saveClient = (clientData: Client): void => {
    const clients = getClients().filter((c) => c.id !== clientData.id)
    clients.push(clientData)
    localStorage.setItem("clients", JSON.stringify(clients))
  }

  const deleteClient = (id: string): void => {
    const clients = getClients().filter((c) => c.id !== id)
    localStorage.setItem("clients", JSON.stringify(clients))
  }

  return { getClients, saveClient, deleteClient }
}

const useInvoices = () => {
  const getInvoices = (): Invoice[] => {
    try {
      const invoices = JSON.parse(localStorage.getItem("invoices") || "[]") as Invoice[]
      return invoices.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
    } catch (error) {
      console.error("Error parsing invoices from localStorage", error)
      return []
    }
  }

  const getInvoiceById = (id: string): Invoice | null => {
    return getInvoices().find((inv) => inv.id === id) || null
  }

  const saveInvoice = (invoiceData: Invoice): void => {
    const invoices = getInvoices().filter((inv) => inv.id !== invoiceData.id)
    invoices.push(invoiceData)
    localStorage.setItem("invoices", JSON.stringify(invoices))
  }

  const deleteInvoice = (id: string): void => {
    const invoices = getInvoices().filter((inv) => inv.id !== id)
    localStorage.setItem("invoices", JSON.stringify(invoices))
  }

  return { getInvoices, getInvoiceById, saveInvoice, deleteInvoice }
}

const useAppSettings = () => {
  const defaultAvatar = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>')}`

  const defaultSettings: AppSettings = {
    theme: (localStorage.getItem("theme") as "light" | "dark") || "dark",
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
      return defaultSettings
    } catch (e) {
      console.error("Failed to parse app settings:", e)
      return defaultSettings
    }
  }

  const saveSettings = (settings: AppSettings) => {
    localStorage.setItem("appSettings", JSON.stringify(settings))
    localStorage.setItem("theme", settings.theme) // Also save theme separately for initial load
  }

  return { getSettings, saveSettings }
}

// --- Helper Functions ---
const resizeAndCompressImage = (file: File, maxSize = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("FileReader did not return a result."))
      }
      const img = new Image()
      img.src = event.target.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img

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

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          return reject(new Error("Failed to get canvas context"))
        }
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL("image/jpeg", quality)
        resolve(dataUrl)
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
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

// --- UI Components ---
const buttonClasses = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:bg-blue-400",
  secondary:
    "bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900",
  destructive:
    "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900",
}

const inputClasses =
  "block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"

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
    if (event.target.files) {
      // Fix: The 'file' variable was being incorrectly inferred as 'unknown'. By iterating directly over `event.target.files` (a FileList) instead of using `Array.from`, TypeScript can correctly infer the type of 'file' as a `File` object, resolving the type errors.
      for (const file of event.target.files) {
        try {
          const base64WithMime = await resizeAndCompressImage(file, 1024, 0.8)
          const base64 = base64WithMime.split(",")[1]
          onUpload({ base64, name: file.name })
        } catch (error) {
          console.error("Error processing image", error)
          alert("There was an error processing the image. Please try a different file.")
        }
      }
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative group aspect-square">
            <img
              src={`data:image/jpeg;base64,${photo.base64}`}
              alt={`upload-preview-${index}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              &times;
            </button>
          </div>
        ))}
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
  const { getInspectionById, saveInspection } = useInspections()
  const [inspection, setInspection] = useState<InspectionData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (inspectionId) {
      // Avoid including getInspectionById in deps to prevent state resets on re-render
      setInspection(getInspectionById(inspectionId))
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
  }, [inspectionId])

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
      try {
        setIsSaving(true)
        await saveInspection(inspection)
        onSave()
      } catch (error) {
        console.error("Error saving inspection:", error)
        alert("Failed to save inspection. Please try again.")
      } finally {
        setIsSaving(false)
      }
    }
  }

  if (!inspection)
    return (
      <div className="text-center p-8">
        <Spinner className="text-blue-600 dark:text-blue-400 mx-auto" />
      </div>
    )

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

const WaslaLogo: React.FC = () => (
  <div className="text-center">
    <h2 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
      WASLA
    </h2>
    <p className="text-xs font-semibold tracking-wide text-teal-700 dark:text-teal-400">Property Solutions</p>
  </div>
)

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
    alert("PDF export functionality has been disabled for demo purposes.")
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
                          {item.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={`data:image/jpeg;base64,${photo.base64}`}
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
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
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
        <button onClick={onCreate} className={buttonClasses.primary}>
          New Inspection
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700">
        {filteredInspections.length > 0 ? (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredInspections.map((insp: InspectionData) => (
              <li
                key={insp.id}
                className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-400">{insp.propertyLocation}</h3>
                  <p className="text-slate-600 dark:text-slate-300">Client: {insp.clientName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Date: {formatDate(insp.inspectionDate)} | Type: {insp.propertyType}
                  </p>
                </div>
                <div className="flex gap-2 self-end md:self-center">
                  <button onClick={() => onView(insp.id)} className={buttonClasses.secondary}>
                    View Report
                  </button>
                  <button
                    onClick={() => onEdit(insp.id)}
                    className="bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-300 font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(insp.id)}
                    className="bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900 text-red-800 dark:text-red-300 font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
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
const StatCard: React.FC<{
  title: string
  value: string
  change: string
  changeType: "increase" | "decrease"
  icon: React.ReactNode
  color: string
}> = ({ title, value, change, changeType, icon, color }) => {
  const isIncrease = changeType === "increase"
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-5">
      <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full ${color}`}>{icon}</div>
      <div>
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h4>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        {change && (
          <div className={`text-sm flex items-center mt-1 ${isIncrease ? "text-green-500" : "text-red-500"}`}>
            {isIncrease ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {change}
          </div>
        )}
      </div>
    </div>
  )
}

// Replaced Recharts with simple HTML/CSS charts
const SimpleBarChart: React.FC<{ data: { name: string; total: number }[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map((d) => d.total))

  return (
    <div className="h-72 flex items-end justify-between gap-2 p-4">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div
            className="w-full bg-slate-200 dark:bg-slate-700 rounded-t-lg relative overflow-hidden"
            style={{ height: "200px" }}
          >
            <div
              className="bg-blue-500 w-full absolute bottom-0 rounded-t-lg transition-all duration-300"
              style={{ height: `${(item.total / maxValue) * 100}%` }}
            />
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {item.total}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 text-center">{item.name}</div>
        </div>
      ))}
    </div>
  )
}

const SimplePieChart: React.FC<{ data: { name: string; value: number; fill: string }[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="h-72 flex items-center justify-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const strokeDasharray = `${percentage} ${100 - percentage}`
            const strokeDashoffset = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 100, 0)

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="15.915"
                fill="transparent"
                stroke={item.fill}
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={-strokeDashoffset}
                className="transition-all duration-300"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{total}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
          </div>
        </div>
      </div>
      <div className="ml-6 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const DashboardOverview: React.FC = () => {
  const { inspections } = useInspections()
  const { getClients } = useClients()
  const { getInvoices } = useInvoices()

  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    setClients(getClients())
    setInvoices(getInvoices())
  }, [])

  // Calculate stats
  const totalInspections = inspections.length
  const totalClients = clients.length
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const pendingInvoices = invoices.filter((inv) => inv.status === "Unpaid").length

  // Chart data
  const monthlyData = [
    { name: "Jan", total: 12 },
    { name: "Feb", total: 19 },
    { name: "Mar", total: 15 },
    { name: "Apr", total: 25 },
    { name: "May", total: 22 },
    { name: "Jun", total: 30 },
  ]

  const statusData = [
    { name: "Completed", value: totalInspections - 2, fill: "#10b981" },
    { name: "In Progress", value: 2, fill: "#f59e0b" },
    { name: "Scheduled", value: 1, fill: "#3b82f6" },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Inspections"
          value={totalInspections.toString()}
          change="+12% from last month"
          changeType="increase"
          color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          }
        />
        <StatCard
          title="Active Clients"
          value={totalClients.toString()}
          change="+5% from last month"
          changeType="increase"
          color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(totalRevenue)}
          change="+8% from last month"
          changeType="increase"
          color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          }
        />
        <StatCard
          title="Pending Invoices"
          value={pendingInvoices.toString()}
          change="-3% from last month"
          changeType="decrease"
          color="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Inspections</h3>
          <SimpleBarChart data={monthlyData} />
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Inspection Status</h3>
          <SimplePieChart data={statusData} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Inspections</h3>
        <div className="space-y-3">
          {inspections.slice(0, 5).map((inspection: InspectionData) => (
            <div
              key={inspection.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{inspection.propertyLocation}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {inspection.clientName} • {formatDate(inspection.inspectionDate)}
                </p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full">
                Completed
              </span>
            </div>
          ))}
        </div>
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
  const { user, loading } = useAuth()

  useEffect(() => {
    document.documentElement.className = settings.theme
  }, [settings.theme])

  const handleSettingsUpdate = (newSettings: AppSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
    document.documentElement.className = newSettings.theme
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    window.location.href = '/auth/login'
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
          <InspectionForm
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
        return <PlaceholderPage title="Client Management" />
      case "invoices":
        return <PlaceholderPage title="Invoice Management" />
      case "settings":
        return <PlaceholderPage title="Settings" />
      default:
        return <DashboardOverview />
    }
  }

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "inspections", label: "Inspections", icon: "🏠" },
    { id: "clients", label: "Clients", icon: "👥" },
    { id: "invoices", label: "Invoices", icon: "💰" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <WaslaLogo />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Property Inspector Pro</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  handleSettingsUpdate({ ...settings, theme: settings.theme === "dark" ? "light" : "dark" })
                }
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                aria-label="Toggle theme"
              >
                {settings.theme === "dark" ? "🌞" : "🌙"}
              </button>
              <div className="flex items-center gap-2">
                <img
                  src={settings.profile.avatar || "/placeholder.svg"}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {settings.profile.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white dark:bg-slate-800 shadow-sm border-r border-slate-200 dark:border-slate-700 min-h-[calc(100vh-4rem)]">
          <div className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      currentView === item.id
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
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
