import { useState } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
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


function CountUp({ value, duration = 800, decimals = 0, delay = 0 }) {
  const [display, setDisplay] = useState(0)

  useState(() => {
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
  })

  return <>{decimals > 0 ? display.toFixed(decimals) : display}</>
}


function RequirementCard({ req, isOpen, onToggle }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onToggle()
        }
      }}
      style={{ backgroundColor: COLORS.cream }}
      className={`${RADIUS.lg} overflow-hidden cursor-pointer transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
    >
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed" style={{ color: COLORS.ink }}>
            {req.sentence}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {req.weak_words.map((w, j) => (
              <span key={j} className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                {w}
              </span>
            ))}
          </div>
        </div>
        <i
          className={`ti ti-chevron-down transition-transform shrink-0 mt-1 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: COLORS.mutedOnCream }}
          aria-hidden="true"
        />
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: "#E2E8F0" }}>
              <p className="text-xs font-mono mb-2" style={{ color: COLORS.mutedOnCream }}>
                {req.pos_tags.join(" · ")}
              </p>
              <div className={`bg-white ${RADIUS.sm} p-3 space-y-1`}>
                {req.llm.split("\n").map((line, j) => (
                  line.trim() && (
                    <p key={j} className="text-xs leading-5 font-mono" style={{ color: COLORS.mutedOnCream }}>
                      {line}
                    </p>
                  )
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ResultsPage({ results, onReset }) {
  const [expandedReq, setExpandedReq] = useState(null)

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${API_BASE}/download-report`, {
        params: { filename: results.filename },
        responseType: "blob"
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${results.filename.split('.')[0]}_report.pdf`)
      document.body.appendChild(link)
      link.click()
    } catch {
      alert("Report not available. Run analysis first.")
    }
  }

  const gradeStyle = (grade) => {
    if (grade === "Good") return "text-emerald-600 bg-emerald-50"
    if (grade === "Acceptable") return "text-amber-600 bg-amber-50"
    return "text-red-500 bg-red-50"
  }

  const scoreColor = (score) => {
    if (score >= 80) return "#10B981"
    if (score >= 60) return "#F59E0B"
    return "#EF4444"
  }

  return (
    <div style={{ backgroundColor: COLORS.bg }} className="min-h-screen">

      {/* Nav */}
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
          onClick={onReset}
          className="group relative flex items-center gap-2 text-base font-semibold transition-colors duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded pb-1"
          style={{ color: COLORS.mutedOnDark }}
          onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.headingOnDark)}
          onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.mutedOnDark)}
        >
          <i className="ti ti-arrow-left text-base transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true"></i>
          Analyze Another Document
          <span
            style={{ backgroundColor: COLORS.accent }}
            className="absolute left-0 -bottom-1 h-0.5 w-0 transition-all duration-300 group-hover:w-full"
            aria-hidden="true"
          ></span>
        </button>
      </motion.nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* File Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <p className="text-xs font-mono tracking-wide mb-2" style={{ color: COLORS.accent }}>
            ANALYSIS COMPLETE
          </p>
          <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: COLORS.headingOnDark }}>
            {results.filename}
          </h1>
          <p className="text-sm" style={{ color: COLORS.mutedOnDark }}>
            {results.total} requirements analyzed
          </p>
        </motion.div>

        {/* Summary Cards  */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: "Total", value: results.total, color: COLORS.headingOnDark },
            { label: "Flagged", value: results.flagged, color: "#FBBF24" },
            { label: "Clean", value: results.clean, color: "#34D399" },
            { label: "Quality Score", value: results.srs_score, color: COLORS.headingOnDark },
          ].map((item, i) => (
            <div
              key={i}
              className={`${RADIUS.lg} p-5 border`}
              style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <p className="font-display text-3xl font-semibold" style={{ color: item.color }}>
                <CountUp value={item.value} decimals={0} delay={i * 90} />
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: COLORS.mutedOnDark }}>{item.label}</p>
            </div>
          ))}
        </motion.div>

        {/* SRS Score Bar  */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`${RADIUS.lg} p-6 mb-8 border`}
          style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium" style={{ color: COLORS.headingOnDark }}>SRS Overall Quality</span>
            <span className={`text-xs font-mono px-3 py-1 rounded-full ${gradeStyle(results.srs_grade)}`}>
              {results.srs_grade} · {results.srs_score}/100
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <motion.div
              className="h-2 rounded-full"
              style={{ backgroundColor: scoreColor(results.srs_score) }}
              initial={{ width: 0 }}
              animate={{ width: `${results.srs_score}%` }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Phase 1 & 2 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs px-2 py-1 rounded" style={{ color: COLORS.accent, backgroundColor: `${COLORS.accent}1A` }}>
              PHASE 1 &amp; 2
            </span>
            <h2 className="font-display text-lg font-medium" style={{ color: COLORS.headingOnDark }}>
              Ambiguity Detection
            </h2>
          </div>

          {results.requirements.length === 0 ? (
            <div
              className={`${RADIUS.lg} p-6 text-center border`}
              style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <i className="ti ti-circle-check text-emerald-400 text-2xl" aria-hidden="true" />
              <p className="mt-2" style={{ color: COLORS.headingOnDark }}>No ambiguous requirements detected.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.requirements.map((req, i) => (
                <RequirementCard
                  key={i}
                  req={req}
                  isOpen={expandedReq === i}
                  onToggle={() => setExpandedReq(expandedReq === i ? null : i)}
                />
              ))}
            </div>
          )}
        </motion.section>

        {/* Phase 3 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs px-2 py-1 rounded text-purple-400 bg-purple-500/10">
              PHASE 3
            </span>
            <h2 className="font-display text-lg font-medium" style={{ color: COLORS.headingOnDark }}>
              Quality Scores
            </h2>
          </div>

          <div style={{ backgroundColor: COLORS.cream }} className={`${RADIUS.lg} overflow-hidden overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#E2E8F0" }}>
                  <th className="p-3 text-left font-mono text-xs" style={{ color: COLORS.mutedOnCream }}>REQUIREMENT</th>
                  <th className="p-3 text-center font-mono text-xs" style={{ color: COLORS.mutedOnCream }}>MEASURABILITY</th>
                  <th className="p-3 text-center font-mono text-xs" style={{ color: COLORS.mutedOnCream }}>COMPLETENESS</th>
                  <th className="p-3 text-center font-mono text-xs" style={{ color: COLORS.mutedOnCream }}>CONCISENESS</th>
                  <th className="p-3 text-center font-mono text-xs" style={{ color: COLORS.mutedOnCream }}>OVERALL</th>
                  <th className="p-3 text-center font-mono text-xs" style={{ color: COLORS.mutedOnCream }}>GRADE</th>
                </tr>
              </thead>
              <tbody>
                {results.phase3.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 transition-colors hover:bg-black/2" style={{ borderColor: "#F1F5F9" }}>
                    <td className="p-3" style={{ color: COLORS.ink }}>
                      {r.sentence.length > 45 ? r.sentence.slice(0, 45) + "..." : r.sentence}
                    </td>
                    <td className="p-3 text-center font-mono" style={{ color: COLORS.mutedOnCream }}>{r.measurability}</td>
                    <td className="p-3 text-center font-mono" style={{ color: COLORS.mutedOnCream }}>{r.completeness}</td>
                    <td className="p-3 text-center font-mono" style={{ color: COLORS.mutedOnCream }}>{r.conciseness}</td>
                    <td className="p-3 text-center font-mono font-semibold" style={{ color: COLORS.ink }}>{r.overall}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${gradeStyle(r.grade)}`}>
                        {r.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Phase 4 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs px-2 py-1 rounded text-emerald-400 bg-emerald-500/10">
              PHASE 4
            </span>
            <h2 className="font-display text-lg font-medium" style={{ color: COLORS.headingOnDark }}>
              Validation &amp; Benchmarking
            </h2>
          </div>

          <div style={{ backgroundColor: COLORS.cream }} className={`${RADIUS.lg} p-6`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { label: "True Positives", value: results.phase4.TP },
                { label: "False Positives", value: results.phase4.FP },
                { label: "False Negatives", value: results.phase4.FN },
                { label: "True Negatives", value: results.phase4.TN },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className="font-display text-2xl font-semibold" style={{ color: COLORS.ink }}>
                    <CountUp value={item.value} delay={i * 80} />
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.mutedOnCream }}>{item.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t" style={{ borderColor: "#E2E8F0" }}>
              {[
                { label: "Precision", value: results.phase4.precision },
                { label: "Recall", value: results.phase4.recall },
                { label: "F1 Score", value: results.phase4.f1_score },
                { label: "Accuracy", value: results.phase4.accuracy },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className="font-display text-2xl font-semibold" style={{ color: COLORS.accent }}>
                    <CountUp value={item.value} decimals={1} delay={(i + 4) * 80} />%
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.mutedOnCream }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Download */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDownload}
          style={{ backgroundColor: COLORS.accent }}
          className={`w-full cursor-pointer text-white font-bold py-5 ${RADIUS.md} transition-all flex items-center justify-center gap-2 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
        >
          <i className="ti ti-download text-xl" aria-hidden="true" />
          Download full PDF report
        </motion.button>

        {/* Footer */}
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
