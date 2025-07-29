/** @format */

import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { exportImage, exportMap } from "@/utils/exportMap";

export const MIN_TILE_SIZE = 20;
export const MAX_TILE_SIZE = 200;
export const MIN_PPI = 10;
export const MAX_PPI = 300;
export const MAX_TILES_NO_WEBGL = 100;
export const MAX_TILES_WEBGL = 50000;

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

    const handleExportImage = useCallback(
        async (format: "webp" | "png" | "jpeg") => {
            try {
                // Get the canvas element - you'll need to expose this from GridCanvas
                const canvas = document.querySelector(
                    "canvas"
                ) as HTMLCanvasElement;
                if (!canvas) {
                    throw new Error("Canvas not found");
                }
                await exportImage(format, gridState);
            } catch (error) {
                console.error("Export failed:", error);
                // Handle error (show toast, etc.)
            }
        },
        [gridState]
    );

    const handleExportData = useCallback(
        async (type: "json" | "uvtt" | "foundry") => {
            try {
                const canvas = document.querySelector(
                    "canvas"
                ) as HTMLCanvasElement;
                if (!canvas) {
                    throw new Error("Canvas not found");
                }
                await exportMap(type, gridState);
            } catch (error) {
                console.error("Export failed:", error);
                // Handle error (show toast, etc.)
            }
        },
        [gridState]
    );

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
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onExportImage={handleExportImage}
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onExportData={handleExportData}
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
