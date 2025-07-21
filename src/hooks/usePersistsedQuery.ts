/** @format */

// hooks/usePersistedQuery.ts
import { useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { FunctionReference } from "convex/server";

const queryCache = new Map<string, any>();

export function usePersistedQuery<T>(
    query: FunctionReference<"query">,
    cacheKey: string,
    args?: any
) {
    // Include args in the cache key if provided
    const fullKey = args ? `${cacheKey}-${JSON.stringify(args)}` : cacheKey;
    const data = useQuery(query, args);
    const [cachedData, setCachedData] = useState<T | undefined>(() =>
        queryCache.get(fullKey)
    );

    useEffect(() => {
        if (data !== undefined) {
            queryCache.set(fullKey, data);
            setCachedData(data);
        }
    }, [data, fullKey]);

    return {
        data: data ?? cachedData,
        isLoading: data === undefined && cachedData === undefined,
        isRefetching: data === undefined && cachedData !== undefined,
    };
}
