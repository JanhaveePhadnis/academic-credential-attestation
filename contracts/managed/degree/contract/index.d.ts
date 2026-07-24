import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  degreeSubject(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  universitySignature(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerUniversity(context: __compactRuntime.CircuitContext<PS>,
                     uni_pk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  verifyDegree(context: __compactRuntime.CircuitContext<PS>,
               required_subject_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type ProvableCircuits<PS> = {
  registerUniversity(context: __compactRuntime.CircuitContext<PS>,
                     uni_pk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  verifyDegree(context: __compactRuntime.CircuitContext<PS>,
               required_subject_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
  verifyCredential(subj_0: Uint8Array, sig_0: Uint8Array): Uint8Array;
  publicKey(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  registerUniversity(context: __compactRuntime.CircuitContext<PS>,
                     uni_pk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  verifyDegree(context: __compactRuntime.CircuitContext<PS>,
               required_subject_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  verifyCredential(context: __compactRuntime.CircuitContext<PS>,
                   subj_0: Uint8Array,
                   sig_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  publicKey(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  accredited_universities: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  readonly admin: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               admin_pk_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
