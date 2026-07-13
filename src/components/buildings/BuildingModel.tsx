"use client";

import type { BuildingType } from "@/lib/gameConfig";
import { buildingTier, TIER_ACCENT } from "@/lib/buildingVisual";
import EnergyCoreModel from "./EnergyCoreModel";
import DataTowerModel from "./DataTowerModel";
import BotanicalLabModel from "./BotanicalLabModel";
import ShieldModel from "./ShieldModel";
import SignalDishModel from "./SignalDishModel";
import * as THREE from "three";

export default function BuildingModel({
  type,
  isGhost = false,
  level = 1,
  selected = false,
}: {
  type: BuildingType;
  isGhost?: boolean;
  level?: number;
  selected?: boolean;
}) {
  const tier = buildingTier(level);
  const accent = TIER_ACCENT[tier];

  return (
    <group>
      {type === "energy_core" && (
        <EnergyCoreModel isGhost={isGhost} level={level} />
      )}
      {type === "data_tower" && (
        <DataTowerModel isGhost={isGhost} level={level} />
      )}
      {type === "botanical_lab" && (
        <BotanicalLabModel isGhost={isGhost} level={level} />
      )}
      {type === "shield_generator" && (
        <ShieldModel isGhost={isGhost} level={level} />
      )}
      {type === "signal_dish" && (
        <SignalDishModel isGhost={isGhost} level={level} />
      )}

      {/* Hit volume */}
      {!isGhost && (
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 1.8, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* Selection ring */}
      {selected && !isGhost && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.92, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.9} />
        </mesh>
      )}

      {/* Tier pips under building (always visible when placed) */}
      {!isGhost && (
        <group position={[0, 0.04, 0]}>
          {Array.from({ length: 3 }).map((_, i) => {
            const lit = i < tier;
            const x = (i - 1) * 0.16;
            return (
              <mesh
                key={i}
                position={[x, 0, 0.55]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <circleGeometry args={[0.05, 12]} />
                <meshBasicMaterial
                  color={lit ? accent : "#334155"}
                  transparent
                  opacity={lit ? 0.95 : 0.4}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}
