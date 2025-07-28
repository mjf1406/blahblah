/** @format */

// components/canvas-grid/ToolPalette.tsx
import React from "react";
import {
    HelpCircle,
    MousePointer2,
    Paintbrush,
    Eraser,
    Hand,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export type Tool = "select" | "paint" | "erase" | "pan";

interface ToolPaletteProps {
    selectedTool: Tool;
    onToolSelect: (tool: Tool) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
    onResetCanvas: () => void;
    zoomLevel: number;
}

const ToolPalette: React.FC<ToolPaletteProps> = ({
    selectedTool,
    onToolSelect,
    onZoomIn,
    onZoomOut,
    onResetView,
    onResetCanvas,
    zoomLevel,
}) => {
    const tools = [
        {
            id: "select" as Tool,
            icon: MousePointer2,
            label: "Select Tool",
            description: "Default selection tool",
        },
        // {
        //     id: "paint" as Tool,
        //     icon: Paintbrush,
        //     label: "Paint Tool",
        //     description: "Left click to paint tiles",
        // },
        // {
        //     id: "erase" as Tool,
        //     icon: Eraser,
        //     label: "Erase Tool",
        //     description: "Left click to erase tiles",
        // },
        // {
        //     id: "pan" as Tool,
        //     icon: Hand,
        //     label: "Pan Tool",
        //     description: "Click and drag to pan the view",
        // },
    ];

    const actions = [
        {
            id: "zoom-in",
            icon: ZoomIn,
            label: "Zoom In",
            description: "Zoom in on the canvas",
            onClick: onZoomIn,
        },
        {
            id: "zoom-out",
            icon: ZoomOut,
            label: "Zoom Out",
            description: "Zoom out of the canvas",
            onClick: onZoomOut,
        },
        {
            id: "reset-view",
            icon: Move,
            label: "Reset View",
            description: "Reset pan and zoom to default",
            onClick: onResetView,
        },
        {
            id: "reset-canvas",
            icon: RotateCcw,
            label: "Reset Canvas",
            description: "Clear all painted tiles",
            onClick: onResetCanvas,
        },
    ];

    const controlsHelp = (
        <div className="space-y-2 text-sm">
            <div className="mb-2 font-semibold">Canvas Controls:</div>
            <div className="space-y-1">
                <div>
                    <strong>Left Click:</strong> Paint/Select (tool dependent)
                </div>
                <div>
                    <strong>Right Click:</strong> Erase tile
                </div>
                <div>
                    <strong>Middle Click + Drag:</strong> Pan view
                </div>
                <div>
                    <strong>Mouse Wheel:</strong> Zoom in/out
                </div>
                <div>
                    <strong>Current Zoom:</strong> {Math.round(zoomLevel * 100)}
                    %
                </div>
            </div>
        </div>
    );

    return (
        <TooltipProvider delayDuration={300}>
            <div className="fixed z-50 bottom-4 right-4">
                <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {/* Tools Section */}
                    <div className="flex flex-col gap-1">
                        <div className="py-1 text-xs font-medium text-center text-gray-500">
                            Tools
                        </div>
                        {tools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <Tooltip key={tool.id}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={
                                                selectedTool === tool.id
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            size="icon"
                                            className="justify-center gap-2"
                                            onClick={() =>
                                                onToolSelect(tool.id)
                                            }
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="sr-only">
                                                {tool.label}
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="left"
                                        className="max-w-xs"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {tool.label}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {tool.description}
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}

                        <Separator className="my-2" />

                        {/* Actions Section */}
                        <div className="py-1 text-xs font-medium text-center text-gray-500">
                            Actions
                        </div>
                        {actions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Tooltip key={action.id}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="justify-center gap-1"
                                            onClick={action.onClick}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="sr-only">
                                                {action.label}
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="left"
                                        className="max-w-xs"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {action.label}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {action.description}
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}

                        <Separator className="my-2" />

                        {/* Help Section */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="justify-center gap-1"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    <span className="sr-only">Help</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="left"
                                className="max-w-xs"
                            >
                                {controlsHelp}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default ToolPalette;
