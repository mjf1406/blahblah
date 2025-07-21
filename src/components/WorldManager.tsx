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
import { Plus, Trash2, Edit, Globe, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

type WorldWithOptimistic = (Doc<"worlds"> | {
  _id: string;
  name: string;
  description: string;
  setting: string;
  locations: { name: string; type: string; description: string }[];
  _creationTime: number;
  isOptimistic: true;
}) & { isOptimistic?: boolean };

export function WorldManager() {
  const serverWorlds = useQuery(api.worlds.list) || [];
  const createWorld = useMutation(api.worlds.create);
  const updateWorld = useMutation(api.worlds.update);
  const deleteWorld = useMutation(api.worlds.remove);
  
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingWorld, setEditingWorld] = useState<Doc<"worlds"> | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [setting, setSetting] = useState("");
  const [locations, setLocations] = useState<{ name: string; type: string; description: string }[]>([]);
  const [optimisticWorlds, setOptimisticWorlds] = useState<Array<{
    _id: string;
    name: string;
    description: string;
    setting: string;
    locations: { name: string; type: string; description: string }[];
    _creationTime: number;
    isOptimistic: true;
  }>>([]);
  const [optimisticEdits, setOptimisticEdits] = useState<Set<string>>(new Set());

  // Remove optimistic worlds that now exist on the server
  useEffect(() => {
    if (serverWorlds.length > 0 && optimisticWorlds.length > 0) {
      const filteredOptimistic = optimisticWorlds.filter(optimistic => 
        !serverWorlds.some(server => 
          server.name === optimistic.name && 
          server.description === optimistic.description &&
          server.setting === optimistic.setting
        )
      );
      
      if (filteredOptimistic.length !== optimisticWorlds.length) {
        setOptimisticWorlds(filteredOptimistic);
      }
    }
  }, [serverWorlds.length, JSON.stringify(optimisticWorlds)]);

  // Combine server worlds with optimistic worlds, excluding those being optimistically edited
  const worlds = useMemo((): WorldWithOptimistic[] => {
    const combined: WorldWithOptimistic[] = [
      ...serverWorlds
        .filter(w => !optimisticEdits.has(w._id))
        .map(w => ({ ...w, isOptimistic: false as const })),
      ...optimisticWorlds
    ];
    return combined.sort((a, b) => b._creationTime - a._creationTime);
  }, [serverWorlds, optimisticWorlds, optimisticEdits]);

  const clearForm = () => {
    setName("");
    setDescription("");
    setSetting("");
    setLocations([]);
  };

  const addLocation = () => {
    setLocations([...locations, { name: "", type: "", description: "" }]);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const updateLocation = (index: number, field: keyof typeof locations[0], value: string) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], [field]: value };
    setLocations(newLocations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("World name is required");
      return;
    }

    if (!setting) {
      toast.error("Setting is required");
      return;
    }

    const filteredLocations = locations.filter(l => l.name.trim());
    const newWorld = {
      name: name.trim(),
      description: description.trim(),
      setting,
      locations: filteredLocations,
    };

    // Create optimistic world with temporary ID
    const optimisticWorld = {
      _id: `temp-${Date.now()}`,
      name: newWorld.name,
      description: newWorld.description,
      setting: newWorld.setting,
      locations: newWorld.locations,
      _creationTime: Date.now(),
      isOptimistic: true as const,
    };

    // Add optimistic world immediately
    setOptimisticWorlds(prev => [optimisticWorld, ...prev]);

    // Clear form immediately for optimistic UI
    clearForm();
    setOpen(false);
    toast.success("World created successfully!");

    try {
      await createWorld(newWorld);
      // Success - the optimistic world will be removed when server data updates
    } catch (error) {
      // If the mutation fails, remove optimistic world and restore form
      setOptimisticWorlds(prev => prev.filter(w => w._id !== optimisticWorld._id));
      toast.error("Failed to create world");
      setName(newWorld.name);
      setDescription(newWorld.description);
      setSetting(newWorld.setting);
      setLocations(newWorld.locations);
      setOpen(true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingWorld) return;
    
    if (!name.trim()) {
      toast.error("World name is required");
      return;
    }

    if (!setting) {
      toast.error("Setting is required");
      return;
    }

    const filteredLocations = locations.filter(l => l.name.trim());
    const updatedData = {
      name: name.trim(),
      description: description.trim(),
      setting,
      locations: filteredLocations,
    };
    const originalWorld = editingWorld;

    // Create optimistic edit
    const optimisticWorld = {
      _id: `temp-edit-${editingWorld._id}-${Date.now()}`,
      name: updatedData.name,
      description: updatedData.description,
      setting: updatedData.setting,
      locations: updatedData.locations,
      _creationTime: editingWorld._creationTime,
      isOptimistic: true as const,
    };

    // Hide original and show optimistic version
    setOptimisticEdits(prev => new Set(prev).add(originalWorld._id));
    setOptimisticWorlds(prev => [optimisticWorld, ...prev]);
    
    clearForm();
    setEditingWorld(null);
    setEditOpen(false);
    toast.success("World updated successfully!");

    try {
      await updateWorld({
        id: originalWorld._id,
        name: updatedData.name,
        description: updatedData.description,
        setting: updatedData.setting,
        locations: updatedData.locations,
      });
      
      // Remove optimistic world and show updated server world
      setOptimisticWorlds(prev => prev.filter(w => w._id !== optimisticWorld._id));
      setOptimisticEdits(prev => {
        const newSet = new Set(prev);
        newSet.delete(originalWorld._id);
        return newSet;
      });
    } catch (error) {
      // Rollback on error
      setOptimisticWorlds(prev => prev.filter(w => w._id !== optimisticWorld._id));
      setOptimisticEdits(prev => {
        const newSet = new Set(prev);
        newSet.delete(originalWorld._id);
        return newSet;
      });
      toast.error("Failed to update world");
      setEditingWorld(originalWorld);
      setName(updatedData.name);
      setDescription(updatedData.description);
      setSetting(updatedData.setting);
      setLocations(updatedData.locations);
      setEditOpen(true);
    }
  };

  const handleEdit = (world: Doc<"worlds">) => {
    setEditingWorld(world);
    setName(world.name);
    setDescription(world.description);
    setSetting(world.setting);
    setLocations(world.locations);
    setEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorld({ id: id as any });
      toast.success("World deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete world");
    }
  };

  const getSettingColor = (setting: string) => {
    switch (setting) {
      case "Fantasy": return "bg-purple-100 text-purple-800";
      case "Sci-Fi": return "bg-blue-100 text-blue-800";
      case "Modern": return "bg-green-100 text-green-800";
      case "Historical": return "bg-yellow-100 text-yellow-800";
      case "Post-Apocalyptic": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Worlds</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add World
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New World</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">World Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter world name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the world..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="setting">Setting</Label>
                <Select value={setting} onValueChange={setSetting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select setting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fantasy">Fantasy</SelectItem>
                    <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                    <SelectItem value="Modern">Modern</SelectItem>
                    <SelectItem value="Historical">Historical</SelectItem>
                    <SelectItem value="Post-Apocalyptic">Post-Apocalyptic</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Locations</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Location
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {locations.map((location, index) => (
                    <div key={index} className="p-3 border rounded space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Location name"
                          value={location.name}
                          onChange={(e) => updateLocation(index, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Select 
                          value={location.type} 
                          onValueChange={(value) => updateLocation(index, 'type', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="City">City</SelectItem>
                            <SelectItem value="Town">Town</SelectItem>
                            <SelectItem value="Village">Village</SelectItem>
                            <SelectItem value="Dungeon">Dungeon</SelectItem>
                            <SelectItem value="Wilderness">Wilderness</SelectItem>
                            <SelectItem value="Landmark">Landmark</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLocation(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Location description"
                        value={location.description}
                        onChange={(e) => updateLocation(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create World
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit World</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="editName">World Name</Label>
                <Input
                  id="editName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter world name"
                />
              </div>
              
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the world..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="editSetting">Setting</Label>
                <Select value={setting} onValueChange={setSetting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select setting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fantasy">Fantasy</SelectItem>
                    <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                    <SelectItem value="Modern">Modern</SelectItem>
                    <SelectItem value="Historical">Historical</SelectItem>
                    <SelectItem value="Post-Apocalyptic">Post-Apocalyptic</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Locations</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Location
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {locations.map((location, index) => (
                    <div key={index} className="p-3 border rounded space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Location name"
                          value={location.name}
                          onChange={(e) => updateLocation(index, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Select 
                          value={location.type} 
                          onValueChange={(value) => updateLocation(index, 'type', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="City">City</SelectItem>
                            <SelectItem value="Town">Town</SelectItem>
                            <SelectItem value="Village">Village</SelectItem>
                            <SelectItem value="Dungeon">Dungeon</SelectItem>
                            <SelectItem value="Wilderness">Wilderness</SelectItem>
                            <SelectItem value="Landmark">Landmark</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLocation(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Location description"
                        value={location.description}
                        onChange={(e) => updateLocation(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Update World
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {worlds.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No worlds created yet</p>
          <p className="text-gray-400">Click "Add World" to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {worlds.map((world) => (
            <Card key={world._id} className={`hover:shadow-md transition-shadow ${world.isOptimistic ? 'opacity-70 animate-pulse' : ''}`}>
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 pr-8">
                    {world.name}
                    {world.isOptimistic && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Saving...
                      </span>
                    )}
                  </CardTitle>
                  {!world.isOptimistic && (
                    <div className="absolute top-4 right-4 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(world as Doc<"worlds">)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete World</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{world.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(world._id)}
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
                <Badge className={getSettingColor(world.setting)}>
                  {world.setting}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {world.description && (
                    <p className="text-sm text-gray-600">{world.description}</p>
                  )}
                  
                  {world.locations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Locations ({world.locations.length})
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {world.locations.slice(0, 3).map((location, index) => (
                          <div key={index} className="text-xs text-gray-500 flex justify-between">
                            <span>{location.name}</span>
                            <Badge variant="outline" className="text-xs py-0 px-1">
                              {location.type}
                            </Badge>
                          </div>
                        ))}
                        {world.locations.length > 3 && (
                          <p className="text-xs text-gray-400">
                            +{world.locations.length - 3} more...
                          </p>
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
