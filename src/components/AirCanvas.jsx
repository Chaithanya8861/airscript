import { useEffect, useRef } from "react";
import { PointSmoother } from "../utils/smoothing.js";
import { recognizeGesture } from "../utils/gestures.js";

/**
 * Draws on a canvas as the user's index fingertip moves, only while the
 * "PEN" gesture (index finger extended, others curled) is held. This is
 * the "pen up / pen down" mechanic - without it, the line would draw
 * continuously any time a hand is visible, which is unusable.
 *
 * Open palm clears the canvas - a simple gesture-driven affordance you can
 * swap out later (e.g. for a UI button, or a dedicated "clear" gesture).
 */
export default function AirCanvas({ landmarks, width = 640, height = 480 }) {
  const canvasRef = useRef(null);
  const smootherRef = useRef(new PointSmoother(0.5));
  const lastPointRef = useRef(null); // last drawn point, in canvas pixel space
  const currentGestureRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#22d3ee";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!landmarks) {
      // Hand left the frame - lift the pen so we don't draw a line jumping
      // from the old position to the new one when it reappears.
      lastPointRef.current = null;
      smootherRef.current.reset();
      return;
    }

    const gesture = recognizeGesture(landmarks);
    currentGestureRef.current = gesture;

    if (gesture === "OPEN_PALM") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastPointRef.current = null;
      return;
    }

    // Index fingertip is landmark 8. Landmarks are normalized [0,1]; the
    // video (and this canvas) is mirrored horizontally for a natural
    // "looking in a mirror" feel, so flip x.
    const rawTip = landmarks[8];
    const mirroredX = 1 - rawTip.x;
    const smoothed = smootherRef.current.next({ x: mirroredX, y: rawTip.y });
    const point = { x: smoothed.x * canvas.width, y: smoothed.y * canvas.height };

    if (gesture === "PEN") {
      if (lastPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
      lastPointRef.current = point;
    } else {
      // Not in pen pose - pen is "up". Don't draw, and don't connect the
      // next stroke back to this position.
      lastPointRef.current = null;
    }
  }, [landmarks]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
