/** @format */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Monitor } from "lucide-react";
import { GridType } from "../CanvasGrid";
import {
    saveGridConfig,
    getGridConfig,
    getGridConfigType,
    type GridConfig,
    type GridConfigType,
} from "@/utils/gridConfigStorage";

const TV_SIZES = [
    { label: '24"', inches: 24 },
    { label: '27"', inches: 27 },
    { label: '32"', inches: 32 },
    { label: '43"', inches: 43 },
    { label: '50"', inches: 50 },
    { label: '55"', inches: 55 },
    { label: '65"', inches: 65 },
    { label: '75"', inches: 75 },
    { label: '85"', inches: 85 },
] as const;

const TV_SIZES_CM = [
    { label: "61cm", inches: 24 },
    { label: "69cm", inches: 27 },
    { label: "81cm", inches: 32 },
    { label: "109cm", inches: 43 },
    { label: "127cm", inches: 50 },
    { label: "140cm", inches: 55 },
    { label: "165cm", inches: 65 },
    { label: "191cm", inches: 75 },
    { label: "216cm", inches: 85 },
] as const;

const RESOLUTIONS = [
    { label: "1080p", width: 1920, height: 1080 },
    { label: "1440p", width: 2560, height: 1440 },
    { label: "4K", width: 3840, height: 2160 },
    { label: "8K", width: 7680, height: 4320 },
] as const;

const TILE_SIZES = [
    { label: "1 inch tiles", inches: 1.0 },
    { label: "2cm tiles", inches: 0.787 },
] as const;

interface PresetSelection {
    tvSize: number; // inches
    resolution: { width: number; height: number };
    tileSize: number; // inches
}

interface DisplayPresetsProps {
    currentGridType: GridType;
    onPresetSelect: (preset: {
        ppi: number;
        tileSize: number;
        cols: number;
        rows: number;
        displayName: string;
    }) => void;
}

