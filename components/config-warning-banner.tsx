"use client"

import { isSupabaseConfigured } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

export function ConfigWarningBanner() {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // Only check configuration on client-side
    setShowWarning(!isSupabaseConfigured())
  }, [])

  if (!showWarning) return null

  return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Configuration Required</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>
            The authentication service is not properly configured. To set up authentication:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Create a Supabase account at supabase.com</li>
            <li>Create a new project and get your API credentials</li>
            <li>Copy <code className="px-1 bg-red-900/20">.env.local.example</code> to <code className="px-1 bg-red-900/20">.env.local</code></li>
            <li>Add your Supabase URL and anon key to the .env.local file</li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </AlertDescription>
    </Alert>
  )
}