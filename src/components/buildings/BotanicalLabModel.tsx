"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";
import {
  buildingTier,
  TIER_ACCENT,
  TIER_SCALE,
} from "@/lib/buildingVisual";

export default function BotanicalLabModel({
  isGhost = false,
  level = 1,
}: {
  isGhost?: boolean;
  level?: number;
}) {
  const isCorrupted = useGameStore((s) => s.islandState === "corrupted");
  const canopyRef = useRef<THREE.Group>(null);
  const bloomRef = useRef<THREE.Mesh>(null);
  const tier = buildingTier(level);

  const leaf = isCorrupted
    ? "#64748b"
    : tier === 3
      ? "#4ade80"
      : tier === 2
        ? "#22c55e"
        : "#16a34a";
  const leafDark = isCorrupted ? "#334155" : "#15803d";
  const stem = isCorrupted ? "#1e293b" : "#365314";
  const pot = isCorrupted
    ? "#0f172a"
    : tier === 3
      ? "#292524"
      : tier === 2
        ? "#44403c"
        : "#57534e";
  const glow = isCorrupted
    ? "#ef4444"
    : tier === 3
      ? "#a3e635"
      : "#4ade80";
  const opacity = isGhost ? 0.5 : 1;
  const scale = TIER_SCALE[tier];
  const leafCount = tier === 3 ? 8 : tier === 2 ? 6 : 5;
  const flowerCount = tier === 3 ? 3 : tier === 2 ? 1 : 1;

  useFrame((state) => {
    if (canopyRef.current) {
      canopyRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
    }
    if (bloomRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.06;
      bloomRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group scale={scale}>
      {/* Pot — glass greenhouse rim at T2+ */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry
          args={[
            tier === 3 ? 0.52 : 0.45,
            tier === 3 ? 0.62 : 0.55,
            tier === 3 ? 0.42 : 0.36,
            tier === 3 ? 10 : 8,
          ]}
        />
        <meshStandardMaterial
          color={pot}
          roughness={0.85}
          metalness={tier === 3 ? 0.35 : 0.1}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, tier === 3 ? 0.45 : 0.4, 0]}>
        <cylinderGeometry
          args={[
            tier === 3 ? 0.58 : 0.5,
            tier === 3 ? 0.52 : 0.45,
            0.12,
            8,
          ]}
        />
        <meshStandardMaterial
          color={isCorrupted ? "#1e293b" : tier === 3 ? "#a8a29e" : "#57534e"}
          roughness={0.7}
          metalness={tier >= 2 ? 0.4 : 0.1}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>

      {/* T2+ greenhouse hoop */}
      {tier >= 2 && (
        <mesh position={[0, 0.85, 0]}>
          <sphereGeometry
            args={[0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshStandardMaterial
            color={isCorrupted ? "#334155" : "#e0f2fe"}
            transparent
            opacity={isGhost ? 0.15 : 0.18}
            metalness={0.2}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Soil */}
      <mesh position={[0, tier === 3 ? 0.48 : 0.42, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 8]} />
        <meshStandardMaterial
          color={isCorrupted ? "#1c1917" : "#3f2a14"}
          roughness={1}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>

      {/* Stem(s) */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry
          args={[0.06, 0.09, tier === 3 ? 0.85 : 0.7, 6]}
        />
        <meshStandardMaterial
          color={stem}
          roughness={0.6}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>
      {tier === 3 &&
        [-0.18, 0.18].map((ox, i) => (
          <mesh key={i} position={[ox, 0.7, 0.05]}>
            <cylinderGeometry args={[0.04, 0.06, 0.55, 5]} />
            <meshStandardMaterial
              color={stem}
              roughness={0.6}
              transparent={isGhost}
              opacity={opacity}
            />
          </mesh>
        ))}

      {/* Canopy */}
      <group ref={canopyRef} position={[0, tier === 3 ? 1.2 : 1.05, 0]}>
        {Array.from({ length: leafCount }).map((_, i) => {
          const a = (i / leafCount) * Math.PI * 2;
          const r = tier === 3 ? 0.34 : 0.28;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * r, 0.05, Math.sin(a) * r]}
              rotation={[0.5, a, 0.35]}
            >
              <sphereGeometry
                args={[tier === 3 ? 0.32 : 0.28, 8, 8, 0, Math.PI]}
              />
              <meshStandardMaterial
                color={i % 2 === 0 ? leaf : leafDark}
                roughness={0.55}
                transparent={isGhost}
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}

        {/* Blooms */}
        {Array.from({ length: flowerCount }).map((_, i) => {
          const a = (i / flowerCount) * Math.PI * 2;
          const r = flowerCount === 1 ? 0 : 0.15;
          return (
            <mesh
              key={`f-${i}`}
              ref={i === 0 ? bloomRef : undefined}
              position={[
                Math.cos(a) * r,
                0.35 + (tier === 3 ? 0.05 : 0),
                Math.sin(a) * r,
              ]}
            >
              <icosahedronGeometry args={[tier === 3 ? 0.16 : 0.18, 0]} />
              <meshStandardMaterial
                color={i === 0 ? glow : TIER_ACCENT[tier]}
                emissive={i === 0 ? glow : TIER_ACCENT[tier]}
                emissiveIntensity={isGhost ? 0.4 : 1.2 + tier * 0.3}
                toneMapped={false}
                transparent={isGhost}
                opacity={opacity}
              />
            </mesh>
          );
        })}
      </group>

      {/* Tier base rings */}
      {Array.from({ length: tier }).map((_, i) => (
        <mesh
          key={`ring-${i}`}
          position={[0, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.55 + i * 0.14, 0.62 + i * 0.14, 24]} />
          <meshBasicMaterial
            color={tier === 3 ? TIER_ACCENT[3] : glow}
            transparent
            opacity={isGhost ? 0.25 : 0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {!isGhost && (
        <Sparkles
          position={[0, 1.1, 0]}
          count={6 + tier * 6}
          scale={1.4 + tier * 0.3}
          size={1.2}
          speed={0.25}
          color={glow}
        />
      )}
    </group>
  );
}
