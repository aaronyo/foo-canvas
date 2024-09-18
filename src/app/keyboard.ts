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

export const makeKeyState = ({
  leftCode,
  rightCode,
  thrustCode,
  shootCode,
}: {
  leftCode: number;
  rightCode: number;
  thrustCode: number;
  shootCode: number;
}) => {
  const state = {
    left: { isDown: false },
    right: { isDown: false },
    thrust: { isDown: false },
    shoot: { isDown: false },
  };

  bindKey(shootCode, {
    press: () => {
      state.shoot.isDown = true;
    },
    release: () => {
      state.shoot.isDown = false;
    },
  });

  bindKey(thrustCode, {
    press: () => {
      state.thrust.isDown = true;
    },
    release: () => {
      state.thrust.isDown = false;
    },
  });

  bindKey(leftCode, {
    press: () => {
      state.left.isDown = true;
    },
    release: () => {
      state.left.isDown = false;
    },
  });

  bindKey(rightCode, {
    press: () => {
      state.right.isDown = true;
    },
    release: () => {
      state.right.isDown = false;
    },
  });

  return state;
};

export type KeyState = ReturnType<typeof makeKeyState>;
