// Load application styles
import fp from 'lodash/fp';
import * as PIXI from 'pixi.js';

import shipSheetImg from '../assets/saucer-sheet.png';
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

export const makeGameApp = () => {
  // The application will create a renderer using WebGL, if possible,
  // with a fallback to a canvas render. It will also setup the ticker
  // and the root stage PIXI.Container

  let scn = scene.initScene();
  const projection = projectionLib.configure({
    minZoom,
    maxZoom,
    zoomMargin,
    universeDims: scn.dimensions,
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

  const playerKeyState = makeKeyState({
    leftCode: 37, // left arrow
    rightCode: 39, // right arrow
    thrustCode: 38, // up arrow
    // command key
    shootCode: 188, // comma
  });

  const enemyKeyState = makeKeyState({
    leftCode: 65, // a
    rightCode: 68, // d
    thrustCode: 87, // s
    shootCode: 192, // backtick
  });

  app.loader.load(() => {
    const shipFactory = projection.shipFactory(shipSheetImg);
    const player = shipFactory.makeShip();
    const enemy = shipFactory.makeShip();
    const colorMatrix = new PIXI.filters.ColorMatrixFilter();
    enemy.hull.filters = [colorMatrix];
    colorMatrix.toBGR(false);

    const background = makeBackground(projection.viewport);
    app.stage.addChild(background);
    background.pivot.x = background.width / 2;
    background.pivot.y = background.height / 2;
    background.position.x = background.width / 2;
    background.position.y = background.height / 2;

    const actionPlane = new PIXI.Container();
    app.stage.addChild(actionPlane);
    actionPlane.addChild(enemy.container);
    actionPlane.addChild(player.container);
    app.stage.addChild(text);

    actionPlane.width = projection.viewport.width;
    actionPlane.height = projection.viewport.height;
    actionPlane.pivot.x = actionPlane.width / 2;
    actionPlane.pivot.y = actionPlane.height / 2;
    actionPlane.position.x = actionPlane.width / 2;
    actionPlane.position.y = actionPlane.height / 2;
    let lastMidpoint: geometry.Point | null = null;

    scn = updateScene(
      ['player'],
      scene.deriveShipSize(player.hull, VIEWPORT_WIDTH),
      scn,
    );

    scn = updateScene(
      ['enemy'],
      scene.deriveShipSize(enemy.hull, VIEWPORT_WIDTH),
      scn,
    );

    console.log('scn', scn);
    console.log('projection', projection);

    function play(frameDelta: number) {
      const deltaSeconds = (1 / app.ticker.FPS) * frameDelta;

      scn = updateScene(
        ['player'],
        scene.updateShip(playerKeyState, deltaSeconds, scn.dimensions),
        scn,
      );

      scn = updateScene(
        ['enemy'],
        scene.updateShip(enemyKeyState, deltaSeconds, scn.dimensions),
        scn,
      );

      scn = scene.handleShipCollision(scn);

      const { focus, zoom } = projection.cameraOrientation(scn);

      projection.updateShip(scn.player, focus, player);
      projection.updateShip(scn.enemy, focus, enemy);

      actionPlane.scale.x = zoom;
      actionPlane.scale.y = zoom;

      const midpointShift = lastMidpoint
        ? geometry.toroidalDelta(scn.dimensions, lastMidpoint, focus)
        : { x: 0, y: 0 };
      lastMidpoint = focus;
      background.tilePosition.x += midpointShift.x * projection.scale * 0.5;
      background.tilePosition.y += midpointShift.y * projection.scale * 0.5;

      background.scale.x = 0.75 + zoom * 0.25;
      background.scale.y = 0.75 + zoom * 0.25;

      //      ship.rotation = scn.player.rotation;
      text.text = `rot: ${util.round(
        scn.player.rotation,
        2,
      )}. xVel:${util.round(scn.player.vector.x, 2)}, yVel:${util.round(
        scn.player.vector.y,
        2,
      )}, x:${util.round(player.hull.x, 2)}, y:${util.round(
        player.hull.y,
        2,
      )}, ex:${util.round(enemy.hull.x, 2)}, ey:${util.round(
        enemy.hull.y,
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
      //      player.rotation += 0.01;
      play(delta);
    });
  });

  return app;
};

// ================================
// START YOUR APP HERE
// ================================
