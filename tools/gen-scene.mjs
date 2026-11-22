// Generates the M3 Expressive backdrop SVG and writes it as a TS module.
// Usage: node gen-scene.mjs <out.ts> [preview.html]
import { writeFileSync } from 'node:fs'

const N = 120 // points per polar shape, equal for all so they can morph
const f = n => (Math.round(n * 10) / 10).toString()

// ---- polar shape families (radius as a function of angle, R = 1) ----
const families = {
  circle: () => 1,
  cookie9: t => 1 + 0.075 * Math.cos(9 * t),
  cookie12: t => 1 + 0.06 * Math.cos(12 * t),
  cookie4: t => 1 + 0.1 * Math.cos(4 * t),
  sunny: t => 1 + 0.045 * Math.cos(8 * t),
  burst: t => 1 + 0.11 * Math.cos(10 * t),
  flower: t => 0.86 + 0.14 * Math.pow(Math.abs(Math.cos(4 * t)), 0.7),
  clover: t => 0.64 + 0.36 * Math.pow(Math.abs(Math.cos(2 * t)), 0.75),
  clover8: t => 0.8 + 0.2 * Math.pow(Math.abs(Math.cos(4 * t)), 0.75),
}

const polarPts = (fam, R, phase = 0) =>
  Array.from({ length: N }, (_, i) => {
    const t = (i / N) * Math.PI * 2
    const r = families[fam](t) * R
    return [r * Math.cos(t + phase), r * Math.sin(t + phase)]
  })

const ptsToPath = pts => 'M' + pts.map(([x, y]) => f(x) + ' ' + f(y)).join('L') + 'Z'
const mix = (a, b, v) => a.map(([x, y], i) => [x + (b[i][0] - x) * v, y + (b[i][1] - y) * v])

// rounded regular polygon: quadratic corners
function roundedPoly(n, R, round = 0.32, phase = -Math.PI / 2) {
  const v = Array.from({ length: n }, (_, i) => {
    const t = phase + (i / n) * Math.PI * 2
    return [R * Math.cos(t), R * Math.sin(t)]
  })
  const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
  let d = ''
  for (let i = 0; i < n; i++) {
    const p = v[(i + n - 1) % n], c = v[i], q = v[(i + 1) % n]
    const a = lerp(c, p, round), b = lerp(c, q, round)
    d += (i === 0 ? 'M' : 'L') + f(a[0]) + ' ' + f(a[1]) + 'Q' + f(c[0]) + ' ' + f(c[1]) + ' ' + f(b[0]) + ' ' + f(b[1])
  }
  return d + 'Z'
}

