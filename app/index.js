/**
 * Application entry point
 */

// Load application styles
import 'styles/index.scss';
import fp from 'lodash/fp';
import * as PIXI from 'pixi.js';
import * as util from './util';

function getCanvas() {
  return document.getElementById('my-canvas');
}

function keyboard(keyCode) {
  let key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = event => {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  //The `upHandler`
  key.upHandler = event => {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  //Attach event listeners
  window.addEventListener('keydown', key.downHandler.bind(key), false);
  window.addEventListener('keyup', key.upHandler.bind(key), false);
  return key;
}

const viewport = {
  width: 1200,
  height: 900,
};

const minZoom = 0.3;
const maxZoom = 0.8;
const zoomMargin = 300;

viewport.center = {
  x: viewport.width / 2,
  y: viewport.height / 2,
};

function makeScene() {
  const universe = {
    width: viewport.width / minZoom,
    height: viewport.height / minZoom,
  };

  return {
    universe,

    ship: {
      x: universe.width / 2,
      y: universe.height / 2,
      yVelocity: 0,
      xVelocity: 0,
      rotation: 0,
    },
    enemy: {
      x: 1000,
      y: 1000,
    },
  };
}

function updateScene(path, fn, scene) {
  return fp.set(path, fn(fp.get(path, scene)), scene);
}

function thrustShip(ship) {
  const maxV = 10;
  const power = 0.25;

  // Create a thrust vector
  const thrustY = -Math.cos(ship.rotation) * power;
  const thrustX = Math.sin(ship.rotation) * power;

  // Calculate the new velocity vector by adding velocity + thrust vectors
  const yVel = ship.yVelocity + thrustY;
  const xVel = ship.xVelocity + thrustX;
  const vel = Math.sqrt(Math.pow(yVel, 2) + Math.pow(xVel, 2));

  // Cap the maximum velocity
  const cappedVel = vel > 0 ? Math.min(vel, maxV) : Math.max(vel, 0 - maxV);

  // Recalculte x and y velocity based on the capped total velocity
  return {
    ...ship,
    yVelocity: (yVel / vel) * cappedVel,
    xVelocity: (xVel / vel) * cappedVel,
  };
}

function rotateShip(ship, dir) {
  return {
    ...ship,
    rotation: (ship.rotation + 0.05 * dir) % (2 * Math.PI),
  };
}

function moveShip(universe, ship) {
  return {
    ...ship,
    //    y: ship.y + ship.yVelocity,
    //    x: ship.x + ship.xVelocity,
    y: (ship.y + ship.yVelocity + universe.height) % universe.height,
    x: (ship.x + ship.xVelocity + universe.width) % universe.width,
  };
}

function makeKeyState() {
  const state = {
    left: { isDown: false },
    right: { isDown: false },
    thrust: { isDown: false },
  };

  // Listen for frame updates
  let left = keyboard(37); // left arrow
  let right = keyboard(39); // right arrow
  let thrust = keyboard(38); // up arrow
  thrust.press = () => {
    state.thrust.isDown = true;
  };
  thrust.release = () => {
    state.thrust.isDown = false;
  };

  left.press = () => {
    state.left.isDown = true;
  };

  left.release = () => {
    state.left.isDown = false;
  };

  right.press = () => {
    state.right.isDown = true;
  };

  right.release = () => {
    state.right.isDown = false;
  };

  return state;
}

function makeBackground({ width, height }) {
  const texture = PIXI.Texture.from('assets/space.png');
  const bg = new PIXI.TilingSprite(texture, width, height);
  bg.tilePosition.x = 0;
  bg.tilePosition.y = 0;
  return [bg, texture];

  // const gfx = new PIXI.Graphics();
  // for (let i = 0; i <= width; i += 50) {
  //   const lwidth = i % width === 0 ? 10 : 1;
  //   gfx
  //     .lineStyle(lwidth, 0xaaaaff + i * 100, 1, 1)
  //     .moveTo(i, 0)
  //     .lineTo(i, height);
  // }
  // for (let i = 0; i <= height; i += 50) {
  //   const lwidth = i % height === 0 ? 10 : 1;
  //   gfx
  //     .lineStyle(lwidth, 0xaaaaff + i * 100, 1, 0)
  //     .moveTo(0, i)
  //     .lineTo(width, i);
  // }
  // return gfx;
}

function handleUniverseEdge(background, ship, coord, dim) {
  if (background[coord] > 0) {
    ship[coord] = viewport[dim] / 2 - background[coord];
    background[coord] = 0;
  } else if (background[coord] < viewport[dim] - background[dim]) {
    ship[coord] =
      viewport[dim] / 2 + (viewport[dim] - background[dim] - background[coord]);
    background[coord] = viewport[dim] - background[dim];
  } else {
    ship[coord] = viewport.center[coord];
  }
}

function main() {
  // The application will create a renderer using WebGL, if possible,
  // with a fallback to a canvas render. It will also setup the ticker
  // and the root stage PIXI.Container
  const app = new PIXI.Application({ backgroundColor: 0xffffff, ...viewport });

  let text = new PIXI.Text('This is a pixi text', {
    fontFamily: 'Arial',
    fontSize: 16,
    fill: 0xff1010,
    align: 'center',
  });

  // The application will create a canvas element for you that you
  // can then insert into the DOM
  document.body.appendChild(app.view);

  let scene = makeScene();
  const keyState = makeKeyState();
  // load the texture we need
  const loader = new PIXI.Loader();
  loader
    .add('ship', 'assets/ship-color.png')
    .add('enemy', 'assets/ship-enemy.png')
    .load((loader, resources) => {
      // This creates a texture from a 'bunny.png' image
      const ship = new PIXI.Sprite(resources.ship.texture);
      const enemy = new PIXI.Sprite(resources.enemy.texture);

      // Rotate around the center
      ship.scale.x = 0.5;
      ship.scale.y = 0.5;
      ship.anchor.x = 0.5;
      ship.anchor.y = 0.75;
      ship.x = viewport.center.x;
      ship.y = viewport.center.y;
      enemy.scale.x = 0.5;
      enemy.scale.y = 0.5;
      enemy.anchor.x = 0.5;
      enemy.anchor.y = 0.25;
      // Add the ship to the scene we are building
      const [background, texture] = makeBackground(viewport);
      app.stage.addChild(background);
      app.stage.addChild(ship);
      app.stage.addChild(enemy);
      app.stage.addChild(text);

      app.ticker.add(delta => {
        // each frame we spin the ship around a bit
        //      ship.rotation += 0.01;
        play();
      });

      const moveShip_ = _.partial(moveShip, scene.universe);

      function play() {
        const shipUpdates = [
          keyState.left.isDown && (ship => rotateShip(ship, -1)),
          keyState.right.isDown && (ship => rotateShip(ship, 1)),
          keyState.thrust.isDown && thrustShip,
          moveShip_,
        ];

        //Use the ship's velocity to make it move
        scene = updateScene(
          'ship',
          fp.flow(fp.filter(fp.identity, shipUpdates)),
          scene,
        );

        let enemyOffsetX = scene.enemy.x - scene.ship.x;
        let enemyDistanceX = Math.abs(enemyOffsetX);
        if (enemyDistanceX > scene.universe.width / 2) {
          // shorter distance
          enemyDistanceX = scene.universe.width - enemyDistanceX;
          enemyOffsetX = enemyOffsetX > 0 ? 0 - enemyDistanceX : enemyDistanceX;
        }

        let enemyOffsetY = scene.enemy.y - scene.ship.y;
        let enemyDistanceY = Math.abs(enemyOffsetY);
        let centerY = scene.ship.y;
        if (enemyDistanceY > scene.universe.height / 2) {
          // shorter distance
          enemyDistanceY = scene.universe.height - enemyDistanceY;
          enemyOffsetY = enemyOffsetY > 0 ? 0 - enemyDistanceY : enemyDistanceY;
        }

        const scale = Math.max(
          Math.min(
            viewport.width / 2 / (enemyDistanceX + zoomMargin),
            viewport.height / 2 / (enemyDistanceY + zoomMargin),
            maxZoom,
          ),
          minZoom,
        );

        enemy.x = enemyOffsetX * scale + viewport.width / 2;
        enemy.y = enemyOffsetY * scale + viewport.height / 2;

        background.tilePosition.x =
          background.tilePosition.x - scene.ship.xVelocity;
        background.tilePosition.y =
          background.tilePosition.y - scene.ship.yVelocity;

        background.tileScale.x = 1.5;
        background.tileScale.y = 1.5;
        enemy.scale.x = 0.5 * scale;
        enemy.scale.y = 0.5 * scale;
        ship.scale.x = 0.5 * scale;
        ship.scale.y = 0.5 * scale;

        // if (Math.abs(
        //   ((scene.ship.x - scene.enemy.x) < viewport.width / 2)
        //     || ((scene.ship.y - scene.enemy.y) < viewport.height / 2))) {
        // }
        // handleUniverseEdge(background, ship, 'x', 'width');
        // handleUniverseEdge(background, ship, 'y', 'height');

        ship.rotation = scene.ship.rotation;
        text.text = `rot: ${util.round(
          scene.ship.rotation,
          2,
        )}, xVel:${util.round(scene.ship.xVelocity, 2)}, yVel:${util.round(
          scene.ship.yVelocity,
          2,
        )}, x:${util.round(scene.ship.x, 0)}, y:${util.round(scene.ship.y, 0)}
`;
        //      console.log(sceneState.ship.yVelocity);
      }
    });
}

window.onload = main;

// ================================
// START YOUR APP HERE
// ================================
