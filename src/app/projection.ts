import fp from 'lodash/fp';
import * as PIXI from 'pixi.js';

import { midpoint, Point } from './geometry';
import { enemyDelta, GameScene, Ship, ThrustEmber, Universe } from './scene';

interface Opts {
  maxZoom: number;
  minZoom: number;
  zoomMargin: number;
  universe: Universe;
  fieldOfView: number;
  viewportWidth: number;
}

export interface ShipProjection {
  container: PIXI.Sprite;
  hull: PIXI.Sprite;
  embers: PIXI.Sprite;
  textures: PIXI.Texture[];
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

  const makeThrustEmber = (focus: Point, ember: ThrustEmber) => {
    const rgb = [
      Math.floor(240),
      Math.floor(220 * (0.5 + ember.brightness * 0.5)),
      140,
    ];
    console.log('EB', ember.brightness, rgb);

    const gfx = new PIXI.Graphics();
    gfx.name = 'thrust-ember-' + ember.key;
    gfx.beginFill(PIXI.utils.rgb2hex(rgb), Math.pow(ember.brightness, 2));
    gfx.lineStyle(0);
    gfx.drawCircle(0, 0, 1 * ember.brightness);
    gfx.endFill();
    const emberPos = projectPoint(focus, ember.position);
    gfx.position.set(emberPos.x, emberPos.y);
    return gfx;
  };

  const shipFactory = (spriteSheetPath: string) => {
    const baseTexture = PIXI.BaseTexture.from(spriteSheetPath);
    return {
      makeShip: () => {
        const textures = fp.pipe(
          fp.map(
            (i: number) =>
              new PIXI.Texture(
                baseTexture,
                new PIXI.Rectangle(
                  (i % 4) * 17,
                  Math.floor(i / 4) * 17,
                  17,
                  17,
                ),
              ),
          ),
        )(fp.range(0, 16));
        const container = new PIXI.Container();
        const embers = new PIXI.Container();
        const hull = new PIXI.Sprite(textures[0]);
        hull.pivot.x = Math.floor(hull.width / 2);
        hull.pivot.y = Math.floor(hull.height / 2);
        hull.scale.x = 1 / maxZoom;
        hull.scale.y = 1 / maxZoom;
        container.addChild(embers);
        container.addChild(hull);
        // embers.width = projection.viewport.width;
        // embers.height = projection.viewport.height;
        // embers.pivot.x = embers.width / 2;
        // embers.pivot.y = embers.height / 2;
        // embers.position.x = embers.width / 2;
        // embers.position.y = embers.height / 2;

        return {
          container,
          hull,
          embers,
          textures,
        } as ShipProjection;
      },
    };
  };

  const updateShip = (
    scnShip: Ship,
    focus: Point,
    projShip: ShipProjection,
  ) => {
    projShip.hull.texture =
      projShip.textures[(16 - scnShip.snappedRotation) % 16];
    Object.assign(
      projShip.hull.position,
      projectPoint(focus, scnShip.position),
    );
    projShip.embers.removeChildren();
    fp.each(
      (e) => projShip.embers.addChild(makeThrustEmber(focus, e)),
      scnShip.thrustEmbers,
    );
  };

  const cameraOrientation = (scn: GameScene) => {
    const focus = midpoint(scn.ship.position, scn.enemy.position);
    const zoom = zoomFactor(enemyDelta(scn.universe, scn.ship, scn.enemy));
    return {
      focus,
      zoom,
    };
  };

  return Object.freeze({
    zoomFactor,
    viewport,
    scale,
    projectPoint,
    makeThrustEmber,
    shipFactory,
    updateShip,
    cameraOrientation,
  });
};
