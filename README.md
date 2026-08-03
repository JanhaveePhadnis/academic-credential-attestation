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

## Preview proof record

| Field | Value |
| --- | --- |
| Network | Midnight Preview |
| Contract | `degree` |
| Address | `9f6508250c46bccc23195165da276b4d4136c734144280a49cf9087c31bbb35c` |
| Deployment transaction | `0079b721fc3cb172722acb890c676741838f1f1db43c24b5c7707b90c6086661ca` |
| Deployer | `mn_addr_preview12eq24yq2c3w2flhnvszgtkzhvuhptlggnm5y0yzmg8rm35fk9htqxutkpv` |
| Timestamp | `2026-08-03T18:50:32.214Z` |
| Status | Confirmed by Midnight Preview indexer |

## Build it yourself

For registrar testing, request tNight from the [Midnight Preview faucet](https://faucet.preview.midnight.network/).

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

Keep issuer signing material and wallet recovery data outside the repository. This implementation is a Preview demonstration, not a replacement for institutional accreditation or legal records.

## CI/CD map

Push validation covers the frontend and Compact contract independently. The release workflow is tag-driven and archives the generated contract plus frontend build. A scheduled audit workflow reports dependency findings without handling wallet secrets.

Demo video: [view the registrar console](https://drive.google.com/file/d/1rl1urj_zurCpibJB7A9cArWw7THAGZ_e/view?usp=sharing).

## Verification

Privacy is the product feature: the verifier receives only the required degree-policy result, while the student transcript and credential values remain private. Run `npm test`, `npm run compile`, and `npm run build`; the five contract scenarios are documented in [TESTING.md](./TESTING.md), the product scope is in [PROPOSAL.md](./PROPOSAL.md), and both CI workflows run on every push and pull request.
