'use client';

import { useTheme } from './ThemeProvider';
import { GradientWave } from './ui/gradient-wave';

const LIGHT_COLORS = [
  "#f0f9ff", "#e0f2fe", "#bae6fd", "#7dd3fc", "#f0f9ff",
];

const DARK_COLORS = [
  "#0f172a", "#1e293b", "#334155", "#0f172a", "#1e293b",
];

export default function GlobalBackground() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <GradientWave
      colors={colors}
      shadowPower={2}
      darkenTop={false}
      noiseFrequency={[0.0005, 0.0005]}
      deform={{ incline: 0.05, noiseAmp: 50, noiseFlow: 1.0, noiseSpeed: 5 }}
    />
  );
}
