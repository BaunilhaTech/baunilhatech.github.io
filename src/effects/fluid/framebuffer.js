export function createFramebuffer(
  gl,
  textureId,
  width,
  height,
  internalFormat,
  format,
  type,
  filterParameter
) {
  gl.activeTexture(gl.TEXTURE0 + textureId);

  const texture = createTexture(
    gl,
    width,
    height,
    internalFormat,
    format,
    type,
    filterParameter
  );
  const framebuffer = createFramebufferObject(gl, texture, width, height);

  return [texture, framebuffer, textureId];
}

export function createDoubleFramebuffer(
  gl,
  textureId,
  width,
  height,
  internalFormat,
  format,
  type,
  filterParameter
) {
  let framebuffer1 = createFramebuffer(
    gl,
    textureId,
    width,
    height,
    internalFormat,
    format,
    type,
    filterParameter
  );
  let framebuffer2 = createFramebuffer(
    gl,
    textureId + 1,
    width,
    height,
    internalFormat,
    format,
    type,
    filterParameter
  );

  return {
    get read() {
      return framebuffer1;
    },
    get write() {
      return framebuffer2;
    },
    swap() {
      const temp = framebuffer1;
      framebuffer1 = framebuffer2;
      framebuffer2 = temp;
    },
  };
}

function createTexture(
  gl,
  width,
  height,
  internalFormat,
  format,
  type,
  filterParameter
) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterParameter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterParameter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    internalFormat,
    width,
    height,
    0,
    format,
    type,
    null
  );

  return texture;
}

function createFramebufferObject(gl, texture, width, height) {
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );
  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return framebuffer;
}
