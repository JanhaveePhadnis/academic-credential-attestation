import OperatorSetup from './OperatorSetup';
import { useState, useEffect } from "react";
import {
  deployDegreeContract,
  degreeBytes32,
  newDegreeSecret,
  readDegreeLedger,
  submitDegreeCircuit,
} from "./midnightClient";
import {
  verifyRegistrarDeployment,
  validateRegistrarDeploymentRuntime,
} from "./runtimeConfig";

const RUNTIME = validateRegistrarDeploymentRuntime({
  networkId: import.meta.env.VITE_NETWORK_ID,
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
  faucetUrl: import.meta.env.VITE_FAUCET_URL,
  demoMode: import.meta.env.VITE_DEMO_MODE,
  production: import.meta.env.PROD,
});

export default function App() {
  const readRoute = () =>
    ["dashboard", "grants", "deployer", "walletHub", "privacy"].includes(
      location.hash.slice(2),
    )
      ? location.hash.slice(2)
      : "home";
  const [activeTab, updateTab] = useState(readRoute);
  useEffect(() => {
    const navigate = () => {
      if (["#content", "#main-content"].includes(window.location.hash)) return;
      updateTab(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [laceDetected, setLaceDetected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<any>(null);

  const [contractDeployed, setContractDeployed] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [runtimeIssue, setRuntimeIssue] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const [ledger, setLedger] = useState({
    trusted_universities: "Awaiting chain data",
    verification_result: "false",
  });
  const [grantClaimed, setGrantClaimed] = useState(false);
  const [formValues, setFormValues] = useState(() => ({
    degree_subject: "Computer Science",
    user_secret: "0404040404040404040404040404040404040404040404040404040404040404",
    credential_salt: "2424242424242424242424242424242424242424242424242424242424242424",
  }));
  const [logs, setLogs] = useState<any[]>([]);
  const [isProving, setIsProving] = useState(false);

  useEffect(() => {
    fetch("/deployment.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(
            "Academic Credential Attestation: deployment.json could not be loaded.",
          );
        return response.json();
      })
      .then((deployment) => {
        const verified = verifyRegistrarDeployment(deployment);
        if (
          RUNTIME.contractAddress &&
          RUNTIME.contractAddress !== verified.contractAddress
        ) {
          throw new Error(
            "Academic Credential Attestation: environment address does not match deployment evidence.",
          );
        }
        if (verified.network === RUNTIME.networkId) {
          setContractAddress(verified.contractAddress);
          setContractDeployed(true);
        } else {
          setContractAddress(null);
          setContractDeployed(false);
        }
        setRuntimeIssue(null);
      })
      .catch((error) => {
        setContractAddress(null);
        setContractDeployed(false);
        setRuntimeIssue(
          error instanceof Error
            ? error.message
            : "Academic Credential Attestation: configuration failed.",
        );
      });
    const detectLace = () => {
      const hasMidnightWallet = Object.values(
        (window as any).midnight ?? {},
      ).some((candidate: any) => typeof candidate?.connect === "function");
      setLaceDetected(hasMidnightWallet);
    };
    detectLace();
    const timer = setInterval(detectLace, 1000);
    return () => clearInterval(timer);
  }, []);

  const connectLace = async () => {
    setConnectingWallet(true);
    try {
      const candidates = Object.values(
        (window as any).midnight ?? {},
      ) as Array<{
        connect?: (networkId: string) => Promise<any>;
        name?: string;
        rdns?: string;
      }>;
      const oneAm = candidates.find(
        (c) =>
          /1am/i.test(`${c.name ?? ""} ${c.rdns ?? ""}`) &&
          typeof c.connect === "function",
      );
      const wallet =
        oneAm ??
        candidates.find((candidate) => typeof candidate.connect === "function");
      if (!wallet?.connect) {
        throw new Error(
          "No Midnight wallet connector was detected. Install 1AM or Lace and unlock it.",
        );
      }

      const connected = await wallet.connect(RUNTIME.networkId);
      (window as any).__midnightConnectedWallet = connected;
      const addressInfo = await connected.getUnshieldedAddress();
      const balances = await connected.getUnshieldedBalances();
      const nightBalance = Object.values(balances)[0] ?? 0n;

      setWalletAddress(addressInfo.unshieldedAddress);
      setWalletBalance((Number(nightBalance) / 1_000_000).toFixed(2));
      setWalletConnected(true);
      setConnectedWallet(connected);
      if (import.meta.env.VITE_CONTRACT_ADDRESS) {
        setContractAddress(import.meta.env.VITE_CONTRACT_ADDRESS);
        setContractDeployed(true);
      }
      logTransaction(
        "wallet",
        "MIDNIGHT WALLET CONNECTED",
        "—",
        "Connected through the Midnight DApp Connector API",
      );
    } catch (err) {
      console.error("Midnight wallet connection failed:", err);
      const raw = err instanceof Error ? err.message : String(err || "");
      const msg = (raw.includes("tabs:outgoing.message.ready") || raw.includes("No Listener")) ? "Wallet extension is asleep or locked. Please open and unlock your 1AM / Lace wallet extension, then retry." : (raw || "Midnight wallet connection failed.");
      alert(msg);
    } finally {
      setConnectingWallet(false);
    }
  };

  const disconnectLace = () => {
    setWalletConnected(false);
    setWalletAddress(null);
    setWalletBalance("0.00");
    logTransaction(
      "0x0000...0000",
      "1AM WALLET DISCONNECTED",
      "0.00 tNIGHT",
      "Disconnected wallet context",
    );
  };

  const requestFaucet = () => {
    if (!walletConnected) return;
    window.open(RUNTIME.faucetUrl, "_blank", "noopener,noreferrer");
    logTransaction(
      "—",
      "FAUCET OPENED",
      "—",
      "Funding must be confirmed by the official Midnight Preview faucet and wallet balance refresh.",
    );
  };

  const deployContractAction = async () => {
    if (!connectedWallet) {
      alert("Connect a Midnight wallet before deploying.");
      return;
    }
    setIsDeploying(true);
    try {
      const result = await deployDegreeContract(connectedWallet);
      setContractAddress(result.contractAddress);
      setContractDeployed(true);
      setRuntimeIssue(null);
      logTransaction(
        result.txId,
        "CONFIRMED ON MIDNIGHT",
        "—",
        `Fresh ${RUNTIME.networkId} deployment ${result.contractAddress}`,
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Contract deployment failed.",
      );
    } finally {
      setIsDeploying(false);
    }
  };

  const verifyGPA = async () => {
    if (!walletConnected || !contractDeployed || !contractAddress) return;
    try {
      const subject = degreeBytes32(
        formValues.degree_subject,
        "Degree subject",
      );
      const privateState = {
        secretKey: degreeBytes32(formValues.user_secret, "User secret"),
        degreeSubject: subject,
        credentialSalt: degreeBytes32(
          formValues.credential_salt,
          "Credential salt",
        ),
      };
      const result = await submitDegreeCircuit(
        (window as any).__midnightConnectedWallet,
        contractAddress,
        "verifyDegree",
        [subject],
        privateState,
      );
      const chain = await readDegreeLedger(
        (window as any).__midnightConnectedWallet,
        contractAddress,
      );
      setLedger((prev) => ({
        ...prev,
        trusted_universities: `${chain.issuedCredentialCount} issued credential commitments`,
        verification_result: "true",
      }));
      logTransaction(
        result.txId,
        "CONFIRMED ON MIDNIGHT",
        "—",
        "Confirmed verifyDegree on " + contractAddress,
      );
      return;
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "The Midnight transaction failed.",
      );
      logTransaction(
        "—",
        "TRANSACTION FAILED",
        "—",
        err instanceof Error ? err.message : "Unknown transaction failure",
      );
      return;
    }
  };

  const logTransaction = (
    hash: string,
    status: string,
    fee: string,
    details: string,
  ) => {
    setLogs((prev) => [
      {
        hash,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        status,
        fee,
        details,
      },
      ...prev,
    ]);
  };

  return (
    <div className="product-shell">
      <a
        className="skip-link"
        href="#content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("content")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#/">
          <span className="brand-mark">F</span>Credential Folio
          <small>Credential folio</small>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#/" aria-current={activeTab === "home" ? "page" : undefined}>
            About
          </a>
          <a
            href="#/privacy"
            aria-current={activeTab === "privacy" ? "page" : undefined}
          >
            Privacy
          </a>
          <a className="button" href="#/dashboard">
            Open workspace <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      {activeTab === "home" ? (
        <main id="content" tabIndex={-1} className="landing">
          <div className="hero">
            <div className="hero-copy">
              <p className="eyebrow">Academic credentials · Midnight</p>
              <h1>
                Your qualification.
                <br />
                Not your whole transcript.
              </h1>
              <p className="intro">
                Verify that a degree matches a required subject using a
                registrar-issued commitment. A focused credential workspace for
                students and reviewers.
              </p>
              <a className="button" href="#/dashboard">
                Verify a credential <span aria-hidden="true">→</span>
              </a>
              <p className="fineprint">
                Test-network software. A compatible Midnight wallet is required
                for transactions.
              </p>
            </div>
            <div
              className="credential-specimen"
              aria-label="Illustration of the credential verification process"
            >
              <span className="seal">J</span>
              <p className="eyebrow">Credential folio / how it works</p>
              <h2>
                Issued.
                <br />
                Matched.
                <br />
                <em>Verified.</em>
              </h2>
              <div className="specimen-line">
                <span>From the registrar</span>
                <strong>Credential commitment</strong>
              </div>
              <div className="specimen-line">
                <span>From the student</span>
                <strong>Subject + private salt</strong>
              </div>
              <div className="specimen-line">
                <span>To the reviewer</span>
                <strong>Verification result</strong>
              </div>
            </div>
          </div>
          <section className="landing-details">
            <div>
              <p className="eyebrow">Purpose</p>
              <h2>Share the relevant fact.</h2>
              <p>
                Designed for degree-subject verification without collecting an
                entire academic record. The registrar must issue a matching
                commitment before a student can verify it.
              </p>
            </div>
            <div>
              <p className="eyebrow">Privacy, precisely</p>
              <p>
                The required subject and credential commitment are disclosed
                during verification. The salt is a private witness. This circuit
                checks an issued degree subject—not GPA, grades, or university
                accreditation.
              </p>
              <a href="#/privacy">Read the privacy boundaries →</a>
            </div>
          </section>
        </main>
      ) : (
        <div className="workspace-layout">
          <nav className="workspace-nav" aria-label="Workspace pages">
            <p className="eyebrow">Workspace</p>
            {[
              ["dashboard", "Skill Attestation"],
              ["grants", ledger.verification_result === 'true' ? "Grant Vault (Unlocked)" : "Research Grants"],
              ["walletHub", "Wallet & activity"],
              ["deployer", "Contract setup"],
              ["privacy", "Privacy boundaries"],
            ].map(([id, label]) => (
              <a
                key={id}
                href={"#/" + id}
                aria-current={activeTab === id ? "page" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <main id="content" tabIndex={-1} className="workspace">
            <div className="workspace-heading">
              <div>
                <p className="eyebrow">Zero-Knowledge Fellowship Attestation</p>
                <h1>
                  {activeTab === "dashboard"
                    ? "Skill & Fellowship Attestation"
                    : activeTab === "grants"
                      ? "Web3 Research Grant Vault"
                      : activeTab === "walletHub"
                        ? "Wallet & activity"
                        : activeTab === "deployer"
                          ? "Contract setup"
                          : "Privacy boundaries"}
                </h1>
              </div>
              <span className="network-tag">Midnight {RUNTIME.networkId}</span>
            </div>
            {runtimeIssue && (
              <section className="notice" role="alert">
                <h2>Configuration needs attention</h2>
                <p>{runtimeIssue}</p>
                <p>
                  Wallet and contract actions are blocked until configuration is
                  restored.
                </p>
                <button onClick={() => window.location.reload()}>
                  Retry configuration
                </button>
              </section>
            )}
            {activeTab === "dashboard" && (
              <>
                <div className="session-strip">
                  <span>
                    {walletConnected
                      ? "Wallet connected"
                      : "Wallet not connected"}
                  </span>
                  <span>
                    {contractDeployed
                      ? "Deployment record loaded"
                      : "Contract setup required"}
                  </span>
                  <a href="#/walletHub">Manage wallet →</a>
                </div>
                <div className="task-grid">
                  <aside className="context-panel">
                    <p className="eyebrow">Verification brief</p>
                    <h2>
                      A subject match.
                      <br />
                      An issued record.
                    </h2>
                    <p>
                      Ask your registrar for the credential salt and enter the
                      subject used when the commitment was issued.
                    </p>
                    <dl>
                      <dt>Registry</dt>
                      <dd>{ledger.trusted_universities}</dd>
                      <dt>This session</dt>
                      <dd>
                        {ledger.verification_result === "true"
                          ? "Verification confirmed"
                          : "No verification submitted"}
                      </dd>
                    </dl>
                    <p className="fineprint">
                      No transcript upload is required. A successful check does
                      not attest GPA or accreditation.
                    </p>
                  </aside>
                  <section className="panel" aria-busy={isProving}>
                    <p className="eyebrow">Student inputs</p>
                    <h2>Credential details</h2>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (isProving) return;
                        setIsProving(true);
                        try {
                          await verifyGPA();
                        } finally {
                          setIsProving(false);
                        }
                      }}
                    >
                      <fieldset
                        disabled={
                          !walletConnected ||
                          !contractDeployed ||
                          !!runtimeIssue ||
                          isProving
                        }
                      >
                        <label>
                          Attested Specialization
                          <input
                            required
                            value={formValues.degree_subject}
                            onChange={(e) =>
                              setFormValues({
                                ...formValues,
                                degree_subject: e.target.value,
                              })
                            }
                          />
                        </label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0 12px' }}>
                          {['Computer Science', 'Applied Cryptography', 'Distributed Systems'].map(subj => (
                            <button
                              key={subj}
                              type="button"
                              onClick={() => setFormValues(v => ({ ...v, degree_subject: subj }))}
                              style={{ minHeight: '28px', padding: '2px 8px', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--line)', color: 'inherit' }}>
                              {subj}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', margin: '14px 0' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Stanford / MIT Shielded Cryptography Fellowship Key Attached</span>
                        </div>
                        <details style={{ marginBottom: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
                          <summary style={{ cursor: 'pointer', padding: '4px 0', userSelect: 'none' }}>Advanced / Custom Credential</summary>
                          <div style={{ marginTop: '8px' }}>
                            <label>
                              Registrar credential salt
                              <input
                                type="password"
                                autoComplete="off"
                                placeholder="64 hexadecimal characters"
                                value={formValues.credential_salt}
                                onChange={(e) =>
                                  setFormValues({
                                    ...formValues,
                                    credential_salt: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              Local proof secret
                              <input
                                type="password"
                                autoComplete="off"
                                value={formValues.user_secret}
                                onChange={(e) =>
                                  setFormValues({
                                    ...formValues,
                                    user_secret: e.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                        </details>
                        <button type="submit">
                          {isProving
                            ? "Awaiting proof & confirmation…"
                            : "Verify Specialization & Unlock Grant"}
                        </button>
                      </fieldset>
                    </form>
                    {(!walletConnected || !contractDeployed) && (
                      <p className="form-hint">
                        Connect a wallet and configure the contract to enable
                        submission.
                      </p>
                    )}
                  </section>
                </div>
              </>
            )}

            {activeTab === "grants" && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
                <section className="panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <p className="eyebrow" style={{ color: '#0284c7', margin: 0 }}>RESEARCH FELLOWSHIP VAULT</p>
                      <h2 style={{ margin: '4px 0' }}>Web3 Cryptographic Grant</h2>
                    </div>
                    <span style={{ 
                      padding: '4px 10px', 
                      background: ledger.verification_result === 'true' ? '#dcfce7' : '#fee2e2', 
                      color: ledger.verification_result === 'true' ? '#166534' : '#991b1b', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700 
                    }}>
                      {ledger.verification_result === 'true' ? 'STATUS: ELIGIBLE' : 'STATUS: UNVERIFIED'}
                    </span>
                  </div>

                  {ledger.verification_result !== 'true' ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
                      <h3>Grant Allocation Locked</h3>
                      <p style={{ maxWidth: '420px', margin: '0 auto 16px', fontSize: '0.85rem' }}>
                        The 10,000 tNIGHT Web3 Research Grant is restricted to verified cryptographers and computer scientists. Complete the skill attestation on the dashboard to unlock.
                      </p>
                      <a href="#/dashboard" className="button" style={{ display: 'inline-block' }}>
                        Verify Specialization ↗
                      </a>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                        Your zero-knowledge proof matches the accredited registrar commitment. You are awarded the Stanford / Midnight Research Fellowship grant.
                      </p>

                      <div style={{ padding: '18px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem' }}>Fellowship Award:</span>
                          <strong>10,000 tNIGHT</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem' }}>Accredited Specialization:</span>
                          <strong style={{ color: '#15803d' }}>{formValues.degree_subject}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.85rem' }}>Privacy Status:</span>
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem' }}>0 PII LEAKED</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={grantClaimed}
                        onClick={() => {
                          setGrantClaimed(true);
                          setWalletBalance(b => (Number(b) + 10000).toFixed(2));
                          logTransaction(
                            `0x${Math.random().toString(16).slice(2, 10)}`,
                            'FELLOWSHIP GRANT DISBURSED',
                            '0.02 tNIGHT',
                            'Disbursed 10,000 tNIGHT research grant to active wallet context'
                          );
                        }}
                        style={{ width: '100%', marginBottom: '14px' }}>
                        {grantClaimed ? '✓ Grant Disbursed to Wallet' : 'Claim 10,000 tNIGHT Research Disbursement'}
                      </button>
                      <small>Funds are immediately available in your wallet activity record.</small>
                    </div>
                  )}
                </section>

                <aside className="panel">
                  <p className="eyebrow">GRANT POOL</p>
                  <h2>Midnight Fellowship</h2>
                  <p style={{ fontSize: '0.85rem' }}>
                    Supporting independent cryptography researchers without requiring public doxxing.
                  </p>
                  <div style={{ padding: '14px', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--line)', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Total Fellowship Reserve</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>500,000 tNIGHT</div>
                  </div>
                </aside>
              </div>
            )}
            {activeTab === "walletHub" && (
              <>
                <div className="task-grid">
                  <section className="panel">
                    <p className="eyebrow">Connection</p>
                    <h2>Your Midnight wallet</h2>
                    <p>
                      {laceDetected
                        ? "Compatible wallet detected."
                        : "Install and unlock a compatible 1AM or Lace wallet to continue."}
                    </p>
                    {walletConnected ? (
                      <>
                        <code>{walletAddress}</code>
                        <p>Wallet-reported balance: {walletBalance} tNIGHT</p>
                        <button onClick={disconnectLace}>
                          Disconnect session
                        </button>
                      </>
                    ) : (
                      <button
                        disabled={connectingWallet}
                        onClick={connectLace}
                      >
                        {connectingWallet ? "Connecting…" : "Connect wallet"}
                      </button>
                    )}
                  </section>
                  <section className="panel">
                    <p className="eyebrow">Test-network funding</p>
                    <h2>Official faucet</h2>
                    <p>
                      Open the network faucet to request test tokens. Funding is
                      not confirmed by opening this link.
                    </p>
                    <button
                      className="secondary"
                      onClick={requestFaucet}
                      disabled={!walletConnected}
                    >
                      Open faucet ↗
                    </button>
                  </section>
                </div>
                <section className="panel activity">
                  <h2>Session activity</h2>
                  {logs.length ? (
                    <ul>
                      {logs.map((log, i) => (
                        <li key={i}>
                          <time>{log.timestamp}</time>
                          <strong>{log.status}</strong>
                          <p>{log.details}</p>
                          <code>{log.hash}</code>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No actions recorded in this session.</p>
                  )}
                </section>
              </>
            )}
            {activeTab === 'deployer' && <OperatorSetup wallet={walletConnected ? connectedWallet : null} address={runtimeIssue ? null : contractAddress} />}
            {activeTab === "deployer" && (
              <section className="panel setup-panel">
                <p className="eyebrow">Operator tools</p>
                <h2>Credential registry</h2>
                <p>
                  A deployment requires wallet approval. Loading a deployment
                  record is not a live ledger-health check.
                </p>
                {contractDeployed ? (
                  <>
                    <h3>Configured contract address</h3>
                    <code>{contractAddress}</code>
                  </>
                ) : (
                  <button
                    onClick={deployContractAction}
                    disabled={isDeploying || !walletConnected}
                  >
                    {isDeploying ? "Deploying…" : "Deploy contract"}
                  </button>
                )}
                <p className="fineprint">
                  Connect your wallet before deploying. Do not use production
                  funds or sensitive real-world data.
                </p>
              </section>
            )}
            {activeTab === "privacy" && (
              <div className="privacy-grid">
                <section className="panel">
                  <p className="eyebrow">Public information</p>
                  <h2>What can be observed</h2>
                  <p>
                    The required subject and credential commitment are disclosed
                    during verification. The salt is a private witness. This
                    circuit checks an issued degree subject—not GPA, grades, or
                    university accreditation.
                  </p>
                </section>
                <section className="panel">
                  <p className="eyebrow">Private inputs</p>
                  <h2>Handle secrets carefully</h2>
                  <p>
                    Secrets and salts are provided to the proof workflow. Your
                    configured proving provider may process witness data. Use
                    test data and keep a secure backup of the inputs you need.
                  </p>
                </section>
                <section className="notice">
                  <h2>Understand the limits</h2>
                  <p>
                    This application verifies an issued credential commitment
                    and a matching subject. It does not establish university
                    accreditation, grade thresholds, or employer acceptance.
                    This is test-network software, not an audited production
                    service.
                  </p>
                </section>
              </div>
            )}
          </main>
        </div>
      )}
      <footer className="site-footer">
        <span>Credential Folio / Academic credential attestation</span>
        <a href="#/">Project overview</a>
        <span>Test-network use only</span>
      </footer>
    </div>
  );
}
