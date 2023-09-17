const toSortedByXWithId = dots => dots.map(([x, y], i) => [x, y, i]).sort((a, b) => a[0] - b[0])
const toOldIds = (triangles, dotsWithId) => triangles.map(t => t.map(i => dotsWithId[i][2]))  

class DListNode {
    constructor (data) {
        this.next = null
        this.prev = null
        this.data = data
    }

    static circle (arr) {
        arr = arr.map(x => new DListNode(x))
        for(let i = 0; i < arr.length; i++) {
            arr[i].next = arr[(i+1)%arr.length]
            arr[i].prev = arr[(i + arr.length - 1)%arr.length]
        }
        return arr[0]
    }

    find (val, checked = new Set()) {
        if (checked.has(this)) return null
        checked.add(this)

        if (this.data === val) return this
        
        if (this.next) {
            const res = this.next.find(val, checked)
            if (res) return res
        }

        if (this.prev) {
            const res = this.prev.find(val, checked)
            if (res) return res
        }

        return null
    }

    toArray () {
        let checked = new Set()
        let nexts = []
        let currNext = this
        while(currNext && !checked.has(currNext)) {
            checked.add(currNext)
            nexts.push(currNext.data)
            currNext = currNext.next
        }

        let prevs = []
        let currPrev = this.prev
        while(currPrev && !checked.has(currPrev)) {
            checked.add(currPrev)
            prevs.unshift(currPrev)
            currPrev = currPrev.prev
        }

        return [...prevs, ...nexts]
    }

}

function getCircle(a, b, c) {
    var A = b[0] - a[0];
    var B = b[1] - a[1];
    var C = c[0] - a[0];
    var D = c[1] - a[1];
    var E = A * (a[0] + b[0]) + B * (a[1] + b[1]);
    var F = C * (a[0] + c[0]) + D * (a[1] + c[1]);
    var G = 2 * (A * (c[1] - b[1]) - B * (c[0] - b[0]));
    if (G == 0) {
      return []; 
    }
    const Cx = (D * E - B * F) / G;
    const Cy = (A * F - C * E) / G;
    const R = Math.sqrt(Math.pow(a[0] - Cx, 2) + Math.pow(a[1] - Cy, 2));
    return [Cx, Cy, R];
  }

const id = ([x, y]) => x > y ? `${x}:${y}` : `${y}:${x}`

const crossProd = ([vx, vy], [ux, uy]) => vx * uy - vy * ux

const vec = ([fx, fy], [tx, ty]) => [tx - fx, ty - fy]

const magn = ([x, y]) => Math.hypot(x, y)

const inTriangle = (p, other) => {
    other = other.filter(x => x[0] !== p[0] || x[1] !== p[1])
    const a = vec(other[1], other[2])
    const b = vec(other[2], other[0])
    const c = vec(other[0], other[1])

    const cpa = Math.sign(crossProd(vec(p, other[1]), a))
    const cpb = Math.sign(crossProd(vec(p, other[2]), b))
    const cpc = Math.sign(crossProd(vec(p, other[0]), c))

    return cpa === cpb && cpb === cpc
}

