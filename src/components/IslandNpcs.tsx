"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";
import { CORE_EXCLUSION_RADIUS } from "@/lib/gameConfig";
import { CREW_ROLES, normalizeCrewList } from "@/lib/crew";

type NpcKind = "bot" | "scout" | "sprout" | "orb";

interface NpcSeed {
  /** Stable React key (crew id) */
  key: string;
  crewId: string;
  name: string;
  kind: NpcKind;
  angle: number;
  radius: number;
  speed: number;
  phase: number;
  hue: string;
  selected: boolean;
  /** Prefer this site when assigned */
  homeBuilding?: { x: number; z: number };
}

interface CircleObstacle {
  x: number;
  z: number;
  r: number;
}

/** Must match Scene.tsx rock layout */
const ROCK_OBSTACLES: CircleObstacle[] = Array.from({ length: 5 }, (_, i) => {
  const a = (i * Math.PI * 2) / 5;
  return {
    x: Math.sin(a) * 2.5,
    z: Math.cos(a) * 2.5,
    r: 0.55,
  };
});

/** Observatory core footprint — keep in sync with place exclusion + small walk pad */
const CORE_MIN_R = CORE_EXCLUSION_RADIUS + 0.15;
const ISLAND_MAX_R = 3.25;
const BUILDING_R = 0.75;
const NPC_PAD = 0.12;

function dist2(ax: number, az: number, bx: number, bz: number) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

function clampRing(x: number, z: number, minR: number, maxR: number) {
  const r = Math.sqrt(x * x + z * z) || 0.001;
  if (r < minR) {
    const s = minR / r;
    return { x: x * s, z: z * s };
  }
  if (r > maxR) {
    const s = maxR / r;
    return { x: x * s, z: z * s };
  }
  return { x, z };
}

function pushOutOfCircle(
  x: number,
  z: number,
  ox: number,
  oz: number,
  radius: number
) {
  const d2 = dist2(x, z, ox, oz);
  const need = radius * radius;
  if (d2 >= need || d2 < 1e-8) {
    // if exactly on center, nudge out
    if (d2 < 1e-8) {
      return { x: ox + radius, z: oz };
    }
    return null;
  }
  const d = Math.sqrt(d2);
  const s = radius / d;
  return { x: ox + (x - ox) * s, z: oz + (z - oz) * s };
}

/** Resolve a point so it stays on walkable ring and outside obstacles */
function resolveWalkable(
  x: number,
  z: number,
  buildings: { x: number; z: number }[],
  iterations = 6
) {
  let p = clampRing(x, z, CORE_MIN_R, ISLAND_MAX_R);

  for (let n = 0; n < iterations; n++) {
    let moved = false;

    // Core is already handled by min ring, but re-clamp
    const before = p;
    p = clampRing(p.x, p.z, CORE_MIN_R, ISLAND_MAX_R);
    if (p.x !== before.x || p.z !== before.z) moved = true;

    for (const rock of ROCK_OBSTACLES) {
      const out = pushOutOfCircle(
        p.x,
        p.z,
        rock.x,
        rock.z,
        rock.r + NPC_PAD
      );
      if (out) {
        p = out;
        moved = true;
      }
    }

    for (const b of buildings) {
      const out = pushOutOfCircle(p.x, p.z, b.x, b.z, BUILDING_R + NPC_PAD);
      if (out) {
        p = out;
        moved = true;
      }
    }

    p = clampRing(p.x, p.z, CORE_MIN_R, ISLAND_MAX_R);
    if (!moved) break;
  }

  return p;
}

function isWalkable(
  x: number,
  z: number,
  buildings: { x: number; z: number }[]
) {
  const r = Math.sqrt(x * x + z * z);
  if (r < CORE_MIN_R + 0.02 || r > ISLAND_MAX_R - 0.02) return false;

  for (const rock of ROCK_OBSTACLES) {
    if (dist2(x, z, rock.x, rock.z) < (rock.r + NPC_PAD) ** 2) return false;
  }
  for (const b of buildings) {
    if (dist2(x, z, b.x, b.z) < (BUILDING_R + NPC_PAD) ** 2) return false;
  }
  return true;
}

