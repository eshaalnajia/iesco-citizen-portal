import { cn } from "@/lib/utils"

/**
 * A flex row that automatically reverses order in RTL mode.
 * Use for icon + text combinations that should flip in Urdu.
 */
export function FlexRow({ children, className, gap = "gap-2" }) {
  return (
    <div className={cn("flex items-center", gap, className)}>
      {children}
    </div>
  )
}
