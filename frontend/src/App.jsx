// import { useState } from "react"
import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import UploadPage from "./pages/UploadPage"
import ResultsPage from "./pages/ResultsPage"
import HistoryPage from "./pages/HistoryPage"

function App() {
  const [results, setResults] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [direction, setDirection] = useState("forward") // "forward" or "backward"

  const currentView = showHistory ? "history" : results === null ? "upload" : "results"
  useEffect(() => {
  window.scrollTo({ top: 0, behavior: "instant" })
}, [currentView])

  // Navigation handlers jo direction set karein ge
  const handleGoToHistory = () => {
    setDirection("forward")
    setShowHistory(true)
  }

  const handleBackFromHistory = () => {
    setDirection("backward")
    setShowHistory(false)
  }

  const handleShowResults = (res) => {
    setDirection("forward")
    setResults(res)
  }

  const handleResetResults = () => {
    setDirection("backward")
    setResults(null)
  }

  // Dynamic Slide Variants based on direction
  const slideVariants = {
  initial: (dir) => ({
    opacity: 0,
    x: dir === "forward" ? 60 : -60,
  }),
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: (dir) => ({
    opacity: 0,
    x: dir === "forward" ? -60 : 60,
  }),
}

  const slideTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] }

  return (
    // <div style={{ backgroundColor: "#0B1120" }} className="min-h-screen overflow-hidden">
    <div style={{ backgroundColor: "#0B1120" }} className="min-h-screen">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentView}
          custom={direction}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={slideTransition}
          className="w-full min-h-screen"
        >
          {currentView === "history" && (
            <HistoryPage onBack={handleBackFromHistory} />
          )}

          {currentView === "results" && (
            <ResultsPage results={results} onReset={handleResetResults} />
          )}

          {currentView === "upload" && (
            <UploadPage onResults={handleShowResults} onShowHistory={handleGoToHistory} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default App