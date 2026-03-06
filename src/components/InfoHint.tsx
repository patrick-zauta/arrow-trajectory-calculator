interface InfoHintProps {
  text: string
}

export function InfoHint({ text }: InfoHintProps) {
  return (
    <span className="info-hint" tabIndex={0} aria-label={text}>
      <span className="info-hint-trigger" aria-hidden="true">
        i
      </span>
      <span className="info-hint-bubble" role="tooltip">
        {text}
      </span>
    </span>
  )
}
