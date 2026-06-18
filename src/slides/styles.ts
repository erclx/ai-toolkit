export type Variant = 'light' | 'dark'

export interface Theme {
  background: string
  surface: string
  ink: string
  muted: string
  accent: string
}

const LIGHT: Theme = {
  background: 'FAF7F2',
  surface: 'F4EFE6',
  ink: '1A1815',
  muted: '7A736A',
  accent: 'A4471C',
}

const DARK: Theme = {
  background: '1A1815',
  surface: '23201C',
  ink: 'F4EFE6',
  muted: 'A39C92',
  accent: 'C8602E',
}

export const FONTS = {
  heading: 'Arial',
  body: 'Calibri',
} as const

export const TYPE = {
  cover: 44,
  section: 40,
  title: 30,
  body: 16,
  stat: 54,
  quote: 30,
  caption: 11,
} as const

export function buildTheme(variant: Variant): Theme {
  return variant === 'dark' ? DARK : LIGHT
}
