import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useMemo, useEffect } from "react";
import { Doc } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";


type PartyWithOptimistic = (Doc<"parties"> | {
  _id: string;
  name: string;
  levels: { level: number; quantity: number }[];
  _creationTime: number;
  isOptimistic: true;
}) & { isOptimistic?: boolean };

interface PartyFormProps {
  partyName: string;
  setPartyName: (name: string) => void;
  levels: { level: number; quantity: number }[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitText: string;
  addLevel: () => void;
  removeLevel: (index: number) => void;
  updateLevel: (index: number, field: 'level' | 'quantity', value: number) => void;
}

function PartyForm({ 
  partyName, 
  setPartyName, 
  levels, 
  onSubmit, 
  onCancel, 
  submitText,
  addLevel,
  removeLevel,
  updateLevel
}: PartyFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="partyName">Party Name</Label>
        <Input
          id="partyName"
          value={partyName}
          onChange={(e) => setPartyName(e.target.value)}
          placeholder="Enter party name"
          className="mt-1"
        />
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label>Character Levels</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLevel}>
            <Plus className="w-4 h-4 mr-1" />
            Add Level
          </Button>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {levels.map((levelData, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <Label className="text-xs">Level</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={levelData.level}
                  onChange={(e) => updateLevel(index, 'level', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={levelData.quantity}
                  onChange={(e) => updateLevel(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeLevel(index)}
                className="mt-5"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        
        {levels.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No character levels added yet
          </p>
        )}
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {submitText}
        </Button>
      </div>
    </form>
  );
}

export function PartyManager() {
  const serverParties = useQuery(api.parties.list) || [];
  const createParty = useMutation(api.parties.create);
  const updateParty = useMutation(api.parties.update);
  const deleteParty = useMutation(api.parties.remove);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Doc<"parties"> | null>(null);
  const [partyName, setPartyName] = useState("");
  const [levels, setLevels] = useState<{ level: number; quantity: number }[]>([]);
  const [optimisticParties, setOptimisticParties] = useState<Array<{
    _id: string;
    name: string;
    levels: { level: number; quantity: number }[];
    _creationTime: number;
    isOptimistic: true;
  }>>([]);
  const [optimisticEdits, setOptimisticEdits] = useState<Set<string>>(new Set());

  // Remove optimistic parties that now exist on the server
  useEffect(() => {
    if (serverParties.length > 0 && optimisticParties.length > 0) {
      const filteredOptimistic = optimisticParties.filter(optimistic => 
        !serverParties.some(server => 
          server.name === optimistic.name && 
          JSON.stringify(server.levels) === JSON.stringify(optimistic.levels)
        )
      );
      
      // Only update if there's actually a change
      if (filteredOptimistic.length !== optimisticParties.length) {
        setOptimisticParties(filteredOptimistic);
      }
    }
  }, [serverParties.length, JSON.stringify(optimisticParties)]);

  // Combine server parties with optimistic parties, excluding those being optimistically edited
  const parties = useMemo((): PartyWithOptimistic[] => {
    const combined: PartyWithOptimistic[] = [
      ...serverParties
        .filter(p => !optimisticEdits.has(p._id))
        .map(p => ({ ...p, isOptimistic: false as const })),
      ...optimisticParties
    ];
    return combined.sort((a, b) => b._creationTime - a._creationTime);
  }, [serverParties, optimisticParties, optimisticEdits]);

  const addLevel = () => {
    setLevels([...levels, { level: 1, quantity: 1 }]);
  };

  const removeLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
  };

  const updateLevel = (index: number, field: 'level' | 'quantity', value: number) => {
    const newLevels = [...levels];
    newLevels[index][field] = value;
    setLevels(newLevels);
  };

  const clearForm = () => {
    setPartyName("");
    setLevels([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partyName.trim()) {
      toast.error("Party name is required");
      return;
    }

    if (levels.length === 0) {
      toast.error("At least one character level is required");
      return;
    }

    const filteredLevels = levels.filter(l => l.level > 0 && l.quantity > 0);
    const newParty = {
      name: partyName.trim(),
      levels: filteredLevels,
    };

    // Create optimistic party with temporary ID
    const optimisticParty = {
      _id: `temp-${Date.now()}`,
      name: newParty.name,
      levels: newParty.levels,
      _creationTime: Date.now(),
      isOptimistic: true as const,
    };

    // Add optimistic party immediately
    setOptimisticParties(prev => [optimisticParty, ...prev]);

    // Clear form immediately for optimistic UI
    clearForm();
    setOpen(false);
    toast.success("Party created successfully!");

    try {
      await createParty(newParty);
      // Success - the optimistic party will be removed when server data updates
    } catch (error) {
      // If the mutation fails, remove optimistic party and restore form
      setOptimisticParties(prev => prev.filter(p => p._id !== optimisticParty._id));
      toast.error("Failed to create party");
      setPartyName(newParty.name);
      setLevels(newParty.levels);
      setOpen(true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingParty) return;
    
    if (!partyName.trim()) {
      toast.error("Party name is required");
      return;
    }

    if (levels.length === 0) {
      toast.error("At least one character level is required");
      return;
    }

    const filteredLevels = levels.filter(l => l.level > 0 && l.quantity > 0);
    const updatedData = { name: partyName.trim(), levels: filteredLevels };
    const originalParty = editingParty;

    // Create optimistic edit
    const optimisticParty = {
      _id: `temp-edit-${editingParty._id}-${Date.now()}`,
      name: updatedData.name,
      levels: updatedData.levels,
      _creationTime: editingParty._creationTime,
      isOptimistic: true as const,
    };

    // Hide original and show optimistic version
    setOptimisticEdits(prev => new Set(prev).add(originalParty._id));
    setOptimisticParties(prev => [optimisticParty, ...prev]);
    
    clearForm();
    setEditingParty(null);
    setEditOpen(false);
    toast.success("Party updated successfully!");

    try {
      await updateParty({
        id: originalParty._id,
        name: updatedData.name,
        levels: updatedData.levels,
      });
      
      // Remove optimistic party and show updated server party
      setOptimisticParties(prev => prev.filter(p => p._id !== optimisticParty._id));
      setOptimisticEdits(prev => {
        const newSet = new Set(prev);
        newSet.delete(originalParty._id);
        return newSet;
      });
    } catch (error) {
      // Rollback on error
      setOptimisticParties(prev => prev.filter(p => p._id !== optimisticParty._id));
      setOptimisticEdits(prev => {
        const newSet = new Set(prev);
        newSet.delete(originalParty._id);
        return newSet;
      });
      toast.error("Failed to update party");
      setEditingParty(originalParty);
      setPartyName(updatedData.name);
      setLevels(updatedData.levels);
      setEditOpen(true);
    }
  };

  const handleEditParty = (party: Doc<"parties">) => {
    setEditingParty(party);
    setPartyName(party.name);
    setLevels(party.levels);
    setEditOpen(true);
  };

  const handleDeleteParty = async (id: string) => {
    try {
      await deleteParty({ id: id as any });
      toast.success("Party deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete party");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Parties</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Party
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Party</DialogTitle>
            </DialogHeader>
            <PartyForm
              partyName={partyName}
              setPartyName={setPartyName}
              levels={levels}
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
              submitText="Create Party"
              addLevel={addLevel}
              removeLevel={removeLevel}
              updateLevel={updateLevel}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Party Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Party</DialogTitle>
            </DialogHeader>
            <PartyForm
              partyName={partyName}
              setPartyName={setPartyName}
              levels={levels}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditOpen(false)}
              submitText="Update Party"
              addLevel={addLevel}
              removeLevel={removeLevel}
              updateLevel={updateLevel}
            />
          </DialogContent>
        </Dialog>
      </div>

      {parties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No parties created yet</p>
          <p className="text-gray-400">Click "Add Party" to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parties.map((party) => (
            <Card key={party._id} className={`hover:shadow-md transition-shadow ${party.isOptimistic ? 'opacity-70 animate-pulse' : ''}`}>
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 pr-8">
                    {party.name}
                    {party.isOptimistic && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Saving...
                      </span>
                    )}
                  </CardTitle>
                  {!party.isOptimistic && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditParty(party as Doc<"parties">)}
                      className="absolute top-4 right-12 h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {!party.isOptimistic && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Party</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{party.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteParty(party._id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Character Levels:</p>
                  <div className="flex flex-wrap gap-1">
                    {party.levels
                      .sort((a, b) => a.level - b.level)
                      .map((levelData, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          Level {levelData.level} × {levelData.quantity}
                        </Badge>
                      ))}
                  </div>
                  <div className="pt-2 text-xs text-gray-500">
                    Total Characters: {party.levels.reduce((sum, l) => sum + l.quantity, 0)}
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
