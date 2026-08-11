/**
 * photoRelight — light a flat photograph with the cursor.
 *
 * Derives a fake surface normal and a depth field FROM THE PHOTOGRAPH ITSELF
 * (sobel on blurred luminance), then runs positional specular lighting against
 * it. The highlight wraps real body shapes — a car's shoulder line, a wheel
 * arch, rain beads — because it is reacting to geometry already in the picture.
 * Depth drives per-pixel parallax, so the still becomes a shallow 3D space.
 *
 * Vanilla. WebGL2. No dependencies. Drop-in.
 *
 *   import { PhotoRelight } from './photoRelight.js'
 *   const fx = new PhotoRelight(canvas, ['a.jpg','b.jpg'])
 *   fx.setProgress(0.4)   // 0..1 across the image list — crossfade + light travel
 *   fx.destroy()
 *
 * See README.md for the four gotchas that will bite you.
 */

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

const FS = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;

uniform sampler2D texA, texB;
uniform vec2  resA, resB, res;
uniform float mixAB;
uniform vec2  lightPos;     // where the light is, in screen uv (the cursor)
uniform vec2  sweepDir;     // direction the reveal travels
uniform float lightWarm;    // 0 cold .. 1 warm
uniform float intensity;
uniform vec2  parallax;
uniform float t;

float lum(vec3 c){ return dot(c, vec3(.2126,.7152,.0722)); }

vec2 cover(vec2 u, vec2 texRes){
  float ca = res.x/res.y, ia = texRes.x/texRes.y;
  vec2 s = ca > ia ? vec2(1., ia/ca) : vec2(ca/ia, 1.);
  return (u - .5) * s + .5;   // MULTIPLY. dividing gives you contain + black bars.
}

float lumB(sampler2D tex, vec2 u, vec2 texRes){
  vec2 e = 1.6 / texRes;
  float s = lum(texture(tex, u).rgb) * 2.;
  s += lum(texture(tex, u + vec2( e.x, 0.)).rgb);
  s += lum(texture(tex, u + vec2(-e.x, 0.)).rgb);
  s += lum(texture(tex, u + vec2(0.,  e.y)).rgb);
  s += lum(texture(tex, u + vec2(0., -e.y)).rgb);
  return s / 6.;
}

float depth(sampler2D tex, vec2 u, vec2 texRes){
  vec2 e = 5.0 / texRes;
  float d = lum(texture(tex, u).rgb) * 4.;
  d += lum(texture(tex, u + vec2( e.x, 0.)).rgb);
  d += lum(texture(tex, u + vec2(-e.x, 0.)).rgb);
  d += lum(texture(tex, u + vec2(0.,  e.y)).rgb);
  d += lum(texture(tex, u + vec2(0., -e.y)).rgb);
  d += lum(texture(tex, u + e*1.7).rgb);
  d += lum(texture(tex, u - e*1.7).rgb);
  d /= 10.;
  float radial = 1. - smoothstep(.15, .75, length(u - .5));
  return clamp(mix(d, radial, .35), 0., 1.);
}

vec3 normalFrom(sampler2D tex, vec2 u, vec2 texRes){
  vec2 e = 3.6 / texRes;    // wide: we want form, not grain
  float l  = lumB(tex, u + vec2(-e.x, 0.), texRes);
  float r  = lumB(tex, u + vec2( e.x, 0.), texRes);
  float d  = lumB(tex, u + vec2(0., -e.y), texRes);
  float up = lumB(tex, u + vec2(0.,  e.y), texRes);
  return normalize(vec3(-vec2(r - l, up - d) * 13.0, 1.0));
}

vec3 shade(sampler2D tex, vec2 uu, vec2 texRes){
  float ar = res.x / res.y;
  vec2 u = cover(uu, texRes);
  float dep = depth(tex, u, texRes);
  u += parallax * (dep - 0.42);

  vec3 base = texture(tex, clamp(u, 0.001, 0.999)).rgb;
  vec3 n = normalFrom(tex, clamp(u, 0.001, 0.999), texRes);

  vec2 dxy = (lightPos - uu) * vec2(ar, 1.0);
  vec3 L = normalize(vec3(dxy, 0.42));

  float spec = pow(max(dot(n, L), 0.), 9.0);
  // gloss is a BAND. "darker = glossier" makes a black background the shiniest
  // thing in frame — a void has no surface. gate both ends.
  float bl = lum(base);
  float gloss = smoothstep(.020, .075, bl) * smoothstep(.66, .07, bl);
  float falloff = exp(-length(dxy) * 1.35);
  vec3 warm = mix(vec3(.62,.74,1.0), vec3(1.0,.72,.36), lightWarm);

  vec3 col = base;
  col += spec * gloss * warm * intensity * (0.35 + 1.25*falloff);
  col += warm * exp(-length(dxy)*3.2) * 0.05 * intensity;   // soft pool: always answers
  col = pow(max(col, 0.), vec3(1.05));
  col *= 0.95 + 0.05*sin(t*.22);
  return col;
}

