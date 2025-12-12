
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

export enum AudioStabilityMode {
  AUTO = 'AUTO',       // Battery < 20% ? Stable : Dynamic
  STABLE = 'STABLE',   // Force 1.0x (Battery Saver)
  DYNAMIC = 'DYNAMIC'  // Allow Speed Ramping (High Perf)
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
  audioStabilityMode: AudioStabilityMode; // NEW: Stability Control

  // Run Settings
  useGPS: boolean; // Use Real GPS for distance/pace

  // Experimental
  gestureControlEnabled: boolean;
  
  // Developer / Demo
  showJudgeControls: boolean; 
}

export interface AudioState {
  isPlaying: boolean;
  playbackRate: number;
  filterFrequency: number; // In Hz
  duration: number;
  currentTime: number;
}

export interface SongMetadata {
  id?: string; // Made optional to support legacy
  name: string;
  artist?: string;
  album?: string;
  source: string; // URL or Blob URL
}

export interface Playlist {
  id: string;
  name: string;
  tracks: SongMetadata[];
  isSystem?: boolean; // If true, cannot be deleted
}

export interface WorkoutSession {
  id: string;
  date: number; // Timestamp
  mode: WorkoutMode;
  duration: string;
  distance?: string;
  calories: number;
  avgPace?: string;
  
  // User Editable Fields
  title?: string;
  weight?: string;
  reps?: string;
}
