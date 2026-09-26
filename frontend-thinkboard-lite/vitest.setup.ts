// jsdom (the "unit" project) has no real 2D canvas context: HTMLCanvasElement.getContext('2d') returns
// null. Konva touches a canvas context even to construct a bare Shape (a hit-testing colour lookup), so
// any Konva-based leaf (highlight-layer, and later marquee/ink-pad) needs this stub to unit-test at all.
// The "stories" project runs in real headless Chrome and needs none of this.
class FakeCanvasRenderingContext2D {
  fillStyle = "#000"
  strokeStyle = "#000"
  lineWidth = 1
  lineCap: CanvasLineCap = "butt"
  lineJoin: CanvasLineJoin = "miter"
  globalAlpha = 1
  font = "10px sans-serif"
  textAlign: CanvasTextAlign = "start"
  textBaseline: CanvasTextBaseline = "alphabetic"
  imageSmoothingEnabled = true

  clearRect() {}
  fillRect() {}
  strokeRect() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  arcTo() {}
  rect() {}
  fill() {}
  stroke() {}
  clip() {}
  save() {}
  restore() {}
  translate() {}
  scale() {}
  rotate() {}
  transform() {}
  setTransform() {}
  resetTransform() {}
  drawImage() {}
  quadraticCurveTo() {}
  bezierCurveTo() {}
  setLineDash() {}
  getLineDash() {
    return []
  }
  isPointInPath() {
    return false
  }
  createLinearGradient() {
    return { addColorStop() {} }
  }
  createRadialGradient() {
    return { addColorStop() {} }
  }
  createPattern() {
    return {}
  }
  measureText() {
    return { width: 0 }
  }
  fillText() {}
  strokeText() {}
  // Reports a solid #282828 fill, matching what Konva's own farbling probe writes then reads back —
  // so it always concludes the canvas is not fingerprint-farbled and takes its simpler code path.
  getImageData(_x: number, _y: number, w: number, h: number) {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 40
      data[i + 1] = 40
      data[i + 2] = 40
      data[i + 3] = 255
    }
    return { data, width: w, height: h, colorSpace: "srgb" as PredefinedColorSpace }
  }
  putImageData() {}
  createImageData() {
    return { data: new Uint8ClampedArray(4), width: 1, height: 1, colorSpace: "srgb" as PredefinedColorSpace }
  }
}

const fakeContext = new FakeCanvasRenderingContext2D()
// The "unit" project also runs Node-environment tests (e.g. sync-engine.live.test.ts) that have no DOM at all.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = ((type: string) => (type === "2d" ? fakeContext : null)) as typeof HTMLCanvasElement.prototype.getContext
}

// Motion (reduced motion) and next-themes (colour scheme) ask the browser for a media query; jsdom has no
// matchMedia, so provide the smallest stand-in. It reports "no match" — light theme, no reduced motion.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false
    },
  })) as unknown as typeof window.matchMedia
}
