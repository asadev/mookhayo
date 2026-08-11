"""
Generate the MOOKHAYO mark: a six-blade lens aperture.

Geometry is computed rather than hand-drawn so the blades are exactly congruent
and the same source produces the SVG (crisp at any size) and the PNG (needed for
apple-touch-icon, which cannot be SVG).

Design constraints that drove it:
  - It has to survive 16px in a browser tab. Thin strokes die there, so the
    blades are FILLED shapes with generous gaps, not outlines.
  - It sits on both light and dark tab bars, so the icon version gets a dark
    plate. The in-page version does not — it sits on the site's own void.
  - Six blades, swept — a real iris, not a hexagon. The sweep is what reads as
    "lens" rather than "hexagon" at a glance.
"""

import math, json
from PIL import Image, ImageDraw

SIZE = 64.0
C = SIZE / 2
R_OUT = 23.5     # outer radius of the blade ring — leaves air inside the plate
R_IN = 11.6      # aperture opening; too small and the mark reads as a solid ball
GAP = 3.4        # angular gap between blades, degrees
TWIST = 16.0     # blade sweep, degrees — this is what makes it an iris
BLADES = 6

def pt(angle_deg, radius, cx=C, cy=C):
    a = math.radians(angle_deg)
    return (cx + radius * math.cos(a), cy + radius * math.sin(a))

def blade_path(k):
    """SVG path for one blade, as an arc out and a straight chord back."""
    a0 = -90.0 + k * (360.0 / BLADES)
    a1, a2 = a0 + GAP, a0 + (360.0 / BLADES) - GAP
    A1, A2 = pt(a1, R_OUT), pt(a2, R_OUT)
    B2, B1 = pt(a2 - TWIST, R_IN), pt(a1 - TWIST, R_IN)
    return (
        f"M{A1[0]:.2f} {A1[1]:.2f}"
        f"A{R_OUT} {R_OUT} 0 0 1 {A2[0]:.2f} {A2[1]:.2f}"
        f"L{B2[0]:.2f} {B2[1]:.2f}"
        f"L{B1[0]:.2f} {B1[1]:.2f}Z"
    )

def blade_polygon(k, scale, cx, cy, steps=14):
    """Same blade as a point list, for PIL (which has no arc-in-polygon)."""
    a0 = -90.0 + k * (360.0 / BLADES)
    a1, a2 = a0 + GAP, a0 + (360.0 / BLADES) - GAP
    pts = []
    for i in range(steps + 1):
        a = a1 + (a2 - a1) * i / steps
        p = pt(a, R_OUT, C, C)
        pts.append((p[0] * scale + cx, p[1] * scale + cy))
    for a in (a2 - TWIST, a1 - TWIST):
        p = pt(a, R_IN, C, C)
        pts.append((p[0] * scale + cx, p[1] * scale + cy))
    return pts

PATHS = [blade_path(k) for k in range(BLADES)]

# ---- SVG (favicon: dark plate so it reads on light AND dark tab bars) -------
svg_icon = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="ember" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffb display"/>
    </linearGradient>
  </defs>
</svg>"""

svg_icon = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">\n'
    '  <defs>\n'
    '    <linearGradient id="e" x1="14" y1="10" x2="50" y2="56" gradientUnits="userSpaceOnUse">\n'
    '      <stop offset="0" stop-color="#ffb277"/>\n'
    '      <stop offset=".45" stop-color="#e9853f"/>\n'
    '      <stop offset="1" stop-color="#a8480a"/>\n'
    '    </linearGradient>\n'
    '  </defs>\n'
    '  <rect width="64" height="64" rx="14" fill="#0b0705"/>\n'
    '  <g fill="url(#e)">\n'
    + "".join(f'    <path d="{d}"/>\n' for d in PATHS)
    + '  </g>\n'
    '</svg>\n'
)

# ---- PNG (apple-touch-icon) ------------------------------------------------
def render_png(px, path, plate=True, ss=4):
    W = px * ss
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if plate:
        d.rounded_rectangle([0, 0, W - 1, W - 1], radius=int(W * 14 / 64), fill=(11, 7, 5, 255))

    # ember gradient, then mask it to the blades
    grad = Image.new("RGB", (W, W))
    gd = ImageDraw.Draw(grad)
    for y in range(W):
        for_x = y / max(W - 1, 1)
        r = int(255 + (168 - 255) * for_x)
        g = int(178 + (72 - 178) * for_x)
        b = int(119 + (10 - 119) * for_x)
        gd.line([(0, y), (W, y)], fill=(r, g, b))

    mask = Image.new("L", (W, W), 0)
    md = ImageDraw.Draw(mask)
    scale = W / SIZE
    for k in range(BLADES):
        md.polygon(blade_polygon(k, scale, 0, 0), fill=255)

    img.paste(grad, (0, 0), mask)
    img.resize((px, px), Image.LANCZOS).save(path)
    return path

import sys
root = sys.argv[1]
open(f"{root}/src/app/icon.svg", "w").write(svg_icon)
render_png(180, f"{root}/src/app/apple-icon.png", plate=True)
render_png(512, "/private/tmp/claude-501/-Users-apple-ClaudeAsad/cc245f62-92fd-4453-9985-83b214b47062/scratchpad/mark-preview.png", plate=True)
render_png(32, "/private/tmp/claude-501/-Users-apple-ClaudeAsad/cc245f62-92fd-4453-9985-83b214b47062/scratchpad/mark-32.png", plate=True)
render_png(16, "/private/tmp/claude-501/-Users-apple-ClaudeAsad/cc245f62-92fd-4453-9985-83b214b47062/scratchpad/mark-16.png", plate=True)

print(json.dumps(PATHS, indent=1))
print("\nwrote icon.svg, apple-icon.png (180), previews at 512/32/16")
