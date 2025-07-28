/** @format */

import { GridType } from "@/hooks/useGridState";

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
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + (flat ? 0 : Math.PI / 6);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
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
    const xoffset = borderWidth;
    const yoffset = borderWidth;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = c * tileSize + xoffset;
            const y = r * tileSize + yoffset;
            const color = biomeGrid[r]?.[c];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, tileSize, tileSize);
            }
            if (borderWidth > 0) {
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = borderWidth;
                ctx.strokeRect(x, y, tileSize, tileSize);
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
    const hexW = flat ? 2 * r : Math.sqrt(3) * r;
    const hexH = flat ? Math.sqrt(3) * r : 2 * r;
    const colSp = flat ? (3 / 2) * r : hexW;
    const rowSp = flat ? hexH : (3 / 2) * r;

    const xOff = borderWidth + (flat ? r : hexW / 2);
    const yOff = borderWidth + (flat ? hexH / 2 : r);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let cx = xOff + col * colSp;
            let cy = yOff + row * rowSp;
            if (flat) {
                if (col % 2 === (odd ? 1 : 0)) cy += hexH / 2;
            } else {
                if (row % 2 === (odd ? 1 : 0)) cx += hexW / 2;
            }
            drawHexagon(
                ctx,
                cx,
                cy,
                r,
                flat,
                biomeGrid[row]?.[col] || undefined,
                borderWidth,
                borderColor
            );
        }
    }
};
