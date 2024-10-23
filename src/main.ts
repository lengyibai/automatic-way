import { Application } from "pixi.js";
import { AStarPathfinding } from "./views/test";

export const app = new Application<HTMLCanvasElement>({
  resizeTo: window,
  antialias: false,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.body.appendChild(app.view);

app.stage.addChild(new AStarPathfinding());
globalThis.__PIXI_APP__ = app;
