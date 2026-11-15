/**
 * Accasa wordmark and mark, drawn as monoline paths (no font dependency).
 * The first "a" sits under a roof, so the letter reads as a house with a round window: "a casa",
 * home. The name joins "acción" and "casa".
 */

const STROKE = 5;

/** "a": a round bowl with its stem on the right, 15 units wide. `left` is the bowl's left edge. */
const letterA = (left: number) =>
  `M${left + 15} 16.5V31.5M${left + 15} 24A7.5 7.5 0 1 0 ${left} 24A7.5 7.5 0 1 0 ${left + 15} 24`;
/** "c": the same bowl, open to the right. */
const letterC = (left: number) => `M${left + 13.25} 19.18A7.5 7.5 0 1 0 ${left + 13.25} 28.82`;
const letterS =
  "M13 19C12 17.3 10.2 16.5 8 16.5C5.1 16.5 3.2 17.9 3.2 20.1C3.2 22.4 5.3 23.2 8.1 23.9C11.1 24.6 13.4 25.6 13.4 28C13.4 30.3 11.3 31.5 8.2 31.5C5.6 31.5 3.5 30.4 2.6 28.6";
/** Gable over the first "a" (its center is x = 10). */
const roof = "M4 9L10 4L16 9";

// Letter positions: each letter starts 8.5 units after the previous one ends (7.5 after an open "c").
const glyphs = [letterA(2.5), letterC(26), letterC(46.75), letterA(67.5)];
const S_SHIFT = 91 - 2.6;
const LAST_A = 13.4 + S_SHIFT + 8.5;
const WIDTH = Math.ceil(LAST_A + 15 + 2.5);

type WordmarkProps = {
  /** Accessible name. Pass an empty string when a visible label already names the link. */
  title?: string;
  className?: string;
};

export function Wordmark({ title = "Accasa", className }: WordmarkProps) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} 34`}
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
        {glyphs.map((d) => (
          <path key={d} d={d} />
        ))}
        <path d={letterS} transform={`translate(${S_SHIFT} 0)`} />
        <path d={letterA(LAST_A)} />
      </g>
      <path d={roof} stroke="var(--accent)" />
    </svg>
  );
}

/** The a-house on its own, for the app icon and tight spaces. */
export function Mark({ title = "Accasa", className }: WordmarkProps) {
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
      <g transform="translate(14 6.25)" stroke="var(--accent-ink)" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d={letterA(2.5)} />
        <path d={roof} />
      </g>
    </svg>
  );
}
