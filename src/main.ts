import { makeGameApp } from './app';

const gameApp = makeGameApp();

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(gameApp.view);
