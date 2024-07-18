let doneInit = false;
let moveSpd = 0.35;
let uiInited = false;
let targetBadge = "";

const dogControlComponent = {
  init() {
    // console.log("Init Shibuya")
    uiInited = false; // Reset uiInit in case
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
    backBtn.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
    const okBtn = document.getElementById("inst-btn");

    // Listing elements
    this.dog = document.getElementById("dog");
    this.shadow = document.getElementById("ground");
    this.prevPosition = this.dog.object3D.position;
    const animationList = [
      "Default",
      "DfltToOswr",
      "Osuwari",
      "Oswr_Anim2",
      "OswrToDflt02",
      "Run",
      "Walk_Anim2",
      "Oswr_Anim3",
      "Jump",
    ];
    this.animationState = 1;
    this.needSitFlag = false;
    this.doneFirstMove = false;

    function changeAnimation(num) {
      document.getElementById("dog").setAttribute("animation-mixer", {
        clip: animationList[num],
        loop: "repeat",
      });
    }

    function playAnimationOnce(num) {
      document.getElementById("dog").setAttribute("animation-mixer", {
        clip: animationList[num],
        loop: "once",
      });
    }

    function onInitEnd() {
      console.log("Init ended!");
      console.log("change to 1 by End anim from Init ended");
      playAnimationOnce(1); // default to osuwari
    }

    function onStartTracking() {
      console.log("start Tracking!");
      doneInit = true;
    }

    const keepHand = ({ detail }) => {
      if (doneInit === true) {
        const xMod = detail.handKind === 1 ? -0.03 : 0.03;
        const targetPos = new THREE.Vector3(
          detail.transform.position.x + xMod,
          detail.transform.position.y - 0.04,
          detail.transform.position.z
        );
        const distance = this.dog.object3D.position.distanceTo(targetPos);

        if (distance <= 0.05) {
          if (
            this.animationState !== 1 &&
            this.animationState !== 3 &&
            this.animationState !== 4 &&
            this.doneFirstMove === true
          ) {
            // console.log("played once 1 by Distance from " + this.animationState)
            playAnimationOnce(1); // default to osuwari
            this.animationState = 1;
          }
        } else {
          if (
            this.animationState !== 6 &&
            this.animationState !== 4 &&
            this.animationState !== 1 &&
            this.doneFirstMove === true
          ) {
            console.log(
              "played once OswrToDefault by Distance from " +
                animationList[this.animationState]
            );
            playAnimationOnce(4);
            this.animationState = 4;
          }
        }

        if (this.animationState !== 4 && distance > 0.02) {
          this.dog.object3D.position.lerp(this.prevPosition, moveSpd);
          this.shadow.object3D.position.lerp(this.prevPosition, moveSpd);
          // Control intensity of shadow
          const result = (1 - Math.min(Math.max(distance / 0.2, 0), 1)) * 0.8;
          this.shadow.setAttribute("material", {
            shader: "shadow",
            transparent: true,
            opacity: result,
          });
        }
        // update the values
        this.prevPosition = targetPos;
      }
    };

    let timeoutId;

    function endLostJump() {
      console.log("End lost jump, change to 3 by End anim from Lost Jump");
      changeAnimation(3);
      this.animationState = 3;
      doneInit = true;
    }

    function finishLostHandCount() {
      doneInit = false;
      this.needSitFlag = true;
      moveSpd = 0.5;
      this.doneFirstMove = false;
      this.dog = document.getElementById("dog");
      this.shadow = document.getElementById("ground");
      this.dog.setAttribute(
        "animation",
        "property: rotation; to: 0 0 0; dur: 1000"
      );
      this.dog.setAttribute(
        "animation__2",
        "property: position; to: -0.15 1.7 -0.8; dur: 1000"
      );
      this.shadow.setAttribute("material", {
        shader: "shadow",
        transparent: true,
        opacity: 0.8,
      });
      this.shadow.setAttribute(
        "animation",
        "property: position; to: -0.15 1.7 -0.8; dur: 1000"
      );
      setTimeout(endLostJump, 1200);
      playAnimationOnce(8);
      this.animationState = 8;
      console.log(
        "Counting for 1.5 seconds is done. " +
          animationList[this.animationState]
      );
    }

    function startLostHandevent() {
      //console.log("Event A happened.");
      // Set a timeout of 3 seconds
      timeoutId = setTimeout(finishLostHandCount, 3000);
    }

    function endLostHandevent() {
      //console.log("Event B happened, counting stopped.");
      // Clear the timeout set for event A
      clearTimeout(timeoutId);
    }

    const lostHand = () => {
      if (doneInit === true) {
        if (this.animationState === 6) {
          // Walking
          console.log("played once DefaultToOswr by Distance from lostHand");
          playAnimationOnce(1);
          this.animationState = 1;
        } else if (this.animationState === 4) {
          // OswrtoDefault
          console.log("need sit Flag to true");
          this.needSitFlag = true;
        }
        this.shadow.setAttribute("material", {
          shader: "shadow",
          transparent: true,
          opacity: 0,
        });
        startLostHandevent();
      }
    };

    const foundHand = (detail) => {
      if (doneInit === true) {
        this.needSitFlag = false;
        console.log("need sit Flag to false");
        this.dog.removeAttribute("animation");
        this.dog.removeAttribute("animation__2");
        this.shadow.removeAttribute("animation");
        if (this.doneFirstMove === false) {
          playAnimationOnce(8);
          this.animationState = 8;
        }
        endLostHandevent();
      }
    };

    const animEnded = () => {
      if (this.animationState === 8) {
        // Jump
        console.log(
          "change to 3 by End anim from " + animationList[this.animationState]
        );
        changeAnimation(3);
        this.animationState = 3;
        this.doneFirstMove = true;
        moveSpd = 0.1;
      } else if (this.animationState === 1) {
        // Default to Oswr
        console.log(
          "change to 3 by End anim from " + animationList[this.animationState]
        );
        changeAnimation(3);
        this.animationState = 3;
      } else if (this.animationState === 4) {
        // Oswr to Default
        if (this.needSitFlag) {
          console.log(
            "change to DefaulttoOswr by End anim from " +
              animationList[this.animationState] +
              " need sit"
          );
          playAnimationOnce(1);
          this.animationState = 1;
          this.needSitFlag = false;
          moveSpd = 0.1;
        } else {
          console.log(
            "change to Walk by End anim from " +
              animationList[this.animationState] +
              " no need sit"
          );
          changeAnimation(6);
          this.animationState = 6;
        }
      }
    };

    function handloading() {
      console.log("loading start");
      // Enter screen
      const instructionLayer = document.getElementById("instructionLayer");
      instructionLayer.style.display = "flex";
      const backBtn = document.getElementById("back-btn");
      backBtn.style.display = "block";
      this.dog = document.getElementById("dog");
      this.shadow = document.getElementById("ground");
    }

    this.el.sceneEl.addEventListener("xrhandfound", foundHand);
    this.el.sceneEl.addEventListener("xrhandupdated", keepHand);
    this.el.sceneEl.addEventListener("xrhandlost", lostHand);
    this.el.sceneEl.addEventListener("animation-finished", animEnded);
    this.el.sceneEl.addEventListener("xrhandloading", handloading);

    const photoIcon = document.getElementById("photo-icon");
    const photoText = document.getElementById("photo-text");
    photoIcon.addEventListener("click", () => {
      if (photoText.style.opacity === '1') {
        photoText.style.opacity = '0'; // Fade out
      } else {
        photoText.style.opacity = '1'; // Fade in
      }
    })

    okBtn.addEventListener("click", () => {
      createResultUI();
      const photoIcon = document.getElementById("photo-icon");
      photoIcon.style.display = "block";
      const photoText = document.getElementById("photo-text");
      photoText.style.display = "block";
      photoText.style.opacity = 0;
      const instructionLayer = document.getElementById("instructionLayer");
      instructionLayer.classList.add("hide");
      
      setTimeout(function () {
        instructionLayer.style.display = "none";
        photoText.style.opacity = 1;
      }, 1000);
      this.dog.setAttribute(
        "animation",
        "property: rotation; to: 0 0 0; dur: 3000"
      );
      this.dog.setAttribute(
        "animation__2",
        "property: position; to: -0.15 1.7 -0.8; dur: 3000"
      );
      this.shadow.setAttribute("material", {
        shader: "shadow",
        transparent: true,
        opacity: 0.8,
      });
      this.shadow.setAttribute(
        "animation",
        "property: position; to: -0.15 1.7 -0.8; dur: 3000"
      );
      setTimeout(onInitEnd, 3000);
      setTimeout(onStartTracking, 4000);

      // Get the elements
      var recorderContainer = document.querySelector(".recorder-container");
      var videoInst = document.getElementById("video_inst");

      // Move video_inst as a child of recorder-container
      recorderContainer.style.display = "block";
      recorderContainer.appendChild(videoInst);

      // Set the position of video_inst
      videoInst.style.display = "block";
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
        document.addEventListener("click", function (event) {
          console.log("Screen clicked!");
          videoInst.style.display = "none";
        });
      }, 1000);
    });
  },
};

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

