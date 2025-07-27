/** @format */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { ChevronRight, ChevronLeft, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarProvider,
    useSidebar,
} from "@/components/ui/sidebar";
import { DisplayPresets } from "@/components/canvas-grid/DisplayPresets";
import { GridTypeSelector } from "@/components/canvas-grid/GridTypeSelector";
import { DimensionControls } from "@/components/canvas-grid/DimensionControls";
import { TileSizeControls } from "@/components/canvas-grid/TileSizeControls";
import { BorderControls } from "@/components/canvas-grid/BorderControls";
import { BiomeBrush, BIOMES } from "@/components/canvas-grid/BiomeBrush";
import {
    saveGridConfig,
    getGridConfig,
    getGridConfigType,
    type GridConfig,
} from "@/utils/gridConfigStorage";

// Constants
const MIN_TILE_SIZE = 10;
const MAX_TILE_SIZE = 200;
const MAX_GRID_WIDTH = 200;
const MAX_GRID_HEIGHT = 200;
const MAX_CANVAS_SIZE = 100000;
const MIN_PPI = 10;
const MAX_PPI = 200;

export type GridType =
    | "square"
    | "hex-flat-odd"
    | "hex-flat-even"
    | "hex-pointy-odd"
    | "hex-pointy-even";

interface GridDimensions {
    rawWidth: number;
    rawHeight: number;
    scale: number;
    canvasWidth: number;
    canvasHeight: number;
}

