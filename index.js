

(function (opts) {
  console.log('transition')

  let timer;

  let index = 0

  var parent = document.querySelector('#webgl')
  var intensity = 2.2
  var speed = 1.0
  var hover = false

  const images = [
    'c.jpg',
    'avator.jpg',
    'b.jpg',
    'image.jpg',
    'd.jpg',
    'a.jpg'
  ]


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

uniform sampler2D evenTexture;
uniform sampler2D oddTexture;
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
  vec4 _texture1 = texture2D(evenTexture, distortedPosition1);
  vec4 _texture2 = texture2D(oddTexture, distortedPosition2);
  gl_FragColor = mix(_texture1, _texture2, dispFactor);
}
`;

  function firstDefined() {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined) return arguments[i];
    }
  }

  var dispImage = './10.jpg';

  var intensity1 = firstDefined(intensity1, intensity, 1);
  var intensity2 = firstDefined(intensity2, intensity, 1);
  var commonAngle = firstDefined(Math.PI / 4); // 45 degrees by default, so grayscale images work correctly
  var angle1 = firstDefined(angle1, -commonAngle);
  var angle2 = firstDefined(angle2, -commonAngle);
  var speedIn = speed
  var speedOut = speed
  var userHover = firstDefined(hover, true);
  var easing = firstDefined(easing, Expo.easeOut);

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
  // camera.position.x = 5;

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

  const textures = images.map((image) => {
    const texture = loader.load(image, render)
    texture.magFilter = THREE.LinearFilter
    return texture
  })

  // const fragment = document.createDocumentFragment()

  const ctrl = textures.map((t, i) => {
    const dom = `<li><a href="#" data-index="${i}" class="js-trigger">${i}</a></li>`

    return dom
  }).join('')

  document.querySelector('#ctrl').innerHTML = ctrl

  const triggers = document.querySelectorAll('.js-trigger');

  [].forEach.call(triggers, function(trigger) {
    trigger.addEventListener('click', onClickTrigger, false)
  })

  function onClickTrigger(e) {
    e.preventDefault()

    stop()

    index = Number(e.currentTarget.getAttribute('data-index'))

    console.log(index)

    start()
  }

  var disp = loader.load(dispImage, render);
  disp.wrapS = disp.wrapT = THREE.RepeatWrapping;

  textures[0].magFilter = textures[1].magFilter = THREE.LinearFilter;
  textures[0].minFilter = textures[1].minFilter = THREE.LinearFilter;

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
      evenTexture: {
        type: 't',
        value: textures[0]
      },
      oddTexture: {
        type: 't',
        value: null
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

  

  function transitionIn() {
    // ++index

    if(index > (textures.length - 1)) {
      index = 0
    }

    const texture = textures[index]

    mat.uniforms.oddTexture.value = texture

    TweenMax.to(mat.uniforms.dispFactor, speedIn, {
      value: 1,
      ease: easing,
      onUpdate: render,
      onComplete: render
    });
  }

  function transitionOut() {
    // ++index

    if(index > (textures.length - 1)) {
      index = 0
    }

    const texture = textures[index]

    mat.uniforms.evenTexture.value = texture

    TweenMax.to(mat.uniforms.dispFactor, speedOut, {
      value: 0,
      ease: easing,
      onUpdate: render,
      onComplete: render
    });
  }

  // let mode = 0

  start()

  function start() {
    timer = setInterval(() => {
      if(index % 2 === 1) {
        ++index
  
        transitionOut()
      } else {
  
        ++index
        transitionIn()
      }
  
      // index++
    }, 3000)
  }

  function stop() {
    clearInterval(timer)
    timer = null
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

  // this.next = transitionIn;
  // this.previous = transitionOut;
})();