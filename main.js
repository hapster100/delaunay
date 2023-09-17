import { delaunay, delaunayProcess } from './delaunay'
import './style.css'
import { CanvasCoordTransform } from './utils'

const CANVAS_ID = 'app'

const TIMEOUT_MS = {
  HARE: 100,
  TURTLE: 500,
  ROCKET: 20,
}

const dots = []

function addDot(x, y) {
  dots.push([x, y])
}

function getCanvas () {
  return document.querySelector('canvas#' + CANVAS_ID)
}

function getContext () {
  return getCanvas().getContext('2d')
}

function clear (style = 'black') {
  const ctx = getContext()
  ctx.save()
  ctx.style = style
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
}

function dot (canvasX, canvasY, style = 'white') {
  const ctx = getContext()
  ctx.save()

  ctx.fillStyle = style
  ctx.beginPath()
  ctx.arc(canvasX, canvasY, 4, 0, Math.PI*2)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function edge (ax, ay, bx, by, style = 'yellow') {
  const ctx = getContext()
  ctx.save()
  ctx.strokeStyle = style
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.lineTo(bx, by)
  ctx.closePath()
  ctx.stroke()
  ctx.restore()
}

function setupCanvas () {
  const canvas = getCanvas()
  canvas.height = document.body.clientHeight / 1.5
  canvas.width = document.body.clientWidth / 1.5
  clear()
}

let timeoutMs = null
let lastDraw = null
async function draw() {
  let currentDraw = lastDraw = Date.now();
  try {
    clear()
    for(const d of dots) {
      dot(...d)
    }
    for(const edges of delaunayProcess(dots)) {
      if (currentDraw !== lastDraw) break
      clear()
      for(const [ai, bi, style] of edges) {
        edge(...dots[ai], ...dots[bi], style)
      }
      for(const d of dots) {
        dot(...d)
      }
      await new Promise((res) => setTimeout(res, timeoutMs))
    }
  } catch (e) {
    console.error(e)
  }
}

getCanvas().addEventListener('click', (e) => {
  const {clientX, clientY} = e
  const tr = new CanvasCoordTransform(getCanvas())
  addDot(...tr.toCanvas(clientX, clientY))
  draw()
})

document.getElementById('clean-btn').addEventListener('click', () => {
  dots.length = 0
  draw()
})

document.getElementById('repeat-btn').addEventListener('click', () => {
  draw()
})

const speedBtns = [
  ['hare-btn', () => timeoutMs = TIMEOUT_MS.HARE],
  ['rocket-btn', () => timeoutMs = TIMEOUT_MS.ROCKET],
  ['turtle-btn', () => timeoutMs = TIMEOUT_MS.TURTLE],
]

const applySpeed = (id, set) => {
  set()
  for(const btn of speedBtns.map(([id]) => document.getElementById(id))) {
    btn.classList.remove('active')
  }
  document.getElementById(id).classList.add('active')
}

for (const [id, set] of speedBtns) {
  document.getElementById(id).addEventListener('click', () => {
    applySpeed(id, set)
  })
}


setupCanvas()
applySpeed(...speedBtns[0])
draw()
