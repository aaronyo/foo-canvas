export const configure = ({ maxZoom, minZoom, zoomMargin }) => {
  const enemyDelta = (universeDims, ship, enemy) => {
    let deltaX = enemy.x - ship.x;
    let distanceX = Math.abs(deltaX);
    if (distanceX > universeDims.width / 2) {
      // shorter distance
      distanceX = universeDims.width - distanceX;
      deltaX = deltaX > 0 ? 0 - distanceX : distanceX;
    }

    let deltaY = enemy.y - ship.y;
    let distanceY = Math.abs(deltaY);
    if (distanceY > universeDims.height / 2) {
      // shorter distance
      distanceY = universeDims.height - distanceY;
      deltaY = deltaY > 0 ? 0 - distanceY : distanceY;
    }
    return {
      x: deltaX,
      y: deltaY,
    };
  };

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
    enemyDelta,
    zoom,
  };
};
