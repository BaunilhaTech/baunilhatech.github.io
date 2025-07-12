import "./style.css";
import { FluidEffect } from "./effects/fluid/index.js";

const canvas = document.querySelector("canvas");

if (!canvas) {
  throw new Error(
    "Canvas element not found. Make sure the HTML contains a <canvas> element."
  );
}

const simulation = new FluidEffect(canvas);
simulation.start();
