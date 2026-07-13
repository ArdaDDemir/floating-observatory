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

export default function DataTowerModel({
  isGhost = false,
  level = 1,
}: {
  isGhost?: boolean;
  level?: number;
}) {
  const isCorrupted = useGameStore((s) => s.islandState === "corrupted");
  const crystalRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const nodesRef = useRef<THREE.Group>(null);
  const tier = buildingTier(level);

  const crystalColor = isCorrupted
    ? "#ef4444"
    : tier === 3
      ? "#e879f9"
      : tier === 2
        ? "#c084fc"
        : "#a855f7";
  const accent = isCorrupted
    ? "#7f1d1d"
    : tier === 3
      ? "#fbbf24"
      : tier === 2
        ? "#7c3aed"
        : "#6d28d9";
  const baseColor = isCorrupted ? "#1e293b" : "#475569";
  const panel = isCorrupted
    ? "#0f172a"
    : tier === 3
      ? "#1e1b4b"
      : "#312e81";
  const opacity = isGhost ? 0.5 : 1;
  const scale = TIER_SCALE[tier];
  const towerH = tier === 3 ? 1.45 : tier === 2 ? 1.15 : 0.9;
  const crystalSize = tier === 3 ? 0.42 : tier === 2 ? 0.36 : 0.3;
  const finCount = tier === 3 ? 6 : tier === 2 ? 4 : 3;
  const nodeCount = tier === 3 ? 6 : tier === 2 ? 4 : 0;

  useFrame((state) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += 0.015 + tier * 0.008;
      crystalRef.current.position.y =
        towerH +
        0.45 +
        Math.sin(state.clock.elapsedTime * 2) * 0.08;
    }
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity =
        (isGhost ? 0.2 : 0.3 + tier * 0.08) +
        Math.sin(state.clock.elapsedTime * 4) * 0.1;
    }
    if (nodesRef.current) {
      nodesRef.current.rotation.y = state.clock.elapsedTime * 0.6;
    }
  });

  return (
    <group scale={scale}>
      {/* Base — multi-layer at higher tiers */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry
          args={[
            tier === 3 ? 0.62 : 0.5,
            tier === 3 ? 0.7 : 0.55,
            0.12,
            tier === 3 ? 8 : 6,
          ]}
        />
        <meshStandardMaterial
          color={panel}
          metalness={0.6}
          roughness={0.35}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>
      {tier >= 2 && (
        <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.58, 24]} />
          <meshStandardMaterial
            color={TIER_ACCENT[tier]}
            emissive={TIER_ACCENT[tier]}
            emissiveIntensity={0.4}
            metalness={0.8}
            transparent={isGhost}
            opacity={opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Shaft segments for T2/T3 */}
      <mesh position={[0, towerH / 2 + 0.1, 0]}>
        <cylinderGeometry
          args={[
            tier === 3 ? 0.18 : 0.22,
            tier === 3 ? 0.4 : 0.38,
            towerH,
            tier === 3 ? 8 : 6,
          ]}
        />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.65}
          roughness={0.3}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>

      {tier >= 2 && (
        <mesh position={[0, towerH * 0.45, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.1, 8]} />
          <meshStandardMaterial
            color={accent}
            metalness={0.7}
            emissive={crystalColor}
            emissiveIntensity={0.3}
            transparent={isGhost}
            opacity={opacity}
          />
        </mesh>
      )}

      {/* Fins */}
      {Array.from({ length: finCount }).map((_, i) => {
        const a = (i / finCount) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * (tier === 3 ? 0.38 : 0.32),
              towerH * 0.55,
              Math.sin(a) * (tier === 3 ? 0.38 : 0.32),
            ]}
            rotation={[0, a, tier === 3 ? 0.25 : 0.4]}
          >
            <boxGeometry
              args={[0.06, towerH * (tier === 3 ? 0.65 : 0.5), 0.16]}
            />
            <meshStandardMaterial
              color={accent}
              metalness={0.5}
              roughness={0.4}
              emissive={crystalColor}
              emissiveIntensity={isGhost ? 0.1 : 0.25 + tier * 0.15}
              transparent={isGhost}
              opacity={opacity}
            />
          </mesh>
        );
      })}

      {/* Crystal cluster */}
      <mesh ref={crystalRef} position={[0, towerH + 0.45, 0]}>
        <octahedronGeometry args={[crystalSize, tier === 3 ? 1 : 0]} />
        <meshStandardMaterial
          color={crystalColor}
          emissive={crystalColor}
          emissiveIntensity={isGhost ? 0.5 : 1.3 + tier * 0.35}
          toneMapped={false}
          transparent={isGhost}
          opacity={opacity}
        />
      </mesh>

      {/* T3 side crystals */}
      {tier === 3 &&
        [0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + 0.4;
          return (
            <mesh
              key={`side-${i}`}
              position={[
                Math.cos(a) * 0.35,
                towerH + 0.35,
                Math.sin(a) * 0.35,
              ]}
            >
              <octahedronGeometry args={[0.14, 0]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#fbbf24"
                emissiveIntensity={1.2}
                toneMapped={false}
                transparent={isGhost}
                opacity={opacity}
              />
            </mesh>
          );
        })}

      {/* Beam */}
      <mesh ref={beamRef} position={[0, towerH + (tier === 3 ? 1.15 : 0.9), 0]}>
        <cylinderGeometry
          args={[
            tier === 3 ? 0.06 : 0.04,
            tier === 3 ? 0.06 : 0.04,
            tier === 3 ? 1.0 : 0.7,
            8,
          ]}
        />
        <meshStandardMaterial
          color={crystalColor}
          emissive={crystalColor}
          emissiveIntensity={2.2}
          transparent
          opacity={0.35}
          toneMapped={false}
        />
      </mesh>

      {/* Orbiting nodes T2+ */}
      {nodeCount > 0 && (
        <group ref={nodesRef} position={[0, towerH + 0.35, 0]}>
          {Array.from({ length: nodeCount }).map((_, i) => {
            const a = (i / nodeCount) * Math.PI * 2;
            return (
              <mesh
                key={`node-${i}`}
                position={[
                  Math.cos(a) * (0.5 + tier * 0.08),
                  0,
                  Math.sin(a) * (0.5 + tier * 0.08),
                ]}
              >
                <sphereGeometry args={[0.05 + tier * 0.01, 8, 8]} />
                <meshStandardMaterial
                  color={crystalColor}
                  emissive={crystalColor}
                  emissiveIntensity={1.6}
                  toneMapped={false}
                  transparent={isGhost}
                  opacity={opacity}
                />
              </mesh>
            );
          })}
        </group>
      )}

      {!isGhost && (
        <Sparkles
          position={[0, towerH + 0.3, 0]}
          count={10 + tier * 8}
          scale={1.4 + tier * 0.3}
          size={1}
          speed={0.2}
          color={crystalColor}
        />
      )}
    </group>
  );
}
