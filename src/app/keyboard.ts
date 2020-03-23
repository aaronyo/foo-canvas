const bindKey = (
  keyCode: number,
  { press, release }: { press: () => void; release: () => void },
) => {
  let isDown = false;
  let isUp = true;
  //The `downHandler`
  const downHandler = (event: KeyboardEvent) => {
    if (event.keyCode === keyCode) {
      if (isUp && press) press();
      isDown = true;
      isUp = false;
      event.preventDefault();
    }
  };

  //The `upHandler`
  const upHandler = (event: KeyboardEvent) => {
    if (event.keyCode === keyCode) {
      if (isDown && release) release();
      isDown = false;
      isUp = true;
      event.preventDefault();
    }
  };

  //Attach event listeners
  window.addEventListener('keydown', downHandler, false);
  window.addEventListener('keyup', upHandler, false);
};

export const makeKeyState = () => {
  const state = {
    left: { isDown: false },
    right: { isDown: false },
    thrust: { isDown: false },
  };

  // arrow up
  bindKey(38, {
    press: () => {
      state.thrust.isDown = true;
    },
    release: () => {
      state.thrust.isDown = false;
    },
  });

  // arrow left
  bindKey(37, {
    press: () => {
      state.left.isDown = true;
    },
    release: () => {
      state.left.isDown = false;
    },
  });

  // arrow right
  bindKey(39, {
    press: () => {
      state.right.isDown = true;
    },
    release: () => {
      state.right.isDown = false;
    },
  });

  return state;
};
