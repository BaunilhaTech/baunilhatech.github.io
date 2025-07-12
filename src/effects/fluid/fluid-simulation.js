import { getWebGLContext } from "./webgl-context.js";
import { GLProgram, compileShader } from "./gl-program.js";
import { createFramebuffer, createDoubleFramebuffer } from "./framebuffer.js";
import { InteractivePointerManager } from "./interactive-pointer-simple.js";

export class FluidSimulation {
  constructor(canvas) {
    this.canvas = canvas;
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    this.config = {
      TEXTURE_DOWNSAMPLE: 1,
      DENSITY_DISSIPATION: 0.98,
      VELOCITY_DISSIPATION: 0.99,
      PRESSURE_DISSIPATION: 0.8,
      PRESSURE_ITERATIONS: 25,
      CURL: 30,
      SPLAT_RADIUS: 0.005,
    };

    this.splatStack = [];
    this.lastTime = Date.now();

    const { gl, ext } = getWebGLContext(this.canvas);
    this.gl = gl;
    this.ext = ext;

    this.pointerManager = new InteractivePointerManager();
    this.initializeShaders();
    this.initializeFramebuffers();
    this.initializeBlitFunction();
    this.setupEventListeners();
  }

  initializeShaders() {
    const baseVertexShader = compileShader(
      this.gl,
      this.gl.VERTEX_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;

        void main () {
            vUv = aPosition * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `
    );

    const clearShader = compileShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;

        void main () {
            gl_FragColor = value * texture2D(uTexture, vUv);
        }
      `
    );

    const displayShader = compileShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        uniform sampler2D uTexture;

        void main () {
            gl_FragColor = texture2D(uTexture, vUv);
        }
      `
    );

    const splatShader = compileShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;

        void main () {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
      `
    );

    const advectionManualFilteringShader = compileShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform float dt;
        uniform float dissipation;

        vec4 bilerp (in sampler2D sam, in vec2 p) {
            vec4 st;
            st.xy = floor(p - 0.5) + 0.5;
            st.zw = st.xy + 1.0;
            vec4 uv = st * texelSize.xyxy;
            vec4 a = texture2D(sam, uv.xy);
            vec4 b = texture2D(sam, uv.zy);
            vec4 c = texture2D(sam, uv.xw);
            vec4 d = texture2D(sam, uv.zw);
            vec2 f = p - st.xy;
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main () {
            vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;
            gl_FragColor = dissipation * bilerp(uSource, coord);
            gl_FragColor.a = 1.0;
        }
      `
    );

    const advectionShader = compileShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform float dt;
        uniform float dissipation;

        void main () {
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            gl_FragColor = dissipation * texture2D(uSource, coord);
            gl_FragColor.a = 1.0;
        }
      `
    );

    const divergenceShader = compileShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;

        vec2 sampleVelocity (in vec2 uv) {
            vec2 multiplier = vec2(1.0, 1.0);
            if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; }
            if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; }
            if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; }
            if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; }
            return multiplier * texture2D(uVelocity, uv).xy;
        }

        void main () {
            float L = sampleVelocity(vL).x;
            float R = sampleVelocity(vR).x;
            float T = sampleVelocity(vT).y;
            float B = sampleVelocity(vB).y;
            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
      `
    );

    const curlShader = compileShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;

        void main () {
            float L = texture2D(uVelocity, vL).y;
            float R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x;
            float B = texture2D(uVelocity, vB).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
        }
      `
    );

    const vorticityShader = compileShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;

        void main () {
            float T = texture2D(uCurl, vT).x;
            float B = texture2D(uCurl, vB).x;
            float C = texture2D(uCurl, vUv).x;
            vec2 force = vec2(abs(T) - abs(B), 0.0);
            force *= 1.0 / length(force + 0.00001) * curl * C;
            vec2 vel = texture2D(uVelocity, vUv).xy;
            gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
        }
      `
    );

    const pressureShader = compileShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;

        vec2 boundary (in vec2 uv) {
            uv = min(max(uv, 0.0), 1.0);
            return uv;
        }

        void main () {
            float L = texture2D(uPressure, boundary(vL)).x;
            float R = texture2D(uPressure, boundary(vR)).x;
            float T = texture2D(uPressure, boundary(vT)).x;
            float B = texture2D(uPressure, boundary(vB)).x;
            float C = texture2D(uPressure, vUv).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
      `
    );

    const gradientSubtractShader = compileShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;

        vec2 boundary (in vec2 uv) {
            uv = min(max(uv, 0.0), 1.0);
            return uv;
        }

        void main () {
            float L = texture2D(uPressure, boundary(vL)).x;
            float R = texture2D(uPressure, boundary(vR)).x;
            float T = texture2D(uPressure, boundary(vT)).x;
            float B = texture2D(uPressure, boundary(vB)).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
      `
    );

    this.clearProgram = new GLProgram(this.gl, baseVertexShader, clearShader);
    this.displayProgram = new GLProgram(
      this.gl,
      baseVertexShader,
      displayShader
    );
    this.splatProgram = new GLProgram(this.gl, baseVertexShader, splatShader);
    this.advectionProgram = new GLProgram(
      this.gl,
      baseVertexShader,
      this.ext.supportLinearFiltering
        ? advectionShader
        : advectionManualFilteringShader
    );
    this.divergenceProgram = new GLProgram(
      this.gl,
      baseVertexShader,
      divergenceShader
    );
    this.curlProgram = new GLProgram(this.gl, baseVertexShader, curlShader);
    this.vorticityProgram = new GLProgram(
      this.gl,
      baseVertexShader,
      vorticityShader
    );
    this.pressureProgram = new GLProgram(
      this.gl,
      baseVertexShader,
      pressureShader
    );
    this.gradientSubtractProgram = new GLProgram(
      this.gl,
      baseVertexShader,
      gradientSubtractShader
    );
  }

  initializeFramebuffers() {
    this.textureWidth =
      this.gl.drawingBufferWidth >> this.config.TEXTURE_DOWNSAMPLE;
    this.textureHeight =
      this.gl.drawingBufferHeight >> this.config.TEXTURE_DOWNSAMPLE;

    const texType = this.ext.halfFloatTexType;
    const rgba = this.ext.formatRGBA;
    const rg = this.ext.formatRG;
    const r = this.ext.formatR;

    this.density = createDoubleFramebuffer(
      this.gl,
      2,
      this.textureWidth,
      this.textureHeight,
      rgba.internalFormat,
      rgba.format,
      texType,
      this.ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST
    );

    this.velocity = createDoubleFramebuffer(
      this.gl,
      0,
      this.textureWidth,
      this.textureHeight,
      rg.internalFormat,
      rg.format,
      texType,
      this.ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST
    );

    this.divergence = createFramebuffer(
      this.gl,
      4,
      this.textureWidth,
      this.textureHeight,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST
    );

    this.curl = createFramebuffer(
      this.gl,
      5,
      this.textureWidth,
      this.textureHeight,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST
    );

    this.pressure = createDoubleFramebuffer(
      this.gl,
      6,
      this.textureWidth,
      this.textureHeight,
      r.internalFormat,
      r.format,
      texType,
      this.gl.NEAREST
    );
  }

  initializeBlitFunction() {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
      this.gl.STATIC_DRAW
    );
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.gl.createBuffer());
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0, 1, 2, 0, 2, 3]),
      this.gl.STATIC_DRAW
    );
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(0);

    this.blit = (destination) => {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, destination);
      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    };
  }

  setupEventListeners() {
    // Obtém rect do canvas para cálculos de posição precisos
    const getCanvasRect = () => this.canvas.getBoundingClientRect();

    this.canvas.addEventListener("mousemove", (e) => {
      this.pointerManager.updateMousePosition(e, getCanvasRect());
    });

    this.canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        // Para touch, precisamos converter as coordenadas
        const touches = Array.from(e.targetTouches).map((touch) => ({
          ...touch,
          clientX: touch.clientX,
          clientY: touch.clientY,
        }));
        this.pointerManager.updateTouchPositions(touches, getCanvasRect());
      },
      false
    );

    this.canvas.addEventListener("mousedown", (e) => {
      this.pointerManager.handleMouseDown(e, getCanvasRect());
    });

    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.pointerManager.handleTouchStart(e.targetTouches, getCanvasRect());
    });

    window.addEventListener("mouseup", () => {
      this.pointerManager.handleMouseUp();
    });

    window.addEventListener("touchend", (e) => {
      this.pointerManager.handleTouchEnd(e.changedTouches);
    });

    // Event listeners para detectar mouse entrando/saindo do canvas
    this.canvas.addEventListener("mouseenter", () => {
      this.pointerManager.handleMouseEnter();
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.pointerManager.handleMouseLeave();
    });
  }

  resizeCanvas() {
    if (
      this.canvas.width !== this.canvas.clientWidth ||
      this.canvas.height !== this.canvas.clientHeight
    ) {
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      this.initializeFramebuffers();
    }
  }

  splat(x, y, dx, dy, color) {
    this.splatProgram.bind();
    this.gl.uniform1i(
      this.splatProgram.uniforms.uTarget,
      this.velocity.read[2]
    );
    this.gl.uniform1f(
      this.splatProgram.uniforms.aspectRatio,
      this.canvas.width / this.canvas.height
    );
    this.gl.uniform2f(
      this.splatProgram.uniforms.point,
      x / this.canvas.width,
      1.0 - y / this.canvas.height
    );
    this.gl.uniform3f(this.splatProgram.uniforms.color, dx, -dy, 1.0);
    this.gl.uniform1f(
      this.splatProgram.uniforms.radius,
      this.config.SPLAT_RADIUS
    );
    this.blit(this.velocity.write[1]);
    this.velocity.swap();

    this.gl.uniform1i(this.splatProgram.uniforms.uTarget, this.density.read[2]);
    this.gl.uniform3f(
      this.splatProgram.uniforms.color,
      color[0] * 0.3,
      color[1] * 0.3,
      color[2] * 0.3
    );
    this.blit(this.density.write[1]);
    this.density.swap();
  }

  splatWithRadius(x, y, dx, dy, color, radius = null) {
    const actualRadius = radius || this.config.SPLAT_RADIUS;

    this.splatProgram.bind();
    this.gl.uniform1i(
      this.splatProgram.uniforms.uTarget,
      this.velocity.read[2]
    );
    this.gl.uniform1f(
      this.splatProgram.uniforms.aspectRatio,
      this.canvas.width / this.canvas.height
    );
    this.gl.uniform2f(
      this.splatProgram.uniforms.point,
      x / this.canvas.width,
      1.0 - y / this.canvas.height
    );
    this.gl.uniform3f(this.splatProgram.uniforms.color, dx, -dy, 1.0);
    this.gl.uniform1f(this.splatProgram.uniforms.radius, actualRadius);
    this.blit(this.velocity.write[1]);
    this.velocity.swap();

    this.gl.uniform1i(this.splatProgram.uniforms.uTarget, this.density.read[2]);

    // Aplica cor com intensidade baseada no raio
    const colorIntensity = Math.min(
      actualRadius / this.config.SPLAT_RADIUS,
      2.0
    );
    this.gl.uniform3f(
      this.splatProgram.uniforms.color,
      color[0] * 0.3 * colorIntensity,
      color[1] * 0.3 * colorIntensity,
      color[2] * 0.3 * colorIntensity
    );
    this.blit(this.density.write[1]);
    this.density.swap();
  }

  multipleSplats(amount) {
    for (let i = 0; i < amount; i++) {
      const color = [
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10,
      ];
      const x = this.canvas.width * Math.random();
      const y = this.canvas.height * Math.random();
      const dx = 1000 * (Math.random() - 0.5);
      const dy = 1000 * (Math.random() - 0.5);
      this.splat(x, y, dx, dy, color);
    }
  }

  update() {
    this.resizeCanvas();

    const dt = Math.min((Date.now() - this.lastTime) / 1000, 0.016);
    this.lastTime = Date.now();

    this.gl.viewport(0, 0, this.textureWidth, this.textureHeight);

    if (this.splatStack.length > 0) {
      this.multipleSplats(this.splatStack.pop());
    }

    this.advectionProgram.bind();
    this.gl.uniform2f(
      this.advectionProgram.uniforms.texelSize,
      1.0 / this.textureWidth,
      1.0 / this.textureHeight
    );
    this.gl.uniform1i(
      this.advectionProgram.uniforms.uVelocity,
      this.velocity.read[2]
    );
    this.gl.uniform1i(
      this.advectionProgram.uniforms.uSource,
      this.velocity.read[2]
    );
    this.gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
    this.gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      this.config.VELOCITY_DISSIPATION
    );
    this.blit(this.velocity.write[1]);
    this.velocity.swap();

    this.gl.uniform1i(
      this.advectionProgram.uniforms.uVelocity,
      this.velocity.read[2]
    );
    this.gl.uniform1i(
      this.advectionProgram.uniforms.uSource,
      this.density.read[2]
    );
    this.gl.uniform1f(
      this.advectionProgram.uniforms.dissipation,
      this.config.DENSITY_DISSIPATION
    );
    this.blit(this.density.write[1]);
    this.density.swap();

    const movedPointers = this.pointerManager.getMovedPointers();

    // Adiciona animação automática quando não há interação
    this.pointerManager.createIdleAnimation();

    for (const pointer of movedPointers) {
      // Usa intensidade para controlar força do splat
      const intensity = pointer.intensity || 1.0;
      const adjustedDx = pointer.dx * intensity;
      const adjustedDy = pointer.dy * intensity;

      // Ajusta raio baseado na intensidade
      const radius = this.config.SPLAT_RADIUS * (0.5 + intensity * 0.5);

      this.splatWithRadius(
        pointer.x,
        pointer.y,
        adjustedDx,
        adjustedDy,
        pointer.color,
        radius
      );
    }
    this.pointerManager.resetMovedFlag();

    this.curlProgram.bind();
    this.gl.uniform2f(
      this.curlProgram.uniforms.texelSize,
      1.0 / this.textureWidth,
      1.0 / this.textureHeight
    );
    this.gl.uniform1i(
      this.curlProgram.uniforms.uVelocity,
      this.velocity.read[2]
    );
    this.blit(this.curl[1]);

    this.vorticityProgram.bind();
    this.gl.uniform2f(
      this.vorticityProgram.uniforms.texelSize,
      1.0 / this.textureWidth,
      1.0 / this.textureHeight
    );
    this.gl.uniform1i(
      this.vorticityProgram.uniforms.uVelocity,
      this.velocity.read[2]
    );
    this.gl.uniform1i(this.vorticityProgram.uniforms.uCurl, this.curl[2]);
    this.gl.uniform1f(this.vorticityProgram.uniforms.curl, this.config.CURL);
    this.gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
    this.blit(this.velocity.write[1]);
    this.velocity.swap();

    this.divergenceProgram.bind();
    this.gl.uniform2f(
      this.divergenceProgram.uniforms.texelSize,
      1.0 / this.textureWidth,
      1.0 / this.textureHeight
    );
    this.gl.uniform1i(
      this.divergenceProgram.uniforms.uVelocity,
      this.velocity.read[2]
    );
    this.blit(this.divergence[1]);

    this.clearProgram.bind();
    let pressureTexId = this.pressure.read[2];
    this.gl.activeTexture(this.gl.TEXTURE0 + pressureTexId);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.pressure.read[0]);
    this.gl.uniform1i(this.clearProgram.uniforms.uTexture, pressureTexId);
    this.gl.uniform1f(
      this.clearProgram.uniforms.value,
      this.config.PRESSURE_DISSIPATION
    );
    this.blit(this.pressure.write[1]);
    this.pressure.swap();

    this.pressureProgram.bind();
    this.gl.uniform2f(
      this.pressureProgram.uniforms.texelSize,
      1.0 / this.textureWidth,
      1.0 / this.textureHeight
    );
    this.gl.uniform1i(
      this.pressureProgram.uniforms.uDivergence,
      this.divergence[2]
    );
    pressureTexId = this.pressure.read[2];
    this.gl.uniform1i(this.pressureProgram.uniforms.uPressure, pressureTexId);
    this.gl.activeTexture(this.gl.TEXTURE0 + pressureTexId);
    for (let i = 0; i < this.config.PRESSURE_ITERATIONS; i++) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.pressure.read[0]);
      this.blit(this.pressure.write[1]);
      this.pressure.swap();
    }

    this.gradientSubtractProgram.bind();
    this.gl.uniform2f(
      this.gradientSubtractProgram.uniforms.texelSize,
      1.0 / this.textureWidth,
      1.0 / this.textureHeight
    );
    this.gl.uniform1i(
      this.gradientSubtractProgram.uniforms.uPressure,
      this.pressure.read[2]
    );
    this.gl.uniform1i(
      this.gradientSubtractProgram.uniforms.uVelocity,
      this.velocity.read[2]
    );
    this.blit(this.velocity.write[1]);
    this.velocity.swap();

    this.gl.viewport(
      0,
      0,
      this.gl.drawingBufferWidth,
      this.gl.drawingBufferHeight
    );
    this.displayProgram.bind();
    this.gl.uniform1i(
      this.displayProgram.uniforms.uTexture,
      this.density.read[2]
    );
    this.blit(null);

    requestAnimationFrame(() => this.update());
  }

  start() {
    this.multipleSplats(parseInt(Math.random() * 20) + 5);
    this.update();
  }
}
