import { useEffect, useRef, useState } from "react";
/** A discrete lesson stop changes the pose, then leaves playback paused. */
export function useCoursePose(target: number, enabled: boolean) {
  const [value, setValue] = useState(target),
    current = useRef(target);
  useEffect(() => {
    if (
      !enabled ||
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      current.current = target;
      setValue(target);
      return;
    }
    const from = current.current,
      start = performance.now();
    let frame = 0,
      last = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 500);
      if (now - last >= 30 || t === 1) {
        const eased = t * t * (3 - 2 * t);
        current.current = from + (target - from) * eased;
        setValue(current.current);
        last = now;
      }
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);
  return value;
}
