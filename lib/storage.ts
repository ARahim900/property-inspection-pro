import { createClient } from "@/lib/supabase/client"

export class StorageService {
  private supabase = createClient()
  private bucketName = "inspection-photos"

  // Convert base64 to file
  private base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(",")
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg"
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }

    return new File([u8arr], filename, { type: mime })
  }

  // Upload image to Supabase Storage
  async uploadImage(base64: string, filename: string, userId: string, inspectionId: string): Promise<string> {
    try {
      // Convert base64 to file
      const file = this.base64ToFile(base64, filename)

      // Create unique file path: userId/inspectionId/timestamp_filename
      const timestamp = Date.now()
      const filePath = `${userId}/${inspectionId}/${timestamp}_${filename}`

      // Upload file to Supabase Storage
      const { data, error } = await this.supabase.storage.from(this.bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("Upload error:", error)
        throw error
      }

      return data.path
    } catch (error) {
      console.error("Error uploading image:", error)
      throw error
    }
  }

  // Get public URL for an image
  async getImageUrl(filePath: string): Promise<string> {
    try {
      const { data } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("Error getting image URL:", error)
      throw error
    }
  }

  // Delete image from storage
  async deleteImage(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage.from(this.bucketName).remove([filePath])

      if (error) {
        console.error("Delete error:", error)
        throw error
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      throw error
    }
  }

  // Get image as base64 (for backward compatibility)
  async getImageAsBase64(filePath: string): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage.from(this.bucketName).download(filePath)

      if (error) {
        console.error("Download error:", error)
        throw error
      }

      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result)
        }
        reader.onerror = reject
        reader.readAsDataURL(data)
      })
    } catch (error) {
      console.error("Error downloading image:", error)
      throw error
    }
  }
}

export const storageService = new StorageService()
