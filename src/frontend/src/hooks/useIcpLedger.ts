import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { useCallback } from "react";
import { useInternetIdentity } from "./useInternetIdentity";

const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";

const icrc2IdlFactory = ({ IDL }: any) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const ApproveArgs = IDL.Record({
    spender: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
    expected_allowance: IDL.Opt(IDL.Nat),
    expires_at: IDL.Opt(IDL.Nat64),
  });
  const ApproveError = IDL.Variant({
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    AllowanceChanged: IDL.Record({ current_allowance: IDL.Nat }),
    Expired: IDL.Record({ ledger_time: IDL.Nat64 }),
    TooOld: IDL.Null,
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    TemporarilyUnavailable: IDL.Null,
    GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
  });
  return IDL.Service({
    icrc2_approve: IDL.Func(
      [ApproveArgs],
      [IDL.Variant({ Ok: IDL.Nat, Err: ApproveError })],
      [],
    ),
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
  });
};

export function useIcpLedger() {
  const { identity } = useInternetIdentity();

  const createLedgerActor = useCallback(async () => {
    const agent = new HttpAgent({
      identity: identity ?? undefined,
    });
    // Only fetch root key for local development
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      await agent.fetchRootKey().catch(console.warn);
    }
    return Actor.createActor(icrc2IdlFactory, {
      agent,
      canisterId: ICP_LEDGER_CANISTER_ID,
    }) as any;
  }, [identity]);

  const approveSpender = useCallback(
    async (spenderPrincipal: Principal, amount: bigint): Promise<void> => {
      if (!identity) throw new Error("Not authenticated");
      const actor = await createLedgerActor();
      const result = await actor.icrc2_approve({
        spender: { owner: spenderPrincipal, subaccount: [] },
        amount,
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        expected_allowance: [],
        expires_at: [],
      });
      if (result && "Err" in result) {
        const errKey = Object.keys(result.Err)[0];
        const errVal = result.Err[errKey];
        if (errKey === "InsufficientFunds") {
          throw new Error(
            `Insufficient ICP balance. You need at least ${Number(amount) / 100_000_000} ICP to mint.`,
          );
        }
        throw new Error(
          `ICRC-2 approve failed: ${errKey}${errVal && typeof errVal === "object" && "message" in errVal ? ` - ${errVal.message}` : ""}`,
        );
      }
    },
    [identity, createLedgerActor],
  );

  const getBalance = useCallback(
    async (owner: Principal): Promise<bigint> => {
      const actor = await createLedgerActor();
      return actor.icrc1_balance_of({ owner, subaccount: [] });
    },
    [createLedgerActor],
  );

  return { approveSpender, getBalance };
}
