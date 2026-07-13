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

export default function ShieldModel({
  isGhost = false,
  level = 1,
}: {
  isGhost?: boolean;
  level?: number;
}) {
  const isCorrupted = useGameStore((s) => s.islandState === "corrupted");
  const domeRef = useRef<THREE.Mesh>(null);
  const dome2Ref = useRef<THREE.Mesh>(null);
  const tier = buildingTier(level);

  const color = isCorrupted
    ? "#ef4444"
    : tier === 3
      ? "#7dd3fc"
      : tier === 2
        ? "#38bdf8"
        : "#0ea5e9";
  const opacity = isGhost ? 0.45 : tier === 3 ? 0.42 : 0.32;
  const scale = TIER_SCALE[tier];
  const domeR = tier === 3 ? 0.72 : tier === 2 ? 0.62 : 0.52;

  useFrame((state) => {
    if (domeRef.current) {
      domeRef.current.rotation.y += 0.008;
      const p = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      domeRef.current.scale.setScalar(p);
    }
    if (dome2Ref.current) {
      dome2Ref.current.rotation.y -= 0.012;
    }
  });

  return (
    <group scale={scale}>
      {/* Fortified base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry
          args={[
            tier === 3 ? 0.55 : 0.45,
            tier === 3 ? 0.7 : 0.55,
            tier === 3 ? 0.32 : 0.25,
            tier === 3 ? 8 : 8,
          ]}
        />
        <meshStandardMaterial
          color={isCorrupted ? "#0f172a" : tier === 3 ? "#0c4a6e" : "#1e3a5f"}
          metalness={0.7}
          roughness={0.3}
          transparent={isGhost}
          opacity={isGhost ? 0.5 : 1}
        />
      </mesh>

      {tier >= 2 && (
        <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.62, 28]} />
          <meshStandardMaterial
            color={TIER_ACCENT[tier]}
            emissive={TIER_ACCENT[tier]}
            emissiveIntensity={0.5}
            metalness={0.85}
            transparent={isGhost}
            opacity={isGhost ? 0.5 : 1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Struts T2+ */}
      {tier >= 2 &&
        [0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.42, 0.42, Math.sin(a) * 0.42]}
              rotation={[0, -a, 0.35]}
            >
              <boxGeometry args={[0.05, 0.4, 0.05]} />
              <meshStandardMaterial
                color={TIER_ACCENT[tier]}
                metalness={0.8}
                transparent={isGhost}
                opacity={isGhost ? 0.5 : 1}
              />
            </mesh>
          );
        })}

      {/* Main dome */}
      <mesh ref={domeRef} position={[0, 0.55 + tier * 0.08, 0]}>
        <sphereGeometry
          args={[domeR, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isGhost ? 0.3 : 1.0 + tier * 0.35}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Outer dome T2+ */}
      {tier >= 2 && (
        <mesh ref={dome2Ref} position={[0, 0.55 + tier * 0.08, 0]}>
          <sphereGeometry
            args={[domeR + 0.12, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={isGhost ? 0.12 : 0.15}
            side={THREE.DoubleSide}
            toneMapped={false}
            wireframe={tier === 3}
          />
        </mesh>
      )}

      {/* T3 crown projectors */}
      {tier === 3 &&
        [0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh
              key={`proj-${i}`}
              position={[Math.cos(a) * 0.55, 0.95, Math.sin(a) * 0.55]}
            >
              <octahedronGeometry args={[0.08, 0]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#fbbf24"
                emissiveIntensity={1.5}
                toneMapped={false}
                transparent={isGhost}
                opacity={isGhost ? 0.5 : 1}
              />
            </mesh>
          );
        })}

      {!isGhost && (
        <Sparkles
          position={[0, 0.7, 0]}
          count={6 + tier * 6}
          scale={1.3 + tier * 0.35}
          size={1}
          speed={0.3}
          color={color}
        />
      )}
    </group>
  );
}
