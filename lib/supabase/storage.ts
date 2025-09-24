import { createClient } from './client'

export async function uploadInspectionPhoto(
  file: File | Blob,
  inspectionId: string,
  itemId: string,
  userId: string
): Promise<string | null> {
  const supabase = createClient()

  try {
    // Generate unique file name
    const fileExt = file.type.split('/')[1] || 'jpg'
    const fileName = `${userId}/${inspectionId}/${itemId}/${Date.now()}.${fileExt}`

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('inspection-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading photo:', error)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('inspection-photos')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error in uploadInspectionPhoto:', error)
    return null
  }
}

export async function deleteInspectionPhoto(filePath: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase.storage
      .from('inspection-photos')
      .remove([filePath])

    if (error) {
      console.error('Error deleting photo:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteInspectionPhoto:', error)
    return false
  }
}

// Convert base64 to blob for upload
export function base64ToBlob(base64: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')

  // Convert base64 to binary
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }

  const byteArray = new Uint8Array(byteNumbers)

  // Create blob with proper MIME type
  return new Blob([byteArray], { type: 'image/jpeg' })
}