const triangsProcess = function* (dots, once = false) {
    if (dots.length < 3) return;
    const sorted = toSortedByXWithId(dots)
    
    const triangles = []
    const extraTriangles = []
    const byEdge = {}

    const addEdge = (i, j, index) => {
        byEdge[id([i, j])] = byEdge[id([i, j])] || new Set()
        byEdge[id([i, j])].add(index)
    }

    const addTriangle = ([i, j, k]) => {
        triangles.push([i, j, k])
        addEdge(i, j, triangles.length - 1)
        addEdge(i, k, triangles.length - 1)
        addEdge(j, k, triangles.length - 1)
    }

    addTriangle([0, 1, 2])
    
    let minHull = DListNode.circle([0, 1])
    
    const data = _ => [toOldIds(triangles.concat(extraTriangles), sorted), toOldIds([minHull.toArray()], sorted)[0]] 

    if (!once) yield data()

    const getSeenHull = i => {
        const last = minHull.find(i-1)
        let start = last
        let end = last

        while(crossProd(
            vec(sorted[i], sorted[start.data]),
            vec(sorted[start.data], sorted[start.prev.data])
        ) > 0) {
            start = start.prev
        }

        if (start === last) end = end.next
        while(crossProd(
            vec(sorted[i], sorted[end.data]),
            vec(sorted[end.next.data], sorted[end.data])
        ) > 0) {
            end = end.next
        }

        return [start, end]
    }

    const [start, end] = getSeenHull(2)
    const newNode = new DListNode(2)
    newNode.next = end
    newNode.prev = start
    newNode.next.prev = newNode
    newNode.prev.next = newNode
    minHull = newNode

    for(let i = 3; i < sorted.length; i++) {
        const [start, end] = getSeenHull(i)
        const hull = []
        for(let i = start; i !== end; i = i.next) {
            hull.push(i.data)
        }
        hull.push(end.data)

        const eadgesToFix = []

        for(let hi = 0; hi < hull.length - 1; hi++) {
            addTriangle([hull[hi], hull[hi + 1], i])
            eadgesToFix.push([hull[hi], hull[hi + 1]])
            if (!once) yield data()
        }

        while (eadgesToFix.length) {
            const curr = eadgesToFix.pop()
            const ts = [...byEdge[id(curr)]]
            if (ts.length !== 2) continue
            const [t1, t2] = ts.map(i => triangles[i])
            const t1p = t1.filter(x => !curr.includes(x))[0]
            const t2p = t2.filter(x => !curr.includes(x))[0]
            const ps = [...new Set([...t1, ...t2])].map(i => sorted[i])
            if (
                inTriangle(sorted[curr[0]], ps) ||
                inTriangle(sorted[curr[1]], ps)
            ) {
                continue
            }

            const [t1x, t1y, t1r] = getCircle(...t1.map(i => sorted[i]))
            const t2InCircle = magn(vec(sorted[t2p], [t1x, t1y])) < t1r
            if (t2InCircle) {
                const [a, b] = curr
                t1[t1.indexOf(b)] = t2p
                t2[t2.indexOf(a)] = t1p
                const at1 = byEdge[id([a, t1p])]
                const at2 = byEdge[id([a, t2p])]
                const bt1 = byEdge[id([b, t1p])]
                const bt2 = byEdge[id([b, t2p])]
                for(const set of [at1, at2, bt1, bt2]) {
                    set.delete(ts[0])
                    set.delete(ts[1])
                }

                at1.add(ts[0])
                at2.add(ts[0])

                bt1.add(ts[1])
                bt2.add(ts[1])

                delete byEdge[id([a, b])]
                addEdge(t1p, t2p, ts[0])
                addEdge(t1p, t2p, ts[1])

                eadgesToFix.push(
                    [a, t1p],
                    [a, t2p],
                    [b, t1p],
                    [b, t2p],
                )

                if (!once) yield data()
            }
        }

        const newNode = new DListNode(i)
        newNode.next = end
        newNode.prev = start
        newNode.next.prev = newNode
        newNode.prev.next = newNode
        minHull = newNode
        if (!once) yield data()
    }

    yield data()
} 

export const delaunayProcess = function*(dots, once = false) {
    if (dots.length === 0) return;
    const trianglesGen = triangsProcess(dots, once)
    let curr = trianglesGen.next()
    while(!curr.done) {
        const [triangles, hull] = curr.value
        const edges = []
        const inEdges = new Set()
    
        for(let i = 0; i < hull.length; i++) {
            const curr = hull[i]
            const next = hull[(i+1)%hull.length]
            inEdges.add(id([curr, next]))
            edges.push([curr, next, 'red'])
        }
    
        for(const [a, b, c] of triangles) {
            const newEdges = [[a, b], [b, c], [c, a]]
                .filter(([x, y]) => !inEdges.has(id([x, y])) && !inEdges.has(id([y, x])))
            edges.push(...newEdges.map(arr => [...arr]))
            newEdges.forEach(coord => inEdges.add(id(coord)))
        }
    
        yield edges
        curr = trianglesGen.next()
    }

}


export const delaunay = dots => {
    const gen = delaunayProcess(dots, true)
    return gen.next().value    
}
