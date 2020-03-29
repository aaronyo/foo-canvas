import fp from 'lodash/fp';

import { Dimensions } from './geometry';
import { KeyState } from './keyboard';

const ACCELERATION = 0.01;
const MAX_VELOCITY = 0.01;
const REVS_PER_SECOND = 0.5;
const SECONDS_BETWEEN_EMBERS = 0.1;

const UNIVERSE_WIDTH = 9;
const UNIVERSE_HEIGHT = 6;
const FIELD_OF_VIEW = 1 / 2;

const EMBER_LIFETIME_SECONDS = 1;

export interface ThrustEmber {
  key: number;
  ageSeconds: number;
  brightness: number;
  position: { x: number; y: number };
}

export const initScene = () => {
  const w = UNIVERSE_WIDTH;
  const h = UNIVERSE_HEIGHT;

  return {
    dimensions: {
      width: w,
      height: h,
    },

    center: {
      x: w / 2,
      y: h / 2,
    },

    player: {
      position: { x: w / 2, y: h / 2 },
      width: 0,
      height: 0,
      yVelocity: 0,
      xVelocity: 0,
      rotation: 0,
      snappedRotation: 0,
      secondsUntilEmber: SECONDS_BETWEEN_EMBERS,
      thrustEmbers: [] as ThrustEmber[],
    },

    enemy: {
      position: { x: w / 2 + 1, y: h / 2 - 1 },
      width: 0,
      height: 0,
      yVelocity: 0,
      xVelocity: 0,
      rotation: 0,
      snappedRotation: 0,
      secondsUntilEmber: SECONDS_BETWEEN_EMBERS,
      thrustEmbers: [] as ThrustEmber[],
    },

    fieldOfView: FIELD_OF_VIEW,
  };
};

export type GameScene = ReturnType<typeof initScene>;

export type Ship = GameScene['player'];

const makeEmberFactory = () => {
  const seq = 0;
  const makeEmber = (ship: Ship) =>
    ({
      key: seq,
      ageSeconds: 0,
      brightness: 1,
      position: {
        x:
          ship.position.x -
          (Math.sin((ship.snappedRotation / 16) * 2 * Math.PI) * ship.height) /
            8,
        y:
          ship.position.y +
          (Math.cos((ship.snappedRotation / 16) * 2 * Math.PI) * ship.height) /
            8,
      },
    } as ThrustEmber);

  return {
    makeEmber,
  };
};

const emberFactory = makeEmberFactory();

const thrustShip = (deltaSeconds: number) => (ship: Ship) => {
  ship.secondsUntilEmber -= deltaSeconds;
  const [thrustEmbers, secondsUntilEmber] =
    ship.secondsUntilEmber < 0
      ? [
          fp.concat(ship.thrustEmbers, [emberFactory.makeEmber(ship)]),
          SECONDS_BETWEEN_EMBERS,
        ]
      : [ship.thrustEmbers, ship.secondsUntilEmber - deltaSeconds];

  const r = 2 * Math.PI * (ship.snappedRotation / 16);
  // Create a thrust vector
  const thrustY = -Math.cos(r) * ACCELERATION * deltaSeconds;
  const thrustX = Math.sin(r) * ACCELERATION * deltaSeconds;

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
    thrustEmbers,
    secondsUntilEmber,
    yVelocity: ship.yVelocity = (yVel / vel) * cappedVel,
    xVelocity: ship.xVelocity = (xVel / vel) * cappedVel,
  };
};

const stopThrust = (ship: Ship) => {
  return {
    ...ship,
    secondsUntilEmber: SECONDS_BETWEEN_EMBERS,
  };
};

const rotateShip = (dir: 1 | -1, deltaSeconds: number) => (ship: Ship) => {
  const rotationDelta = dir * 2 * Math.PI * REVS_PER_SECOND * deltaSeconds;
  return {
    ...ship,
    rotation: (ship.rotation + rotationDelta) % (2 * Math.PI),
    snappedRotation: Math.floor((16 * ship.rotation) / (2 * Math.PI)) % 16,
  };
};

const moveShip = (bounds: Dimensions) => (ship: Ship) => {
  return {
    ...ship,
    position: {
      x: (ship.position.x + ship.xVelocity + bounds.width) % bounds.width,
      y: (ship.position.y + ship.yVelocity + bounds.height) % bounds.height,
    },
  };
};

const ageEmbers = (deltaSeconds: number, lifetimeSeconds: number) => (
  ship: Ship,
) => {
  const ds = deltaSeconds;
  const ls = lifetimeSeconds;
  const thrustEmbers = fp.pipe(
    fp.map((ember: ThrustEmber) => ({
      ...ember,
      ageSeconds: ember.ageSeconds + ds,
      brightness: (ls - ember.ageSeconds - deltaSeconds) / ls,
    })),
    fp.filter((ember) => ember.brightness > 0),
  )(ship.thrustEmbers);
  return {
    ...ship,
    thrustEmbers,
  };
};

export const updateShip = (
  keyState: KeyState,
  deltaSeconds: number,
  dims: Dimensions,
) => (ship: Ship): Ship =>
  fp.flow(
    ageEmbers(deltaSeconds, EMBER_LIFETIME_SECONDS),
    keyState.left.isDown
      ? rotateShip(-1, deltaSeconds)
      : keyState.right.isDown
      ? rotateShip(1, deltaSeconds)
      : fp.identity,
    keyState.thrust.isDown ? thrustShip(deltaSeconds) : stopThrust,
    moveShip(dims),
  )(ship);
// With consideration for wrapping around the edges of the universe, determine
// the minimum x and y deltas from the ship (origin) to the enemy
export const enemyDelta = (
  universeDims: Dimensions,
  player: Ship,
  enemy: Ship,
) => {
  let deltaX = enemy.position.x - player.position.x;
  let distanceX = Math.abs(deltaX);
  if (distanceX > universeDims.width / 2) {
    // shorter distance
    distanceX = universeDims.width - distanceX;
    deltaX = deltaX > 0 ? 0 - distanceX : distanceX;
  }

  let deltaY = enemy.position.y - player.position.y;
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

export const deriveShipSize = (shipSprite: Dimensions, vpWidth: number) => (
  ship: Ship,
) => {
  ship.width =
    ((shipSprite.width * UNIVERSE_WIDTH) / vpWidth) * (1 / FIELD_OF_VIEW);
  ship.height = (ship.width * shipSprite.height) / shipSprite.width;
  return ship;
};
