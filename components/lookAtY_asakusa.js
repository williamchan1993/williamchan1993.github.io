const lookAtYasakusaComponent = {
  init() {},
  tick() {
    const targetEl = document.getElementById("camera").object3D;
    const el = this.el.object3D;
    const vec = new THREE.Vector3();
    targetEl.getWorldDirection(vec);
    // vec.x = 0.0;
    vec.y = 0;

    const additionalRotation = THREE.MathUtils.degToRad(10);
    vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), additionalRotation);

    vec.add(el.position);
    el.lookAt(vec);
  },
};

export { lookAtYasakusaComponent };
