"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";

export function AnimatedHeader({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, {
      opacity: [0, 1],
      translateY: [-16, 0],
      duration: 700,
      easing: "easeOutExpo",
    });
  }, []);

  return (
    <h1
      ref={ref}
      style={{ opacity: 0 }}
      className="text-lg font-semibold text-white"
    >
      {children}
    </h1>
  );
}
