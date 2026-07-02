import { useEffect, useRef, useState } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

/**
 * Sets up the webcam and runs MediaPipe's HandLandmarker on every frame
 * via requestAnimationFrame. Returns refs for the <video> element you need
 * to render, plus the latest detection result and a ready/error status.
 *
 * This is Phase 1-2 of the roadmap: get a hand detected and its 21
 * landmarks streaming reliably before building anything on top of it.
 */
export function useHandTracking({ numHands = 1 } = {}) {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);

  const [landmarks, setLandmarks] = useState(null); // landmarks[0] of first detected hand, or null
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1. Load the MediaPipe wasm runtime + hand landmark model.
        //    These are fetched from Google's CDN the first time; the
        //    browser caches them after that.
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands,
        });

        if (cancelled) return;
        landmarkerRef.current = handLandmarker;

        // 2. Ask for the webcam. This MUST happen after a user gesture on
        //    some browsers, so if you see permission issues, trigger init()
        //    from a button click instead of on mount.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });

        if (cancelled) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        setStatus("ready");
        loop();
      } catch (err) {
        console.error("Hand tracking init failed:", err);
        if (!cancelled) {
          setError(err.message || String(err));
          setStatus("error");
        }
      }
    }

    function loop() {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const result = landmarker.detectForVideo(video, performance.now());

      if (result.landmarks && result.landmarks.length > 0) {
        setLandmarks(result.landmarks[0]); // first detected hand
      } else {
        setLandmarks(null);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    init();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (landmarkerRef.current) landmarkerRef.current.close();
      const video = videoRef.current;
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [numHands]);

  return { videoRef, landmarks, status, error };
}
