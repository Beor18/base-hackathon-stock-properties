/**
 * Seña wordmark and mark, drawn as monoline paths (no font dependency).
 * The tilde of the ñ is a roof, so the letter reads as a house: an arch for a door under a gable.
 */

const STROKE = 5;

const letterS =
  "M13 19C12 17.3 10.2 16.5 8 16.5C5.1 16.5 3.2 17.9 3.2 20.1C3.2 22.4 5.3 23.2 8.1 23.9C11.1 24.6 13.4 25.6 13.4 28C13.4 30.3 11.3 31.5 8.2 31.5C5.6 31.5 3.5 30.4 2.6 28.6";
const letterE = "M21.9 24H36.9A7.5 7.5 0 1 0 34.9 29.2";
const letterN = "M45.4 31.5V16.5M45.4 23C45.4 19.2 48.2 16.5 51.9 16.5C55.6 16.5 58.4 19.2 58.4 23V31.5";
const roof = "M45.9 9L51.9 4L57.9 9";
const letterA = "M81.9 16.5V31.5M81.9 24A7.5 7.5 0 1 0 66.9 24A7.5 7.5 0 1 0 81.9 24";

type WordmarkProps = {
  /** Accessible name. Pass an empty string when a visible label already names the link. */
  title?: string;
  className?: string;
};

export function Wordmark({ title = "Seña", className }: WordmarkProps) {
  return (
    <svg
      viewBox="0 0 85 34"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      fill="none"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g stroke="currentColor">
        <path d={letterS} />
        <path d={letterE} />
        <path d={letterN} />
        <path d={letterA} />
      </g>
      <path d={roof} stroke="var(--accent)" />
    </svg>
  );
}

/** The ñ-house on its own, for the app icon and tight spaces. */
export function Mark({ title = "Seña", className }: WordmarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      fill="none"
    >
      <rect width="48" height="48" rx="13" fill="var(--accent)" />
      <g
        transform="translate(-27.9 6.25)"
        stroke="var(--accent-ink)"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={letterN} />
        <path d={roof} />
      </g>
    </svg>
  );
}
