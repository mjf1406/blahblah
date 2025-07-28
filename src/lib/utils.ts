/** @format */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const detectWebGL = (): boolean => {
    return false;
    try {
        const canvas = document.createElement("canvas");
        const gl =
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");
        return !!(gl && gl instanceof WebGLRenderingContext);
    } catch (e) {
        console.error(e);
        return false;
    }
};
