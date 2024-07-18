// Copyright (c) 2023 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

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
async function loadExternalContent(s) {
  try {
      // Fetch the content.html file
      const response = await fetch(`./scenes/${s}.html`);
      // Ensure the fetch was successful
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      // Get the text content from the response
      const content = await response.text();
      // Insert the fetched HTML into the container
      root.insertAdjacentHTML("beforeend", content);
  } catch (error) {
      console.error('Error fetching and inserting HTML:', error);
  }
}
loadExternalContent(s);
