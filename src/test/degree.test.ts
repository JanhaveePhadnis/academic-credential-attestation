import { DegreeSimulator } from "./degree-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, expect, it } from "vitest";
import { randomBytes } from "./utils.js";

setNetworkId("undeployed");

describe("Academic credential commitment contract", () => {
  const adminSecret = randomBytes(32);
  const setup = (subject: Uint8Array, salt: Uint8Array) => {
    const bootstrap = new DegreeSimulator(adminSecret, new Uint8Array(32), new Uint8Array(32), new Uint8Array(32));
    return new DegreeSimulator(randomBytes(32), subject, salt, bootstrap.publicKey(adminSecret));
  };

  it("anchors the administrator commitment", () => {
    const bootstrap = new DegreeSimulator(adminSecret, new Uint8Array(32), new Uint8Array(32), new Uint8Array(32));
    expect(setup(randomBytes(32), randomBytes(32)).getLedger().admin).toEqual(bootstrap.publicKey(adminSecret));
  });

  it("allows only the registrar administrator to issue credentials", () => {
    const subject = randomBytes(32);
    const salt = randomBytes(32);
    const sim = setup(subject, salt);
    const commitment = sim.credentialCommitment(subject, salt);
    expect(() => sim.issueCredential(commitment)).toThrow(/Only admin/);
    sim.switchUser(adminSecret, new Uint8Array(32), new Uint8Array(32));
    expect(sim.issueCredential(commitment).issued_credentials.member(commitment)).toBe(true);
  });

  it("verifies an issued subject without disclosing its salt", () => {
    const subject = randomBytes(32);
    const salt = randomBytes(32);
    const sim = setup(subject, salt);
    const commitment = sim.credentialCommitment(subject, salt);
    sim.switchUser(adminSecret, new Uint8Array(32), new Uint8Array(32));
    sim.issueCredential(commitment);
    sim.switchUser(randomBytes(32), subject, salt);
    expect(sim.verifyDegree(subject)).toBe(true);
  });

  it("rejects a different required subject", () => {
    const subject = randomBytes(32);
    const salt = randomBytes(32);
    const sim = setup(subject, salt);
    const commitment = sim.credentialCommitment(subject, salt);
    sim.switchUser(adminSecret, new Uint8Array(32), new Uint8Array(32));
    sim.issueCredential(commitment);
    sim.switchUser(randomBytes(32), subject, salt);
    expect(() => sim.verifyDegree(randomBytes(32))).toThrow(/does not match/);
  });

  it("rejects unissued commitments", () => {
    const subject = randomBytes(32);
    const sim = setup(subject, randomBytes(32));
    expect(() => sim.verifyDegree(subject)).toThrow(/not issued/);
  });
});
