/** @format */

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useMemo, useEffect } from "react";
import { Doc } from "../../convex/_generated/dataModel";
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
import { Plus, Trash2, Edit, Swords } from "lucide-react";
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

type EncounterWithOptimistic = (
    | Doc<"encounters">
    | {
          _id: string;
          name: string;
          description: string;
          difficulty: string;
          partyLevel: number;
          monsters: { name: string; quantity: number; cr: string }[];
          _creationTime: number;
          isOptimistic: true;
      }
) & { isOptimistic?: boolean };

export function EncounterManager() {
    const { data: serverEncounters = [] as Doc<"encounters">[] } =
        usePersistedQuery(api.encounters.list, "encounters-list");
    const createEncounter = useMutation(api.encounters.create);
    const updateEncounter = useMutation(api.encounters.update);
    const deleteEncounter = useMutation(api.encounters.remove);

    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingEncounter, setEditingEncounter] =
        useState<Doc<"encounters"> | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [partyLevel, setPartyLevel] = useState(1);
    const [monsters, setMonsters] = useState<
        { name: string; quantity: number; cr: string }[]
    >([]);
    const [optimisticEncounters, setOptimisticEncounters] = useState<
        Array<{
            _id: string;
            name: string;
            description: string;
            difficulty: string;
            partyLevel: number;
            monsters: { name: string; quantity: number; cr: string }[];
            _creationTime: number;
            isOptimistic: true;
        }>
    >([]);
    const [optimisticEdits, setOptimisticEdits] = useState<Set<string>>(
        new Set()
    );

    // Remove optimistic encounters that now exist on the server
    useEffect(() => {
        if (serverEncounters.length > 0 && optimisticEncounters.length > 0) {
            const filteredOptimistic = optimisticEncounters.filter(
                (optimistic) =>
                    !serverEncounters.some(
                        (server: Doc<"encounters">) =>
                            server.name === optimistic.name &&
                            server.description === optimistic.description &&
                            server.difficulty === optimistic.difficulty
                    )
            );

            if (filteredOptimistic.length !== optimisticEncounters.length) {
                setOptimisticEncounters(filteredOptimistic);
            }
        }
    }, [serverEncounters.length, JSON.stringify(optimisticEncounters)]);

    // Combine server encounters with optimistic encounters, excluding those being optimistically edited
    const encounters = useMemo((): EncounterWithOptimistic[] => {
        const combined: EncounterWithOptimistic[] = [
            ...serverEncounters
                .filter((e: Doc<"encounters">) => !optimisticEdits.has(e._id))
                .map((e: Doc<"encounters">) => ({
                    ...e,
                    isOptimistic: false as const,
                })),
            ...optimisticEncounters,
        ];
        return combined.sort((a, b) => b._creationTime - a._creationTime);
    }, [serverEncounters, optimisticEncounters, optimisticEdits]);

    const clearForm = () => {
        setName("");
        setDescription("");
        setDifficulty("");
        setPartyLevel(1);
        setMonsters([]);
    };

    const addMonster = () => {
        setMonsters([...monsters, { name: "", quantity: 1, cr: "1/4" }]);
    };

    const removeMonster = (index: number) => {
        setMonsters(monsters.filter((_, i) => i !== index));
    };

    const updateMonster = (
        index: number,
        field: keyof (typeof monsters)[0],
        value: string | number
    ) => {
        const newMonsters = [...monsters];
        newMonsters[index] = { ...newMonsters[index], [field]: value };
        setMonsters(newMonsters);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Encounter name is required");
            return;
        }

        if (!difficulty) {
            toast.error("Difficulty is required");
            return;
        }

        const filteredMonsters = monsters.filter((m) => m.name.trim());
        const newEncounter = {
            name: name.trim(),
            description: description.trim(),
            difficulty,
            partyLevel,
            monsters: filteredMonsters,
        };

        // Create optimistic encounter with temporary ID
        const optimisticEncounter = {
            _id: `temp-${Date.now()}`,
            name: newEncounter.name,
            description: newEncounter.description,
            difficulty: newEncounter.difficulty,
            partyLevel: newEncounter.partyLevel,
            monsters: newEncounter.monsters,
            _creationTime: Date.now(),
            isOptimistic: true as const,
        };

        // Add optimistic encounter immediately
        setOptimisticEncounters((prev) => [optimisticEncounter, ...prev]);

        // Clear form immediately for optimistic UI
        clearForm();
        setOpen(false);
        toast.success("Encounter created successfully!");

        try {
            await createEncounter(newEncounter);
            // Success - the optimistic encounter will be removed when server data updates
        } catch (error) {
            // If the mutation fails, remove optimistic encounter and restore form
            setOptimisticEncounters((prev) =>
                prev.filter((e) => e._id !== optimisticEncounter._id)
            );
            toast.error("Failed to create encounter");
            setName(newEncounter.name);
            setDescription(newEncounter.description);
            setDifficulty(newEncounter.difficulty);
            setPartyLevel(newEncounter.partyLevel);
            setMonsters(newEncounter.monsters);
            setOpen(true);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingEncounter) return;

        if (!name.trim()) {
            toast.error("Encounter name is required");
            return;
        }

        if (!difficulty) {
            toast.error("Difficulty is required");
            return;
        }

        const filteredMonsters = monsters.filter((m) => m.name.trim());
        const updatedData = {
            name: name.trim(),
            description: description.trim(),
            difficulty,
            partyLevel,
            monsters: filteredMonsters,
        };
        const originalEncounter = editingEncounter;

        // Create optimistic edit
        const optimisticEncounter = {
            _id: `temp-edit-${editingEncounter._id}-${Date.now()}`,
            name: updatedData.name,
            description: updatedData.description,
            difficulty: updatedData.difficulty,
            partyLevel: updatedData.partyLevel,
            monsters: updatedData.monsters,
            _creationTime: editingEncounter._creationTime,
            isOptimistic: true as const,
        };

        // Hide original and show optimistic version
        setOptimisticEdits((prev) => new Set(prev).add(originalEncounter._id));
        setOptimisticEncounters((prev) => [optimisticEncounter, ...prev]);

        clearForm();
        setEditingEncounter(null);
        setEditOpen(false);
        toast.success("Encounter updated successfully!");

        try {
            await updateEncounter({
                id: originalEncounter._id,
                name: updatedData.name,
                description: updatedData.description,
                difficulty: updatedData.difficulty,
                partyLevel: updatedData.partyLevel,
                monsters: updatedData.monsters,
            });

            // Remove optimistic encounter and show updated server encounter
            setOptimisticEncounters((prev) =>
                prev.filter((e) => e._id !== optimisticEncounter._id)
            );
            setOptimisticEdits((prev) => {
                const newSet = new Set(prev);
                newSet.delete(originalEncounter._id);
                return newSet;
            });
        } catch (error) {
            // Rollback on error
            setOptimisticEncounters((prev) =>
                prev.filter((e) => e._id !== optimisticEncounter._id)
            );
            setOptimisticEdits((prev) => {
                const newSet = new Set(prev);
                newSet.delete(originalEncounter._id);
                return newSet;
            });
            toast.error("Failed to update encounter");
            setEditingEncounter(originalEncounter);
            setName(updatedData.name);
            setDescription(updatedData.description);
            setDifficulty(updatedData.difficulty);
            setPartyLevel(updatedData.partyLevel);
            setMonsters(updatedData.monsters);
            setEditOpen(true);
        }
    };

    const handleEdit = (encounter: Doc<"encounters">) => {
        setEditingEncounter(encounter);
        setName(encounter.name);
        setDescription(encounter.description);
        setDifficulty(encounter.difficulty);
        setPartyLevel(encounter.partyLevel);
        setMonsters(encounter.monsters);
        setEditOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteEncounter({ id: id as any });
            toast.success("Encounter deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete encounter");
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "Easy":
                return "bg-green-100 text-green-800";
            case "Medium":
                return "bg-yellow-100 text-yellow-800";
            case "Hard":
                return "bg-orange-100 text-orange-800";
            case "Deadly":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Encounters</h1>
                <Dialog
                    open={open}
                    onOpenChange={setOpen}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Encounter
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Encounter</DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => void handleSubmit(e)}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="name">Encounter Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter encounter name"
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
                                    placeholder="Describe the encounter..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="difficulty">
                                        Difficulty
                                    </Label>
                                    <Select
                                        value={difficulty}
                                        onValueChange={setDifficulty}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Easy">
                                                Easy
                                            </SelectItem>
                                            <SelectItem value="Medium">
                                                Medium
                                            </SelectItem>
                                            <SelectItem value="Hard">
                                                Hard
                                            </SelectItem>
                                            <SelectItem value="Deadly">
                                                Deadly
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="partyLevel">
                                        Party Level
                                    </Label>
                                    <Input
                                        id="partyLevel"
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={partyLevel}
                                        onChange={(e) =>
                                            setPartyLevel(
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Monsters</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addMonster}
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Monster
                                    </Button>
                                </div>

                                <div className="space-y-2 overflow-y-auto max-h-48">
                                    {monsters.map((monster, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 p-2 border rounded"
                                        >
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="Monster name"
                                                    value={monster.name}
                                                    onChange={(e) =>
                                                        updateMonster(
                                                            index,
                                                            "name",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="w-20">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Qty"
                                                    value={monster.quantity}
                                                    onChange={(e) =>
                                                        updateMonster(
                                                            index,
                                                            "quantity",
                                                            parseInt(
                                                                e.target.value
                                                            ) || 1
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="w-20">
                                                <Input
                                                    placeholder="CR"
                                                    value={monster.cr}
                                                    onChange={(e) =>
                                                        updateMonster(
                                                            index,
                                                            "cr",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    removeMonster(index)
                                                }
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
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
                                    Create Encounter
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
                            <DialogTitle>Edit Encounter</DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => void handleEditSubmit(e)}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="editName">Encounter Name</Label>
                                <Input
                                    id="editName"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter encounter name"
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
                                    placeholder="Describe the encounter..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="editDifficulty">
                                        Difficulty
                                    </Label>
                                    <Select
                                        value={difficulty}
                                        onValueChange={setDifficulty}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Easy">
                                                Easy
                                            </SelectItem>
                                            <SelectItem value="Medium">
                                                Medium
                                            </SelectItem>
                                            <SelectItem value="Hard">
                                                Hard
                                            </SelectItem>
                                            <SelectItem value="Deadly">
                                                Deadly
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="editPartyLevel">
                                        Party Level
                                    </Label>
                                    <Input
                                        id="editPartyLevel"
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={partyLevel}
                                        onChange={(e) =>
                                            setPartyLevel(
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Monsters</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addMonster}
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Monster
                                    </Button>
                                </div>

                                <div className="space-y-2 overflow-y-auto max-h-48">
                                    {monsters.map((monster, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 p-2 border rounded"
                                        >
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="Monster name"
                                                    value={monster.name}
                                                    onChange={(e) =>
                                                        updateMonster(
                                                            index,
                                                            "name",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="w-20">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Qty"
                                                    value={monster.quantity}
                                                    onChange={(e) =>
                                                        updateMonster(
                                                            index,
                                                            "quantity",
                                                            parseInt(
                                                                e.target.value
                                                            ) || 1
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="w-20">
                                                <Input
                                                    placeholder="CR"
                                                    value={monster.cr}
                                                    onChange={(e) =>
                                                        updateMonster(
                                                            index,
                                                            "cr",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    removeMonster(index)
                                                }
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
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
                                    Update Encounter
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {encounters.length === 0 ? (
                <div className="py-12 text-center">
                    <Swords className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg text-gray-500">
                        No encounters created yet
                    </p>
                    <p className="text-gray-400">
                        Click "Add Encounter" to get started
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {encounters.map((encounter) => (
                        <Card
                            key={encounter._id}
                            className={`hover:shadow-md transition-shadow ${encounter.isOptimistic ? "opacity-70 animate-pulse" : ""}`}
                        >
                            <CardHeader className="relative">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="flex items-center gap-2 pr-8 text-lg">
                                        {encounter.name}
                                        {encounter.isOptimistic && (
                                            <span className="px-2 py-1 text-xs rounded text-muted-foreground bg-muted">
                                                Saving...
                                            </span>
                                        )}
                                    </CardTitle>
                                    {!encounter.isOptimistic && (
                                        <div className="absolute flex gap-1 top-4 right-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleEdit(
                                                        encounter as Doc<"encounters">
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
                                                            Delete Encounter
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you
                                                            want to delete "
                                                            {encounter.name}"?
                                                            This action cannot
                                                            be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() =>
                                                                void handleDelete(
                                                                    encounter._id
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
                                <div className="flex items-center gap-2">
                                    <Badge
                                        className={getDifficultyColor(
                                            encounter.difficulty
                                        )}
                                    >
                                        {encounter.difficulty}
                                    </Badge>
                                    <Badge variant="outline">
                                        Level {encounter.partyLevel}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {encounter.description && (
                                        <p className="text-sm text-gray-600">
                                            {encounter.description}
                                        </p>
                                    )}

                                    {encounter.monsters.length > 0 && (
                                        <div>
                                            <p className="mb-1 text-sm font-medium text-gray-600">
                                                Monsters:
                                            </p>
                                            <div className="space-y-1">
                                                {encounter.monsters.map(
                                                    (monster, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex justify-between text-xs text-gray-500"
                                                        >
                                                            <span>
                                                                {monster.name}
                                                            </span>
                                                            <span>
                                                                ×
                                                                {
                                                                    monster.quantity
                                                                }{" "}
                                                                (CR {monster.cr}
                                                                )
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
