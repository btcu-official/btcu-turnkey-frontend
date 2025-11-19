# NFT Frontend Updates

## Overview

The frontend has been updated to support NFT certificate functionality for both instructors and students.

## Changes Made

### 1. Admin Panel - Instructor NFT Minting

**File**: `app/components/admin-panel.tsx`

**New Features:**
- Added NFT minting form for instructors
- Allows instructors to mint completion certificates for students
- One-click minting with student address input
- Visual feedback with success/error messages

**Implementation:**
- Added `nftMintAddress` state for storing student address
- Added `handleMintNft` async handler that:
  - Validates student address
  - Calls `mint-for-student` contract function
  - Shows success message with transaction ID
- Added UI section with Award icon and gradient button
- Enforces one NFT per student (handled by smart contract)

**Location**: Between "Mark Completion" and "Set Meeting Link" sections

### 2. Student Dashboard - NFT Certificate Display

**File**: `app/components/student-nft-display.tsx` (NEW)

**Features:**
- Automatically checks if student has NFT certificate
- Only displays if NFT is present (returns null otherwise)
- Beautiful animated card with certificate details
- Shows token ID and minting status
- Link to Stacks Explorer to view certificate on-chain

**Component Behavior:**
- Fetches NFT status on mount using `/api/contract/check-nft`
- Loading state while checking
- Returns `null` if no NFT (won't display anything)
- Animated entrance with framer-motion
- Responsive design with gradient background

**Certificate Card Contents:**
- Award icon with rotating sparkle animation
- "Certificate Earned!" headline
- Token ID display
- Minting status (✓ Minted)
- Blockchain info (Stacks)
- Feature badges: On-Chain Proof, Tamper-Proof, Yours Forever
- "View on Explorer" button

### 3. Dashboard Integration

**File**: `app/dashboard/page.tsx`

**Changes:**
- Imported `StudentNFTDisplay` component
- Added component between whitelist status and learning progress sections
- Only renders when user is whitelisted and address is available
- Seamlessly integrates into existing dashboard layout

**Placement**: After the green "Whitelisted! 🎉" banner

### 4. API Routes

#### Updated: `app/api/contract/mint-nft/route.ts`

**Changes:**
- Updated contract name from `"btcuniNft"` to `"btc-university-nft"`
- Updated function name from `"mint"` to `"mint-for-student"`
- Matches new contract structure

#### New: `app/api/contract/check-nft/route.ts`

**Features:**
- POST endpoint to check if student has NFT
- Accepts student address in request body
- Calls `has-nft` contract function
- If NFT exists, also fetches token info via `get-student-token-id`
- Returns:
  ```typescript
  {
    success: boolean,
    hasNft: boolean,
    tokenInfo: {
      tokenId: number,
      minted: boolean
    } | null
  }
  ```

### 5. Contract Configuration

**File**: `app/lib/contracts.ts`

**Changes:**
- Updated `BTCUNI_NFT` contract configuration
- Added default fallback values:
  - Address: Same as main contract
  - Name: `"btc-university-nft"`
- Ensures NFT contract is always properly configured

## User Flows

### Instructor Flow: Mint Certificate

1. Navigate to `/admin` page
2. Scroll to "Mint NFT Certificate" section
3. Enter student's Stacks address
4. Click "Mint Certificate NFT"
5. Approve transaction in wallet
6. See success message with transaction ID
7. Certificate is now on-chain

### Student Flow: View Certificate

1. Login and navigate to `/dashboard`
2. If NFT certificate exists, it automatically appears
3. Beautiful card displays between whitelist status and learning progress
4. Shows certificate details and token ID
5. Click "View on Explorer" to see on Stacks blockchain
6. If no certificate, nothing displays (no empty state)

## Technical Details

### Smart Contract Integration

All contract calls use the new NFT contract structure:
- Contract name: `btc-university-nft`
- Mint function: `mint-for-student`
- Check function: `has-nft`
- Info function: `get-student-token-id`

### Error Handling

- Admin panel shows error toast if minting fails
- Student display silently fails (returns null) if check fails
- All errors logged to console for debugging

### Performance

- Student NFT check happens asynchronously
- Loading state prevents layout shift
- Component returns null immediately if no NFT
- No unnecessary re-renders

### Styling

- Consistent with existing design system
- Uses Tailwind CSS classes
- Gradient buttons for NFT actions (orange to yellow)
- Framer-motion animations for polish
- Lucide React icons throughout

## Environment Variables

The following environment variables can be used to configure the NFT contract:

```bash
NEXT_PUBLIC_BTCUNI_NFT_CONTRACT_ADDRESS=STE8EXW8APGP8Y9WT9K102KCGEKZY4KH0VKSXD9Y
NEXT_PUBLIC_BTCUNI_NFT_CONTRACT_NAME=btc-university-nft
```

If not set, defaults to main contract address and `"btc-university-nft"` name.

## Testing

### Test Instructor Minting:
1. Deploy contracts to testnet
2. Login as contract owner
3. Navigate to `/admin`
4. Enter test student address
5. Mint NFT
6. Verify transaction on explorer

### Test Student View:
1. Login as student who received NFT
2. Navigate to `/dashboard`
3. Verify certificate card appears
4. Click "View on Explorer"
5. Verify certificate on blockchain

### Test "No NFT" Case:
1. Login as new student without NFT
2. Navigate to `/dashboard`
3. Verify no certificate card appears
4. Confirm no empty state or errors

## Future Enhancements

Potential additions:
- Bulk minting for multiple students
- NFT metadata display (image, description)
- Certificate download as PDF
- Social sharing functionality
- Gallery view of all certificates
- Certificate verification by token ID
- Historical minting log for instructors

