let loopTimes = 0;
let uiInited = false;

// Detects a VPS node, downloads its mesh and places it on top of the real world
const detectMeshRyogokuComponent = {
  init() {
    console.log("Init Ryogoku");
    const scene = this.el.sceneEl;
    scene.emit("recenter");
    const mapBtn = document.getElementById("map-btn");
    this.camera_front = document.getElementById("camera-front");
    this.camera_topleft = document.getElementById("camera-topleft");
    this.rikishi = document.getElementById("rikishi");
    const rikishi = document.getElementById("rikishi");
    const container = document.getElementById("container");
    const effectB = document.getElementById("wrapper-B");
    const imgB = document.getElementById("effect-B");

    let meshFound = false;
    let mesh = null;
    this.ok = false;

    uiInited = false; // Reset uiInit in case

    // Init Elements
    const loadImage = document.getElementById("requestingCameraPermissions");
    if (loadImage) {
      console.log("Found loading cover");
      loadImage.style.display = "none";
    }
    const loadBackground = document.getElementById("loadBackground");
    if (loadBackground) {
      console.log("Found loading background");
      loadImage.style.display = "none";
      const topImage = document.createElement("img");
      topImage.src = "/assets/map-assets/cover.png"; // Replace with the actual source
      topImage.id = "topImage";
      // Append img to the parent container
      loadBackground.appendChild(topImage);
    }

    const backBtn = document.getElementById("back-btn");
    backBtn.addEventListener("click", () => {
      uiInited = false; // Reset uiInit in case
      window.history.go(-1);
    });

    function changeEffectPositionB() {
      effectB.setAttribute("scale", "0 0 0");
      effectB.setAttribute('position', {x: -1.02, y: -1.25, z: 1.9});
      effectB.object3D.position.x += 1.3;
      effectB.object3D.position.y += 2.9;
      effectB.object3D.position.x += Math.random() * 1 - 0.5;
      effectB.object3D.position.y += Math.random() * 1 - 0.5;
      effectB.object3D.position.z += Math.random() * 1 - 0.5;
      const randomRotation = Math.random() * (35 - -35) + -35; // Random rotation between -35 and 35 degrees
      imgB.setAttribute("rotation", { x: 0, y: 0, z: randomRotation });
      if (loopTimes !== 0) {
        imgB.setAttribute("scale", "1 1 1");
      }
      loopTimes++;
      const randomNumber = Math.random() * (5.5 - 1.5) + 1.5;
      effectB.setAttribute("animation", {
        property: "scale",
        dur: 692,
        from: "0 0 0",
        to: `${randomNumber} ${randomNumber} ${randomNumber}`,
        easing: "easeInOutElastic",
        loop: "once",
      });
      if (loopTimes > 4) {
        effectB.removeEventListener("animationcomplete", changeEffectPositionB);
      } else {
        effectB.addEventListener("animationcomplete", changeEffectPositionB);
      }
    }

    function changeEffectPositionB2() {
      effectB.setAttribute("scale", "0 0 0");
      effectB.setAttribute('position', {x: -1.02, y: -1.25, z: 1.9});
      effectB.object3D.position.x += 1.3;
      effectB.object3D.position.y += 2.9;
      effectB.object3D.position.x += Math.random() * 1 - 0.5;
      effectB.object3D.position.y += Math.random() * 1 - 0.5;
      effectB.object3D.position.z += Math.random() * 1 - 0.5;
      const randomRotation = Math.random() * (35 - -35) + -35; // Random rotation between -50 and 50 degrees
      imgB.setAttribute("rotation", { x: 0, y: 0, z: randomRotation });
      loopTimes++;
      const randomNumber = Math.random() * (5.5 - 1.5) + 1.5;
      effectB.setAttribute("animation", {
        property: "scale",
        dur: 692,
        from: "0 0 0",
        to: `${randomNumber} ${randomNumber} ${randomNumber}`,
        easing: "easeInOutElastic",
        loop: "once",
      });
      if (loopTimes > 1) {
        effectB.removeEventListener(
          "animationcomplete",
          changeEffectPositionB2
        );
      } else {
        effectB.addEventListener("animationcomplete", changeEffectPositionB2);
      }
    }

    this.swapScene = () => {
      window.history.back(); // should change back to 2D Map URL in final
    };

    const params = new URLSearchParams(document.location.search.substring(1));
    const waypoint = params.get("scene") ? params.get("scene") : null; // world-map

    const startScanning = ({ detail }) => {
      console.log("start Scanning");
      const vpsInstLayer = document.getElementById("vps-inst");
      vpsInstLayer.style.display = "block";
      const backBtn = document.getElementById("back-btn");
      backBtn.style.display = "block";
    };

    const foundWayspot = ({ detail }) => {
      console.log("found Wayspot" + detail.name + " " + detail.position);
    };

    const foundMesh = ({ detail }) => {
      console.log("found Mesh " + detail);
      if (meshFound === true) {
        return;
      }
      const { bufferGeometry, position, rotation } = detail;
      rikishi.setAttribute("visible", "true");

      const animationLoop = () => {
        loopTimes = 0;
        changeEffectPositionB2();
      };

      function changeRikishiEndAnimation() {
        rikishi.setAttribute(
          "animation-mixer",
          "clip: TeppouRERE; loop: repeat"
        );
        rikishi.addEventListener("animation-loop", animationLoop);
      }

      const RikishiAnimation4 = () => {
        // Start Turn
        const currentRotation = rikishi.getAttribute("rotation");
        rikishi.setAttribute("animation__rotate2", {
          property: "rotation.y",
          from: `${currentRotation.y}`,
          to: `${currentRotation.y + 60}`,
          dur: 400,
        });
        setTimeout(changeEffectPositionB(), 28000);
      };

      const RikishiAnimation3 = () => {
        // Drops
        const targetPosition = {
          x: rikishi.object3D.position.x - 0,
          y: rikishi.object3D.position.y - 4,
          z: rikishi.object3D.position.z + 2.4,
        };
        rikishi.setAttribute("animation__position2", {
          property: "position",
          to: targetPosition,
          dur: 230,
          easing: "easeInQuad",
        });
        setTimeout(RikishiAnimation4, 2500);
      };

      const RikishiAnimation2 = () => {
        // Rise to top and start increase size
        const targetPosition = {
          x: rikishi.object3D.position.x - 1,
          y: rikishi.object3D.position.y + 3,
          z: rikishi.object3D.position.z,
        };
        rikishi.setAttribute("animation__position", {
          property: "position",
          dur: 460,
          to: targetPosition,
          easing: "easeOutSine",
        });

        rikishi.setAttribute("animation__scale", {
          property: "scale",
          dur: 460,
          to: "0.95 0.95 0.95",
          easing: "easeOutSine",
        });

        setTimeout(RikishiAnimation3, 460);
      };

      const RikishiAnimation1 = () => {
        // Start Whole Animation and stay a ground pos
        rikishi.setAttribute("animation-mixer", "clip: Whole_02; loop: once"); // Start Whole animation
        rikishi.addEventListener(
          "animation-finished",
          changeRikishiEndAnimation
        );
        setTimeout(RikishiAnimation2, 1050);
      };

      // Wayspot specific contents
      let wayspotTitle = "";
      let name = "";
      let hint = "";

      switch (waypoint) {
        case "ryougoku":
          wayspotTitle = "538c8b1f6fe9470e82aaca1aeb517571.107";
          break;
        default:
          wayspotTitle = "538c8b1f6fe9470e82aaca1aeb517571.107";
      }

      // Result UI related
      function createResultUI() {
        if (!uiInited) {
          uiInited = true;
          console.log("Init UI");
          document.getElementById("imagePreview").style =
            "display: block; height: 100%; width: auto;";
          document.getElementById("videoPreview").style =
            "display: block; height: 100%; width: auto;";

          const existingButton = document.getElementById("actionButton");
          // Show instruction text
          const instructionText = document.getElementById("instruction");
          instructionText.style.display = "block";
          // Create a new button
          const shareButton = document.getElementById("shareButton");
          // Insert the new button right above the existing button
          existingButton.parentNode.insertBefore(shareButton, existingButton);
          existingButton.style.display = "none";
          shareButton.style.display = "block";
          shareButton.addEventListener("click", () => {
            // Trigger the click event on button1
            console.log("click share");
            existingButton.click();
          });
          shareButton.addEventListener("contextmenu", function (event) {
            event.preventDefault();
          });

          const placeButton = document.getElementById("placeButton");
          shareButton.parentNode.insertBefore(placeButton, shareButton);
          existingButton.style.display = "none";
          placeButton.style.display = "block";
          placeButton.addEventListener("click", () => {
            // Trigger the click event on button1
            console.log("click share");
            const detailLayer = document.querySelector(".layer");
            detailLayer.style.display = "flex";
          });
          placeButton.addEventListener("contextmenu", function (event) {
            event.preventDefault();
          });

          const btnlearnmore = document.getElementById("btn-learn-more");
          btnlearnmore.addEventListener("click", () => {
            window.open(
              "https://www.gotokyo.org/en/destinations/eastern-tokyo/ryogoku/index.html",
              "_blank"
            );
          });

          const btnclose = document.getElementById("btn-close");
          btnclose.addEventListener("click", () => {
            const detailLayer = document.querySelector(".layer");
            detailLayer.style.display = "none";
          });

          const instruction = document.getElementById("instruction");
          placeButton.parentNode.insertBefore(instruction, placeButton);

          // Create buttons
          const topBar = document.querySelector(".top-bar");

          // Create and append retryBtn
          const retryBtn = document.getElementById("retryBtn");
          retryBtn.style.display = "block";
          retryBtn.addEventListener("contextmenu", function (event) {
            event.preventDefault();
          });
          retryBtn.addEventListener("click", () => {
            const badges = document.getElementsByClassName("badge");
            // Iterate through the elements and set their display to "none"
            for (let i = 0; i < badges.length; i++) {
              badges[i].style.display = "none";
            }
            console.log("close badges");

            var event = new Event("click");
            const close = document.getElementById("closePreviewButton");
            close.dispatchEvent(event);
          });

          topBar.appendChild(retryBtn);

          const params = new URLSearchParams(
            document.location.search.substring(1)
          );
          const waypoint = params.get("scene") ? params.get("scene") : null; // world-map
          console.log("Found waypoint from url: " + waypoint);

          const endBtn = document.getElementById("endBtn");
          endBtn.addEventListener("contextmenu", function (event) {
            event.preventDefault();
          });
          endBtn.addEventListener("click", () => {
            // window.location.href = url;
            uiInited = false; // Reset uiInit in case
            // window.closeAR();
          });
          endBtn.style.display = "block";
          topBar.appendChild(endBtn);
        } else {
          //console.log("Didn't run createResultUI()")
        }
      }

      // Instruction UI (Scanning/Detected) related
      const changeDetectedUI = () => {
        console.log("change detected UI");
        createResultUI();
        const img = document.getElementById("vps-inst-img");
        const text = document.getElementById("vps-inst-text");
        img.style.borderColor = "#00A8EA";
        text.innerHTML = "Detected";
        text.style.backgroundColor = "#00A8EA";
        text.style.color = "white";
        // Optionally, you can add a delay before hiding the instruction layer
        setTimeout(function () {
          // Photo Instruction
          const photoIcon = document.getElementById("photo-icon");
          photoIcon.style.display = "block";
          const photoText = document.getElementById("photo-text");
          photoText.style.display = "block";
          photoIcon.addEventListener("click", () => {
            if (photoText.style.opacity === '1') {
              photoText.style.opacity = '0'; // Fade out
            } else {
              photoText.style.opacity = '1'; // Fade in
            }
          })
          photoText.style.opacity = 0;
          const vpsInstLayer = document.getElementById("vps-inst");
          vpsInstLayer.classList.add("hide");
          var recorderContainer = document.querySelector(".recorder-container");
          recorderContainer.style.display = "block";
          var videoInst = document.getElementById("video_inst");

          // Move video_inst as a child of recorder-container
          recorderContainer.style.display = "block";
          recorderContainer.appendChild(videoInst);

          // Set the position of video_inst
          videoInst.style.position = "absolute";
          videoInst.style.bottom = "calc(100% + 10px)";
          videoInst.style.left = "50%";
          videoInst.style.width = "70vw";
          videoInst.style.transform = "translateX(-50%)";
          videoInst.style.zIndex = "25";
          videoInst.style.maxWidth = "none";

          // Click to hide videoInst
          videoInst.addEventListener("contextmenu", function (event) {
            event.preventDefault();
          });
          setTimeout(() => {
            photoText.style.opacity = 1;
            document.addEventListener("click", function (event) {
              console.log("Screen clicked!");
              videoInst.style.display = "none";
            });
          }, 1000);
        }, 500);
        setTimeout(function () {
          const vpsInstLayer = document.getElementById("vps-inst");
          vpsInstLayer.style.display = "none";
        }, 1500);
      };

      switch (wayspotTitle) {
        case "538c8b1f6fe9470e82aaca1aeb517571.107":
          console.log("Mesh detected: 横綱像");
          changeDetectedUI();

          container.setAttribute("visible", "true");
          container.object3D.position.copy(position);
          container.object3D.quaternion.copy(rotation);

          //// Real ////
          rikishi.object3D.position.x -= 0.02;
          rikishi.object3D.position.y += 1.25;
          rikishi.object3D.position.z -= 0.5;
          //// Real ////

          setTimeout(RikishiAnimation1, 2000);
          break;
        default:
          console.log("No matching wayspot with same title");
      }

      meshFound = true;
    };

    this.el.sceneEl.addEventListener("xrprojectwayspotscanning", startScanning);
    this.el.sceneEl.addEventListener("xrmeshfound", foundMesh);
  },
};

export { detectMeshRyogokuComponent };
