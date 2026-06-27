import { useState }    from "react"
import { useMutation } from "@tanstack/react-query"
import { Button }      from "@/components/ui/button"
import { Loader2 }     from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import api             from "@/services/api"

async function initiateEasypaisa({ referenceNumber, amount, mobileNumber }) {
  const { data } = await api.post("/payments/easypaisa/initiate", {
    reference_number: referenceNumber,
    amount,
    mobile_number:    mobileNumber || undefined,
    payment_method:   "redirect",
  })
  return data
}

// Submits a hidden POST form to EasyPaisa's checkout URL
function submitRedirectForm(checkoutUrl, payload) {
  const form = document.createElement("form")
  form.method = "POST"
  form.action = checkoutUrl

  Object.entries(payload).forEach(([key, value]) => {
    const input   = document.createElement("input")
    input.type    = "hidden"
    input.name    = key
    input.value   = String(value)
    form.appendChild(input)
  })

  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

export function EasypaisaButton({ bill }) {
  const [error, setError] = useState(null)

  const { mutate, isPending } = useMutation({
    mutationFn: initiateEasypaisa,
    onSuccess:  (data) => {
      if (data.flow === "redirect") {
        // Redirect citizen to EasyPaisa hosted checkout
        submitRedirectForm(data.checkout_url, data.payload)
      }
    },
    onError: (err) => {
      setError(err.response?.data?.detail || "Could not reach EasyPaisa. Try again.")
    },
  })

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        className="w-full bg-[#5CB85C] hover:bg-[#4cae4c] text-white"
        disabled={isPending}
        onClick={() => mutate({
          referenceNumber: bill.reference_number,
          amount:          bill.total_payable,
        })}
      >
        {isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting to EasyPaisa...</>
        ) : (
          "Pay with EasyPaisa"
        )}
      </Button>
      <p className="text-xs text-center text-slate-400">
        You will be redirected to EasyPaisa's secure payment page
      </p>
    </div>
  )
}
