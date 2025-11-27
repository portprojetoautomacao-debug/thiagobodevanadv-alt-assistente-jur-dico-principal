/**
 * Global type declarations for Vercel Serverless Functions
 * These types ensure fetch API types are available in Node.js environment
 */

/// <reference types="node" />

// Ensure fetch types are available globally
// Node.js 18+ has built-in fetch, but TypeScript needs to know about it
declare global {
    // Re-export fetch types from lib.dom if not already available
    interface RequestInit {
        body?: BodyInit | null;
        cache?: RequestCache;
        credentials?: RequestCredentials;
        headers?: HeadersInit;
        integrity?: string;
        keepalive?: boolean;
        method?: string;
        mode?: RequestMode;
        redirect?: RequestRedirect;
        referrer?: string;
        referrerPolicy?: ReferrerPolicy;
        signal?: AbortSignal | null;
        window?: null;
    }
}

export { };
