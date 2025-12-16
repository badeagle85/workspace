'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container, ISourceOptions } from '@tsparticles/engine';
import type { EffectType } from '@/types';

interface ParticleEffectsProps {
  effect: EffectType;
  enabled?: boolean;
}

// 눈 효과 설정
const snowConfig: ISourceOptions = {
  fullScreen: { enable: false },
  particles: {
    number: { value: 50, density: { enable: true } },
    color: { value: '#ffffff' },
    shape: { type: 'circle' },
    opacity: { value: { min: 0.5, max: 1 } },
    size: { value: { min: 2, max: 6 } },
    move: {
      enable: true,
      speed: 2,
      direction: 'bottom',
      outModes: { default: 'out' },
      straight: false,
    },
    wobble: {
      enable: true,
      distance: 10,
      speed: 5,
    },
  },
};

// 하트 효과 설정
const heartsConfig: ISourceOptions = {
  fullScreen: { enable: false },
  particles: {
    number: { value: 30, density: { enable: true } },
    color: { value: ['#ff6b6b', '#ff8787', '#ffa8a8', '#ff4757'] },
    shape: { type: 'heart' },
    opacity: { value: { min: 0.6, max: 1 } },
    size: { value: { min: 8, max: 16 } },
    move: {
      enable: true,
      speed: 1.5,
      direction: 'top',
      outModes: { default: 'out' },
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 5 },
    },
  },
};

// 폭죽 효과 설정
const fireworksConfig: ISourceOptions = {
  fullScreen: { enable: false },
  particles: {
    number: { value: 0 },
    color: { value: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'] },
    shape: { type: 'circle' },
    opacity: {
      value: 1,
      animation: { enable: true, speed: 0.5, minimumValue: 0, destroy: 'min' },
    },
    size: { value: { min: 2, max: 4 } },
    move: {
      enable: true,
      speed: { min: 5, max: 15 },
      direction: 'none',
      outModes: { default: 'destroy' },
      gravity: { enable: true, acceleration: 5 },
    },
  },
  emitters: {
    position: { x: 50, y: 50 },
    rate: { quantity: 10, delay: 0.3 },
    life: { duration: 0.1, count: 0 },
  },
};

// 색종이 효과 설정
const confettiConfig: ISourceOptions = {
  fullScreen: { enable: false },
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'] },
    shape: { type: ['square', 'circle'] },
    opacity: { value: { min: 0.6, max: 1 } },
    size: { value: { min: 4, max: 8 } },
    move: {
      enable: true,
      speed: 3,
      direction: 'bottom',
      outModes: { default: 'out' },
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 10 },
    },
    tilt: {
      enable: true,
      value: { min: 0, max: 360 },
      animation: { enable: true, speed: 10 },
    },
  },
};

const effectConfigs: Record<EffectType, ISourceOptions | null> = {
  none: null,
  snow: snowConfig,
  hearts: heartsConfig,
  fireworks: fireworksConfig,
  confetti: confettiConfig,
};

export function ParticleEffects({ effect, enabled = true }: ParticleEffectsProps) {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(() => effectConfigs[effect], [effect]);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log('Particles loaded:', container);
  };

  if (!init || !enabled || !options) {
    return null;
  }

  return (
    <Particles
      id={`particles-${effect}`}
      className="absolute inset-0 pointer-events-none z-10"
      particlesLoaded={particlesLoaded}
      options={options}
    />
  );
}
