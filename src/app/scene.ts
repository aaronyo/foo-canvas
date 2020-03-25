import fp from 'lodash/fp';

import { Dimension } from './geometry';
import { KeyState } from './keyboard';

const ACCELERATION = 0.01;
const MAX_VELOCITY = 0.01;
const REVS_PER_SECOND = 0.5;

export const initScene = () => {
  const w = 16;
  const h = 9;

  return {
    universe: {
      width: w,
      height: h,
      center: {
        x: w / 2,
        y: h / 2,
      },
    },

    ship: {
      x: w / 2,
      y: h / 2,
      width: 0.1,
      height: 0.1,
      yVelocity: 0,
      xVelocity: 0,
      rotation: 0,
    },

    enemy: {
      x: w / 2,
      y: h / 2,
      width: 0.1,
      height: 0.1,
    },

    fieldOfView: 1 / 2,
  };
};

export type GameScene = ReturnType<typeof initScene>;

type Ship = GameScene['ship'];
type Enemy = GameScene['enemy'];

function thrustShip(ship: Ship, deltaSeconds: number) {
  // Create a thrust vector
  const thrustY = -Math.cos(ship.rotation) * ACCELERATION * deltaSeconds;
  const thrustX = Math.sin(ship.rotation) * ACCELERATION * deltaSeconds;

  // Calculate the new velocity vector by adding velocity + thrust vectors
  const yVel = ship.yVelocity + thrustY;
  const xVel = ship.xVelocity + thrustX;
  const vel = Math.sqrt(Math.pow(yVel, 2) + Math.pow(xVel, 2));

  // Cap the maximum velocity
  const cappedVel =
    vel > 0 ? Math.min(vel, MAX_VELOCITY) : Math.max(vel, 0 - MAX_VELOCITY);

  // Recalculte x and y velocity based on the capped total velocity
  return {
    ...ship,
    yVelocity: (yVel / vel) * cappedVel,
    xVelocity: (xVel / vel) * cappedVel,
  };
}

function rotateShip(ship: Ship, dir: 1 | -1, deltaSeconds: number) {
  const rotationDelta = dir * 2 * Math.PI * REVS_PER_SECOND * deltaSeconds;
  return {
    ...ship,
    rotation: (ship.rotation + rotationDelta) % (2 * Math.PI),
  };
}

function moveShip(bounds: Dimension, ship: Ship) {
  return {
    ...ship,
    y: (ship.y + ship.yVelocity + bounds.height) % bounds.height,
    x: (ship.x + ship.xVelocity + bounds.width) % bounds.width,
  };
}

export const updateShip = (
  keyState: KeyState,
  deltaSeconds: number,
  bounds: Dimension,
) => {
  const shipUpdates = [
    keyState.left.isDown &&
      ((ship: Ship) => rotateShip(ship, -1, deltaSeconds)),
    keyState.right.isDown &&
      ((ship: Ship) => rotateShip(ship, 1, deltaSeconds)),
    keyState.thrust.isDown && ((ship: Ship) => thrustShip(ship, deltaSeconds)),
    (ship: Ship) => moveShip(bounds, ship),
  ];
  return fp.flow(fp.filter(fp.identity, shipUpdates));
};

// With consideration for wrapping around the edges of the universe, determine
// the minimum x and y deltas from the ship (origin) to the enemy
export const enemyDelta = (
  universeDims: Dimension,
  ship: Ship,
  enemy: Enemy,
) => {
  let deltaX = enemy.x - ship.x;
  let distanceX = Math.abs(deltaX);
  if (distanceX > universeDims.width / 2) {
    // shorter distance
    distanceX = universeDims.width - distanceX;
    deltaX = deltaX > 0 ? 0 - distanceX : distanceX;
  }

  let deltaY = enemy.y - ship.y;
  let distanceY = Math.abs(deltaY);
  if (distanceY > universeDims.height / 2) {
    // shorter distance
    distanceY = universeDims.height - distanceY;
    deltaY = deltaY > 0 ? 0 - distanceY : distanceY;
  }
  return {
    x: deltaX,
    y: deltaY,
  };
};
