import { useEffect, useState } from "react"

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) {
      return initialValue
    }

    try {
      return JSON.parse(rawValue) as T
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}