export default function Logo({ size = 34, text = true }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <rect x="2" y="7" width="36" height="26" rx="7" fill="var(--sun)" stroke="var(--line)" strokeWidth="2.5" />
        <line x1="14" y1="11" x2="14" y2="29" stroke="var(--line)" strokeWidth="2.5" strokeDasharray="2.5 3" />
        <circle cx="14" cy="7" r="4" fill="var(--paper)" stroke="var(--line)" strokeWidth="2.5" />
        <circle cx="14" cy="33" r="4" fill="var(--paper)" stroke="var(--line)" strokeWidth="2.5" />
      </svg>
      {text && <span className="logo-text">Campus Connect</span>}
    </span>
  );
}
