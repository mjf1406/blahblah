/** @format */

// components/grid/BorderControls.tsx
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BorderControlsProps {
    borderWidth: number;
    borderColor: string;
    onBorderWidthChange: (width: number) => void;
    onBorderColorChange: (color: string) => void;
}

export const BorderControls: React.FC<BorderControlsProps> = ({
    borderWidth,
    borderColor,
    onBorderWidthChange,
    onBorderColorChange,
}) => {
    return (
        <div className="space-y-4">
            <div>
                <Label className="text-sm font-medium">
                    Border Width: {borderWidth}px
                </Label>
                <Slider
                    value={[borderWidth]}
                    onValueChange={(v) => onBorderWidthChange(v[0])}
                    min={0}
                    max={10}
                    step={1}
                    className="mt-2"
                />
            </div>
            <div>
                <Label className="text-sm font-medium">Border Color</Label>
                <Input
                    type="color"
                    value={borderColor}
                    onChange={(e) => onBorderColorChange(e.target.value)}
                    className="w-full h-10 mt-2"
                />
            </div>
        </div>
    );
};
