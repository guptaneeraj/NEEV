import { useEffect, useRef } from "react";

export function LeafParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-leaf-fall opacity-40"
          style={{
            left: `${Math.random() * 100}%`,
            "--leaf-duration": `${12 + Math.random() * 8}s`,
            "--leaf-delay": `${Math.random() * 10}s`,
            fontSize: `${14 + Math.random() * 10}px`,
          } as React.CSSProperties}
        >
          🍃
        </div>
      ))}
    </div>
  );
}

export function Fireflies({ count = 15 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-firefly rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${3 + Math.random() * 4}px`,
            height: `${3 + Math.random() * 4}px`,
            background: `radial-gradient(circle, rgba(201, 168, 76, 0.9), rgba(232, 181, 71, 0.3))`,
            boxShadow: `0 0 ${6 + Math.random() * 10}px rgba(201, 168, 76, 0.6)`,
            "--firefly-duration": `${3 + Math.random() * 4}s`,
            "--firefly-delay": `${Math.random() * 5}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[
        { size: 300, x: "10%", y: "20%", color: "rgba(122, 158, 106, 0.08)", dur: "20s" },
        { size: 200, x: "70%", y: "60%", color: "rgba(201, 168, 76, 0.06)", dur: "25s" },
        { size: 250, x: "50%", y: "10%", color: "rgba(242, 212, 200, 0.06)", dur: "22s" },
      ].map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float-slow"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color}, transparent)`,
            filter: "blur(40px)",
            animationDuration: orb.dur,
            animationDelay: `${i * 2}s`,
          }}
        />
      ))}
    </div>
  );
}
