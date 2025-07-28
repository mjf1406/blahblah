/** @format */

import { GridType } from "@/hooks/useGridState";

const vertexCache = new Map();

export const drawHexagon = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    flat: boolean,
    fillColor?: string,
    borderWidth = 1,
    borderColor = "#000"
) => {
    const cacheKey = `${r}_${flat}`;
    let vertices = vertexCache.get(cacheKey);

    if (!vertices) {
        vertices = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + (flat ? 0 : Math.PI / 6);
            vertices.push({
                x: r * Math.cos(angle),
                y: r * Math.sin(angle),
            });
        }
        vertexCache.set(cacheKey, vertices);
    }

    ctx.beginPath();
    vertices.forEach((vertex: { x: number; y: number }, i: number) => {
        const x = cx + vertex.x;
        const y = cy + vertex.y;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.closePath();

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    if (borderWidth > 0) {
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;
        ctx.stroke();
    }
};

export const drawSquareGrid = (
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    tileSize: number,
    biomeGrid: (string | null)[][],
    borderWidth: number,
    borderColor: string
) => {
    if (borderWidth > 0) {
        // Fill entire canvas area with border color as background
        const totalWidth = cols * (tileSize + borderWidth) + borderWidth;
        const totalHeight = rows * (tileSize + borderWidth) + borderWidth;

        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, totalWidth, totalHeight);
    }

    // Draw tiles with spacing (no individual strokes needed)
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
};

export const drawHexGrid = (
    ctx: CanvasRenderingContext2D,
    gridType: GridType,
    cols: number,
    rows: number,
    tileSize: number,
    biomeGrid: (string | null)[][],
    borderWidth: number,
    borderColor: string
) => {
    const flat = gridType.startsWith("hex-flat");
    const odd = gridType.endsWith("odd");
    const r = tileSize / 2;
    const d = 2 * r;
    const s = Math.sqrt(3) * r;
    const a = r;
    const tSquared = Math.pow(a, 2) - Math.pow(s / 2, 2);
    const t = Math.sqrt(tSquared);

    const hexW = flat ? 2 * r : Math.sqrt(3) * r;
    const hexH = flat ? Math.sqrt(3) * r : 2 * r;
    const colSp = flat ? (3 / 2) * r : hexW;
    const rowSp = flat ? hexH : (3 / 2) * r;

    const xOff = borderWidth + (flat ? r : hexW / 2);
    const yOff = borderWidth + (flat ? hexH / 2 : r);

    if (borderWidth > 0) {
        // Use the same dimension calculation as calculateGridDimensions
        let totalWidth, totalHeight;

        if (flat) {
            totalWidth = borderWidth * 2 + (d - t) * cols - t + d / 2;
            totalHeight = borderWidth * 2 + s * rows + s / 2;
        } else {
            totalWidth = borderWidth * 2 + s * cols + s / 2;
            totalHeight = borderWidth * 2 + (d - t) * rows - t + d / 2;
        }

        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, totalWidth, totalHeight);
    }

    // Draw hexagons without borders (background provides separation)
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const color = biomeGrid[row]?.[col];
            if (color) {
                let cx = xOff + col * colSp;
                let cy = yOff + row * rowSp;

                if (flat) {
                    if (col % 2 === (odd ? 1 : 0)) cy += hexH / 2;
                } else {
                    if (row % 2 === (odd ? 1 : 0)) cx += hexW / 2;
                }

                drawHexagon(ctx, cx, cy, r - borderWidth / 2, flat, color, 0);
            }
        }
    }
};
