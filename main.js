import { delaunay, delaunayProcess } from './delaunay'
import './style.css'
import { CanvasCoordTransform } from './utils'

const CANVAS_ID = 'app'

const dots = [
  [100, 300],
  [200, 400],
  [270, 200],
  [300, 100],
  [330, 500],
  [400, 300],
  [450, 500],
  [500, 200],
  [570, 300],
]

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

async function draw() {
  try {
    for(const edges of delaunayProcess(dots)) {
      clear()
      for(const [ai, bi, style] of edges) {
        edge(...dots[ai], ...dots[bi], style)
      }
      for(const d of dots) {
        dot(...d)
      }
      await new Promise((res) => setTimeout(res, 300))
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

setupCanvas()
draw()
