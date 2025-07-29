/** @format */

// components/grid/TileSizeControls.tsx
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { MAX_PPI, MAX_TILE_SIZE, MIN_PPI, MIN_TILE_SIZE } from "../CanvasGrid";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
    minTileSize = MIN_TILE_SIZE,
    maxTileSize = MAX_TILE_SIZE,
    minPpi = MIN_PPI,
    maxPpi = MAX_PPI,
}) => {
    const tileSizeInches = tileSize / ppi;

    return (
        <div className="space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                        Tile Size: {tileSize}px ({tileSizeInches.toFixed(2)}″)
                    </Label>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <img
                                src="/assets/img/fvtt.png"
                                alt="FoundryVTT icon"
                                width={16}
                                height={16}
                                className="cursor-help"
                            />
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            className="max-w-xs"
                        >
                            FoundryVTT requires a minimum Tile Size of
                            50&nbsp;px. We automatically set it to a minimum of
                            50 upon export, so don't worry 😁
                        </TooltipContent>
                    </Tooltip>
                </div>
                <Slider
                    value={[tileSize]}
                    onValueChange={(v) => onTileSizeChange(v[0])}
                    min={minTileSize}
                    max={maxTileSize}
                    step={1}
                    className="mt-2"
                />
            </div>
            <div className="hidden">
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
