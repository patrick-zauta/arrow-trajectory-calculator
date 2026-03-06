import { useId } from "react"

interface InfoHintProps {
  text: string
}

export function InfoHint({ text }: InfoHintProps) {
  const tooltipId = useId()

  return (
    <span className="info-hint">
      <button type="button" className="info-hint-trigger" aria-describedby={tooltipId} aria-label="Weitere Informationen" tabIndex={0}>
        i
      </button>
      <span id={tooltipId} className="info-hint-bubble" role="tooltip" aria-hidden="true">
        {text}
      </span>
    </span>
  )
}
