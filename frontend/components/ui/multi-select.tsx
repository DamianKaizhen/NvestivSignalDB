"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface MultiSelectOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  onValueChange: (value: string[]) => void
  defaultValue?: string[]
  placeholder?: string
  maxCount?: number
  modalPopover?: boolean
  asChild?: boolean
  className?: string
}

export function MultiSelect({
  options,
  onValueChange,
  defaultValue = [],
  placeholder = "Select items",
  maxCount = 3,
  modalPopover = false,
  asChild = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<string[]>(defaultValue)

  const handleUnselect = React.useCallback((item: string) => {
    const newSelected = selected.filter((s) => s !== item)
    setSelected(newSelected)
    onValueChange(newSelected)
  }, [selected, onValueChange])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = e.target as HTMLInputElement
    if (input.value === "") {
      if (e.key === "Backspace") {
        const newSelected = [...selected]
        newSelected.pop()
        setSelected(newSelected)
        onValueChange(newSelected)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
  }, [selected, onValueChange])

  const selectables = options.filter((option) => !selected.includes(option.value))

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modalPopover}>
      <PopoverTrigger asChild={asChild}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.map((item) => {
              const option = options.find((opt) => opt.value === item)
              return (
                <Badge
                  variant="secondary"
                  key={item}
                  className="mr-1 mb-1"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleUnselect(item)
                  }}
                >
                  {option?.label}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(item)
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              )
            })}
            {selected.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search..."
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {selectables.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    const newSelected = [...selected, option.value]
                    setSelected(newSelected)
                    onValueChange(newSelected)
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.icon && (
                    <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}