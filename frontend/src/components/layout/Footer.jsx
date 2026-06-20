import { Zap } from "lucide-react"
export default function Footer() {
  return (
    <footer className="border-t py-6 mt-auto">
      <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row
                      justify-between items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-iesco-teal" />
          <span>IESCO Citizen Portal - Digital Transformation Initiative 2025</span>
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
