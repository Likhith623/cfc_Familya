"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  ArrowLeft, Save, Shuffle, Palette, Shirt, Eye, Smile,
  Sparkles, ChevronLeft, ChevronRight, RotateCcw, Check, Wand2
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   CUSTOMIZATION DATA
   ═══════════════════════════════════════════════════ */
const SKIN_TONES = [
  { id: "fair", hex: "#FDDBB4", label: "Fair" },
  { id: "light", hex: "#F5C7A1", label: "Light" },
  { id: "medium", hex: "#E0A370", label: "Medium" },
  { id: "tan", hex: "#C68642", label: "Tan" },
  { id: "brown", hex: "#8D5524", label: "Brown" },
  { id: "dark", hex: "#5C3A1E", label: "Dark" },
];

const HAIR_COLORS = [
  { hex: "#2C1810", label: "Black" },
  { hex: "#4A2C1A", label: "Dark Brown" },
  { hex: "#8B4513", label: "Brown" },
  { hex: "#D4A574", label: "Dirty Blonde" },
  { hex: "#F5DEB3", label: "Blonde" },
  { hex: "#FF6347", label: "Red" },
  { hex: "#4169E1", label: "Blue" },
  { hex: "#9370DB", label: "Purple" },
  { hex: "#FFD700", label: "Gold" },
  { hex: "#FF69B4", label: "Pink" },
];

const HAIR_STYLES = [
  { id: "short", label: "Short", emoji: "💇" },
  { id: "medium", label: "Medium", emoji: "💇‍♀️" },
  { id: "long", label: "Long", emoji: "👱‍♀️" },
  { id: "curly", label: "Curly", emoji: "🦱" },
  { id: "braids", label: "Braids", emoji: "🫘" },
  { id: "bun", label: "Bun", emoji: "👩‍🦰" },
  { id: "afro", label: "Afro", emoji: "🧑‍🦱" },
  { id: "mohawk", label: "Mohawk", emoji: "🦅" },
  { id: "bald", label: "Bald", emoji: "🧑‍🦲" },
  { id: "ponytail", label: "Ponytail", emoji: "🎀" },
];

const EYE_COLORS = [
  { hex: "#634E34", label: "Brown" },
  { hex: "#2E536F", label: "Blue" },
  { hex: "#3D671D", label: "Green" },
  { hex: "#1C7847", label: "Emerald" },
  { hex: "#8B4513", label: "Hazel" },
  { hex: "#191970", label: "Navy" },
  { hex: "#7B3F00", label: "Amber" },
  { hex: "#808080", label: "Gray" },
];

const OUTFITS = [
  { id: "casual", label: "Casual", emoji: "👕", color: "#60A5FA" },
  { id: "indian", label: "Indian Traditional", emoji: "🪷", color: "#F59E0B" },
  { id: "brazilian", label: "Brazilian Style", emoji: "🌺", color: "#34D399" },
  { id: "japanese", label: "Japanese Kimono", emoji: "🎌", color: "#F472B6" },
  { id: "african", label: "African Heritage", emoji: "🌍", color: "#A78BFA" },
  { id: "formal", label: "Formal", emoji: "👔", color: "#6B7280" },
  { id: "sporty", label: "Sporty", emoji: "⚽", color: "#EF4444" },
  { id: "artistic", label: "Artistic", emoji: "🎨", color: "#EC4899" },
];

const ACCESSORIES = [
  { id: "none", label: "None", emoji: "✨" },
  { id: "glasses", label: "Glasses", emoji: "👓" },
  { id: "sunglasses", label: "Sunglasses", emoji: "🕶️" },
  { id: "hat", label: "Hat", emoji: "🧢" },
  { id: "headband", label: "Headband", emoji: "🎀" },
  { id: "earrings", label: "Earrings", emoji: "💎" },
  { id: "necklace", label: "Necklace", emoji: "📿" },
  { id: "flower", label: "Flower Crown", emoji: "🌸" },
  { id: "scarf", label: "Scarf", emoji: "🧣" },
  { id: "crown", label: "Crown", emoji: "👑" },
];

