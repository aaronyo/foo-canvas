/**
 * Application entry point
 */

// Load application styles
import 'styles/index.scss';
import fp from 'lodash/fp';
import * as PIXI from 'pixi.js';

function getCanvas() {
    return document.getElementById('my-canvas');
}

function keyboard(keyCode) {
    let key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        console.log('EVENT', event.keyCode);
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };

    //The `upHandler`
    key.upHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
            event.preventDefault();
        }
    };

    //Attach event listeners
    window.addEventListener('keydown', key.downHandler.bind(key), false);
    window.addEventListener('keyup', key.upHandler.bind(key), false);
    return key;
}

let state;

function main() {
    // The application will create a renderer using WebGL, if possible,
    // with a fallback to a canvas render. It will also setup the ticker
    // and the root stage PIXI.Container
    const app = new PIXI.Application();

    // The application will create a canvas element for you that you
    // can then insert into the DOM
    document.body.appendChild(app.view);

    // load the texture we need
    PIXI.loader.add('bunny', 'assets/bunny.png').load((loader, resources) => {
        // This creates a texture from a 'bunny.png' image
        const bunny = new PIXI.Sprite(resources.bunny.texture);

        // Setup the position of the bunny
        bunny.x = app.renderer.width / 2;
        bunny.y = app.renderer.height / 2;

        // Rotate around the center
        bunny.anchor.x = 0.5;
        bunny.anchor.y = 0.5;
        bunny.vx = 0;
        bunny.vy = 0;

        // Add the bunny to the scene we are building
        app.stage.addChild(bunny);

        // Listen for frame updates
        let keyUp = keyboard(87);
        keyUp.press = () => {
            console.log('up');
            bunny.vy = -5;
        };

        state = play;

        app.ticker.add(() => {
            // each frame we spin the bunny around a bit
            bunny.rotation += 0.01;
            state();
        });

        function play(delta) {
            //Use the cat's velocity to make it move
            bunny.x += bunny.vx;
            bunny.y += bunny.vy;
        }
    });
}

window.onload = main;

// ================================
// START YOUR APP HERE
// ================================
