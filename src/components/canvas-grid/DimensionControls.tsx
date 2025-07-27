/** @format */

// components/grid/DimensionControls.tsx
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface DimensionControlsProps {
    cols: number;
    rows: number;
    onColsChange: (cols: number) => void;
    onRowsChange: (rows: number) => void;
    maxCols?: number;
    maxRows?: number;
}

export const DimensionControls: React.FC<DimensionControlsProps> = ({
    cols,
    rows,
    onColsChange,
    onRowsChange,
    maxCols = 50,
    maxRows = 50,
}) => {
    return (
        <div className="space-y-4">
            <div>
                <Label className="text-sm font-medium">
                    Width: {cols} tiles
                </Label>
                <Slider
                    value={[cols]}
                    onValueChange={(v) => onColsChange(v[0])}
                    min={1}
                    max={maxCols}
                    step={1}
                    className="mt-2"
                />
            </div>
            <div>
                <Label className="text-sm font-medium">
                    Height: {rows} tiles
                </Label>
                <Slider
                    value={[rows]}
                    onValueChange={(v) => onRowsChange(v[0])}
                    min={1}
                    max={maxRows}
                    step={1}
                    className="mt-2"
                />
            </div>
        </div>
    );
};
