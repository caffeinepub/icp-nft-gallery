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
export interface Account {
    owner: Principal;
    subaccount: Uint8Array | null;
}
export interface TransferArg {
    from_subaccount: Uint8Array | null;
    to: Account;
    token_id: bigint;
    memo: Uint8Array | null;
    created_at_time: bigint | null;
}
export type TransferError =
    | { NonExistingTokenId: null }
    | { InvalidRecipient: null }
    | { Unauthorized: null }
    | { TooOld: null }
    | { CreatedInFuture: { ledger_time: bigint } }
    | { Duplicate: { duplicate_of: bigint } }
    | { GenericError: { error_code: bigint; message: string } }
    | { GenericBatchError: { error_code: bigint; message: string } };
export type TransferResult = { Ok: bigint } | { Err: TransferError };
export type MetadataValue =
    | { Nat: bigint }
    | { Int: bigint }
    | { Text: string }
    | { Blob: Uint8Array };
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCanisterICPBalance(): Promise<bigint>;
    getMintPrice(): Promise<bigint>;
    getNFT(nftId: bigint): Promise<NFT>;
    getNFTsByMinter(): Promise<Array<NFT>>;
    getNFTsByOwner(): Promise<Array<NFT>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    icrc7_atomic_batch_transfers(): Promise<boolean | null>;
    icrc7_default_take_value(): Promise<bigint | null>;
    icrc7_description(): Promise<string | null>;
    icrc7_logo(): Promise<string | null>;
    icrc7_max_memo_size(): Promise<bigint | null>;
    icrc7_max_query_batch_size(): Promise<bigint | null>;
    icrc7_max_take_value(): Promise<bigint | null>;
    icrc7_max_update_batch_size(): Promise<bigint | null>;
    icrc7_metadata(token_ids: Array<bigint>): Promise<Array<Array<[string, MetadataValue]>>>;
    icrc7_name(): Promise<string>;
    icrc7_owner_of(token_ids: Array<bigint>): Promise<Array<Account | null>>;
    icrc7_permitted_drift(): Promise<bigint | null>;
    icrc7_symbol(): Promise<string>;
    icrc7_token_metadata(token_ids: Array<bigint>): Promise<Array<Array<[string, MetadataValue]>>>;
    icrc7_tokens_of(account: Account, prev: bigint | null, take: bigint | null): Promise<Array<bigint>>;
    icrc7_total_supply(): Promise<bigint>;
    icrc7_transfer(args: Array<TransferArg>): Promise<Array<TransferResult | null>>;
    icrc7_tx_window(): Promise<bigint | null>;
    isCallerAdmin(): Promise<boolean>;
    mintNFT(title: string, description: string, imageUrl: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setMintPrice(price: bigint): Promise<void>;
    transferNFT(nftId: bigint, newOwner: Principal): Promise<void>;
    withdrawICP(to: Principal, amount: bigint): Promise<void>;
}
