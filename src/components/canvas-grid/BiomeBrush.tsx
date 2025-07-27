/** @format */

import React from "react";
import { Label } from "@/components/ui/label";

const BIOMES = [
    { name: "Arctic", color: "#E3F2FD" },
    { name: "Bog", color: "#4A5D23" },
    { name: "Desert", color: "#F4A460" },
    { name: "Forest", color: "#228B22" },
    { name: "Hills", color: "#8FBC8F" },
    { name: "Jungle", color: "#006400" },
    { name: "Mountains", color: "#696969" },
    { name: "Plains", color: "#9ACD32" },
    { name: "Road", color: "#708090" },
    { name: "Woodland", color: "#32CD32" },
] as const;

interface BiomeBrushProps {
    selectedBiome: string | null;
    onBiomeSelect: (color: string | null) => void;
}

export const BiomeBrush: React.FC<BiomeBrushProps> = ({
    selectedBiome,
    onBiomeSelect,
}) => {
    return (
        <div className="space-y-3">
            <div>
                <Label className="text-sm font-medium">Biomes</Label>
                <div className="text-xs">
                    Click a biome to activate its brush.
                </div>
            </div>

            {/* Reset button */}
            <button
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-gray-300 transition-colors hover:bg-gray-50 ${
                    selectedBiome === null
                        ? "bg-blue-100 ring-2 ring-blue-300"
                        : "bg-white"
                }`}
                onClick={() => onBiomeSelect(null)}
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                </svg>
                <span className="text-xs font-medium">Cursor</span>
            </button>

            <div className="grid grid-cols-3 gap-1">
                {BIOMES.map((b) => (
                    <div
                        key={b.name}
                        className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md transition-colors hover:bg-gray-100 ${
                            selectedBiome === b.color
                                ? "bg-blue-100 ring-2 ring-blue-300"
                                : ""
                        }`}
                        onClick={() =>
                            onBiomeSelect(
                                selectedBiome === b.color ? null : b.color
                            )
                        }
                    >
                        <div
                            className="flex-shrink-0 w-4 h-4 border border-gray-300 rounded"
                            style={{ backgroundColor: b.color }}
                        />
                        <span className="overflow-hidden text-xs">
                            {b.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export { BIOMES };