function pickWalkableTarget(
  buildings: { x: number; z: number }[],
  preferNear?: { x: number; z: number },
  attempts = 24
) {
  for (let i = 0; i < attempts; i++) {
    let x: number;
    let z: number;
    if (preferNear && i < attempts / 2) {
      // Ring around a point (building vicinity) — not on top of it
      const a = Math.random() * Math.PI * 2;
      const dist = BUILDING_R + 0.45 + Math.random() * 0.55;
      x = preferNear.x + Math.cos(a) * dist;
      z = preferNear.z + Math.sin(a) * dist;
    } else {
      const a = Math.random() * Math.PI * 2;
      // Safe band between core and rim
      const rad =
        CORE_MIN_R +
        0.2 +
        Math.random() * (ISLAND_MAX_R - CORE_MIN_R - 0.35);
      x = Math.cos(a) * rad;
      z = Math.sin(a) * rad;
    }

    const resolved = resolveWalkable(x, z, buildings);
    if (isWalkable(resolved.x, resolved.z, buildings)) {
      return resolved;
    }
  }

  // Guaranteed fallback: cardinal mid-ring slot away from rocks
  const a = Math.random() * Math.PI * 2;
  return resolveWalkable(
    Math.cos(a) * 2.85,
    Math.sin(a) * 2.85,
    buildings
  );
}

function NpcBody({
  kind,
  color,
  corrupted,
}: {
  kind: NpcKind;
  color: string;
  corrupted: boolean;
}) {
  const c = corrupted ? "#64748b" : color;
  const eye = corrupted ? "#ef4444" : "#f8fafc";

  if (kind === "scout") {
    return (
      <group>
        <mesh position={[0, 0.12, 0]}>
          <capsuleGeometry args={[0.08, 0.12, 4, 8]} />
          <meshStandardMaterial color={c} roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshStandardMaterial color={c} roughness={0.4} />
        </mesh>
        <mesh position={[0.035, 0.3, 0.07]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial
            color={eye}
            emissive={eye}
            emissiveIntensity={0.8}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[-0.035, 0.3, 0.07]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial
            color={eye}
            emissive={eye}
            emissiveIntensity={0.8}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color={corrupted ? "#ef4444" : "#fbbf24"}
            emissive={corrupted ? "#ef4444" : "#fbbf24"}
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
      </group>
    );
  }

  if (kind === "sprout") {
    return (
      <group>
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial color={c} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <coneGeometry args={[0.08, 0.16, 6]} />
          <meshStandardMaterial
            color={corrupted ? "#78716c" : "#4ade80"}
            roughness={0.55}
          />
        </mesh>
        <mesh position={[0.05, 0.1, 0.08]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial
            color={eye}
            emissive={eye}
            emissiveIntensity={0.6}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[-0.05, 0.1, 0.08]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial
            color={eye}
            emissive={eye}
            emissiveIntensity={0.6}
            toneMapped={false}
          />
        </mesh>
      </group>
    );
  }

  if (kind === "orb") {
    return (
      <group>
        <mesh position={[0, 0.22, 0]}>
          <icosahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial
            color={c}
            emissive={c}
            emissiveIntensity={corrupted ? 0.2 : 0.55}
            metalness={0.4}
            roughness={0.25}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.22, 0.11]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color={eye}
            emissive={eye}
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.11, 16]} />
          <meshBasicMaterial
            color={c}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.18, 0.1, 0.18]} />
        <meshStandardMaterial
          color={c}
          metalness={0.55}
          roughness={0.3}
          emissive={c}
          emissiveIntensity={corrupted ? 0.1 : 0.25}
        />
      </mesh>
      <mesh position={[0, 0.28, 0.06]}>
        <boxGeometry args={[0.12, 0.04, 0.04]} />
        <meshStandardMaterial
          color={eye}
          emissive={corrupted ? "#ef4444" : "#22d3ee"}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.015, 6, 16]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.7}
          emissive={corrupted ? "#ef4444" : "#38bdf8"}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

