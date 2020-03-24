// Load application styles
import fp from 'lodash/fp';
import * as PIXI from 'pixi.js';

import shipImg from '../assets/ship-color.png';
import enemyImg from '../assets/ship-enemy.png';
import spaceBackground from '../assets/space.png';
import * as geometry from './geometry';
import { makeKeyState } from './keyboard';
import * as projectionLib from './projection';
import * as scene from './scene';
import * as util from './util';

const VIEWPORT_WIDTH = 900;

const minZoom = 1;
const maxZoom = 4;
const zoomMargin = 500;

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
      ship.pivot.x = ship.width / 2;
      ship.pivot.y = (ship.height * 3) / 4;
      ship.width = scn.ship.width * projection.scale;
      ship.height = scn.ship.height * projection.scale;
      ship.position.x = 100;
      ship.position.y = 100;

      enemy.pivot.x = enemy.width / 2;
      enemy.pivot.y = enemy.height / 2;
      enemy.width = scn.enemy.width * projection.scale;
      enemy.height = scn.enemy.height * projection.scale;
      enemy.position.x = 100;
      enemy.position.y = 100;

      const background = makeBackground(projection.viewport);
      app.stage.addChild(background);
      background.pivot.x = background.width / 2;
      background.pivot.y = background.height / 2;
      background.position.x = background.width / 2;
      background.position.y = background.height / 2;

      const actionPlane = new PIXI.Container();
      app.stage.addChild(actionPlane);
      actionPlane.addChild(ship);
      actionPlane.addChild(enemy);
      app.stage.addChild(text);
      actionPlane.width = projection.viewport.width;
      actionPlane.height = projection.viewport.width;
      actionPlane.pivot.x = actionPlane.width / 2;
      actionPlane.pivot.y = actionPlane.height / 2;
      actionPlane.position.x = actionPlane.width / 2;
      actionPlane.position.y = actionPlane.height / 2;
      console.log(
        'pivot 1',
        actionPlane.pivot,
        actionPlane.width,
        projection.viewport.width,
      );

      let lastMidpoint: geometry.Point | null = null;
      function play(frameDelta: number) {
        const deltaSeconds = (1 / app.ticker.FPS) * frameDelta;

        //Use the ship's velocity to make it move
        scn = updateScene(
          ['ship'],
          scene.updateShip(keyState, deltaSeconds, scn.universe),
          scn,
        );

        const enemyDelta = scene.enemyDelta(scn.universe, scn.ship, scn.enemy);
        const midpoint = geometry.midpoint(scn.ship, scn.enemy);
        const xShift = scn.universe.center.x - midpoint.x;
        const yShift = scn.universe.center.y - midpoint.y;
        const zoom = projection.zoomFactor(enemyDelta);

        enemy.x =
          (scn.enemy.x + xShift) * projection.scale -
          scn.fieldOfView * projection.viewport.width;
        enemy.y =
          (scn.enemy.y + yShift) * projection.scale -
          scn.fieldOfView * projection.viewport.height;
        ship.x =
          (scn.ship.x + xShift) * projection.scale -
          scn.fieldOfView * projection.viewport.width;
        ship.y =
          (scn.ship.y + yShift) * projection.scale -
          scn.fieldOfView * projection.viewport.height;

        actionPlane.scale.x = zoom;
        actionPlane.scale.y = zoom;

        const midpointShift = lastMidpoint
          ? geometry.delta(lastMidpoint, midpoint)
          : { x: 0, y: 0 };
        lastMidpoint = midpoint;
        background.tilePosition.x += midpointShift.x * projection.scale * 0.1;
        background.tilePosition.y += midpointShift.y * projection.scale * 0.1;

        background.scale.x = 0.75 + zoom * 0.25;
        background.scale.y = 0.75 + zoom * 0.25;

        ship.rotation = scn.ship.rotation;
        text.text = `rot: ${util.round(
          scn.ship.rotation,
          2,
        )}, xVel:${util.round(scn.ship.xVelocity, 2)}, yVel:${util.round(
          scn.ship.yVelocity,
          2,
        )}, x:${util.round(ship.x, 2)}, y:${util.round(
          ship.y,
          2,
        )}, ex:${util.round(enemy.x, 2)}, ey:${util.round(
          enemy.y,
          2,
        )}, mps: ${util.round(midpointShift.x, 2)}, zoom: ${util.round(
          zoom,
          2,
        )}, width: ${util.round(actionPlane.width, 2)}
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
