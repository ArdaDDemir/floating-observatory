"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sparkles, Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/store/useGameStore";
import * as THREE from "three";
import BuildingModel from "@/components/buildings/BuildingModel";
import IslandNpcs from "@/components/IslandNpcs";
import CheatMeteors from "@/components/CheatMeteors";
import {
  GRID_SNAP,
  ISLAND_PLACE_RADIUS,
  CORE_EXCLUSION_RADIUS,
} from "@/lib/gameConfig";
import { observatoryLevel } from "@/lib/meta";
import {
  sparkleCount,
  isMobileDevice,
  prefersReducedMotion,
} from "@/lib/perf";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useGraphicsProfile } from "@/hooks/useGraphicsProfile";

const CORE_COLORS: Record<string, string> = {
  default: "#3b82f6",
  gold: "#fbbf24",
  rose: "#f43f5e",
  cyan: "#22d3ee",
};

/** Dreamy orbiting lights + aurora rings — only during break */
function BreakAtmosphere() {
  const groupRef = useRef<THREE.Group>(null);
  const orbA = useRef<THREE.Mesh>(null);
  const orbB = useRef<THREE.Mesh>(null);
  const orbC = useRef<THREE.Mesh>(null);
  const aurora1 = useRef<THREE.Mesh>(null);
  const aurora2 = useRef<THREE.Mesh>(null);
  const status = useGameStore((s) => s.status);
  const active = status === "break";

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Fade in/out via scale + group visibility logic
    const target = active ? 1 : 0;
    groupRef.current.scale.lerp(
      new THREE.Vector3(target, target, target),
      delta * 1.5
    );
    groupRef.current.visible = groupRef.current.scale.x > 0.02;

    if (!active && groupRef.current.scale.x < 0.05) return;

    const t = state.clock.elapsedTime;
    if (orbA.current) {
      orbA.current.position.set(
        Math.cos(t * 0.55) * 5.2,
        1.2 + Math.sin(t * 0.8) * 0.6,
        Math.sin(t * 0.55) * 5.2
      );
    }
    if (orbB.current) {
      orbB.current.position.set(
        Math.cos(t * 0.4 + 2.1) * 4.4,
        2.4 + Math.cos(t * 0.7) * 0.5,
        Math.sin(t * 0.4 + 2.1) * 4.4
      );
    }
    if (orbC.current) {
      orbC.current.position.set(
        Math.cos(t * 0.65 + 4) * 3.6,
        0.8 + Math.sin(t * 1.1) * 0.4,
        Math.sin(t * 0.65 + 4) * 3.6
      );
    }
    if (aurora1.current) {
      aurora1.current.rotation.z = t * 0.12;
      aurora1.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.3) * 0.08;
      const mat = aurora1.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + Math.sin(t * 1.2) * 0.1;
    }
    if (aurora2.current) {
      aurora2.current.rotation.z = -t * 0.08;
      aurora2.current.rotation.x = Math.PI / 2.8 + Math.cos(t * 0.25) * 0.1;
      const mat = aurora2.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18 + Math.cos(t * 0.9) * 0.08;
    }
  });

  return (
    <group ref={groupRef} scale={0} visible={false}>
      {/* Soft aurora bands */}
      <mesh ref={aurora1} position={[0, 1.2, 0]}>
        <torusGeometry args={[5.5, 0.08, 8, 64]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={0.25}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={aurora2} position={[0, 0.6, 0]}>
        <torusGeometry args={[6.2, 0.06, 8, 64]} />
        <meshBasicMaterial
          color="#c4b5fd"
          transparent
          opacity={0.18}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Orbiting rest orbs */}
      <mesh ref={orbA}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#67e8f9"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={orbB}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#a78bfa"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={orbC}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#f9a8d4"
          emissive="#f9a8d4"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      <pointLight position={[0, 6, 0]} color="#c4b5fd" intensity={1.2} distance={20} />
      <pointLight position={[4, 2, 3]} color="#67e8f9" intensity={0.8} distance={12} />
      <pointLight position={[-3, 3, -2]} color="#f9a8d4" intensity={0.6} distance={12} />

      <Sparkles
        count={120}
        scale={14}
        size={5}
        speed={0.15}
        opacity={0.9}
        color="#e0f2fe"
      />
      <Sparkles
        count={60}
        scale={10}
        size={3}
        speed={0.25}
        opacity={0.7}
        color="#ddd6fe"
      />
    </group>
  );
}

