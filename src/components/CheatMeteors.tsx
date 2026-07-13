"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

/** Deterministic pseudo-random from seed (render-safe) */
function hash01(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Cinematic punishment when save integrity fails.
 */
export default function CheatMeteors() {
  const pulseAt = useGameStore((s) => s.meteorPulseAt);
  const cheater = useGameStore((s) => s.cheaterStrike);
  const group = useRef<THREE.Group>(null);

  const rocks = useMemo(() => {
    const seed = pulseAt || 1;
    return Array.from({ length: 14 }, (_, i) => {
      const a = hash01(seed + i * 3.1);
      const b = hash01(seed + i * 7.7);
      const c = hash01(seed + i * 11.3);
      const d = hash01(seed + i * 19.9);
      const e = hash01(seed + i * 23.5);
      return {
        id: i,
        x: (a - 0.5) * 10,
        z: (b - 0.5) * 10,
        delay: c * 1.2,
        speed: 4 + d * 5,
        size: 0.12 + e * 0.22,
        spin: (a - 0.5) * 0.2,
      };
    });
  }, [pulseAt]);

  useFrame(() => {
    if (!group.current || !pulseAt) {
      if (group.current) group.current.visible = false;
      return;
    }
    const age = (Date.now() - pulseAt) / 1000;
    const active = cheater && age < 4.5;
    group.current.visible = active;
    if (!active) return;

    group.current.children.forEach((child, i) => {
      const r = rocks[i];
      if (!r || !(child instanceof THREE.Mesh)) return;
      const t = Math.max(0, age - r.delay);
      const y = 12 - t * r.speed;
      child.position.set(r.x, Math.max(-1, y), r.z);
      child.rotation.x += r.spin;
      child.rotation.z += r.spin * 0.7;
      const mat = child.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = y < 2 ? 2.5 : 1.2;
    });
  });

  if (!pulseAt) return null;

  return (
    <group ref={group} visible={false}>
      {rocks.map((r) => (
        <mesh key={r.id} position={[r.x, 12, r.z]}>
          <dodecahedronGeometry args={[r.size, 0]} />
          <meshStandardMaterial
            color="#fb923c"
            emissive="#ef4444"
            emissiveIntensity={1.5}
            metalness={0.4}
            roughness={0.5}
            toneMapped={false}
          />
        </mesh>
      ))}
      <pointLight
        position={[0, 8, 0]}
        color="#ff6b35"
        intensity={cheater ? 3 : 0}
        distance={25}
      />
    </group>
  );
}
