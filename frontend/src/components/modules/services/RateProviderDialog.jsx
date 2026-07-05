import { useState }                  from "react"
import { useSubmitRating }           from "@/hooks/useServices"
import { StarRating }                from "./StarRating"
import { Button }                    from "@/components/ui/button"
import { Textarea }                  from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
}                                    from "@/components/ui/dialog"
import { CheckCircle, Loader2 }      from "lucide-react"
import { getErrorMessage }           from "@/utils/formatters"

export function RateProviderDialog({ provider, open, onOpenChange }) {
  const [selectedRating, setSelected] = useState(0)
  const [comment, setComment]         = useState("")
  const [done, setDone]               = useState(false)

  const { mutate, isPending, isError, error } = useSubmitRating()

  function handleSubmit() {
    if (!selectedRating) return
    mutate(
      { providerId: provider.id, rating: selectedRating, comment },
      { onSuccess: () => setDone(true) }
    )
  }

  function handleClose() {
    if (!isPending) {
      setSelected(0)
      setComment("")
      setDone(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate this provider</DialogTitle>
          <DialogDescription>
            {provider?.name} - {provider?.area}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
            <p className="font-medium text-slate-800">Thank you for your rating</p>
            <p className="text-sm text-slate-500">
              Your feedback helps other citizens find quality providers.
            </p>
            <Button className="w-full" onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">

            <div className="space-y-2">
              <p className="text-sm text-slate-600 font-medium">Your rating</p>
              <div className="flex justify-center py-2">
                <StarRating
                  value={selectedRating}
                  size="lg"
                  interactive
                  onSelect={setSelected}
                />
              </div>
              {selectedRating > 0 && (
                <p className="text-xs text-center text-amber-600 font-medium">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][selectedRating]}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-sm text-slate-600 font-medium">
                Comment <span className="text-slate-400 font-normal">(optional)</span>
              </p>
              <Textarea
                placeholder="Describe your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-slate-400 text-right">
                {comment.length}/500
              </p>
            </div>

            {isError && (
              <p className="text-sm text-red-600">
                {getErrorMessage(error, "Could not submit rating. Try again.")}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!selectedRating || isPending}
              >
                {isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                  : "Submit rating"
                }
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
