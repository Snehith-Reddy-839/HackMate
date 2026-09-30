'use client';
import React from 'react';

export const ANIMAL_AVATARS: Record<string, { name: string; emoji: string; bg: string; border: string }> = {
  'animal:panda': { name: 'Panda', emoji: '🐼', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'animal:fox': { name: 'Fox', emoji: '🦊', bg: 'bg-orange-50', border: 'border-orange-200' },
  'animal:koala': { name: 'Koala', emoji: '🐨', bg: 'bg-slate-100', border: 'border-slate-300' },
  'animal:cat': { name: 'Cat', emoji: '🐱', bg: 'bg-amber-50', border: 'border-amber-200' },
  'animal:dog': { name: 'Dog', emoji: '🐶', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  'animal:rabbit': { name: 'Rabbit', emoji: '🐰', bg: 'bg-pink-50', border: 'border-pink-200' },
  'animal:bear': { name: 'Bear', emoji: '🐻', bg: 'bg-amber-100', border: 'border-amber-300' },
  'animal:tiger': { name: 'Tiger', emoji: '🐯', bg: 'bg-orange-100', border: 'border-orange-300' },
  'animal:frog': { name: 'Frog', emoji: '🐸', bg: 'bg-lime-50', border: 'border-lime-200' },
  'animal:otter': { name: 'Otter', emoji: '🦦', bg: 'bg-cyan-50', border: 'border-cyan-200' },
};

export const ANIMAL_KEYS = Object.keys(ANIMAL_AVATARS);

export function getDeterministicAvatar(identifier?: string | null): string {
  if (!identifier) return ANIMAL_KEYS[0];
  const hash = identifier.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ANIMAL_KEYS[hash % ANIMAL_KEYS.length];
}

interface AvatarDisplayProps {
  avatar?: string | null;
  seed?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-base',
  md: 'h-10 w-10 text-xl',
  lg: 'h-14 w-14 text-3xl',
  xl: 'h-20 w-20 text-4xl',
  '2xl': 'h-28 w-28 text-5xl',
};

export default function AvatarDisplay({
  avatar,
  seed,
  name,
  size = 'md',
  className = '',
}: AvatarDisplayProps) {
  const currentAvatar = avatar || getDeterministicAvatar(seed || name || 'student');
  const animal = ANIMAL_AVATARS[currentAvatar];

  if (animal) {
    return (
      <div
        className={`rounded-full flex items-center justify-center shrink-0 border select-none transition-transform ${animal.bg} ${animal.border} ${sizeClasses[size]} ${className}`}
        title={`${name || 'Student'} (${animal.name})`}
      >
        <span className="leading-none">{animal.emoji}</span>
      </div>
    );
  }

  // If custom photo URL / base64
  if (currentAvatar.startsWith('http') || currentAvatar.startsWith('data:image')) {
    return (
      <div
        className={`rounded-full overflow-hidden shrink-0 border border-gray-200 bg-gray-100 flex items-center justify-center ${sizeClasses[size]} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentAvatar}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // Fallback initials
  const initials = name ? name.substring(0, 2).toUpperCase() : 'HM';
  return (
    <div
      className={`rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center shrink-0 border border-primary/20 ${sizeClasses[size]} ${className}`}
    >
      <span className="text-xs sm:text-sm">{initials}</span>
    </div>
  );
}
