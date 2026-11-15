/**
 * The person's profile picture: a little house façade drawn from their account address, in the
 * colors of the painted streets of La Boca and Viejo San Juan. The same account always gets the
 * same house, and two accounts almost never share one. Pure SVG, so it works offline and needs no
 * image service.
 */

const SKIES = ["#fde7b0", "#cfe8f3", "#f9d3df", "#d8eedb", "#e4dcf5", "#ffe0c7"];
const WALLS = ["#e4572e", "#f5b83d", "#1f9e89", "#2f6fd6", "#b3165a", "#6aa84f", "#f08a24", "#7b4fc9", "#e85d9a", "#2a8c5a"];
const TRIMS = ["#15232b", "#ffffff", "#f5b83d", "#1f9e89", "#b3165a", "#2f6fd6"];
const ROOF_COLORS = ["#15232b", "#c4532d", "#8a3b2a"];
const GLASS = ["#cfe8f3", "#fff3c4"];

type Traits = {
  sky: string;
  wall: string;
  trim: string;
  roofColor: string;
  roof: "gable" | "flat" | "arch";
  windows: 1 | 2;
  archedDoor: boolean;
  extra: "palm" | "sun" | "flowers";
  glass: string;
};

/** Reads the address as bytes and turns each one into a trait. Not a hash: the address already is one. */
export function houseTraits(seed: string): Traits {
  const hex = seed.replace(/^0x/i, "").padEnd(40, "0");
  const byte = (index: number) => parseInt(hex.slice(index * 2, index * 2 + 2), 16) || 0;
  const pick = <T,>(list: readonly T[], index: number) => list[byte(index) % list.length];

  const wall = pick(WALLS, 1);
  // Trim must stand out against the wall.
  const trims = TRIMS.filter((color) => color !== wall);
  return {
    sky: pick(SKIES, 0),
    wall,
    trim: trims[byte(2) % trims.length],
    roofColor: pick(ROOF_COLORS, 4),
    roof: pick(["gable", "flat", "arch"] as const, 3),
    windows: byte(5) % 2 === 0 ? 2 : 1,
    archedDoor: byte(6) % 2 === 0,
    extra: pick(["palm", "sun", "flowers"] as const, 7),
    glass: pick(GLASS, 8),
  };
}

export function HouseAvatar({ seed, label, className = "" }: { seed: string; label: string; className?: string }) {
  const house = houseTraits(seed);
  const top = house.roof === "flat" ? 44 : 52;
  const doorX = house.windows === 2 ? 52 : 37;
  const windowSpots = house.windows === 2 ? [35, 71] : [63];

  return (
    <span className={`inline-block shrink-0 overflow-hidden ${className}`}>
      <svg viewBox="0 0 120 120" role="img" aria-label={label} className="block size-full">
        <rect width="120" height="120" fill={house.sky} />

        {house.extra === "sun" && <circle cx="95" cy="24" r="10" fill={house.wall === "#f5b83d" ? "#ffffff" : "#f5b83d"} />}

        <rect y="98" width="120" height="22" fill="#15232b" opacity="0.14" />

        {house.roof === "gable" && <path d="M22 54L60 22l38 32z" fill={house.roofColor} />}
        {house.roof === "arch" && <path d="M28 54C34 26 86 26 92 54z" fill={house.roofColor} />}

        <rect x="30" y={top} width="60" height={100 - top} fill={house.wall} />
        {house.roof === "flat" && (
          <>
            <rect x="26" y="38" width="68" height="7" rx="1.5" fill={house.trim} />
            <rect x="30" y="45" width="60" height="3" fill="#15232b" opacity="0.18" />
          </>
        )}

        {windowSpots.map((x) => (
          <g key={x}>
            <rect x={x - 4} y="60" width="4" height="17" fill={house.trim} />
            <rect x={x + 14} y="60" width="4" height="17" fill={house.trim} />
            <rect x={x} y="60" width="14" height="17" rx="1.5" fill={house.glass} />
            <path d={`M${x + 7} 60v17M${x} 68.5h14`} stroke={house.wall} strokeWidth="1.6" />
          </g>
        ))}

        {house.archedDoor ? (
          <path d={`M${doorX} 100V80a8 8 0 0116 0v20z`} fill={house.trim} />
        ) : (
          <rect x={doorX} y="74" width="16" height="26" rx="1" fill={house.trim} />
        )}
        <circle cx={doorX + 12} cy="89" r="1.4" fill={house.trim === "#ffffff" ? "#15232b" : "#ffffff"} />

        {house.extra === "flowers" && (
          <g fill="#e85d9a">
            {[
              [30, top + 2, 5],
              [37, top - 1, 4],
              [26, top + 9, 4],
              [33, top + 8, 3.5],
            ].map(([cx, cy, r]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} stroke="#ffffff" strokeWidth="0.8" />
            ))}
          </g>
        )}

        {house.extra === "palm" && (
          <g>
            <path d="M104 100c0-14-1-26-5-38" stroke="#8a5a2b" strokeWidth="4" fill="none" strokeLinecap="round" />
            <g fill="#2a8c5a">
              <path d="M99 62c-8-6-16-6-22-2 8 0 15 2 22 2z" />
              <path d="M99 62c2-9-2-15-8-18 3 6 5 12 8 18z" />
              <path d="M99 62c7-7 14-8 19-5-7 0-13 2-19 5z" />
              <path d="M99 62c6 1 11 6 12 12-4-5-8-8-12-12z" />
            </g>
          </g>
        )}
      </svg>
    </span>
  );
}
