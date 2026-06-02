import React from 'react';

/**
 * Shared SVG <defs> for the Planning Wall design system — mounted ONCE near the
 * app root. Provides:
 *   - The hand-drawn "roughen" filters (#cc-rough, #cc-rough2) referenced by
 *     the .cc-rough / .cc-rough2 CSS classes to give marker strokes a wobble.
 *   - A sprite of hand-drawn line icons referenced via <use href="#cc-i-…"/>.
 *
 * Keeping these in one hidden <svg> avoids redefining filters per element and
 * lets any component pull an icon without importing an icon library.
 */
export const PlanningWallDefs: React.FC = () => (
  <svg
    width="0"
    height="0"
    aria-hidden="true"
    focusable="false"
    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
  >
    <defs>
      <filter id="cc-rough">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" />
      </filter>
      <filter id="cc-rough2">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2" />
      </filter>

      {/* hand-drawn icon sprites — 24x24 viewBox, stroke = currentColor */}
      <g id="cc-i-coin">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5v9 M9.6 9.6c0-1.2 1.1-1.8 2.4-1.8s2.4.7 2.4 1.7c0 2.4-4.8 1.2-4.8 3.6 0 1 1.1 1.8 2.4 1.8s2.4-.7 2.4-1.8" />
      </g>
      <g id="cc-i-bolt"><path d="M13.5 3.5 6 13h5l-1 7.5 7.5-9.5h-5z" /></g>
      <g id="cc-i-shield">
        <path d="M12 3.5 5.5 6v5.5c0 4 2.8 7 6.5 8.5 3.7-1.5 6.5-4.5 6.5-8.5V6z" />
        <path d="M9.2 12l2 2 3.6-4" />
      </g>
      <g id="cc-i-heart"><path d="M12 19.5C6.5 15.5 4 12.6 4 9.5 4 7 6 5.3 8.2 5.3c1.6 0 2.9.9 3.8 2.2.9-1.3 2.2-2.2 3.8-2.2C18 5.3 20 7 20 9.5c0 3.1-2.5 6-8 10z" /></g>
      <g id="cc-i-people">
        <circle cx="9" cy="8.5" r="2.8" />
        <circle cx="16" cy="9.5" r="2.2" />
        <path d="M4.5 18.5c0-3 2-4.8 4.5-4.8s4.5 1.8 4.5 4.8 M14 14c2.2 0 4 1.6 4.5 4.3" />
      </g>
      <g id="cc-i-brief">
        <rect x="4" y="8" width="16" height="11" rx="2" />
        <path d="M9 8V6.5C9 5.7 9.6 5 10.5 5h3c.9 0 1.5.7 1.5 1.5V8 M4 13h16" />
      </g>
      <g id="cc-i-leaf"><path d="M5 19c0-8 6-13 14-13 0 8-5 14-13 13.5 M7 17c2-4 5-6.5 9-8" /></g>
      <g id="cc-i-star"><path d="M12 4l2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.7 5.4-.7z" /></g>
      <g id="cc-i-sun">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 3.5v2.3 M12 18.2v2.3 M3.5 12h2.3 M18.2 12h2.3 M6 6l1.6 1.6 M16.4 16.4 18 18 M18 6l-1.6 1.6 M7.6 16.4 6 18" />
      </g>
      <g id="cc-i-anchor">
        <circle cx="12" cy="6" r="2" />
        <path d="M12 8v11 M7 12H5c0 4 3 6.5 7 6.5s7-2.5 7-6.5h-2 M8.5 11.5 12 14l3.5-2.5" />
      </g>
      <g id="cc-i-wave"><path d="M3.5 9c1.5 0 1.5 1.5 3 1.5S8 9 9.5 9 11 10.5 12.5 10.5 14 9 15.5 9 17 10.5 18.5 10.5 20 9 20.5 9 M3.5 14c1.5 0 1.5 1.5 3 1.5S8 14 9.5 14 11 15.5 12.5 15.5 14 14 15.5 14 17 15.5 18.5 15.5 20 14 20.5 14" /></g>
      <g id="cc-i-flag"><path d="M6 20V4 M6 5h11l-2.5 3.5L17 12H6" /></g>
      <g id="cc-i-clock"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></g>
      <g id="cc-i-share">
        <circle cx="6.5" cy="12" r="2.3" />
        <circle cx="17" cy="6.5" r="2.3" />
        <circle cx="17" cy="17.5" r="2.3" />
        <path d="M8.6 11l6.3-3.4 M8.6 13l6.3 3.4" />
      </g>
      <g id="cc-i-bag">
        <path d="M6 8h12l-1 11.5H7z M9 8V6.5C9 5 10.3 4 12 4s3 1 3 2.5V8" />
      </g>
      <g id="cc-i-palette">
        <path d="M12 3.5c-4.7 0-8.5 3.6-8.5 8 0 3 2.4 4.5 4.5 4.5 1.4 0 2-1 2-2 0-.7-.4-1-.4-1.6 0-.8.7-1.4 1.6-1.4H13c2.7 0 4.5-1.8 4.5-4.5 0-3.6-2.5-7-5.5-7z" />
        <circle cx="7.5" cy="11" r="1" /><circle cx="11" cy="8" r="1" /><circle cx="15" cy="9.5" r="1" />
      </g>
      <g id="cc-i-layers">
        <path d="M12 4 3.5 8.5 12 13l8.5-4.5z M4 12.5 12 16.5l8-4 M4 16 12 20l8-4" />
      </g>
      <g id="cc-i-save">
        <path d="M5 5h11l3 3v11H5z M8 5v5h7V5 M8 19v-5h8v5" />
      </g>
      <g id="cc-i-reset"><path d="M5.5 12a6.5 6.5 0 1 0 2-4.7 M7 4.5V8h3.5" /></g>
      <g id="cc-i-help"><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.5c0-1.5 1.2-2.4 2.6-2.4s2.4.9 2.4 2.2c0 2-2.5 1.8-2.5 3.7 M12 16.5v.3" /></g>
      <g id="cc-i-login"><path d="M13 4h5v16h-5 M4 12h10 M10.5 8.5 14 12l-3.5 3.5" /></g>
      <g id="cc-i-x"><path d="M6 6l12 12 M18 6 6 18" /></g>
      <g id="cc-i-sound"><path d="M5 9.5h3l4-3v11l-4-3H5z M15.5 9c1.2 1 1.2 5 0 6 M17.8 7c2.4 2 2.4 8 0 10" /></g>
      <g id="cc-i-mute"><path d="M5 9.5h3l4-3v11l-4-3H5z M16 9.5l4 5 M20 9.5l-4 5" /></g>
      <g id="cc-i-build"><path d="M14.5 5.5l4 4-9.5 9.5-4 .5.5-4z M12.5 7.5l4 4" /></g>
      <g id="cc-i-trash"><path d="M5.5 7h13 M9 7V5.5C9 5 9.4 4.5 10 4.5h4c.6 0 1 .5 1 1V7 M7 7l1 12h8l1-12" /></g>
      <g id="cc-i-trophy">
        <path d="M8 4.5h8v4c0 2.5-1.8 4.5-4 4.5s-4-2-4-4.5z M8 6H5.5c0 2.5 1.5 3.5 3 3.5 M16 6h2.5c0 2.5-1.5 3.5-3 3.5 M10.5 13.5 10 17h4l-.5-3.5 M8 19.5h8" />
      </g>
      <g id="cc-i-crown"><path d="M4 8l3 8h10l3-8-4.5 3.5L12 5 8.5 11.5z M5 18.5h14" /></g>
      <g id="cc-i-warn"><path d="M12 4 3 19h18z M12 10v4 M12 16.5v.3" /></g>
      <g id="cc-i-cloud"><path d="M7 17.5c-2.2 0-3.5-1.5-3.5-3.3 0-2 1.7-3.3 3.4-3.2.4-2.3 2.3-3.8 4.6-3.8 2.6 0 4.3 1.9 4.5 4 1.8 0 3 1.3 3 3.1 0 1.8-1.4 3.2-3.4 3.2z" /></g>
      <g id="cc-i-check"><path d="M5 12.5 10 17 19 6.5" /></g>
    </defs>
  </svg>
);

/**
 * Convenience icon component. Usage: <CcIcon name="bolt" /> with optional
 * className for sizing/color, and solid for filled icons (e.g. flag).
 */
export const CcIcon: React.FC<{
  name: string;
  className?: string;
  solid?: boolean;
}> = ({ name, className = '', solid = false }) => (
  <svg
    className={`cc-ico${solid ? ' cc-ico-solid' : ''} ${className}`}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <use href={`#cc-i-${name}`} />
  </svg>
);
