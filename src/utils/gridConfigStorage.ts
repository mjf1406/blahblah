/** @format */

// utils/gridConfigStorage.ts
export interface GridConfig {
    cols: number;
    rows: number;
    tileSize: number;
    ppi: number;
    borderWidth: number;
    borderColor: string;
}

export type GridConfigType = "square" | "hex-flat" | "hex-pointy";

const STORAGE_KEY = "gridConfigs";

const DEFAULT_CONFIGS: Record<GridConfigType, GridConfig> = {
    square: {
        cols: 20,
        rows: 20,
        tileSize: 30,
        ppi: 80,
        borderWidth: 1,
        borderColor: "#000000",
    },
    "hex-flat": {
        cols: 30, // More columns for flat hex since they're wider
        rows: 25,
        tileSize: 30,
        ppi: 80,
        borderWidth: 1,
        borderColor: "#000000",
    },
    "hex-pointy": {
        cols: 25, // Fewer columns for pointy hex since they're taller
        rows: 30, // More rows
        tileSize: 30,
        ppi: 80,
        borderWidth: 1,
        borderColor: "#000000",
    },
};

export const saveGridConfig = (type: GridConfigType, config: GridConfig) => {
    try {
        const existingConfigs = getGridConfigs();
        const updatedConfigs = {
            ...existingConfigs,
            [type]: config,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs));
    } catch (error) {
        console.warn("Failed to save grid config:", error);
    }
};

export const getGridConfig = (type: GridConfigType): GridConfig => {
    try {
        const configs = getGridConfigs();
        return configs[type] || DEFAULT_CONFIGS[type];
    } catch (error) {
        console.warn("Failed to load grid config:", error);
        return DEFAULT_CONFIGS[type];
    }
};

const getGridConfigs = (): Record<GridConfigType, GridConfig> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                square: { ...DEFAULT_CONFIGS.square, ...parsed.square },
                "hex-flat": {
                    ...DEFAULT_CONFIGS["hex-flat"],
                    ...parsed["hex-flat"],
                },
                "hex-pointy": {
                    ...DEFAULT_CONFIGS["hex-pointy"],
                    ...parsed["hex-pointy"],
                },
            };
        }
    } catch (error) {
        console.warn("Failed to parse stored configs:", error);
    }
    return DEFAULT_CONFIGS;
};

export const getGridConfigType = (gridType: string): GridConfigType => {
    if (gridType === "square") return "square";
    if (gridType.includes("flat")) return "hex-flat";
    return "hex-pointy";
};
