import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Users, Plus, Swords, Globe, Map } from "lucide-react";

export function HomePage() {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold text-primary">D&D Manager</h1>
        <p className="text-xl text-secondary max-w-2xl mx-auto">
          Your complete toolkit for managing D&D campaigns. Organize parties, create encounters, 
          build worlds, and design maps all in one place.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        <Link to="/parties">
          <Button size="lg" className="w-full h-20 flex-col gap-2">
            <Users className="w-6 h-6" />
            <span>Parties</span>
          </Button>
        </Link>
        <Link to="/encounters">
          <Button variant="outline" size="lg" className="w-full h-20 flex-col gap-2">
            <Swords className="w-6 h-6" />
            <span>Encounters</span>
          </Button>
        </Link>
        <Link to="/worlds">
          <Button variant="outline" size="lg" className="w-full h-20 flex-col gap-2">
            <Globe className="w-6 h-6" />
            <span>Worlds</span>
          </Button>
        </Link>
        <Link to="/maps">
          <Button variant="outline" size="lg" className="w-full h-20 flex-col gap-2">
            <Map className="w-6 h-6" />
            <span>Maps</span>
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-6xl mx-auto">
        <div className="p-6 border rounded-lg">
          <Users className="w-8 h-8 text-primary mb-3" />
          <h3 className="text-lg font-semibold mb-2">Manage Parties</h3>
          <p className="text-gray-600">Track character levels and party compositions for all your campaigns.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <Swords className="w-8 h-8 text-primary mb-3" />
          <h3 className="text-lg font-semibold mb-2">Create Encounters</h3>
          <p className="text-gray-600">Design balanced encounters with monsters and difficulty ratings.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <Globe className="w-8 h-8 text-primary mb-3" />
          <h3 className="text-lg font-semibold mb-2">Build Worlds</h3>
          <p className="text-gray-600">Create rich campaign settings with locations and lore.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <Map className="w-8 h-8 text-primary mb-3" />
          <h3 className="text-lg font-semibold mb-2">Design Maps</h3>
          <p className="text-gray-600">Organize battle maps, world maps, and dungeon layouts.</p>
        </div>
      </div>
    </div>
  );
}
