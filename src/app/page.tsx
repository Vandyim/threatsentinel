"use client";

import { useState, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";


// ─── Constants ────────────────────────────────────────────────────────────────
const CONTRACT_ADDRESS = "0xfcCA520648ad51Aa8B1e14B2d0DBB5D9e42101cA";

const STATS = [
  { value: "12,847", label: "URLs Analyzed" },
  { value: "2,391", label: "Scams Flagged" },
  { value: "5", label: "AI Validators" },
  { value: "3", label: "Avg Verdict Time" },
];

const STEPS = [
  {
    num: "01",
    title: "Drop the link",
    desc: "Paste any public URL. Reading a cached verdict is free — you only sign a transaction when you want a fresh analysis.",
  },
  {
    num: "02",
    title: "Contract fetches the page",
    desc: "The Intelligent Contract visits the URL live on the real internet, pulling raw HTML to inspect.",
  },
  {
    num: "03",
    title: "Validators reach consensus",
    desc: "Multiple validators independently run the LLM analysis. Optimistic Democracy resolves any disagreements.",
  },
  {
    num: "04",
    title: "Read the verdict",
    desc: "The result — Safe, Phishing, or Malicious — is written onchain. Anyone can call get_verdict() to read it forever.",
  },
];

const FAQS = [
  {
    q: "What is ThreatSentinel?",
    a: "ThreatSentinel is an onchain URL authenticity checker. You paste a link, and an Intelligent Contract on GenLayer asks multiple AI validators to independently judge whether the site is legitimate, phishing, or malicious. The verdict is recorded onchain and can be read by anyone — no central server.",
  },
  {
    q: "Why is this onchain at all?",
    a: "Traditional phishing checkers are single-server black boxes. Onchain consensus means the verdict is tamper-proof, auditable, and permanent. Nobody — including us — can alter a stored result.",
  },
  {
    q: "How is the verdict generated?",
    a: "The contract fetches the page HTML live, sends a snapshot to an LLM with a cybersecurity prompt, and requires multiple independent validators to agree on the classification before it's finalized.",
  },
  {
    q: "Do I need a wallet?",
    a: "Only to submit a fresh analysis. Reading a cached verdict is completely free and requires no wallet. Fresh analyses require a small gas fee on the GenLayer network.",
  },
  {
    q: "Can the analysis be wrong?",
    a: "AI is not perfect. ThreatSentinel provides a strong probabilistic signal, not a legal guarantee. Always use your own judgment alongside any automated tool.",
  },
  {
    q: "What happens if a URL was already analyzed?",
    a: "The cached verdict is returned instantly and for free. You can optionally force a fresh analysis by signing a new transaction — useful for URLs that may have changed.",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type Verdict = {
  verdict: "safe" | "phishing" | "malicious";
  reason: string;
  confidence: number;
};

type AnalysisState = "idle" | "loading" | "success" | "error";

// ─── Subcomponents ────────────────────────────────────────────────────────────

function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none select-none fixed inset-0 z-0 opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
      }}
    />
  );
}

