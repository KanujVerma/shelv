/** Canonical credential shape; type-only, with no worker runtime dependencies. */
export type Credentials = {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    user: {
        id: string;
    };
    providerSessionId: string;
};
