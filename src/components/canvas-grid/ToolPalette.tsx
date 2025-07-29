/** @format */

import React from "react";
import {
    HelpCircle,
    MousePointer2,
    ZoomIn,
    ZoomOut,
    Move,
    RotateCcw,
    FileJson,
    ImageDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";

export type Tool = "select" | "paint" | "erase" | "pan";

interface ToolPaletteProps {
    selectedTool: Tool;
    onToolSelect: (tool: Tool) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
    onResetCanvas: () => void;
    onExportImage: (fmt: "webp" | "png" | "jpeg") => void;
    onExportData: (type: "json" | "uvtt" | "foundry") => void;
    zoomLevel: number;
}

const ToolPalette: React.FC<ToolPaletteProps> = ({
    selectedTool,
    onToolSelect,
    onZoomIn,
    onZoomOut,
    onResetView,
    onResetCanvas,
    onExportImage,
    onExportData,
    zoomLevel,
}) => {
    const [isFoundryDialogOpen, setIsFoundryDialogOpen] = React.useState(false);

    const tools = [
        { id: "select" as Tool, icon: MousePointer2, label: "Select Tool" },
        // … add paint/erase/pan if desired …
    ];

    return (
        <TooltipProvider delayDuration={300}>
            <div className="fixed z-50 bottom-4 right-4">
                <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="flex flex-col gap-1">
                        {/* Tools */}
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
                                    <TooltipContent side="left">
                                        {tool.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}

                        <Separator className="my-2" />

                        {/* Actions */}
                        <div className="py-1 text-xs font-medium text-center text-gray-500">
                            Actions
                        </div>
                        {[
                            {
                                icon: ZoomIn,
                                onClick: onZoomIn,
                                label: "Zoom In",
                            },
                            {
                                icon: ZoomOut,
                                onClick: onZoomOut,
                                label: "Zoom Out",
                            },
                            {
                                icon: Move,
                                onClick: onResetView,
                                label: "Reset View",
                            },
                            {
                                icon: RotateCcw,
                                onClick: onResetCanvas,
                                label: "Reset Canvas",
                            },
                        ].map((act) => {
                            const Icon = act.icon;
                            return (
                                <Tooltip key={act.label}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={act.onClick}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="sr-only">
                                                {act.label}
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        {act.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}

                        <Separator className="my-2" />

                        {/* Export Image */}
                        <div className="py-1 text-xs font-medium text-center text-gray-500">
                            Export
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                >
                                    <ImageDown className="w-4 h-4" />
                                    <span className="sr-only">
                                        Export Image
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top">
                                <DropdownMenuItem
                                    onClick={() => onExportImage("webp")}
                                >
                                    WebP
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onExportImage("png")}
                                >
                                    PNG
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onExportImage("jpeg")}
                                >
                                    JPG
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Export Data */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                >
                                    <FileJson className="w-4 h-4" />
                                    <span className="sr-only">Export Data</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top">
                                <DropdownMenuItem
                                    onClick={() => onExportData("json")}
                                >
                                    JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onExportData("uvtt")}
                                >
                                    UVTT
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        onExportData("foundry");
                                        setIsFoundryDialogOpen(true);
                                    }}
                                >
                                    FoundryVTT
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Separator className="my-2" />

                        {/* Help */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    <span className="sr-only">Help</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="left"
                                className="max-w-xs"
                            >
                                <div className="space-y-2 text-sm">
                                    <div className="mb-2 font-semibold">
                                        Canvas Controls:
                                    </div>
                                    <div className="space-y-1">
                                        <div>
                                            <strong>Left Click:</strong>{" "}
                                            Paint/Select
                                        </div>
                                        <div>
                                            <strong>Right Click:</strong> Erase
                                            tile
                                        </div>
                                        <div>
                                            <strong>
                                                Middle Click + Drag:
                                            </strong>{" "}
                                            Pan view
                                        </div>
                                        <div>
                                            <strong>Mouse Wheel:</strong> Zoom
                                            in/out
                                        </div>
                                        <div>
                                            <strong>Current Zoom:</strong>{" "}
                                            {Math.round(zoomLevel * 100)}%
                                        </div>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Foundry Import Dialog */}
                <Dialog
                    open={isFoundryDialogOpen}
                    onOpenChange={setIsFoundryDialogOpen}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Import into FoundryVTT</DialogTitle>
                            <DialogDescription>
                                Follow these steps to import the map you just
                                downloaded into FoundryVTT.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 text-sm">
                            <ol className="list-decimal list-inside">
                                <li>Create a new scene.</li>
                                <li>
                                    Right click that scene and click{" "}
                                    <b>Import Data</b>.
                                </li>
                                <li>
                                    Choose the <i>_foundry.json</i> file and
                                    then click the <b>Import</b> button.
                                </li>
                                <li>
                                    Right click the same scene and click{" "}
                                    <b>Configure</b>.
                                </li>
                                <li>
                                    On the <i>Basic</i> tab, upload a{" "}
                                    <i>Background Image</i> by choosing the WEBP
                                    file that was downloaded.
                                </li>
                                <li>All done! 🎉</li>
                            </ol>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button>Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
};

export default ToolPalette;
