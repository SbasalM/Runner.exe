
import { AppMode } from "./types";

export const BPM_MIN = 60;
export const BPM_MAX = 180;
export const BPM_TARGET_LOW = 130;
export const BPM_TARGET_HIGH = 150;

export const DEMO_TRACK_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 

export const DEMO_TRACKS = {
  SPOTIFY: {
    id: 'spotify',
    platform: 'Spotify',
    name: "System Overdrive",
    artist: "CyberRunner",
    album: "Neon Nights",
    source: "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/System%20Overdrive.mp3",
    color: "bg-[#1DB954]",
    hover: "hover:bg-[#1ed760]",
    textColor: "text-[#1DB954]"
  },
  APPLE: {
    id: 'apple',
    platform: 'Apple Music',
    name: "Velocity Glitch",
    artist: "Synth Siren",
    album: "Digital Ghost",
    source: "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/Velocity%20Glitch.mp3",
    color: "bg-[#FA243C]",
    hover: "hover:bg-[#fb5567]",
    textColor: "text-[#FA243C]"
  },
  YOUTUBE: {
    id: 'youtube',
    platform: 'YouTube Music',
    name: "Iron Lungs",
    artist: "The Forge",
    album: "Heavy Metal Cardio",
    source: "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/Iron%20Lungs.mp3",
    color: "bg-[#FF0000]",
    hover: "hover:bg-[#ff3333]",
    textColor: "text-[#FF0000]"
  },
  AMAZON: {
    id: 'amazon',
    platform: 'Amazon Music',
    name: "Bassline Protocol",
    artist: "The Architect",
    album: "Low Freq",
    source: "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/Bassline%20Protocol.mp3",
    color: "bg-[#00A8E1]",
    hover: "hover:bg-[#23c3fc]",
    textColor: "text-[#00A8E1]"
  }
};

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