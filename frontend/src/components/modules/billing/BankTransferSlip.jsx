import { useState }             from "react"
import { QrCode, Copy, Check,
         Printer, Building2,
         Smartphone, Globe,
         MapPin, ChevronDown,
         ChevronUp }            from "lucide-react"
import { Button }               from "@/components/ui/button"

const CHANNELS = [
  {
    icon:  Building2,
    label: "Bank branch",
    color: "text-blue-600",
    bg:    "bg-blue-50",
    steps: [
      "Visit any 1Bill-enabled bank branch",
      "Tell the teller: I want to pay my IESCO bill",
      "Give them your 14-digit reference number",
      "Pay the amount shown and keep the receipt",
    ],
    banks: ["HBL", "MCB", "UBL", "Allied Bank", "Meezan", "Bank Alfalah", "Faysal Bank", "NBP"],
  },
  {
    icon:  QrCode,
    label: "ATM",
    color: "text-purple-600",
    bg:    "bg-purple-50",
    steps: [
      "Insert your debit card at any 1LINK ATM",
      "Select: Bills - Utility Bills - IESCO",
      "Enter your 14-digit reference number",
      "Confirm the amount and press Pay",
    ],
    banks: ["Works at all major bank ATMs"],
  },
  {
    icon:  Globe,
    label: "Internet banking",
    color: "text-green-600",
    bg:    "bg-green-50",
    steps: [
      "Log in to your bank's internet banking",
      "Go to: Payments - Bill Payments - IESCO",
      "Enter your 14-digit reference number",
      "Confirm and pay - instant confirmation",
    ],
    banks: ["HBL Online", "MCB Internet Banking", "UBL Digital", "Meezan IB", "Alfalah Online"],
  },
  {
    icon:  Smartphone,
    label: "Mobile banking",
    color: "text-iesco-teal",
    bg:    "bg-teal-50",
    steps: [
      "Open your bank's mobile app",
      "Tap: Pay Bills - Utility - IESCO",
      "Enter reference number, confirm amount",
      "Authenticate with PIN or biometric",
    ],
    banks: ["HBL Mobile", "MCB Mobile", "UBL Omni", "Meezan App", "Alfalah Mobile"],
  },
]

function ChannelCard({ channel }) {
  const [open, setOpen] = useState(false)
  const Icon = channel.icon

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-left"
      >
        <div className={`w-8 h-8 rounded-lg ${channel.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-4 w-4 ${channel.color}`} />
        </div>
        <span className="font-medium text-slate-800 flex-1">{channel.label}</span>
        {open
          ? <ChevronUp   className="h-4 w-4 text-slate-400 flex-shrink-0 no-print" />
          : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0 no-print" />
        }
      </button>

      <div className={open ? "px-4 pb-4 space-y-3 border-t border-slate-100" : "hidden print-channel-steps"}>
        <ol className="space-y-1.5 mt-3">
          {channel.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {channel.banks.map((bank) => (
            <span key={bank} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {bank}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-iesco-teal hover:text-iesco-teal/80 font-medium transition no-print"
    >
      {copied
        ? <><Check className="h-3.5 w-3.5" /> Copied</>
        : <><Copy className="h-3.5 w-3.5" /> Copy</>
      }
    </button>
  )
}

export function BankTransferSlip({ bill }) {
  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-5 print-slip">

      <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 payment-slip-print">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">
            IESCO Reference Number
          </p>
          <CopyButton value={bill.reference_number} />
        </div>
        <p className="font-mono text-3xl font-bold tracking-widest text-white">
          {bill.reference_number.match(/.{1,4}/g)?.join(" ")}
        </p>
        <p className="text-slate-400 text-xs">
          Present this number at any bank branch, ATM, or internet banking
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        {[
          { label: "Consumer",      value: bill.consumer_name },
          { label: "Billing month", value: bill.billing_month },
          { label: "Amount due",    value: `PKR ${Number(bill.total_payable).toLocaleString("en-PK", { minimumFractionDigits: 2 })}` },
          { label: "Due date",      value: bill.due_date ? new Date(bill.due_date).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) : "-" },
        ].filter((r) => r.value).map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-800">{value}</span>
          </div>
        ))}
        {bill.is_overdue && (
          <p className="text-xs text-red-600 font-medium pt-1">
            This bill is overdue - a late payment surcharge may apply
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">
          Choose how to pay at a bank
        </p>
        {CHANNELS.map((ch) => (
          <ChannelCard key={ch.label} channel={ch} />
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full flex items-center gap-2"
        onClick={handlePrint}
      >
        <Printer className="h-4 w-4" />
        Print payment slip
      </Button>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-xs text-amber-800 font-medium">Important</p>
        <p className="text-xs text-amber-700 mt-1">
          Bank payments typically reflect in our system within 2-4 hours.
          Keep your bank transaction receipt until the bill status updates to "Paid" on this portal.
          For queries call IESCO helpline: <span className="font-mono">051-9252148</span>
        </p>
      </div>

    </div>
  )
}
