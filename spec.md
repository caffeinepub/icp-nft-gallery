# ICP NFT Gallery

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Internet Identity authentication (login/logout)
- NFT minting: upload a local image, enter title and description, mint and store on-chain
- NFT gallery: display cards for all NFTs minted by the logged-in user (image, title, description)
- NFT transfer: select an NFT, enter a recipient principal ID, confirm to send
- Minimal dark theme UI

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Use `authorization` component for Internet Identity login
2. Use `blob-storage` component to store NFT images
3. Backend: NFT data type with id, title, description, imageUrl, owner principal, minter principal, timestamp
4. Backend APIs: mintNFT, getMyNFTs (filter by minter), transferNFT
5. Frontend: login page, gallery page with mint button, mint modal (image upload + title + description), NFT card grid, transfer modal (recipient principal input + confirm)
