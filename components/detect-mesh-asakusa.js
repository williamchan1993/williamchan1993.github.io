let cameraPosition = new THREE.Vector3();
let cameraMiddlePosition = new THREE.Vector3();
let cameraFrontPosition = new THREE.Vector3();
let modelPosition = new THREE.Vector3();
let distanceTF;
let distanceFR;
let distanceM;
let worldPos = new THREE.Vector3();
let goal = false;
let uiInited = false;
let targetBadge = "";

let previousTime = performance.now();
let deltaTime = 0;

// Wireframe Texture for debug
const discoWireframeMaterial = new THREE.ShaderMaterial({
  uniforms: {
    timeMsec: { value: 1.0 },
  },
  vertexShader: `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  fragmentShader: `
  uniform float timeMsec;
  varying vec2 vUv;

  void main(void) {
    vec2 position = - 1.0 + 2.0 * vUv;

    float red = abs(sin(position.x * position.y + timeMsec / 5.0));
    float green = abs(sin(position.x * position.y + timeMsec / 4.0));
    float blue = abs(sin(position.x * position.y + timeMsec / 3.0));
    gl_FragColor = vec4(red, green, blue, 0.5);
  }
  `,
  transparent: true,
  wireframe: true,
});

// Detects a VPS node, downloads its mesh and places it on top of the real world
const detectMeshAsakusaComponent = {
  init() {
    console.log("Init Asakusa");
    const scene = this.el.sceneEl;
    scene.emit("recenter");
    const mapBtn = document.getElementById("map-btn");
    this.raijin = document.getElementById("raijin");
    this.raijinPos = document.getElementById("raijin-pos");
    this.raijinSpeed = 0.2;
    this.camera_front = document.getElementById("camera-front");
    this.camera_middle = document.getElementById("camera-middle");
    this.camera_topleft = document.getElementById("camera-topleft");
    const container = document.getElementById("container");
    this.raijin_stage = 0;
    this.prevPosition = this.raijin.object3D.position;

    let meshFound = false;
    let mesh = null;
    this.ok = false;

    uiInited = false; // Reset uiInit in case

    // Init Elements
    const loadImage = document.getElementById("requestingCameraPermissions");
    if (loadImage) {
      // console.log('Found loading cover')
      loadImage.style.display = "none";
    }
    const loadBackground = document.getElementById("loadBackground");
    if (loadBackground) {
      // console.log('Found loading background')
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

    this.swapScene = () => {
      window.history.back(); // should change back to 2D Map URL in final
    };

    // if (window._startAR) {
    //   console.log(window._startAR.title)
    // } else {
    //   console.log("no title")
    // }

    const params = new URLSearchParams(document.location.search.substring(1));
    const waypoint = params.get("scene") ? params.get("scene") : null; // world-map
    // console.log("Found waypoint from url: " + waypoint)

    const startScanning = ({ detail }) => {
      console.log("start Scanning");
      const vpsInstLayer = document.getElementById("vps-inst");
      vpsInstLayer.style.display = "block";
      const backBtn = document.getElementById("back-btn");
      backBtn.style.display = "block";
    };

    const foundMesh = ({ detail }) => {
      // console.log("found Mesh")
      if (meshFound === true) {
        return;
      }
      const { bufferGeometry, position, rotation } = detail;

      // //// Script for showing Wireframe Mesh ////

      // const texture = null;
      // this.threeMaterial = new THREE.MeshBasicMaterial({
      //   vertexColors: !texture,
      //   wireframe: false,
      //   visible: true,
      //   transparent: true,
      //   map: texture,
      // });

      // construct VPS mesh
      //mesh = new THREE.Mesh(bufferGeometry, this.threeMaterial);

      // add mesh to A-Frame scene
      // this.meshEl = document.createElement('a-entity')
      // this.meshEl.id = 'vps-mesh'
      // mesh.material = discoWireframeMaterial
      // this.meshEl.object3D.add(mesh)
      // this.meshEl.object3D.position.copy(position)
      // this.meshEl.object3D.quaternion.copy(rotation)
      // this.meshEl.visible = true  // hide by default
      // this.meshEl.object3D.children[0].material.opacity = 0.4
      // scene.prepend(this.meshEl)
      // document.getElementById('vps-mesh').object3D.visible = true;

      // //// Script for showing Wireframe Mesh ////

      // Raijin Animation and switch target position related functions
      const RaijinStage4loop_ToMid = () => {
        this.raijin_stage = 4;
        this.raijinSpeed = 0.1;
      };

      const RaijinStage2loop_ToFront = () => {
        this.raijin_stage = 2;
        this.raijinSpeed = 0.2;
      };

      const RaijinStage3loop_ToTopLeft = () => {
        this.raijin_stage = 3;
        this.raijinSpeed = 0.15;
      };

      const RaijinStage3loop = () => {
        goal = false;
        setTimeout(RaijinStage4loop_ToMid, 3000);
        setTimeout(RaijinStage2loop_ToFront, 3800);
        setTimeout(RaijinStage3loop_ToTopLeft, 4700);
      };

      const RaijinFlyFinish = () => {
        this.raijin.setAttribute(
          "animation-mixer",
          "clip: IdleWithThunder; loop: repeat"
        );
        RaijinStage3loop();
        this.raijin.addEventListener("animation-loop", RaijinStage3loop);
      };

      const RaijinToStage3Timer = () => {
        this.raijin_stage = 3;
        this.raijinSpeed = 0.15;
      };

      const changeRaijinAnimation2 = () => {
        this.raijin_stage = 1;
        this.raijin.setAttribute("animation", {
          property: "scale",
          to: "0.1 0.1 0.1",
          easing: "easeOutCubic",
          dur: 500, // 2 seconds
        });
        setTimeout(RaijinToStage3Timer, 1700);
      };

      const changeRaijinAnimation = () => {
        this.raijin.setAttribute(
          "animation-mixer",
          "clip: ComeFlying; loop: once"
        ); // Start Whole animation
        this.raijin.addEventListener("animation-finished", RaijinFlyFinish);
        setTimeout(changeRaijinAnimation2, 500);
      };

      // Wayspot specific contents
      let wayspotTitle = "";
      let name = "";
      let hint = "";

      switch (waypoint) {
        case "asakusa":
          wayspotTitle = "雷門";
          name = "Kaminarimon Gate";
          hint = "../assets/asakusa_cover-h6xbt50a39.png";
          // console.log(waypoint + " " + name + " " + wayspotTitle);
          break;
        default:
          console.log("No matching wayspot with same title");
          wayspotTitle = "雷門";
          name = "Kaminarimon Gate";
          hint = "../assets/asakusa_cover-h6xbt50a39.png";
        // console.log(waypoint + " " + name + " " + wayspotTitle);
      }

      // Storage related (May need to change to DB)
      function getAllSavedWaypointFromLocalStorage() {
        // Retrieve the list of from local storage
        const stringList = JSON.parse(localStorage.getItem("badge")) || [];
        return stringList;
      }

      function saveBadgeToLocalStorage(newBadge) {
        // Retrieve existing list from local storage
        let badgeList = JSON.parse(localStorage.getItem("badge")) || [];

        // Check if the new string exists in the list
        if (!badgeList.includes(newBadge)) {
          // If it doesn't exist, push the new string to the list
          badgeList.push(newBadge);

          // Save the updated list back to local storage
          localStorage.setItem("badge", JSON.stringify(badgeList));

          console.log(`Badge '${newBadge}' newly got.`);
        } else {
          console.log(`Badge '${newBadge}' already got before.`);
        }
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
            // window.share();
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
            // window.showStampDetail();
            const detailLayer = document.querySelector(".layer");
            detailLayer.style.display = "flex";
            // existingButton.click();
          });
          placeButton.addEventListener("contextmenu", function (event) {
            event.preventDefault();
          });

          const btnlearnmore = document.getElementById("btn-learn-more");
          btnlearnmore.addEventListener("click", () => {
            // window.showLearnMore("https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/index.html");
            window.open(
              "https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/index.html",
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

            // window.closeCheckin();
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
        }
      }

      // Instruction UI (Scanning/Detected) related
      const changeDetectedUI = () => {
        // console.log('change detected UI');
        createResultUI();
        const img = document.getElementById("vps-inst-img");
        const text = document.getElementById("vps-inst-text");
        img.style.borderColor = "#00A8EA";
        text.innerHTML = "Detected";
        text.style.backgroundColor = "#00A8EA";
        text.style.color = "white";

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
              // console.log('Screen clicked!');
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
        case "雷門":
          // console.log('Mesh detected: 雷門');
          changeDetectedUI();

          container.setAttribute("visible", "true");
          container.object3D.position.copy(position);
          container.object3D.quaternion.copy(rotation);

          //this.raijinPos.setAttribute('visible', 'true')

          //// Real ////
          this.raijinPos.object3D.position.x += 0;
          this.raijinPos.object3D.position.y += 2.5;
          this.raijinPos.object3D.position.z -= 10;
          //// Real ////

          //// Debug ////
          // this.raijinPos.object3D.position.x -= 0
          // this.raijinPos.object3D.position.y += 2
          // this.raijinPos.object3D.position.z -= 15
          //// Debug ////

          // Get world position of entityB
          var worldPositionB = new THREE.Vector3();
          this.raijinPos.object3D.getWorldPosition(worldPositionB);

          // Set world position of entityA to match entityB
          this.raijin.object3D.position.copy(worldPositionB);
          this.raijin.setAttribute("visible", "true");

          setTimeout(changeRaijinAnimation, 3000);

          break;

        default:
        // console.log('No matching wayspot with same title');
      }
      meshFound = true;
    };
    // xrmesh events
    this.el.sceneEl.addEventListener("xrprojectwayspotscanning", startScanning);
    this.el.sceneEl.addEventListener("xrmeshfound", foundMesh);
  },
  tick(time) {
    // Handles Movement(mainly lerp) of Raijin
    const currentTime = performance.now();
    deltaTime = (currentTime - previousTime) / 16; // Convert to seconds
    previousTime = currentTime;

    if (this.raijin_stage !== 0) {
      this.camera_topleft.object3D.getWorldPosition(cameraPosition);
      this.camera_front.object3D.getWorldPosition(cameraFrontPosition);
      this.camera_middle.object3D.getWorldPosition(cameraMiddlePosition);
      this.raijin.object3D.getWorldPosition(modelPosition);

      if (this.raijin_stage === 1) {
        distanceM = cameraMiddlePosition.distanceTo(modelPosition);
        if (distanceM <= 0.02) {
          this.raijin_stage = 2;
        }
        this.prevPosition = cameraMiddlePosition;
        this.raijin.object3D.position.lerp(
          this.prevPosition,
          this.raijinSpeed * deltaTime
        );
      } else if (this.raijin_stage === 2) {
        distanceFR = cameraFrontPosition.distanceTo(modelPosition);
        if (distanceFR <= 0.01) {
          this.raijinSpeed = 0.015;
        }
        this.prevPosition = cameraFrontPosition;
        this.raijin.object3D.position.lerp(
          this.prevPosition,
          this.raijinSpeed * deltaTime
        );
      } else if (this.raijin_stage === 3) {
        distanceTF = cameraPosition.distanceTo(modelPosition);
        if (distanceTF < 0.2) this.raijinSpeed = 0.015;
        this.prevPosition = cameraPosition;
        this.raijin.object3D.position.lerp(
          this.prevPosition,
          this.raijinSpeed * deltaTime
        );
      } else if (this.raijin_stage === 4) {
        distanceM = cameraMiddlePosition.distanceTo(modelPosition);
        this.prevPosition = cameraMiddlePosition;
        this.raijin.object3D.position.lerp(
          this.prevPosition,
          this.raijinSpeed * deltaTime
        );
      }
    }
  },
};

export { detectMeshAsakusaComponent };
