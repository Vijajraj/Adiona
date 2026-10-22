import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label={`Switch language to ${language === 'en' ? 'Tamil' : 'English'}`}
      title={language === 'en' ? 'தமிழுக்கு மாறவும்' : 'Switch to English'}
    >
      <Languages className="w-3.5 h-3.5 text-indigo-400" />
      <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
    </button>
  );
}
