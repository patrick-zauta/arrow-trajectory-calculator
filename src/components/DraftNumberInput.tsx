import { useEffect, useMemo, useState } from "react"

interface DraftNumberInputProps {
  value: number | null | undefined
  onCommit: (nextValue: number | null) => void
  allowEmpty?: boolean
  className?: string
  min?: number
  max?: number
  step?: number | string
  disabled?: boolean
  placeholder?: string
  "aria-label"?: string
}

function formatValue(value: number | null | undefined, allowEmpty: boolean): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return allowEmpty ? "" : "0"
  }

  return String(value)
}

export function DraftNumberInput({
  value,
  onCommit,
  allowEmpty = false,
  className,
  min,
  max,
  step,
  disabled,
  placeholder,
  "aria-label": ariaLabel,
}: DraftNumberInputProps) {
  const committedText = useMemo(() => formatValue(value, allowEmpty), [allowEmpty, value])
  const [draft, setDraft] = useState(committedText)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      setDraft(committedText)
    }
  }, [committedText, isEditing])

  const commit = () => {
    setIsEditing(false)

    if (draft.trim() === "") {
      if (allowEmpty) {
        onCommit(null)
        return
      }

      setDraft(committedText)
      return
    }

    const normalized = draft.replace(",", ".")
    const parsed = Number(normalized)
    if (!Number.isFinite(parsed)) {
      setDraft(committedText)
      return
    }

    onCommit(parsed)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      className={className}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onFocus={() => setIsEditing(true)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          commit()
          return
        }

        if (event.key === "Escape") {
          setIsEditing(false)
          setDraft(committedText)
        }
      }}
    />
  )
}
