/** @format */

import { GridType } from "@/hooks/useGridState";

type CanvasCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const vertexCache = new Map<string, { x: number; y: number }[]>();

export const drawHexagon = (
    ctx: CanvasCtx,
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
    vertices.forEach((v, i) => {
        const x = cx + v.x;
        const y = cy + v.y;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
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
    ctx: CanvasCtx,
    cols: number,
    rows: number,
    tileSize: number,
    biomeGrid: (string | null)[][],
    borderWidth: number,
    borderColor: string
) => {
    if (borderWidth > 0) {
        const totalWidth = cols * (tileSize + borderWidth) + borderWidth;
        const totalHeight = rows * (tileSize + borderWidth) + borderWidth;
        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, totalWidth, totalHeight);
    }

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

// Path2D caching
const hexPathCache = new Map<string, Path2D>();

function makeHexPath(r: number, flat: boolean): Path2D {
    const p = new Path2D();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + (flat ? 0 : Math.PI / 6);
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
    }
    p.closePath();
    return p;
}

export function getHexPath(r: number, flat: boolean): Path2D {
    const key = `${r}_${flat}`;
    if (!hexPathCache.has(key)) {
        hexPathCache.set(key, makeHexPath(r, flat));
    }
    return hexPathCache.get(key)!;
}

export function drawHexagonPath2D(
    ctx: CanvasCtx,
    cx: number,
    cy: number,
    r: number,
    flat: boolean,
    fillColor: string
) {
    const path = getHexPath(r, flat);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = fillColor;
    ctx.fill(path);
    ctx.restore();
}

// OffscreenCanvas -> ImageBitmap caching
const hexBitmapCache = new Map<string, ImageBitmap>();

function makeHexBitmap(r: number, flat: boolean, color: string): ImageBitmap {
    const w = flat ? 2 * r : Math.sqrt(3) * r;
    const h = flat ? Math.sqrt(3) * r : 2 * r;
    const off = new OffscreenCanvas(w, h);
    const offCtx = off.getContext("2d")!;
    drawHexagon(offCtx, w / 2, h / 2, r, flat, color, 0);
    return off.transferToImageBitmap();
}

export function getHexBitmap(
    r: number,
    flat: boolean,
    color: string
): ImageBitmap {
    const key = `${r}_${flat}_${color}`;
    if (!hexBitmapCache.has(key)) {
        hexBitmapCache.set(key, makeHexBitmap(r, flat, color));
    }
    return hexBitmapCache.get(key)!;
}

export function drawHexagonBitmap(
    ctx: CanvasCtx,
    cx: number,
    cy: number,
    r: number,
    flat: boolean,
    color: string
) {
    const bmp = getHexBitmap(r, flat, color);
    const dx = cx - bmp.width / 2;
    const dy = cy - bmp.height / 2;
    ctx.drawImage(bmp, dx, dy);
}

export const drawHexGrid = (
    ctx: CanvasCtx,
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
    const s = tileSize;               // s = tileSize
// Then the radius from center to vertex is:
const r = s / Math.sqrt(3);                 // r = s / √3
const d = 2 * r;                             // diameter = 2r
const a = r;                                 // same as r
const tSquared = a * a - (s / 2) * (s / 2);  // same calculation for t
const t = Math.sqrt(tSquared);

    const hexW = flat ? d : s;
    const hexH = flat ? s : d;
    const colSp = flat ? (3 / 2) * r : hexW;
    const rowSp = flat ? hexH : (3 / 2) * r;

    const xOff = borderWidth + (flat ? r : hexW / 2);
    const yOff = borderWidth + (flat ? hexH / 2 : r);

    if (borderWidth > 0) {
        let totalWidth: number;
        let totalHeight: number;
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

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const color = biomeGrid[row]?.[col];
            if (!color) continue;

            let cx = xOff + col * colSp;
            let cy = yOff + row * rowSp;
            if (flat) {
                if (col % 2 === (odd ? 1 : 0)) cy += hexH / 2;
            } else {
                if (row % 2 === (odd ? 1 : 0)) cx += hexW / 2;
            }

            drawHexagonPath2D(ctx, cx, cy, r - borderWidth / 2, flat, color);
            // or use bitmap:
            // drawHexagonBitmap(ctx, cx, cy, r - borderWidth / 2, flat, color);
        }
    }
};
