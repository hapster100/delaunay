export class CanvasCoordTransform {
    constructor(canvas) {
        this.canvas = canvas
    }

    toClient (canvasX, canvasY) {
        throw new Error('TODO')
    }

    toCanvas (clientX, clientY) {
        const {x, y, height, width} = this.canvas.getBoundingClientRect()
        
        const scaleX = this.canvas.width / width
        const scaleY = this.canvas.height / height

        clientX -= x
        clientY -= y
        clientX *= scaleX
        clientY *= scaleY

        return [clientX, clientY]
    }
}

