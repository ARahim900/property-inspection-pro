"use client"

import dynamic from "next/dynamic"

const App = dynamic(() => import("@/App"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
})

export default function HomePage() {
  return <App />
}
