export class GLProgram {
  constructor(gl, vertexShader, fragmentShader) {
    this.gl = gl;
    this.uniforms = {};
    this.program = this.createProgram(vertexShader, fragmentShader);
    this.extractUniforms();
  }

  createProgram(vertexShader, fragmentShader) {
    const program = this.gl.createProgram();

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error(this.gl.getProgramInfoLog(program));
    }

    return program;
  }

  extractUniforms() {
    const uniformCount = this.gl.getProgramParameter(
      this.program,
      this.gl.ACTIVE_UNIFORMS
    );

    for (let i = 0; i < uniformCount; i++) {
      const uniformName = this.gl.getActiveUniform(this.program, i).name;
      this.uniforms[uniformName] = this.gl.getUniformLocation(
        this.program,
        uniformName
      );
    }
  }

  bind() {
    this.gl.useProgram(this.program);
  }
}

export function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }

  return shader;
}
