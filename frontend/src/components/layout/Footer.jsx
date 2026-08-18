export default function Footer() {
  return (
    <footer className="border-t py-6 mt-auto">
      <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row
                      justify-between items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <svg width="16" height="10" viewBox="0 0 34 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M2 13 Q 9 4 16 13 T 32 13" stroke="var(--color-grid-signal, #12B886)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
          <span>SmartGrid+ - Digital Transformation Initiative 2025</span>
        </div>
        <div className="flex gap-4">
          <a href="tel:051-9252148" className="hover:text-foreground">Helpline: 051-9252148</a>
          <span>.</span>
          <span>Islamabad Electric Supply Company</span>
        </div>
      </div>
    </footer>
  )
}
