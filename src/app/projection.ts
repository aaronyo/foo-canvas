import * as PIXI from 'pixi.js';

import { Point } from './geometry';
import { ThrustEmber, Universe } from './scene';

interface Opts {
  maxZoom: number;
  minZoom: number;
  zoomMargin: number;
  universe: Universe;
  fieldOfView: number;
  viewportWidth: number;
}

export const configure = ({
  maxZoom,
  minZoom,
  zoomMargin,
  universe,
  fieldOfView,
  viewportWidth,
}: Opts) => {
  const aspectRatio = universe.height / universe.width;
  const viewportHeight = viewportWidth * aspectRatio;
  const scale = (viewportWidth / universe.width) * 2;

  const viewport = {
    width: viewportWidth,
    height: viewportHeight,
    center: {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    },
  };

  const zoomFactor = (enmyDelta: Point) => {
    const enemyDistance = Math.sqrt(
      Math.pow(enmyDelta.x, 2) + Math.pow(enmyDelta.y, 2),
    );

    return Math.max(
      Math.min(zoomMargin / (enemyDistance * scale), maxZoom),
      minZoom,
    );
  };

  const projectDim = (
    viewportLength: number,
    shiftDim: number,
    subjectDim: number,
  ) => (shiftDim + subjectDim) * scale - fieldOfView * viewportLength;

  const projectPoint = (focus: Point, subject: Point) => ({
    x: projectDim(viewportWidth, universe.center.x - focus.x, subject.x),
    y: projectDim(viewportHeight, universe.center.y - focus.y, subject.y),
  });

  const thrustEmberGfx = (focus: Point, ember: ThrustEmber) => {
    const gfx = new PIXI.Graphics();
    gfx.name = 'thrust-ember-' + ember.key;
    gfx.beginFill(
      PIXI.utils.rgb2hex([
        Math.trunc(256),
        Math.trunc(256 * (0.5 + ember.brightness / 2)),
        100,
      ]),
      ember.brightness,
    );
    gfx.lineStyle(0);
    gfx.drawCircle(0, 0, 0.75 * ember.brightness);
    gfx.endFill();
    const emberPos = projectPoint(focus, ember.position);
    gfx.position.set(emberPos.x, emberPos.y);
    return gfx;
  };

  return Object.freeze({
    zoomFactor,
    viewport,
    scale,
    projectPoint,
    thrustEmberGfx,
  });
};
