import { Circle, Dimensions, toroidalDelta } from './geometry';

export interface Vector {
  x: number;
  y: number;
}

export interface CircularBody {
  circle: Circle;
  vector: Vector;
  mass: number;
}

// Container needed for wrapping/torus calculations
export const circlesCollision = (
  container: Dimensions,
  a: CircularBody,
  b: CircularBody,
) => {
  const r = 0.5;
  const aResultVector = {
    x:
      (r * (a.vector.x * (a.mass - b.mass) + 2 * b.mass * b.vector.x)) /
      (a.mass + b.mass),
    y:
      (r * (a.vector.y * (a.mass - b.mass) + 2 * b.mass * b.vector.y)) /
      (a.mass + b.mass),
  };
  const bResultVector = {
    x:
      (r * (b.vector.x * (b.mass - a.mass) + 2 * a.mass * a.vector.x)) /
      (a.mass + b.mass),
    y:
      (r * (b.vector.y * (b.mass - a.mass) + 2 * a.mass * a.vector.y)) /
      (a.mass + b.mass),
  };

  // Balls most not be coliding anymore so that collision is not detected again
  const aResultPos = {
    x:
      (a.circle.position.x + aResultVector.x + container.width) %
      container.width,
    y:
      (a.circle.position.y + aResultVector.y + container.height) %
      container.height,
  };

  const bResultPos = {
    x:
      (b.circle.position.x + bResultVector.x + container.width) %
      container.width,
    y:
      (b.circle.position.y + bResultVector.y + container.height) %
      container.height,
  };

  return [
    {
      ...a,
      circle: { ...a.circle, position: aResultPos },
      vector: aResultVector,
    },
    {
      ...b,
      circle: { ...b.circle, position: bResultPos },
      vector: bResultVector,
    },
  ];
};

export const haveCirclesCollided = (
  container: Dimensions,
  a: Circle,
  b: Circle,
) => {
  const d = toroidalDelta(container, a.position, b.position);
  console.log('COL?', Math.sqrt(d.x * d.x + d.y * d.y), a.radius + b.radius);
  return Math.sqrt(d.x * d.x + d.y * d.y) < a.radius + b.radius;
};
