let uiInited = false;
let targetBadge = "";

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

const detectMeshHamarikyuComponent = {
  init() {
    console.log("Init Hamarikyu");
    const scene = this.el.sceneEl;
    scene.emit("recenter");
    const mapBtn = document.getElementById("map-btn");
    this.container = document.getElementById("container");
    this.field = document.getElementById("field");
    this.busho = document.getElementById("busho");
    const bushoAnim = document.getElementById("busho-anim");
    const busho = document.getElementById("busho");
    const pointA = document.getElementById("pointA");
    const pointB = document.getElementById("pointB");
    const pointC = document.getElementById("pointC");
    const pointD = document.getElementById("pointD");
    const pointE = document.getElementById("pointE");

    // change Position of PointD (Can be removed in current version)
    const newPointDPos = calculateIntermediatePoint(
      pointC.object3D.position,
      pointE.object3D.position,
      0.9
    );
    // console.log("new D: " + newPointDPos.x + " " + newPointDPos.y)
    pointD.setAttribute("position", `${newPointDPos.x} 0 ${newPointDPos.y}`);

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

    // Moves Busho from one Point to another Point within specific duration
    function moveBusho(startPoint, endPoint, duration) {
      // console.log("start moving busho")
      // Set the initial position of busho to the start point
      busho.setAttribute("position", startPoint);

      // Calculate the rotation to point towards the end point
      let direction = new THREE.Vector3();
      direction
        .subVectors(
          new THREE.Vector3(...endPoint),
          new THREE.Vector3(...startPoint)
        )
        .normalize();
      let rotationY = Math.atan2(direction.x, direction.z);
      let rotationDeg = THREE.MathUtils.radToDeg(rotationY); // Corrected to Math object
      busho.setAttribute("rotation", "0 " + rotationDeg + " 0");

      // Update the 'animation' attribute to animate busho to move towards the end point
      busho.setAttribute("animation", {
        property: "position",
        to: endPoint.toArray().join(" "),
        dur: duration,
      });

      // Remove the 'animation' attribute after the animation is complete
      setTimeout(function () {
        busho.removeAttribute("animation"); // __position
      }, duration);
    }

    function playAnimationsSequentially() {
      // List of animation names in the order to play them
      var currentIndex = 0;
      const animationSequence = [
        "Stop.001",
        "LilTurn.001",
        "StandUp_1",
        "StandUp_2",
        "StandUp_3",
      ];

      // Function to play the next animation in the sequence
      function playNextAnimation(index) {
        //console.log("index: " + index)
        if (index === 5) index = 2;
        if (index < animationSequence.length) {
          var animationName = animationSequence[index];
          //console.log("Play anim: " + animationName)

          // Set the animation to play
          bushoAnim.setAttribute("animation-mixer", {
            clip: `${animationName}`,
            loop: "once",
          });

          // Listen for the animation-finished event
          bushoAnim.addEventListener(
            "animation-finished",
            function onAnimationFinished() {
              // Remove the event listener to avoid multiple triggers
              // console.log("Animation finish")
              bushoAnim.removeEventListener(
                "animation-finished",
                onAnimationFinished
              );

              // Play the next animation in the sequence
              playNextAnimation(index + 1);
            }
          );
        }
      }
      // Start playing animations sequentially from the beginning
      playNextAnimation(0);
    }

    function calculateIntermediatePoint(pointX, pointY, percentage) {
      var _pointX = new THREE.Vector2(pointX.x, pointX.z);
      var _pointY = new THREE.Vector2(pointY.x, pointY.z);

      // Calculate the intermediate point at 95% of the distance
      var pointZ = new THREE.Vector2(
        _pointX.x + percentage * (_pointY.x - _pointX.x),
        _pointX.y + percentage * (_pointY.y - _pointX.y)
      );

      return pointZ;
    }

    //console.log('Try find Mesh: ' + window._startAR.title)
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

      // Wayspot specific contents
      let wayspotTitle = "";
      let name = "";
      let hint = "";

      switch (waypoint) {
        case "hamarikyu":
          wayspotTitle = "c6d06f5b9d414b2ea3208037a0c3d9fd.107";
          name = "Hama-rikyu Gardens";
          hint = "../assets/kusunoki_cover-lthelo657c.png";
          // console.log(waypoint + " " + name + " " + wayspotTitle);
          break;
        default:
          // console.log('No matching wayspot with same title');
          wayspotTitle = "c6d06f5b9d414b2ea3208037a0c3d9fd.107";
          name = "Hama-rikyu Gardens";
          hint = "../assets/kusunoki_cover-lthelo657c.png";
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
            window.share();
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
            window.showStampDetail();
            const detailLayer = document.querySelector(".layer");
            detailLayer.style.display = "flex";
            // existingButton.click();
          });
          placeButton.addEventListener("contextmenu", function (event) {
            event.preventDefault();
          });

          const btnlearnmore = document.getElementById("btn-learn-more");
          btnlearnmore.addEventListener("click", () => {
            window.showLearnMore("https://www.gotokyo.org/en/destinations/central-tokyo/tsukiji/index.html");
            window.open(
              "https://www.gotokyo.org/en/destinations/central-tokyo/tsukiji/index.html",
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

            window.closeCheckin();
          });

          topBar.appendChild(retryBtn);

          const params = new URLSearchParams(
            document.location.search.substring(1)
          );
          const waypoint = params.get("scene") ? params.get("scene") : null; // world-map

          const endBtn = document.getElementById("endBtn");
          endBtn.addEventListener("contextmenu", function (event) {
            event.preventDefault();
          });
          endBtn.addEventListener("click", () => {
            // window.location.href = url;
            uiInited = false; // Reset uiInit in case
            window.closeAR();
          });
          endBtn.style.display = "block";
          topBar.appendChild(endBtn);

          // window.openCheckin();
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
          //
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

      // // //// Script for showing Wireframe Mesh ////
      // const texture = null;
      // this.threeMaterial = new THREE.MeshBasicMaterial({
      //   vertexColors: !texture,
      //   wireframe: false,
      //   visible: true,
      //   transparent: true,
      //   map: texture,
      // });

      // mesh = new THREE.Mesh(bufferGeometry, this.threeMaterial); // construct VPS mesh

      // // add mesh to A-Frame scene
      // this.meshEl = document.createElement('a-entity')
      // this.meshEl.id = 'vps-mesh'
      // mesh.material = discoWireframeMaterial
      // this.meshEl.object3D.add(mesh)
      // this.meshEl.object3D.position.copy(position)
      // this.meshEl.object3D.quaternion.copy(rotation)
      // this.meshEl.visible = true  // hide by default
      // this.meshEl.object3D.children[0].material.opacity = 0.4
      // scene.prepend(this.meshEl)
      // document.getElementById('vps-mesh').object3D.visible = true
      // //// Script for showing Wireframe Mesh ////

      switch (wayspotTitle) {
        case "c6d06f5b9d414b2ea3208037a0c3d9fd.107":
          // console.log('Mesh detected: 浜離宮');
          changeDetectedUI();

          this.container.setAttribute("visible", "true");
          this.container.object3D.position.copy(position);
          this.container.object3D.quaternion.copy(rotation);

          //// Real ////
          this.field.object3D.position.x += 2;
          this.field.object3D.position.y -= 3;
          this.field.object3D.position.z -= 7;
          //// Real ////

          //// Debug ////
          // this.container.object3D.position.x += 1
          // this.container.object3D.position.y -= 3
          // this.container.object3D.position.z -= 15
          //// Real ////

          moveBusho(pointA.object3D.position, pointB.object3D.position, 3000);
          // console.log("from A to B")

          setTimeout(function () {
            // console.log("from C to E")
            moveBusho(pointC.object3D.position, pointE.object3D.position, 2000);
          }, 3100);

          setTimeout(function () {
            // console.log("playAnimationsSequentially")
            //moveBusho(pointD.object3D.position, pointE.object3D.position, 400)
            playAnimationsSequentially();
          }, 4600);
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
};

export { detectMeshHamarikyuComponent };
