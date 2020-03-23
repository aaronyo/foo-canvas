import { Dimension, Point } from './geometry';

export const configure = ({ maxZoom, minZoom, zoomMargin }) => {
  const zoom = (viewportDims: Dimension, enmyDelta: Point) =>
    Math.max(
      Math.min(
        viewportDims.width / 2 / (Math.abs(enmyDelta.x) + zoomMargin),
        viewportDims.height / 2 / (Math.abs(enmyDelta.y) + zoomMargin),
        maxZoom,
      ),
      minZoom,
    );

  return {
    zoom,
  };
};
