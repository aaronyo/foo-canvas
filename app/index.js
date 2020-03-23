/**
 * Application entry point
 */

// Load application styles
import 'styles/index.scss';
import fp from 'lodash/fp';
import * as PIXI from 'pixi.js';
import * as util from './util';
import * as scene from './scene';
import * as projectionLib from './projection';

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
const maxZoom = 0.7;
const zoomMargin = 500;

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

function updateScene(path, fn, scn) {
  return fp.set(path, fn(fp.get(path, scn)), scn);
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

function main() {
  // The application will create a renderer using WebGL, if possible,
  // with a fallback to a canvas render. It will also setup the ticker
  // and the root stage PIXI.Container
  const app = new PIXI.Application({
    backgroundColor: 0xffffff,
    ...viewport,
    resolution: 1,
  });

  let text = new PIXI.Text('This is a pixi text', {
    fontFamily: 'Arial',
    fontSize: 16,
    fill: 0xff1010,
    align: 'center',
  });

  // The application will create a canvas element for you that you
  // can then insert into the DOM
  document.body.appendChild(app.view);

  let scn = makeScene();
  const keyState = makeKeyState();
  // load the texture we need
  //const loader = new PIXI.Loader();
  app.loader
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
      const [background] = makeBackground(viewport);
      app.stage.addChild(background);
      app.stage.addChild(ship);
      app.stage.addChild(enemy);
      app.stage.addChild(text);

      app.ticker.add(delta => {
        // each frame we spin the ship around a bit
        //      ship.rotation += 0.01;
        play(delta);
      });

      const projection = projectionLib.configure({
        minZoom,
        maxZoom,
        zoomMargin,
      });

      function play(frameDelta) {
        const deltaSeconds = (1 / app.ticker.FPS) * frameDelta;

        //Use the ship's velocity to make it move
        scn = updateScene(
          'ship',
          scene.updateShip(keyState, deltaSeconds, scn.universe),
          scn,
        );

        const enemyDelta = projection.enemyDelta(
          scn.universe,
          scn.ship,
          scn.enemy,
        );
        const zoom = projection.zoom(viewport, enemyDelta);

        enemy.x = enemyDelta.x * zoom + viewport.width / 2;
        enemy.y = enemyDelta.y * zoom + viewport.height / 2;

        background.tilePosition.x =
          background.tilePosition.x - scn.ship.xVelocity * 0.1;
        background.tilePosition.y =
          background.tilePosition.y - scn.ship.yVelocity * 0.1;

        background.tileScale.x = 1.5;
        background.tileScale.y = 1.5;
        enemy.scale.x = 0.5 * zoom;
        enemy.scale.y = 0.5 * zoom;
        ship.scale.x = 0.5 * zoom;
        ship.scale.y = 0.5 * zoom;

        ship.rotation = scn.ship.rotation;
        text.text = `rot: ${util.round(
          scn.ship.rotation,
          2,
        )}, xVel:${util.round(scn.ship.xVelocity, 2)}, yVel:${util.round(
          scn.ship.yVelocity,
          2,
        )}, x:${util.round(scn.ship.x, 0)}, y:${util.round(
          scn.ship.y,
          0,
        )}, delta: ${deltaSeconds}}
`;
      }
    });
}

window.onload = main;

// ================================
// START YOUR APP HERE
// ================================
