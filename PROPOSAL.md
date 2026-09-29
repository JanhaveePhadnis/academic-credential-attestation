# Product Proposal: Academic Credential Attestation

**Submission category:** Identity/credentials  
**Registrar/owner:** `JanhaveePhadnis`  
**Proof status:** Deployed and independently testable

## Problem

Hiring and admissions workflows often request an entire transcript when they only need a narrow credential fact.

## Proposed product

Academic Credential Attestation verifies an accredited university credential and answers a degree or subject policy without exposing the student record.

## Privacy model

Issued commitment count and proof outcome can be inspected. Student identity, subject, course history, and credential salt are not disclosed by the application.

## User journey

1. Registrar registers an accredited university.
2. Applicant presents a signed credential.
3. The circuit recomputes the private subject-and-salt commitment and checks the requested subject.
4. A relying party receives the policy result.

## Success criteria

- Accredited issuers are enforced.
- Valid credentials pass.
- Subject mismatches fail.
- Unissued credential commitments fail.
