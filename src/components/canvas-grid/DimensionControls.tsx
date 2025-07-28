/** @format */

// components/grid/DimensionControls.tsx
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface DimensionControlsProps {
    cols: number;
    rows: number;
    onColsChange: (cols: number) => void;
    onRowsChange: (rows: number) => void;
    maxCols?: number;
    maxRows?: number;
    hasWebGL?: boolean;
}

export const DimensionControls: React.FC<DimensionControlsProps> = ({
    cols,
    rows,
    onColsChange,
    onRowsChange,
    maxCols = 50,
    maxRows = 50,
    hasWebGL = false,
}) => {
    const [colsInput, setColsInput] = useState(cols.toString());
    const [rowsInput, setRowsInput] = useState(rows.toString());

    const getTooltipMessage = (dimension: "width" | "height") => {
        const limit = dimension === "width" ? maxCols : maxRows;
        return hasWebGL
            ? `You can have up to ${limit.toLocaleString()} tiles in ${dimension} with WebGL acceleration because you have a graphics card.`
            : `You can have up to ${limit} tiles in ${dimension} without WebGL acceleration because you don't have a WebGL-capable graphics cards`;
    };

    const validateAndUpdateCols = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 1 && num <= maxCols) {
            onColsChange(num);
            setColsInput(num.toString());
        } else {
            setColsInput(cols.toString());
        }
    };

    const validateAndUpdateRows = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 1 && num <= maxRows) {
            onRowsChange(num);
            setRowsInput(num.toString());
        } else {
            setRowsInput(rows.toString());
        }
    };

    const handleColsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            validateAndUpdateCols(colsInput);
            e.currentTarget.blur();
        }
    };

    const handleRowsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            validateAndUpdateRows(rowsInput);
            e.currentTarget.blur();
        }
    };

    // Update local state when props change (from slider or external changes)
    if (
        cols.toString() !== colsInput &&
        document.activeElement?.tagName !== "INPUT"
    ) {
        setColsInput(cols.toString());
    }
    if (
        rows.toString() !== rowsInput &&
        document.activeElement?.tagName !== "INPUT"
    ) {
        setRowsInput(rows.toString());
    }

    return (
        <div className="space-y-4">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                        <Label className="text-sm font-medium">
                            Width: {cols} tiles
                        </Label>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                                <p className="text-xs">
                                    {getTooltipMessage("width")}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <Input
                        value={colsInput}
                        onChange={(e) => setColsInput(e.target.value)}
                        onBlur={() => validateAndUpdateCols(colsInput)}
                        onKeyDown={handleColsKeyDown}
                        className="w-16 h-8 text-xs text-center"
                        placeholder={cols.toString()}
                    />
                </div>
                <Slider
                    value={[cols]}
                    onValueChange={(v) => onColsChange(v[0])}
                    min={1}
                    max={maxCols}
                    step={1}
                />
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                        <Label className="text-sm font-medium">
                            Height: {rows} tiles
                        </Label>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                                <p className="text-xs">
                                    {getTooltipMessage("height")}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <Input
                        value={rowsInput}
                        onChange={(e) => setRowsInput(e.target.value)}
                        onBlur={() => validateAndUpdateRows(rowsInput)}
                        onKeyDown={handleRowsKeyDown}
                        className="w-16 h-8 text-xs text-center"
                        placeholder={rows.toString()}
                    />
                </div>
                <Slider
                    value={[rows]}
                    onValueChange={(v) => onRowsChange(v[0])}
                    min={1}
                    max={maxRows}
                    step={1}
                />
            </div>
        </div>
    );
};
