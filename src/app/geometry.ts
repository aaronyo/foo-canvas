export interface Dimension {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export const midpoint = (a: Point, b: Point) => {
  return {
    x: Math.abs((a.x - b.x) / 2) + Math.min(a.x, b.x),
    y: Math.abs((a.y - b.y) / 2) + Math.min(a.y, b.y),
  };
};

const zoomDimension = (factor: number, origin: number, subject: number) => {
  const delta = subject - origin;
  const scaled = factor * delta;
  return origin + scaled;
};

export const zoom = (factor: number, origin: Point, subject: Point) => {
  return {
    x: zoomDimension(factor, origin.x, subject.x),
    y: zoomDimension(factor, origin.y, subject.y),
  };
};

export const delta = (a: Point, b: Point) => ({
  x: a.x - b.x,
  y: a.y - b.y,
});
