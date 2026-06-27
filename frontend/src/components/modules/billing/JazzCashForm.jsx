import { useState }       from "react"
import { useMutation }    from "@tanstack/react-query"
import { Input }          from "@/components/ui/input"
import { Label }          from "@/components/ui/label"
import { Button }         from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, Smartphone } from "lucide-react"
import api                from "@/services/api"

async function initiateJazzCash({ referenceNumber, mobileNumber, amount }) {
  const { data } = await api.post("/payments/jazzcash/initiate", {
    reference_number: referenceNumber,
    mobile_number:    mobileNumber,
    amount,
  })
  return data
}

async function confirmJazzCash({ txnRef, otp }) {
  const { data } = await api.post(
    `/payments/jazzcash/confirm?txn_ref=${txnRef}&otp=${otp}`
  )
  return data
}

export function JazzCashForm({ bill, onSuccess }) {
  const [step, setStep]           = useState("mobile")
  const [mobileNumber, setMobile] = useState("")
  const [otp, setOtp]             = useState("")
  const [txnRef, setTxnRef]       = useState(null)
  const [maskedMobile, setMasked] = useState("")

  const initiateM = useMutation({
    mutationFn: initiateJazzCash,
    onSuccess:  (data) => {
      setTxnRef(data.txn_ref)
      setMasked(data.mobile_number)
      setStep("otp")
    },
  })

  const confirmM = useMutation({
    mutationFn: confirmJazzCash,
    onSuccess:  (data) => {
      setStep("done")
      if (onSuccess) onSuccess(data)
    },
  })

  const error = initiateM.error?.response?.data?.detail
             || confirmM.error?.response?.data?.detail

  if (step === "mobile") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Smartphone className="h-4 w-4 text-iesco-teal" />
          <span>Pay with your JazzCash mobile account</span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mobile">JazzCash mobile number</Label>
          <Input
            id="mobile"
            type="tel"
            placeholder="03001234567"
            value={mobileNumber}
            onChange={(e) => setMobile(e.target.value)}
            maxLength={11}
            className="font-mono"
          />
          <p className="text-xs text-slate-400">
            Must be the Jazz or Warid number registered with your JazzCash account
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-slate-50 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Bill reference</span>
            <span className="font-mono text-slate-700">{bill.reference_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Amount payable</span>
            <span className="font-bold text-slate-900">
              PKR {Number(bill.total_payable).toLocaleString("en-PK", {
                minimumFractionDigits: 2
              })}
            </span>
          </div>
        </div>

        <Button
          className="w-full bg-iesco-teal hover:bg-iesco-teal/90"
          disabled={!mobileNumber || initiateM.isPending}
          onClick={() => initiateM.mutate({
            referenceNumber: bill.reference_number,
            mobileNumber,
            amount: bill.total_payable,
          })}
        >
          {initiateM.isPending
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending OTP...</>
            : "Send OTP to my JazzCash number"
          }
        </Button>
      </div>
    )
  }

  if (step === "otp") {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-medium text-amber-800">OTP sent</p>
          <p className="text-sm text-amber-700 mt-0.5">
            A 6-digit OTP has been sent to <span className="font-mono">{maskedMobile}</span>.
            Enter it below to complete your payment. OTP expires in 3 minutes.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="otp">One-time password (OTP)</Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            className="font-mono text-center text-xl tracking-widest"
            autoFocus
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          className="w-full bg-iesco-teal hover:bg-iesco-teal/90"
          disabled={otp.length !== 6 || confirmM.isPending}
          onClick={() => confirmM.mutate({ txnRef, otp })}
        >
          {confirmM.isPending
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirming payment...</>
            : "Confirm payment"
          }
        </Button>

        <button
          onClick={() => { setStep("mobile"); setOtp(""); initiateM.reset() }}
          className="w-full text-sm text-slate-400 hover:text-slate-600"
        >
          Use a different number
        </button>
      </div>
    )
  }

  if (step === "done") {
    const receipt = confirmM.data
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-9 w-9 text-green-500" />
          </div>
        </div>

        <div>
          <p className="font-bold text-lg text-slate-900">Payment successful</p>
          <p className="text-sm text-slate-500 mt-1">
            Your IESCO bill has been paid via JazzCash
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2">
          {[
            { label: "Transaction ref",  value: receipt?.txn_ref },
            { label: "Amount paid",      value: `PKR ${Number(receipt?.amount_pkr).toLocaleString("en-PK", { minimumFractionDigits: 2 })}` },
            { label: "Payment method",   value: "JazzCash" },
            { label: "Date and time",    value: receipt?.payment_date },
            { label: "Bill reference",   value: receipt?.reference_number },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="font-mono font-medium text-slate-800">{value}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          Save the transaction reference for your records. Your bill status will
          update within a few minutes.
        </p>
      </div>
    )
  }

  return null
}
