import { useState } from 'react'

export function useCurrencyInput(initialValue: number = 0) {
  // Store as integer cents: 1250 = R$ 12,50
  const [cents, setCents] = useState<number>(
    Math.round(initialValue * 100)
  )

  // Display value formatted as Brazilian currency string
  const displayValue = (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number) => void
  ) => {
    // Keep only digits
    const digits = e.target.value.replace(/\D/g, '')
    const newCents = digits === '' ? 0 : parseInt(digits, 10)
    // Prevent unreasonably large values (max R$ 999.999,99)
    if (newCents > 99999999) return
    setCents(newCents)
    // Pass float value to react-hook-form
    onChange(newCents / 100)
  }

  const reset = (value: number = 0) => {
    setCents(Math.round(value * 100))
  }

  return { displayValue, handleChange, reset, cents }
}
