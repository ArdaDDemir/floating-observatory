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

export default function EnergyCoreModel({
  isGhost = false,
  level = 1,
}: {
  isGhost?: boolean;
  level?: number;
}) {
  const isCorrupted = useGameStore((s) => s.islandState === "corrupted");
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const tier = buildingTier(level);

  const coreColor = isCorrupted
    ? "#ff003c"
    : tier === 3
      ? "#fb923c"
      : tier === 2
        ? "#f97316"
        : "#ea580c";
  const baseColor = isCorrupted
    ? "#0f172a"
    : tier === 3
      ? "#1e293b"
      : "#334155";
  const plateColor = isCorrupted
    ? "#1e293b"
    : tier === 3
      ? "#422006"
      : tier === 2
        ? "#1e3a5f"
        : "#1e293b";
  const trim = isCorrupted ? "#7f1d1d" : TIER_ACCENT[tier];
  const opacity = isGhost ? 0.5 : 1;
  const scale = TIER_SCALE[tier];
  const coreR = tier === 3 ? 0.48 : tier === 2 ? 0.42 : 0.36;

  useFrame((state) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += 0.02;
      ring1Ref.current.rotation.y += 0.01;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x -= 0.015;
      ring2Ref.current.rotation.z += 0.02;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y += 0.025;
      ring3Ref.current.rotation.z -= 0.01;
    }
    if (coreRef.current) {
      const pulse =
        1 + Math.sin(state.clock.elapsedTime * (2 + tier)) * (0.03 * tier);
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group scale={scale}>
      {/* Tier pad */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry
          args={[
            tier === 3 ? 0.95 : tier === 2 ? 0.85 : 0.72,
            tier === 3 ? 1.05 : tier === 2 ? 0.95 : 0.82,
            tier === 1 ? 0.12 : 0.16,
            tier === 3 ? 8 : 6,
          ]}
        />
        <meshStandardMaterial
          color={plateColor}
          metalness={0.75}
          roughness={0.25}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>

      {/* Gold rim T3 */}
      {tier >= 2 && (
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[
              tier === 3 ? 0.92 : 0.8,
              tier === 3 ? 1.02 : 0.9,
              32,
            ]}
          />
          <meshStandardMaterial
            color={trim}
            emissive={trim}
            emissiveIntensity={tier === 3 ? 0.8 : 0.35}
            metalness={0.9}
            transparent={isGhost}
            opacity={opacity}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Pedestal — taller at higher tiers */}
      <mesh position={[0, tier === 3 ? 0.38 : 0.28, 0]}>
        <cylinderGeometry
          args={[
            tier === 3 ? 0.5 : 0.55,
            tier === 3 ? 0.72 : 0.7,
            tier === 3 ? 0.42 : 0.28,
            8,
          ]}
        />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.7}
          roughness={0.2}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>

      {/* Pillars T2+ */}
      {tier >= 2 &&
        [0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          const r = 0.55;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * r, 0.45, Math.sin(a) * r]}
            >
              <boxGeometry args={[0.08, tier === 3 ? 0.55 : 0.35, 0.08]} />
              <meshStandardMaterial
                color={trim}
                metalness={0.85}
                emissive={trim}
                emissiveIntensity={0.25}
                transparent={isGhost}
                opacity={opacity}
              />
            </mesh>
          );
        })}

      {/* Glowing core */}
      <mesh ref={coreRef} position={[0, tier === 3 ? 1.05 : 0.85, 0]}>
        <sphereGeometry args={[coreR, 24, 24]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={isGhost ? 0.5 : 1.6 + tier * 0.5}
          toneMapped={false}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>

      {/* Glow shell */}
      <mesh position={[0, tier === 3 ? 1.05 : 0.85, 0]}>
        <sphereGeometry args={[coreR + 0.12, 16, 16]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={0.35}
          transparent
          opacity={isGhost ? 0.12 : 0.22}
          toneMapped={false}
        />
      </mesh>

      {/* Rings */}
      <mesh ref={ring1Ref} position={[0, tier === 3 ? 1.05 : 0.85, 0]}>
        <torusGeometry args={[coreR + 0.28, 0.035, 8, 28]} />
        <meshStandardMaterial
          color={trim}
          metalness={0.85}
          roughness={0.1}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>
      <mesh ref={ring2Ref} position={[0, tier === 3 ? 1.05 : 0.85, 0]}>
        <torusGeometry args={[coreR + 0.48, 0.028, 8, 28]} />
        <meshStandardMaterial
          color={trim}
          metalness={0.85}
          roughness={0.1}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>

      {/* T2 horizontal energy ring */}
      {tier >= 2 && (
        <mesh
          position={[0, tier === 3 ? 1.05 : 0.85, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[coreR + 0.15, 0.022, 8, 24]} />
          <meshStandardMaterial
            color={coreColor}
            emissive={coreColor}
            emissiveIntensity={1.2}
            toneMapped={false}
            transparent={isGhost}
            opacity={opacity}
          />
        </mesh>
      )}

      {/* T3 third orbit + crown spikes */}
      {tier === 3 && (
        <>
          <mesh ref={ring3Ref} position={[0, 1.05, 0]}>
            <torusGeometry args={[0.95, 0.02, 8, 40]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#fbbf24"
              emissiveIntensity={1.4}
              toneMapped={false}
              transparent={isGhost}
              opacity={opacity}
            />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh
                key={`spike-${i}`}
                position={[
                  Math.cos(a) * 0.72,
                  1.05,
                  Math.sin(a) * 0.72,
                ]}
                rotation={[0, -a, Math.PI / 2]}
              >
                <coneGeometry args={[0.05, 0.22, 5]} />
                <meshStandardMaterial
                  color="#fbbf24"
                  emissive="#f59e0b"
                  emissiveIntensity={0.8}
                  metalness={0.9}
                  transparent={isGhost}
                  opacity={opacity}
                />
              </mesh>
            );
          })}
        </>
      )}

      {!isGhost && (
        <Sparkles
          position={[0, tier === 3 ? 1.05 : 0.85, 0]}
          count={8 + tier * 10}
          scale={1.6 + tier * 0.4}
          size={1.2 + tier * 0.3}
          speed={0.35 + tier * 0.1}
          color={coreColor}
        />
      )}
    </group>
  );
}
