/** @format */

// src\App.tsx
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    useLocation,
} from "react-router-dom";
import { PartyManager } from "./components/PartyManager";
import { EncounterManager } from "./components/EncounterManager";
import { WorldManager } from "./components/WorldManager";
import { MapManager } from "./components/MapManager";
import { HomePage } from "./components/HomePage";
import { Button } from "./components/ui/button";
import { Home, Users, Swords, Globe, Map } from "lucide-react";

function Navigation() {
    const location = useLocation();

    const navItems = [
        { path: "/", icon: Home, label: "Home" },
        { path: "/parties", icon: Users, label: "Parties" },
        { path: "/encounters", icon: Swords, label: "Encounters" },
        { path: "/worlds", icon: Globe, label: "Worlds" },
        { path: "/maps", icon: Map, label: "Maps" },
    ];

    return (
        <nav className="flex items-center gap-1">
            {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                    key={path}
                    to={path}
                >
                    <Button
                        variant={
                            location.pathname === path ? "default" : "ghost"
                        }
                        size="sm"
                        className="flex items-center gap-1.5 px-3"
                    >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{label}</span>
                    </Button>
                </Link>
            ))}
        </nav>
    );
}

export default function App() {
    return (
        <Router>
            <div className="flex flex-col min-h-screen bg-gray-50">
                <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b shadow-sm bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center gap-6">
                        <h2 className="text-xl font-semibold text-primary">
                            D&D Manager
                        </h2>
                        <Authenticated>
                            <Navigation />
                        </Authenticated>
                    </div>
                    <SignOutButton />
                </header>
                <main className="flex-1 p-8">
                    <Content />
                </main>
                <Toaster />
            </div>
        </Router>
    );
}

function Content() {
    const loggedInUser = useQuery(api.auth.loggedInUser);

    if (loggedInUser === undefined) {
        return (
            <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <Authenticated>
                <Routes>
                    <Route
                        path="/"
                        element={<HomePage />}
                    />
                    <Route
                        path="/parties"
                        element={<PartyManager />}
                    />
                    <Route
                        path="/encounters"
                        element={<EncounterManager />}
                    />
                    <Route
                        path="/worlds"
                        element={<WorldManager />}
                    />
                    <Route
                        path="/maps"
                        element={<MapManager />}
                    />
                </Routes>
            </Authenticated>
            <Unauthenticated>
                <div className="text-center">
                    <h1 className="mb-4 text-5xl font-bold text-primary">
                        D&D Manager
                    </h1>
                    <p className="mb-8 text-xl text-secondary">
                        Sign in to manage your D&D campaigns
                    </p>
                    <SignInForm />
                </div>
            </Unauthenticated>
        </div>
    );
}
