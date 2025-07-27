/** @format */

// components/grid/TileSizeControls.tsx
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface TileSizeControlsProps {
    tileSize: number;
    ppi: number;
    onTileSizeChange: (size: number) => void;
    onPpiChange: (ppi: number) => void;
    minTileSize?: number;
    maxTileSize?: number;
    minPpi?: number;
    maxPpi?: number;
}

export const TileSizeControls: React.FC<TileSizeControlsProps> = ({
    tileSize,
    ppi,
    onTileSizeChange,
    onPpiChange,
    minTileSize = 10,
    maxTileSize = 100,
    minPpi = 40,
    maxPpi = 140,
}) => {
    const tileSizeInches = tileSize / ppi;

    return (
        <div className="space-y-4">
            <div>
                <Label className="text-sm font-medium">
                    Tile Size: {tileSize}px ({tileSizeInches.toFixed(2)}″)
                </Label>
                <Slider
                    value={[tileSize]}
                    onValueChange={(v) => onTileSizeChange(v[0])}
                    min={minTileSize}
                    max={maxTileSize}
                    step={1}
                    className="mt-2"
                />
            </div>
            <div>
                <Label className="text-sm font-medium">PPI: {ppi}</Label>
                <Slider
                    value={[ppi]}
                    onValueChange={(v) => onPpiChange(v[0])}
                    min={minPpi}
                    max={maxPpi}
                    step={1}
                    className="mt-2"
                />
            </div>
        </div>
    );
};
