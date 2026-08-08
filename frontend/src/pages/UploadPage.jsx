import HowItWorksModal from "./HowItWorksModal";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Rlogo from "../assets/logo.png";
const API_BASE = `http://${window.location.hostname}:8000`;

const COLORS = {
  bg: "#0B1120", // original navy-black page background
  cream: "#F8F7F4", // upload card — original off-white cream
  creamAlt: "#EEF1F6", // feature cards — slightly blue-tinted off-white,
  accent: "#2563EB", // original blue accent
  ink: "#1E293B", // original dark slate text on light surfaces
  headingOnDark: "#FFFFFF", // white headings on dark bg
  mutedOnDark: "#94A3B8", // original slate-400
  mutedOnCream: "#64748B", // original slate-500
  lightMuted: "#7C8AA5",
};

const RADIUS = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
};

const stageOrder = [
  "reading",
  "detecting",
  "analyzing",
  "scoring",
  "validating",
  "generating_report",
  "complete",
];

const stageLabels = {
  reading: "Reading document",
  detecting: "Detecting ambiguous requirements",
  analyzing: "Running AI contextual analysis",
  scoring: "Calculating quality scores",
  validating: "Running validation metrics",
  generating_report: "Generating final report",
  complete: "Analysis complete",
};

const TRANSFORMATIONS = [
  { vague: "fast", measurable: "within 2 seconds" },
  { vague: "user-friendly", measurable: "90% task success rate" },
  { vague: "secure", measurable: "AES-256 encrypted" },
  { vague: "reliable", measurable: "99.9% uptime" },
];

function TransformDemo() {
  const [pairIndex, setPairIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState("typing");

  useEffect(() => {
    let cancelled = false;
    const current = TRANSFORMATIONS[pairIndex];

    const run = async () => {
      setPhase("typing");
      setTyped("");
      for (let i = 1; i <= current.vague.length; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 70));
        setTyped(current.vague.slice(0, i));
      }
      await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;
      setPhase("strike");
      await new Promise((r) => setTimeout(r, 700));
      if (cancelled) return;
      setPhase("measurable");
      await new Promise((r) => setTimeout(r, 2000));
      if (cancelled) return;
      setPairIndex((prev) => (prev + 1) % TRANSFORMATIONS.length);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [pairIndex]);

  const current = TRANSFORMATIONS[pairIndex];

  return (
    <div className="font-mono text-2xl md:text-3xl flex items-center gap-3 h-12">
      {phase !== "measurable" && (
        <span
          style={{
            color: phase === "strike" ? `${COLORS.accent}80` : COLORS.accent,
          }}
          className={phase === "strike" ? "line-through" : ""}
        >
          {typed}
          {phase === "typing" && (
            <span
              style={{ backgroundColor: COLORS.accent }}
              className="inline-block w-0.5 h-7 ml-1 animate-pulse"
            />
          )}
        </span>
      )}
      {phase === "measurable" && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-emerald-500"
        >
          {current.measurable}
        </motion.span>
      )}
    </div>
  );
}

