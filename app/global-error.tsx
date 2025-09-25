"use client"

import React, { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global App Error:", error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Application error</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              An unexpected error occurred while rendering the application.
            </p>
            {error?.digest ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Error ID: {error.digest}</p>
            ) : null}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => reset()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => location.reload()}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}