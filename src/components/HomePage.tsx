import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Users, Swords, Globe, Map } from "lucide-react";

export function HomePage() {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold text-primary">D&D Manager</h1>
        <p className="max-w-2xl mx-auto text-xl text-foreground">
          Your complete toolkit for managing D&D campaigns. Organize parties, create encounters, 
          build worlds, and design maps all in one place.
        </p>
      </div>
      
      <div className="grid max-w-2xl grid-cols-2 gap-4 mx-auto md:grid-cols-4">
        <Link to="/parties">
          <Button size="lg" className="flex-col w-full h-20 gap-2">
            <Users className="w-6 h-6" />
            <span>Parties</span>
          </Button>
        </Link>
        <Link to="/encounters">
          <Button variant="outline" size="lg" className="flex-col w-full h-20 gap-2">
            <Swords className="w-6 h-6" />
            <span>Encounters</span>
          </Button>
        </Link>
        <Link to="/worlds">
          <Button variant="outline" size="lg" className="flex-col w-full h-20 gap-2">
            <Globe className="w-6 h-6" />
            <span>Worlds</span>
          </Button>
        </Link>
        <Link to="/maps">
          <Button variant="outline" size="lg" className="flex-col w-full h-20 gap-2">
            <Map className="w-6 h-6" />
            <span>Maps</span>
          </Button>
        </Link>
        <Link to="/canvas">
          <Button variant="outline" size="lg" className="flex-col w-full h-20 gap-2">
            <Map className="w-6 h-6" />
            <span>Canvas</span>
          </Button>
        </Link>
      </div>

      <div className="grid max-w-6xl gap-6 mx-auto mt-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 border rounded-lg">
          <Users className="w-8 h-8 mb-3 text-primary" />
          <h3 className="mb-2 text-lg font-semibold">Manage Parties</h3>
          <p className="text-gray-600">Track character levels and party compositions for all your campaigns.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <Swords className="w-8 h-8 mb-3 text-primary" />
          <h3 className="mb-2 text-lg font-semibold">Create Encounters</h3>
          <p className="text-gray-600">Design balanced encounters with monsters and difficulty ratings.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <Globe className="w-8 h-8 mb-3 text-primary" />
          <h3 className="mb-2 text-lg font-semibold">Build Worlds</h3>
          <p className="text-gray-600">Create rich campaign settings with locations and lore.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <Map className="w-8 h-8 mb-3 text-primary" />
          <h3 className="mb-2 text-lg font-semibold">Design Maps</h3>
          <p className="text-gray-600">Organize battle maps, world maps, and dungeon layouts.</p>
        </div>
      </div>
    </div>
  );
}