// animate product
function CountUp({ value, duration = 900, decimals = 0, delay = 0 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = null;
    let frame;
    const target = Number(value) || 0;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Number((eased * target).toFixed(decimals)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [value, duration, decimals, delay]);

  return <>{decimals > 0 ? display.toFixed(decimals) : display}</>;
}

const STATS_META = [
  { key: "precision", label: "Precision", suffix: "%", decimals: 1 },
  { key: "flagged", label: "Ambiguous Requirements Found", suffix: "" },
  { key: "score", label: "Avg. Quality Score", suffix: "/100" },
];

const TRUST_BADGES = [
  { icon: "ti-sparkles", label: "Powered by AI" },
  { icon: "ti-files", label: "Supports PDF, DOCX, TXT" },
  { icon: "ti-shield-check", label: "Secure — Runs Locally" },
];

const FEATURES = [
  {
    icon: "ti-search",
    title: "Ambiguity Detection",
    desc: "Detects vague, unclear, and inconsistent software requirements automatically using AI.",
  },
  {
    icon: "ti-list-details",
    title: "Requirement Classification",
    desc: "Classifies Functional and Non-Functional requirements for easier understanding and validation.",
  },
  {
    icon: "ti-chart-bar",
    title: "Quality Scoring",
    desc: "Scores each requirement on Measurability, Completeness, and Conciseness to generate an overall quality grade.",
  },
  {
    icon: "ti-sparkles",
    title: "AI Suggestions",
    desc: "Generates measurable, testable, and improved requirement statements using AI-powered contextual analysis.",
  },
];

const NAV_ITEMS = [
  { key: "how", label: "How it Works" },
  { key: "sample", label: "Sample Report" },
  { key: "history", label: "History" },
];

function FeatureCard({ f, i }) {
  const [hovering, setHovering] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 24 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
      className="relative h-full"
    >
      <motion.div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        animate={{
          y: hovering ? -6 : 0,
          boxShadow: hovering
            ? "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(37, 99, 235, 0.03)"
            : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{
          backgroundColor: COLORS.creamAlt,
          border: `1px solid ${hovering ? `${COLORS.accent}40` : "rgba(0, 0, 0, 0.05)"}`,
        }}
        className={`relative overflow-hidden ${RADIUS.lg} p-7 h-full flex flex-col transition-colors duration-300`}
      >
       
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${COLORS.accent}1F 0%, transparent 70%)`,
            opacity: hovering ? 1 : 0,
          }}
        />

        
        <span
          className="absolute top-6 right-6 font-mono text-xs font-semibold select-none pointer-events-none transition-colors duration-300"
          style={{ color: hovering ? COLORS.accent : COLORS.mutedOnCream }}
        >
          // {String(i + 1).padStart(2, "0")}
        </span>

        <motion.div
          animate={{ scale: hovering ? 1.08 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          style={{ backgroundColor: `${COLORS.accent}1A` }}
          className={`w-12 h-12 ${RADIUS.sm} flex items-center justify-center mb-6 relative z-10`}
        >
          <i
            className={`ti ${f.icon} text-xl`}
            style={{ color: COLORS.accent }}
            aria-hidden="true"
          ></i>
        </motion.div>

       
        <div className="relative z-10 flex-1 flex flex-col justify-between">
          <div>
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: COLORS.ink }}
            >
              {f.title}
            </h3>
            <p
              className="text-sm leading-6"
              style={{ color: COLORS.mutedOnCream }}
            >
              {f.desc}
            </p>
          </div>

          
          <div className="w-full h-0.5 bg-black/5 mt-6 overflow-hidden rounded">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: hovering ? "100%" : "0%" }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              style={{ backgroundColor: COLORS.accent }}
              className="h-full"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function UploadPage({ onResults, onShowHistory }) {
  const [file, setFile] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showSampleReport, setShowSampleReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stageIndex, setStageIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false); 
  const [isHovering, setIsHovering] = useState(false); 

  
  const [realStats, setRealStats] = useState(null);
  const [statsInView, setStatsInView] = useState(false);

  useEffect(() => {
    // axios.get("http://127.0.0.1:8000/history")
    axios
      .get(`${API_BASE}/history`)
      .then((res) => {
        const data = res.data || [];
        if (data.length === 0) {
          setRealStats({ precision: 0, flagged: 0, score: 0 });
          return;
        }
        const avgPrecision =
          data.reduce((s, h) => s + (h.precision_score || 0), 0) / data.length;
        const totalFlagged = data.reduce((s, h) => s + (h.flagged || 0), 0);
        const avgScore = Math.round(
          data.reduce((s, h) => s + (h.srs_score || 0), 0) / data.length,
        );
        setRealStats({
          precision: avgPrecision,
          flagged: totalFlagged,
          score: avgScore,
        });
      })
      .catch(() => setRealStats({ precision: 0, flagged: 0, score: 0 }));
  }, []);

 
  useEffect(() => {
    const fallback = setTimeout(() => setStatsInView(true), 1500);
    return () => clearTimeout(fallback);
  }, []);

  const [progress, setProgress] = useState({
    stage: "idle",
    current_step: 0,
    total_steps: 0,
    detail: "",
  });

  const pollingRef = useRef(null);

  useEffect(() => {
    if (!loading) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    pollingRef.current = setInterval(async () => {
      try {
        // const res = await axios.get("http://127.0.0.1:8000/progress")
        const res = await axios.get(`${API_BASE}/progress`);
        setProgress(res.data);
      } catch {}
    }, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loading]);

  const currentStageIndex = stageOrder.indexOf(progress.stage);

  const handleFileChange = (e) => validateAndSetFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const validateAndSetFile = (selected) => {
    if (!selected) return;
    const validExtensions = [".pdf", ".docx", ".txt"];
    const isValid = validExtensions.some((ext) =>
      selected.name.toLowerCase().endsWith(ext),
    );
    if (!isValid) {
      setError(
        "Unsupported file type. Please upload a PDF, DOCX, or TXT file.",
      );
      setFile(null);
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      setFile(null);
      return;
    }
    setFile(selected);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
     
      const response = await axios.post(`${API_BASE}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onResults(response.data);
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setError(
          "Cannot connect to the server. Please make sure the API is running.",
        );
      } else if (err.response?.status === 500) {
        setError(
          "The document could not be processed. It may be corrupted or empty.",
        );
      } else {
        setError("Analysis failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNavClick = (key) => {
    if (key === "how") setShowHowItWorks(true);
    if (key === "sample") setShowSampleReport(true);
    if (key === "history") onShowHistory?.();
  };

 
  const handleAnalyzeClick = () => {
    setFile(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      style={{ backgroundColor: COLORS.bg }}
      className="min-h-screen flex flex-col"
    >
      {/* Nav */}
      <div
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{ backgroundColor: `${COLORS.bg}CC` }}
      >
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between px-8 py-6 border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: "#eff7ff" }}
              className={`w-10 h-10 ${RADIUS.sm} flex items-center justify-center overflow-hidden`}
            >
              <img
                src={Rlogo}
                alt=""
                aria-hidden="true"
                className="w-10 h-10"
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                  transform: "scale(2.1) translate( 2%, 6%)",
                  transformOrigin: "center",
                }}
              />
            </div>
            <div>
              <h1
                className="font-display font-bold text-2xl tracking-tight"
                style={{ color: COLORS.headingOnDark }}
              >
                Req<span style={{ color: COLORS.accent }}>·</span>Intel
              </h1>
              <p className="text-xs" style={{ color: COLORS.mutedOnDark }}>
                AI Requirement Analysis
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-8 text-base font-semibold">
            <button
              onClick={handleAnalyzeClick}
              aria-current="page"
              className="relative pb-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded"
              style={{ color: COLORS.accent }}
            >
              Analyze
              <span
                style={{ backgroundColor: COLORS.accent }}
                className="absolute left-0 -bottom-1 h-0.5 w-full"
                aria-hidden="true"
              />
            </button>

            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className="group relative cursor-pointer pb-1 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded"
                style={{ color: COLORS.mutedOnDark }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = COLORS.headingOnDark)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = COLORS.mutedOnDark)
                }
              >
                {item.label}
                <span
                  style={{ backgroundColor: COLORS.accent }}
                  className="absolute left-0 -bottom-1 h-0.5 w-0 transition-all duration-300 group-hover:w-full"
                  aria-hidden="true"
                ></span>
              </button>
            ))}
          </div>
          <button
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: COLORS.headingOnDark }}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <i
              className={`ti ${mobileMenuOpen ? "ti-x" : "ti-menu-2"} text-2xl`}
              aria-hidden="true"
            />
          </button>
        </motion.nav>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="sm:hidden overflow-hidden border-b border-white/5"
              style={{ backgroundColor: COLORS.bg }}
            >
              <div className="flex flex-col gap-1 px-8 py-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);

                    setTimeout(() => {
                      handleAnalyzeClick();
                    }, 250); 
                  }}
                  className="w-full text-center py-2 font-semibold"
                  style={{ color: COLORS.accent }}
                >
                  Analyze
                </button>
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      handleNavClick(item.key);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2 font-semibold"
                    style={{ color: COLORS.mutedOnDark }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Hero sec */}
      <div className="px-8 pt-16 pb-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-left"
        >
          <p
            className="text-sm font-mono mb-4 tracking-wide"
            style={{ color: COLORS.accent }}
          >
            REQUIREMENT QUALITY ASSURANCE
          </p>
          <h1
            className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-10"
            style={{ color: COLORS.headingOnDark }}
          >
            Every vague requirement
            <br />
            becomes a measurable one.
          </h1>
          <TransformDemo />
          <p
            className="text-base mt-8 max-w-xl leading-relaxed"
            style={{ color: COLORS.mutedOnDark }}
          >
            Upload your SRS document. Req-Intel detects ambiguous language,
            scores requirement quality, and rewrites unclear statements into
            testable, measurable requirements using AI-powered contextual
            analysis.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            {TRUST_BADGES.map((b) => (
              <span
                key={b.label}
                style={{
                  backgroundColor: `${COLORS.accent}14`,
                  color: COLORS.mutedOnDark,
                }}
                className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 ${RADIUS.sm}`}
              >
                <i
                  className={`ti ${b.icon} text-sm`}
                  style={{ color: COLORS.accent }}
                />
                {b.label}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          // className="hidden lg:block"
          className="mt-8 lg:mt-0"
        >
          <div
            style={{ backgroundColor: COLORS.cream }}
            className={`${RADIUS.lg} p-8 shadow-2xl`}
          >
            <p
              className="text-xs font-mono uppercase tracking-wide"
              style={{ color: COLORS.mutedOnCream }}
            >
              Sample requirement
            </p>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: COLORS.ink }}
            >
              "The system shall respond{" "}
              <span className="line-through opacity-40">quickly</span> to user
              requests."
            </p>
            <div className="mt-2 h-px bg-black/10" />
            <p
              className="mt-4 text-sm leading-relaxed font-medium"
              style={{ color: COLORS.ink }}
            >
              "The system shall respond{" "}
              <span style={{ color: COLORS.accent }}>within 2 seconds</span>{" "}
              under normal load."
            </p>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                <motion.div
                  style={{ backgroundColor: COLORS.accent }}
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "92%" }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </div>
              <span
                className="text-sm font-mono font-semibold"
                style={{ color: COLORS.ink }}
              >
                92/100
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        onViewportEnter={() => setStatsInView(true)}
        transition={{ duration: 0.5 }}
        className="px-8 pb-14 max-w-5xl mx-auto w-full"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS_META.map((s, i) => (
            <div
              key={s.key}
              className={`text-center px-4 py-6 ${RADIUS.lg} border`}
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              <p
                className="font-display text-2xl md:text-3xl font-bold"
                style={{ color: COLORS.accent }}
              >
                {realStats && statsInView ? (
                  <>
                    <CountUp
                      value={realStats[s.key]}
                      decimals={s.decimals || 0}
                      delay={i * 100}
                    />
                    {s.suffix}
                  </>
                ) : (
                  "—"
                )}
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.mutedOnDark }}>
                {s.label}
              </p>
            </div>
          ))}

          <div
            className={`text-center px-4 py-6 ${RADIUS.lg} border`}
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <p
              className="font-display text-2xl md:text-3xl font-bold"
              style={{ color: COLORS.accent }}
            >
              ~8 min
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.mutedOnDark }}>
              Avg. Processing Time
            </p>
          </div>
        </div>
        <p
          className="text-center text-xs mt-4 font-mono"
          style={{ color: COLORS.mutedOnDark }}
        >
          Based on your analysis history — see individual runs on the History
          page.
        </p>
      </motion.div>

      {/* Upload Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="px-8 pb-16 max-w-3xl mx-auto w-full"
      >
        <div
          style={{
            backgroundColor: COLORS.cream,
            border: `1px solid ${COLORS.accent}30`,
          }}
          className={`${RADIUS.lg} p-8 md:p-10 shadow-2xl`}
        >
          <AnimatePresence mode="wait">
            {!loading ? (
              <motion.div
                key="upload-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload SRS document. Drag and drop a file here, or press Enter to browse."
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  onClick={() => document.getElementById("fileInput").click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      document.getElementById("fileInput").click();
                    }
                  }}
                  className={`border-2 border-dashed ${RADIUS.md} p-10 text-center cursor-pointer transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
                  style={{
                    borderColor:
                      isDragging || isHovering ? COLORS.accent : "#CBD5E1",
                    backgroundColor: isDragging
                      ? `${COLORS.accent}14`
                      : isHovering
                        ? `${COLORS.accent}0A`
                        : "transparent",
                  }}
                >
                  <motion.i
                    animate={file ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="ti ti-file-text text-4xl inline-block transition-colors"
                    style={{
                      color:
                        file || isDragging || isHovering
                          ? COLORS.accent
                          : "#94A3B8",
                    }}
                    aria-hidden="true"
                  />
                  {file ? (
                    <p
                      className="font-medium mt-3 font-mono text-sm"
                      style={{ color: COLORS.accent }}
                    >
                      {file.name}
                    </p>
                  ) : (
                    <>
                      <p
                        className="font-medium mt-3"
                        style={{ color: COLORS.ink }}
                      >
                        {isDragging
                          ? "Drop it right here"
                          : "Drop your SRS document here"}
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: COLORS.mutedOnCream }}
                      >
                        or click to browse
                      </p>
                    </>
                  )}
                </div>

                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  aria-label="Choose SRS file to upload"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div
                  className="flex items-center justify-between mt-4 text-xs font-mono"
                  style={{ color: COLORS.mutedOnCream }}
                >
                  <span>PDF · DOCX · TXT</span>
                  <span>MAX 10MB</span>
                </div>

                {!file && (
                  <p
                    className="text-xs mt-2 font-mono"
                    style={{ color: COLORS.mutedOnCream }}
                  >
                    New here? Try uploading a sample like{" "}
                    <span style={{ color: COLORS.accent }}>
                      Library_test.docx
                    </span>
                  </p>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`text-red-600 text-sm mt-4 bg-red-50 ${RADIUS.sm} px-4 py-3`}
                      role="alert"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={handleAnalyze}
                  disabled={!file}
                  whileHover={file ? { scale: 1.01 } : {}}
                  whileTap={file ? { scale: 0.98 } : {}}
                  style={{ backgroundColor: file ? COLORS.accent : "#E2E8F0" }}
                  className={`group mt-6 w-full cursor-pointer disabled:cursor-not-allowed font-bold text-base py-5 ${RADIUS.md} transition-all flex items-center justify-center gap-2 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
                >
                  <span
                    style={{ color: file ? COLORS.ink : COLORS.mutedOnCream }}
                  >
                    Analyze document
                  </span>
                  <i
                    className="ti ti-arrow-right text-xl transition-transform duration-300 group-hover:translate-x-1"
                    style={{ color: file ? COLORS.ink : COLORS.mutedOnCream }}
                    aria-hidden="true"
                  />
                </motion.button>

                <p
                  className="text-center text-xs mt-4 font-mono"
                  style={{ color: COLORS.mutedOnCream }}
                >
                  ~5-12 min depending on document length
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="progress-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="py-4"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    style={{ backgroundColor: COLORS.accent }}
                    className="w-2 h-2 rounded-full animate-pulse"
                  />
                  <h2
                    className="font-display text-lg font-medium"
                    style={{ color: COLORS.ink }}
                  >
                    {stageLabels[progress.stage] || "Processing..."}
                  </h2>
                </div>

                <p
                  className="text-sm mb-6 font-mono"
                  style={{ color: COLORS.mutedOnCream }}
                >
                  {progress.detail}
                </p>

                <div className="w-full h-1.5 rounded-full overflow-hidden mb-6 bg-black/10">
                  <motion.div
                    style={{ backgroundColor: COLORS.accent }}
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(Math.max(currentStageIndex, 0) / (stageOrder.length - 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>

                <div className="space-y-4">
                  {stageOrder.slice(0, -1).map((stage, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <motion.div
                        animate={{
                          scale: i === currentStageIndex ? [1, 1.15, 1] : 1,
                        }}
                        transition={{ duration: 0.4 }}
                        style={{
                          backgroundColor:
                            i < currentStageIndex
                              ? "#10B981"
                              : i === currentStageIndex
                                ? COLORS.accent
                                : "#E2E8F0",
                          color:
                            i <= currentStageIndex
                              ? COLORS.ink
                              : COLORS.mutedOnCream,
                        }}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono shrink-0"
                      >
                        {i < currentStageIndex ? (
                          <i
                            className="ti ti-check text-xs"
                            aria-hidden="true"
                          />
                        ) : (
                          i + 1
                        )}
                      </motion.div>
                      <span
                        className="text-sm"
                        style={{
                          color:
                            i <= currentStageIndex
                              ? COLORS.ink
                              : COLORS.mutedOnCream,
                        }}
                      >
                        {stageLabels[stage]}
                        {stage === "analyzing" &&
                          i === currentStageIndex &&
                          progress.total_steps > 0 && (
                            <span
                              className="ml-2 font-mono text-xs"
                              style={{ color: COLORS.mutedOnCream }}
                            >
                              ({progress.current_step}/{progress.total_steps})
                            </span>
                          )}
                      </span>
                    </div>
                  ))}
                </div>

                <p
                  className="text-xs mt-8 font-mono"
                  style={{ color: COLORS.mutedOnCream }}
                >
                  Please keep this tab open
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Features sec*/}
      <div className="max-w-5xl mx-auto px-8 pb-20">
        <div className="text-left mb-12 max-w-xl">
          <h2
            className="text-3xl font-display font-semibold"
            style={{ color: COLORS.headingOnDark }}
          >
            What Req-Intel Does
          </h2>
          <p className="mt-3" style={{ color: COLORS.mutedOnDark }}>
            AI-powered analysis that transforms vague software requirements into
            measurable, testable, and high-quality specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} f={f} i={i} />
          ))}
        </div>
      </div>

      {/* {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />} */}
      <AnimatePresence>
        {showHowItWorks && (
          <HowItWorksModal onClose={() => setShowHowItWorks(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSampleReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            // className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50"
            className="fixed inset-0 bg-black/60 flex items-center justify-center px-3 py-4 sm:p-6 z-50"
            onClick={() => setShowSampleReport(false)}
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25 }}
              style={{ backgroundColor: COLORS.cream }}
              // className={`${RADIUS.lg} max-w-md w-full p-8 text-center`}
              className={`${RADIUS.lg} w-[95%] max-w-md p-5 sm:p-8 text-center`}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="sample-report-title"
            >
              <div
                // className={`${RADIUS.sm} p-4 mb-5 text-left`}
                className={`${RADIUS.sm} p-3 sm:p-4 mb-4 sm:mb-5 text-left`}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                }}
                aria-hidden="true"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="font-display font-bold text-sm"
                    style={{ color: COLORS.ink }}
                  >
                    Req<span style={{ color: COLORS.accent }}>·</span>Intel
                    Report
                  </span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: COLORS.mutedOnCream }}
                  >
                    PDF
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-2">
                  <div
                    style={{ width: "60%", backgroundColor: COLORS.accent }}
                    className="h-full rounded-full"
                  />
                </div>
                <div className="space-y-1.5 mt-3">
                  {[1, 2, 3].map((r) => (
                    <div key={r} className="flex items-center gap-2">
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: COLORS.accent }}
                      />
                      <div className="h-1.5 flex-1 rounded bg-slate-100" />
                      <div className="h-1.5 w-8 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>

              {/* <i className="ti ti-file-search text-4xl" style={{ color: COLORS.accent }} aria-hidden="true" /> */}
              <i
                className="ti ti-file-search text-3xl sm:text-4xl"
                style={{ color: COLORS.accent }}
                aria-hidden="true"
              />

              <h3
                id="sample-report-title"
                className="font-display text-lg sm:text-xl font-semibold mt-3 sm:mt-4 mb-2"
                style={{ color: COLORS.ink }}
              >
                Sample analysis report
              </h3>

              <p
                className="text-sm leading-relaxed mb-5 sm:mb-6"
                style={{ color: COLORS.mutedOnCream }}
              >
                Library_test.docx — 15 requirements, 60/100 quality score,
                88.89% precision. Download the full PDF report to see the
                complete breakdown.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowSampleReport(false)}
                  className={`flex-1 py-3 ${RADIUS.md} font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
                  style={{ backgroundColor: "#E2E8F0", color: COLORS.ink }}
                >
                  Close
                </button>

                <a
                  // href="http://127.0.0.1:8000/sample-report"
                  href={`${API_BASE}/sample-report`}
                  style={{ backgroundColor: COLORS.accent, color: COLORS.ink }}
                  className={`flex-1 py-3 ${RADIUS.md} font-semibold flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
                  aria-label="Download sample PDF report"
                >
                  Download PDF
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* footer */}

      <footer
        className="border-t border-white/5"
        style={{ backgroundColor: "#0F172A" }}
      >
        <div
          className="max-w-6xl mx-auto px-8 pt-16 pb-10 grid grid-cols-1 min-[426px]:grid-cols-2 md:grid-cols-12 gap-16 text-sm text-center md:text-left"
          style={{ color: COLORS.mutedOnDark }}
        >
          <div className="md:col-span-5">
            <h3
              className="font-bold text-xl"
              style={{ color: COLORS.headingOnDark }}
            >
              {" "}
              Req-Intel{" "}
            </h3>
            <p className="text-xs mt-1" style={{ color: COLORS.mutedOnDark }}>
              {" "}
              Making Software Requirements Clear, Measurable & Testable{" "}
            </p>
            <p className="mt-4 max-w-md text-sm leading-7">
              AI-powered Requirement Analysis Tool. Upload SRS/PDF and
              automatically identify ambiguous, incomplete, and non-testable
              requirements using a structured quality scoring framework.
            </p>
            <p className="mt-3 text-xs" style={{ color: COLORS.mutedOnDark }}>
              Built with React, FastAPI, spaCy &amp; Phi-3 mini
            </p>
          </div>

          <div className="md:col-span-3">
            <h4
              className="font-semibold mb-4"
              style={{ color: COLORS.headingOnDark }}
            >
              Project
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  onClick={() => setShowHowItWorks(true)}
                  className="cursor-pointer transition-all duration-200 hover:translate-x-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = COLORS.headingOnDark)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = COLORS.mutedOnDark)
                  }
                >
                  {" "}
                  How it Works{" "}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowSampleReport(true)}
                  className="cursor-pointer transition-all duration-200 hover:translate-x-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = COLORS.headingOnDark)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = COLORS.mutedOnDark)
                  }
                >
                  {" "}
                  Sample Report{" "}
                </button>
              </li>
              <li>
                <button
                  onClick={onShowHistory}
                  className="cursor-pointer transition-all duration-200 hover:translate-x-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = COLORS.headingOnDark)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = COLORS.mutedOnDark)
                  }
                >
                  {" "}
                  History{" "}
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4
              className="font-semibold mb-4"
              style={{ color: COLORS.headingOnDark }}
            >
              Team
            </h4>
            <p className="text-sm">SMI University, Karachi</p>
            <p className="text-sm mt-1">
              Batch: 2022-2026, Software Engineering
            </p>
            <p
              className="mt-4 text-sm font-medium"
              style={{ color: COLORS.headingOnDark }}
            >
              Developed by
            </p>
            <ul className="mt-2 space-y-3 text-sm">
              <li>
                <strong>Shahzeb (BSE-22F-016)</strong>
                <span className="block text-xs opacity-70 mt-1">
                  System Design & Development
                </span>
              </li>

              <li>
                <strong>Hamza Khan (BSE-22F-035)</strong>
                <span className="block text-xs opacity-70 mt-1">
                  Documentation & Project Support
                </span>
              </li>
            </ul>
            <p className="mt-4 text-sm leading-6">
              <span
                className="font-medium"
                style={{ color: COLORS.headingOnDark }}
              >
                Supervisor:
              </span>
              <br /> Ma'am Saima Sipy Nangraj{" "}
            </p>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div
            className="max-w-7xl mx-auto px-8 py-6 text-center text-xs"
            style={{ color: COLORS.mutedOnDark }}
          >
            <p>
              &copy; {new Date().getFullYear()} Req-Intel. All rights reserved.
            </p>
            <p className="mt-2">Version 1.0 | Final Year Project</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
