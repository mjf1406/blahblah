/** @format */

import { useState, useCallback } from "react";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;

export const useViewState = () => {
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);

    const zoomIn = useCallback(() => {
        const newZoom = Math.min(MAX_ZOOM, zoomLevel * 1.2);
        setZoomLevel(newZoom);
    }, [zoomLevel]);

    const zoomOut = useCallback(() => {
        const newZoom = Math.max(MIN_ZOOM, zoomLevel * 0.8);
        setZoomLevel(newZoom);
    }, [zoomLevel]);

    const resetView = useCallback(() => {
        setPanOffset({ x: 0, y: 0 });
        setZoomLevel(1);
    }, []);

    const updateZoom = useCallback(
        (newZoom: number, mouseX: number, mouseY: number) => {
            const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
            if (clampedZoom !== zoomLevel) {
                const zoomRatio = clampedZoom / zoomLevel;
                setPanOffset((prev) => ({
                    x: mouseX - (mouseX - prev.x) * zoomRatio,
                    y: mouseY - (mouseY - prev.y) * zoomRatio,
                }));
                setZoomLevel(clampedZoom);
            }
        },
        [zoomLevel]
    );

    const updatePan = useCallback((deltaX: number, deltaY: number) => {
        setPanOffset((prev) => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
        }));
    }, []);

    return {
        panOffset,
        zoomLevel,
        zoomIn,
        zoomOut,
        resetView,
        updateZoom,
        updatePan,
        setPanOffset,
    };
};
