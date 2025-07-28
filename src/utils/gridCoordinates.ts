/** @format */

import { GridType } from "@/hooks/useGridState";

const MAX_CANVAS_SIZE = 100000;

export interface GridDimensions {
    rawWidth: number;
    rawHeight: number;
    scale: number;
    canvasWidth: number;
    canvasHeight: number;
}

export const calculateGridDimensions = (
    gridType: GridType,
    cols: number,
    rows: number,
    tileSize: number,
    borderWidth: number
): GridDimensions => {
    const r = tileSize / 2;
    let rawWidth = 0;
    let rawHeight = 0;
    const d = 2 * r;
    const s = Math.sqrt(3) * r;
    const R = s / 2;
    const a = r;
    const tSquared = Math.pow(a, 2) - Math.pow(s / 2, 2);
    const t = Math.sqrt(tSquared);

    switch (gridType) {
        case "square":
            rawWidth = cols * (tileSize + borderWidth) + borderWidth;
            rawHeight = rows * (tileSize + borderWidth) + borderWidth;
            break;

        case "hex-flat-odd":
        case "hex-flat-even": {
            rawWidth = borderWidth * 2 + (d - t) * cols - t + d / 2;
            rawHeight = borderWidth * 2 + s * rows + s / 2;
            break;
        }

        case "hex-pointy-odd":
        case "hex-pointy-even": {
            rawWidth = borderWidth * 2 + s * cols + s / 2;
            rawHeight = borderWidth * 2 + (d - t) * rows - t + d / 2;
            break;
        }
    }

    const scale = Math.min(1, MAX_CANVAS_SIZE / Math.max(rawWidth, rawHeight));

    return {
        rawWidth,
        rawHeight,
        scale,
        canvasWidth: Math.round(rawWidth * scale),
        canvasHeight: Math.round(rawHeight * scale),
    };
};

export const getGridCoordinates = (
    mouseX: number,
    mouseY: number,
    gridType: GridType,
    cols: number,
    rows: number,
    tileSize: number,
    borderWidth: number,
    scale: number,
    panOffset: { x: number; y: number },
    zoomLevel: number
): { col: number; row: number } | null => {
    // Apply inverse transforms to get actual grid coordinates
    const adjustedX = (mouseX - panOffset.x) / zoomLevel;
    const adjustedY = (mouseY - panOffset.y) / zoomLevel;

    // Adjust for scale and border
    const x = adjustedX / scale - borderWidth;
    const y = adjustedY / scale - borderWidth;

    if (gridType === "square") {
        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);

        if (col >= 0 && col < cols && row >= 0 && row < rows) {
            return { col, row };
        }
    } else {
        // Hex grid coordinate conversion
        const flat = gridType.startsWith("hex-flat");
        const odd = gridType.endsWith("odd");
        const r = tileSize / 2;
        const hexW = flat ? 2 * r : Math.sqrt(3) * r;
        const hexH = flat ? Math.sqrt(3) * r : 2 * r;
        const colSp = flat ? (3 / 2) * r : hexW;
        const rowSp = flat ? hexH : (3 / 2) * r;

        const xOff = flat ? r : hexW / 2;
        const yOff = flat ? hexH / 2 : r;

        if (flat) {
            // Flat-topped hex
            const col = Math.round((x - xOff) / colSp);
            let row = Math.round((y - yOff) / rowSp);

            // Adjust for offset rows
            const offsetY = col % 2 === (odd ? 1 : 0) ? hexH / 2 : 0;
            row = Math.round((y - yOff - offsetY) / rowSp);

            if (col >= 0 && col < cols && row >= 0 && row < rows) {
                return { col, row };
            }
        } else {
            // Pointy-topped hex
            let col = Math.round((x - xOff) / colSp);
            const row = Math.round((y - yOff) / rowSp);

            // Adjust for offset columns
            const offsetX = row % 2 === (odd ? 1 : 0) ? hexW / 2 : 0;
            col = Math.round((x - xOff - offsetX) / colSp);

            if (col >= 0 && col < cols && row >= 0 && row < rows) {
                return { col, row };
            }
        }
    }

    return null;
};
