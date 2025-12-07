
export enum AppMode {
  MOTIVATION = 'MOTIVATION', // < Target Min
  ZONE = 'ZONE',             // Target Min - Target Max
  OVERDRIVE = 'OVERDRIVE',   // > Target Max
  COOLDOWN = 'COOLDOWN'      // Manual Override
}

export enum WorkoutMode {
  RUN = 'RUN',
  GYM = 'GYM'
}

export enum UnitSystem {
  METRIC = 'METRIC',
  IMPERIAL = 'IMPERIAL'
}

export interface Settings {
  units: UnitSystem;
  targetMin: number;
  targetMax: number;
  enabledServices: string[]; // List of enabled service IDs
}

export interface AudioState {
  isPlaying: boolean;
  playbackRate: number;
  filterFrequency: number; // In Hz
  duration: number;
  currentTime: number;
}

export interface SongMetadata {
  name: string;
  artist?: string;
  album?: string;
  source: string; // URL or Blob URL
}