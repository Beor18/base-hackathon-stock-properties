"use client";

import { useSearchParams } from "next/navigation";

export function Frames() {
  const params = useSearchParams();
  const path = params.get("path") ?? "/es";
  const widths = (params.get("w") ?? "375").split(",").map(Number);
  const height = Number(params.get("h") ?? 812);
  // `s=` repeated renders several preview states side by side at the first width.
  const states = params.getAll("s");
  const frames = states.length
    ? states.map((state, index) => ({ key: `${index}-${state}`, width: widths[0], src: `/${path.split("/")[1]}/dev/preview?s=${state}` }))
    : widths.map((width) => ({ key: String(width), width, src: path }));
  return (
    <div className="fixed inset-0 z-50 flex items-start gap-4 overflow-auto bg-[#888] p-4">
      {frames.map(({ key, width, src }) => (
        <iframe
          key={key}
          title={`${src} at ${width}px`}
          src={src}
          style={{ width, height, flex: "none" }}
          className="bg-white"
        />
      ))}
    </div>
  );
}
