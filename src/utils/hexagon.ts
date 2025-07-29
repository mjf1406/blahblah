/** @format */

import { GridType } from "@/hooks/useGridState";

export interface HexagonProperties {
    // https://www.omnicalculator.com/math/hexagon
    // https://uploads-cdn.omnicalculator.com/images/geometry/area/hexagon-calc-r2.svg?width=425&enlarge=0&format=webp
    // t is the distance from the nearest vertex to s perpendicularly.
    r: number;
    s: number;
    d: number;
    a: number;
    R: number;
    t: number;
}

export function getHexagonProperties(tileSize: number): HexagonProperties {
    const d = tileSize; // long diagonal
    const R = d / 2; // circumradius
    const a = R; // edge length
    const r = (a * Math.sqrt(3)) / 2; // apothem
    const s = a * Math.sqrt(3); // short diagonal
    const t = Math.sqrt(a * a - (s / 2) * (s / 2));

    return {
        r,
        s,
        d,
        a,
        R,
        t,
    };
}

type CanvasCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const vertexCache = new Map<string, { x: number; y: number }[]>();
const hexPathCache = new Map<string, Path2D>();

function getHexVertices(R: number, flat: boolean): { x: number; y: number }[] {
    const cacheKey = `${R}_${flat}`;
    let vertices = vertexCache.get(cacheKey);

    if (!vertices) {
        vertices = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + (flat ? 0 : Math.PI / 6);
            vertices.push({
                x: R * Math.cos(angle),
                y: R * Math.sin(angle),
            });
        }
        vertexCache.set(cacheKey, vertices);
    }

    return vertices;
}

function makeHexPath(R: number, flat: boolean): Path2D {
    const vertices = getHexVertices(R, flat);
    const path = new Path2D();

    vertices.forEach((v, i) => {
        if (i === 0) path.moveTo(v.x, v.y);
        else path.lineTo(v.x, v.y);
    });
    path.closePath();

    return path;
}

export function getHexPath(R: number, flat: boolean): Path2D {
    const key = `${R}_${flat}`;
    if (!hexPathCache.has(key)) {
        hexPathCache.set(key, makeHexPath(R, flat));
    }
    return hexPathCache.get(key)!;
}

export function drawHexagon(
    ctx: CanvasCtx,
    cx: number,
    cy: number,
    R: number,
    flat: boolean,
    fillColor?: string,
    borderWidth = 1,
    borderColor = "#000"
) {
    const vertices = getHexVertices(R, flat);

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
}

export function drawHexagonOptimized(
    ctx: CanvasCtx,
    cx: number,
    cy: number,
    R: number,
    flat: boolean,
    fillColor: string
) {
    const path = getHexPath(R, flat);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = fillColor;
    ctx.fill(path);
    ctx.restore();
}

function calculateHexLayout(
    cols: number,
    rows: number,
    tileSize: number,
    flat: boolean,
    borderWidth: number,
    odd: boolean,
    biomeGrid?: (string | null)[][]
) {
    const { r, R } = getHexagonProperties(tileSize);

    // Calculate spacing between hex centers
    let horizontalSpacing: number;
    let verticalSpacing: number;
    let alternatingOffsetX: number;
    let alternatingOffsetY: number;

    if (flat) {
        horizontalSpacing = (3 * R) / 2 + borderWidth;
        verticalSpacing = 2 * r + borderWidth;
        alternatingOffsetX = 0;
        alternatingOffsetY = r + borderWidth / 2;
    } else {
        horizontalSpacing = 2 * r + borderWidth;
        verticalSpacing = (3 * R) / 2 + borderWidth;
        alternatingOffsetX = r + borderWidth / 2;
        alternatingOffsetY = 0;
    }

    // Calculate hexagon positions
    const positions: { x: number; y: number; row: number; col: number }[] = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Skip if biomeGrid is provided and this cell is empty
            if (biomeGrid && !biomeGrid[row]?.[col]) continue;

            let cx = col * horizontalSpacing;
            let cy = row * verticalSpacing;

            // Apply offset for alternating rows/columns
            if (flat) {
                if (col % 2 === (odd ? 1 : 0)) {
                    cy += alternatingOffsetY;
                }
            } else {
                if (row % 2 === (odd ? 1 : 0)) {
                    cx += alternatingOffsetX;
                }
            }

            positions.push({ x: cx, y: cy, row, col });
        }
    }

    // Find bounds
    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y));

    // Calculate the actual hexagon extents based on orientation
    const widthRadius = flat ? R : r;
    const heightRadius = flat ? r : R;

    return {
        positions,
        bounds: { minX, maxX, minY, maxY },
        spacing: { horizontalSpacing, verticalSpacing },
        hexRadius: R,
        widthRadius,
        heightRadius,
    };
}

export function drawHexGrid(
    ctx: CanvasCtx,
    gridType: GridType,
    cols: number,
    rows: number,
    tileSize: number,
    biomeGrid: (string | null)[][],
    borderWidth: number,
    borderColor: string
) {
    const flat = gridType.startsWith("hex-flat");
    const odd = gridType.endsWith("odd");

    const layout = calculateHexLayout(
        cols,
        rows,
        tileSize,
        flat,
        borderWidth,
        odd,
        biomeGrid
    );
    const { positions, bounds, spacing, hexRadius, widthRadius, heightRadius } =
        layout;

    // Calculate offset to ensure proper borders
    const offsetX = borderWidth + widthRadius - bounds.minX;
    const offsetY = borderWidth + heightRadius - bounds.minY;

    // Draw background if border width > 0
    if (borderWidth > 0) {
        const width = Math.ceil(
            bounds.maxX - bounds.minX + 2 * widthRadius + 2 * borderWidth
        );
        const height = Math.ceil(
            bounds.maxY - bounds.minY + 2 * heightRadius + 2 * borderWidth
        );
        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, width, height);
    }

    // Draw hexagons
    for (const pos of positions) {
        const color = biomeGrid[pos.row]?.[pos.col];
        if (!color) continue;

        const cx = offsetX + pos.x;
        const cy = offsetY + pos.y;
        drawHexagonOptimized(ctx, cx, cy, hexRadius, flat, color);
    }
}

export function calculateHexGridDimensions(
    cols: number,
    rows: number,
    tileSize: number,
    flat: boolean,
    borderWidth: number,
    odd: boolean = false
): { width: number; height: number } {
    const layout = calculateHexLayout(
        cols,
        rows,
        tileSize,
        flat,
        borderWidth,
        odd
    );
    const { bounds, widthRadius, heightRadius } = layout;

    const width = Math.ceil(
        bounds.maxX - bounds.minX + 2 * widthRadius + 2 * borderWidth
    );
    const height = Math.ceil(
        bounds.maxY - bounds.minY + 2 * heightRadius + 2 * borderWidth
    );

    return { width, height };
}
