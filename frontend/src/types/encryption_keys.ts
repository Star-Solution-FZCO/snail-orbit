export const algorithms = ["RSA", "ED25519", "X25519"] as const;

export type AlgorithmT = (typeof algorithms)[number];

export type EncryptionKeyT = {
    name: string;
    public_key: string;
    fingerprint: string;
    algorithm: AlgorithmT;
    is_active: boolean;
    created_at: string;
    created_on: string;
};

export type AddEncryptionKeyParams = {
    name: string;
    public_key: string;
    algorithm: AlgorithmT;
    fingerprint: string;
    is_active?: boolean;
    created_on?: string;
};
