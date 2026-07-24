# Project Idea: Confidential Credentials (Academic Degree Verification)

A system where graduates can prove they possess an academic degree (e.g., a Bachelor of Science) from a specific university without sharing their full name, GPA, graduation date, or student ID.

## 1. Midnight Network Specialty (ZK & Privacy Features)
*   **Decoupled Credential Checking:** Verifies issuer authenticity and certificate validity while keeping all personal fields hidden.
*   **Off-chain Proofs:** Runs verification checks on signed certificate JSON blocks inside browser-based ZK engines. The raw academic data never leaves the user's local disk.
*   **Universal Compliance:** Graduates can satisfy hiring criteria (proving they have the degree) without giving employers access to complete dossiers of personal data.

## 2. Technical Architecture (Compact Contract)
*   **Public State:**
    *   `authorized_universities`: A registry of public keys representing accredited academic institutions.
*   **Private State (User Wallet):**
    *   `degree_certificate`: A signed academic record containing:
        *   `student_hash`: Hash of the student's identity key.
        *   `university_id`: Issuer identifier.
        *   `major`: Major field of study (e.g., "Computer Science").
        *   `gpa`: Grade Point Average.
        *   `signature`: The university's signature on the certificate.
*   **Circuits (ZK Proofs):**
    *   `prove_degree(degree_certificate, target_major, student_secret_key)`:
        1. Checks that the `university_id` and corresponding `signature` match a public key in `authorized_universities`.
        2. Verifies ownership by checking if the hash of `student_secret_key` matches the `student_hash` in the certificate.
        3. Asserts that the certificate's study field matches `target_major`.
        *Output:* A cryptographic assertion proof confirming the user possesses the specified degree, without leaking their GPA or name.

## 3. Frontend & Integration (Level 3 Focus)
*   **User Interface:** A candidate portal. Job seekers upload their university credential files, choose the major they want to prove, and submit a generated proof to a company's hiring portal.
*   **Lace/Midnight Wallet Integration:**
    *   Accesses the student's private identity key.
    *   Fires up the local proof server to compile the ZK certification.

## 4. Verification & Testing Plan
*   **Unit Tests:**
    *   Assert that a valid certificate for "Computer Science" generates a successful proof.
    *   Assert that a certificate for a different major fails the circuit criteria.
    *   Validate that credentials signed by unaccredited institutions are blocked.

---

## 5. How to Build & Deploy on Midnight
To build this project without errors, refer to the master build guide located at the root of the workspace: [BUILD_GUIDE.md](file:///Users/neelsubhashpote/moonlight/BUILD_GUIDE.md). It details how to:
1. Fix language pragma version mismatches.
2. Resolve SDK `4.x` dependency issues.
3. Start the Docker-based local ZK proof server.
4. Deploy the contract using a custom `deploy.mjs` script.
5. Prevent DUST gas errors.
