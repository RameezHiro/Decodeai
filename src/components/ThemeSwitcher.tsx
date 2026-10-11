import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Palette } from 'lucide-react'

type ThemeId = 'dark' | 'light' | 'contrast' | 'porcelain' | 'aurora'

const THEMES: Array<{
  id: ThemeId
  name: string
  note: string
  swatches: [string, string, string]
}> = [
  { id: 'dark', name: 'Dark', note: 'Midnight · aqua and ultraviolet', swatches: ['#090e16', '#70ecd8', '#b49aff'] },
  { id: 'light', name: 'Light', note: 'Cool studio · clear and bright', swatches: ['#eff5fa', '#167f94', '#7555c7'] },
  { id: 'contrast', name: 'High contrast', note: 'Maximum legibility · vivid signals', swatches: ['#000000', '#00ffff', '#fff000'] },
  { id: 'porcelain', name: 'Porcelain', note: 'Warm mineral · ink and cobalt', swatches: ['#f4f0e7', '#286bb0', '#d6604d'] },
  { id: 'aurora', name: 'Aurora', note: 'Deep plum · mint and lilac', swatches: ['#11101e', '#77ead2', '#d0a5ff'] },
]

const STORAGE_KEY = 'decode-ai-theme'
const isThemeId = (value: string | null): value is ThemeId => THEMES.some((theme) => theme.id === value)

function readSavedTheme(): ThemeId {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return isThemeId(saved) ? saved : 'dark'
  } catch {
    return 'dark'
  }
}

export default function ThemeSwitcher() {
  const [themeId, setThemeId] = useState<ThemeId>(readSavedTheme)
  const [open, setOpen] = useState(false)
  const controlRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const currentTheme = THEMES.find((theme) => theme.id === themeId) ?? THEMES[0]

  useEffect(() => {
    document.documentElement.dataset.theme = themeId
    try {
      window.localStorage.setItem(STORAGE_KEY, themeId)
    } catch {
      // The selected theme still works for this visit when storage is unavailable.
    }
  }, [themeId])

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !controlRef.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const chooseTheme = (nextTheme: ThemeId) => {
    setThemeId(nextTheme)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className="theme-control" ref={controlRef}>
      <button
        ref={triggerRef}
        className="theme-trigger"
        type="button"
        aria-label={`Color theme: ${currentTheme.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="theme-menu"
        title={`Color theme: ${currentTheme.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Palette size={14} aria-hidden="true" />
        <span className="theme-trigger-label">{currentTheme.name}</span>
        <ChevronDown size={12} className={`theme-chevron ${open ? 'is-open' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="theme-menu" id="theme-menu" role="menu" aria-label="Choose a visual theme">
          <div className="theme-menu-heading">
            <span>COLOR SYSTEM</span>
            <span className="theme-menu-key">01—05</span>
          </div>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              className="theme-option"
              type="button"
              role="menuitemradio"
              aria-checked={theme.id === themeId}
              onClick={() => chooseTheme(theme.id)}
            >
              <span className="theme-swatch" aria-hidden="true">
                {theme.swatches.map((swatch) => <i key={swatch} style={{ backgroundColor: swatch }} />)}
              </span>
              <span className="theme-option-copy">
                <strong>{theme.name}</strong>
                <small>{theme.note}</small>
              </span>
              <Check size={14} className="theme-option-check" aria-hidden="true" />
            </button>
          ))}
          <p className="theme-menu-foot">SAVED ON THIS DEVICE</p>
        </div>
      )}
    </div>
  )
}
