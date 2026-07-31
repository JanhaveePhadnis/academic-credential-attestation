# Academic Credential Attestation

![Frontend CI](https://github.com/JanhaveePhadnis/academic-credential-attestation/actions/workflows/frontend-ci.yml/badge.svg?branch=main) ![Contract CI](https://github.com/JanhaveePhadnis/academic-credential-attestation/actions/workflows/contract-ci.yml/badge.svg?branch=main)

A registrar-facing proof desk for confirming education and GPA policy without distributing a student transcript.

## The registrar workflow

Academic Credential Attestation models a narrow verification exchange:

- accredited universities are registered;
- a signed credential is checked;
- the relying party asks whether a required subject and GPA policy are satisfied;
- the UI returns a compact proof result with wallet and contract evidence.

The editorial dashboard keeps issuer readiness, review state, contract identity, and privacy notes together so a reviewer does not need to inspect raw credential data.

## Compact circuits

The `degree` contract provides:

- `registerUniversity(uni_pk)` to establish an accredited issuer.
- `verifyCredential(subj, sig)` to validate a signed credential witness.
- `verifyDegree(required_subject)` to produce the policy result.
- `publicKey(sk)` for witness-derived public identity.

Student name, ID, exact GPA, and course history are not part of the public verification result.

## Preprod proof record

| Field | Value |
| --- | --- |
| Network | Midnight Preprod |
| Contract | `degree` |
| Address | `73354cd49f7195d6de3905c85d31d41a05610b5be9e7fa6d3ac40c9483d6202d` |
| Deployment transaction | `d83f10008cef94ebe27f1a793b4d2600f6c59d44a1951637ca08d39f2283fad4` |
| Status | Confirmed by Midnight Preprod indexer |

## Build it yourself

```bash
npm install
npm run compile
npm test
npm run build
npm run dev
```

For a configured testnet deployment:

```bash
npm run deploy
```

Keep issuer signing material and wallet recovery data outside the repository. This implementation is a Preprod demonstration, not a replacement for institutional accreditation or legal records.

## CI/CD map

Push validation covers the frontend and Compact contract independently. The release workflow is tag-driven and archives the generated contract plus frontend build. A scheduled audit workflow reports dependency findings without handling wallet secrets.

Demo video: [view the registrar console](https://drive.google.com/file/d/1rl1urj_zurCpibJB7A9cArWw7THAGZ_e/view?usp=sharing).

## Verification

Privacy is the product feature: the verifier receives only the required degree-policy result, while the student transcript and credential values remain private. Run `npm test`, `npm run compile`, and `npm run build`; the five contract scenarios are documented in [TESTING.md](./TESTING.md), the product scope is in [PROPOSAL.md](./PROPOSAL.md), and both CI workflows run on every push and pull request.
