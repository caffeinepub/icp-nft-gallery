# ICP NFT Gallery

## Current State
The app mints NFTs using ICRC-7, stores images via blob-storage, and uses Internet Identity for auth. Minting currently requires a 0.1 ICP payment via ICRC-2 approve before each mint. The backend has `mintPrice`, `getMintPrice`, `setMintPrice`, `withdrawICP`, `getCanisterICPBalance`, and the full ICP ledger actor definition. The frontend MintModal has a 3-step flow: approve ICP → upload → mint.

## Requested Changes (Diff)

### Add
- Nothing new.

### Modify
- `mintNFT` in backend: remove the `mintPrice > 0` payment check and `icrc2_transfer_from` call entirely.
- Backend: remove `mintPrice` state variable, `getMintPrice`, `setMintPrice`, `withdrawICP`, `getCanisterICPBalance` functions, and all ICP ledger type definitions and the `icpLedger` actor reference.
- `MintModal.tsx`: remove the ICP approval step, the mint price info banner, the `approving` status, and `useIcpLedger`/`useGetMintPrice` imports. Simplify to a 2-step flow: upload → mint.
- `GalleryPage.tsx`: remove the mint price display line below the Mint button, remove `useGetMintPrice` import.
- `useQueries.ts`: remove `useGetMintPrice` hook.

### Remove
- All ICP payment-related backend logic and frontend UI.

## Implementation Plan
1. Rewrite `main.mo` without ICP ledger types, actor, mintPrice state, and payment functions.
2. Update `MintModal.tsx` to remove approval step and price UI.
3. Update `GalleryPage.tsx` to remove price display.
4. Update `useQueries.ts` to remove `useGetMintPrice`.
