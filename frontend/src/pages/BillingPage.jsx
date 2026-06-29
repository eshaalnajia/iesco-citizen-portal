import { useState }                  from "react"
import { Input }                     from "@/components/ui/input"
import { Button }                    from "@/components/ui/button"
import { Label }                     from "@/components/ui/label"
import { Skeleton }                  from "@/components/ui/skeleton"
import { useQuery }                  from "@tanstack/react-query"
import { PaymentMethodSelector }     from "@/components/modules/billing/PaymentMethodSelector"
import { JazzCashForm }              from "@/components/modules/billing/JazzCashForm"
import { EasypaisaButton }           from "@/components/modules/billing/EasypaisaButton"
import { BankTransferSlip }          from "@/components/modules/billing/BankTransferSlip"
import { AlertTriangle, CheckCircle, Receipt } from "lucide-react"
import { useTranslation } from "react-i18next"
import { formatPKR, formatDate } from "@/utils/formatters"
import { useTranslation } from "react-i18next"
import { formatPKR, formatDate } from "@/utils/formatters"
import api                           from "@/services/api"

async function lookupBill(ref) {
  const { data } = await api.get(`/bills/${ref}`)
  return data
}

function BillSummaryCard({ bill }) {
  const { t } = useTranslation()
  const isPaid    = bill.payment_status === "paid"
  const isOverdue = bill.is_overdue

  return (
    <div className={`rounded-xl border-2 p-5 space-y-4
                     ${isPaid    ? "border-green-200 bg-green-50"  :
                       isOverdue ? "border-red-200   bg-red-50"    :
                       "border-slate-200 bg-white"}`}>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-mono">{bill.reference_number}</p>
          <p className="font-bold text-slate-900 mt-0.5">{bill.consumer_name}</p>
          <p className="text-xs text-slate-500">{bill.consumer_address}</p>
        </div>
        {isPaid && <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />}
        {isOverdue && !isPaid && <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          { label: t("billing.billingMonth"),  value: bill.billing_month },
          { label: "Units consumed", value: `${bill.units_consumed} kWh` },
          { label: t("billing.dueDate"),       value: bill.due_date
              ? new Date(bill.due_date).toLocaleDateString("en-PK", {
                  day: "numeric", month: "long", year: "numeric",
                })
              : "-"
          },
          { label: t("billing.status.unpaid"),  value: isPaid ? t("billing.status.paid") : isOverdue ? t("billing.status.overdue") : t("billing.status.unpaid") },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="font-medium text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
        <span className="text-sm text-slate-500">{t("billing.totalPayable")}</span>
        <span className="text-2xl font-bold text-slate-900">
          {formatPKR(bill.total_payable)}
        </span>
      </div>

      {isPaid && bill.transaction_ref && (
        <div className="bg-green-100 rounded-lg px-3 py-2">
          <p className="text-xs text-green-700">
            {t("billing.txnRef")}{" "}
            <span className="font-mono font-medium">{bill.transaction_ref}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default function BillingPage() {
  const { t } = useTranslation()
  const { t } = useTranslation()
  const [refInput, setRefInput]      = useState("")
  const [submittedRef, setSubmitted] = useState(null)
  const [payMethod, setPayMethod]    = useState("jazzcash")

  const {
    data:      bill,
    isLoading, isError,
    error,     refetch,
  } = useQuery({
    queryKey:  ["bill", submittedRef],
    queryFn:   () => lookupBill(submittedRef),
    enabled:   !!submittedRef,
    retry:     false,
  })

  function handleLookup(e) {
    e.preventDefault()
    const cleaned = refInput.replace(/\s/g, "")
    setSubmitted(cleaned)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("billing.title")}</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {t("billing.subtitle")}
        </p>
      </div>

      <form onSubmit={handleLookup} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 1234 5678 9012 34"
            value={refInput}
            onChange={(e) => setRefInput(e.target.value.replace(/[^\d\s]/g, ""))}
            maxLength={17}
            className="font-mono"
          />
        </div>
        <Button type="submit" disabled={refInput.replace(/\s/g, "").length !== 14}>
          <Receipt className="h-4 w-4 mr-2" />
          Look up
        </Button>
      </form>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-800">{t("billing.notFound")}</p>
          <p className="text-sm text-red-600 mt-1">
            {error?.response?.data?.detail ||
              "No bill found for this reference number. Check the number on your paper bill and try again."}
          </p>
        </div>
      )}

      {bill && (
        <div className="space-y-5">
          <BillSummaryCard bill={bill} />

          {bill.payment_status !== "paid" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  {t("billing.payWith")}
                </Label>
                <PaymentMethodSelector
                  value={payMethod}
                  onChange={setPayMethod}
                />
              </div>

              {payMethod === "jazzcash" && (
                <JazzCashForm bill={bill} onSuccess={() => refetch()} />
              )}
              {payMethod === "easypaisa" && (
                <EasypaisaButton bill={bill} />
              )}
              {payMethod === "bank" && (
                <BankTransferSlip bill={bill} />
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}





