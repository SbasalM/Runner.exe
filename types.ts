
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

export enum InputSource {
  HEART_RATE = 'HEART_RATE',
  TIMER = 'TIMER'
}

export interface Settings {
  units: UnitSystem;
  targetMin: number;
  targetMax: number;
  enabledServices: string[]; // List of enabled service IDs
  
  // Timer Mode Settings
  inputSource: InputSource;
  sessionDuration: number; // in minutes
  slugStart: boolean; // Warmup phase
  
  // Global Audio Settings
  overdriveSpeedup: boolean; // Allow playback rate increase

  // Run Settings
  useGPS: boolean; // Use Real GPS for distance/pace
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

export interface WorkoutSession {
  id: string;
  date: number; // Timestamp
  mode: WorkoutMode;
  duration: string;
  distance?: string;
  calories: number;
  avgPace?: string;
}
