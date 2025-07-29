/** @format */

import React, { useRef, useEffect, useCallback } from "react";
import { GridType } from "@/hooks/useGridState";
import { calculateGridDimensions } from "@/utils/gridCoordinates";
import { drawSquareGrid } from "@/utils/square";
import { drawHexGrid } from "@/utils/hexagon";

interface GridCanvasProps {
    gridType: GridType;
    cols: number;
    rows: number;
    tileSize: number;
    borderWidth: number;
    borderColor: string;
    biomeGrid: (string | null)[][];
    panOffset: { x: number; y: number };
    zoomLevel: number;
    onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseLeave: () => void;
    onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    cursorStyle: React.CSSProperties;
}

export const GridCanvas: React.FC<GridCanvasProps> = ({
    gridType,
    cols,
    rows,
    tileSize,
    borderWidth,
    borderColor,
    biomeGrid,
    panOffset,
    zoomLevel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onWheel,
    onContextMenu,
    cursorStyle,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const drawGrid = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { scale } = calculateGridDimensions(
            gridType,
            cols,
            rows,
            tileSize,
            borderWidth
        );

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();

        // Apply pan and zoom transforms
        ctx.translate(panOffset.x, panOffset.y);
        ctx.scale(zoomLevel, zoomLevel);

        if (scale < 1) {
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

        ctx.restore();
    }, [
        gridType,
        cols,
        rows,
        tileSize,
        borderWidth,
        borderColor,
        biomeGrid,
        panOffset,
        zoomLevel,
    ]);

    useEffect(() => {
        drawGrid();
    }, [drawGrid]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={cursorStyle}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onWheel={onWheel}
            onContextMenu={onContextMenu}
        />
    );
};