/** Gentle cinematic auto-orbit during break */
function BreakCameraDrift() {
  const status = useGameStore((s) => s.status);
  const { camera } = useThree();
  const angle = useRef(0);
  const started = useRef(false);

  useFrame((_, delta) => {
    if (status !== "break") {
      started.current = false;
      return;
    }
    if (!started.current) {
      // seed angle from current camera xz
      angle.current = Math.atan2(camera.position.x, camera.position.z);
      started.current = true;
    }
    angle.current += delta * 0.12;
    const r = 15;
    const y = 7 + Math.sin(angle.current * 0.7) * 0.8;
    const tx = Math.sin(angle.current) * r;
    const tz = Math.cos(angle.current) * r;
    camera.position.lerp(new THREE.Vector3(tx, y, tz), delta * 0.6);
    camera.lookAt(0, 0.5, 0);
  });

  return null;
}

function FloatingIsland() {
  const {
    islandState,
    buildMode,
    selectedBuildingType,
    selectedBuildingId,
    relocateMode,
    placedBuildings,
    placeBuilding,
    selectBuildingId,
    clearBuildSelection,
    totalFocusSeconds,
    status,
  } = useGameStore(
    useShallow((s) => ({
      islandState: s.islandState,
      buildMode: s.buildMode,
      selectedBuildingType: s.selectedBuildingType,
      selectedBuildingId: s.selectedBuildingId,
      relocateMode: s.relocateMode,
      placedBuildings: s.placedBuildings,
      placeBuilding: s.placeBuilding,
      selectBuildingId: s.selectBuildingId,
      clearBuildSelection: s.clearBuildSelection,
      totalFocusSeconds: s.stats.totalFocusSeconds,
      status: s.status,
    }))
  );
  const isCorrupted = islandState === "corrupted";
  const isBreak = status === "break";
  const obsLevel = observatoryLevel(totalFocusSeconds).level;
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);

  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(
    null
  );
  const [ghostValid, setGhostValid] = useState(true);

  /** Ignore orbit-drags that would otherwise select / place buildings */
  const pointerDownRef = useRef({ x: 0, y: 0 });
  const wasOrbitDrag = (e: { clientX: number; clientY: number }) => {
    const dx = e.clientX - pointerDownRef.current.x;
    const dy = e.clientY - pointerDownRef.current.y;
    return dx * dx + dy * dy > 64; // ~8px threshold
  };
  const markPointerDown = (e: { clientX: number; clientY: number }) => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  };

  // Stable Three materials for JSX; frame loop mutates via materialsRef only.
  const materials = useMemo(
    () => ({
      dirt: new THREE.MeshStandardMaterial({ color: "#8b5a2b", roughness: 0.9 }),
      surface: new THREE.MeshStandardMaterial({
        color: "#4ade80",
        roughness: 0.8,
      }),
      coreBase: new THREE.MeshStandardMaterial({
        color: "#e2e8f0",
        metalness: 0.5,
        roughness: 0.2,
      }),
      core: new THREE.MeshStandardMaterial({
        color: "#3b82f6",
        emissive: "#3b82f6",
        emissiveIntensity: 1.5,
        toneMapped: false,
      }),
      rings: new THREE.MeshStandardMaterial({
        color: "#94a3b8",
        emissive: "#000000",
        emissiveIntensity: 0,
        metalness: 0.8,
        roughness: 0.2,
      }),
      rocks: new THREE.MeshStandardMaterial({
        color: "#64748b",
        roughness: 0.7,
      }),
      rim: new THREE.MeshStandardMaterial({
        color: "#86efac",
        roughness: 0.6,
        metalness: 0.2,
      }),
    }),
    []
  );
  const materialsRef = useRef(materials);

  const coreRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const islandGroupRef = useRef<THREE.Group>(null);
  const restHaloRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const storeState = useGameStore.getState();
    const isCorruptedNow = storeState.islandState === "corrupted";
    const isBuildingNow = storeState.islandState === "building";
    const isBreakNow = storeState.status === "break";
    const mats = materialsRef.current;

    // Break palette: soft teal / lavender dream
    const tDirt = new THREE.Color(
      isCorruptedNow ? "#1e293b" : isBreakNow ? "#6b4f3a" : "#8b5a2b"
    );
    const tSurface = new THREE.Color(
      isCorruptedNow ? "#475569" : isBreakNow ? "#6ee7b7" : "#4ade80"
    );
    const tCoreBase = new THREE.Color(
      isCorruptedNow ? "#0f172a" : isBreakNow ? "#e0e7ff" : "#e2e8f0"
    );
    const skinHex = CORE_COLORS[storeState.coreSkin] ?? "#3b82f6";
    const tCore = new THREE.Color(
      isCorruptedNow ? "#ff003c" : isBreakNow ? "#a5b4fc" : skinHex
    );
    const tRings = new THREE.Color(
      isCorruptedNow ? "#ff003c" : isBreakNow ? "#c4b5fd" : "#94a3b8"
    );
    const tRocks = new THREE.Color(
      isCorruptedNow ? "#334155" : isBreakNow ? "#94a3b8" : "#64748b"
    );
    const tRim = new THREE.Color(
      isCorruptedNow ? "#7f1d1d" : isBreakNow ? "#5eead4" : "#86efac"
    );

    const lerpSpeed = 2 * delta;

    mats.dirt.color.lerp(tDirt, lerpSpeed);
    mats.surface.color.lerp(tSurface, lerpSpeed);
    mats.coreBase.color.lerp(tCoreBase, lerpSpeed);
    mats.core.color.lerp(tCore, lerpSpeed);
    mats.core.emissive.lerp(tCore, lerpSpeed);
    mats.core.emissiveIntensity = THREE.MathUtils.lerp(
      mats.core.emissiveIntensity,
      isCorruptedNow ? 2.5 : isBreakNow ? 2.8 : 1.5,
      lerpSpeed
    );
    mats.rings.color.lerp(tRings, lerpSpeed);
    mats.rings.emissive.lerp(
      isCorruptedNow
        ? tRings
        : isBreakNow
          ? new THREE.Color("#a78bfa")
          : new THREE.Color("#000000"),
      lerpSpeed
    );
    mats.rings.emissiveIntensity = THREE.MathUtils.lerp(
      mats.rings.emissiveIntensity,
      isCorruptedNow ? 2 : isBreakNow ? 1.4 : 0,
      lerpSpeed
    );
    mats.rocks.color.lerp(tRocks, lerpSpeed);
    mats.rim.color.lerp(tRim, lerpSpeed);

    // Slow island bob / sway extra during break
    if (islandGroupRef.current) {
      const t = state.clock.elapsedTime;
      if (isBreakNow) {
        islandGroupRef.current.rotation.y = Math.sin(t * 0.15) * 0.08;
        islandGroupRef.current.position.y =
          -1 + Math.sin(t * 0.6) * 0.18;
      } else {
        islandGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          islandGroupRef.current.rotation.y,
          0,
          lerpSpeed
        );
        islandGroupRef.current.position.y = THREE.MathUtils.lerp(
          islandGroupRef.current.position.y,
          -1,
          lerpSpeed
        );
      }
    }

    if (coreRef.current) {
      const spin = isBreakNow ? 0.018 : 0.01;
      coreRef.current.rotation.y += spin;
      coreRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * (isBreakNow ? 0.6 : 1)) *
        (isBreakNow ? 0.18 : 0.1);

      let targetScale = 1;
      if (isBreakNow) {
        // calm breathing
        targetScale =
          1.08 + Math.sin(state.clock.elapsedTime * 1.4) * 0.08;
      } else if (isBuildingNow) {
        targetScale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
      } else if (isCorruptedNow) {
        targetScale = 1 + (Math.random() > 0.9 ? Math.random() * 0.1 : 0);
      }

      coreRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        lerpSpeed * 2
      );
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.z -= isBreakNow ? 0.012 : 0.005;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z += isBreakNow ? 0.015 : 0.008;
      ring2Ref.current.rotation.x =
        Math.PI / 4 +
        Math.sin(state.clock.elapsedTime * (isBreakNow ? 0.35 : 0.5)) * 0.1;
    }

    if (restHaloRef.current) {
      const mat = restHaloRef.current.material as THREE.MeshBasicMaterial;
      const targetOp = isBreakNow ? 0.45 : 0;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOp, lerpSpeed);
      restHaloRef.current.rotation.z += delta * 0.2;
      const s =
        1 + Math.sin(state.clock.elapsedTime * 1.5) * (isBreakNow ? 0.06 : 0);
      restHaloRef.current.scale.setScalar(s);
      restHaloRef.current.visible = mat.opacity > 0.02;
    }
  });

  const isTileFree = (x: number, z: number) => {
    if (Math.sqrt(x * x + z * z) < CORE_EXCLUSION_RADIUS) return false;
    return !placedBuildings.some((b) => {
      if (relocateMode && b.id === selectedBuildingId) return false;
      const [bx, , bz] = b.position;
      return Math.round(bx) === x && Math.round(bz) === z;
    });
  };

  return (
    <Float
      speed={reduceMotion ? 0.2 : isBreak ? 1.2 : 2}
      rotationIntensity={reduceMotion ? 0 : isBreak ? 0.35 : 0.15}
      floatIntensity={reduceMotion ? 0.1 : isBreak ? 0.85 : 0.45}
    >
      <group ref={islandGroupRef} position={[0, -1, 0]}>
        <mesh
          position={[0, -2.4, 0]}
          rotation={[Math.PI, 0, 0]}
          material={materials.dirt}
        >
          <coneGeometry args={[3.2, 3.2, 8]} />
        </mesh>
        <mesh
          position={[0, -2, 0]}
          rotation={[Math.PI, 0, 0]}
          material={materials.dirt}
        >
          <coneGeometry args={[4, 4, 8]} />
        </mesh>

        {[...Array(6 + Math.min(6, obsLevel))].map((_, i) => (
          <mesh
            key={`debris-${i}`}
            position={[
              Math.sin(i * 1.2) * 2.2,
              -3.2 - (i % 3) * 0.4,
              Math.cos(i * 1.2) * 2.2,
            ]}
            rotation={[i, i * 0.5, 0]}
            material={materials.rocks}
          >
            <dodecahedronGeometry args={[0.2 + (i % 3) * 0.08, 0]} />
          </mesh>
        ))}

        <mesh position={[0, 0, 0]} material={materials.surface}>
          <cylinderGeometry args={[4.2, 4, 0.5, 8]} />
        </mesh>

        <mesh position={[0, 0.28, 0]} material={materials.rim}>
          <torusGeometry args={[4.05, 0.12, 8, 32]} />
        </mesh>

        {/* Rest halo under core */}
        <mesh
          ref={restHaloRef}
          position={[0, 0.3, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <ringGeometry args={[1.8, 2.6, 48]} />
          <meshBasicMaterial
            color="#a5b4fc"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {obsLevel >= 2 && (
          <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.2, 3.55, 32]} />
            <meshStandardMaterial
              color={isCorrupted ? "#3f3f46" : isBreak ? "#99f6e4" : "#86efac"}
              emissive={isCorrupted ? "#000" : isBreak ? "#2dd4bf" : "#22c55e"}
              emissiveIntensity={isBreak ? 0.55 : 0.25}
              side={THREE.DoubleSide}
              transparent
              opacity={0.7}
            />
          </mesh>
        )}

        {obsLevel >= 3 &&
          [0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            return (
              <mesh
                key={`path-${i}`}
                position={[Math.cos(a) * 2.4, 0.28, Math.sin(a) * 2.4]}
                rotation={[-Math.PI / 2, 0, a]}
              >
                <planeGeometry args={[0.35, 1.6]} />
                <meshStandardMaterial
                  color={isCorrupted ? "#334155" : "#78716c"}
                  roughness={0.9}
                  transparent
                  opacity={0.85}
                />
              </mesh>
            );
          })}

        {obsLevel >= 4 &&
          [0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2;
            return (
              <mesh
                key={`ant-${i}`}
                position={[Math.cos(a) * 3.6, 0.9, Math.sin(a) * 3.6]}
              >
                <cylinderGeometry args={[0.05, 0.08, 1.4, 6]} />
                <meshStandardMaterial
                  color={isCorrupted ? "#450a0a" : "#94a3b8"}
                  metalness={0.7}
                  emissive={
                    isCorrupted ? "#ff003c" : isBreak ? "#a78bfa" : "#38bdf8"
                  }
                  emissiveIntensity={isBreak ? 0.9 : 0.4}
                />
              </mesh>
            );
          })}

        {obsLevel >= 6 && (
          <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.3, 4.7, 48]} />
            <meshStandardMaterial
              color={isCorrupted ? "#1e293b" : "#1e3a5f"}
              emissive={isCorrupted ? "#450a0a" : "#38bdf8"}
              emissiveIntensity={0.2}
              metalness={0.5}
              side={THREE.DoubleSide}
              transparent
              opacity={0.75}
            />
          </mesh>
        )}

        <group position={[0, 1.5, 0]}>
          <mesh position={[0, -0.55, 0]} material={materials.coreBase}>
            <cylinderGeometry args={[1.4, 1.9, 0.9, 8]} />
          </mesh>
          <mesh position={[0, -0.1, 0]} material={materials.coreBase}>
            <cylinderGeometry args={[1.1, 1.35, 0.35, 8]} />
          </mesh>
          <mesh ref={coreRef} position={[0, 1, 0]} material={materials.core}>
            <octahedronGeometry args={[1, 0]} />
          </mesh>
          <mesh
            ref={ringsRef}
            position={[0, 1, 0]}
            rotation={[Math.PI / 3, 0, 0]}
            material={materials.rings}
          >
            <torusGeometry args={[1.8, 0.05, 16, 32]} />
          </mesh>
          <mesh
            ref={ring2Ref}
            position={[0, 1, 0]}
            rotation={[Math.PI / 5, 0.4, 0]}
            material={materials.rings}
          >
            <torusGeometry args={[2.15, 0.03, 12, 40]} />
          </mesh>

          {/* Extra break ring */}
          {isBreak && (
            <mesh position={[0, 1, 0]} rotation={[Math.PI / 2.2, 0.2, 0]}>
              <torusGeometry args={[2.6, 0.025, 8, 48]} />
              <meshStandardMaterial
                color="#67e8f9"
                emissive="#67e8f9"
                emissiveIntensity={1.5}
                transparent
                opacity={0.7}
                toneMapped={false}
              />
            </mesh>
          )}
        </group>

        {[...Array(5)].map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.sin((i * Math.PI * 2) / 5) * 2.5,
              0.45,
              Math.cos((i * Math.PI * 2) / 5) * 2.5,
            ]}
            rotation={[i * 0.4, i * 0.7, 0]}
            material={materials.rocks}
          >
            <dodecahedronGeometry args={[0.35, 0]} />
          </mesh>
        ))}

        {/* Ambient crew — walk / work / play by game mood */}
        <IslandNpcs />

        {isCorrupted && (
          <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 3.5, 8]} />
            <meshBasicMaterial
              color="#ff003c"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              wireframe
            />
          </mesh>
        )}

        {buildMode && (
          <group position={[0, 0.26, 0]}>
            <gridHelper
              args={[
                8,
                8,
                relocateMode ? "#fbbf24" : "#38bdf8",
                relocateMode ? "#d97706" : "#0284c7",
              ]}
            />

            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              visible={false}
              onPointerDown={(e) => {
                markPointerDown(e);
              }}
              onPointerMove={(e) => {
                const placing = !!selectedBuildingType || relocateMode;
                if (!placing) return;
                // Don't steal orbit; only update ghost when placing
                const x = Math.round(e.point.x / GRID_SNAP) * GRID_SNAP;
                const z = Math.round(e.point.z / GRID_SNAP) * GRID_SNAP;
                if (Math.sqrt(x * x + z * z) <= ISLAND_PLACE_RADIUS) {
                  setGhostPos([x, 0, z]);
                  const free = isTileFree(x, z);
                  if (relocateMode && selectedBuildingId) {
                    const self = placedBuildings.find(
                      (b) => b.id === selectedBuildingId
                    );
                    const [sx, , sz] = self?.position ?? [999, 0, 999];
                    const onSelf =
                      Math.round(sx) === x && Math.round(sz) === z;
                    setGhostValid(free || onSelf);
                  } else {
                    setGhostValid(free);
                  }
                } else {
                  setGhostPos(null);
                }
              }}
              onPointerOut={() => setGhostPos(null)}
              onClick={(e) => {
                // Orbit drag started on the island should not place / deselect
                if (wasOrbitDrag(e)) return;
                e.stopPropagation();
                if (
                  (selectedBuildingType || relocateMode) &&
                  ghostPos &&
                  ghostValid
                ) {
                  placeBuilding([ghostPos[0], 0.26, ghostPos[2]]);
                  return;
                }
                if (!selectedBuildingType && !relocateMode) {
                  clearBuildSelection();
                }
              }}
            >
              <circleGeometry args={[4.2, 32]} />
            </mesh>

            {(selectedBuildingType ||
              (relocateMode && selectedBuildingId)) &&
              ghostPos && (
              <group position={ghostPos}>
                <BuildingModel
                  type={
                    selectedBuildingType ??
                    placedBuildings.find((b) => b.id === selectedBuildingId)
                      ?.type ??
                    "energy_core"
                  }
                  isGhost
                  level={
                    relocateMode
                      ? placedBuildings.find(
                          (b) => b.id === selectedBuildingId
                        )?.level ?? 1
                      : 1
                  }
                />
                <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.55, 0.7, 24]} />
                  <meshBasicMaterial
                    color={
                      ghostValid
                        ? relocateMode
                          ? "#fbbf24"
                          : "#22c55e"
                        : "#ef4444"
                    }
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              </group>
            )}
          </group>
        )}

        {placedBuildings.map((building) => (
          <group
            key={building.id}
            position={building.position}
            onPointerDown={(e) => {
              // Track start; do NOT select yet — orbit drag often starts on a building
              markPointerDown(e);
            }}
            onClick={(e) => {
              if (wasOrbitDrag(e)) return;
              // Placing a new type: ignore building clicks
              if (selectedBuildingType) return;
              e.stopPropagation();
              // Direct click → select & open upgrade (works outside build tray too)
              selectBuildingId(building.id);
            }}
          >
            {/* Larger invisible hit for mobile taps */}
            <mesh position={[0, 0.4, 0]} visible={false}>
              <cylinderGeometry args={[0.55, 0.55, 1.2, 12]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
            <BuildingModel
              type={building.type}
              level={building.level}
              selected={selectedBuildingId === building.id}
            />
          </group>
        ))}
      </group>
    </Float>
  );
}

