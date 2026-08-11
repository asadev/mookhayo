# photoRelight

Light a **flat photograph** with the cursor. The highlight wraps real shapes in the
picture — a car's shoulder line, a wheel arch, rain beads on a door — because it's
lighting a surface normal derived from the photo itself, not sliding a gradient over it.
Depth (also derived from the photo) drives per-pixel parallax, so a still becomes a
shallow 3D space. Crossfades between images are performed **by the light**: a sweeping
front with a glow at its leading edge, not a dissolve.

Built for a luxury car site, where dark glossy paint is the whole point. It works on
anything with a lit subject against a darker ground: cars, product shots, portraits,
interiors, jewellery.

![what it does] on a black car at night: point at the roof, the roofline catches.

## Use

```js
import { PhotoRelight } from './photoRelight.js';

const fx = new PhotoRelight(canvas, [
  'img/0.jpg', 'img/1.jpg', 'img/2.jpg'
], {
  sun:       [-2.55, -1.05, 2.35],  // base light angle per image (radians)
  warm:      [0.15, 0.78, 0.35],    // 0 cold moonlight .. 1 warm sodium
  intensity: [0.6, 0.75, 0.8],
  ease:      0.045,                 // scroll settle. lower = longer glide.
});

addEventListener('scroll', () => {
  fx.setProgress(scrollY / (document.body.scrollHeight - innerHeight));
}, { passive: true });
```

Canvas should be `position:fixed; inset:0` with the content scrolling above it.

**API** — `setProgress(0..1)` (eased), `jumpTo(0..1)` (instant), `setLight(x,y)`
(force the light, uv coords, y up), `destroy()`.

## Dependencies

None. Vanilla ES module, WebGL2, single fullscreen triangle. ~1 draw call.

## The four gotchas (each of these cost real debugging)

**1. Cover-fit must MULTIPLY, not divide.**
`(uv-0.5) * s + 0.5` is cover. `(uv-0.5) / s + 0.5` is *contain* — you get black bars.
It hides when the canvas and image aspects nearly match, then appears on a phone.

**2. Gloss must be a BAND, not a ramp.**
"Darker = glossier" is intuitive and wrong: it makes a black background the shiniest
surface in the frame. A void has no surface. Gate both ends:
`smoothstep(.02,.075,l) * smoothstep(.66,.07,l)`.

**3. Normals from photos need a wide sobel + a pre-blur.**
Luminance gradients in a photo are tiny, so the normal strength has to be high (~13) —
which also amplifies JPEG noise in dark paint into crumpled-foil specular. Fix: blur
luminance first (`lumB`) and sample the sobel wide (~3.6px). If you tighten the
specular exponent instead, the highlight simply never fires: with a weak normal,
`n ≈ (0,0,1)`, `dot(n,L) ≈ 0.5`, and `pow(0.5, 34) ≈ 0`.

**4. Dither dark source images before saving them as JPEG.**
A near-flat dark gradient is exactly what JPEG shatters into 8×8 blocks — and this
shader *lights those blocks* (a hex grid appears in the sky). Add ~2.4σ gaussian noise
to dark plates and save at `quality=97, subsampling=0`. Or use PNG.

## Also worth knowing

- Pairs well with a background-removal pass. Free stock photos have terrible
  backgrounds; lifting the subject onto a seamless sweep (macOS Vision
  `VNGenerateForegroundInstanceMaskRequest` does this natively and offline) gives the
  relight something clean to work on.
- Drive **all** motion from the rAF loop, not CSS transitions — one eased value moving
  everything can't desync, and CSS transitions don't tick in some headless/preview
  environments.
- It is a *lighting* effect, not a *relighting* one: it adds specular to what's there.
  It can't move an existing shadow. Shoot/choose photos already lit roughly the way you
  want, and use this to make them respond.
