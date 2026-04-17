'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const DEFAULT_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Drinks',
  'Food',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Personal Care',
  'Shopping',
  'Rent',
  'Misc',
  'Education',
  'Charity',
  'Family',
  'Gifts',
  'Travel',
  'Membership',
  'Business',
]

interface CategoryPickerProps {
  selectedCategories: string[]
  onCategoriesChange: (categories: string[]) => void
  userNotes: string
  onUserNotesChange: (notes: string) => void
  onGenerate: () => void
  isLoading: boolean
}

export function CategoryPicker({
  selectedCategories,
  onCategoriesChange,
  userNotes,
  onUserNotesChange,
  onGenerate,
  isLoading,
}: CategoryPickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customCategory, setCustomCategory] = useState('')

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category))
    } else {
      onCategoriesChange([...selectedCategories, category])
    }
  }

  const addCustomCategory = () => {
    if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
      onCategoriesChange([...selectedCategories, customCategory.trim()])
      setCustomCategory('')
      setShowCustomInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomCategory()
    }
    if (e.key === 'Escape') {
      setShowCustomInput(false)
      setCustomCategory('')
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-foreground mb-4">Pick your categories</h2>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category)
            return (
              <Badge
                key={category}
                variant={isSelected ? 'default' : 'outline'}
                className={`
                  px-3 py-1.5 cursor-pointer transition-all text-sm
                  ${isSelected 
                    ? 'bg-foreground text-background hover:bg-foreground/90' 
                    : 'hover:bg-secondary'}
                `}
                onClick={() => toggleCategory(category)}
              >
                {category}
                {isSelected && (
                  <X className="w-3 h-3 ml-1.5" />
                )}
              </Badge>
            )
          })}
          
          {/* Custom categories added by user */}
          {selectedCategories
            .filter((c) => !DEFAULT_CATEGORIES.includes(c))
            .map((category) => (
              <Badge
                key={category}
                variant="default"
                className="px-3 py-1.5 cursor-pointer bg-accent text-accent-foreground hover:bg-accent/90 text-sm"
                onClick={() => toggleCategory(category)}
              >
                {category}
                <X className="w-3 h-3 ml-1.5" />
              </Badge>
            ))}

          {showCustomInput ? (
            <div className="flex items-center gap-2">
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Category name"
                className="w-40 h-8 text-sm bg-input"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={addCustomCategory}
                className="h-8 px-2"
              >
                Add
              </Button>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="px-3 py-1.5 cursor-pointer hover:bg-secondary text-sm border-dashed"
              onClick={() => setShowCustomInput(true)}
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Add custom
            </Badge>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-foreground mb-2">
          Anything we should know?
          <span className="text-muted-foreground font-normal text-sm ml-2">(optional)</span>
        </h2>
        <Textarea
          value={userNotes}
          onChange={(e) => onUserNotesChange(e.target.value)}
          placeholder="e.g., 'Ignore Venmo transfers to myself' or 'The -$75 is a refund from a friend — please include it'"
          className="min-h-24 bg-input resize-none"
        />
      </div>

      <Button
        onClick={onGenerate}
        disabled={isLoading || selectedCategories.length === 0}
        className="w-full h-14 text-lg font-medium"
      >
        {isLoading ? 'Processing...' : 'Generate Report →'}
      </Button>
    </section>
  )
}
