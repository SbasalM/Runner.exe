import React, { useEffect, useRef, useState } from 'react';

interface GestureControllerProps {
  onPlayPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onCooldown: () => void;
  onStopWorkout: () => void;
  isCooldown: boolean;
  isEnabled: boolean;
}

type InitStatus = 'OFF' | 'LOADING_SCRIPT' | 'LOADING_MODEL' | 'STARTING_CAMERA' | 'READY' | 'ERROR';

export const GestureController: React.FC<GestureControllerProps> = ({
  onPlayPause,
  onNextTrack,
  onPrevTrack,
  onCooldown,
  onStopWorkout,
  isCooldown,
  isEnabled
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognizerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  
  // Logic State
  const [status, setStatus] = useState<InitStatus>('OFF');
  const [activeGesture, setActiveGesture] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ icon: React.ReactNode, text: string } | null>(null);
  
  // Hold Logic
  const lastGestureRef = useRef<string | null>(null);
  const gestureStartTimeRef = useRef<number>(0);
  const actionTriggeredRef = useRef<boolean>(false);
  const lastVideoTimeRef = useRef<number>(-1);

  // Stale Closure Fix: Store latest callbacks in a ref so the animation loop can access fresh state
  const callbacksRef = useRef({
      onPlayPause,
      onNextTrack,
      onPrevTrack,
      onCooldown,
      onStopWorkout,
      isCooldown
  });

  // Keep callbacks ref updated
  useEffect(() => {
      callbacksRef.current = {
          onPlayPause,
          onNextTrack,
          onPrevTrack,
          onCooldown,
          onStopWorkout,
          isCooldown
      };
  }, [onPlayPause, onNextTrack, onPrevTrack, onCooldown, onStopWorkout, isCooldown]);

  // --- INITIALIZATION SEQUENCE ---
  useEffect(() => {
    if (!isEnabled) {
        setStatus('OFF');
        return;
    }

    let isMounted = true;
    
    const initializeEngine = async () => {
        try {
            // STEP 1: Load Library via Dynamic Import (uses ImportMap)
            if (isMounted) setStatus('LOADING_SCRIPT');
            
            // This relies on the import map in index.html
            // @ts-ignore
            const { GestureRecognizer, FilesetResolver } = await import('@mediapipe/tasks-vision');

            // STEP 2: Load Model
            if (isMounted) setStatus('LOADING_MODEL');
            
            // Ensure WASM version matches JS version (0.10.9)
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
            );
            
            const recognizer = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                    delegate: "CPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });

            if (isMounted) {
                recognizerRef.current = recognizer;
                setStatus('STARTING_CAMERA');
            }

        } catch (error) {
            console.error("Gesture Engine Init Failed:", error);
            if (isMounted) setStatus('ERROR');
        }
    };

    initializeEngine();

    return () => {
        isMounted = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        
        // Proper Camera Cleanup
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };
  }, [isEnabled]);

  // --- CAMERA STARTUP ---
  useEffect(() => {
      if (status !== 'STARTING_CAMERA' || !videoRef.current) return;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error("Camera API unavailable");
          setStatus('ERROR');
          return;
      }

      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } }).then((stream) => {
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
              // Must call play() explicitly to ensure video starts
              videoRef.current.play().then(() => {
                   setStatus('READY');
                   predictWebcam();
              }).catch(e => {
                  console.error("Video play failed", e);
                  setStatus('ERROR');
              });
          }
      }).catch(err => {
          console.error("Camera Permission Denied:", err);
          setStatus('ERROR');
      });

  }, [status]);


  // --- RECOGNITION LOOP ---
  const predictWebcam = () => {
    if (!videoRef.current || !recognizerRef.current) {
        rafRef.current = requestAnimationFrame(predictWebcam);
        return;
    }

    const video = videoRef.current;
    
    // Ensure video is playing and has valid dimensions
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0 && !video.paused && !video.ended) {
        try {
            // Only process if the frame has changed to avoid duplicate work/timestamps
            if (video.currentTime !== lastVideoTimeRef.current) {
                lastVideoTimeRef.current = video.currentTime;
                
                // Use performance.now() for monotonic time
                const results = recognizerRef.current.recognizeForVideo(video, performance.now());
                
                if (results.gestures.length > 0) {
                    const gesture = results.gestures[0][0];
                    const categoryName = gesture.categoryName;
                    
                    handleStandardGestures(categoryName);
                    setActiveGesture(categoryName);
                } else {
                    setActiveGesture(null);
                    resetHoldLogic();
                }
            }
        } catch (e) {
            // console.error("Prediction error", e);
        }
    }

    rafRef.current = requestAnimationFrame(predictWebcam);
  };

  // --- LOGIC HANDLERS ---
  const handleStandardGestures = (gestureName: string) => {
      const now = Date.now();
      const cb = callbacksRef.current; // Access fresh callbacks

      if (lastGestureRef.current !== gestureName) {
          lastGestureRef.current = gestureName;
          gestureStartTimeRef.current = now;
          actionTriggeredRef.current = false;
      }

      const holdDuration = now - gestureStartTimeRef.current;

      // 1. PLAY / PAUSE (Closed_Fist) - 1s Hold
      if (gestureName === "Closed_Fist") {
          if (holdDuration > 1000 && !actionTriggeredRef.current) {
              cb.onPlayPause();
              triggerFeedback(
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>,
                  "TOGGLE PLAY"
              );
              actionTriggeredRef.current = true;
          }
      }

      // 2. NEXT TRACK (Thumb_Up) - 0.5s Hold
      else if (gestureName === "Thumb_Up") {
           if (holdDuration > 500 && !actionTriggeredRef.current) {
               cb.onNextTrack();
               triggerFeedback(
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400" viewBox="0 0 20 20" fill="currentColor"><path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" /></svg>,
                  "NEXT TRACK"
               );
               actionTriggeredRef.current = true;
           }
      }
      
      // 3. PREV TRACK (Thumb_Down) - 0.5s Hold
      else if (gestureName === "Thumb_Down") {
           if (holdDuration > 500 && !actionTriggeredRef.current) {
               cb.onPrevTrack();
               triggerFeedback(
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-fuchsia-400" viewBox="0 0 20 20" fill="currentColor"><path d="M15.445 14.832A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4A1 1 0 0010 14v-2.798l5.445 3.63z" /></svg>,
                  "PREV TRACK"
               );
               actionTriggeredRef.current = true;
           }
      }

      // 4. COOLDOWN / RESUME (Open_Palm) - 1.5s Hold
      else if (gestureName === "Open_Palm") {
          if (holdDuration > 1500 && !actionTriggeredRef.current) {
              cb.onCooldown(); // This now toggles
              
              if (cb.isCooldown) {
                  // Currently in Cooldown -> We are Resuming
                  triggerFeedback(
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>,
                      "RESUME RUN"
                  );
              } else {
                  // Currently Active -> Going to Cooldown
                  triggerFeedback(
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>,
                      "COOLDOWN"
                  );
              }
              actionTriggeredRef.current = true;
          }
      }

      // 5. VICTORY / STOP (Victory) - 1s Hold
      else if (gestureName === "Victory") {
          if (holdDuration > 1000 && !actionTriggeredRef.current) {
              cb.onStopWorkout();
              triggerFeedback(
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 2v10h10V5H5z" clipRule="evenodd" /></svg>,
                  "STOP WORKOUT"
              );
              actionTriggeredRef.current = true;
          }
      }
  };

  const resetHoldLogic = () => {
      lastGestureRef.current = null;
      gestureStartTimeRef.current = 0;
      actionTriggeredRef.current = false;
  };

  const triggerFeedback = (icon: React.ReactNode, text: string) => {
      setFeedback({ icon, text });
      setTimeout(() => setFeedback(null), 2000);
  };

  if (!isEnabled) return null;

  return (
    <>
        {/* Important: Video must not be display:none for detection to work in all browsers */}
        <video 
            ref={videoRef} 
            className="absolute opacity-0 pointer-events-none" 
            style={{ width: '640px', height: '480px' }}
            autoPlay 
            playsInline 
            muted 
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* STATUS INDICATOR PILL */}
        {status !== 'READY' && status !== 'OFF' && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-down">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md ${status === 'ERROR' ? 'bg-red-900/80 border-red-500' : 'bg-zinc-900/80 border-cyan-500'}`}>
                    {status === 'ERROR' ? (
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                    )}
                    <span className={`text-[10px] font-bold tracking-widest ${status === 'ERROR' ? 'text-red-200' : 'text-cyan-400'}`}>
                        {status === 'LOADING_SCRIPT' && 'DOWNLOADING AI ENGINE...'}
                        {status === 'LOADING_MODEL' && 'LOADING GESTURE MODEL...'}
                        {status === 'STARTING_CAMERA' && 'STARTING CAMERA...'}
                        {status === 'ERROR' && 'GESTURE ENGINE FAILED'}
                    </span>
                </div>
            </div>
        )}

        {/* FEEDBACK OVERLAYS */}
        {feedback && (
            <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center animate-fade-in-up pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md p-6 rounded-full border border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                    {feedback.icon}
                </div>
                <div className="mt-2 text-cyan-400 font-bold brand-font text-xl tracking-widest text-shadow">
                    {feedback.text}
                </div>
            </div>
        )}

        {/* ACTIVE INDICATOR */}
        {status === 'READY' && (
            <div className="fixed top-4 left-4 z-[50] opacity-50 hover:opacity-100 transition-opacity pointer-events-none">
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-full border border-green-500/30">
                    <div className={`w-2 h-2 rounded-full ${activeGesture ? 'bg-green-400 animate-ping' : 'bg-green-900'}`}></div>
                    <span className="text-[9px] text-green-500 font-mono">
                        {activeGesture ? `DETECTED: ${activeGesture.replace('_', ' ')}` : "SCANNING..."}
                    </span>
                </div>
            </div>
        )}
    </>
  );
};