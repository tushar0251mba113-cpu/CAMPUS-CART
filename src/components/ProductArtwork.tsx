import React, { useState } from 'react';
import {
  BookOpen,
  Coffee,
  Cookie,
  Droplets,
  Package,
  PenTool,
  ShoppingBasket,
  Sparkles,
} from 'lucide-react';
import { ProductCategory } from '../types';

interface ProductArtworkProps {
  imageKey: string;
  imageUrl?: string;
  category: ProductCategory;
  name: string;
  className?: string;
}

const ARTWORK_PALETTES: Record<
  string,
  { bg: string; accent: string; secondary: string; label: string }
> = {
  groceries_dairy: {
    bg: '#F4F4F5',
    accent: '#4C1D95',
    secondary: '#DDD6FE',
    label: 'Daily Dairy',
  },
  groceries_staples: {
    bg: '#F4F4F5',
    accent: '#3F3F46',
    secondary: '#E4E4E7',
    label: 'Pantry Staple',
  },
  snacks_noodles: {
    bg: '#F4F4F5',
    accent: '#B45309',
    secondary: '#FDE68A',
    label: 'Hot Snack',
  },
  snacks_biscuits: {
    bg: '#F4F4F5',
    accent: '#92400E',
    secondary: '#FCD34D',
    label: 'Tea Break',
  },
  beverages_tea: {
    bg: '#F4F4F5',
    accent: '#5B21B6',
    secondary: '#EDE9FE',
    label: 'Study Fuel',
  },
  beverages_water: {
    bg: '#F4F4F5',
    accent: '#0369A1',
    secondary: '#BAE6FD',
    label: 'Hydration',
  },
  stationery_notebooks: {
    bg: '#F4F4F5',
    accent: '#4338CA',
    secondary: '#C7D2FE',
    label: 'Lecture Notes',
  },
  stationery_pens: {
    bg: '#F4F4F5',
    accent: '#3730A3',
    secondary: '#E0E7FF',
    label: 'Exam Kit',
  },
  care_hygiene: {
    bg: '#F4F4F5',
    accent: '#15803D',
    secondary: '#BBF7D0',
    label: 'Personal Care',
  },
  care_laundry: {
    bg: '#F4F4F5',
    accent: '#047857',
    secondary: '#A7F3D0',
    label: 'Hostel Wash',
  },
};

function CategoryIcon({ category, className }: { category: ProductCategory; className?: string }) {
  switch (category) {
    case 'Groceries':
      return <ShoppingBasket className={className} />;
    case 'Snacks':
      return <Cookie className={className} />;
    case 'Beverages':
      return <Coffee className={className} />;
    case 'Stationery':
      return <BookOpen className={className} />;
    case 'Personal Care':
      return <Sparkles className={className} />;
    default:
      return <Package className={className} />;
  }
}

export const ProductArtwork: React.FC<ProductArtworkProps> = ({
  imageKey,
  imageUrl,
  category,
  name,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (imageUrl && !imgFailed) {
    return (
      <div className={`relative w-full h-full bg-[#F4F4F5] overflow-hidden ${className}`}>
        <img
          src={imageUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const palette = ARTWORK_PALETTES[imageKey] || {
    bg: '#F4F4F5',
    accent: '#4C1D95',
    secondary: '#EDE9FE',
    label: category,
  };

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none ${className}`}
      style={{ backgroundColor: palette.bg }}
      aria-label={name}
    >
      <svg
        viewBox="0 0 240 180"
        className="w-full h-full"
        role="img"
        aria-label={`${name} illustration`}
      >
        <rect width="240" height="180" fill={palette.bg} />
        <circle cx="120" cy="86" r="52" fill={palette.secondary} opacity="0.65" />
        {imageKey === 'groceries_dairy' && (
          <g>
            <rect x="92" y="48" width="56" height="84" rx="8" fill="#FFFFFF" stroke={palette.accent} strokeWidth="2.5" />
            <path d="M92 66 L148 66" stroke={palette.accent} strokeWidth="2" />
            <rect x="102" y="78" width="36" height="28" rx="4" fill={palette.secondary} />
            <path d="M108 40 L132 40 L136 48 L104 48 Z" fill={palette.accent} />
          </g>
        )}
        {imageKey === 'groceries_staples' && (
          <g>
            <rect x="84" y="48" width="72" height="84" rx="10" fill="#FFFFFF" stroke={palette.accent} strokeWidth="2.5" />
            <rect x="96" y="64" width="48" height="36" rx="4" fill={palette.secondary} />
            <line x1="96" y1="112" x2="144" y2="112" stroke={palette.accent} strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        {(imageKey === 'snacks_noodles' || imageKey === 'snacks_biscuits') && (
          <g>
            <rect x="80" y="54" width="80" height="72" rx="10" fill="#FFFFFF" stroke={palette.accent} strokeWidth="2.5" />
            <circle cx="120" cy="90" r="20" fill={palette.secondary} stroke={palette.accent} strokeWidth="2" />
            <path d="M108 90 Q120 78 132 90 Q120 102 108 90" fill={palette.accent} opacity="0.7" />
          </g>
        )}
        {(imageKey === 'beverages_tea' || imageKey === 'beverages_water') && (
          <g>
            <rect x="94" y="46" width="52" height="86" rx="12" fill="#FFFFFF" stroke={palette.accent} strokeWidth="2.5" />
            <rect x="108" y="36" width="24" height="10" rx="3" fill={palette.accent} />
            <rect x="94" y="76" width="52" height="28" fill={palette.secondary} />
          </g>
        )}
        {(imageKey === 'stationery_notebooks' || imageKey === 'stationery_pens') && (
          <g>
            <rect x="82" y="44" width="66" height="90" rx="6" fill="#FFFFFF" stroke={palette.accent} strokeWidth="2.5" />
            <line x1="96" y1="44" x2="96" y2="134" stroke={palette.accent} strokeWidth="2" />
            <line x1="106" y1="68" x2="136" y2="68" stroke={palette.secondary} strokeWidth="4" strokeLinecap="round" />
            <line x1="106" y1="82" x2="136" y2="82" stroke={palette.secondary} strokeWidth="4" strokeLinecap="round" />
            <rect x="154" y="54" width="10" height="74" rx="4" fill={palette.accent} />
          </g>
        )}
        {(imageKey === 'care_hygiene' || imageKey === 'care_laundry') && (
          <g>
            <rect x="88" y="52" width="64" height="78" rx="14" fill="#FFFFFF" stroke={palette.accent} strokeWidth="2.5" />
            <circle cx="120" cy="91" r="16" fill={palette.secondary} />
            <path d="M120 79 L120 103 M108 91 L132 91" stroke={palette.accent} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
        {!ARTWORK_PALETTES[imageKey] && (
          <g>
            <rect x="86" y="50" width="68" height="78" rx="10" fill="#FFFFFF" stroke={palette.accent} strokeWidth="2.5" />
          </g>
        )}
      </svg>
      <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
        {imageKey === 'stationery_pens' ? (
          <PenTool className="w-3.5 h-3.5 text-zinc-500" />
        ) : imageKey === 'beverages_water' ? (
          <Droplets className="w-3.5 h-3.5 text-zinc-500" />
        ) : (
          <CategoryIcon category={category} className="w-3.5 h-3.5 text-zinc-500" />
        )}
        <span>{palette.label}</span>
      </div>
    </div>
  );
};
