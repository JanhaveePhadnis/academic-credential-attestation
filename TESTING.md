# Verification checklist

The executable contract suite is `src/test/degree.test.ts`.

```bash
npm test
npm run compile
npm run build
```

Five passing scenarios cover initialization, accredited-university registration, a valid private degree proof, subject mismatch rejection, and unaccredited-signer rejection. The suite verifies that a credential can be checked without revealing the student’s complete academic record.

CI runs the contract and frontend checks on every push and pull request.