function EventPulseLight() {
  const pulseAt = useGameStore((s) => s.lastEventPulseAt);
  const lightRef = useRef<THREE.PointLight>(null);
  const startRef = useRef(0);

  useFrame(() => {
    if (!lightRef.current || !pulseAt) return;
    if (pulseAt !== startRef.current) {
      startRef.current = pulseAt;
    }
    const age = (Date.now() - pulseAt) / 1000;
    if (age < 0 || age > 1.4) {
      lightRef.current.intensity = 0;
      return;
    }
    const t = 1 - age / 1.4;
    lightRef.current.intensity = t * t * 2.2;
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 5, 0]}
      color="#a5f3fc"
      intensity={0}
      distance={18}
    />
  );
}

export default function Scene() {
  const islandState = useGameStore((s) => s.islandState);
  const skySkin = useGameStore((s) => s.skySkin);
  const status = useGameStore((s) => s.status);
  const graphicsQuality = useGameStore(
    (s) => s.prefs.graphicsQuality ?? "auto"
  );
  const isCorrupted = islandState === "corrupted";
  const isBreak = status === "break";
  const isMobile = useIsMobile();
  const mobileClass = isMobile || isMobileDevice();
  const gfx = useGraphicsProfile(graphicsQuality);
  const shadowsOn = gfx.shadows;

  const sky = isCorrupted
    ? "#020617"
    : isBreak
      ? "#0c1222"
      : skySkin === "dusk"
        ? "#1c1917"
        : skySkin === "void"
          ? "#020617"
          : "#0f172a";

  const ambientSparkles = sparkleCount(
    isCorrupted ? 30 : isBreak ? 160 : 120,
    gfx
  );

  // Phone: camera slightly farther + wider FOV so island fits
  const cameraPos: [number, number, number] = mobileClass
    ? [0, 7.5, 18]
    : [0, 6, 16];

  return (
    <div className="touch-none absolute inset-0 h-full w-full bg-[#020617]">
      <Canvas
        // Object form avoids R3F defaulting to deprecated PCFSoftShadowMap
        shadows={
          shadowsOn
            ? { enabled: true, type: THREE.PCFShadowMap }
            : false
        }
        dpr={[1, gfx.dprMax]}
        camera={{ position: cameraPos, fov: mobileClass ? 50 : 45 }}
        gl={{
          antialias: gfx.antialias,
          powerPreference: gfx.powerPreference,
          alpha: false,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = shadowsOn;
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
        style={{ touchAction: "none" }}
      >
        <color attach="background" args={[sky]} />
        <fog attach="fog" args={[sky, isBreak ? 12 : 10, isBreak ? 42 : 35]} />

        <ambientLight intensity={isCorrupted ? 0.1 : isBreak ? 0.55 : 0.4} />
        <directionalLight
          castShadow={shadowsOn}
          position={[5, 10, 5]}
          intensity={isCorrupted ? 0.3 : isBreak ? 0.7 : 1.2}
          shadow-mapSize={shadowsOn ? [1024, 1024] : [256, 256]}
        />
        <pointLight
          position={[-5, 5, -5]}
          intensity={isCorrupted ? 0.2 : isBreak ? 0.7 : 0.5}
          color={isCorrupted ? "#ff003c" : isBreak ? "#a78bfa" : "#4ade80"}
        />
        <pointLight
          position={[0, 4, 0]}
          intensity={isCorrupted ? 0.4 : isBreak ? 1.4 : 0.8}
          color={isCorrupted ? "#ff003c" : isBreak ? "#67e8f9" : "#60a5fa"}
          distance={14}
        />
        <EventPulseLight />
        {gfx.breakFx && <BreakAtmosphere />}
        {gfx.tier === "high" && <BreakCameraDrift />}
        <CheatMeteors />

        <FloatingIsland />

        <Sparkles
          count={ambientSparkles}
          scale={isBreak ? 14 : 12}
          size={isCorrupted ? 2 : isBreak ? 4 : 3}
          speed={
            gfx.tier === "low"
              ? 0.08
              : isCorrupted
                ? 0.2
                : isBreak
                  ? 0.18
                  : 0.35
          }
          opacity={isCorrupted ? 0.4 : isBreak ? 0.85 : 0.7}
          color={
            isCorrupted ? "#ff003c" : isBreak ? "#e0e7ff" : "#60a5fa"
          }
        />

        <EffectComposer multisampling={gfx.multisampling}>
          <Bloom
            luminanceThreshold={isBreak ? 0.12 : 0.2}
            mipmapBlur
            intensity={
              (isCorrupted ? 2.2 : isBreak ? 2.4 : 1.3) * gfx.bloomIntensity
            }
          />
          <Vignette
            eskil={false}
            offset={0.1}
            darkness={isCorrupted ? 0.8 : isBreak ? 0.45 : 0.6}
          />
        </EffectComposer>

        <OrbitControls
          enablePan={false}
          enableRotate={!isBreak || prefersReducedMotion()}
          enableZoom={!isBreak || prefersReducedMotion()}
          enableDamping
          dampingFactor={mobileClass ? 0.12 : 0.08}
          rotateSpeed={mobileClass ? 0.55 : 0.8}
          zoomSpeed={mobileClass ? 0.55 : 0.9}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={mobileClass ? 10 : 8}
          maxDistance={mobileClass ? 28 : 25}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
      </Canvas>
    </div>
  );
}
