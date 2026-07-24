import { useState, useEffect } from 'react';
import { Award, FileText, Wallet, Cpu, Lock, Database, History, HelpCircle } from 'lucide-react';
import { deployDegreeContract, submitDegreeCircuit } from './midnightClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [laceDetected, setLaceDetected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<any>(null);

  const [contractDeployed, setContractDeployed] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);

  const [ledger, setLedger] = useState({ minimum_gpa: 3, trusted_universities: "Stanford University Registrar", verification_result: "false" });
  const [formValues, setFormValues] = useState({ gpa_score: 3.6, reg_sig: "sig:stanford:academic:verified" });
  const [logs, setLogs] = useState([
    { hash: '0x1c3d...ef78', timestamp: '2026-07-08 09:42:01', status: 'VERIFIED', details: 'Validated academic GPA score' }
  ]);
  const [isProving, setIsProving] = useState(false);
  const [provingStep, setProvingStep] = useState(0);

  const proofSteps = [
    "Loading encrypted student GPA metrics...",
    "Checking signature validity from Stanford Registrar...",
    "Running inequality circuit: gpa_score >= 3.0...",
    "Submitting verified credentials status proof..."
  ];

  const deploySteps = [
    "Compiling academic credentials contract...",
    "Spawning Preprod transaction block...",
    "Publishing university key directory anchor..."
  ];

  useEffect(() => {
    fetch('/deployment.json').then(response => response.ok ? response.json() : null).then(deployment => {
      if (deployment?.contractAddress) {
        setContractAddress(deployment.contractAddress);
        setContractDeployed(true);
      }
    }).catch(() => undefined);
    const detectLace = () => {
      const hasMidnightWallet = Object.values((window as any).midnight ?? {}).some((candidate: any) => typeof candidate?.connect === 'function');
      setLaceDetected(hasMidnightWallet);
    };
    detectLace();
    const timer = setInterval(detectLace, 1000);
    return () => clearInterval(timer);
  }, []);

  const connectLace = async () => {
    setConnectingWallet(true);
    try {
      const candidates = Object.values((window as any).midnight ?? {}) as Array<{
        connect?: (networkId: string) => Promise<any>;
        name?: string;
      }>;
      const wallet = candidates.find(candidate => typeof candidate.connect === 'function');
      if (!wallet?.connect) {
        throw new Error('No Midnight wallet connector was detected. Install 1AM or Lace and unlock it.');
      }

      const connected = await wallet.connect(import.meta.env.VITE_NETWORK_ID || 'preprod');
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
      logTransaction('wallet', 'MIDNIGHT WALLET CONNECTED', '—', 'Connected through the Midnight DApp Connector API');
    } catch (err) {
      console.error('Midnight wallet connection failed:', err);
      alert(err instanceof Error ? err.message : 'Midnight wallet connection failed.');
    } finally {
      setConnectingWallet(false);
    }
  };



  const disconnectLace = () => {
    setWalletConnected(false);
    setWalletAddress(null);
    setWalletBalance("0.00");
    logTransaction('0x0000...0000', 'LACE WALLET DISCONNECTED', '0.00 tNIGHT', 'Disconnected wallet context');
  };

  const requestFaucet = () => {
    if (!walletConnected) return;
    window.open(import.meta.env.VITE_FAUCET_URL || 'https://midnight-tmnight-preprod.nethermind.dev/', '_blank', 'noopener,noreferrer');
    logTransaction('—', 'FAUCET OPENED', '—', 'Funding must be confirmed by the Midnight Preprod Faucet and wallet balance refresh.');
  };

  const deployContractAction = async () => {
    if (import.meta.env.VITE_CONTRACT_ADDRESS) {
      setContractAddress(import.meta.env.VITE_CONTRACT_ADDRESS);
      setContractDeployed(true);
      logTransaction('—', 'DEPLOYMENT CONFIGURED', '—', 'Using the deployed Midnight contract configured for this environment.');
      return;
    }
    if (!connectedWallet) return;
    setIsDeploying(true);
    try {
      const result = await deployDegreeContract(connectedWallet);
      setContractAddress(result.contractAddress);
      setContractDeployed(true);
      logTransaction(result.txId, 'CONTRACT DEPLOYMENT SUBMITTED', '—', 'degree deployed on Midnight Preprod at ' + result.contractAddress);
    } catch (err) {
      console.error('Browser deployment failed:', err);
      alert(err instanceof Error ? err.message : 'Browser deployment failed.');
    } finally {
      setIsDeploying(false);
    }
    return;
    if (import.meta.env.VITE_DEMO_MODE !== 'true') {
      alert('Live contract deployment is handled by deploy.mjs. Set VITE_DEMO_MODE=true only for local UI demos.');
      return;
    }
    if (!walletConnected) return;
    setIsDeploying(true);
    setDeployStep(0);
    const interval = setInterval(() => {
      setDeployStep(prev => {
        if (prev < deploySteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setContractAddress("midnight1e4v89fjwla0928hdskla9382hdksla0298a");
            setContractDeployed(true);
            setIsDeploying(false);
            setWalletBalance(prevBal => (parseFloat(prevBal) - 15.5).toFixed(2));
            logTransaction('0xdep1...88cc', 'CONTRACT DEPLOYED', '-15.50 tNIGHT', 'Deployed degree.compact contract onto Preprod');
          }, 800);
          return prev;
        }
      });
    }, 500);
  };

  const verifyGPA = async () => {
    if (!walletConnected || !contractDeployed || !contractAddress) return;
    try {
      const result = await submitDegreeCircuit((window as any).__midnightConnectedWallet, contractAddress, 'verifyDegree', [new TextEncoder().encode(`gpa:${formValues.gpa_score}`)]);
      setLedger(prev => ({ ...prev, verification_result: 'true' }));
      logTransaction(result.txId, 'CONFIRMED ON MIDNIGHT', '—', 'Confirmed verifyDegree on ' + contractAddress);
      return;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'The Midnight transaction failed.');
      logTransaction('—', 'TRANSACTION FAILED', '—', err instanceof Error ? err.message : 'Unknown transaction failure');
      return;
    }
    setIsProving(true);
    setProvingStep(0);
    const interval = setInterval(() => {
      setProvingStep(prev => {
        if (prev < proofSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            const passed = Number(formValues.gpa_score) >= ledger.minimum_gpa;
            setLedger(prevLedger => ({
              ...prevLedger,
              verification_result: passed ? "true" : "false"
            }));
            
            const randomTx = '0x' + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('') + '...' + Array.from({length: 4}, () => Math.floor(Math.random()*16).toString(16)).join('');
            logTransaction(randomTx, passed ? 'VERIFIED' : 'REJECTED', '-0.05 tNIGHT', `GPA check verified privately against threshold: ${formValues.gpa_score}`);
            setIsProving(false);
            setWalletBalance(prevBal => (parseFloat(prevBal) - 0.05).toFixed(2));
          }, 600);
          return prev;
        }
      });
    }, 450);
  };

  const logTransaction = (hash: string, status: string, fee: string, details: string) => {
    setLogs(prev => [
      {
        hash,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status,
        fee,
        details
      },
      ...prev
    ]);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '30px' }}>
        <div>
          <span style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '20px', background: 'rgba(225, 29, 72, 0.15)', color: '#f43f5e', border: '1px solid rgba(225, 29, 72, 0.3)', fontWeight: 600 }}>Project 3</span>
          <h1 style={{ fontSize: '2.2rem', marginTop: '6px', fontWeight: 800 }}>Stanford Credential Attestation</h1>
        </div>
        <div>
          {walletConnected ? (
            <div style={{ background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.25)', borderRadius: '12px', padding: '8px 16px' }}>
              Lace Balance: <strong style={{ color: '#f43f5e' }}>{walletBalance} tNIGHT</strong>
            </div>
          ) : (
            <button onClick={connectLace} style={{ width: 'auto' }}>Connect Lace Wallet</button>
          )}
        </div>
      </header>

<section className="home-dashboard" aria-labelledby="home-dashboard-title">
        <div className="home-dashboard__lead">
          <span className="home-kicker">Registrar console</span>
          <h2 id="home-dashboard-title">Credential review</h2>
          <p>Create a hiring-ready degree proof from a signed record.</p>
          <div className="home-actions">
            <button type="button" onClick={() => setActiveTab('dashboard')}>Open Workspace</button>
            <button type="button" className="home-secondary" onClick={() => setActiveTab('privacy')}>Read Privacy Model</button>
          </div>
        </div>
        <div className="home-dashboard__grid">
          <article className="home-card"><span>Network</span><strong>Midnight Preprod</strong><small>{contractDeployed ? 'Contract verified' : 'Contract setup pending'}</small></article>
          <article className="home-card"><span>Current signal</span><strong>University issuer online</strong><small>GPA stays private</small></article>
          <article className="home-card"><span>Wallet session</span><strong>{walletConnected ? 'Connected' : 'Not connected'}</strong><small>{walletConnected ? walletBalance + ' tNIGHT available' : 'Connect 1AM to continue'}</small></article>
          <article className="home-card"><span>Contract address</span><strong className="home-address">{contractAddress ? contractAddress.slice(0, 14) + '…' : 'Awaiting deployment'}</strong><small>Unique project deployment</small></article>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ width: 'auto', padding: '10px 20px', background: activeTab === 'dashboard' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'dashboard' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🎓 Transcript Attestation</button>
        <button onClick={() => setActiveTab('deployer')} style={{ width: 'auto', padding: '10px 20px', background: activeTab === 'deployer' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'deployer' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🏫 University Authority Deployer</button>
        <button onClick={() => setActiveTab('walletHub')} style={{ width: 'auto', padding: '10px 20px', background: activeTab === 'walletHub' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'walletHub' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🔐 Student Keyring</button>
        <button onClick={() => setActiveTab('privacy')} style={{ width: 'auto', padding: '10px 20px', background: activeTab === 'privacy' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'privacy' ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>📝 GPA Privacy Disclosures</button>
      </div>

      <main style={{ minHeight: '400px' }}>
        {activeTab === 'dashboard' && (
          <div>
            {(!walletConnected || !contractDeployed) && (
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '30px', textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#f87171' }}>⚠️ Missing Setup Prerequisites</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '0.9rem' }}>
                  {!walletConnected ? "Please connect your Lace Wallet in the Wallet Hub." : "Please deploy the Compact contract in the ZK Deployer."}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', opacity: (walletConnected && contractDeployed) ? 1 : 0.4, pointerEvents: (walletConnected && contractDeployed) ? 'auto' : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e' }}>
                    <FileText className="w-5 h-5" /> Requirements Board
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>MINIMUM GPA THRESHOLD</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: '4px' }}>{ledger.minimum_gpa}.00 / 4.00</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TRUSTED REGISTRAR</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginTop: '4px' }}>{ledger.trusted_universities}</div>
                    </div>
                  </div>
                </section>

                <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>VERIFICATION OUTCOME STATUS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: ledger.verification_result === "true" ? 'var(--color-success)' : '#ef4444' }}>
                    {ledger.verification_result === "true" ? "✓ ELIGIBILITY CRITERIA VALIDATED" : "✕ UNVERIFIED GRADE STATUS"}
                  </div>
                </section>
              </div>

              <div>
                <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award className="w-5 h-5" /> Credential Assertions
                  </h2>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Your Private GPA Score</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={formValues.gpa_score} 
                      onChange={e => setFormValues({ ...formValues, gpa_score: Number(e.target.value) })}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Registrar Signature Key</label>
                    <input 
                      type="text" 
                      value={formValues.reg_sig} 
                      onChange={e => setFormValues({ ...formValues, reg_sig: e.target.value })}
                    />
                  </div>
                  <button onClick={verifyGPA} disabled={isProving}>
                    {isProving ? "Running Transcript ZK Circuit..." : "Prove Academic GPA"}
                  </button>

                  {isProving && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(225,29,72,0.05)', border: '1px dashed #e11d48', borderRadius: '8px', fontSize: '0.8rem' }}>
                      {proofSteps.map((step, idx) => (
                        <div key={idx} style={{ padding: '3px 0', color: idx === provingStep ? 'white' : 'var(--text-secondary)', opacity: idx <= provingStep ? 1 : 0.4 }}>
                          {idx < provingStep ? '✓' : '●'} {step}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deployer' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f43f5e' }}>
              <Cpu className="w-5 h-5" /> Academic Registry Deployer
            </h2>
            {contractDeployed ? (
              <p style={{ color: '#10b981' }}>Active Address: {contractAddress}</p>
            ) : (
              <button onClick={deployContractAction} disabled={isDeploying || !walletConnected}>
                {isDeploying ? "Deploying..." : "Compile & Deploy Contract"}
              </button>
            )}

            {isDeploying && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(225, 29, 72, 0.05)', border: '1px dashed #e11d48', borderRadius: '8px', fontSize: '0.8rem' }}>
                {deploySteps.map((step, idx) => (
                  <div key={idx} style={{ padding: '3px 0', color: idx === deployStep ? 'white' : 'var(--text-secondary)', opacity: idx <= deployStep ? 1 : 0.4 }}>
                    {idx < deployStep ? '✓' : '●'} {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'walletHub' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f43f5e' }}>
              <Wallet className="w-5 h-5" /> Wallet Console
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '12px' }}>
                <h3>Lace Account</h3>
                {walletConnected ? (
                  <div>
                    <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.85rem', marginBottom: '10px' }}>{walletAddress}</div>
                    <button onClick={disconnectLace} style={{ width: 'auto', background: '#dc2626' }}>Disconnect</button>
                  </div>
                ) : (
                  <button onClick={connectLace} style={{ width: 'auto' }}>Connect Wallet</button>
                )}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '12px' }}>
                <h3>Preprod Faucet</h3>
                <button onClick={requestFaucet} disabled={!walletConnected || faucetLoading}>
                  {faucetLoading ? "Requesting..." : "Mint Faucet Tokens"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f43f5e' }}>
              <Lock className="w-5 h-5" /> Zero-Knowledge Privacy Model
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '24px', borderRadius: '12px' }}>
                <h3 style={{ color: '#10b981' }}>Can Learn:</h3>
                <ul>
                  <li>Validation state result (boolean).</li>
                  <li>Registrar key signature.</li>
                </ul>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '24px', borderRadius: '12px' }}>
                <h3 style={{ color: '#f87171' }}>Cannot Learn:</h3>
                <ul>
                  <li>Your exact GPA values.</li>
                  <li>Course grades or names.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
