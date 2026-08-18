export function SmartGridLogo({ className = "", showText = true, textClassName = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width="34"
        height="20"
        viewBox="0 0 34 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M2 13 Q 9 4 16 13 T 32 13"
          stroke="var(--color-grid-signal, #12B886)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          pathLength="1"
          className="smartgrid-logo-curve"
        />
      </svg>
      {showText && (
        <span className={`font-semibold tracking-tight ${textClassName}`}>
          SmartGrid<span style={{ color: "var(--color-grid-signal, #12B886)" }}>+</span>
        </span>
      )}
    </span>
  )
}