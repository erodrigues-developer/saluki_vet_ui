export const digitsOnly = (value: string) => (value || '').replace(/\D+/g, '')

export const normalizeBrazilPhoneDigits = (value: string) => {
  const onlyDigits = digitsOnly(value)
  if ((onlyDigits.length === 12 || onlyDigits.length === 13) && onlyDigits.startsWith('55')) {
    return onlyDigits.slice(2)
  }
  return onlyDigits
}

export const formatBrazilPhone = (value: string) => {
  const digits = normalizeBrazilPhoneDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}
