/** @format */

// components/grid/BorderControls.tsx
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                        Border Width: {borderWidth}px
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
                            Using default settings, FoundryVTT does not support
                            a border. We automatically set it to 0 upon export,
                            so don't worry 😁
                        </TooltipContent>
                    </Tooltip>
                </div>
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
