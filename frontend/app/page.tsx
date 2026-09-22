"use client";

import { useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:8010";

type ConditionResult = {
  field: string;
  actual_value: unknown;
  operator: string;
  expected_value: unknown;
  matched: boolean;
};

type RuleResult = {
  flag: string;
  description: string;
  logic: string;
  matched: boolean;
  conditions: ConditionResult[];
};

type RetrievedKnowledge = {
  content: string;
  source: string;
  page: number | null;
  domain: string;
  category: string;
  distance: number;
  flag: string;
  query: string;
};

type AnalysisResponse = {
  specification_name: string;
  received_data: Record<string, unknown>;
  flags: string[];
  rule_results: RuleResult[];
  queries: string[];
  retrieved_knowledge: RetrievedKnowledge[];
  answer: string;
};

const scenarios = {
  customer: {
    name: "Customer Risk",
    specification: "customer_risk_v1",
    description: "Evaluate account signals across CRM, support, and billing.",
    data: {
      customer_name: "Customer X",
      days_until_renewal: 15,
      unresolved_support_issues: [
        "Login problem",
        "Billing dispute",
        "Delayed response",
      ],
      invoice_overdue: true,
      business_question: "Why is Customer X at risk?",
    },
  },
  project: {
    name: "Project Delivery",
    specification: "project_delivery_v1",
    description: "Identify delivery pressure from project progress and deadlines.",
    data: {
      project_name: "Project Alpha",
      tasks_completed: 4,
      days_remaining: 2,
      business_question: "Does this project require attention?",
    },
  },
  education: {
    name: "Education",
    specification: "education_v1",
    description: "Analyze assessment performance and attendance signals.",
    data: {
      student_name: "Student A",
      score: 42,
      attendance: 68,
      question: "What academic signals require attention?",
    },
  },
  health: {
    name: "Health Support",
    specification: "health_v1",
    description: "Demonstrate rule-based health decision support.",
    data: {
      age: 25,
      temperature: 39,
      question: "What does this temperature signal indicate?",
    },
  },
};

export default function Home() {
  const [specificationId, setSpecificationId] = useState(
    scenarios.customer.specification
  );

  const [inputData, setInputData] = useState(
    JSON.stringify(scenarios.customer.data, null, 2)
  );

  const [nResults, setNResults] = useState(3);
  const [maxDistance, setMaxDistance] = useState(0.75);
  const [searchType, setSearchType] = useState<"similarity" | "mmr">(
    "similarity"
  );
  const [fetchK, setFetchK] = useState(6);
  const [lambdaMult, setLambdaMult] = useState(0.5);

  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const matchedRules = useMemo(
    () => result?.rule_results.filter((rule) => rule.matched).length ?? 0,
    [result]
  );

  function loadScenario(
    scenario: (typeof scenarios)[keyof typeof scenarios]
  ) {
    setSpecificationId(scenario.specification);
    setInputData(JSON.stringify(scenario.data, null, 2));
    setResult(null);
    setError("");
  }

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let parsedInputData: Record<string, unknown>;

      try {
        parsedInputData = JSON.parse(inputData);
      } catch {
        throw new Error("Your structured input contains invalid JSON.");
      }

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_data: {
            data: parsedInputData,
          },
          specification_id: specificationId,
          retrieval_config: {
            n_results: nResults,
            max_distance: maxDistance,
            search_type: searchType,
            fetch_k: fetchK,
            lambda_mult: lambdaMult,
          },
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.detail ||
            `The analysis request failed with status ${response.status}.`
        );
      }

      setResult(responseData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while analyzing the input.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#0a0f1c] lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/20">
                AI
              </div>

              <div>
                <p className="text-sm font-semibold tracking-wide">
                  Decision Engine
                </p>
                <p className="text-xs text-slate-500">Intelligence Platform</p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 py-6">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Workspace
            </p>

            <nav className="mt-3 space-y-1">
              <div className="flex items-center gap-3 rounded-xl bg-cyan-400/10 px-3 py-3 text-sm font-medium text-cyan-300">
                <span>⌂</span>
                Decision Engine
              </div>

              <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500">
                <span>◈</span>
                Knowledge Base
              </div>

              <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500">
                <span>⚙</span>
                Specifications
              </div>
            </nav>

            <p className="mt-10 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Architecture
            </p>

            <div className="mt-4 space-y-3 px-3">
              {[
                "Structured Input",
                "Rule Analysis",
                "Flag Detection",
                "Knowledge Retrieval",
                "LLM Generation",
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-slate-500">
                    {index + 1}
                  </div>

                  <span className="text-xs text-slate-500">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 p-5">
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                <span className="text-xs font-medium text-emerald-300">
                  Engine Online
                </span>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                API connected to the local decision engine.
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="min-w-0 flex-1">
          {/* TOP BAR */}
          <header className="border-b border-white/10 bg-[#070b14]/90 px-6 py-5 backdrop-blur-xl lg:px-10">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400">
                  AI Decision Platform
                </p>

                <h1 className="mt-1 text-xl font-semibold tracking-tight">
                  Decision & Recommendation Engine
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Local environment
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300">
                  AI
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10 lg:py-10">
            {/* HERO */}
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/[0.08] via-transparent to-blue-500/[0.05] p-7 lg:p-10">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative max-w-4xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-medium text-cyan-300">
                  <span>✦</span>
                  Evidence-grounded intelligence
                </div>

                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Turn structured data into
                  <span className="text-cyan-400"> intelligent decisions.</span>
                </h2>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                  Analyze structured inputs with deterministic rules, identify
                  meaningful signals, retrieve relevant knowledge, and generate
                  grounded recommendations through an LLM.
                </p>

                <div className="mt-7 flex flex-wrap gap-3 text-xs text-slate-400">
                  {[
                    "Rule-based analysis",
                    "Flag-driven retrieval",
                    "Similarity search",
                    "MMR",
                    "LLM grounding",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-black/10 px-3 py-2"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* SCENARIOS */}
            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Quick scenarios
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">
                    Explore the generic engine
                  </h3>
                </div>

                <p className="hidden text-xs text-slate-600 sm:block">
                  Load an example into the analysis workspace
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Object.entries(scenarios).map(([key, scenario]) => (
                  <button
                    key={key}
                    onClick={() => loadScenario(scenario)}
                    className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">
                        {key === "customer"
                          ? "◎"
                          : key === "project"
                            ? "◫"
                            : key === "education"
                              ? "◇"
                              : "＋"}
                      </span>

                      <span className="text-xs text-slate-600 transition group-hover:text-cyan-400">
                        Load →
                      </span>
                    </div>

                    <h4 className="mt-5 text-sm font-semibold">
                      {scenario.name}
                    </h4>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {scenario.description}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {/* INPUT WORKSPACE */}
            <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              {/* INPUT */}
              <div className="rounded-3xl border border-white/10 bg-[#0b101c] p-6 shadow-2xl shadow-black/10 lg:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-xs text-cyan-300">
                        01
                      </span>

                      <h3 className="font-semibold">Structured Input</h3>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Provide the data that the deterministic analysis engine
                      should evaluate.
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-slate-500">
                    JSON
                  </span>
                </div>

                <label className="mt-7 block text-xs font-medium text-slate-400">
                  Specification ID
                </label>

                <input
                  value={specificationId}
                  onChange={(event) =>
                    setSpecificationId(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#070b14] px-4 py-3 font-mono text-sm text-cyan-300 outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/5"
                  placeholder="customer_risk_v1"
                />

                <label className="mt-5 block text-xs font-medium text-slate-400">
                  Input Data
                </label>

                <textarea
                  value={inputData}
                  onChange={(event) => setInputData(event.target.value)}
                  rows={18}
                  spellCheck={false}
                  className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#070b14] px-4 py-4 font-mono text-xs leading-6 text-slate-300 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/5"
                />

                <button
                  onClick={analyze}
                  disabled={loading}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-400/10 transition hover:bg-cyan-300 hover:shadow-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                      Running decision pipeline...
                    </>
                  ) : (
                    <>
                      Analyze input
                      <span>→</span>
                    </>
                  )}
                </button>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                    <p className="text-xs font-semibold text-red-300">
                      Analysis error
                    </p>
                    <p className="mt-1 text-xs leading-5 text-red-400/80">
                      {error}
                    </p>
                  </div>
                )}
              </div>

              {/* RETRIEVAL */}
              <div className="rounded-3xl border border-white/10 bg-[#0b101c] p-6 shadow-2xl shadow-black/10 lg:p-7">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/10 text-xs text-violet-300">
                    02
                  </span>

                  <h3 className="font-semibold">Retrieval Controls</h3>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Tune how the knowledge layer selects evidence for the LLM.
                </p>

                <div className="mt-7 space-y-5">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400">
                        Number of results
                      </label>

                      <span className="font-mono text-xs text-cyan-300">
                        {nResults}
                      </span>
                    </div>

                    <input
                      type="number"
                      min="1"
                      value={nResults}
                      onChange={(event) =>
                        setNResults(Number(event.target.value))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#070b14] px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400">
                        Maximum distance
                      </label>

                      <span className="font-mono text-xs text-cyan-300">
                        {maxDistance.toFixed(2)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={maxDistance}
                      onChange={(event) =>
                        setMaxDistance(Number(event.target.value))
                      }
                      className="mt-4 w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">
                      Search strategy
                    </label>

                    <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-[#070b14] p-1">
                      <button
                        onClick={() => setSearchType("similarity")}
                        className={`rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                          searchType === "similarity"
                            ? "bg-cyan-400 text-slate-950"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Similarity
                      </button>

                      <button
                        onClick={() => setSearchType("mmr")}
                        className={`rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                          searchType === "mmr"
                            ? "bg-violet-400 text-slate-950"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        MMR
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400">
                        Fetch K
                      </label>

                      <span className="font-mono text-xs text-violet-300">
                        {fetchK}
                      </span>
                    </div>

                    <input
                      type="number"
                      min="1"
                      value={fetchK}
                      onChange={(event) =>
                        setFetchK(Number(event.target.value))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#070b14] px-4 py-3 text-sm outline-none focus:border-violet-400/50"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400">
                        Lambda multiplier
                      </label>

                      <span className="font-mono text-xs text-violet-300">
                        {lambdaMult.toFixed(1)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={lambdaMult}
                      onChange={(event) =>
                        setLambdaMult(Number(event.target.value))
                      }
                      className="mt-4 w-full accent-violet-400"
                    />

                    <div className="mt-2 flex justify-between text-[10px] text-slate-700">
                      <span>More diversity</span>
                      <span>More relevance</span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-[11px] font-semibold text-slate-400">
                    Current retrieval mode
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {searchType === "mmr"
                      ? "MMR balances relevance with diversity across retrieved evidence."
                      : "Similarity returns the closest knowledge chunks to each generated query."}
                  </p>
                </div>
              </div>
            </section>

            {/* PIPELINE */}
            <section className="mt-8 rounded-3xl border border-white/10 bg-[#0b101c] p-6 lg:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    System pipeline
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">
                    From input to grounded answer
                  </h3>
                </div>
              </div>

              <div className="mt-7 grid gap-2 md:grid-cols-5">
                {[
                  ["01", "Input", "Structured data"],
                  ["02", "Analyze", "Rules & conditions"],
                  ["03", "Flags", "Detected signals"],
                  ["04", "Retrieve", "Relevant evidence"],
                  ["05", "Generate", "Grounded response"],
                ].map(([number, title, description], index) => (
                  <div key={number} className="flex items-center">
                    <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#070b14] p-4">
                      <div className="text-[10px] font-bold text-cyan-400">
                        {number}
                      </div>

                      <p className="mt-3 text-sm font-semibold">{title}</p>

                      <p className="mt-1 text-[11px] text-slate-600">
                        {description}
                      </p>
                    </div>

                    {index < 4 && (
                      <span className="hidden px-2 text-slate-700 md:block">
                        →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* RESULTS */}
            {result && (
              <section className="mt-8 space-y-6">
                {/* RESULT HEADER */}
                <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.07] to-transparent p-6 lg:p-7">
                  <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
                        Analysis complete
                      </p>

                      <h2 className="mt-2 text-2xl font-bold">
                        {result.specification_name}
                      </h2>

                      <p className="mt-2 text-xs text-slate-500">
                        Specification ID:{" "}
                        <span className="font-mono text-slate-400">
                          {specificationId}
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/10 px-5 py-4 text-center">
                        <p className="text-2xl font-bold text-cyan-300">
                          {result.flags.length}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                          Flags
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/10 px-5 py-4 text-center">
                        <p className="text-2xl font-bold text-violet-300">
                          {result.retrieved_knowledge.length}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                          Evidence
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/10 px-5 py-4 text-center">
                        <p className="text-2xl font-bold text-emerald-300">
                          {matchedRules}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                          Rules matched
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FLAGS */}
                <div className="rounded-3xl border border-white/10 bg-[#0b101c] p-6 lg:p-7">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-xs text-amber-300">
                      03
                    </span>

                    <div>
                      <h3 className="font-semibold">Detected Signals</h3>
                      <p className="text-xs text-slate-600">
                        Deterministically detected by the analysis engine.
                      </p>
                    </div>
                  </div>

                  {result.flags.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-5">
                      <p className="text-sm font-medium text-emerald-300">
                        No rules matched
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        The supplied data did not trigger any configured
                        conditions.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {result.flags.map((flag) => (
                        <div
                          key={flag}
                          className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <span className="text-sm font-semibold text-amber-200">
                              {flag}
                            </span>
                          </div>

                          <p className="mt-3 text-xs leading-5 text-slate-500">
                            This signal was generated by the deterministic
                            rule engine and can drive evidence retrieval.
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RULE ANALYSIS */}
                <div className="rounded-3xl border border-white/10 bg-[#0b101c] p-6 lg:p-7">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-400/10 text-xs text-blue-300">
                      04
                    </span>

                    <div>
                      <h3 className="font-semibold">Rule Analysis</h3>
                      <p className="text-xs text-slate-600">
                        Every condition evaluated against the supplied data.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    {result.rule_results.map((rule, index) => (
                      <div
                        key={`${rule.flag}-${index}`}
                        className="rounded-2xl border border-white/10 bg-[#070b14] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs text-slate-700">
                                RULE {String(index + 1).padStart(2, "0")}
                              </span>

                              <h4 className="text-sm font-semibold text-slate-200">
                                {rule.flag}
                              </h4>
                            </div>

                            <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
                              {rule.description}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                              rule.matched
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-white/[0.04] text-slate-600"
                            }`}
                          >
                            {rule.matched ? "Matched" : "Not matched"}
                          </span>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
                          <div className="grid grid-cols-4 border-b border-white/10 bg-white/[0.02] px-4 py-2 text-[10px] uppercase tracking-wider text-slate-700">
                            <span>Field</span>
                            <span>Operator</span>
                            <span>Expected</span>
                            <span>Result</span>
                          </div>

                          {rule.conditions.map((condition, conditionIndex) => (
                            <div
                              key={`${condition.field}-${conditionIndex}`}
                              className="grid grid-cols-4 gap-2 px-4 py-3 text-xs"
                            >
                              <span className="truncate font-mono text-slate-400">
                                {condition.field}
                              </span>

                              <span className="font-mono text-slate-600">
                                {condition.operator}
                              </span>

                              <span className="truncate font-mono text-slate-500">
                                {JSON.stringify(condition.expected_value)}
                              </span>

                              <span
                                className={
                                  condition.matched
                                    ? "font-medium text-emerald-300"
                                    : "font-medium text-red-300"
                                }
                              >
                                {condition.matched ? "✓ True" : "✕ False"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RETRIEVAL */}
                <div className="rounded-3xl border border-white/10 bg-[#0b101c] p-6 lg:p-7">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/10 text-xs text-violet-300">
                      05
                    </span>

                    <div>
                      <h3 className="font-semibold">Knowledge Retrieval</h3>
                      <p className="text-xs text-slate-600">
                        Evidence selected from the knowledge layer using the
                        detected flags.
                      </p>
                    </div>
                  </div>

                  {result.queries.length > 0 && (
                    <div className="mt-6">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                        Generated queries
                      </p>

                      <div className="mt-3 space-y-2">
                        {result.queries.map((query, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-violet-400/10 bg-violet-400/[0.03] px-4 py-3 font-mono text-[11px] leading-5 text-violet-200/70"
                          >
                            {query}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.retrieved_knowledge.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-amber-400/10 bg-amber-400/[0.03] p-5">
                      <p className="text-sm font-medium text-amber-300">
                        No sufficiently relevant evidence retrieved
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        The system will not generate an evidence-based
                        recommendation without supporting knowledge.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      {result.retrieved_knowledge.map((knowledge, index) => (
                        <div
                          key={`${knowledge.source}-${index}`}
                          className="rounded-2xl border border-white/10 bg-[#070b14] p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full border border-violet-400/10 bg-violet-400/5 px-3 py-1 text-[10px] text-violet-300">
                              {knowledge.flag}
                            </span>

                            <span className="font-mono text-[10px] text-slate-700">
                              distance {knowledge.distance.toFixed(4)}
                            </span>
                          </div>

                          <p className="mt-4 text-xs leading-6 text-slate-400">
                            {knowledge.content}
                          </p>

                          <div className="mt-5 border-t border-white/5 pt-4 text-[10px] text-slate-700">
                            <p>
                              Source:{" "}
                              <span className="text-slate-500">
                                {knowledge.source}
                              </span>
                            </p>

                            {knowledge.page !== null && (
                              <p className="mt-1">
                                Page:{" "}
                                <span className="text-slate-500">
                                  {knowledge.page}
                                </span>
                              </p>
                            )}

                            <p className="mt-1">
                              Category:{" "}
                              <span className="text-slate-500">
                                {knowledge.category}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI ANSWER */}
                <div className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.08] via-[#0b101c] to-[#0b101c] shadow-2xl shadow-cyan-400/[0.03]">
                  <div className="border-b border-cyan-400/10 px-6 py-5 lg:px-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-sm font-black text-slate-950">
                          ✦
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
                            Final intelligence
                          </p>

                          <h3 className="mt-1 text-lg font-semibold">
                            AI-Grounded Analysis
                          </h3>
                        </div>
                      </div>

                      <span className="rounded-full border border-cyan-400/10 bg-cyan-400/5 px-3 py-1.5 text-[10px] text-cyan-300">
                        Evidence grounded
                      </span>
                    </div>
                  </div>

                  <div className="px-6 py-7 lg:px-7">
                    <div className="max-w-5xl whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {result.answer}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* FOOTER */}
            <footer className="mt-12 border-t border-white/5 py-7">
              <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-700">
                <span>AI Decision & Recommendation System</span>
                <span>Rule Engine • Retrieval • LLM</span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}