export type Rect = { x: number; y: number; w: number; h: number };

export function clampToBounds(x: number, y: number, width: number, height: number) {
  return {
    x: Math.max(10, Math.min(width - 10, x)),
    y: Math.max(10, Math.min(height - 10, y)),
  };
}

export function insideRect(point: { x: number; y: number }, rect: Rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

export function detectZone(point: { x: number; y: number }, zones: Record<string, Rect>) {
  const match = Object.entries(zones).find(([, rect]) => insideRect(point, rect));
  return match?.[0] ?? 'world';
}
