import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../../contracts/managed/degree/contract/index.js";
import { type DegreePrivateState, witnesses } from "../witnesses.js";

export class DegreeSimulator {
  readonly contract: Contract<DegreePrivateState>;
  circuitContext: CircuitContext<DegreePrivateState>;

  constructor(secretKey: Uint8Array, degreeSubject: Uint8Array, universitySignature: Uint8Array, adminPk: Uint8Array) {
    this.contract = new Contract<DegreePrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext({ secretKey, degreeSubject, universitySignature }, "0".repeat(64)),
      adminPk
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  public switchUser(secretKey: Uint8Array, degreeSubject: Uint8Array, universitySignature: Uint8Array) {
    this.circuitContext.currentPrivateState = {
      secretKey,
      degreeSubject,
      universitySignature
    };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): DegreePrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public registerUniversity(uniPk: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.registerUniversity(
      this.circuitContext,
      uniPk,
    ).context;
    return this.getLedger();
  }

  public verifyDegree(requiredSubject: Uint8Array): boolean {
    const result = this.contract.circuits.verifyDegree(
      this.circuitContext,
      requiredSubject,
    );
    return result.result;
  }

  public publicKey(sk: Uint8Array): Uint8Array {
    return this.contract.circuits.publicKey(
      this.circuitContext,
      sk,
    ).result;
  }
}
