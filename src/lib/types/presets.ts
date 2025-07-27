/** @format */

// types/presets.ts
export interface DisplayPreset {
    name: string;
    width: number; // pixels
    height: number; // pixels
    ppi: number;
    description: string;
}

export const DISPLAY_PRESETS: DisplayPreset[] = [
    {
        name: '55" 4K TV',
        width: 3840,
        height: 2160,
        ppi: 80,
        description: "Large 4K television display",
    },
    {
        name: '32" 1080p Monitor',
        width: 1920,
        height: 1080,
        ppi: 69,
        description: "Standard desktop monitor",
    },
    {
        name: '27" 1440p Monitor',
        width: 2560,
        height: 1440,
        ppi: 109,
        description: "High-res desktop monitor",
    },
    {
        name: '24" 1080p Monitor',
        width: 1920,
        height: 1080,
        ppi: 92,
        description: "Compact desktop monitor",
    },
    {
        name: 'iPad Pro 12.9"',
        width: 2048,
        height: 2732,
        ppi: 264,
        description: "Tablet display",
    },
];