const EXPRESSIONS = [
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "warm", label: "Warm", emoji: "🥰" },
  { id: "cool", label: "Cool", emoji: "😎" },
  { id: "thoughtful", label: "Thoughtful", emoji: "🤔" },
  { id: "laughing", label: "Laughing", emoji: "😄" },
  { id: "peaceful", label: "Peaceful", emoji: "😌" },
  { id: "confident", label: "Confident", emoji: "💪" },
  { id: "mysterious", label: "Mysterious", emoji: "🌙" },
];

const BACKGROUNDS = [
  { id: "sunset", label: "Sunset", colors: ["#FF6B35", "#F43F5E"] },
  { id: "ocean", label: "Ocean", colors: ["#06B6D4", "#3B82F6"] },
  { id: "forest", label: "Forest", colors: ["#22C55E", "#10B981"] },
  { id: "royal", label: "Royal", colors: ["#8B5CF6", "#6366F1"] },
  { id: "golden", label: "Golden", colors: ["#F59E0B", "#EF4444"] },
  { id: "familia", label: "Familia", colors: ["#FF6B35", "#06B6D4"] },
  { id: "aurora", label: "Aurora", colors: ["#06B6D4", "#8B5CF6", "#F43F5E"] },
  { id: "midnight", label: "Midnight", colors: ["#1E1B4B", "#312E81"] },
  { id: "cherry", label: "Cherry", colors: ["#F43F5E", "#EC4899"] },
  { id: "cosmic", label: "Cosmic", colors: ["#6366F1", "#EC4899", "#F59E0B"] },
];

type Tab = "skin" | "hair" | "eyes" | "outfit" | "accessories" | "expression" | "background";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "skin", label: "Skin", icon: <Palette className="w-4 h-4" /> },
  { id: "hair", label: "Hair", icon: <span className="text-sm">💇</span> },
  { id: "eyes", label: "Eyes", icon: <Eye className="w-4 h-4" /> },
  { id: "outfit", label: "Outfit", icon: <Shirt className="w-4 h-4" /> },
  { id: "accessories", label: "Acc.", icon: <span className="text-sm">👓</span> },
  { id: "expression", label: "Expr.", icon: <Smile className="w-4 h-4" /> },
  { id: "background", label: "BG", icon: <span className="text-sm">🎨</span> },
];

/* ═══════════════════════════════════════════════════
   AVATAR SVG COMPONENT
   ═══════════════════════════════════════════════════ */
