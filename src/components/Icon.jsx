/**
 * Biblioteca de ícones do Tem Aí?.
 *
 * Todos os traçados usam o grid 24x24 e herdam cor e espessura de `.icon`
 * (definido em styles.css), então basta trocar `color` no CSS para recolorir.
 */
const ICONS = {
  recycle: (
    <>
      <polyline points="1 4 1 10 7 10" />
      <polyline points="23 20 23 14 17 14" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  tool: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  checkCircle: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 11.5 11.5 14 15.5 9.5" />
    </>
  ),
  users: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  chat: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  balloon: (
    <>
      <path d="M12 2.5a6.3 6.3 0 0 1 6.3 6.3c0 3.7-2.8 6.9-6.3 6.9s-6.3-3.2-6.3-6.9A6.3 6.3 0 0 1 12 2.5z" />
      <path d="M12 15.7l-1.1 2.1h2.2L12 20.3" />
    </>
  ),
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </>
  ),
  leaf: (
    <>
      <path d="M4.5 19.5C4.5 10 11 4 20 4c0 9.5-6.5 15.5-15.5 15.5z" />
      <path d="M4.5 19.5C8 13.5 12.5 9.5 17.5 6.8" />
    </>
  ),
  blocks: (
    <>
      <rect x="3" y="4.5" width="8" height="6" rx="1" />
      <rect x="13" y="4.5" width="8" height="6" rx="1" />
      <rect x="8" y="13.5" width="8" height="6" rx="1" />
    </>
  ),
  tent: (
    <>
      <path d="M12 4L2.5 20h19L12 4z" />
      <path d="M12 12l-4 8" />
      <path d="M12 12l4 8" />
    </>
  ),
  grill: (
    <>
      <path d="M4 10.5h16v3.5a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-3.5z" />
      <path d="M2 10.5h20" />
      <path d="M9.5 6.5c0-1.5 1-2 1-3.5M14.5 6.5c0-1.5 1-2 1-3.5" />
    </>
  ),
  truck: (
    <>
      <rect x="1" y="4" width="14" height="12" rx="1" />
      <path d="M15 9h4l3.5 3.5V16H15V9z" />
      <circle cx="5.5" cy="18.5" r="2.2" />
      <circle cx="18.5" cy="18.5" r="2.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  star: (
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  ),
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  droplet: <path d="M12 2.7s6.5 7 6.5 11.3a6.5 6.5 0 0 1-13 0C5.5 9.7 12 2.7 12 2.7z" />,
  speaker: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <circle cx="12" cy="14.5" r="3.5" />
      <circle cx="12" cy="7" r="1.2" />
    </>
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  ladder: <path d="M8 3v18M16 3v18M8 7.5h8M8 12h8M8 16.5h8" />,
  saw: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2.1 2.1M15.9 15.9L18 18M18 6l-2.1 2.1M8.1 15.9L6 18" />
    </>
  ),
  box: (
    <>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>
  ),
  dollar: (
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  penTool: (
    <>
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </>
  ),
  arrowRight: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  arrowLeft: (
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>
  ),
  chevronLeft: <polyline points="15 18 9 12 15 6" />,
  chevronRight: <polyline points="9 18 15 12 9 6" />,
};

export default function Icon({ name, size, className = "", ...rest }) {
  const shape = ICONS[name];
  if (!shape) return null;

  const classes = ["icon", size === "sm" && "icon-sm", size === "lg" && "icon-lg", className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg className={classes} viewBox="0 0 24 24" aria-hidden="true" {...rest}>
      {shape}
    </svg>
  );
}

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 12c-11.6 0-21 7.8-21 17.4 0 5.5 3 10.4 7.8 13.6L16.5 52l9.6-4.9c1.9.4 3.9.7 5.9.7 11.6 0 21-7.8 21-17.4S43.6 12 32 12z"
        fill="currentColor"
      />
      <path
        d="M24 30.5l5.5 5.5L41 24.5"
        stroke="#fff"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GoogleMark() {
  return (
    <svg className="icon icon-sm" viewBox="0 0 24 24" style={{ stroke: "none" }} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3a7.24 7.24 0 0 1-10.79-3.8H1.28v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.16 7.16 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.98 11.98 0 0 0 1.28 6.62l3.99 3.09A7.24 7.24 0 0 1 12 4.75z"
      />
    </svg>
  );
}

export function Stars({ count = 5 }) {
  return (
    <div className="testi-stars">
      {Array.from({ length: count }, (_, i) => (
        <Icon key={i} name="star" size="sm" />
      ))}
    </div>
  );
}