void main(){
  vec3 a = shade(texA, uv, resA);
  vec3 b = shade(texB, uv, resB);
  // the light performs the transition: the next frame is revealed behind a
  // sweeping front, with a glow at its leading edge. not a cross-dissolve.
  float s = clamp(dot(uv - 0.5, normalize(sweepDir)) * 0.71 + 0.5, 0., 1.);
  const float w = 0.34;
  float front = mixAB * (1.0 + 2.0*w) - w;
  float reveal = 1.0 - smoothstep(front - w, front + w, s);
  vec3 col = mix(a, b, reveal);
  float edge = reveal * (1.0 - reveal) * 4.0;
  vec3 warm = mix(vec3(.62,.74,1.0), vec3(1.0,.74,.4), lightWarm);
  col += warm * edge * 0.10 * step(0.001, mixAB) * step(mixAB, 0.999);
  o = vec4(col, 1.);
}`;

export class PhotoRelight {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {string[]} images  one or more image URLs, traversed by setProgress()
   * @param {object} [opts]
   * @param {number[]} [opts.sun]        base light angle (radians) per image
   * @param {number[]} [opts.warm]       0..1 per image
   * @param {number[]} [opts.intensity]  per image
   * @param {number} [opts.ease=0.045]   scroll settle. lower = longer glide.
   * @param {number} [opts.parallax=0.055]
   */
  constructor(canvas, images, opts = {}) {
    this.canvas = canvas;
    this.n = images.length;
    this.sun = opts.sun || images.map((_, i) => -2.4 + (4.8 * i) / Math.max(1, this.n - 1));
    this.warm = opts.warm || images.map(() => 0.6);
    this.inten = opts.intensity || images.map(() => 0.9);
    this.easeK = opts.ease ?? 0.045;
    this.parAmt = opts.parallax ?? 0.055;

    const gl = (this.gl = canvas.getContext('webgl2', { antialias: false, alpha: false }));
    if (!gl) throw new Error('PhotoRelight: WebGL2 unavailable');

    const mk = (ty, src) => {
      const s = gl.createShader(ty);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = (this.prog = gl.createProgram());
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aP = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

    const U = (k) => gl.getUniformLocation(prog, k);
    this.u = { texA:U('texA'),texB:U('texB'),resA:U('resA'),resB:U('resB'),res:U('res'),
      mixAB:U('mixAB'),lightPos:U('lightPos'),sweepDir:U('sweepDir'),lightWarm:U('lightWarm'),
      intensity:U('intensity'),parallax:U('parallax'),t:U('t') };
    gl.uniform1i(this.u.texA, 0); gl.uniform1i(this.u.texB, 1);

    const blank = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, blank);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([8, 8, 9, 255]));
    this.tex = images.map(() => ({ tex: blank, w: 1, h: 1 }));
    images.forEach((src, i) => {
      const im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = () => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.tex[i] = { tex: t, w: im.naturalWidth, h: im.naturalHeight };
      };
      im.src = src;
    });

    this.target = 0; this.eased = 0;
    this.mx = 0.5; this.my = 0.5; this.emx = 0.5; this.emy = 0.5;
    this.hover = 0; this.hoverT = 0;

    this._resize = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * d; canvas.height = canvas.clientHeight * d;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    this._move = (e) => {
      this.mx = e.clientX / innerWidth; this.my = 1 - e.clientY / innerHeight;
      this.hoverT = 1;
      clearTimeout(this._t); this._t = setTimeout(() => (this.hoverT = 0), 2200);
    };
    addEventListener('resize', this._resize);
    addEventListener('pointermove', this._move, { passive: true });
    this._resize();

    this._raf = 0;
    const lerp = (a, b, t) => a + (b - a) * t;
    const frame = (ms) => {
      this.eased = lerp(this.eased, this.target, this.easeK);
      this.emx = lerp(this.emx, this.mx, 0.09);
      this.emy = lerp(this.emy, this.my, 0.09);
      this.hover = lerp(this.hover, this.hoverT, 0.05);
      const t = ms * 0.001;

      const f = this.eased * (this.n - 1);
      const i0 = Math.floor(f), i1 = Math.min(this.n - 1, i0 + 1), m = f - i0;
      const sun = lerp(this.sun[i0], this.sun[i1], m);
      const sx = 0.5 + 0.44 * Math.cos(sun), sy = 0.5 + 0.44 * Math.sin(sun);

      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex[i0].tex);
      gl.uniform2f(this.u.resA, this.tex[i0].w, this.tex[i0].h);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tex[i1].tex);
      gl.uniform2f(this.u.resB, this.tex[i1].w, this.tex[i1].h);

      gl.uniform1f(this.u.mixAB, m);
      gl.uniform2f(this.u.res, canvas.width, canvas.height);
      gl.uniform2f(this.u.lightPos, lerp(sx, this.emx, this.hover), lerp(sy, this.emy, this.hover));
      gl.uniform2f(this.u.sweepDir, Math.cos(sun), Math.sin(sun));
      gl.uniform1f(this.u.lightWarm, lerp(this.warm[i0], this.warm[i1], m));
      gl.uniform1f(this.u.intensity, lerp(this.inten[i0], this.inten[i1], m));
      gl.uniform2f(this.u.parallax, (this.emx - 0.5) * this.parAmt, (this.emy - 0.5) * this.parAmt);
      gl.uniform1f(this.u.t, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this._raf = requestAnimationFrame(frame);
    };
    this._raf = requestAnimationFrame(frame);
  }

  /** 0..1 across the image list. Drive from scroll. */
  setProgress(v) { this.target = Math.max(0, Math.min(1, v)); }
  /** Jump without easing (deep links, tests). */
  jumpTo(v) { this.target = this.eased = Math.max(0, Math.min(1, v)); }
  /** Force the light somewhere (0..1 uv, y up). */
  setLight(x, y) { this.mx = this.emx = x; this.my = this.emy = y; this.hoverT = this.hover = 1; }

  destroy() {
    cancelAnimationFrame(this._raf);
    removeEventListener('resize', this._resize);
    removeEventListener('pointermove', this._move);
    clearTimeout(this._t);
    const gl = this.gl;
    this.tex.forEach((t) => t.tex && gl.deleteTexture(t.tex));
    gl.deleteProgram(this.prog);
  }
}
