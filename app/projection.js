export const configure = ({ maxZoom, minZoom, zoomMargin }) => {
  const zoom = (viewportDims, enmyDelta) =>
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
