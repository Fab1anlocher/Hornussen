// The Nouss (puck) mark — a small wood-toned disc used as the brand icon.
export function Nouss({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <radialGradient id="nouss-face" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#eed3a6" />
          <stop offset="55%" stopColor="#d1953c" />
          <stop offset="100%" stopColor="#a0621e" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="22" rx="15" ry="9" fill="#7f4b1c" />
      <ellipse cx="20" cy="19" rx="15" ry="9" fill="url(#nouss-face)" />
      <ellipse cx="20" cy="19" rx="15" ry="9" fill="none" stroke="#7f4b1c" strokeWidth="1.2" />
      <ellipse cx="16" cy="16" rx="4.5" ry="2.4" fill="#f7ecd6" opacity="0.7" />
    </svg>
  );
}
