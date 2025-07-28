/** @format */

import { useState, useEffect, useCallback } from "react";
import {
    saveGridConfig,
    getGridConfig,
    getGridConfigType,
    type GridConfig,
} from "@/utils/gridConfigStorage";
import { BIOMES } from "@/components/canvas-grid/BiomeBrush";

export type GridType =
    | "square"
    | "hex-flat-odd"
    | "hex-flat-even"
    | "hex-pointy-odd"
    | "hex-pointy-even";

interface UseGridStateProps {
    initialGridType?: GridType;
}

export const useGridState = ({
    initialGridType = "square",
}: UseGridStateProps = {}) => {
    const [gridType, setGridType] = useState<GridType>(initialGridType);
    const [cols, setCols] = useState(20);
    const [rows, setRows] = useState(20);
    const [tileSize, setTileSize] = useState(30);
    const [ppi, setPpi] = useState(80);
    const [borderWidth, setBorderWidth] = useState(1);
    const [borderColor, setBorderColor] = useState("#000000");
    const [biomeGrid, setBiomeGrid] = useState<(string | null)[][]>([]);

    const [hasManualChanges, setHasManualChanges] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

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

    // Save configuration when relevant values change
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

    const generateBiomeGrid = useCallback(() => {
        const grid: (string | null)[][] = [];
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

    const resetCanvas = useCallback(() => {
        setBiomeGrid(
            Array(rows)
                .fill(null)
                .map(() => Array(cols).fill(null))
        );
    }, [rows, cols]);

    // Wrapped setter functions that mark manual changes
    const updateCols = (value: number) => {
        setHasManualChanges(true);
        setCols(value);
    };

    const updateRows = (value: number) => {
        setHasManualChanges(true);
        setRows(value);
    };

    const updateTileSize = (value: number) => {
        setHasManualChanges(true);
        setTileSize(value);
    };

    const updatePpi = (value: number) => {
        setHasManualChanges(true);
        setPpi(value);
    };

    const updateBorderWidth = (value: number) => {
        setHasManualChanges(true);
        setBorderWidth(value);
    };

    const updateBorderColor = (value: string) => {
        setHasManualChanges(true);
        setBorderColor(value);
    };

    const handlePresetSelect = (presetData: {
        ppi: number;
        tileSize: number;
        cols: number;
        rows: number;
        displayName: string;
    }) => {
        setHasManualChanges(false);
        setPpi(presetData.ppi);
        setTileSize(presetData.tileSize);
        setCols(presetData.cols);
        setRows(presetData.rows);
    };

    return {
        // State
        gridType,
        cols,
        rows,
        tileSize,
        ppi,
        borderWidth,
        borderColor,
        biomeGrid,

        // Actions
        setGridType,
        setBiomeGrid,
        generateBiomeGrid,
        resetCanvas,
        handlePresetSelect,

        // Wrapped setters
        updateCols,
        updateRows,
        updateTileSize,
        updatePpi,
        updateBorderWidth,
        updateBorderColor,
    };
};
