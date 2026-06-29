import i18n from "i18next"
import { initReactI18next }           from "react-i18next"
import LanguageDetector               from "i18next-browser-languagedetector"
import en from "./locales/en.json"
import ur from "./locales/ur.json"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur },
    },
    fallbackLng:   "en",
    lng:           localStorage.getItem("iesco-lang") || "en",
    interpolation: { escapeValue: false },
    detection: {
      order:  ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "iesco-lang",
    },
  })

i18n.on("languageChanged", (lng) => {
  const dir = lng === "ur" ? "rtl" : "ltr"
  document.documentElement.setAttribute("dir",  dir)
  document.documentElement.setAttribute("lang", lng)
  localStorage.setItem("iesco-lang", lng)
})

const initialLang = localStorage.getItem("iesco-lang") || "en"
document.documentElement.setAttribute("dir",  initialLang === "ur" ? "rtl" : "ltr")
document.documentElement.setAttribute("lang", initialLang)

export default i18n
