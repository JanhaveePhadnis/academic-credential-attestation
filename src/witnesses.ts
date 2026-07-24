import { Ledger } from "../contracts/managed/degree/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type DegreePrivateState = {
  readonly secretKey: Uint8Array;
  readonly degreeSubject: Uint8Array;
  readonly universitySignature: Uint8Array;
};

export const createDegreePrivateState = (secretKey: Uint8Array, degreeSubject: Uint8Array, universitySignature: Uint8Array) => ({
  secretKey,
  degreeSubject,
  universitySignature
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, DegreePrivateState>): [
    DegreePrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],

  degreeSubject: ({
    privateState,
  }: WitnessContext<Ledger, DegreePrivateState>): [
    DegreePrivateState,
    Uint8Array,
  ] => [privateState, privateState.degreeSubject],

  universitySignature: ({
    privateState,
  }: WitnessContext<Ledger, DegreePrivateState>): [
    DegreePrivateState,
    Uint8Array,
  ] => [privateState, privateState.universitySignature],
};
