import { useState, useEffect } from 'react'

export type Language = 'en' | 'es' | 'fr' | 'pt' | 'de' | 'it' | 'zh' | 'ja'

export interface LanguageOption {
  code: Language
  name: string
  nativeName: string
  flag: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' }
]

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    // Get from localStorage or detect browser language
    const saved = localStorage.getItem('buck-ai-language') as Language
    if (saved && SUPPORTED_LANGUAGES.find(l => l.code === saved)) {
      return saved
    }
    
    // Detect browser language
    const browserLang = navigator.language.split('-')[0] as Language
    if (SUPPORTED_LANGUAGES.find(l => l.code === browserLang)) {
      return browserLang
    }
    
    return 'en' // Default to English
  })

  const changeLanguage = (language: Language) => {
    setCurrentLanguage(language)
    localStorage.setItem('buck-ai-language', language)
  }

  const getCurrentLanguageInfo = () => {
    return SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0]
  }

  return {
    currentLanguage,
    changeLanguage,
    getCurrentLanguageInfo,
    supportedLanguages: SUPPORTED_LANGUAGES
  }
}