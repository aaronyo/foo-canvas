// Load application styles
import fp from 'lodash/fp';
import * as PIXI from 'pixi.js';

import enemyImg from '../assets/criss-cross.png';
import shipSheetImg from '../assets/saucer-sheet.png';
import shipImg from '../assets/ship2.png';
import spaceBackground from '../assets/space.png';
import * as geometry from './geometry';
import { makeKeyState } from './keyboard';
import * as projectionLib from './projection';
import * as scene from './scene';
import * as util from './util';

const VIEWPORT_WIDTH = 320;

const minZoom = 1;
const maxZoom = 2.5;
const zoomMargin = VIEWPORT_WIDTH / 2;

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

function updateScene(
  path: string[],
  fn: (sceneItem: unknown) => unknown,
  scn: scene.GameScene,
) {
  const original = fp.get(path, scn);
  return fp.set(path, fn(original), scn);
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

const createOrUpdateEmber = (c: PIXI.Container, ember: PIXI.DisplayObject) => {
  c.addChild(ember);
};

export const makeGameApp = () => {
  // The application will create a renderer using WebGL, if possible,
  // with a fallback to a canvas render. It will also setup the ticker
  // and the root stage PIXI.Container

  let scn = scene.initScene();
  const projection = projectionLib.configure({
    minZoom,
    maxZoom,
    zoomMargin,
    universe: scn.universe,
    fieldOfView: scn.fieldOfView,
    viewportWidth: VIEWPORT_WIDTH,
  });

  console.log('VIEWPORT', projection.viewport);
  console.log('WINDOW', window.devicePixelRatio, window.innerWidth);

  const app = new PIXI.Application({
    backgroundColor: 0xffffff,
    ...projection.viewport,
    resolution: 1,
  });

  const resizeCanvas = () => {
    app.view.style.width = window.innerWidth + 'px';
    app.view.style.height = (window.innerWidth * 9) / 16 + 'px';
    app.view.style.imageRendering = 'pixelated';
    app.view.style.position = 'absolute';
    app.view.style.top = '0px';
    app.view.style.bottom = '0px';
    app.view.style.margin = 'auto';
  };
  resizeCanvas();

  window.onresize = resizeCanvas;

  const text = new PIXI.Text('This is a pixi text', {
    fontFamily: 'Arial',
    fontSize: 10,
    fill: 0xff1010,
    align: 'center',
  });

  const keyState = makeKeyState();

  app.loader
    .add('enemy', enemyImg)
    .add('ship', shipImg)
    .load((_loader, resources) => {
      const shipBaseTexture = PIXI.BaseTexture.from(shipSheetImg);
      const shipTextures = fp.pipe(
        fp.map(
          (i: number) =>
            new PIXI.Texture(
              shipBaseTexture,
              new PIXI.Rectangle((i % 4) * 17, Math.floor(i / 4) * 17, 17, 17),
            ),
        ),
      )(fp.range(0, 16));
      console.log('TEXT', shipTextures);
      const ship = new PIXI.Sprite(shipTextures[0]);
      const enemy = new PIXI.Sprite(resources.enemy.texture);

      // Rotate around the center
      ship.pivot.x = Math.floor(ship.width / 2);
      ship.pivot.y = Math.floor(ship.height / 2);
      ship.scale.x = 1 / maxZoom;
      ship.scale.y = 1 / maxZoom;
      ship.position.x = 100;
      ship.position.y = 100;

      enemy.pivot.x = enemy.width / 2;
      enemy.pivot.y = enemy.height / 2;
      enemy.scale.x = 1 / maxZoom;
      enemy.scale.y = 1 / maxZoom;
      enemy.position.x = 100;
      enemy.position.y = 100;

      const background = makeBackground(projection.viewport);
      app.stage.addChild(background);
      background.pivot.x = background.width / 2;
      background.pivot.y = background.height / 2;
      background.position.x = background.width / 2;
      background.position.y = background.height / 2;

      const actionPlane = new PIXI.Container();
      const floatersPlane = new PIXI.Container();
      app.stage.addChild(actionPlane);
      actionPlane.addChild(floatersPlane);
      actionPlane.addChild(enemy);
      actionPlane.addChild(ship);
      app.stage.addChild(text);

      actionPlane.width = projection.viewport.width;
      actionPlane.height = projection.viewport.height;
      actionPlane.pivot.x = actionPlane.width / 2;
      actionPlane.pivot.y = actionPlane.height / 2;
      actionPlane.position.x = actionPlane.width / 2;
      actionPlane.position.y = actionPlane.height / 2;
      floatersPlane.width = projection.viewport.width;
      floatersPlane.height = projection.viewport.height;
      floatersPlane.pivot.x = floatersPlane.width / 2;
      floatersPlane.pivot.y = floatersPlane.height / 2;
      floatersPlane.position.x = floatersPlane.width / 2;
      floatersPlane.position.y = floatersPlane.height / 2;
      console.log(actionPlane, floatersPlane);
      let lastMidpoint: geometry.Point | null = null;

      scn = updateScene(
        ['ship'],
        scene.deriveShipSize(ship, VIEWPORT_WIDTH),
        scn,
      );

      console.log('scn', scn);
      console.log('projection', projection);

      function play(frameDelta: number) {
        const deltaSeconds = (1 / app.ticker.FPS) * frameDelta;

        scn = updateScene(
          ['ship'],
          scene.updateShip(keyState, deltaSeconds, scn.universe),
          scn,
        );

        ship.texture = shipTextures[(16 - scn.ship.snappedRotation) % 16];
        const enemyDelta = scene.enemyDelta(scn.universe, scn.ship, scn.enemy);
        const focusPoint = geometry.midpoint(
          scn.ship.position,
          scn.enemy.position,
        );
        const zoom = projection.zoomFactor(enemyDelta);

        Object.assign(
          enemy,
          projection.projectPoint(focusPoint, scn.enemy.position),
        );
        Object.assign(
          ship,
          projection.projectPoint(focusPoint, scn.ship.position),
        );

        floatersPlane.removeChildren();
        fp.map(
          (e) =>
            createOrUpdateEmber(
              floatersPlane,
              projection.thrustEmberGfx(focusPoint, e),
            ),
          scn.ship.thrustEmbers,
        );

        // floatersPlane.scale.x = zoom;
        // floatersPlane.scale.y = zoom;
        actionPlane.scale.x = zoom;
        actionPlane.scale.y = zoom;

        const midpointShift = lastMidpoint
          ? geometry.delta(lastMidpoint, focusPoint)
          : { x: 0, y: 0 };
        lastMidpoint = focusPoint;
        background.tilePosition.x += midpointShift.x * projection.scale * 0.5;
        background.tilePosition.y += midpointShift.y * projection.scale * 0.5;

        background.scale.x = 0.75 + zoom * 0.25;
        background.scale.y = 0.75 + zoom * 0.25;

        //      ship.rotation = scn.ship.rotation;
        text.text = `rot: ${util.round(scn.ship.rotation, 2)}, srot:${
          scn.ship.snappedRotation
        }. xVel:${util.round(scn.ship.xVelocity, 2)}, yVel:${util.round(
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
        )}, width: ${util.round(actionPlane.width, 2)}, pixR: ${
          window.devicePixelRatio
        }, win: ${window.innerWidth}`;
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
