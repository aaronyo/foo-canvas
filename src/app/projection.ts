import * as _ from 'remeda';
import * as PIXI from 'pixi.js';

import { Dimensions, Point, toroidalDelta, toroidalMidpoint } from './geometry';
import { GameScene, Ship, ThrustEmber } from './scene';

interface Opts {
  maxZoom: number;
  minZoom: number;
  zoomMargin: number;
  universeDims: Dimensions;
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
  universeDims,
  fieldOfView,
  viewportWidth,
}: Opts) => {
  const aspectRatio = universeDims.height / universeDims.width;
  const viewportHeight = viewportWidth * aspectRatio;
  const scale = (viewportWidth / universeDims.width) * 2;
  const universeCenter = {
    x: universeDims.width / 2,
    y: universeDims.height / 2,
  };

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
      // Assume landscape viewport and make zoom boundary an oval
      Math.pow(enmyDelta.x * Math.sqrt(aspectRatio), 2) +
        Math.pow(enmyDelta.y, 2),
    );

    return Math.max(
      Math.min(zoomMargin / (enemyDistance * scale), maxZoom),
      minZoom,
    );
  };

  const projectDim = (viewportLength: number, dim: number) =>
    dim * scale - fieldOfView * viewportLength;

  const projectPoint = (focus: Point, subject: Point) => {
    // Unwrap the point coordinates with respect to the focus so that projection
    // is simple.
    const focusDelta = toroidalDelta(universeDims, subject, focus);
    subject = {
      x: focus.x + focusDelta.x,
      y: focus.y + focusDelta.y,
    };
    return {
      x: projectDim(viewportWidth, universeCenter.x - focus.x + subject.x),
      y: projectDim(viewportHeight, universeCenter.y - focus.y + subject.y),
    };
  };

  const makeThrustEmber = (focus: Point, ember: ThrustEmber) => {
    const rgb = [250, Math.floor(240 * (0.5 + ember.brightness * 0.5)), 140];

    const gfx = new PIXI.Graphics();
    gfx.name = 'thrust-ember-' + ember.key;
    gfx.beginFill(PIXI.utils.rgb2hex(rgb), Math.pow(ember.brightness, 2));
    gfx.lineStyle(0);
    gfx.drawCircle(0, 0, ember.radius);
    gfx.endFill();
    const emberPos = projectPoint(focus, ember.position);
    gfx.position.set(emberPos.x, emberPos.y);
    return gfx;
  };

  const shipFactory = (spriteSheetPath: string) => {
    const baseTexture = PIXI.BaseTexture.from(spriteSheetPath);
    return {
      makeShip: () => {
        const textures = _.pipe(
          _.range(0, 16),
          _.map(
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
        );
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
    _.forEach(scnShip.thrustEmbers, (e) =>
      projShip.embers.addChild(makeThrustEmber(focus, e)),
    );
  };

  const cameraOrientation = (scn: GameScene) => {
    const focus = toroidalMidpoint(
      scn.dimensions,
      scn.player.position,
      scn.enemy.position,
    );

    const zoom = zoomFactor(
      toroidalDelta(scn.dimensions, scn.player.position, scn.enemy.position),
    );

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
