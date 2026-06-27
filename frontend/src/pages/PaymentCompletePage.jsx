import { useSearchParams, Link } from "react-router-dom"
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

const RESULT_CONFIG = {
  paid: {
    icon:     CheckCircle,
    iconCls:  "text-green-500",
    bgCls:    "bg-green-50",
    title:    "Payment successful",
    subtitle: "Your IESCO bill has been paid via EasyPaisa",
  },
  cancelled: {
    icon:     XCircle,
    iconCls:  "text-slate-400",
    bgCls:    "bg-slate-50",
    title:    "Payment cancelled",
    subtitle: "You cancelled the payment. Your bill has not been paid.",
  },
  failed: {
    icon:     XCircle,
    iconCls:  "text-red-500",
    bgCls:    "bg-red-50",
    title:    "Payment failed",
    subtitle: "EasyPaisa declined the payment. Please try again.",
  },
  expired: {
    icon:     Clock,
    iconCls:  "text-amber-500",
    bgCls:    "bg-amber-50",
    title:    "Session expired",
    subtitle: "Your payment session timed out. Please start again.",
  },
  warning: {
    icon:     AlertTriangle,
    iconCls:  "text-amber-500",
    bgCls:    "bg-amber-50",
    title:    "Payment processed",
    subtitle: "EasyPaisa processed your payment but our system could not confirm it.",
  },
  error: {
    icon:     AlertTriangle,
    iconCls:  "text-red-500",
    bgCls:    "bg-red-50",
    title:    "Payment error",
    subtitle: "An error occurred during payment processing.",
  },
}

export default function PaymentCompletePage() {
  const [searchParams] = useSearchParams()
  const status         = searchParams.get("status") || "error"
  const txnRef         = searchParams.get("txn_ref")
  const orderRef       = searchParams.get("order_ref")
  const amount         = searchParams.get("amount")
  const reference      = searchParams.get("reference_number")
  const message        = searchParams.get("message")

  const config = RESULT_CONFIG[status] ?? RESULT_CONFIG.error
  const Icon   = config.icon

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className={`${config.bgCls} rounded-2xl p-8 text-center space-y-4`}>
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-white flex items-center
                          justify-center shadow-sm">
            <Icon className={`h-9 w-9 ${config.iconCls}`} />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">{config.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{config.subtitle}</p>
          {message && (
            <p className="text-sm text-slate-600 mt-2 bg-white/60
                          rounded-lg px-3 py-2">
              {decodeURIComponent(message)}
            </p>
          )}
        </div>
      </div>

      {/* Receipt details - shown on success */}
      {status === "paid" && (txnRef || orderRef) && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-slate-800">Payment receipt</h2>
          <div className="space-y-2">
            {[
              { label: "Transaction ref",   value: txnRef },
              { label: "Order ref",         value: orderRef },
              { label: "Amount paid",       value: amount ? `PKR ${Number(amount).toLocaleString("en-PK", { minimumFractionDigits: 2 })}` : null },
              { label: "Bill reference",    value: reference },
              { label: "Payment method",    value: "EasyPaisa" },
            ]
              .filter((r) => r.value)
              .map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-mono text-slate-800 text-right max-w-[60%] break-all">
                    {value}
                  </span>
                </div>
              ))}
          </div>
          <p className="text-xs text-slate-400 pt-1">
            Screenshot this receipt for your records
          </p>
        </div>
      )}

      {/* Warning - payment processed but not recorded */}
      {status === "warning" && txnRef && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800">Action needed</p>
          <p className="text-sm text-amber-700 mt-1">
            EasyPaisa transaction reference: <span className="font-mono">{txnRef}</span>
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Contact IESCO on 051-9252148 with this reference if your bill
            status does not update within 24 hours.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {status === "paid" ? (
          <Button asChild variant="default" className="w-full">
            <Link to="/billing">Return to billing</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="default" className="w-full">
              <Link to="/billing">Try again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Go to home</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
