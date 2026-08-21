import { describe, expect, it } from 'vitest';
import { verifyRegistrarDeployment, validateRegistrarDeploymentRuntime } from '../runtimeConfig';

const deployment = {
  contractName: 'degree',
  contractAddress: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  network: 'preview',
  transactionHash: '000000000000000000000000000000000000000000000000000000000000000000',
  deployedAt: '2026-08-03T18:00:00.000Z',
};

describe('Academic Credential Attestation production configuration', () => {
  it('accepts matching Preview deployment evidence', () => {
    expect(verifyRegistrarDeployment(deployment).contractName).toBe('degree');
  });

  it('rejects evidence copied from another project', () => {
    expect(() => verifyRegistrarDeployment({ ...deployment, contractName: 'foreign_contract' })).toThrow(/different contract/);
  });

  it('rejects malformed contract and transaction identifiers', () => {
    expect(() => verifyRegistrarDeployment({ ...deployment, contractAddress: 'preview1bad' })).toThrow(/32-byte/);
    expect(() => verifyRegistrarDeployment({ ...deployment, transactionHash: 'pending' })).toThrow(/transaction evidence/);
  });

  it('prevents demo mode and network drift in production', () => {
    expect(() => validateRegistrarDeploymentRuntime({ networkId: 'preprod' })).toThrow(/Preview/);
    expect(() => validateRegistrarDeploymentRuntime({ production: true, demoMode: 'true' })).toThrow(/forbidden/);
  });
});

