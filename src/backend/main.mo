import Map "mo:core/Map";
import Time "mo:core/Time";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor self {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // ── Types ────────────────────────────────────────────────────────────────

  public type Subaccount = Blob;

  public type Account = {
    owner : Principal;
    subaccount : ?Subaccount;
  };

  public type NFT = {
    id : Nat;
    title : Text;
    description : Text;
    imageUrl : Text;
    owner : Principal;
    minter : Principal;
    createdAt : Int;
  };

  public type UserProfile = {
    name : Text;
  };

  public type TransferArg = {
    from_subaccount : ?Subaccount;
    to : Account;
    token_id : Nat;
    memo : ?Blob;
    created_at_time : ?Nat64;
  };

  public type TransferError = {
    #NonExistingTokenId;
    #InvalidRecipient;
    #Unauthorized;
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #GenericError : { error_code : Nat; message : Text };
    #GenericBatchError : { error_code : Nat; message : Text };
  };

  public type TransferResult = {
    #Ok : Nat;
    #Err : TransferError;
  };

  public type MetadataValue = {
    #Nat : Nat;
    #Int : Int;
    #Text : Text;
    #Blob : Blob;
  };

  // ── ICP Ledger types (kept for upgrade compatibility) ────────────────────

  type ICRC2TransferFromError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #InsufficientAllowance : { allowance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  type ICRC2TransferFromResult = {
    #Ok : Nat;
    #Err : ICRC2TransferFromError;
  };

  type ICRC1TransferError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  type ICRC1TransferResult = {
    #Ok : Nat;
    #Err : ICRC1TransferError;
  };

  type ICPLedger = actor {
    icrc2_transfer_from : ({
      spender_subaccount : ?Blob;
      from : Account;
      to : Account;
      amount : Nat;
      fee : ?Nat;
      memo : ?Blob;
      created_at_time : ?Nat64;
    }) -> async ICRC2TransferFromResult;
    icrc1_transfer : ({
      from_subaccount : ?Blob;
      to : Account;
      amount : Nat;
      fee : ?Nat;
      memo : ?Blob;
      created_at_time : ?Nat64;
    }) -> async ICRC1TransferResult;
    icrc1_balance_of : (Account) -> async Nat;
  };

  // Kept as stable variables to preserve upgrade compatibility with previous version.
  // mintPrice is set to 0 — minting is free.
  let icpLedger : ICPLedger = actor ("ryjl3-tyaaa-aaaaa-aaaba-cai");
  let ICP_FEE : Nat = 10_000;

  // ── State ────────────────────────────────────────────────────────────────

  var mintPrice : Nat = 0; // Free minting — kept for upgrade compatibility
  var nextNFTId : Nat = 0;
  var transferCount : Nat = 0;

  let nfts = Map.empty<Nat, NFT>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // ── Helpers ──────────────────────────────────────────────────────────────

  func filterNFTs(predicate : NFT -> Bool) : [NFT] {
    let acc = List.empty<NFT>();
    for ((_, nft) in nfts.entries()) {
      if (predicate(nft)) { acc.add(nft) };
    };
    acc.toArray();
  };

  // ── User profiles ────────────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ── NFT minting (free) ───────────────────────────────────────────────────

  public shared ({ caller }) func mintNFT(title : Text, description : Text, imageUrl : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mint NFTs");
    };
    if (title == "" or imageUrl == "") {
      Runtime.trap("Title and image URL are required");
    };
    // mintPrice is 0 — no payment required
    let id = nextNFTId;
    let nft : NFT = {
      id;
      title;
      description;
      imageUrl;
      owner = caller;
      minter = caller;
      createdAt = Time.now();
    };
    nfts.add(id, nft);
    nextNFTId += 1;
    id;
  };

  // ── ICRC-7 collection metadata ───────────────────────────────────────────

  public query func icrc7_name() : async Text { "ICP NFT Gallery" };
  public query func icrc7_symbol() : async Text { "ICPNFT" };
  public query func icrc7_description() : async ?Text { ?"A personal NFT gallery on the Internet Computer" };
  public query func icrc7_logo() : async ?Text { null };
  public query func icrc7_total_supply() : async Nat { nextNFTId };
  public query func icrc7_max_query_batch_size() : async ?Nat { ?100 };
  public query func icrc7_max_update_batch_size() : async ?Nat { ?10 };
  public query func icrc7_default_take_value() : async ?Nat { ?50 };
  public query func icrc7_max_take_value() : async ?Nat { ?100 };
  public query func icrc7_max_memo_size() : async ?Nat { ?32 };
  public query func icrc7_atomic_batch_transfers() : async ?Bool { ?false };
  public query func icrc7_tx_window() : async ?Nat { null };
  public query func icrc7_permitted_drift() : async ?Nat { null };

  // ── ICRC-7 token queries ─────────────────────────────────────────────────

  public query func icrc7_owner_of(token_ids : [Nat]) : async [?Account] {
    token_ids.map(func(id : Nat) : ?Account {
      switch (nfts.get(id)) {
        case (null) { null };
        case (?nft) { ?{ owner = nft.owner; subaccount = null } };
      };
    });
  };

  public query func icrc7_tokens_of(account : Account, prev : ?Nat, take : ?Nat) : async [Nat] {
    let limit = switch (take) {
      case (?t) { if (t > 100) { 100 } else { t } };
      case null { 50 };
    };
    let acc = List.empty<Nat>();
    var pastPrev = prev == null;
    for ((id, nft) in nfts.entries()) {
      if (acc.size() < limit) {
        if (not pastPrev) {
          switch (prev) {
            case (?p) { if (id == p) { pastPrev := true } };
            case null {};
          };
        } else if (nft.owner == account.owner) {
          acc.add(id);
        };
      };
    };
    acc.toArray();
  };

  public query func icrc7_metadata(token_ids : [Nat]) : async [[(Text, MetadataValue)]] {
    token_ids.map(func(id : Nat) : [(Text, MetadataValue)] {
      switch (nfts.get(id)) {
        case (null) { [] };
        case (?nft) {
          [
            ("icrc7:name", #Text(nft.title)),
            ("icrc7:description", #Text(nft.description)),
            ("icrc7:image", #Text(nft.imageUrl)),
          ];
        };
      };
    });
  };

  public query func icrc7_token_metadata(token_ids : [Nat]) : async [[(Text, MetadataValue)]] {
    token_ids.map(func(id : Nat) : [(Text, MetadataValue)] {
      switch (nfts.get(id)) {
        case (null) { [] };
        case (?nft) {
          [
            ("icrc7:name", #Text(nft.title)),
            ("icrc7:description", #Text(nft.description)),
            ("icrc7:image", #Text(nft.imageUrl)),
          ];
        };
      };
    });
  };

  // ── ICRC-7 transfer ──────────────────────────────────────────────────────

  public shared ({ caller }) func icrc7_transfer(args : [TransferArg]) : async [?TransferResult] {
    args.map(func(arg : TransferArg) : ?TransferResult {
      switch (nfts.get(arg.token_id)) {
        case (null) { ?#Err(#NonExistingTokenId) };
        case (?nft) {
          if (nft.owner != caller) {
            ?#Err(#Unauthorized);
          } else {
            nfts.add(arg.token_id, { nft with owner = arg.to.owner });
            transferCount += 1;
            ?#Ok(transferCount);
          };
        };
      };
    });
  };

  // ── Legacy transfer (backward compat) ────────────────────────────────────

  public shared ({ caller }) func transferNFT(nftId : Nat, newOwner : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can transfer NFTs");
    };
    let nft = switch (nfts.get(nftId)) {
      case (null) { Runtime.trap("NFT does not exist") };
      case (?n) { n };
    };
    if (nft.owner != caller) {
      Runtime.trap("Unauthorized: Only the owner can transfer this NFT");
    };
    nfts.add(nftId, { nft with owner = newOwner });
  };

  // ── Gallery queries ──────────────────────────────────────────────────────

  public query ({ caller }) func getNFTsByMinter() : async [NFT] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can query NFTs");
    };
    filterNFTs(func(nft) { nft.minter == caller });
  };

  public query ({ caller }) func getNFTsByOwner() : async [NFT] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can query NFTs");
    };
    filterNFTs(func(nft) { nft.owner == caller });
  };

  public query ({ caller }) func getNFT(nftId : Nat) : async NFT {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view NFTs");
    };
    switch (nfts.get(nftId)) {
      case (null) { Runtime.trap("NFT does not exist") };
      case (?nft) { nft };
    };
  };

  // Suppress unused variable warnings for compatibility stubs
  ignore icpLedger;
  ignore ICP_FEE;
  ignore mintPrice;
};
