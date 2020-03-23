// Load application styles
import fp from 'lodash/fp';
import * as PIXI from 'pixi.js';

import shipImg from '../assets/ship-color.png';
import enemyImg from '../assets/ship-enemy.png';
import spaceBackground from '../assets/space.png';
import { makeKeyState } from './keyboard';
import * as projectionLib from './projection';
import * as scene from './scene';
import * as util from './util';

const VIEWPORT_WIDTH = 1200;

const minZoom = 1;
const maxZoom = 4;
const zoomMargin = 350;

function updateScene(
  path: string[],
  fn: (sceneItem: unknown) => unknown,
  scn: scene.GameScene,
) {
  return fp.set(path, fn(fp.get(path, scn)), scn);
}

function makeBackground({ width, height }) {
  console.log('background', width, height);
  const texture = PIXI.Texture.from(spaceBackground);
  const bg = new PIXI.TilingSprite(texture, width, height);
  bg.tilePosition.x = 0;
  bg.tilePosition.y = 0;
  return bg;

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

export const makeGameApp = () => {
  // The application will create a renderer using WebGL, if possible,
  // with a fallback to a canvas render. It will also setup the ticker
  // and the root stage PIXI.Container

  let scn = scene.initScene();

  const projection = projectionLib.configure({
    minZoom,
    maxZoom,
    zoomMargin,
    universeDims: scn.universe,
    viewportWidth: VIEWPORT_WIDTH,
  });

  const app = new PIXI.Application({
    backgroundColor: 0xffffff,
    ...projection.viewport,
    resolution: 1,
  });

  const text = new PIXI.Text('This is a pixi text', {
    fontFamily: 'Arial',
    fontSize: 16,
    fill: 0xff1010,
    align: 'center',
  });

  const keyState = makeKeyState();
  // load the texture we need
  //const loader = new PIXI.Loader();
  app.loader
    .add('ship', shipImg)
    .add('enemy', enemyImg)
    .load((_loader, resources) => {
      // This creates a texture from a 'bunny.png' image
      const ship = new PIXI.Sprite(resources.ship.texture);
      const enemy = new PIXI.Sprite(resources.enemy.texture);

      // Rotate around the center
      ship.width = scn.ship.width * projection.scale;
      ship.height = scn.ship.height * projection.scale;
      console.log('SHIP', ship.width, projection.scale, scn.ship.width);
      ship.anchor.x = 0.5;
      ship.anchor.y = 0.75;
      ship.x = projection.viewport.center.x;
      ship.y = projection.viewport.center.y;
      enemy.width = scn.enemy.width * projection.scale;
      enemy.height = scn.enemy.height * projection.scale;
      enemy.anchor.x = 0.5;
      enemy.anchor.y = 0.5;
      // Add the ship to the scene we are building
      const background = makeBackground(projection.viewport);
      app.stage.addChild(background);
      app.stage.addChild(ship);
      app.stage.addChild(enemy);
      app.stage.addChild(text);

      function play(frameDelta: number) {
        const deltaSeconds = (1 / app.ticker.FPS) * frameDelta;

        //Use the ship's velocity to make it move
        scn = updateScene(
          ['ship'],
          scene.updateShip(keyState, deltaSeconds, scn.universe),
          scn,
        );

        const enemyDelta = scene.enemyDelta(scn.universe, scn.ship, scn.enemy);
        const zoom = projection.zoom(enemyDelta);

        enemy.x =
          enemyDelta.x * projection.scale * zoom + projection.viewport.center.x;
        enemy.y =
          enemyDelta.y * projection.scale * zoom + projection.viewport.center.y;

        background.tilePosition.x =
          background.tilePosition.x -
          scn.ship.xVelocity * 0.3 * projection.scale;
        background.tilePosition.y =
          background.tilePosition.y -
          scn.ship.yVelocity * 0.3 * projection.scale;

        background.tileScale.x = 1.5;
        background.tileScale.y = 1.5;
        ship.width = scn.ship.width * projection.scale * zoom;
        ship.height = scn.ship.height * projection.scale * zoom;
        enemy.width = scn.enemy.width * projection.scale * zoom;
        enemy.height = scn.enemy.height * projection.scale * zoom;

        ship.rotation = scn.ship.rotation;
        text.text = `rot: ${util.round(
          scn.ship.rotation,
          2,
        )}, xVel:${util.round(scn.ship.xVelocity, 2)}, yVel:${util.round(
          scn.ship.yVelocity,
          2,
        )}, x:${util.round(scn.ship.x, 2)}, y:${util.round(
          scn.ship.y,
          2,
        )}, ex:${util.round(enemy.x, 2)}, ey:${util.round(
          enemy.y,
          2,
        )}, scale: ${util.round(projection.scale, 2)}, zoom: ${util.round(
          zoom,
          2,
        )}
`;
      }

      app.ticker.add((delta) => {
        // each frame we spin the ship around a bit
        //      ship.rotation += 0.01;
        play(delta);
      });
    });

  return app;
};

// ================================
// START YOUR APP HERE
// ================================