function SingleNpc({ seed }: { seed: NpcSeed }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const selectCrewId = useGameStore((s) => s.selectCrewId);
  const pointerDown = useRef({ x: 0, y: 0 });

  const start = useMemo(() => {
    // Spawn only on safe mid-ring, not inside rocks/core
    return resolveWalkable(
      Math.cos(seed.angle) * seed.radius,
      Math.sin(seed.angle) * seed.radius,
      []
    );
  }, [seed.angle, seed.radius]);

  const pos = useRef({ x: start.x, z: start.z });
  const target = useRef({ x: start.x, z: start.z });
  const wait = useRef(0.4 + seed.phase * 0.3);
  const heading = useRef(seed.angle);
  const stuck = useRef(0);

  useFrame((state, delta) => {
    if (!group.current) return;
    const st = useGameStore.getState();
    const status = st.status;
    const corrupted = st.islandState === "corrupted";
    const isBreak = status === "break";
    const isFocus = status === "running" || status === "paused";

    const buildings = st.placedBuildings.map((b) => ({
      x: b.position[0],
      z: b.position[2],
    }));

    // Always keep current pos legal (buildings may have been placed)
    {
      const fixed = resolveWalkable(pos.current.x, pos.current.z, buildings);
      pos.current.x = fixed.x;
      pos.current.z = fixed.z;
    }

    let speedMul = 1;
    if (corrupted) speedMul = 1.35;
    else if (isBreak) speedMul = 1.25;
    else if (isFocus) speedMul = 0.5;

    wait.current -= delta;

    if (wait.current <= 0) {
      if (corrupted) {
        target.current = pickWalkableTarget(buildings);
        // Prefer outer ring when fleeing
        const outer = pickWalkableTarget(buildings);
        const r = Math.sqrt(outer.x * outer.x + outer.z * outer.z);
        if (r < 2.7) {
          target.current = resolveWalkable(
            outer.x * 1.15,
            outer.z * 1.15,
            buildings
          );
        } else {
          target.current = outer;
        }
        wait.current = 1.4 + Math.random() * 1.4;
      } else if (seed.homeBuilding) {
        // Assigned crew: orbit their job site
        target.current = pickWalkableTarget(buildings, seed.homeBuilding);
        wait.current = isBreak
          ? 1.0 + Math.random()
          : isFocus
            ? 2.8 + Math.random() * 2
            : 1.8 + Math.random() * 1.5;
      } else if (isFocus && buildings.length > 0 && Math.random() > 0.35) {
        const b = buildings[Math.floor(Math.random() * buildings.length)];
        target.current = pickWalkableTarget(buildings, b);
        wait.current = 2.5 + Math.random() * 2.5;
      } else {
        target.current = pickWalkableTarget(buildings);
        wait.current = isBreak
          ? 0.9 + Math.random() * 1.1
          : 1.6 + Math.random() * 2.2;
      }

      // If target still invalid, skip
      if (!isWalkable(target.current.x, target.current.z, buildings)) {
        target.current = pickWalkableTarget(buildings);
      }
    }

    // If target became illegal (new building), re-pick
    if (!isWalkable(target.current.x, target.current.z, buildings)) {
      target.current = pickWalkableTarget(buildings);
    }

    const dx = target.current.x - pos.current.x;
    const dz = target.current.z - pos.current.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const moving = dist > 0.08;

    if (moving) {
      const step = seed.speed * speedMul * delta;
      const move = Math.min(step, dist);
      const tryX = pos.current.x + (dx / dist) * move;
      const tryZ = pos.current.z + (dz / dist) * move;

      // Try full step, then slide axes if blocked
      let next = resolveWalkable(tryX, tryZ, buildings);
      if (!isWalkable(next.x, next.z, buildings)) {
        const onlyX = resolveWalkable(tryX, pos.current.z, buildings);
        const onlyZ = resolveWalkable(pos.current.x, tryZ, buildings);
        if (isWalkable(onlyX.x, onlyX.z, buildings)) next = onlyX;
        else if (isWalkable(onlyZ.x, onlyZ.z, buildings)) next = onlyZ;
        else {
          stuck.current += delta;
          if (stuck.current > 0.6) {
            target.current = pickWalkableTarget(buildings);
            stuck.current = 0;
            wait.current = 0.2;
          }
          next = resolveWalkable(pos.current.x, pos.current.z, buildings);
        }
      } else {
        stuck.current = 0;
      }

      // Don't allow huge jumps through obstacles
      const jumped = dist2(next.x, next.z, pos.current.x, pos.current.z);
      if (jumped > (step * 2.5) ** 2) {
        next = resolveWalkable(pos.current.x, pos.current.z, buildings);
        target.current = pickWalkableTarget(buildings);
        wait.current = 0.15;
      }

      pos.current.x = next.x;
      pos.current.z = next.z;
      heading.current = Math.atan2(dx, dz);
    }

    const t = state.clock.elapsedTime + seed.phase;
    let y = 0.32;
    if (seed.kind === "bot") {
      y = 0.45 + Math.sin(t * (isBreak ? 3 : 2)) * 0.06;
    } else if (moving) {
      y = 0.32 + Math.abs(Math.sin(t * 8 * speedMul)) * 0.04;
    } else if (isBreak) {
      y = 0.32 + Math.abs(Math.sin(t * 4)) * 0.05;
    }

    group.current.position.set(pos.current.x, y, pos.current.z);

    const targetY = heading.current;
    const cur = group.current.rotation.y;
    let diff = targetY - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    group.current.rotation.y = cur + diff * Math.min(1, delta * 6);

    if (body.current) {
      if (isBreak && !corrupted) {
        body.current.rotation.y = Math.sin(t * 2.5) * 0.4;
        body.current.position.y = Math.abs(Math.sin(t * 3)) * 0.04;
      } else if (corrupted) {
        body.current.rotation.z = Math.sin(t * 12) * 0.08;
        body.current.position.y = 0;
      } else {
        body.current.rotation.y = THREE.MathUtils.lerp(
          body.current.rotation.y,
          0,
          delta * 3
        );
        body.current.rotation.z = THREE.MathUtils.lerp(
          body.current.rotation.z,
          0,
          delta * 3
        );
        body.current.position.y = THREE.MathUtils.lerp(
          body.current.position.y,
          0,
          delta * 3
        );
      }
    }
  });

  const corrupted = useGameStore((s) => s.islandState === "corrupted");

  return (
    <group
      ref={group}
      onPointerDown={(e) => {
        pointerDown.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        const dx = e.clientX - pointerDown.current.x;
        const dy = e.clientY - pointerDown.current.y;
        if (dx * dx + dy * dy > 64) return;
        e.stopPropagation();
        selectCrewId(seed.crewId);
      }}
    >
      {/* Invisible hit volume for easy taps */}
      <mesh position={[0, 0.25, 0]} visible={false}>
        <sphereGeometry args={[0.35, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <group ref={body}>
        <NpcBody kind={seed.kind} color={seed.hue} corrupted={corrupted} />
      </group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 12]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
      {seed.selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.28, 24]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

export default function IslandNpcs() {
  const crewRaw = useGameStore((s) => s.crew);
  const buildings = useGameStore((s) => s.placedBuildings);
  const selectedCrewId = useGameStore((s) => s.selectedCrewId);
  const crew = normalizeCrewList(crewRaw);

  const seeds = useMemo<NpcSeed[]>(() => {
    // Only real crew walk the island — slots grow with observatory level
    return crew.map((member, i) => {
      const roleDef = CREW_ROLES[member.role] ?? CREW_ROLES.worker;
      const kind: NpcKind = roleDef.body;
      let homeBuilding: { x: number; z: number } | undefined;
      if (member.assignedBuildingId) {
        const b = buildings.find((x) => x.id === member.assignedBuildingId);
        if (b) homeBuilding = { x: b.position[0], z: b.position[2] };
      }

      const radius = 2.65 + (i % 4) * 0.1;
      return {
        key: member.id,
        crewId: member.id,
        name: member.name,
        kind,
        angle: (i / Math.max(crew.length, 1)) * Math.PI * 2 + 0.35,
        radius,
        speed:
          kind === "bot"
            ? 0.5
            : kind === "scout"
              ? 0.62
              : kind === "orb"
                ? 0.42
                : 0.38,
        phase: i * 1.7,
        hue: roleDef.hue,
        selected: selectedCrewId === member.id,
        homeBuilding,
      };
    });
  }, [crew, buildings, selectedCrewId]);

  return (
    <group>
      {seeds.map((s) => (
        <SingleNpc key={s.key} seed={s} />
      ))}
    </group>
  );
}
