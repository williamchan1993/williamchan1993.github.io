let uiInited = false;

const detectMeshVpsComponent = {
  init() {
    const scene = this.el.sceneEl;
    scene.emit("recenter");
    this.container = document.getElementById("container");
    this.field = document.getElementById("field");
    this.model = document.getElementById("model"); 
    let meshFound = false;
    this.ok = false;
    this.stage = 0;
    uiInited = false; // Reset uiInit in case

    // ローディング画面関連
    // Loading UI related
    const loadImage = document.getElementById("requestingCameraPermissions");
    if (loadImage) {
      loadImage.style.display = "none";
    }
    const loadBackground = document.getElementById("loadBackground");
    if (loadBackground) {
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

    ///////////////////////////
    ////   共通Function    ////
    /// Common Functions  ////
    //////////////////// /////

    // モデルとアニメーション登録
    // Model and Animation reference
    const modelAnim = document.getElementById("anim");
    const model = document.getElementById("model");

    // モデル移動用ポイント
    // Points for moving references
    const pointA = document.getElementById("pointA");
    const pointB = document.getElementById("pointB");
    const pointC = document.getElementById("pointC");
    
    // ポイント位置調整用
    // Adjust point position
    const newPointPos = calculateIntermediatePoint(
      pointA.object3D.position,
      pointB.object3D.position,
      0.9
    );
    pointC.setAttribute("position", `${newPointPos.x} 0 ${newPointPos.y}`);
    
    // ポイント位置調整機能
    // Point position adjust function
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

    // モデル移動機能
    // Move model function
    function moveModel(startPoint, endPoint, duration) {
      model.setAttribute("position", startPoint);
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
      model.setAttribute("rotation", "0 " + rotationDeg + " 0");

      // Update the 'animation' attribute to animate busho to move towards the end point
      model.setAttribute("animation", {
        property: "position",
        to: endPoint.toArray().join(" "),
        dur: duration,
      });

      // Remove the 'animation' attribute after the animation is complete
      setTimeout(function () {
        model.removeAttribute("animation"); // __position
      }, duration);
    }

    // モデルTransform変更機能
    // Change Transform function
    const transformModel = () => {
        // Position 変更, Change Position
        const targetPosition = {
            x: model.object3D.position.x - 1,
            y: model.object3D.position.y + 3,
            z: model.object3D.position.z,
        };
        model.setAttribute("animation__position", {
            property: "position",
            dur: 460,
            to: targetPosition,
            easing: "easeOutSine",
        });

        // Scale 変更, Change Scale
        model.setAttribute("animation__scale", {
            property: "scale",
            dur: 460,
            to: "0.95 0.95 0.95",
            easing: "easeOutSine",
        });

        // Rotation 変更, Change Rotation
        const currentRotation = model.getAttribute("rotation");
        rikishi.setAttribute("animation__rotate2", {
          property: "rotation.y",
          from: `${currentRotation.y}`,
          to: `${currentRotation.y + 60}`,
          dur: 400,
        });
    };

    // モデルアニメーション連続プレイ機能
    // Play Animation in sequence function
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
        if (index === 5) index = 2;
        if (index < animationSequence.length) {
          var animationName = animationSequence[index];
          // Set the animation to play
          modelAnim.setAttribute("animation-mixer", {
            clip: `${animationName}`,
            loop: "once",
          });

          // Listen for the animation-finished event
          modelAnim.addEventListener(
            "animation-finished",
            function onAnimationFinished() {
              // Remove the event listener to avoid multiple triggers
              modelAnim.removeEventListener(
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

    // アニメーションプレイ
    // Play Animation Once
    const playAnimationOnce = () => {
        // Start Whole Animation and stay a ground pos
        model.setAttribute("animation-mixer", "clip: Whole_02; loop: once"); // Start Whole animation
        model.addEventListener(
            "animation-finished",
            changeModelEndAnimation
        );
        setTimeout(RikishiAnimation2, 1050);  // Next animation 次のアニメーション
    };

    // アニメーションループ
    // Animation loop
    function loopModelAnimation() {
        model.setAttribute(
            "animation-mixer",
            "clip: TeppouRERE; loop: repeat"
        );
        model.addEventListener("animation-loop", animationLoop);
    }

    ////////////////////////////
    //// スキャンイベント関連 ////
    // Related to scan events //
    ////////////////////////////

    const params = new URLSearchParams(document.location.search.substring(1));
    const waypoint = params.get("scene") ? params.get("scene") : null; // world-map

    const startScanning = ({ detail }) => {
      console.log("start Scanning");
      const vpsInstLayer = document.getElementById("vps-inst");
      vpsInstLayer.style.display = "block";
      const backBtn = document.getElementById("back-btn");
      backBtn.style.display = "block";
    };

    const foundMesh = ({ detail }) => {
      if (meshFound === true) {
        return;
      }
      const { bufferGeometry, position, rotation } = detail;

      // Wayspot specific contents
      let wayspotTitle = "";
      let name = "";

      switch (waypoint) {
        case "hamarikyu":
          wayspotTitle = "c6d06f5b9d414b2ea3208037a0c3d9fd.107";
          name = "Hama-rikyu Gardens";
          break;
        default:
          console.log('No matching wayspot with same title');
          wayspotTitle = "c6d06f5b9d414b2ea3208037a0c3d9fd.107";
          name = "Hama-rikyu Gardens";
      }

      // 結果UI関連
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
            // existingButton.click();
          });
          placeButton.addEventListener("contextmenu", function (event) {
            event.preventDefault();
          });

          const btnlearnmore = document.getElementById("btn-learn-more");
          btnlearnmore.addEventListener("click", () => {
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
          });
          endBtn.style.display = "block";
          topBar.appendChild(endBtn);
        }
      }

      // スキャン関連UI生成
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

      switch (wayspotTitle) {
        case "vps-name": // 8thwallのVPS名前を入れる // Input the 8thwall VPS name 
          // VPS認識成功時の挙動
          // Actions when VPS detected
          changeDetectedUI();

          this.container.setAttribute("visible", "true");
          this.container.object3D.position.copy(position);
          this.container.object3D.quaternion.copy(rotation);

          // container内の内容の位置・回転変更
          // Change the position and rotation of contents in container
          this.field.object3D.position.x += 2;
          this.field.object3D.position.y -= 3;
          this.field.object3D.position.z -= 7;

          moveModel(pointA.object3D.position, pointB.object3D.position, 3000);

          setTimeout(function () {
            moveModel(pointC.object3D.position, pointE.object3D.position, 2000);
          }, 3100);

          setTimeout(function () {
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
  /////////////////////////////////
  //// tick関連、repeatイベント ////
  //// tick and repeat events  ////
  /////////////////////////////////
  tick(time) {
    // 浅草寺の雷神で使ったカメラ位置・角度によるモデル移動loop
    // Model movement loop referencing camera position and angle used in Asakusa Temple
    const currentTime = performance.now();
    deltaTime = (currentTime - previousTime) / 16; // Convert to seconds
    previousTime = currentTime;

    if (this.stage !== 0) {
      // Frameごとに各カメラオブジェクトの位置更新
      this.camera_topleft.object3D.getWorldPosition(cameraPosition);
      this.camera_front.object3D.getWorldPosition(cameraFrontPosition);
      this.camera_middle.object3D.getWorldPosition(cameraMiddlePosition);
      this.raijin.object3D.getWorldPosition(modelPosition);

      if (this.stage === 1) {
        distanceM = cameraMiddlePosition.distanceTo(modelPosition);
        if (distanceM <= 0.02) {
          this.stage = 2;
        }
        this.prevPosition = cameraMiddlePosition;
        this.raijin.object3D.position.lerp(
          this.prevPosition,
          this.raijinSpeed * deltaTime
        );
      } else if (this.stage === 2) {
        distanceFR = cameraFrontPosition.distanceTo(modelPosition);
        if (distanceFR <= 0.01) {
          this.raijinSpeed = 0.015;
        }
        this.prevPosition = cameraFrontPosition;
        this.raijin.object3D.position.lerp(
          this.prevPosition,
          this.raijinSpeed * deltaTime
        );
      } else if (this.stage === 3) {
        distanceTF = cameraPosition.distanceTo(modelPosition);
        if (distanceTF < 0.2) this.raijinSpeed = 0.015;
        this.prevPosition = cameraPosition;
        this.raijin.object3D.position.lerp(
          this.prevPosition,
          this.raijinSpeed * deltaTime
        );
      } else if (this.stage === 4) {
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

export { detectMeshVpsComponent };
