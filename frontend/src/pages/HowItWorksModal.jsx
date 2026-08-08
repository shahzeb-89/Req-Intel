import { motion } from "framer-motion"

// CHANGE: same color tokens as the other pages, so this modal doesn't look
// like a separate design from the rest of the app.
const COLORS = {
  accent: "#2563EB",
  ink: "#1E293B",
  mutedOnCream: "#64748B",
}

const RADIUS = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
}

// CHANGE (content fix): step 3 said "Mistral 7B", but the actual backend
// (phase2.py) calls Ollama with "phi3:mini" — this was a factual mismatch
// that would be an easy, awkward catch in a defense. Corrected to Phi-3 mini.
const STEPS = [
  {
    icon: "ti-file-upload",
    title: "Upload your SRS document",
    desc: "Submit a Software Requirement Specification in PDF, DOCX, or TXT format. The system reads and segments the document into individual requirement statements.",
  },
  {
    icon: "ti-search",
    title: "Detect ambiguous language",
    desc: "Each requirement is scanned using NLP techniques — tokenization, lemmatization, and POS tagging — against a list of vague terms based on the ISO/IEC/IEEE 29148 standard.",
  },
  {
    icon: "ti-brain",
    title: "AI contextual analysis",
    desc: "A locally running language model (Phi-3 mini, via Ollama) reviews each flagged requirement, determines if it is genuinely ambiguous, and suggests a measurable rewrite.",
  },
  {
    icon: "ti-chart-bar",
    title: "Quality scoring & report",
    desc: "Each requirement receives scores for Measurability, Completeness, and Conciseness. A final report is generated with an overall SRS quality score and validation metrics.",
  },
]

export default function HowItWorksModal({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25 }}
        style={{ backgroundColor: "#F8F7F4" }}
        className={`${RADIUS.lg} max-w-2xl w-full p-8 md:p-10 max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 id="how-it-works-title" className="font-display text-2xl font-semibold" style={{ color: COLORS.ink }}>
            How Req-Intel works
          </h2>
          <button
            onClick={onClose}
            className={`transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${RADIUS.sm} p-1`}
            style={{ color: COLORS.mutedOnCream }}
            onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.ink)}
            onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.mutedOnCream)}
            aria-label="Close dialog"
          >
            <i className="ti ti-x text-2xl" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <div
                  style={{ backgroundColor: `${COLORS.accent}14`, color: COLORS.accent }}
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                >
                  <i className={`ti ${step.icon} text-xl`} aria-hidden="true" />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-px flex-1 my-2" style={{ backgroundColor: "#E2E8F0" }} aria-hidden="true" />
                )}
              </div>
              <div className="pb-2">
                <p className="text-xs font-mono mb-1" style={{ color: COLORS.mutedOnCream }}>
                  STEP {i + 1}
                </p>
                <h3 className="font-display font-semibold text-lg mb-1" style={{ color: COLORS.ink }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: COLORS.mutedOnCream }}>
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          style={{ backgroundColor: COLORS.accent }}
          className={`mt-8 w-full cursor-pointer text-white font-semibold py-3 ${RADIUS.md} transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
        >
          Got it
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
