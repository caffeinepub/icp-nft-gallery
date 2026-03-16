import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  var nextNFTId = 0;

  type NFT = {
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

  let nfts = Map.empty<Nat, NFT>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // NFT functions with proper authorization
  public shared ({ caller }) func mintNFT(title : Text, description : Text, imageUrl : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mint NFTs");
    };

    if (title == "" or description == "" or imageUrl == "") {
      Runtime.trap("All fields must be non-empty");
    };

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

  public shared ({ caller }) func transferNFT(nftId : Nat, newOwner : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can transfer NFTs");
    };

    let nft = switch (nfts.get(nftId)) {
      case (null) { Runtime.trap("NFT does not exist") };
      case (?nft) { nft };
    };

    if (nft.owner != caller) {
      Runtime.trap("Unauthorized: Only the owner can transfer this NFT");
    };

    let updatedNFT : NFT = {
      nft with owner = newOwner;
    };

    nfts.add(nftId, updatedNFT);
  };

  public query ({ caller }) func getNFTsByMinter() : async [NFT] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query NFTs");
    };
    nfts.values().toList<NFT>().filter(func(nft) { nft.minter == caller }).toArray();
  };

  public query ({ caller }) func getNFTsByOwner() : async [NFT] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query NFTs");
    };
    nfts.values().toList<NFT>().filter(func(nft) { nft.owner == caller }).toArray();
  };

  public query ({ caller }) func getNFT(nftId : Nat) : async NFT {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view NFTs");
    };
    switch (nfts.get(nftId)) {
      case (null) { Runtime.trap("NFT does not exist") };
      case (?nft) { nft };
    };
  };
};
