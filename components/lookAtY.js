const lookAtYComponent = {
  init() {},
  tick() {
    const targetEl = document.getElementById("camera").object3D;
    const el = this.el.object3D;
    const vec = new THREE.Vector3();
    targetEl.getWorldDirection(vec);
    vec.y = 0;

    vec.add(el.position);
    el.lookAt(vec);
  },
};

export { lookAtYComponent };
