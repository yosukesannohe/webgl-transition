

(function (opts) {
  console.log('transition')

  var parent = document.querySelector('#webgl')
  var intensity = 1.0
  var speed = 1.0
  var hover = true


  // =====

  var vertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

  var fragment = `
varying vec2 vUv;

uniform float dispFactor;
uniform sampler2D disp;

uniform sampler2D texture1;
uniform sampler2D texture2;
uniform float angle1;
uniform float angle2;
uniform float intensity1;
uniform float intensity2;

mat2 getRotM(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

void main() {
  vec4 disp = texture2D(disp, vUv);
  vec2 dispVec = vec2(disp.r, disp.g);
  vec2 distortedPosition1 = vUv + getRotM(angle1) * dispVec * intensity1 * dispFactor;
  vec2 distortedPosition2 = vUv + getRotM(angle2) * dispVec * intensity2 * (1.0 - dispFactor);
  vec4 _texture1 = texture2D(texture1, distortedPosition1);
  vec4 _texture2 = texture2D(texture2, distortedPosition2);
  gl_FragColor = mix(_texture1, _texture2, dispFactor);
}
`;

  function firstDefined() {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined) return arguments[i];
    }
  }

  // var parent = opts.parent;
  var dispImage = './7.jpg';
  var image1 = './image.jpg';
  var image2 = './img.png';
  var intensity1 = firstDefined(intensity1, intensity, 1);
  var intensity2 = firstDefined(intensity2, intensity, 1);
  var commonAngle = firstDefined(Math.PI / 4); // 45 degrees by default, so grayscale images work correctly
  var angle1 = firstDefined(angle1, commonAngle * 3);
  var angle2 = firstDefined(angle2, -commonAngle);
  var speedIn = firstDefined(speedIn, speed, 1.2);
  var speedOut = firstDefined(speedOut, speed, 1.2);
  var userHover = firstDefined(hover, true);
  var easing = firstDefined(easing, Expo.easeOut);

  if (!parent) {
    console.warn('Parent missing');
    return;
  }

  if (!(image1 && image2 && dispImage)) {
    console.warn('One or more images are missing');
    return;
  }

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(
    parent.offsetWidth / -2,
    parent.offsetWidth / 2,
    parent.offsetHeight / 2,
    parent.offsetHeight / -2,
    1,
    1000
  );

  camera.position.z = 1;

  var renderer = new THREE.WebGLRenderer({
    // antialias: false
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0xffffff, 0.0);
  renderer.setSize(parent.offsetWidth, parent.offsetHeight);
  parent.appendChild(renderer.domElement);

  var render = function () {
    // This will be called by the TextureLoader as well as TweenMax.
    renderer.render(scene, camera);
  };

  var loader = new THREE.TextureLoader();
  loader.crossOrigin = '';
  var texture1 = loader.load(image1, render);
  var texture2 = loader.load(image2, render);
  var disp = loader.load(dispImage, render);
  disp.wrapS = disp.wrapT = THREE.RepeatWrapping;

  texture1.magFilter = texture2.magFilter = THREE.LinearFilter;
  texture1.minFilter = texture2.minFilter = THREE.LinearFilter;

  var mat = new THREE.ShaderMaterial({
    uniforms: {
      intensity1: {
        type: 'f',
        value: intensity1
      },
      intensity2: {
        type: 'f',
        value: intensity2
      },
      dispFactor: {
        type: 'f',
        value: 0.0
      },
      angle1: {
        type: 'f',
        value: angle1
      },
      angle2: {
        type: 'f',
        value: angle2
      },
      texture1: {
        type: 't',
        value: texture1
      },
      texture2: {
        type: 't',
        value: texture2
      },
      disp: {
        type: 't',
        value: disp
      },
    },

    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    opacity: 1.0,
  });

  var geometry = new THREE.PlaneBufferGeometry(parent.offsetWidth, parent.offsetHeight, 1);
  var object = new THREE.Mesh(geometry, mat);
  scene.add(object);

  let count = 0

  function transitionIn() {
    TweenMax.to(mat.uniforms.dispFactor, speedIn, {
      value: 1,
      ease: easing,
      onUpdate: render,
      onComplete: render,
    });

    let t;

    if(count % 2 === 0) {
      t = loader.load('./img.png', render)
    } else {
      t = loader.load('./10.jpg', render)
    }

    t.magFilter = THREE.LinearFilter;
    mat.uniforms.texture2.value = t

    count++
  }

  function transitionOut() {
    TweenMax.to(mat.uniforms.dispFactor, speedOut, {
      value: 0,
      ease: easing,
      onUpdate: render,
      onComplete: render,
    });
  }

  if (userHover) {
    parent.addEventListener('mouseenter', transitionIn);
    parent.addEventListener('touchstart', transitionIn);
    parent.addEventListener('mouseleave', transitionOut);
    parent.addEventListener('touchend', transitionOut);
  }

  window.addEventListener('resize', function (e) {
    renderer.setSize(parent.offsetWidth, parent.offsetHeight);
  });

  this.next = transitionIn;
  this.previous = transitionOut;

  // let count = 0

  // setInterval(() => {
  //   if(count % 3 === 0) {
  //     const t1 = loader.load('./avator.jpg', render)
  //     t1.magFilter = THREE.LinearFilter;
  //     t1.minFilter = THREE.LinearFilter;


  //     mat.uniforms.texture1.value = t1

  //     transitionIn()

  //     count++

      

  //     return
  //   }

  //   if(count % 2 === 0) {
  //     // const t1 = loader.load('./avator.jpg', render)
  //     const t2 = loader.load('./10.jpg', render)

  //     t2.magFilter = THREE.LinearFilter;
  //     t2.minFilter = THREE.LinearFilter;

  //     // mat.uniforms.texture1.value = t1
  //     mat.uniforms.texture2.value = t2
  //   } else {
  //     const t1 = loader.load('./img.png', render)

  //     t1.magFilter = THREE.LinearFilter;
  //     t1.minFilter = THREE.LinearFilter;

  //     // mat.uniforms.texture1.value = t2
  //     mat.uniforms.texture2.value = t1
  //   }

  //   transitionIn()

  //   count++

  // }, 1000)
})();