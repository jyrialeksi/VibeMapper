export declare const api: {
    get: (path: string) => Promise<unknown>;
    post: (path: string, body?: unknown) => Promise<unknown>;
    put: (path: string, body?: unknown) => Promise<unknown>;
    delete: (path: string) => Promise<unknown>;
};
