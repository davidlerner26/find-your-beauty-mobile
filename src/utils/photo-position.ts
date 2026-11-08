export type Focus = { x: number; y: number };

const clamp = (value: number) => Math.min(100, Math.max(0, value));

// How the focal point (0-100 on each axis, like the `object-position` of the site) changes when the photo is dragged
// by (dx, dy) pixels inside a frame, where it is shown cropped (`cover`). The part of the photo that sticks out of the
// frame is how far it can move; an axis with no overflow does not move.
export function dragPosition(
  position: Focus,
  drag: { dx: number; dy: number },
  frame: { width: number; height: number },
  photo: { width: number; height: number },
): Focus {
  if (!photo.width || !photo.height) return position;
  const scale = Math.max(frame.width / photo.width, frame.height / photo.height);
  const overflowX = photo.width * scale - frame.width;
  const overflowY = photo.height * scale - frame.height;
  return {
    // Dragging the photo to the right shows more of its left side, hence the minus
    x: overflowX > 1 ? clamp(position.x - (drag.dx / overflowX) * 100) : position.x,
    y: overflowY > 1 ? clamp(position.y - (drag.dy / overflowY) * 100) : position.y,
  };
}
