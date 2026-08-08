import { useState, useEffect } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import Rlogo from "../assets/logo.png"
const API_BASE = `http://${window.location.hostname}:8000`

const COLORS = {
  bg: "#0B1120",
  cream: "#F8F7F4",
  creamAlt: "#EEF1F6",
  accent: "#2563EB",
  ink: "#1E293B",
  headingOnDark: "#FFFFFF",
  mutedOnDark: "#94A3B8",
  mutedOnCream: "#64748B",
}

const RADIUS = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
}

function CountUp({ value, duration = 900, decimals = 0, delay = 0 }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = null
    let frame
    const target = Number(value) || 0
    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) 
      setDisplay(Number((eased * target).toFixed(decimals)))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(step)
    }, delay)
    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(frame)
    }
  }, [value, duration, decimals, delay])

  return <>{decimals > 0 ? display.toFixed(decimals) : display}</>
}

function InsightTicker({ history }) {
  const insights = (() => {
    if (!history || history.length === 0) return []
    const list = []

    const topScore = [...history].sort((a, b) => b.srs_score - a.srs_score)[0]
    if (topScore) {
      list.push(`Highest scoring document: ${topScore.filename} — ${topScore.srs_score}/100`)
    }

    const mostFlagged = [...history].sort((a, b) => b.flagged - a.flagged)[0]
    if (mostFlagged) {
      list.push(`Most flagged file: ${mostFlagged.filename} — ${mostFlagged.flagged} issues found`)
    }

    const bestPrecision = [...history].sort((a, b) => b.precision_score - a.precision_score)[0]
    if (bestPrecision) {
      list.push(`Best precision run: ${bestPrecision.filename} — ${bestPrecision.precision_score}%`)
    }

    const totalReqs = history.reduce((s, h) => s + (h.total_requirements || 0), 0)
    list.push(`${totalReqs} requirements analyzed across ${history.length} document${history.length !== 1 ? "s" : ""} so far`)

    return list
  })()

  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (insights.length <= 1) return
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % insights.length)
    }, 3800)
    return () => clearInterval(interval)
  }, [insights.length])

  if (insights.length === 0) return null

  return (
    <div className="h-6 overflow-hidden relative" aria-live="off">
      {insights.map((text, i) => (
        <motion.p
          key={i}
          className="absolute inset-0 text-sm font-mono"
          style={{ color: COLORS.mutedOnDark }}
          initial={false}
          animate={{
            opacity: i === index ? 1 : 0,
            y: i === index ? 0 : 8,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          aria-hidden={i !== index}
        >
          <span style={{ color: COLORS.accent }}>›</span> {text}
        </motion.p>
      ))}
    </div>
  )
}

export default function HistoryPage({ onBack }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("date")

  useEffect(() => {
    // axios.get("http://127.0.0.1:8000/history")
    axios.get(`${API_BASE}/history`)
      .then((res) => {
        setHistory(res.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const gradeStyle = (grade) => {
    if (grade === "Good") return "text-emerald-600 bg-emerald-50"
    if (grade === "Acceptable") return "text-amber-600 bg-amber-50"
    return "text-red-500 bg-red-50"
  }

  const fileIcon = (filename) => {
    if (filename.endsWith(".pdf")) return "ti-file"
    if (filename.endsWith(".docx")) return "ti-file-text"
    return "ti-file-text"
  }

  const sortedHistory = [...history].sort((a, b) => {
    if (sortBy === "date") return b.id - a.id
    if (sortBy === "score") return b.srs_score - a.srs_score
    if (sortBy === "precision") return b.precision_score - a.precision_score
    return 0
  })

  const avgScore = history.length
    ? Math.round(history.reduce((sum, h) => sum + h.srs_score, 0) / history.length)
    : 0
  const avgPrecision = history.length
    ? (history.reduce((sum, h) => sum + h.precision_score, 0) / history.length).toFixed(1)
    : 0

  const SORT_OPTIONS = [
    { key: "date", label: "Most Recent" },
    { key: "score", label: "Quality Score" },
    { key: "precision", label: "Precision" },
  ]

  return (
    <div style={{ backgroundColor: COLORS.bg }} className="min-h-screen">

      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 flex items-center justify-between px-8 py-6 border-b border-white/5 backdrop-blur-md"
        style={{ backgroundColor: `${COLORS.bg}CC` }}
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
            <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color: COLORS.headingOnDark }}>
              Req<span style={{ color: COLORS.accent }}>·</span>Intel
            </h1>
            <p className="text-xs" style={{ color: COLORS.mutedOnDark }}>
              AI Requirement Analysis
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          aria-current="page"
          className="group relative flex items-center gap-2 text-base font-semibold transition-colors duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded pb-1"
          style={{ color: COLORS.mutedOnDark }}
          onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.headingOnDark)}
          onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.mutedOnDark)}
        >
          <i className="ti ti-arrow-left text-base transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true"></i>
          <span>Back</span>
<span className="hidden sm:inline"> to Upload</span>
          <span
            style={{ backgroundColor: COLORS.accent }}
            className="absolute left-0 -bottom-1 h-0.5 w-0 transition-all duration-300 group-hover:w-full"
            aria-hidden="true"
          ></span>
        </button>
        
      </motion.nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <p className="text-xs font-mono tracking-wide mb-2" style={{ color: COLORS.accent }}>
            DOCUMENT ARCHIVE
          </p>
          <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: COLORS.headingOnDark }}>
            Analysis History
          </h1>
          <p className="text-sm" style={{ color: COLORS.mutedOnDark }}>
            {history.length} document{history.length !== 1 ? "s" : ""} analyzed
          </p>
          {!loading && history.length > 0 && (
            <div className="mt-4">
              <InsightTicker history={history} />
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
            <div className="flex items-center gap-3" style={{ color: COLORS.mutedOnDark }}>
              <div style={{ backgroundColor: COLORS.accent }} className="w-2 h-2 rounded-full animate-pulse" />
              <span className="font-mono text-sm">Loading history...</span>
            </div>
          </div>
        ) : history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className={`${RADIUS.lg} p-16 text-center border`}
            style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <i className="ti ti-folder-off text-4xl" style={{ color: COLORS.mutedOnDark }} aria-hidden="true" />
            <p className="mt-4 font-medium" style={{ color: COLORS.headingOnDark }}>No analysis history yet</p>
            <p className="text-sm mt-1" style={{ color: COLORS.mutedOnDark }}>
              Upload your first SRS document to see it appear here.
            </p>
            <button
              onClick={onBack}
              style={{ backgroundColor: COLORS.accent }}
              className={`mt-6 cursor-pointer text-white px-6 py-3 ${RADIUS.md} text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
            >
              Upload a document
            </button>
          </motion.div>
        ) : (
          <>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
            >
              {[
                { label: "Documents", value: history.length, suffix: "" },
                { label: "Avg Quality Score", value: avgScore, suffix: "" },
                { label: "Avg Precision", value: parseFloat(avgPrecision), suffix: "%", decimals: 1 },
                { label: "Total Flagged", value: history.reduce((s, h) => s + h.flagged, 0), suffix: "" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`${RADIUS.lg} p-5 border`}
                  style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <p className="font-display text-2xl font-semibold" style={{ color: COLORS.accent }}>
                    <CountUp value={item.value} decimals={item.decimals || 0} delay={i * 100} />
                    {item.suffix}
                  </p>
                  <p className="text-xs mt-1 font-mono" style={{ color: COLORS.mutedOnDark }}>{item.label}</p>
                </div>
              ))}
            </motion.div>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs font-mono" style={{ color: COLORS.mutedOnDark }}>SORT BY</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  aria-pressed={sortBy === opt.key}
                  className={`text-xs px-3 py-1.5 ${RADIUS.md} transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
                  style={{
                    backgroundColor: sortBy === opt.key ? COLORS.accent : "rgba(255,255,255,0.05)",
                    color: sortBy === opt.key ? "#FFFFFF" : COLORS.mutedOnDark,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {sortedHistory.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 1, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2, margin: "0px 0px -60px 0px" }}
                  transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05, ease: "easeOut" }}
                  style={{ backgroundColor: COLORS.cream }}
                  className={`${RADIUS.lg} p-5 flex items-center gap-5 hover:shadow-lg transition-shadow`}
                >
                  <div
                    style={{ backgroundColor: `${COLORS.accent}14` }}
                    className={`w-12 h-12 ${RADIUS.sm} flex items-center justify-center shrink-0`}
                  >
                    <i className={`ti ${fileIcon(item.filename)} text-xl`} style={{ color: COLORS.accent }} aria-hidden="true" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: COLORS.ink }}>{item.filename}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: COLORS.mutedOnCream }}>{item.upload_date}</p>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-center">
                    <div>
                      <p className="font-mono text-sm font-semibold" style={{ color: COLORS.ink }}>{item.total_requirements}</p>
                      <p className="text-[10px]" style={{ color: COLORS.mutedOnCream }}>TOTAL</p>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold text-amber-600">{item.flagged}</p>
                      <p className="text-[10px]" style={{ color: COLORS.mutedOnCream }}>FLAGGED</p>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold" style={{ color: COLORS.accent }}>{item.precision_score}%</p>
                      <p className="text-[10px]" style={{ color: COLORS.mutedOnCream }}>PRECISION</p>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold" style={{ color: COLORS.accent }}>{item.recall_score}%</p>
                      <p className="text-[10px]" style={{ color: COLORS.mutedOnCream }}>RECALL</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-display text-xl font-semibold" style={{ color: COLORS.ink }}>{item.srs_score}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${gradeStyle(item.srs_grade)}`}>
                      {item.srs_grade}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Footer  */}
        <footer className="border-t border-white/10 mt-12">
          <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col items-center text-center gap-2 text-xs" style={{ color: COLORS.mutedOnDark }}>
            <p>© {new Date().getFullYear()} Req-Intel. All rights reserved.</p>
            <p>Version 1.0 · Final Year Project · Built with React &amp; FastAPI</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
