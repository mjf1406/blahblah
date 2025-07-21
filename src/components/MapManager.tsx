/** @format */

// src/components/MapManager.tsx
/** @format */

import { useQuery, useMutation } from "convex/react";
import type { Doc } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { useState, useMemo, useEffect } from "react";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, Trash2, Edit, Map, Grid } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "./ui/alert-dialog";
import { usePersistedQuery } from "@/hooks/usePersistsedQuery";

type MapWithOptimistic = (
    | Doc<"maps">
    | {
          _id: string;
          name: string;
          description: string;
          type: string;
          gridSize?: string;
          dimensions?: { width: number; height: number };
          worldId?: string;
          _creationTime: number;
          isOptimistic: true;
      }
) & { isOptimistic?: boolean };

export function MapManager() {
    const { data: serverMaps = [] as Doc<"maps">[] } = usePersistedQuery(
        api.maps.list,
        "maps-list"
    );
    const worlds = useQuery(api.worlds.list) || [];
    const createMap = useMutation(api.maps.create);
    const updateMap = useMutation(api.maps.update);
    const deleteMap = useMutation(api.maps.remove);

    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingMap, setEditingMap] = useState<Doc<"maps"> | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("");
    const [gridSize, setGridSize] = useState("none");
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [worldId, setWorldId] = useState<string>("none");
    const [optimisticMaps, setOptimisticMaps] = useState<
        Array<{
            _id: string;
            name: string;
            description: string;
            type: string;
            gridSize?: string;
            dimensions?: { width: number; height: number };
            worldId?: string;
            _creationTime: number;
            isOptimistic: true;
        }>
    >([]);
    const [optimisticEdits, setOptimisticEdits] = useState<Set<string>>(
        new Set()
    );

    // Remove optimistic maps that now exist on the server
    useEffect(() => {
        if (serverMaps.length > 0 && optimisticMaps.length > 0) {
            const filteredOptimistic = optimisticMaps.filter(
                (optimistic) =>
                    !serverMaps.some(
                        (server: Doc<"maps">) =>
                            server.name === optimistic.name &&
                            server.description === optimistic.description &&
                            server.type === optimistic.type
                    )
            );

            if (filteredOptimistic.length !== optimisticMaps.length) {
                setOptimisticMaps(filteredOptimistic);
            }
        }
    }, [serverMaps, optimisticMaps]);

    // Combine server maps with optimistic maps, excluding those being optimistically edited
    const maps = useMemo((): MapWithOptimistic[] => {
        const combined: MapWithOptimistic[] = [
            ...serverMaps
                .filter((m: Doc<"maps">) => !optimisticEdits.has(m._id))
                .map((m: Doc<"maps">) => ({
                    ...m,
                    isOptimistic: false as const,
                })),
            ...optimisticMaps,
        ];
        return combined.sort((a, b) => b._creationTime - a._creationTime);
    }, [serverMaps, optimisticMaps, optimisticEdits]);

    const clearForm = () => {
        setName("");
        setDescription("");
        setType("");
        setGridSize("none");
        setDimensions({ width: 0, height: 0 });
        setWorldId("none");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Map name is required");
            return;
        }
        if (!type) {
            toast.error("Map type is required");
            return;
        }

        const newMap = {
            name: name.trim(),
            description: description.trim(),
            type,
            gridSize: gridSize === "none" ? undefined : gridSize,
            dimensions:
                dimensions.width > 0 && dimensions.height > 0
                    ? dimensions
                    : undefined,
            worldId: worldId === "none" ? undefined : (worldId as any),
        };

        // Create optimistic map with temporary ID
        const optimisticMap = {
            _id: `temp-${Date.now()}`,
            name: newMap.name,
            description: newMap.description,
            type: newMap.type,
            gridSize: newMap.gridSize,
            dimensions: newMap.dimensions,
            worldId: newMap.worldId,
            _creationTime: Date.now(),
            isOptimistic: true as const,
        };

        // Add optimistic map immediately
        setOptimisticMaps((prev) => [optimisticMap, ...prev]);

        // Clear form immediately for optimistic UI
        clearForm();
        setOpen(false);
        toast.success("Map created successfully!");

        try {
            await createMap(newMap);
            // Success - the optimistic map will be removed when server data updates
        } catch {
            // If the mutation fails, remove optimistic map and restore form
            setOptimisticMaps((prev) =>
                prev.filter((m) => m._id !== optimisticMap._id)
            );
            toast.error("Failed to create map");
            setName(newMap.name);
            setDescription(newMap.description);
            setType(newMap.type);
            setGridSize(newMap.gridSize || "none");
            setDimensions(newMap.dimensions || { width: 0, height: 0 });
            setWorldId(newMap.worldId || "none");
            setOpen(true);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMap) return;
        if (!name.trim()) {
            toast.error("Map name is required");
            return;
        }
        if (!type) {
            toast.error("Map type is required");
            return;
        }

        const updatedData = {
            name: name.trim(),
            description: description.trim(),
            type,
            gridSize: gridSize === "none" ? undefined : gridSize,
            dimensions:
                dimensions.width > 0 && dimensions.height > 0
                    ? dimensions
                    : undefined,
            worldId: worldId === "none" ? undefined : (worldId as any),
        };
        const originalMap = editingMap;

        // Create optimistic edit
        const optimisticMap = {
            _id: `temp-edit-${editingMap._id}-${Date.now()}`,
            name: updatedData.name,
            description: updatedData.description,
            type: updatedData.type,
            gridSize: updatedData.gridSize,
            dimensions: updatedData.dimensions,
            worldId: updatedData.worldId,
            _creationTime: editingMap._creationTime,
            isOptimistic: true as const,
        };

        // Hide original and show optimistic version
        setOptimisticEdits((prev) => new Set(prev).add(originalMap._id));
        setOptimisticMaps((prev) => [optimisticMap, ...prev]);

        clearForm();
        setEditingMap(null);
        setEditOpen(false);
        toast.success("Map updated successfully!");

        try {
            await updateMap({
                id: originalMap._id,
                name: updatedData.name,
                description: updatedData.description,
                type: updatedData.type,
                gridSize: updatedData.gridSize,
                dimensions: updatedData.dimensions,
                worldId: updatedData.worldId,
            });

            // Remove optimistic map and show updated server map
            setOptimisticMaps((prev) =>
                prev.filter((m) => m._id !== optimisticMap._id)
            );
            setOptimisticEdits((prev) => {
                const newSet = new Set(prev);
                newSet.delete(originalMap._id);
                return newSet;
            });
        } catch {
            // Rollback on error
            setOptimisticMaps((prev) =>
                prev.filter((m) => m._id !== optimisticMap._id)
            );
            setOptimisticEdits((prev) => {
                const newSet = new Set(prev);
                newSet.delete(originalMap._id);
                return newSet;
            });
            toast.error("Failed to update map");
            setEditingMap(originalMap);
            setName(updatedData.name);
            setDescription(updatedData.description);
            setType(updatedData.type);
            setGridSize(updatedData.gridSize || "none");
            setDimensions(updatedData.dimensions || { width: 0, height: 0 });
            setWorldId(updatedData.worldId || "none");
            setEditOpen(true);
        }
    };

    const handleEdit = (map: Doc<"maps">) => {
        setEditingMap(map);
        setName(map.name);
        setDescription(map.description);
        setType(map.type);
        setGridSize(map.gridSize || "none");
        setDimensions(map.dimensions || { width: 0, height: 0 });
        setWorldId(map.worldId || "none");
        setEditOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteMap({ id: id as any });
            toast.success("Map deleted successfully!");
        } catch {
            toast.error("Failed to delete map");
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "Battle Map":
                return "bg-red-100 text-red-800";
            case "World Map":
                return "bg-blue-100 text-blue-800";
            case "Dungeon Map":
                return "bg-purple-100 text-purple-800";
            case "City Map":
                return "bg-green-100 text-green-800";
            case "Regional Map":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getWorldName = (worldId: string) => {
        const world = worlds.find((w) => w._id === worldId);
        return world?.name || "Unknown World";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Maps</h1>
                <Dialog
                    open={open}
                    onOpenChange={setOpen}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Map
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Map</DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => void handleSubmit(e)}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="name">Map Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter map name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Describe the map..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="type">Map Type</Label>
                                    <Select
                                        value={type}
                                        onValueChange={setType}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Battle Map">
                                                Battle Map
                                            </SelectItem>
                                            <SelectItem value="World Map">
                                                World Map
                                            </SelectItem>
                                            <SelectItem value="Dungeon Map">
                                                Dungeon Map
                                            </SelectItem>
                                            <SelectItem value="City Map">
                                                City Map
                                            </SelectItem>
                                            <SelectItem value="Regional Map">
                                                Regional Map
                                            </SelectItem>
                                            <SelectItem value="Other">
                                                Other
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="gridSize">
                                        Grid Size (Optional)
                                    </Label>
                                    <Select
                                        value={gridSize}
                                        onValueChange={setGridSize}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select grid size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                No Grid
                                            </SelectItem>
                                            <SelectItem value="5ft">
                                                5 feet
                                            </SelectItem>
                                            <SelectItem value="10ft">
                                                10 feet
                                            </SelectItem>
                                            <SelectItem value="1 mile">
                                                1 mile
                                            </SelectItem>
                                            <SelectItem value="10 miles">
                                                10 miles
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Dimensions (Optional)</Label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <Input
                                        type="number"
                                        placeholder="Width"
                                        value={dimensions.width || ""}
                                        onChange={(e) =>
                                            setDimensions((prev) => ({
                                                ...prev,
                                                width:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            }))
                                        }
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Height"
                                        value={dimensions.height || ""}
                                        onChange={(e) =>
                                            setDimensions((prev) => ({
                                                ...prev,
                                                height:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="world">
                                    Associated World (Optional)
                                </Label>
                                <Select
                                    value={worldId}
                                    onValueChange={setWorldId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select world" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            No World
                                        </SelectItem>
                                        {worlds.map((world) => (
                                            <SelectItem
                                                key={world._id}
                                                value={world._id}
                                            >
                                                {world.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                >
                                    Create Map
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                >
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Map</DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => void handleEditSubmit(e)}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="editName">Map Name</Label>
                                <Input
                                    id="editName"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter map name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="editDescription">
                                    Description
                                </Label>
                                <Textarea
                                    id="editDescription"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Describe the map..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="editType">Map Type</Label>
                                    <Select
                                        value={type}
                                        onValueChange={setType}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Battle Map">
                                                Battle Map
                                            </SelectItem>
                                            <SelectItem value="World Map">
                                                World Map
                                            </SelectItem>
                                            <SelectItem value="Dungeon Map">
                                                Dungeon Map
                                            </SelectItem>
                                            <SelectItem value="City Map">
                                                City Map
                                            </SelectItem>
                                            <SelectItem value="Regional Map">
                                                Regional Map
                                            </SelectItem>
                                            <SelectItem value="Other">
                                                Other
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="editGridSize">
                                        Grid Size (Optional)
                                    </Label>
                                    <Select
                                        value={gridSize}
                                        onValueChange={setGridSize}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select grid size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                No Grid
                                            </SelectItem>
                                            <SelectItem value="5ft">
                                                5 feet
                                            </SelectItem>
                                            <SelectItem value="10ft">
                                                10 feet
                                            </SelectItem>
                                            <SelectItem value="1 mile">
                                                1 mile
                                            </SelectItem>
                                            <SelectItem value="10 miles">
                                                10 miles
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Dimensions (Optional)</Label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <Input
                                        type="number"
                                        placeholder="Width"
                                        value={dimensions.width || ""}
                                        onChange={(e) =>
                                            setDimensions((prev) => ({
                                                ...prev,
                                                width:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            }))
                                        }
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Height"
                                        value={dimensions.height || ""}
                                        onChange={(e) =>
                                            setDimensions((prev) => ({
                                                ...prev,
                                                height:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="editWorld">
                                    Associated World (Optional)
                                </Label>
                                <Select
                                    value={worldId}
                                    onValueChange={setWorldId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select world" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            No World
                                        </SelectItem>
                                        {worlds.map((world) => (
                                            <SelectItem
                                                key={world._id}
                                                value={world._id}
                                            >
                                                {world.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                >
                                    Update Map
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {maps.length === 0 ? (
                <div className="py-12 text-center">
                    <Map className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg text-gray-500">No maps created yet</p>
                    <p className="text-gray-400">
                        Click "Add Map" to get started
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {maps.map((map) => (
                        <Card
                            key={map._id}
                            className={`hover:shadow-md transition-shadow ${
                                map.isOptimistic
                                    ? "opacity-70 animate-pulse"
                                    : ""
                            }`}
                        >
                            <CardHeader className="relative">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="flex items-center gap-2 pr-8 text-lg">
                                        {map.name}
                                        {map.isOptimistic && (
                                            <span className="px-2 py-1 text-xs rounded text-muted-foreground bg-muted">
                                                Saving...
                                            </span>
                                        )}
                                    </CardTitle>
                                    {!map.isOptimistic && (
                                        <div className="absolute flex gap-1 top-4 right-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleEdit(
                                                        map as Doc<"maps">
                                                    )
                                                }
                                                className="w-8 h-8 p-0 hover:bg-gray-100"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-8 h-8 p-0 hover:bg-red-100 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Delete Map
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you
                                                            want to delete "
                                                            {map.name}"? This
                                                            action cannot be
                                                            undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() =>
                                                                void handleDelete(
                                                                    map._id
                                                                )
                                                            }
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={getTypeColor(map.type)}>
                                        {map.type}
                                    </Badge>
                                    {map.gridSize && (
                                        <Badge
                                            variant="outline"
                                            className="flex items-center gap-1"
                                        >
                                            <Grid className="w-3 h-3" />
                                            {map.gridSize}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {map.description && (
                                        <p className="text-sm text-gray-600">
                                            {map.description}
                                        </p>
                                    )}
                                    <div className="space-y-2">
                                        {map.dimensions && (
                                            <div className="text-xs text-gray-500">
                                                <span className="font-medium">
                                                    Dimensions:
                                                </span>{" "}
                                                {map.dimensions.width} ×{" "}
                                                {map.dimensions.height}
                                            </div>
                                        )}
                                        {map.worldId && (
                                            <div className="text-xs text-gray-500">
                                                <span className="font-medium">
                                                    World:
                                                </span>{" "}
                                                {getWorldName(map.worldId)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
