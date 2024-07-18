const lookAtYComponent = {
    // Modelをカメラに向けてずっとY軸回転するcomponent
    // Rotate Model towards Camera on Y axis
    init() {},
    tick() {
      const targetEl = document.getElementById("camera").object3D;
      const el = this.el.object3D;
      const vec = new THREE.Vector3();
      targetEl.getWorldDirection(vec);
      vec.y = 0;
  
      const additionalRotation = THREE.MathUtils.degToRad(10); // 角度追加 // additional angle
      vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), additionalRotation);
  
      vec.add(el.position);
      el.lookAt(vec);
    },
  };
  
  export { lookAtYComponent };