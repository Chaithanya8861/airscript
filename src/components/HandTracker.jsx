import { useEffect, useRef } from "react";
import { useHandTracking } from "../hooks/useHandTracking.js";
import { recognizeGesture } from "../utils/gestures.js";
import AirCanvas from "./AirCanvas.jsx";

const CANVAS_SIZE = { width: 640, height: 480 };

export default function HandTracker() {
  const { videoRef, landmarks, status, error } = useHandTracking({ numHands: 1 });
  const overlayCanvasRef = useRef(null);

  // Draw the 21 landmark dots + skeleton lines on their own canvas layer,
  // separate from AirCanvas's persistent drawing layer, so the "debug"
  // skeleton doesn't get baked into the user's artwork.
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) return;

    const w = canvas.width;
    const h = canvas.height;

    // MediaPipe's standard hand connections (which landmark connects to
    // which), used purely for the visual skeleton overlay.
    const CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4], // thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // index
      [5, 9], [9, 10], [10, 11], [11, 12], // middle
      [9, 13], [13, 14], [14, 15], [15, 16], // ring
      [13, 17], [17, 18], [18, 19], [19, 20], // pinky
      [0, 17],
    ];

    const toPixel = (lm) => ({ x: (1 - lm.x) * w, y: lm.y * h }); // mirrored to match video

    ctx.strokeStyle = "rgba(34, 211, 238, 0.6)";
    ctx.lineWidth = 2;
    for (const [a, b] of CONNECTIONS) {
      const pa = toPixel(landmarks[a]);
      const pb = toPixel(landmarks[b]);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    ctx.fillStyle = "#f472b6";
    for (const lm of landmarks) {
      const p = toPixel(lm);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight the fingertip that acts as the pen.
    const tip = toPixel(landmarks[8]);
    ctx.fillStyle = "#22d3ee";
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 7, 0, Math.PI * 2);
    ctx.fill();
  }, [landmarks]);

  const gesture = landmarks ? recognizeGesture(landmarks) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
      <div
        style={{
          position: "relative",
          width: CANVAS_SIZE.width,
          height: CANVAS_SIZE.height,
          borderRadius: 12,
          overflow: "hidden",
          background: "#111827",
        }}
      >
        <video
          ref={videoRef}
          width={CANVAS_SIZE.width}
          height={CANVAS_SIZE.height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)", // mirror for a natural feel
          }}
          muted
          playsInline
        />
        <canvas
          ref={overlayCanvasRef}
          width={CANVAS_SIZE.width}
          height={CANVAS_SIZE.height}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        />
        <AirCanvas landmarks={landmarks} width={CANVAS_SIZE.width} height={CANVAS_SIZE.height} />
      </div>

      <div style={{ fontFamily: "monospace", fontSize: 14, color: "#e5e7eb" }}>
        status: {status}
        {error && <span style={{ color: "#f87171" }}> - {error}</span>}
        {" | "}
        gesture: {gesture ?? "-"}
        {" | "}
        hand: {landmarks ? "detected" : "not detected"}
      </div>
      <p style={{ fontFamily: "sans-serif", fontSize: 13, color: "#9ca3af", maxWidth: 500, textAlign: "center" }}>
        Point your index finger only to draw (pen pose). Open your palm to clear the canvas.
      </p>
    </div>
  );
}
