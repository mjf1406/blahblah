/** @format */

import React, { useEffect, useState, useMemo } from "react";
import { ChevronRight, ChevronLeft, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import { BiomeBrush } from "@/components/canvas-grid/BiomeBrush";
import ToolPalette, { Tool } from "@/components/canvas-grid/ToolPalette";
import { GridCanvas } from "@/components/canvas-grid/GridCanvas";
import { useGridState } from "@/hooks/useGridState";
import { useViewState } from "@/hooks/useViewState";
import { useCanvasInteraction } from "@/hooks/useCanvasInteraction";
import { detectWebGL } from "@/lib/utils";

// Constants
const MIN_TILE_SIZE = 10;
const MAX_TILE_SIZE = 200;
const MIN_PPI = 10;
const MAX_PPI = 200;
const MAX_TILES_NO_WEBGL = 100;
const MAX_TILES_WEBGL = 50000;

const CanvasGridContent: React.FC = () => {
    const [selectedBiome, setSelectedBiome] = useState<string | null>(null);
    const [selectedTool, setSelectedTool] = useState<Tool>("paint");
    const { open, setOpen } = useSidebar();

    // Detect WebGL support and set grid limits accordingly
    const { maxGridWidth, maxGridHeight, hasWebGL } = useMemo(() => {
        const webGLSupported = detectWebGL();
        return {
            maxGridWidth: webGLSupported ? MAX_TILES_WEBGL : MAX_TILES_NO_WEBGL,
            maxGridHeight: webGLSupported
                ? MAX_TILES_WEBGL
                : MAX_TILES_NO_WEBGL,
            hasWebGL: webGLSupported,
        };
    }, []);

    // Custom hooks
    const gridState = useGridState();
    const viewState = useViewState();

    // Add this function inside CanvasGridContent component
    const handleDownloadCanvas = () => {
        // Calculate the actual grid dimensions
        const gridWidth =
            gridState.cols * gridState.tileSize +
            (gridState.cols + 1) * gridState.borderWidth;
        const gridHeight =
            gridState.rows * gridState.tileSize +
            (gridState.rows + 1) * gridState.borderWidth;

        // Create a new canvas with exact grid dimensions
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = gridWidth;
        exportCanvas.height = gridHeight;
        const ctx = exportCanvas.getContext("2d");

        if (!ctx) {
            console.error("Failed to get canvas context");
            return;
        }

        // Clear the canvas with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, gridWidth, gridHeight);

        // Draw the grid
        drawGridToCanvas(ctx, gridWidth, gridHeight);

        // Create filename with timestamp
        const timestamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/:/g, "-");
        const filename = `grid-map-${gridState.cols}x${gridState.rows}-${timestamp}.webp`;

        // Convert canvas to WebP blob and download
        exportCanvas.toBlob(
            (blob) => {
                if (!blob) {
                    console.error("Failed to create blob");
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            },
            "image/webp",
            0.95
        );
    };

    // Add this helper function to draw the grid
    const drawGridToCanvas = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ) => {
        const {
            cols,
            rows,
            tileSize,
            borderWidth,
            borderColor,
            biomeGrid,
            gridType,
        } = gridState;

        // Draw borders
        if (borderWidth > 0) {
            ctx.fillStyle = borderColor;
            ctx.fillRect(0, 0, width, height);
        }

        // Draw tiles
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const biome = biomeGrid[row]?.[col];
                if (!biome) continue;

                let x, y;

                if (gridType.includes("hex")) {
                    // Hexagonal grid positioning
                    const hexWidth = tileSize;
                    const hexHeight = tileSize * 0.866; // √3/2
                    x = borderWidth + col * hexWidth * 0.75;
                    y =
                        borderWidth +
                        row * hexHeight +
                        (col % 2) * (hexHeight / 2);
                } else {
                    // Square grid positioning
                    x = borderWidth + col * (tileSize + borderWidth);
                    y = borderWidth + row * (tileSize + borderWidth);
                }

                // Set fill color based on biome
                ctx.fillStyle = getBiomeColor(biome);

                if (gridType.includes("hex")) {
                    drawHexagon(
                        ctx,
                        x + tileSize / 2,
                        y + tileSize / 2,
                        tileSize / 2
                    );
                } else {
                    ctx.fillRect(x, y, tileSize, tileSize);
                }
            }
        }
    };

    // Helper function to get biome colors (you'll need to implement this based on your biome system)
    const getBiomeColor = (biome: string): string => {
        // This should match your biome color mapping
        const biomeColors: Record<string, string> = {
            forest: "#228B22",
            desert: "#F4A460",
            water: "#4682B4",
            mountain: "#696969",
            grassland: "#9ACD32",
            // Add more biome colors as needed
        };
        return biomeColors[biome] || "#CCCCCC";
    };

    // Helper function to draw hexagon
    const drawHexagon = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        radius: number
    ) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const hx = x + radius * Math.cos(angle);
            const hy = y + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(hx, hy);
            } else {
                ctx.lineTo(hx, hy);
            }
        }
        ctx.closePath();
        ctx.fill();
    };

    const canvasInteraction = useCanvasInteraction({
        gridType: gridState.gridType,
        cols: gridState.cols,
        rows: gridState.rows,
        tileSize: gridState.tileSize,
        borderWidth: gridState.borderWidth,
        panOffset: viewState.panOffset,
        zoomLevel: viewState.zoomLevel,
        selectedBiome,
        selectedTool,
        setBiomeGrid: gridState.setBiomeGrid,
        updatePan: viewState.updatePan,
        updateZoom: viewState.updateZoom,
    });

    // Generate initial biome grid
    useEffect(() => {
        gridState.generateBiomeGrid();
    }, [gridState.generateBiomeGrid]);

    return (
        <TooltipProvider>
            <div className="relative flex w-full overflow-y-hidden">
                {/* Sidebar */}
                <div className="relative">
                    <Sidebar
                        className={`mt-16 transition-transform duration-300 ease-in-out ${
                            !open ? "-translate-x-full" : "translate-x-0"
                        }`}
                    >
                        <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-3 border-b">
                            <h2 className="text-lg font-semibold">
                                Grid Controls
                            </h2>
                            <div className="flex gap-1">
                                <Button
                                    size={"icon"}
                                    variant={"outline"}
                                    onClick={gridState.generateBiomeGrid}
                                >
                                    <Dices />
                                </Button>
                                <DisplayPresets
                                    currentGridType={gridState.gridType}
                                    onPresetSelect={
                                        gridState.handlePresetSelect
                                    }
                                />
                            </div>
                        </SidebarHeader>
                        <SidebarContent className="p-4 space-y-3 overflow-y-auto">
                            <GridTypeSelector
                                gridType={gridState.gridType}
                                onGridTypeChange={gridState.setGridType}
                            />

                            <DimensionControls
                                cols={gridState.cols}
                                rows={gridState.rows}
                                onColsChange={gridState.updateCols}
                                onRowsChange={gridState.updateRows}
                                maxCols={maxGridWidth}
                                maxRows={maxGridHeight}
                                hasWebGL={hasWebGL}
                            />

                            <TileSizeControls
                                tileSize={gridState.tileSize}
                                ppi={gridState.ppi}
                                onTileSizeChange={gridState.updateTileSize}
                                onPpiChange={gridState.updatePpi}
                                minTileSize={MIN_TILE_SIZE}
                                maxTileSize={MAX_TILE_SIZE}
                                minPpi={MIN_PPI}
                                maxPpi={MAX_PPI}
                            />

                            <BorderControls
                                borderWidth={gridState.borderWidth}
                                borderColor={gridState.borderColor}
                                onBorderWidthChange={
                                    gridState.updateBorderWidth
                                }
                                onBorderColorChange={
                                    gridState.updateBorderColor
                                }
                            />

                            <Button
                                onClick={gridState.generateBiomeGrid}
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
                <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out">
                    <div className="flex items-center justify-center flex-1 overflow-hidden bg-gray-200">
                        <GridCanvas
                            gridType={gridState.gridType}
                            cols={gridState.cols}
                            rows={gridState.rows}
                            tileSize={gridState.tileSize}
                            borderWidth={gridState.borderWidth}
                            borderColor={gridState.borderColor}
                            biomeGrid={gridState.biomeGrid}
                            panOffset={viewState.panOffset}
                            zoomLevel={viewState.zoomLevel}
                            onMouseDown={canvasInteraction.handleMouseDown}
                            onMouseMove={canvasInteraction.handleMouseMove}
                            onMouseUp={canvasInteraction.handleMouseUp}
                            onMouseLeave={canvasInteraction.handleMouseLeave}
                            onWheel={canvasInteraction.handleWheel}
                            onContextMenu={canvasInteraction.handleContextMenu}
                            cursorStyle={canvasInteraction.getCursorStyle()}
                        />
                    </div>
                </div>

                {/* Tool Palette */}
                <ToolPalette
                    selectedTool={selectedTool}
                    onToolSelect={setSelectedTool}
                    onZoomIn={viewState.zoomIn}
                    onZoomOut={viewState.zoomOut}
                    onResetView={viewState.resetView}
                    onResetCanvas={gridState.resetCanvas}
                    onDownloadCanvas={handleDownloadCanvas}
                    zoomLevel={viewState.zoomLevel}
                />
            </div>
        </TooltipProvider>
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
