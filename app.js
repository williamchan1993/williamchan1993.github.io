// Copyright (c) 2023 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import "./main.css";

// Each location scene related scripts
import { detectMeshRyogokuComponent } from "./components/detect-mesh-ryogoku.js";
AFRAME.registerComponent("detect-mesh-ryogoku", detectMeshRyogokuComponent);
import { detectMeshAsakusaComponent } from "./components/detect-mesh-asakusa.js";
AFRAME.registerComponent("detect-mesh-asakusa", detectMeshAsakusaComponent);
import { detectMeshHamarikyuComponent } from "./components/detect-mesh-hamarikyu.js";
AFRAME.registerComponent("detect-mesh-hamarikyu", detectMeshHamarikyuComponent);
import { dogControlComponent } from "./components/dog-control.js";
AFRAME.registerComponent("dog-control", dogControlComponent);

// look at Y
import { lookAtYComponent } from "./components/lookAtY.js";
AFRAME.registerComponent("look-at-y", lookAtYComponent);
// look at Y specific for Asakusa Scene
import { lookAtYasakusaComponent } from "./components/lookAtY_asakusa.js";
AFRAME.registerComponent("look-at-y-asakusa", lookAtYasakusaComponent);

// Load scene using URL params
// sample URL: https://workspace.8thwall.app/vps-beta/?scene=detect-mesh
const params = new URLSearchParams(document.location.search.substring(1));
const s = params.get("scene") ? params.get("scene") : "shibuya"; // Can change to 404 page when false
console.log("s: " + s)
const root = document.getElementById("ar");
root.insertAdjacentHTML("beforeend", require(`./scenes/${s}.html`));

// Load scene manually
// document.body.insertAdjacentHTML('beforeend', require('./scenes/detect-mesh.html'))

const swapBody = (newHtml) => {
  const scene = document.body.querySelector("a-scene");
  scene.parentElement.removeChild(scene);
  document.body.insertAdjacentHTML("beforeend", newHtml);
};

window.addEventListener("startar", ({ detail }) => {
  swapBody(require("./scenes/asakusa.html"));
  window._startAR = detail;
});
