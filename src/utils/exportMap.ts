/** @format */

import { GridType } from "@/hooks/useGridState";
import { drawHexGrid, calculateHexGridDimensions } from "./hexagon";
import { drawSquareGrid, calculateSquareGridDimensions } from "./square";

export interface GridState {
    gridType: string;
    cols: number;
    rows: number;
    tileSize: number;
    borderWidth: number;
    borderColor: string;
    biomeGrid: (string | null)[][];
    ppi: number;
}

interface UVTTFormat {
    software: string;
    creator: string;
    format: number;
    resolution: {
        map_origin: { x: number; y: number };
        map_size: { x: number; y: number };
        pixels_per_grid: number;
    };
    line_of_sight: any[];
    objects_line_of_sight: any[];
    portals: any[];
    environment: {
        baked_lighting: boolean;
        ambient_light: string | null;
    };
    lights: any[];
    image: string;
}

interface FoundryVTTFormat {
    name: string;
    navigation: boolean;
    navOrder: number;
    navName: string;
    img: string;
    foreground: null;
    thumb: null;
    width: number;
    height: number;
    padding: number;
    initial: null;
    backgroundColor: string;
    gridType: number;
    grid: number;
    shiftX: number;
    shiftY: number;
    gridColor: string;
    gridAlpha: number;
    gridDistance: number;
    gridUnits: string;
    tokenVision: boolean;
    fogExploration: boolean;
    fogReset: number;
    globalLight: boolean;
    globalLightThreshold: null;
    darkness: number;
    drawings: any[];
    tokens: any[];
    lights: any[];
    notes: any[];
    sounds: any[];
    templates: any[];
    tiles: any[];
    walls: any[];
    playlist: null;
    playlistSound: null;
    journal: null;
    weather: string;
    flags: Record<string, any>;
}

// Utility functions
function calculateGridDimensions(gridState: GridState): {
    width: number;
    height: number;
} {
    if (gridState.gridType === "square") {
        return calculateSquareGridDimensions(
            gridState.cols,
            gridState.rows,
            gridState.tileSize,
            gridState.borderWidth
        );
    } else {
        const flat = gridState.gridType.startsWith("hex-flat");
        return calculateHexGridDimensions(
            gridState.cols,
            gridState.rows,
            gridState.tileSize,
            flat,
            gridState.borderWidth
        );
    }
}

function renderGridToCanvas(gridState: GridState): OffscreenCanvas {
    const { width, height } = calculateGridDimensions(gridState);
    const offscreenCanvas = new OffscreenCanvas(width, height);
    const ctx = offscreenCanvas.getContext("2d");

    if (!ctx) {
        throw new Error("Failed to get offscreen canvas context");
    }

    // Only fill background if there's a border (for the border color)
    if (gridState.borderWidth > 0) {
        ctx.fillStyle = gridState.borderColor;
        ctx.fillRect(0, 0, width, height);
    } else {
        // For borderless grids, use white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
    }

    // Draw grid
    if (gridState.gridType === "square") {
        drawSquareGrid(
            ctx,
            gridState.cols,
            gridState.rows,
            gridState.tileSize,
            gridState.biomeGrid,
            gridState.borderWidth,
            gridState.borderColor
        );
    } else {
        drawHexGrid(
            ctx,
            gridState.gridType as GridType,
            gridState.cols,
            gridState.rows,
            gridState.tileSize,
            gridState.biomeGrid,
            gridState.borderWidth,
            gridState.borderColor
        );
    }

    return offscreenCanvas;
}

function generateTimestamp(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
}

function generateFilename(gridState: GridState, suffix: string = ""): string {
    const timestamp = generateTimestamp();
    const gridInfo = `${gridState.gridType}_${gridState.cols}x${gridState.rows}`;
    return `grid_${gridInfo}_${timestamp}${suffix}`;
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl: string, filename: string): void {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function hasGridContent(biomeGrid: (string | null)[][]): boolean {
    return biomeGrid.some((row) => row.some((cell) => cell !== null));
}

function validateGridContent(gridState: GridState): void {
    if (!hasGridContent(gridState.biomeGrid)) {
        throw new Error("Grid is empty. Please generate a map first.");
    }
}

async function offscreenCanvasToBase64(
    canvas: OffscreenCanvas,
    format: "webp" | "png" = "webp"
): Promise<string> {
    const mimeType = `image/${format}`;
    const blob = await canvas.convertToBlob({ type: mimeType, quality: 0.95 });

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function getFoundryVttGridType(gridType: string): number {
    const gridTypeMap: Record<string, number> = {
        square: 1,
        "hex-pointy-even": 2,
        "hex-pointy-odd": 3,
        "hex-flat-even": 4,
        "hex-flat-odd": 5,
    };
    return gridTypeMap[gridType] ?? 1;
}

// Export functions
export async function exportImage(
    format: "webp" | "png" | "jpeg",
    gridState: GridState
): Promise<void> {
    validateGridContent(gridState);

    try {
        const offscreenCanvas = renderGridToCanvas(gridState);
        const mimeType = `image/${format === "jpeg" ? "jpeg" : format}`;
        const quality =
            format === "jpeg" ? 0.9 : format === "webp" ? 0.95 : undefined;

        const blob = await offscreenCanvas.convertToBlob({
            type: mimeType,
            quality,
        });

        const filename = `${generateFilename(gridState)}.${format}`;
        downloadBlob(blob, filename);
    } catch (error) {
        console.error("Failed to export image:", error);
        throw error;
    }
}

export function exportGridAsJson(gridState: GridState): void {
    validateGridContent(gridState);

    const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        gridType: gridState.gridType,
        dimensions: { cols: gridState.cols, rows: gridState.rows },
        tileSize: gridState.tileSize,
        ppi: gridState.ppi,
        border: { width: gridState.borderWidth, color: gridState.borderColor },
        biomeGrid: gridState.biomeGrid,
    };

    const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(exportData, null, 2));
    const filename = `${generateFilename(gridState)}.json`;

    downloadDataUrl(dataStr, filename);
}

