/**
 * Rule-based gesture recognition from the 21 MediaPipe hand landmarks.
 * No model training needed for these - just geometry. This gets you
 * surprisingly far (thumbs up, peace sign, open palm, pinch, "pen" pose)
 * before you'd ever need a trained classifier.
 *
 * Landmark index reference (MediaPipe Hands):
 *   0  wrist
 *   1-4   thumb  (4 = tip)
 *   5-8   index  (8 = tip)
 *   9-12  middle (12 = tip)
 *   13-16 ring   (16 = tip)
 *   17-20 pinky  (20 = tip)
 *
 * Landmarks are normalized [0,1] image coordinates, origin top-left,
 * y increases downward.
 */

const TIP = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
const PIP = { index: 6, middle: 10, ring: 14, pinky: 18 }; // thumb has no pip in this sense

/**
 * Curled/extended check for the four non-thumb fingers. Works by comparing
 * the tip's distance from the wrist against the pip joint's distance from
 * the wrist - if the tip is farther out than the pip, the finger is
 * extended. This is more rotation-tolerant than a naive y-coordinate check.
 */
function isFingerExtended(landmarks, tipIdx, pipIdx) {
  const wrist = landmarks[0];
  const tipDist = Math.hypot(
    landmarks[tipIdx].x - wrist.x,
    landmarks[tipIdx].y - wrist.y
  );
  const pipDist = Math.hypot(
    landmarks[pipIdx].x - wrist.x,
    landmarks[pipIdx].y - wrist.y
  );
  return tipDist > pipDist * 1.1; // small margin to avoid flicker at the boundary
}

/**
 * Thumb extension is handled separately because the thumb's joints don't
 * fold the same way as the other fingers. Comparing tip-to-index-mcp
 * distance against thumb-mcp-to-index-mcp distance works reasonably well
 * regardless of left/right hand.
 */
function isThumbExtended(landmarks) {
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const indexMcp = landmarks[5];
  const tipToIndexMcp = Math.hypot(
    thumbTip.x - indexMcp.x,
    thumbTip.y - indexMcp.y
  );
  const mcpToIndexMcp = Math.hypot(
    thumbMcp.x - indexMcp.x,
    thumbMcp.y - indexMcp.y
  );
  return tipToIndexMcp > mcpToIndexMcp * 1.3;
}

/** Returns { thumb, index, middle, ring, pinky } booleans. */
export function getFingerStates(landmarks) {
  return {
    thumb: isThumbExtended(landmarks),
    index: isFingerExtended(landmarks, TIP.index, PIP.index),
    middle: isFingerExtended(landmarks, TIP.middle, PIP.middle),
    ring: isFingerExtended(landmarks, TIP.ring, PIP.ring),
    pinky: isFingerExtended(landmarks, TIP.pinky, PIP.pinky),
  };
}

/**
 * Classifies a single frame of landmarks into a gesture name, or null if
 * nothing matches. Order matters - more specific gestures should be
 * checked before more general ones.
 */
export function recognizeGesture(landmarks) {
  if (!landmarks) return null;
  const f = getFingerStates(landmarks);

  // Pen pose: only index extended. This is the "draw mode" trigger.
  if (f.index && !f.middle && !f.ring && !f.pinky) {
    return "PEN";
  }

  // Peace sign: index + middle extended, ring + pinky curled.
  if (f.index && f.middle && !f.ring && !f.pinky) {
    return "PEACE";
  }

  // Thumbs up: only thumb extended, and it's pointing upward.
  if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
    const thumbTip = landmarks[4];
    const wrist = landmarks[0];
    if (thumbTip.y < wrist.y) return "THUMBS_UP";
    return "THUMBS_DOWN";
  }

  // Open palm: all five extended.
  if (f.thumb && f.index && f.middle && f.ring && f.pinky) {
    return "OPEN_PALM";
  }

  // Fist: nothing extended.
  if (!f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
    return "FIST";
  }

  return null;
}

/** Pinch distance between thumb tip and index tip, useful for click/drag UX. */
export function pinchDistance(landmarks) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  return Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
}

export function isPinching(landmarks, threshold = 0.05) {
  return pinchDistance(landmarks) < threshold;
}
