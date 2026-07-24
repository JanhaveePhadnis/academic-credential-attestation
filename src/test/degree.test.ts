import { DegreeSimulator } from "./degree-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";

setNetworkId("undeployed");

describe("Confidential Credentials Smart Contract Tests", () => {
  const adminSecret = randomBytes(32);
  const dummySubject = randomBytes(32);

  // Setup helper to create a simulator
  const setupSimulator = (userSecret: Uint8Array, degreeSubject: Uint8Array, universitySignature: Uint8Array) => {
    const tempSim = new DegreeSimulator(adminSecret, new Uint8Array(32), new Uint8Array(32), new Uint8Array(32));
    const adminPk = tempSim.publicKey(adminSecret);
    return new DegreeSimulator(userSecret, degreeSubject, universitySignature, adminPk);
  };

  it("1. Properly initializes contract parameters and admin public key", () => {
    const userSecret = randomBytes(32);
    const simulator = setupSimulator(userSecret, dummySubject, new Uint8Array(32));
    const ledgerState = simulator.getLedger();

    const tempSim = new DegreeSimulator(adminSecret, new Uint8Array(32), new Uint8Array(32), new Uint8Array(32));
    const adminPk = tempSim.publicKey(adminSecret);
    expect(ledgerState.admin).toEqual(adminPk);
  });

  it("2. Lets admin register an accredited university", () => {
    const userSecret = randomBytes(32);
    const simulator = setupSimulator(userSecret, dummySubject, new Uint8Array(32));
    const uniPk = randomBytes(32);

    // Switch to admin to register
    simulator.switchUser(adminSecret, new Uint8Array(32), new Uint8Array(32));
    const ledgerState = simulator.registerUniversity(uniPk);
    expect(ledgerState.accredited_universities.member(uniPk)).toEqual(true);
  });

  it("3. Returns true when user possesses a valid degree signed by an accredited university", () => {
    const userSecret = randomBytes(32);
    const uniPk = randomBytes(32);
    const subject = randomBytes(32);

    const simulator = setupSimulator(userSecret, subject, uniPk);

    // Register university
    simulator.switchUser(adminSecret, new Uint8Array(32), new Uint8Array(32));
    simulator.registerUniversity(uniPk);

    // Switch to user and verify
    simulator.switchUser(userSecret, subject, uniPk);
    const isValid = simulator.verifyDegree(subject);
    expect(isValid).toEqual(true);
  });

  it("4. Throws when the degree subject does not match the required subject", () => {
    const userSecret = randomBytes(32);
    const uniPk = randomBytes(32);
    const actualSubject = randomBytes(32);
    const requestedSubject = randomBytes(32);

    const simulator = setupSimulator(userSecret, actualSubject, uniPk);

    // Register university
    simulator.switchUser(adminSecret, new Uint8Array(32), new Uint8Array(32));
    simulator.registerUniversity(uniPk);

    // Verify
    simulator.switchUser(userSecret, actualSubject, uniPk);
    expect(() => simulator.verifyDegree(requestedSubject)).toThrow("failed assert: User's degree subject does not match requirement");
  });

  it("5. Throws when the university signature is not from an accredited university", () => {
    const userSecret = randomBytes(32);
    const unaccreditedUniPk = randomBytes(32);
    const subject = randomBytes(32);

    const simulator = setupSimulator(userSecret, subject, unaccreditedUniPk);

    // Verify (without registering unaccreditedUniPk)
    expect(() => simulator.verifyDegree(subject)).toThrow("failed assert: Credential not signed by accredited university");
  });
});
