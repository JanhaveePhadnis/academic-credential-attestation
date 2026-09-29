import { type CircuitContext, QueryContext, sampleContractAddress, createConstructorContext, CostModel } from "@midnight-ntwrk/compact-runtime";
import { Contract, type Ledger, ledger } from "../../contracts/managed/degree/contract/index.js";
import { type DegreePrivateState, witnesses } from "../witnesses.js";

export class DegreeSimulator {
  readonly contract: Contract<DegreePrivateState>;
  circuitContext: CircuitContext<DegreePrivateState>;

  constructor(secretKey: Uint8Array, degreeSubject: Uint8Array, credentialSalt: Uint8Array, adminPk: Uint8Array) {
    this.contract = new Contract<DegreePrivateState>(witnesses);
    const state = this.contract.initialState(
      createConstructorContext({ secretKey, degreeSubject, credentialSalt }, "0".repeat(64)),
      adminPk,
    );
    this.circuitContext = {
      currentPrivateState: state.currentPrivateState,
      currentZswapLocalState: state.currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(state.currentContractState.data, sampleContractAddress()),
    };
  }

  switchUser(secretKey: Uint8Array, degreeSubject: Uint8Array, credentialSalt: Uint8Array) {
    this.circuitContext.currentPrivateState = { secretKey, degreeSubject, credentialSalt };
  }

  getLedger(): Ledger { return ledger(this.circuitContext.currentQueryContext.state); }
  publicKey(sk: Uint8Array) { return this.contract.circuits.publicKey(this.circuitContext, sk).result; }
  credentialCommitment(subject: Uint8Array, salt: Uint8Array) { return this.contract.circuits.credentialCommitment(this.circuitContext, subject, salt).result; }

  issueCredential(commitment: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.issueCredential(this.circuitContext, commitment).context;
    return this.getLedger();
  }

  verifyDegree(requiredSubject: Uint8Array): boolean {
    return this.contract.circuits.verifyDegree(this.circuitContext, requiredSubject).result;
  }
}