export const DisplayPresets: React.FC<DisplayPresetsProps> = ({
    currentGridType,
    onPresetSelect,
}) => {
    const [open, setOpen] = useState(false);
    const [sizeUnit, setSizeUnit] = useState<"inches" | "cm">("inches");
    const [selectedTvSize, setSelectedTvSize] = useState<string>("55");
    const [selectedResolution, setSelectedResolution] = useState<string>("4K");
    const [selectedTileSize, setSelectedTileSize] =
        useState<string>("1 inch tiles");

    const calculatePreset = (): PresetSelection => {
        const tvSizeInches = parseFloat(selectedTvSize);
        const resolution = RESOLUTIONS.find(
            (r) => r.label === selectedResolution
        )!;
        const tileSize = TILE_SIZES.find(
            (t) => t.label === selectedTileSize
        )!.inches;

        return {
            tvSize: tvSizeInches,
            resolution,
            tileSize,
        };
    };

    const calculateGridDimensions = (
        physicalWidthInches: number,
        physicalHeightInches: number,
        tileSize: number,
        configType: GridConfigType
    ) => {
        let cols, rows;

        switch (configType) {
            case "square":
                cols = Math.floor(physicalWidthInches / tileSize);
                rows = Math.floor(physicalHeightInches / tileSize);
                break;
            case "hex-flat":
                cols = Math.floor((physicalWidthInches / tileSize) * 1.3);
                rows = Math.floor((physicalHeightInches / tileSize) * 1.15);
                break;
            case "hex-pointy":
                cols = Math.floor((physicalWidthInches / tileSize) * 1.15);
                rows = Math.floor((physicalHeightInches / tileSize) * 1.3);
                break;
        }

        return { cols, rows };
    };

    const handleApply = () => {
        const preset = calculatePreset();

        // Calculate PPI using diagonal
        const diagonalPixels = Math.sqrt(
            preset.resolution.width ** 2 + preset.resolution.height ** 2
        );
        const ppi = Math.floor(diagonalPixels / preset.tvSize);

        // Calculate physical dimensions
        const physicalWidthInches = preset.resolution.width / ppi;
        const physicalHeightInches = preset.resolution.height / ppi;

        // Calculate tile size in pixels
        const tileSizePixels = Math.round(preset.tileSize * ppi);

        const displayName = `${preset.tvSize}" ${selectedResolution} (${selectedTileSize})`;

        // Calculate and save configurations for all grid types
        const configTypes: GridConfigType[] = [
            "square",
            "hex-flat",
            "hex-pointy",
        ];

        configTypes.forEach((configType) => {
            const { cols, rows } = calculateGridDimensions(
                physicalWidthInches,
                physicalHeightInches,
                preset.tileSize,
                configType
            );

            // Get existing config to preserve border settings
            const existingConfig = getGridConfig(configType);

            const calculatedConfig: GridConfig = {
                cols,
                rows,
                tileSize: tileSizePixels,
                ppi,
                borderWidth: existingConfig.borderWidth,
                borderColor: existingConfig.borderColor,
            };

            saveGridConfig(configType, calculatedConfig);
        });

        // Get the dimensions for the current grid type to pass to the callback
        const currentConfigType = getGridConfigType(currentGridType);
        const { cols, rows } = calculateGridDimensions(
            physicalWidthInches,
            physicalHeightInches,
            preset.tileSize,
            currentConfigType
        );

        // Call the preset select handler
        onPresetSelect({
            ppi,
            tileSize: tileSizePixels,
            cols,
            rows,
            displayName,
        });

        setOpen(false);
    };

    const currentSizes = sizeUnit === "inches" ? TV_SIZES : TV_SIZES_CM;

    return (
        <div className="space-y-3">
            <TooltipProvider delayDuration={0}>
                <Dialog
                    open={open}
                    onOpenChange={setOpen}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                >
                                    <Monitor />
                                </Button>
                            </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Configure Display Preset</p>
                        </TooltipContent>
                    </Tooltip>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Configure Display Preset</DialogTitle>
                            <DialogDescription>
                                This is for displaying battle maps on a
                                horizontal TV or monitor at 100% zoom. It fills
                                the screen and sizes tiles so your minis and
                                tokens fit perfectly without any manual scaling.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Size Unit Toggle */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">
                                    Measurement Unit
                                </Label>
                                <RadioGroup
                                    value={sizeUnit}
                                    onValueChange={(value: "inches" | "cm") => {
                                        setSizeUnit(value);
                                        setSelectedTvSize(
                                            value === "inches" ? "55" : "140cm"
                                        );
                                    }}
                                    className="flex space-x-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="inches"
                                            id="inches"
                                        />
                                        <Label
                                            htmlFor="inches"
                                            className="text-sm"
                                        >
                                            Inches
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value="cm"
                                            id="cm"
                                        />
                                        <Label
                                            htmlFor="cm"
                                            className="text-sm"
                                        >
                                            Centimeters
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* TV Size */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">
                                    TV/Monitor Size
                                </Label>
                                <RadioGroup
                                    value={selectedTvSize}
                                    onValueChange={setSelectedTvSize}
                                    className="grid grid-cols-3 gap-2"
                                >
                                    {currentSizes.map((size) => (
                                        <div
                                            key={size.label}
                                            className="flex items-center space-x-2"
                                        >
                                            <RadioGroupItem
                                                value={size.inches.toString()}
                                                id={size.label}
                                            />
                                            <Label
                                                htmlFor={size.label}
                                                className="text-sm"
                                            >
                                                {size.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {/* Resolution */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">
                                    Resolution
                                </Label>
                                <RadioGroup
                                    value={selectedResolution}
                                    onValueChange={setSelectedResolution}
                                    className="grid grid-cols-2 gap-2"
                                >
                                    {RESOLUTIONS.map((resolution) => (
                                        <div
                                            key={resolution.label}
                                            className="flex items-center space-x-2"
                                        >
                                            <RadioGroupItem
                                                value={resolution.label}
                                                id={resolution.label}
                                            />
                                            <Label
                                                htmlFor={resolution.label}
                                                className="text-sm"
                                            >
                                                {resolution.label}
                                                <span className="block text-xs text-muted-foreground">
                                                    {resolution.width}×
                                                    {resolution.height}
                                                </span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {/* Tile Size */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">
                                    Tile Size
                                </Label>
                                <RadioGroup
                                    value={selectedTileSize}
                                    onValueChange={setSelectedTileSize}
                                    className="space-y-2"
                                >
                                    {TILE_SIZES.map((tile) => (
                                        <div
                                            key={tile.label}
                                            className="flex items-center space-x-2"
                                        >
                                            <RadioGroupItem
                                                value={tile.label}
                                                id={tile.label}
                                            />
                                            <Label
                                                htmlFor={tile.label}
                                                className="text-sm"
                                            >
                                                {tile.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleApply}>Apply Preset</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </TooltipProvider>
        </div>
    );
};
