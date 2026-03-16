import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
export interface NFT {
    id: bigint;
    title: string;
    owner: Principal;
    createdAt: bigint;
    minter: Principal;
    description: string;
    imageUrl: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getNFT(nftId: bigint): Promise<NFT>;
    getNFTsByMinter(): Promise<Array<NFT>>;
    getNFTsByOwner(): Promise<Array<NFT>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    mintNFT(title: string, description: string, imageUrl: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    transferNFT(nftId: bigint, newOwner: Principal): Promise<void>;
}
