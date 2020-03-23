import fp from 'lodash/fp';

const ACCELERATION = 30;
const MAX_VELOCITY = 20;
const REVS_PER_SECOND = 0.5;

function thrustShip(ship, deltaSeconds) {
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

function rotateShip(ship, dir, deltaSeconds) {
  const rotationDelta = dir * 2 * Math.PI * REVS_PER_SECOND * deltaSeconds;
  return {
    ...ship,
    rotation: (ship.rotation + rotationDelta) % (2 * Math.PI),
  };
}

function moveShip(bounds, ship) {
  return {
    ...ship,
    y: (ship.y + ship.yVelocity + bounds.height) % bounds.height,
    x: (ship.x + ship.xVelocity + bounds.width) % bounds.width,
  };
}

export const updateShip = (keyState, deltaSeconds, bounds) => {
  const shipUpdates = [
    keyState.left.isDown && (ship => rotateShip(ship, -1, deltaSeconds)),
    keyState.right.isDown && (ship => rotateShip(ship, 1, deltaSeconds)),
    keyState.thrust.isDown && (ship => thrustShip(ship, deltaSeconds)),
    ship => moveShip(bounds, ship),
  ];
  return fp.flow(fp.filter(fp.identity, shipUpdates));
};