function AvatarSVG({ config }: { config: any }) {
  const skinDarker = adjustBrightness(config.skinTone, -30);
  const skinLighter = adjustBrightness(config.skinTone, 20);

  return (
    <svg viewBox="0 0 200 250" className="w-full h-full">
      <defs>
        <radialGradient id="skinGrad" cx="50%" cy="40%">
          <stop offset="0%" stopColor={skinLighter} />
          <stop offset="100%" stopColor={config.skinTone} />
        </radialGradient>
        <radialGradient id="cheekL" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cheekR" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0" />
        </radialGradient>
        <filter id="softShadow">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.15" />
        </filter>
        <linearGradient id="eyeShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Neck */}
      <rect x="85" y="155" width="30" height="30" rx="8" fill={config.skinTone} />
      <rect x="80" y="175" width="40" height="20" rx="5" fill={skinDarker} opacity="0.3" />

      {/* Body / Outfit hint */}
      <ellipse cx="100" cy="220" rx="55" ry="35" fill={OUTFITS.find(o => o.id === config.outfit)?.color || "#60A5FA"} opacity="0.9" />
      <ellipse cx="100" cy="215" rx="50" ry="30" fill={OUTFITS.find(o => o.id === config.outfit)?.color || "#60A5FA"} />

      {/* Head shape */}
      <ellipse cx="100" cy="95" rx="58" ry="68" fill="url(#skinGrad)" filter="url(#softShadow)" />

      {/* Ears */}
      <ellipse cx="42" cy="98" rx="10" ry="14" fill={config.skinTone} />
      <ellipse cx="42" cy="98" rx="6" ry="9" fill={skinDarker} opacity="0.15" />
      <ellipse cx="158" cy="98" rx="10" ry="14" fill={config.skinTone} />
      <ellipse cx="158" cy="98" rx="6" ry="9" fill={skinDarker} opacity="0.15" />

      {/* Hair - back layer */}
      {config.hairStyle !== "bald" && <HairBack style={config.hairStyle} color={config.hairColor} />}

      {/* Hair - front layer */}
      {config.hairStyle !== "bald" && <HairFront style={config.hairStyle} color={config.hairColor} />}

      {/* Eyebrows */}
      <path d="M 68 78 Q 80 71 92 78" stroke={config.hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 108 78 Q 120 71 132 78" stroke={config.hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      <Eyes eyeColor={config.eyeColor} expression={config.expression} />

      {/* Nose */}
      <path d="M 96 105 Q 100 115 104 105" stroke={skinDarker} strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />

      {/* Mouth based on expression */}
      <Mouth expression={config.expression} skinDarker={skinDarker} />

      {/* Cheek blush */}
      {(config.expression === "happy" || config.expression === "warm" || config.expression === "laughing") && (
        <>
          <circle cx="68" cy="112" r="10" fill="url(#cheekL)" />
          <circle cx="132" cy="112" r="10" fill="url(#cheekR)" />
        </>
      )}

      {/* Accessories */}
      <AccessorySVG type={config.accessory} hairColor={config.hairColor} />
    </svg>
  );
}

/* ── Helper Components ──────────────────────────── */
function HairBack({ style, color }: { style: string; color: string }) {
  const darker = adjustBrightness(color, -20);
  switch (style) {
    case "long":
      return (
        <>
          <ellipse cx="100" cy="55" rx="62" ry="42" fill={color} />
          <rect x="42" y="60" width="18" height="100" rx="9" fill={color} />
          <rect x="140" y="60" width="18" height="100" rx="9" fill={color} />
          <rect x="44" y="80" width="14" height="80" rx="7" fill={darker} opacity="0.2" />
          <rect x="142" y="80" width="14" height="80" rx="7" fill={darker} opacity="0.2" />
        </>
      );
    case "afro":
      return <ellipse cx="100" cy="75" rx="72" ry="65" fill={color} />;
    case "curly":
      return (
        <>
          <ellipse cx="100" cy="60" rx="60" ry="40" fill={color} />
          {[55, 70, 85, 100, 115, 130, 145].map((x, i) => (
            <circle key={i} cx={x} cy={40 + (i % 2) * 5} r="10" fill={color} />
          ))}
        </>
      );
    default:
      return <ellipse cx="100" cy="55" rx="55" ry="38" fill={color} />;
  }
}

function HairFront({ style, color }: { style: string; color: string }) {
  const darker = adjustBrightness(color, -15);
  switch (style) {
    case "mohawk":
      return <path d="M 80 25 Q 100 -5 120 25 Q 110 30 100 28 Q 90 30 80 25" fill={color} />;
    case "ponytail":
      return (
        <>
          <ellipse cx="100" cy="55" rx="55" ry="38" fill={color} />
          <ellipse cx="145" cy="45" rx="22" ry="18" fill={color} />
          <rect x="140" y="45" width="12" height="50" rx="6" fill={color} />
        </>
      );
    case "braids":
      return (
        <>
          <ellipse cx="100" cy="55" rx="55" ry="38" fill={color} />
          <rect x="48" y="65" width="12" height="85" rx="6" fill={color} />
          <rect x="140" y="65" width="12" height="85" rx="6" fill={color} />
          {/* braid pattern */}
          {[0, 15, 30, 45, 60].map((y, i) => (
            <g key={i}>
              <circle cx="54" cy={75 + y} r="5" fill={darker} opacity="0.15" />
              <circle cx="146" cy={75 + y} r="5" fill={darker} opacity="0.15" />
            </g>
          ))}
        </>
      );
    case "bun":
      return (
        <>
          <ellipse cx="100" cy="55" rx="55" ry="38" fill={color} />
          <circle cx="100" cy="22" r="18" fill={color} />
          <circle cx="100" cy="22" r="12" fill={darker} opacity="0.1" />
        </>
      );
    case "short":
      return (
        <>
          <ellipse cx="100" cy="58" rx="53" ry="32" fill={color} />
          <path d="M 50 70 Q 100 48 150 70" fill={color} />
        </>
      );
    default:
      return <ellipse cx="100" cy="55" rx="55" ry="38" fill={color} />;
  }
}

function Eyes({ eyeColor, expression }: { eyeColor: string; expression: string }) {
  const isSquint = expression === "laughing" || expression === "cool";
  const isWide = expression === "happy" || expression === "warm";

  if (isSquint) {
    return (
      <>
        <path d="M 72 92 Q 80 88 88 92" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 112 92 Q 120 88 128 92" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {expression === "cool" && (
          <>
            <line x1="72" y1="90" x2="88" y2="90" stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="112" y1="90" x2="128" y2="90" stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </>
    );
  }

  const eyeH = isWide ? 8 : 6.5;
  return (
    <>
      {/* Left eye */}
      <ellipse cx="80" cy="92" rx="9" ry={eyeH} fill="white" />
      <circle cx="80" cy="92" r="4.5" fill={eyeColor} />
      <circle cx="80" cy="92" r="2.5" fill="#111" />
      <circle cx="82" cy="89" r="1.8" fill="white" opacity="0.9" />
      <circle cx="77" cy="94" r="0.8" fill="white" opacity="0.5" />

      {/* Right eye */}
      <ellipse cx="120" cy="92" rx="9" ry={eyeH} fill="white" />
      <circle cx="120" cy="92" r="4.5" fill={eyeColor} />
      <circle cx="120" cy="92" r="2.5" fill="#111" />
      <circle cx="122" cy="89" r="1.8" fill="white" opacity="0.9" />
      <circle cx="117" cy="94" r="0.8" fill="white" opacity="0.5" />
    </>
  );
}

function Mouth({ expression, skinDarker }: { expression: string; skinDarker: string }) {
  switch (expression) {
    case "happy":
    case "warm":
      return <path d="M 82 120 Q 100 138 118 120" stroke={skinDarker} strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round" />;
    case "laughing":
      return (
        <>
          <path d="M 80 118 Q 100 142 120 118" stroke={skinDarker} strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round" />
          <path d="M 85 120 Q 100 136 115 120" fill={skinDarker} opacity="0.15" />
        </>
      );
    case "cool":
    case "confident":
      return <path d="M 88 122 Q 100 126 112 122" stroke={skinDarker} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />;
    case "thoughtful":
    case "mysterious":
      return <path d="M 90 124 Q 96 120 105 124" stroke={skinDarker} strokeWidth="2" fill="none" opacity="0.45" strokeLinecap="round" />;
    case "peaceful":
      return <path d="M 86 122 Q 100 130 114 122" stroke={skinDarker} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />;
    default:
      return <path d="M 85 122 Q 100 134 115 122" stroke={skinDarker} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />;
  }
}

function AccessorySVG({ type, hairColor }: { type: string; hairColor: string }) {
  switch (type) {
    case "glasses":
      return (
        <g opacity="0.85">
          <circle cx="80" cy="92" r="14" fill="none" stroke="#333" strokeWidth="2" />
          <circle cx="120" cy="92" r="14" fill="none" stroke="#333" strokeWidth="2" />
          <path d="M 94 92 Q 100 88 106 92" stroke="#333" strokeWidth="2" fill="none" />
          <line x1="66" y1="92" x2="45" y2="88" stroke="#333" strokeWidth="2" />
          <line x1="134" y1="92" x2="155" y2="88" stroke="#333" strokeWidth="2" />
        </g>
      );
    case "sunglasses":
      return (
        <g>
          <rect x="64" y="82" width="32" height="20" rx="4" fill="#1a1a2e" stroke="#333" strokeWidth="1.5" />
          <rect x="104" y="82" width="32" height="20" rx="4" fill="#1a1a2e" stroke="#333" strokeWidth="1.5" />
          <path d="M 96 90 Q 100 87 104 90" stroke="#333" strokeWidth="2" fill="none" />
          <rect x="68" y="84" width="10" height="4" rx="2" fill="white" opacity="0.15" />
          <rect x="108" y="84" width="10" height="4" rx="2" fill="white" opacity="0.15" />
        </g>
      );
    case "hat":
      return (
        <g>
          <rect x="55" y="32" width="90" height="18" rx="3" fill="#2D3748" />
          <rect x="65" y="12" width="70" height="25" rx="10" fill="#2D3748" />
          <rect x="65" y="12" width="70" height="8" rx="4" fill="white" opacity="0.05" />
        </g>
      );
    case "headband":
      return <path d="M 48 72 Q 100 58 152 72" stroke="#F43F5E" strokeWidth="5" fill="none" strokeLinecap="round" />;
    case "earrings":
      return (
        <>
          <circle cx="42" cy="115" r="5" fill="#FFD700" />
          <circle cx="42" cy="115" r="3" fill="#FFF" opacity="0.3" />
          <circle cx="158" cy="115" r="5" fill="#FFD700" />
          <circle cx="158" cy="115" r="3" fill="#FFF" opacity="0.3" />
        </>
      );
    case "necklace":
      return (
        <g>
          <path d="M 72 170 Q 100 195 128 170" stroke="#FFD700" strokeWidth="2" fill="none" />
          <circle cx="100" cy="190" r="5" fill="#FFD700" />
          <circle cx="100" cy="190" r="2.5" fill="#F43F5E" />
        </g>
      );
    case "flower":
      return (
        <g>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <circle
              key={i}
              cx={135 + Math.cos((angle * Math.PI) / 180) * 7}
              cy={62 + Math.sin((angle * Math.PI) / 180) * 7}
              r="4"
              fill={i % 2 === 0 ? "#F472B6" : "#FB7185"}
              opacity="0.9"
            />
          ))}
          <circle cx="135" cy="62" r="3" fill="#FBBF24" />
        </g>
      );
    case "scarf":
      return (
        <g>
          <path d="M 60 165 Q 100 180 140 165 L 140 185 Q 100 195 60 185 Z" fill="#E11D48" opacity="0.8" />
          <path d="M 65 170 Q 100 182 135 170" stroke="white" strokeWidth="1" fill="none" opacity="0.15" />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M 65 42 L 72 22 L 85 35 L 100 15 L 115 35 L 128 22 L 135 42 Z" fill="#FFD700" />
          <path d="M 65 42 L 135 42 L 133 50 L 67 50 Z" fill="#FFD700" />
          <circle cx="100" cy="32" r="3" fill="#F43F5E" />
          <circle cx="80" cy="37" r="2" fill="#06B6D4" />
          <circle cx="120" cy="37" r="2" fill="#06B6D4" />
        </g>
      );
    default:
      return null;
  }
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function AvatarPage() {
  const [tab, setTab] = useState<Tab>("skin");
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    skinTone: SKIN_TONES[2].hex,
    hairColor: HAIR_COLORS[0].hex,
    hairStyle: HAIR_STYLES[1].id,
    eyeColor: EYE_COLORS[0].hex,
    outfit: OUTFITS[0].id,
    accessory: ACCESSORIES[0].id,
    expression: EXPRESSIONS[0].id,
    background: BACKGROUNDS[5].id,
  });

  const updateConfig = useCallback((key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const randomize = useCallback(() => {
    setConfig({
      skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].hex,
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex,
      hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id,
      eyeColor: EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)].hex,
      outfit: OUTFITS[Math.floor(Math.random() * OUTFITS.length)].id,
      accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id,
      expression: EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)].id,
      background: BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)].id,
    });
  }, []);

  const handleSave = () => {
    localStorage.setItem("familia_avatar", JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const bgConfig = BACKGROUNDS.find((b) => b.id === config.background) || BACKGROUNDS[5];
  const bgGradient =
    bgConfig.colors.length === 3
      ? `linear-gradient(135deg, ${bgConfig.colors[0]}, ${bgConfig.colors[1]}, ${bgConfig.colors[2]})`
      : `linear-gradient(135deg, ${bgConfig.colors[0]}, ${bgConfig.colors[1]})`;

  const outfitConfig = OUTFITS.find((o) => o.id === config.outfit);
  const expressionConfig = EXPRESSIONS.find((e) => e.id === config.expression);
  const accessoryConfig = ACCESSORIES.find((a) => a.id === config.accessory);

  const tabIndex = TABS.findIndex((t) => t.id === tab);
  const prevTab = () => setTab(TABS[(tabIndex - 1 + TABS.length) % TABS.length].id);
  const nextTab = () => setTab(TABS[(tabIndex + 1) % TABS.length].id);

  return (
    <div className="min-h-screen pb-24">
      {/* ── Header ───────────────────────────────── */}
      <div className="sticky top-0 glass border-b border-white/5 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <motion.button className="p-2 rounded-lg hover:bg-white/5 transition" whileTap={{ scale: 0.95 }}>
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </Link>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-familia-400" />
              Avatar Studio
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={randomize}
              className="p-2.5 rounded-xl hover:bg-white/5 transition text-white/50 hover:text-white"
              whileTap={{ scale: 0.9, rotate: 180 }}
              title="Randomize"
            >
              <Shuffle className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-familia-500 to-heart-500 text-white text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-familia-500/20"
              whileTap={{ scale: 0.95 }}
              whileHover={{ shadow: "0 8px 30px rgba(255,107,53,0.3)" }}
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : "Save"}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Avatar Preview (2 cols) ─────────── */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <motion.div
              className="relative w-72 h-80 sm:w-80 sm:h-[22rem] rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: bgGradient }}
              layout
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Subtle animated overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 pointer-events-none" />

              {/* Avatar */}
              <motion.div
                className="w-full h-full"
                key={JSON.stringify(config)}
                initial={{ scale: 0.95, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AvatarSVG config={config} />
              </motion.div>

              {/* Outfit & expression label */}
              <div className="absolute bottom-3 left-3 right-3">
                <motion.div
                  className="bg-black/40 backdrop-blur-md rounded-xl px-3 py-2 flex items-center justify-center gap-2 text-xs text-white/90"
                  layout
                >
                  <span>{outfitConfig?.emoji} {outfitConfig?.label}</span>
                  <span className="text-white/30">•</span>
                  <span>{expressionConfig?.emoji} {expressionConfig?.label}</span>
                  {config.accessory !== "none" && (
                    <>
                      <span className="text-white/30">•</span>
                      <span>{accessoryConfig?.emoji}</span>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Floating sparkles */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-white/60"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + (i % 3) * 20}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    y: [0, -15, -30],
                  }}
                  transition={{
                    duration: 2.5,
                    delay: i * 0.6,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                />
              ))}
            </motion.div>

            <motion.p
              className="text-xs text-white/20 text-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              This is how others see you in Familia
            </motion.p>

            {/* Quick randomize hint */}
            <motion.button
              onClick={randomize}
              className="mt-3 flex items-center gap-2 text-xs text-white/30 hover:text-familia-400 transition px-4 py-2 rounded-full border border-white/5 hover:border-familia-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Wand2 className="w-3 h-3" />
              Feeling lucky? Randomize!
            </motion.button>
          </div>

          {/* ── Customization Panel (3 cols) ────── */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 mb-6">
              <button onClick={prevTab} className="p-1.5 rounded-lg hover:bg-white/5 transition text-white/30 hover:text-white/60">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                {TABS.map((t) => (
                  <motion.button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all ${
                      tab === t.id
                        ? "bg-gradient-to-r from-familia-500/20 to-heart-500/20 text-white border border-familia-500/20 shadow-glow-sm"
                        : "bg-white/[0.03] text-white/40 border border-white/5 hover:bg-white/[0.06] hover:text-white/60"
                    }`}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    {t.icon}
                    <span className="hidden sm:inline">{t.label}</span>
                  </motion.button>
                ))}
              </div>
              <button onClick={nextTab} className="p-1.5 rounded-lg hover:bg-white/5 transition text-white/30 hover:text-white/60">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                className="glass-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {tab === "skin" && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-familia-400" /> Skin Tone
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {SKIN_TONES.map((tone) => (
                        <motion.button
                          key={tone.id}
                          onClick={() => updateConfig("skinTone", tone.hex)}
                          className={`relative group flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                            config.skinTone === tone.hex
                              ? "border-familia-500 bg-familia-500/5 scale-105"
                              : "border-white/5 hover:border-white/15 bg-white/[0.02]"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div
                            className="w-12 h-12 rounded-xl shadow-md"
                            style={{ backgroundColor: tone.hex }}
                          />
                          <span className="text-[10px] text-white/40">{tone.label}</span>
                          {config.skinTone === tone.hex && (
                            <motion.div
                              className="absolute -top-1 -right-1 w-5 h-5 bg-familia-500 rounded-full flex items-center justify-center"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "hair" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">🎨 Hair Color</h3>
                      <div className="flex flex-wrap gap-2">
                        {HAIR_COLORS.map((color) => (
                          <motion.button
                            key={color.hex}
                            onClick={() => updateConfig("hairColor", color.hex)}
                            className={`relative w-10 h-10 rounded-xl border-2 transition-all shadow-sm ${
                              config.hairColor === color.hex ? "border-familia-500 scale-110 ring-2 ring-familia-500/20" : "border-white/10"
                            }`}
                            style={{ backgroundColor: color.hex }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">✂️ Hair Style</h3>
                      <div className="grid grid-cols-5 gap-2">
                        {HAIR_STYLES.map((style) => (
                          <motion.button
                            key={style.id}
                            onClick={() => updateConfig("hairStyle", style.id)}
                            className={`p-2.5 rounded-xl text-center transition-all border ${
                              config.hairStyle === style.id
                                ? "border-familia-500/50 bg-familia-500/10 text-white"
                                : "border-white/5 bg-white/[0.02] text-white/40 hover:bg-white/[0.05]"
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="text-lg mb-0.5">{style.emoji}</div>
                            <div className="text-[10px]">{style.label}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tab === "eyes" && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-bond-400" /> Eye Color
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {EYE_COLORS.map((color) => (
                        <motion.button
                          key={color.hex}
                          onClick={() => updateConfig("eyeColor", color.hex)}
                          className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                            config.eyeColor === color.hex
                              ? "border-bond-500 bg-bond-500/5 scale-105"
                              : "border-white/5 bg-white/[0.02] hover:border-white/10"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="w-10 h-10 rounded-full border-2 border-white/10 shadow-md" style={{ backgroundColor: color.hex }} />
                          <span className="text-[10px] text-white/40">{color.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "outfit" && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-familia-400" /> Outfit Style
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {OUTFITS.map((outfit) => (
                        <motion.button
                          key={outfit.id}
                          onClick={() => updateConfig("outfit", outfit.id)}
                          className={`p-4 rounded-xl text-left transition-all border flex items-center gap-3 ${
                            config.outfit === outfit.id
                              ? "border-familia-500/50 bg-familia-500/10"
                              : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: outfit.color + "20" }}>
                            {outfit.emoji}
                          </div>
                          <div className="text-sm font-medium">{outfit.label}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "accessories" && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">👓 Accessories</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {ACCESSORIES.map((acc) => (
                        <motion.button
                          key={acc.id}
                          onClick={() => updateConfig("accessory", acc.id)}
                          className={`p-3 rounded-xl text-center transition-all border ${
                            config.accessory === acc.id
                              ? "border-familia-500/50 bg-familia-500/10"
                              : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="text-2xl mb-1">{acc.emoji}</div>
                          <div className="text-[10px] text-white/40">{acc.label}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "expression" && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Smile className="w-4 h-4 text-heart-400" /> Expression
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {EXPRESSIONS.map((exp) => (
                        <motion.button
                          key={exp.id}
                          onClick={() => updateConfig("expression", exp.id)}
                          className={`p-3 rounded-xl text-center transition-all border ${
                            config.expression === exp.id
                              ? "border-heart-500/50 bg-heart-500/10"
                              : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="text-3xl mb-1">{exp.emoji}</div>
                          <div className="text-[10px] text-white/40">{exp.label}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "background" && (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">🎨 Background</h3>
                    <div className="grid grid-cols-5 gap-3">
                      {BACKGROUNDS.map((bg) => {
                        const bgStyle =
                          bg.colors.length === 3
                            ? `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]}, ${bg.colors[2]})`
                            : `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]})`;
                        return (
                          <motion.button
                            key={bg.id}
                            onClick={() => updateConfig("background", bg.id)}
                            className={`relative h-16 rounded-xl transition-all border-2 ${
                              config.background === bg.id
                                ? "border-white scale-105 ring-2 ring-white/20"
                                : "border-white/10 hover:border-white/30"
                            }`}
                            style={{ background: bgStyle }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span className="text-[10px] text-white/90 font-medium drop-shadow-md">{bg.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