// https://arkenforge.com/universal-vtt-files/
export async function exportAsUVTT(gridState: GridState): Promise<void> {
    validateGridContent(gridState);

    if (gridState.gridType.includes("hex"))
        return alert(
            "Sorry, but UVTT does not support hex grids. It only supports square grids."
        );

    try {
        const offscreenCanvas = renderGridToCanvas(gridState);
        const imageString = await offscreenCanvasToBase64(
            offscreenCanvas,
            "webp"
        );

        const uvttData: UVTTFormat = {
            software: "Generator",
            creator: "Michael Fitzgerald",
            format: 1.0,
            resolution: {
                map_origin: { x: 0, y: 0 },
                map_size: { x: gridState.cols, y: gridState.rows },
                pixels_per_grid: gridState.tileSize,
            },
            line_of_sight: [],
            objects_line_of_sight: [],
            portals: [],
            environment: { baked_lighting: false, ambient_light: null },
            lights: [],
            image: imageString,
        };

        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(uvttData, null, 2));
        const filename = `${generateFilename(gridState)}.uvtt`;

        downloadDataUrl(dataStr, filename);
    } catch (error) {
        console.error("Failed to export as UVTT:", error);
        throw error;
    }
}

export async function exportAsFoundryVTT(gridState: GridState): Promise<void> {
    validateGridContent(gridState);

    if (gridState.ppi < 50) {
        throw new Error(
            "FoundryVTT does not support a grid size less than 50!"
        );
    }

    try {
        const { width, height } = calculateGridDimensions(gridState);
        const mapName = generateFilename(gridState, "_scene");

        const foundryData: FoundryVTTFormat = {
            name: mapName,
            navigation: true,
            navOrder: 0,
            navName: "",
            img: `worlds/your-world/${mapName}.webp`,
            foreground: null,
            thumb: null,
            width,
            height,
            padding: 0,
            initial: null,
            backgroundColor: "#999999",
            gridType: getFoundryVttGridType(gridState.gridType),
            grid: gridState.tileSize,
            shiftX: 0,
            shiftY: 0,
            gridColor: gridState.borderColor,
            gridAlpha: 0.2,
            gridDistance: 5,
            gridUnits: "ft",
            tokenVision: true,
            fogExploration: true,
            fogReset: Date.now(),
            globalLight: false,
            globalLightThreshold: null,
            darkness: 0,
            drawings: [],
            tokens: [],
            lights: [],
            notes: [],
            sounds: [],
            templates: [],
            tiles: [],
            walls: [],
            playlist: null,
            playlistSound: null,
            journal: null,
            weather: "",
            flags: {},
        };

        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(foundryData, null, 2));
        const filename = `${generateFilename(gridState, "_foundry")}.json`;

        downloadDataUrl(dataStr, filename);
    } catch (error) {
        console.error("Failed to export as FoundryVTT:", error);
        throw error;
    }
}

export async function exportMap(
    type: "json" | "uvtt" | "foundry",
    gridState: GridState
): Promise<void> {
    try {
        switch (type) {
            case "json":
                exportGridAsJson(gridState);
                break;
            case "uvtt":
                await exportAsUVTT(gridState);
                break;
            case "foundry": {
                const fvttTileSize = Math.max(gridState.tileSize, 50);
                const modifiedGridState = {
                    ...gridState,
                    tileSize: fvttTileSize,
                    borderWidth: 0,
                };

                await exportAsFoundryVTT(modifiedGridState);
                await exportImage("webp", modifiedGridState);
                break;
            }
            default:
                throw new Error(
                    `Unsupported export type: ${type as unknown as string}`
                );
        }
    } catch (error) {
        console.error(`Failed to export as ${type}:`, error);
        throw error;
    }
}