function GridLines() {
  return (
    <div
      className="pointer-events-none select-none fixed inset-0 z-0 opacity-[0.025]"
      style={{
        backgroundImage: `linear-gradient(#00d4ff 1px, transparent 1px), linear-gradient(90deg, #00d4ff 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }}
    />
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[#1a1a1a] bg-[#050505]/90 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" />
        <span className="font-mono text-sm text-[#00d4ff] tracking-widest uppercase">
          ThreatSentinel
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm text-[#999] font-sans">
        {["How it works", "Signals", "Demo", "FAQ"].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
            className="hover:text-[#e8e8e8] transition-colors duration-200"
          >
            {item}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;
            return (
              <div className="flex items-center gap-3">
                {!connected ? (
                  <button
                    onClick={openConnectModal}
                    className="px-4 py-2 text-xs font-mono tracking-widest uppercase border border-[#1a1a1a] text-[#999] hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all duration-200"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <button
                    onClick={openAccountModal}
                    className="px-4 py-2 text-xs font-mono tracking-widest uppercase border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#050505] transition-all duration-200"
                  >
                    {account.displayName}
                  </button>
                )}
                <a
                  href="#analyze"
                  className="px-4 py-2 text-xs font-mono tracking-widest uppercase bg-[#00d4ff] text-[#050505] font-bold hover:bg-[#b8e600] transition-colors duration-200"
                >
                  Launch App →
                </a>
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-12 overflow-hidden">
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
        <span className="font-mono text-xs text-[#999] tracking-widest uppercase">
          Live on GenLayer Studionet
        </span>
      </div>

      {/* Main headline */}
      <div className="max-w-5xl">
        <h1 className="font-serif font-black leading-[0.9] tracking-tight mb-8">
          <span className="block text-[clamp(3rem,10vw,8rem)] text-[#e8e8e8]">
            Don't click
          </span>
          <span className="block text-[clamp(3rem,10vw,8rem)] text-[#00d4ff] italic">
            blind
          </span>
          <span className="block text-[clamp(3rem,10vw,8rem)] text-[#e8e8e8]">
            Let the blockchain decide.
          </span>
        </h1>

        <p className="max-w-lg text-[#999] font-sans text-lg leading-relaxed mb-10">
          Drop any URL. In seconds, multiple AI validators reach consensus on
          whether the site is authentic, suspicious, or a scam — and the verdict
          is recorded onchain forever.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <a
            href="#analyze"
            className="px-8 py-4 bg-[#00d4ff] text-[#050505] font-mono text-sm font-bold tracking-widest uppercase hover:bg-[#b8e600] transition-colors duration-200"
          >
            Analyze a URL →
          </a>
          <a
            href="#how-it-works"
            className="px-8 py-4 border border-[#1a1a1a] text-[#999] font-mono text-sm tracking-widest uppercase hover:border-[#666] hover:text-[#e8e8e8] transition-all duration-200"
          >
            How it works
          </a>
        </div>
      </div>

      {/* Decorative corner element */}
      <div className="absolute bottom-12 right-6 font-mono text-xs text-[#1a1a1a] text-right">
        <div>BLOCKCHAIN</div>
        <div>VERIFIED</div>
        <div>AI CONSENSUS</div>
      </div>
    </section>
  );
}

function StatsRow() {
  return (
    <section className="border-t border-b border-[#1a1a1a] px-6 py-16 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[100px] bg-[#00d4ff] opacity-[0.03] blur-[80px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <p className="font-mono text-xs text-[#777] tracking-widest uppercase mb-6">
          — Why ThreatSentinel —
        </p>
        <blockquote className="font-serif font-black italic text-[clamp(1.5rem,4vw,3rem)] leading-[1.1] text-[#e8e8e8]">
          "The first onchain URL threat detector.
          <br />
          <span className="text-[#00d4ff]">No server. No bias.</span>
          <br />
          No tampering."
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-6">
          <div className="h-px w-16 bg-[#1a1a1a]" />
          <span className="font-mono text-xs text-[#666] tracking-widest uppercase">
            Powered by GenLayer · AI Consensus
          </span>
          <div className="h-px w-16 bg-[#1a1a1a]" />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24">
      <div className="max-w-4xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-16">
          <span className="font-mono text-xs text-[#777] tracking-widest">
            [ 01 / HOW IT WORKS ]
          </span>
        </div>

        <h2 className="font-serif font-black text-[clamp(2.5rem,6vw,5rem)] leading-[0.9] text-[#e8e8e8] mb-4">
          Five steps,
        </h2>
        <h2 className="font-serif font-black italic text-[clamp(2.5rem,6vw,5rem)] leading-[0.9] text-[#00d4ff] mb-20">
          three seconds.
        </h2>

        <div className="space-y-0">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="group flex items-start gap-8 py-8 border-b border-[#1a1a1a] hover:border-[#00d4ff]/20 transition-colors duration-300"
            >
              <span className="font-mono text-xs text-[#2a2a2a] group-hover:text-[#00d4ff]/40 transition-colors duration-300 pt-1 shrink-0">
                {step.num}
              </span>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-2xl text-[#e8e8e8] mb-3 group-hover:text-[#00d4ff] transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="font-sans text-[#888] leading-relaxed max-w-xl">
                  {step.desc}
                </p>
              </div>
              <span className="font-mono text-xs text-[#1a1a1a] group-hover:text-[#2a2a2a] transition-colors duration-300 pt-1 shrink-0 hidden md:block">
                STEP {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Signals() {
  const signals = [
    {
      num: "S1",
      title: "Domain Analysis",
      desc: "We check the domain age, registrar, and whether it mimics a known brand.",
      bullets: ["Domain registered < 30 days ago", "Typosquatting a known brand", "Suspicious TLD (.ru, .tk, .xyz)"],
    },
    {
      num: "S2",
      title: "Page Content Scan",
      desc: "The contract fetches live HTML and scans for phishing patterns.",
      bullets: ["Fake login forms", "Brand logos with mismatched domain", "Urgency language (act now, verify immediately)"],
    },
    {
      num: "S3",
      title: "Redirect Behaviour",
      desc: "Malicious sites often chain redirects to hide the final destination.",
      bullets: ["Malicious sites often chain redirects to hide the final destination."],
    },
    {
      num: "S4",
      title: "Content red flags",
      desc: "AI scans page text for known scam patterns and impersonation attempts.",
      bullets: ["Requests wallet seed phrases", "Impersonates crypto projects or banks", "Promises guaranteed return"],
    },
  ];

  return (
    <section id="signals" className="px-6 py-24 bg-[#0d0d0d]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-16">
          <span className="font-mono text-xs text-[#777] tracking-widest">
            [ 02 / SIGNALS ]
          </span>
        </div>

        <h2 className="font-serif font-black text-[clamp(2rem,5vw,4rem)] leading-[0.9] text-[#e8e8e8] mb-2">
          Four signals,{" "}
          <span className="italic text-[#00d4ff]">ratios that matter</span>
        </h2>
        <p className="font-sans text-[#888] mb-16 max-w-xl mt-4">
          We compare engagement ratios within a single URL. A viral hit is not suspicious. Likes greater than 70% of views, or retweets greater than likes — those are.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a1a1a]">
          {signals.map((sig, i) => (
            <div key={i} className="bg-[#0d0d0d] p-8 hover:bg-[#111] transition-colors duration-200">
              <div className="font-mono text-xs text-[#00d4ff] mb-4 tracking-widest">
                {sig.num}
              </div>
              <h3 className="font-serif font-bold text-xl text-[#e8e8e8] mb-2">
                {sig.title}
              </h3>
              <p className="font-sans text-sm text-[#888] mb-4 leading-relaxed">
                {sig.desc}
              </p>
              <ul className="space-y-1">
                {sig.bullets.map((b, j) => (
                  <li key={j} className="font-mono text-xs text-[#777] flex items-start gap-2">
                    <span className="text-[#00d4ff]/40 mt-0.5">▸</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActionZone() {
  const { isConnected } = useAccount();
  const [url, setUrl] = useState("");
  const [state, setState] = useState<AnalysisState>("idle");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLog = (line: string) => {
    setLogLines((prev) => [...prev, line]);
  };

  const verdictStyles = {
    safe: {
      border: "border-[#00d4ff]",
      label: "✓ SAFE",
      labelColor: "text-[#00d4ff]",
      bg: "bg-[#00d4ff]/5",
    },
    phishing: {
      border: "border-orange-500",
      label: "⚠ PHISHING",
      labelColor: "text-orange-400",
      bg: "bg-orange-500/5",
    },
    malicious: {
      border: "border-red-500",
      label: "✗ MALICIOUS",
      labelColor: "text-red-400",
      bg: "bg-red-500/5",
    },
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    if (!isConnected) return;

    setState("loading");
    setVerdict(null);
    setError(null);
    setLogLines([]);

    try {
      addLog(`>Connecting to wallet...`);

      const account = createAccount();
      const genClient = createClient({ 
         chain: studionet,
         account: account,
      });

      const txHash = await genClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: "check_url",
        args: [url],
        value: BigInt(0),
      });

addLog(`> TX: ${txHash.slice(0, 16)}...${txHash.slice(-8)}`);
      setTxHash(txHash);
addLog(`> Waiting for validator consensus...`);
addLog(`> [Validator 1] Running LLM analysis...`);
addLog(`> [Validator 2] Running LLM analysis...`);
addLog(`> [Validator 3] Running LLM analysis...`);

await genClient.waitForTransactionReceipt({
  hash: txHash,
  status: TransactionStatus.FINALIZED,
  retries: 60,
  interval: 5000,
});

      addLog(`> Consensus reached. Reading verdict...`);

      const raw = await genClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: "get_verdict",
        args: [url],
      });

      const data = JSON.parse(raw as string) as Verdict;
      addLog(`> Verdict finalized onchain.`);
      setVerdict(data);
      setState("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(msg);
      addLog(`> ERROR: ${msg}`);
      setState("error");
    }
  };

  return (
    <section id="analyze" className="px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-16">
          <span className="font-mono text-xs text-[#777] tracking-widest">
            [ 03 / TRY IT ]
          </span>
        </div>

        <h2 className="font-serif font-black text-[clamp(2rem,5vw,4rem)] leading-[0.9] text-[#e8e8e8] mb-2">
          Paste a link.
        </h2>
        <h2 className="font-serif font-black italic text-[clamp(2rem,5vw,4rem)] leading-[0.9] text-[#00d4ff] mb-16">
          Get a verdict.
        </h2>

        {/* Terminal box */}
        <div className="border border-[#1a1a1a] bg-[#0d0d0d]">
          {/* Terminal titlebar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex items-center gap-4">
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                  <span className="font-mono text-xs text-[#00d4ff] tracking-widest">WALLET CONNECTED</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#444]" />
                  <span className="font-mono text-xs text-[#777] tracking-widest">NO WALLET</span>
                </div>
              )}
            </div>
          </div>

          {/* Input row */}
          <div className="flex items-center border-b border-[#1a1a1a]">
            <span className="font-mono text-xs text-[#777] px-4">$</span>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && isConnected && handleAnalyze()}
              placeholder="https://suspicious-site-example.com/login"
              className="flex-1 bg-transparent font-mono text-sm text-[#e8e8e8] py-4 px-2 outline-none placeholder-[#555]"
            />
            <button
              onClick={handleAnalyze}
              disabled={!isConnected || state === "loading" || !url.trim()}
              className="px-6 py-4 font-mono text-sm tracking-widest uppercase bg-[#00d4ff] text-[#050505] font-bold hover:bg-[#b8e600] disabled:bg-[#1a1a1a] disabled:text-[#666] disabled:cursor-not-allowed transition-colors duration-200 shrink-0 border-l border-[#1a1a1a]"
            >
              {state === "loading" ? "Running..." : "Analyze →"}
            </button>
          </div>

          {/* Wallet state inside terminal */}
          {!isConnected && (
           <div className="flex flex-col items-center justify-center py-12 gap-4">
             <p className="font-mono text-xs text-[#777] tracking-widest">
               WALLET SIGNATURE REQUIRED FOR FRESH ANALYSIS
            </p>
           <ConnectButton />
           <div className="flex flex-col items-center gap-2 mt-2">
             <p className="font-mono text-xs text-[#666] text-center max-w-sm">
               Each analysis costs a small amount of test GEN gas.
             </p>
            
                 <a href="https://testnet-faucet.genlayer.foundation/" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#00d4ff] border border-[#00d4ff]/30 px-4 py-2 hover:bg-[#00d4ff]/10 transition-colors">
        Get free test GEN from faucet →
      </a>
      <p className="font-mono text-xs text-[#666]">
        Free · No real money · Studionet only
          </p>
        </div>
       </div>
      )}

          {/* Loading state — validator log */}
          {isConnected && state === "loading" && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
                <span className="font-mono text-xs text-[#00d4ff] tracking-widest animate-pulse">
                  VALIDATOR CONSENSUS IN PROGRESS . MAY TAKE 2-4 MIN
                </span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {logLines.map((line, i) => (
                  <div key={i} className="font-mono text-xs text-[#888]">
                    {line}
                  </div>
                ))}
                <div className="font-mono text-xs text-[#00d4ff]">
                  ▌
                  <span className="animate-blink">_</span>
                </div>
              </div>
            </div>
          )}

          {/* Success — verdict card */}
          {state === "success" && verdict && (() => {
            const style = verdictStyles[verdict.verdict];
            return (
              <div className={`m-4 border ${style.border} ${style.bg} p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <span className={`font-mono text-lg font-bold ${style.labelColor} tracking-widest`}>
                    {style.label}
                  </span>
                  <span className="font-mono text-xs text-[#777]">
                    {verdict.confidence}% CONFIDENCE
                  </span>
                </div>
                <p className="font-sans text-[#888] text-sm leading-relaxed mb-4">
                  {verdict.reason}
                </p>
                <div className="border-t border-[#1a1a1a] pt-4 mt-4 space-y-2">
  <p className="font-mono text-xs text-[#666]">
    Verdict recorded onchain · Contract: {CONTRACT_ADDRESS.slice(0, 12)}...
  </p>
  {txHash && (
  <div className="flex flex-col gap-2 mt-3">
    <p className="font-mono text-xs text-[#555] tracking-widest">
      TRANSACTION HASH
    </p>

    <a
      href={`https://explorer-bradbury.genlayer.com/tx/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs text-[#00d4ff] break-all hover:text-[#b8e600] hover:underline transition-colors"
    >
      {txHash}
    </a>

    <p className="font-mono text-[11px] text-[#666]">
      Verify on GenLayer Explorer →
    </p>
  </div>
)}
</div>
              </div>
            );
          })()}

          {/* Error state */}
          {state === "error" && error && (
            <div className="m-4 border border-red-900 bg-red-500/5 p-6">
              <div className="font-mono text-sm text-red-400 mb-2">
                ✗ ANALYSIS FAILED
              </div>
              <p className="font-mono text-xs text-[#888]">{error}</p>
            </div>
          )}

          {/* Idle with wallet connected */}
          {isConnected && state === "idle" && (
            <div className="px-6 py-8 text-center">
              <p className="font-sans text-xs text-[#666]">
                Paste a URL above. Reading a cached result is free; submitting a fresh analysis requires a wallet signature.
              </p>
            </div>
          )}
        </div>

        <p className="font-mono text-xs text-[#666] mt-4">
          Reading a cached verdict is free and instant. New analyses require MetaMask to sign a single transaction on the GenLayer Network.
        </p>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="px-6 py-24 bg-[#0d0d0d]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-16">
          <span className="font-mono text-xs text-[#777] tracking-widest">
            [ 04 / FAQ ]
          </span>
        </div>

        <h2 className="font-serif font-black text-[clamp(2rem,5vw,4rem)] leading-[0.9] text-[#e8e8e8] mb-4">
          Questions,
        </h2>
        <h2 className="font-serif font-black italic text-[clamp(2rem,5vw,4rem)] leading-[0.9] text-[#00d4ff] mb-16">
          answered.
        </h2>

        <div className="space-y-0">
          {FAQS.map((faq, i) => (
            <div key={i} className="border-b border-[#1a1a1a]">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-6 text-left group"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-[#666]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif text-lg font-bold text-[#e8e8e8] group-hover:text-[#00d4ff] transition-colors duration-200">
                    {faq.q}
                  </span>
                </div>
                <span className="font-mono text-[#777] text-xl shrink-0 ml-4 group-hover:text-[#00d4ff] transition-colors duration-200">
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i && (
                <div className="pb-6 pl-10">
                  <p className="font-sans text-[#888] leading-relaxed max-w-2xl">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#1a1a1a] px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
          <span className="font-mono text-xs text-[#777] tracking-widest uppercase">
            ThreatSentinel
          </span>
        </div>
        <p className="font-mono text-xs text-[#2a2a2a]">
          Powered by GenLayer · Onchain AI consensus
        </p>
        <p className="font-mono text-xs text-[#2a2a2a]">
          Not legal advice. Use your judgment.
        </p>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main className="bg-[#050505] min-h-screen relative">
      <NoiseOverlay />
      <GridLines />
      <div className="relative z-10">
        <Nav />
        <Hero />
        <StatsRow />
        <HowItWorks />
        <Signals />
        <ActionZone />
        <FAQ />
        <Footer />
      </div>
    </main>
  );
}
