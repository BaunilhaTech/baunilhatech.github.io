export function getWebGLContext(canvas) {
  const contextParameters = {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
  };

  const webglContext =
    getWebGL2Context(canvas, contextParameters) ||
    getWebGL1Context(canvas, contextParameters);

  if (!webglContext) {
    throw new Error("WebGL not supported");
  }

  return webglContext;
}

function getWebGL2Context(canvas, parameters) {
  const gl = canvas.getContext("webgl2", parameters);

  if (!gl) {
    return null;
  }

  const extensions = setupWebGL2Extensions(gl);
  const formats = getWebGL2Formats(gl, extensions.halfFloatTexType);

  return createContextObject(gl, extensions, formats);
}

function getWebGL1Context(canvas, parameters) {
  const gl =
    canvas.getContext("webgl", parameters) ||
    canvas.getContext("experimental-webgl", parameters);

  if (!gl) {
    return null;
  }

  const extensions = setupWebGLExtensions(gl);
  const formats = getWebGLFormats(gl, extensions.halfFloatTexType);

  return createContextObject(gl, extensions, formats);
}

function setupWebGL2Extensions(gl) {
  gl.getExtension("EXT_color_buffer_float");
  const supportLinearFiltering = gl.getExtension("OES_texture_float_linear");

  return {
    halfFloatTexType: gl.HALF_FLOAT,
    supportLinearFiltering,
  };
}

function setupWebGLExtensions(gl) {
  const halfFloat = gl.getExtension("OES_texture_half_float");
  const supportLinearFiltering = gl.getExtension(
    "OES_texture_half_float_linear"
  );

  return {
    halfFloatTexType: halfFloat.HALF_FLOAT_OES,
    supportLinearFiltering,
  };
}

function getWebGL2Formats(gl, halfFloatTexType) {
  const formatRGBA = getSupportedFormat(
    gl,
    gl.RGBA16F,
    gl.RGBA,
    halfFloatTexType
  );
  const formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
  const formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);

  return { formatRGBA, formatRG, formatR };
}

function getWebGLFormats(gl, halfFloatTexType) {
  const formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
  const formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
  const formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);

  return { formatRGBA, formatRG, formatR };
}

function createContextObject(gl, extensions, formats) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  return {
    gl,
    ext: {
      ...formats,
      ...extensions,
    },
  };
}

function getSupportedFormat(gl, internalFormat, format, type) {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    return getFallbackFormat(gl, internalFormat, type);
  }

  return { internalFormat, format };
}

function getFallbackFormat(gl, internalFormat, type) {
  const fallbacks = {
    [gl.R16F]: () => getSupportedFormat(gl, gl.RG16F, gl.RG, type),
    [gl.RG16F]: () => getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type),
  };

  const fallback = fallbacks[internalFormat];
  return fallback ? fallback() : null;
}

function supportRenderTextureFormat(gl, internalFormat, format, type) {
  const texture = createTestTexture(gl, internalFormat, format, type);
  const framebuffer = createTestFramebuffer(gl, texture);

  const isSupported =
    gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;

  // Cleanup
  gl.deleteTexture(texture);
  gl.deleteFramebuffer(framebuffer);

  return isSupported;
}

function createTestTexture(gl, internalFormat, format, type) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

  return texture;
}

function createTestFramebuffer(gl, texture) {
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  return framebuffer;
}
