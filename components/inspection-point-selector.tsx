"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { INSPECTION_CATEGORIES } from "@/constants"
import { X } from "lucide-react"

interface InspectionPointSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPoint: (category: string, point: string) => void
  areaName: string
}

export function InspectionPointSelector({
  open,
  onOpenChange,
  onSelectPoint,
  areaName
}: InspectionPointSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handlePointSelect = (category: string, point: string) => {
    onSelectPoint(category, point)
    onOpenChange(false)
    setSelectedCategory(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Add Inspection Point to {areaName}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(85vh-120px)] pr-4">
          <div className="space-y-6">
            {Object.entries(INSPECTION_CATEGORIES).map(([category, points]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white border-b pb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {points.map((point) => (
                    <button
                      key={point}
                      onClick={() => handlePointSelect(category, point)}
                      className="px-4 py-2.5 text-sm text-left rounded-lg bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/50 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                    >
                      {point}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
