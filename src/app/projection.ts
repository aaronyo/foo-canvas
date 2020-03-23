import { Dimension, Point } from './geometry';

interface Opts {
  maxZoom: number;
  minZoom: number;
  zoomMargin: number;
  universeDims: Dimension;
  viewportWidth: number;
}

export const configure = ({
  maxZoom,
  minZoom,
  zoomMargin,
  universeDims,
  viewportWidth,
}: Opts) => {
  const aspectRatio = universeDims.height / universeDims.width;
  const viewportHeight = viewportWidth * aspectRatio;
  const scale = viewportWidth / universeDims.width;

  const viewport = {
    width: viewportWidth,
    height: viewportHeight,
    center: {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    },
  };

  const zoom = (enmyDelta: Point) => {
    const enemyDistance = Math.sqrt(
      Math.pow(enmyDelta.x, 2) + Math.pow(enmyDelta.y, 2),
    );

    return Math.max(
      Math.min(zoomMargin / (enemyDistance * scale), maxZoom),
      minZoom,
    );
  };

  return Object.freeze({
    zoom,
    viewport,
    scale,
  });
};
