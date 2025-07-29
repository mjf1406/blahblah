/** @format */

type CanvasCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function drawSquareGrid(
    ctx: CanvasCtx,
    cols: number,
    rows: number,
    tileSize: number,
    biomeGrid: (string | null)[][],
    borderWidth: number,
    borderColor: string
) {
    // Draw border background if needed
    if (borderWidth > 0) {
        const { width, height } = calculateSquareGridDimensions(
            cols,
            rows,
            tileSize,
            borderWidth
        );
        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, width, height);
    }

    // Draw tiles
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const color = biomeGrid[r]?.[c];
            if (color) {
                const x = c * (tileSize + borderWidth) + borderWidth;
                const y = r * (tileSize + borderWidth) + borderWidth;
                ctx.fillStyle = color;
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
    }
}

export function calculateSquareGridDimensions(
    cols: number,
    rows: number,
    tileSize: number,
    borderWidth: number
): { width: number; height: number } {
    const width = cols * (tileSize + borderWidth) + borderWidth;
    const height = rows * (tileSize + borderWidth) + borderWidth;

    return { width: Math.ceil(width), height: Math.ceil(height) };
}
