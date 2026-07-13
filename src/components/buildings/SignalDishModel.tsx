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

export default function SignalDishModel({
  isGhost = false,
  level = 1,
}: {
  isGhost?: boolean;
  level?: number;
}) {
  const isCorrupted = useGameStore((s) => s.islandState === "corrupted");
  const dishRef = useRef<THREE.Group>(null);
  const dish2Ref = useRef<THREE.Group>(null);
  const tier = buildingTier(level);

  const color = isCorrupted
    ? "#f87171"
    : tier === 3
      ? "#fda4af"
      : tier === 2
        ? "#fb7185"
        : "#f43f5e";
  const opacity = isGhost ? 0.5 : 1;
  const scale = TIER_SCALE[tier];
  const dishR = tier === 3 ? 0.58 : tier === 2 ? 0.5 : 0.42;
  const mastH = tier === 3 ? 0.7 : tier === 2 ? 0.55 : 0.45;

  useFrame((state) => {
    if (dishRef.current) {
      dishRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
      dishRef.current.rotation.x =
        -0.4 + Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (dish2Ref.current) {
      dish2Ref.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.5 + 1.2) * 0.45 + Math.PI;
      dish2Ref.current.rotation.x =
        -0.35 + Math.cos(state.clock.elapsedTime * 0.35) * 0.08;
    }
  });

  return (
    <group scale={scale}>
      {/* Base */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry
          args={[
            tier === 3 ? 0.35 : 0.25,
            tier === 3 ? 0.5 : 0.4,
            tier === 3 ? 0.5 : 0.4,
            8,
          ]}
        />
        <meshStandardMaterial
          color={isCorrupted ? "#1e293b" : tier === 3 ? "#1c1917" : "#334155"}
          metalness={0.6}
          roughness={0.35}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>

      {tier >= 2 && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.52, 24]} />
          <meshStandardMaterial
            color={TIER_ACCENT[tier]}
            emissive={TIER_ACCENT[tier]}
            emissiveIntensity={0.45}
            metalness={0.85}
            transparent={isGhost}
            opacity={opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Mast */}
      <mesh position={[0, 0.35 + mastH / 2, 0]}>
        <cylinderGeometry
          args={[
            tier === 3 ? 0.05 : 0.06,
            tier === 3 ? 0.08 : 0.08,
            mastH,
            6,
          ]}
        />
        <meshStandardMaterial
          color={tier === 3 ? TIER_ACCENT[3] : "#64748b"}
          metalness={0.85}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>

      {/* Primary dish */}
      <group ref={dishRef} position={[0, 0.55 + mastH * 0.55, 0]}>
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <sphereGeometry
            args={[dishR, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2.2]}
          />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isGhost ? 0.2 : 0.7 + tier * 0.3}
            metalness={0.5}
            roughness={0.25}
            side={THREE.DoubleSide}
            transparent={isGhost}
            opacity={opacity}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.12, 0.12]}>
          <sphereGeometry args={[tier === 3 ? 0.1 : 0.08, 10, 10]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2.2}
            toneMapped={false}
            transparent={isGhost}
            opacity={opacity}
          />
        </mesh>
      </group>

      {/* Second dish T2+ */}
      {tier >= 2 && (
        <group
          ref={dish2Ref}
          position={[0.15, 0.45 + mastH * 0.35, -0.1]}
          scale={0.65}
        >
          <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <sphereGeometry
              args={[dishR, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2.2]}
            />
            <meshStandardMaterial
              color={TIER_ACCENT[tier]}
              emissive={TIER_ACCENT[tier]}
              emissiveIntensity={0.8}
              metalness={0.5}
              side={THREE.DoubleSide}
              transparent={isGhost}
              opacity={opacity}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}

      {/* T3 array pods */}
      {tier === 3 &&
        [0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.42, 0.35, Math.sin(a) * 0.42]}
            >
              <boxGeometry args={[0.1, 0.14, 0.1]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#fbbf24"
                emissiveIntensity={0.9}
                metalness={0.7}
                transparent={isGhost}
                opacity={opacity}
                toneMapped={false}
              />
            </mesh>
          );
        })}

      {!isGhost && (
        <Sparkles
          position={[0, 1, 0]}
          count={8 + tier * 6}
          scale={1.3 + tier * 0.35}
          size={1.1}
          speed={0.35}
          color={color}
        />
      )}
    </group>
  );
}