function getAllSavedWaypointFromLocalStorage() {
  // Retrieve the list of from local storage
  const stringList = JSON.parse(localStorage.getItem("badge")) || [];
  return stringList;
}

function createResultUI() {
  //console.log("Trying createResultUI()")
  if (!uiInited) {
    //console.log("Entering createResultUI()")
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
        "https://www.gotokyo.org/en/destinations/western-tokyo/shibuya/index.html",
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

    const params = new URLSearchParams(document.location.search.substring(1));
    const waypoint = params.get("scene") ? params.get("scene") : null; // world-map
    console.log("Found waypoint from url: " + waypoint);

    // Create and append endBtn
    // let foundBadge = false;
    // for (const badge of getAllSavedWaypointFromLocalStorage()) {
    //   if (badge === waypoint) {
    //     console.log(`String '${waypoint}' found in the list.`);
    //     foundBadge = true;
    //     break; // Exit the loop if the string is found
    //   }
    // }

    // let url = "";
    // switch (waypoint) {
    //   case "asakusa":
    //     url = "https://tokyo-machitabi-ar.web.app/checkin/kaminari";
    //     targetBadge = "asakusaBadge";
    //     break;
    //   case "ryogoku":
    //     url = "https://tokyo-machitabi-ar.web.app/checkin/rikishi";
    //     targetBadge = "ryogokuBadge";
    //     break;
    //   case "hamarikyu":
    //     url = "https://tokyo-machitabi-ar.web.app/checkin/hamarikyu";
    //     targetBadge = "hamarikyuBadge";
    //     break;
    //   default:
    //     url = "https://tokyo-machitabi-ar.web.app/checkin/hachiko";
    //     targetBadge = "shibuyaBadge";
    //     break;
    // }

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

    // if (!foundBadge) {
    //   // Create and append badge
    //   saveBadgeToLocalStorage(waypoint);
    //   console.log("found badge");
    //   const badge = document.getElementById(targetBadge);
    //   badge.classList.add("badge");
    //   badge.style.display = "block";
    //   badge.addEventListener("contextmenu", function (event) {
    //     event.preventDefault();
    //   });
    //   topBar.appendChild(badge);
    // }
  } else {
    //console.log("Didn't run createResultUI()")
  }
}

window.addEventListener("mediarecorder-photocomplete", (e) => {
  console.log("photo complete " + e.detail.blob);
  document.getElementById("imagePreview").style =
    "display: block; height: 100%; width: auto;";
  document.getElementById("videoPreview").style.display = "none";
  document
    .getElementById("imagePreview")
    .addEventListener("contextmenu", function (event) {
      event.off();
    });

  // window.recordPhoto();
  // window.openCheckin();
});

window.addEventListener("mediarecorder-recordcomplete", (e) => {
  console.log("record complete " + e.detail.videoBlob);
  document.getElementById("videoPreview").style =
    "display: block; height: 100%; width: auto;";
  document.getElementById("imagePreview").style.display = "none";
  document
    .getElementById("videoPreview")
    .addEventListener("contextmenu", function (event) {
      event.off();
    });

  // window.recordMovie();
  // window.openCheckin();
});

export { dogControlComponent };