const calculateGridDimensions = (
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
            rawWidth = cols * tileSize + borderWidth * 2;
            rawHeight = rows * tileSize + borderWidth * 2;
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

const getGridCoordinates = (
    mouseX: number,
    mouseY: number,
    gridType: GridType,
    cols: number,
    rows: number,
    tileSize: number,
    borderWidth: number,
    scale: number
): { col: number; row: number } | null => {
    // Adjust for scale and border
    const x = mouseX / scale - borderWidth;
    const y = mouseY / scale - borderWidth;

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

const drawHexagon = (
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

const drawSquareGrid = (
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    tileSize: number,
    biomeGrid: string[][],
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

const drawHexGrid = (
    ctx: CanvasRenderingContext2D,
    gridType: GridType,
    cols: number,
    rows: number,
    tileSize: number,
    biomeGrid: string[][],
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
                biomeGrid[row]?.[col],
                borderWidth,
                borderColor
            );
        }
    }
};

const CanvasGridContent: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gridType, setGridType] = useState<GridType>("square");
    const [cols, setCols] = useState(20);
    const [rows, setRows] = useState(20);
    const [tileSize, setTileSize] = useState(30);
    const [ppi, setPpi] = useState(80);
    const [borderWidth, setBorderWidth] = useState(1);
    const [borderColor, setBorderColor] = useState("#000000");
    const [biomeGrid, setBiomeGrid] = useState<string[][]>([]);
    const [selectedBiome, setSelectedBiome] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Track if user has made manual changes
    const [hasManualChanges, setHasManualChanges] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const { open, setOpen } = useSidebar();

    // Load configuration on initial mount only
    useEffect(() => {
        if (isInitialLoad) {
            const configType = getGridConfigType(gridType);
            const config = getGridConfig(configType);

            setCols(config.cols);
            setRows(config.rows);
            setTileSize(config.tileSize);
            setPpi(config.ppi);
            setBorderWidth(config.borderWidth);
            setBorderColor(config.borderColor);

            setIsInitialLoad(false);
        }
    }, [isInitialLoad, gridType]);

    // Load configuration when switching grid types (only if no manual changes)
    useEffect(() => {
        if (!isInitialLoad && !hasManualChanges) {
            const configType = getGridConfigType(gridType);
            const config = getGridConfig(configType);

            setCols(config.cols);
            setRows(config.rows);
            setTileSize(config.tileSize);
            setPpi(config.ppi);
            setBorderWidth(config.borderWidth);
            setBorderColor(config.borderColor);
        }
    }, [gridType, hasManualChanges, isInitialLoad]);

    // Save configuration when relevant values change (but not during initial load)
    useEffect(() => {
        if (!isInitialLoad) {
            const configType = getGridConfigType(gridType);
            const config: GridConfig = {
                cols,
                rows,
                tileSize,
                ppi,
                borderWidth,
                borderColor,
            };
            saveGridConfig(configType, config);
        }
    }, [
        gridType,
        cols,
        rows,
        tileSize,
        ppi,
        borderWidth,
        borderColor,
        isInitialLoad,
    ]);

    // Wrapped setter functions that mark manual changes
    const handleColsChange = (value: number) => {
        setHasManualChanges(true);
        setCols(value);
    };

    const handleRowsChange = (value: number) => {
        setHasManualChanges(true);
        setRows(value);
    };

    const handleTileSizeChange = (value: number) => {
        setHasManualChanges(true);
        setTileSize(value);
    };

    const handlePpiChange = (value: number) => {
        setHasManualChanges(true);
        setPpi(value);
    };

    const handleBorderWidthChange = (value: number) => {
        setHasManualChanges(true);
        setBorderWidth(value);
    };

    const handleBorderColorChange = (value: string) => {
        setHasManualChanges(true);
        setBorderColor(value);
    };

    const generateBiomeGrid = useCallback(() => {
        const grid: string[][] = [];
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                const color =
                    BIOMES[Math.floor(Math.random() * BIOMES.length)].color;
                grid[r][c] = color;
            }
        }
        setBiomeGrid(grid);
    }, [cols, rows]);

    const handlePresetSelect = (presetData: {
        ppi: number;
        tileSize: number;
        cols: number;
        rows: number;
        displayName: string;
    }) => {
        // Reset manual changes flag when applying presets
        setHasManualChanges(false);

        setPpi(presetData.ppi);
        setTileSize(presetData.tileSize);
        setCols(presetData.cols);
        setRows(presetData.rows);
        console.log(`Applied preset: ${presetData.displayName}`);
    };

    const paintTile = useCallback(
        (mouseX: number, mouseY: number) => {
            if (!selectedBiome) return;

            const { scale } = calculateGridDimensions(
                gridType,
                cols,
                rows,
                tileSize,
                borderWidth
            );

            const coords = getGridCoordinates(
                mouseX,
                mouseY,
                gridType,
                cols,
                rows,
                tileSize,
                borderWidth,
                scale
            );

            if (coords) {
                setBiomeGrid((prev) => {
                    const newGrid = [...prev];
                    if (!newGrid[coords.row]) newGrid[coords.row] = [];
                    newGrid[coords.row][coords.col] = selectedBiome;
                    return newGrid;
                });
            }
        },
        [selectedBiome, gridType, cols, rows, tileSize, borderWidth]
    );

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!selectedBiome || e.button !== 0) return;
        setIsDrawing(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            paintTile(e.clientX - rect.left, e.clientY - rect.top);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !selectedBiome) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            paintTile(e.clientX - rect.left, e.clientY - rect.top);
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    useEffect(generateBiomeGrid, [generateBiomeGrid]);

    const drawGrid = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { canvasWidth, canvasHeight, scale } = calculateGridDimensions(
            gridType,
            cols,
            rows,
            tileSize,
            borderWidth
        );

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        if (scale < 1) {
            ctx.save();
            ctx.scale(scale, scale);
        }

        if (gridType === "square") {
            drawSquareGrid(
                ctx,
                cols,
                rows,
                tileSize,
                biomeGrid,
                borderWidth,
                borderColor
            );
        } else {
            drawHexGrid(
                ctx,
                gridType,
                cols,
                rows,
                tileSize,
                biomeGrid,
                borderWidth,
                borderColor
            );
        }

        if (scale < 1) ctx.restore();
    }, [gridType, cols, rows, tileSize, borderWidth, borderColor, biomeGrid]);

    useEffect(drawGrid, [drawGrid]);

    // Custom cursor style
    const cursorStyle = selectedBiome
        ? {
              cursor: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='8' fill='${encodeURIComponent(
                  selectedBiome
              )}' stroke='%23000' stroke-width='2'/%3E%3C/svg%3E") 10 10, crosshair`,
          }
        : { cursor: "default" };

    return (
        <div className="relative flex w-full">
            {/* Sidebar */}
            <div className="relative">
                <Sidebar
                    className={`mt-16 transition-transform duration-300 ease-in-out ${
                        !open ? "-translate-x-full" : "translate-x-0"
                    }`}
                >
                    <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-3 border-b">
                        <h2 className="text-lg font-semibold">Grid Controls</h2>
                        <div className="flex gap-1">
                            <Button
                                size={"icon"}
                                variant={"outline"}
                            >
                                <Dices />
                            </Button>
                            <DisplayPresets
                                currentGridType={gridType}
                                onPresetSelect={handlePresetSelect}
                            />
                        </div>
                    </SidebarHeader>
                    <SidebarContent className="p-4 space-y-3 overflow-y-auto">
                        <GridTypeSelector
                            gridType={gridType}
                            onGridTypeChange={setGridType}
                        />

                        <DimensionControls
                            cols={cols}
                            rows={rows}
                            onColsChange={handleColsChange}
                            onRowsChange={handleRowsChange}
                            maxCols={MAX_GRID_WIDTH}
                            maxRows={MAX_GRID_HEIGHT}
                        />

                        <TileSizeControls
                            tileSize={tileSize}
                            ppi={ppi}
                            onTileSizeChange={handleTileSizeChange}
                            onPpiChange={handlePpiChange}
                            minTileSize={MIN_TILE_SIZE}
                            maxTileSize={MAX_TILE_SIZE}
                            minPpi={MIN_PPI}
                            maxPpi={MAX_PPI}
                        />

                        <BorderControls
                            borderWidth={borderWidth}
                            borderColor={borderColor}
                            onBorderWidthChange={handleBorderWidthChange}
                            onBorderColorChange={handleBorderColorChange}
                        />

                        <Button
                            onClick={generateBiomeGrid}
                            className="w-full"
                        >
                            Regenerate Biomes
                        </Button>

                        <BiomeBrush
                            selectedBiome={selectedBiome}
                            onBiomeSelect={setSelectedBiome}
                        />
                    </SidebarContent>
                </Sidebar>

                {/* Toggle Button */}
                <Button
                    onClick={() => setOpen(!open)}
                    className={`fixed top-1/2 transform -translate-y-1/2 w-8 h-16 p-0 rounded-r-md rounded-l-none bg-white border hover:bg-gray-50 z-50 transition-all duration-300 ease-in-out ${
                        open ? "left-64" : "left-0"
                    }`}
                    style={{ marginTop: "4rem" }}
                >
                    {open ? (
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                </Button>
            </div>

            {/* Main Content */}
            <div
                className={`flex-1 h-full overflow-auto transition-all mr-4 duration-300 ease-in-out ${
                    open ? "ml-0" : "ml-0"
                }`}
            >
                <div className="flex items-start justify-start w-full h-full p-4">
                    <canvas
                        ref={canvasRef}
                        style={cursorStyle}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                </div>
            </div>
        </div>
    );
};

const CanvasGrid: React.FC = () => {
    return (
        <SidebarProvider defaultOpen={true}>
            <CanvasGridContent />
        </SidebarProvider>
    );
};

export default CanvasGrid;
