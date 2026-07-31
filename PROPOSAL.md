# Product Proposal: Academic Credential Attestation

## Problem

Hiring and admissions workflows often request an entire transcript when they only need a narrow credential fact.

## Proposed product

Academic Credential Attestation verifies an accredited university credential and answers a degree or subject policy without exposing the student record.

## Privacy model

University registration and proof outcome can be inspected. Student identity, exact GPA, course history, and signed credential payload are not disclosed by the application.

## User journey

1. Registrar registers an accredited university.
2. Applicant presents a signed credential.
3. The circuit checks the required subject and signature.
4. A relying party receives the policy result.

## Success criteria

- Accredited issuers are enforced.
- Valid credentials pass.
- Subject mismatches fail.
- Unaccredited signatures fail.

