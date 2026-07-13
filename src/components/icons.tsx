"use client";

import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Gem,
  Zap,
  Flame,
  Hammer,
  Radio,
  Leaf,
  Shield,
  Antenna,
  Code2,
  BookOpen,
  Target,
  Palette,
  Sparkles,
  Timer,
  Mountain,
  Sunrise,
  Hash,
  Star,
  Orbit,
  ArrowUp,
  PersonStanding,
  Wheat,
  Sun,
  CloudMoon,
  Rainbow,
  Waves,
  Flag,
  X,
  Building2,
  Hexagon,
  Swords,
  CircleDot,
  Stars,
  HelpCircle,
  BarChart3,
  Eye,
  EyeOff,
  FlaskConical,
  Settings2,
  ChevronUp,
  ChevronDown,
  PanelBottomClose,
  PanelBottomOpen,
} from "lucide-react";
import type { IconName } from "@/lib/iconNames";

export type { IconName };

const MAP: Record<IconName, LucideIcon> = {
  crystal: Gem,
  energy: Zap,
  flame: Flame,
  build: Hammer,
  tower: Radio,
  leaf: Leaf,
  shield: Shield,
  signal: Antenna,
  code: Code2,
  study: BookOpen,
  target: Target,
  creative: Palette,
  sparkles: Sparkles,
  timer: Timer,
  island: Mountain,
  sunrise: Sunrise,
  ten: Hash,
  star: Star,
  orbit: Orbit,
  upgrade: ArrowUp,
  steady: PersonStanding,
  harvest: Wheat,
  sun: Sun,
  meteor: Stars,
  nebula: CloudMoon,
  aurora: Rainbow,
  core: Hexagon,
  wave: Waves,
  flag: Flag,
  close: X,
  building: Building2,
  hex: Hexagon,
  swords: Swords,
  dot: CircleDot,
  stars: Stars,
  help: HelpCircle,
  stats: BarChart3,
  zen: Eye,
  zenOff: EyeOff,
  hub: FlaskConical,
  guide: BookOpen,
  settings: Settings2,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  panelMin: PanelBottomClose,
  panelMax: PanelBottomOpen,
};

export function Icon({
  name,
  className,
  size = 16,
  strokeWidth = 2,
  ...rest
}: {
  name: IconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
} & Omit<LucideProps, "ref" | "size">) {
  const Comp = MAP[name] ?? CircleDot;
  return (
    <Comp
      className={className}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden
      {...rest}
    />
  );
}

/** Inline crystal / energy cost chip */
export function ResourceCost({
  crystals,
  energy,
  className = "",
  size = 12,
  showZero = false,
}: {
  crystals?: number;
  energy?: number;
  className?: string;
  size?: number;
  showZero?: boolean;
}) {
  const showC = crystals != null && (showZero || crystals > 0);
  const showE = energy != null && (showZero || energy > 0);
  if (!showC && !showE) return null;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {showC && (
        <span className="inline-flex items-center gap-0.5">
          <Icon name="crystal" size={size} className="text-sky-400" />
          <span>{crystals}</span>
        </span>
      )}
      {showE && (
        <span className="inline-flex items-center gap-0.5">
          <Icon name="energy" size={size} className="text-amber-400" />
          <span>{energy}</span>
        </span>
      )}
    </span>
  );
}
