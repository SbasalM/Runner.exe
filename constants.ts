
import { AppMode, InputSource } from "./types";

export const BPM_MIN = 60;
export const BPM_MAX = 180;
export const BPM_TARGET_LOW = 130;
export const BPM_TARGET_HIGH = 150;

// Reliable public CDN URL for the custom Skull model
// Switched to raw.githubusercontent.com for direct access to fix fetch errors
export const SKULL_MODEL_URL = "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/GEMINI%20HACKATHON_v6.glb";
export const DEMO_TRACK_URL = "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/Bassline%20Protocol.mp3"; 

export const DEMO_TRACKS = {
  BASSLINE: {
    id: 'bassline',
    name: "Bassline Protocol",
    artist: "The Architect",
    album: "Low Freq",
    source: "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/Bassline%20Protocol.mp3",
    color: "bg-[#00A8E1]",
    hover: "hover:bg-[#23c3fc]",
    textColor: "text-[#00A8E1]"
  },
  NEON_VELOCITY: {
    id: 'neon_velocity',
    name: "Neon Velocity",
    artist: "Cyber Sprinter",
    album: "Light Cycles",
    source: "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/Neon%20Velocity.mp3",
    color: "bg-[#22d3ee]",
    hover: "hover:bg-[#67e8f9]",
    textColor: "text-[#22d3ee]"
  },
  MIDNIGHT_RUNNER: {
    id: 'midnight_runner',
    name: "Midnight Runner 2084",
    artist: "Neon Drifter",
    album: "Future Noir",
    source: "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/Midnight%20Runner%202084.mp3",
    color: "bg-[#818cf8]",
    hover: "hover:bg-[#a5b4fc]",
    textColor: "text-[#818cf8]"
  },
  NEURAL_OVERDRIVE: {
    id: 'neural_overdrive',
    name: "Neural Overdrive",
    artist: "Brain Hack",
    album: "Synaptic Gap",
    source: "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/Neural%20Overdrive.mp3",
    color: "bg-[#d946ef]",
    hover: "hover:bg-[#f0abfc]",
    textColor: "text-[#d946ef]"
  },
  VELOCITY_GLITCH: {
    id: 'velocity_glitch',
    name: "Velocity Glitch",
    artist: "Synth Siren",
    album: "Digital Ghost",
    source: "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/Velocity%20Glitch.mp3",
    color: "bg-[#FA243C]",
    hover: "hover:bg-[#fb5567]",
    textColor: "text-[#FA243C]"
  },
  COOLDOWN: {
    id: 'cooldown',
    name: "Cooldown.exe",
    artist: "Synth Siren",
    album: "Recovery Sequence",
    source: "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/Cooldown.exe.mp3",
    color: "bg-[#60a5fa]",
    hover: "hover:bg-[#93c5fd]",
    textColor: "text-[#60a5fa]"
  }
};

// Global Playlist
export const DEMO_PLAYLIST = [
  DEMO_TRACKS.BASSLINE,
  DEMO_TRACKS.NEON_VELOCITY,
  DEMO_TRACKS.MIDNIGHT_RUNNER,
  DEMO_TRACKS.NEURAL_OVERDRIVE,
  DEMO_TRACKS.VELOCITY_GLITCH,
  DEMO_TRACKS.COOLDOWN
];

export const MODE_CONFIG = {
  [AppMode.MOTIVATION]: {
    color: 'text-amber-500',
    borderColor: 'border-amber-500',
    shadowColor: 'shadow-amber-500/50',
    bgGradient: 'from-amber-900/20 to-black',
    label: 'MOTIVATION NEEDED',
    message: 'PUSH HARDER',
    playbackRate: 0.85,
    filterFreq: 600, // Muffled
    hex: '#f59e0b'
  },
  [AppMode.ZONE]: {
    color: 'text-cyan-400',
    borderColor: 'border-cyan-400',
    shadowColor: 'shadow-cyan-400/50',
    bgGradient: 'from-cyan-900/20 to-black',
    label: 'IN THE ZONE',
    message: 'MAINTAIN PACE',
    playbackRate: 1.0,
    filterFreq: 22000, // Clear
    hex: '#22d3ee'
  },
  [AppMode.OVERDRIVE]: {
    color: 'text-fuchsia-500',
    borderColor: 'border-fuchsia-500',
    shadowColor: 'shadow-fuchsia-500/80',
    bgGradient: 'from-fuchsia-900/30 to-black',
    label: 'OVERDRIVE',
    message: 'UNSTOPPABLE',
    playbackRate: 1.1,
    filterFreq: 22000, // Clear
    hex: '#d946ef'
  },
  [AppMode.COOLDOWN]: {
    color: 'text-blue-400',
    borderColor: 'border-blue-400',
    shadowColor: 'shadow-blue-400/50',
    bgGradient: 'from-blue-900/30 to-black',
    label: 'SYSTEM COOLDOWN',
    message: 'RECOVERING',
    playbackRate: 1.0,
    filterFreq: 22000, // Clear
    hex: '#60a5fa'
  }
};