const pill = (w, hgt) => {
  const r = hgt / 2, x = -w / 2, y = -hgt / 2
  return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + hgt)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`
}

// arch: flat bottom with rounded corners, round top
const arch = (w, hgt) => {
  const r = w / 2, x = -w / 2, y = -hgt / 2, c = w * 0.14
  return `M${f(x)} ${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + hgt - c)}Q${f(x + w)} ${f(y + hgt)} ${f(x + w - c)} ${f(y + hgt)}H${f(x + c)}Q${f(x)} ${f(y + hgt)} ${f(x)} ${f(y + hgt - c)}Z`
}

// damped spring step 0 -> 1, sampled at its turning points
const SPRING = [0, 1.16, 0.94, 1.025, 0.992, 1]

// ---- the composition (viewBox 1600 x 1000; centre and foot kept clear) ----
// c: r y b g; float: fa fb fc; spring cycle seconds; morph: [from, to, cycle seconds, begin]
const shapes = [
  { x: 110, y: 150, c: 'b', poly: ['cookie12', 165], rot: 8, float: 'fa', fd: 64, sd: 37, morph: ['cookie12', 'flower', 46, 6] },
  { x: 1475, y: 150, c: 'y', poly: ['clover', 118, Math.PI / 4], float: 'fb', fd: 58, sd: 41, morph: ['clover', 'cookie4', 52, 19] },
  { x: 1520, y: 540, c: 'g', d: pill(250, 96), rot: -32, float: 'fc', fd: 70, sd: 33 },
  { x: 175, y: 610, c: 'r', d: roundedPoly(3, 100, 0.34), rot: 12, float: 'fb', fd: 61, sd: 44 },
  { x: 1475, y: 890, c: 'r', poly: ['cookie9', 145], float: 'fa', fd: 67, sd: 39, morph: ['cookie9', 'burst', 58, 31] },
  { x: 95, y: 905, c: 'g', poly: ['sunny', 125], float: 'fc', fd: 55, sd: 47, morph: ['sunny', 'clover8', 49, 40] },
  { x: 1290, y: 330, c: 'b', d: roundedPoly(5, 58, 0.3), rot: -10, float: 'fa', fd: 52, sd: 29 },
  { x: 345, y: 370, c: 'y', poly: ['circle', 26], float: 'fb', fd: 45, sd: 26, small: true },
  { x: 430, y: 85, c: 'b', d: pill(130, 48), rot: -24, float: 'fc', fd: 57, sd: 35, small: true },
  { x: 370, y: 985, c: 'y', poly: ['flower', 86], float: 'fa', fd: 63, sd: 43 },
  { x: 1175, y: 70, c: 'g', poly: ['clover', 46, Math.PI / 4], float: 'fb', fd: 49, sd: 31, small: true },
  { x: 1250, y: 735, c: 'r', d: roundedPoly(4, 56, 0.36), rot: 20, float: 'fc', fd: 60, sd: 38 },
  { x: 805, y: 38, c: 'b', poly: ['cookie9', 34], float: 'fa', fd: 54, sd: 34, small: true },
  { x: 1385, y: 455, c: 'y', d: arch(64, 82), rot: 9, float: 'fb', fd: 59, sd: 45, small: true },
  { x: 255, y: 250, c: 'g', d: arch(54, 70), rot: -14, float: 'fc', fd: 66, sd: 42, small: true },
]

function morphAnim([from, to, cyc, begin], R, phase = 0) {
  const A = polarPts(from, R, phase), B = polarPts(to, R, phase)
  // hold A, spring to B, hold B, spring back to A
  const go = SPRING.map(v => mix(A, B, v))
  const back = SPRING.map(v => mix(B, A, v))
  const springSpan = 1.8 / cyc
  const t0 = 0.12, t1 = 0.6
  const step = springSpan / (SPRING.length - 1)
  const values = [A, ...go, ...back, A].map(ptsToPath)
  const times = [0, ...go.map((_, i) => t0 + i * step), ...back.map((_, i) => t1 + i * step), 1]
  const ease = '0.45 0 0.55 1'
  const splines = times.slice(1).map(() => ease)
  return `<animate attributeName="d" dur="${cyc}s" begin="${begin}s" repeatCount="indefinite" calcMode="spline" keyTimes="${times.map(t => +t.toFixed(4)).join(';')}" keySplines="${splines.join(';')}" values="${values.join(';')}"/>`
}

const body = shapes
  .map((s, i) => {
    let d, anim = ''
    if (s.poly) {
      const [fam, R, ph = 0] = s.poly
      d = ptsToPath(polarPts(fam, R, ph))
      if (s.morph) anim = morphAnim(s.morph, R, ph)
    } else d = s.d
    const rot = s.rot ? ` rotate(${s.rot})` : ''
    const delay = -((i * 7.3) % s.fd).toFixed(1)
    const sdelay = -((i * 5.1) % s.sd).toFixed(1)
    return (
      `<g transform="translate(${s.x} ${s.y})${rot}">` +
      `<g class="${s.float}" style="animation-duration:${s.fd}s;animation-delay:${delay}s">` +
      `<g class="sp" style="animation-duration:${s.sd}s;animation-delay:${sdelay}s">` +
      `<path class="${s.c}${s.small ? ' sm' : ''}" d="${d}">${anim}</path></g></g></g>`
    )
  })
  .join('')

const css = `
.bg{fill:#ffffff}
.r{fill:#f2a49d}.y{fill:#f8d775}.b{fill:#a7c4f5}.g{fill:#9fd6ae}
path{opacity:.72}
.r.sm{fill:#e8574d}.y.sm{fill:#f2b81c}.b.sm{fill:#4a82e8}.g.sm{fill:#3aa65f}
path.sm{opacity:.55}
@media (prefers-color-scheme: dark){
.bg{fill:#16171b}
.r{fill:#d2625b}.y{fill:#ddb446}.b{fill:#5b87d8}.g{fill:#4c9d6a}
path{opacity:.4}
.r.sm{fill:#ee7d74}.y.sm{fill:#f5c94e}.b.sm{fill:#7aa6f2}.g.sm{fill:#63c486}
path.sm{opacity:.5}
}
.fa,.fb,.fc{animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}
.fa{animation-name:fa}.fb{animation-name:fb}.fc{animation-name:fc}
@keyframes fa{0%{transform:translate(0px,0px) rotate(0deg)}50%{transform:translate(14px,-18px) rotate(5deg)}100%{transform:translate(-10px,12px) rotate(-4deg)}}
@keyframes fb{0%{transform:translate(0px,0px) rotate(0deg)}50%{transform:translate(-16px,10px) rotate(-6deg)}100%{transform:translate(12px,16px) rotate(3deg)}}
@keyframes fc{0%{transform:translate(0px,0px) rotate(0deg)}50%{transform:translate(10px,14px) rotate(4deg)}100%{transform:translate(-14px,-8px) rotate(-5deg)}}
.sp{animation-name:sp;animation-iteration-count:infinite;animation-timing-function:ease-in-out}
@keyframes sp{0%,88%{transform:scale(1,1)}89.5%{transform:scale(1.07,0.94)}91%{transform:scale(0.96,1.04)}92.5%{transform:scale(1.02,0.985)}94%{transform:scale(0.993,1.006)}95.5%,100%{transform:scale(1,1)}}
`.trim()

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${css}</style><rect class="bg" x="-200" y="-200" width="2000" height="1400"/>${body}</svg>`

const [out, preview] = process.argv.slice(2)
writeFileSync(out, `// Generated by gen-scene.mjs; edit that, not this.\nexport const SCENE = ${JSON.stringify(svg)}\n`)
if (preview) writeFileSync(preview, `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%}svg{width:100vw;height:100vh;display:block}</style>${svg}`)
console.log('svg chars:', svg.length)
