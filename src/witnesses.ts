import { Ledger } from "../contracts/managed/degree/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type DegreePrivateState = {
  readonly secretKey: Uint8Array;
  readonly degreeSubject: Uint8Array;
  readonly credentialSalt: Uint8Array;
};

export const createDegreePrivateState = (secretKey: Uint8Array, degreeSubject: Uint8Array, credentialSalt: Uint8Array) => ({
  secretKey,
  degreeSubject,
  credentialSalt,
});

export const witnesses = {
  localSecretKey: ({ privateState }: WitnessContext<Ledger, DegreePrivateState>): [DegreePrivateState, Uint8Array] => [privateState, privateState.secretKey],
  degreeSubject: ({ privateState }: WitnessContext<Ledger, DegreePrivateState>): [DegreePrivateState, Uint8Array] => [privateState, privateState.degreeSubject],
  credentialSalt: ({ privateState }: WitnessContext<Ledger, DegreePrivateState>): [DegreePrivateState, Uint8Array] => [privateState, privateState.credentialSalt],
};
