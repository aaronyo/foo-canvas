export interface Dimensions {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Circle {
  position: { x: number; y: number };
  radius: number;
}

export const midpoint = (a: Point, b: Point) => {
  return {
    x: Math.abs((a.x - b.x) / 2) + Math.min(a.x, b.x),
    y: Math.abs((a.y - b.y) / 2) + Math.min(a.y, b.y),
  };
};

const toroidalDeltaDim = (length: number, a: number, b: number) => {
  const d = a - b;
  return d > length / 2 ? d - length : d < length / -2 ? length + d : d;
};

export const toroidalDelta = (dims: Dimensions, a: Point, b: Point) => {
  return {
    x: toroidalDeltaDim(dims.width, a.x, b.x),
    y: toroidalDeltaDim(dims.height, a.y, b.y),
  };
};

const toroidalMidDim = (length: number, a: number, b: number) => {
  let d = Math.abs(a - b);

  if (d > length / 2) {
    d = length - d;
    return (Math.max(a, b) + d / 2) % length;
  }
  return Math.min(a, b) + d / 2;
};

export const toroidalMidpoint = (dims: Dimensions, a: Point, b: Point) => {
  return {
    x: toroidalMidDim(dims.width, a.x, b.x),
    y: toroidalMidDim(dims.height, a.y, b.y),
  };
};

const zoomDimensions = (factor: number, origin: number, subject: number) => {
  const delta = subject - origin;
  const scaled = factor * delta;
  return origin + scaled;
};

export const zoom = (factor: number, origin: Point, subject: Point) => {
  return {
    x: zoomDimensions(factor, origin.x, subject.x),
    y: zoomDimensions(factor, origin.y, subject.y),
  };
};

export const delta = (a: Point, b: Point) => ({
  x: a.x - b.x,
  y: a.y - b.y,
});
