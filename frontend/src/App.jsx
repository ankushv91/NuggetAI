import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  RefreshCw, 
  Trophy,
  HelpCircle,
  Bookmark
} from 'lucide-react';

const SUGGESTIONS = [
  { topic: 'Quantum Computing', difficulty: 'Intermediate', color: 'bg-blue' },
  { topic: 'How Photosynthesis Works', difficulty: 'Beginner', color: 'bg-mint' },
  { topic: 'Git Branching & Merging', difficulty: 'Intermediate', color: 'bg-violet' },
  { topic: 'Neural Networks Basics', difficulty: 'Advanced', color: 'bg-pink' }
];

const LOADING_STATUSES = [
  { pct: 0, text: "Consulting the AI brain..." },
  { pct: 33, text: "Structuring study cards..." },
  { pct: 66, text: "Crafting interactive quiz..." }
];

export default function App() {
  // Navigation & Data State
  const [screen, setScreen] = useState('LANDING'); // LANDING | LOADING | STUDY | QUIZ | RESULTS
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner'); // Beginner | Intermediate | Advanced
  const [moduleData, setModuleData] = useState(null);
  const [error, setError] = useState(null);

  // Loading Screen Animation State
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Consulting the AI brain...");

  // Quiz State
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({}); // { 1: optionIndex, ... }

  // Rotating placeholder state
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholders = [
    "e.g., Quantum Physics",
    "e.g., CSS Grid Layouts",
    "e.g., Italian Renaissance Art",
    "e.g., How Rocket Engines Work",
    "e.g., Cryptocurrency & Blockchain"
  ];

  // Ref to hold loaded module API response if it finishes before loading bar reaches 100%
  const pendingModuleData = useRef(null);
  const apiFinished = useRef(false);

  // Cycle placeholders
  useEffect(() => {
    if (screen !== 'LANDING') return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [screen]);

  // Loading Progress Bar simulation
  useEffect(() => {
    if (screen !== 'LOADING') return;

    setLoadingProgress(0);
    setLoadingStatus("Consulting the AI brain...");
    apiFinished.current = false;
    pendingModuleData.current = null;

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        // If API has finished, speed up to 100%
        if (apiFinished.current) {
          if (prev >= 100) {
            clearInterval(interval);
            // Wait a split second at 100% for satisfaction before transition
            setTimeout(() => {
              setModuleData(pendingModuleData.current);
              setScreen('STUDY');
            }, 300);
            return 100;
          }
          return prev + 10;
        }

        // Otherwise progress normally up to 90% and wait there
        if (prev >= 90) {
          return 90;
        }
        
        const nextVal = prev + 5;
        
        // Cycle statuses based on progress percentage
        const currentStatus = LOADING_STATUSES.reduce((acc, curr) => {
          if (nextVal >= curr.pct) return curr.text;
          return acc;
        }, LOADING_STATUSES[0].text);
        
        setLoadingStatus(currentStatus);
        
        return nextVal;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [screen]);

  // Handle CTA Submit to Fetch Module
  const handleStartLearning = async (selectedTopic = topic) => {
    const queryTopic = selectedTopic.trim();
    if (!queryTopic) {
      setError("Please type a topic first!");
      return;
    }

    setError(null);
    setScreen('LOADING');

    try {
      const response = await fetch('/api/generate-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: queryTopic, difficulty })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${response.status}`);
      }

      const data = await response.json();
      pendingModuleData.current = data;
      apiFinished.current = true;
    } catch (err) {
      console.error("Fetch module failed:", err);
      setError(err.message || "Failed to generate module. Please check your API key setup.");
      setScreen('LANDING');
    }
  };

  // Navigation and reset handlers
  const handleLearnNewTopic = () => {
    setScreen('LANDING');
    setTopic('');
    setDifficulty('Beginner');
    setModuleData(null);
    setError(null);
    setCurrentQuizIndex(0);
    setQuizAnswers({});
    pendingModuleData.current = null;
    apiFinished.current = false;
  };

  const handleRetakeQuiz = () => {
    setCurrentQuizIndex(0);
    setQuizAnswers({});
    setScreen('QUIZ');
  };


  // Quick suggestion click handler
  const handleSuggestionClick = (sug) => {
    setTopic(sug.topic);
    setDifficulty(sug.difficulty);
    handleStartLearning(sug.topic);
  };

  // Submit/Score calculation
  const calculateScore = () => {
    if (!moduleData || !moduleData.quiz) return 0;
    let score = 0;
    moduleData.quiz.forEach((q) => {
      if (quizAnswers[q.id] === q.correct_index) {
        score += 1;
      }
    });
    return score;
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center p-4 md:p-8">
      {/* Header Bar */}
      <header className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div 
          onClick={() => screen !== 'LOADING' && handleLearnNewTopic()} 
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-12 h-12 bg-yellow border-4 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
            <Brain className="w-7 h-7 text-black stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">NuggetAI</h1>
            <span className="text-sm font-black text-slate-700">Knowledge, One Nugget at a Time</span>
          </div>
        </div>
        
        {moduleData && screen !== 'LANDING' && screen !== 'LOADING' && (
          <div className="flex gap-2">
            <span className="neo-badge bg-mint text-black font-black">
              {moduleData.topic}
            </span>
            <span className="neo-badge bg-pink text-black font-black">
              {moduleData.difficulty}
            </span>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl flex-1 flex flex-col justify-center">
        {/* Error Notification */}
        {error && (
          <div className="neo-card bg-red-100 border-4 border-black p-4 mb-6 flex gap-3 items-center">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <p className="font-extrabold text-sm">{error}</p>
          </div>
        )}

        {/* SCREEN A: LANDING SCREEN */}
        {screen === 'LANDING' && (
          <div className="neo-card bg-white p-6 md:p-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink opacity-25 rounded-full border-4 border-black -z-0"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="neo-badge bg-violet text-black font-extrabold">AI-Powered</span>
                <span className="neo-badge bg-yellow text-black font-extrabold">Fast Learn</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                What do you want to learn today?
              </h2>

              <div className="flex flex-col gap-4 mb-6">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={placeholders[placeholderIndex]}
                  className="neo-input w-full text-lg py-4 px-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  onKeyDown={(e) => e.key === 'Enter' && handleStartLearning()}
                />
              </div>

              {/* Difficulty selector pills */}
              <div className="mb-8">
                <label className="block text-sm font-black uppercase mb-3 text-slate-800">
                  Select Difficulty
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Beginner', color: 'bg-mint' },
                    { label: 'Intermediate', color: 'bg-blue' },
                    { label: 'Advanced', color: 'bg-pink' }
                  ].map((lvl) => {
                    const isSelected = difficulty === lvl.label;
                    return (
                      <button
                        key={lvl.label}
                        type="button"
                        onClick={() => setDifficulty(lvl.label)}
                        className={`border-4 border-black rounded-xl font-bold py-3 text-sm md:text-base transition-all select-none ${
                          isSelected 
                            ? `${lvl.color} translate-y-0.5 translate-x-0.5 shadow-none border-4` 
                            : 'bg-white hover:bg-slate-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary CTA */}
              <button
                onClick={() => handleStartLearning()}
                className="neo-btn bg-violet text-black w-full text-lg py-4 flex justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                START LEARNING <ArrowRight className="w-5 h-5 text-black stroke-[3]" />
              </button>

              {/* Suggested Topics section */}
              <div className="mt-10 pt-6 border-t-4 border-dashed border-black">
                <h4 className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-600 fill-yellow-600" />
                  Or start immediately with a popular nugget:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(sug)}
                      className={`neo-badge ${sug.color} text-black font-extrabold hover:-translate-y-0.5 transition-all cursor-pointer`}
                    >
                      {sug.topic} ({sug.difficulty[0]})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN B: LOADING SCREEN */}
        {screen === 'LOADING' && (
          <div className="flex flex-col items-center gap-8 w-full">
            {/* Retro speech bubble */}
            <div className="w-full neo-speech-bubble max-w-md relative">
              <div className="neo-speech-bubble-inner"></div>
              <div className="flex items-center gap-3">
                <div className="animate-bounce">🤖</div>
                <span>{loadingStatus}</span>
              </div>
            </div>

            {/* Neubrutalist Blocky progress bar */}
            <div className="w-full max-w-md">
              <div className="progress-container">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const active = loadingProgress >= (idx + 1) * 10;
                  const colors = ['bg-mint', 'bg-pink', 'bg-yellow', 'bg-blue', 'bg-violet'];
                  const colorClass = active ? colors[idx % colors.length] : 'bg-transparent';
                  return (
                    <div
                      key={idx}
                      className={`progress-block ${colorClass} ${active ? 'opacity-100' : 'opacity-0'}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 px-1 text-xs font-black text-slate-600 uppercase">
                <span>Gathering details</span>
                <span>{loadingProgress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN C: STUDY DECK */}
        {screen === 'STUDY' && moduleData && (
          <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center gap-2 mb-2">
              <Bookmark className="w-5 h-5 text-black stroke-[3]" />
              <h3 className="text-xl font-black uppercase tracking-wide">
                Key Insights: {moduleData.topic}
              </h3>
            </div>

            {/* 3 Study Cards */}
            <div className="flex flex-col gap-6">
              {moduleData.study_points.map((point, index) => {
                // Alternating card accents
                const accentColors = [
                  { bg: 'bg-mint', text: 'text-black' },
                  { bg: 'bg-yellow', text: 'text-black' },
                  { bg: 'bg-pink', text: 'text-black' }
                ];
                const color = accentColors[index % accentColors.length];
                
                return (
                  <div key={point.id} className="neo-card bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {/* Card Accent Header */}
                    <div className={`border-b-4 border-black ${color.bg} px-4 py-2.5 flex justify-between items-center`}>
                      <span className="text-xs font-black uppercase tracking-wider">Concept {index + 1}</span>
                      <span className="w-7 h-7 bg-white border-2 border-black rounded-full flex items-center justify-center font-black text-sm">
                        {index + 1}
                      </span>
                    </div>
                    {/* Card Content */}
                    <div className="p-5 md:p-6">
                      <h4 className="text-xl font-black mb-3">{point.title}</h4>
                      <p className="text-slate-800 leading-relaxed font-semibold text-sm md:text-base whitespace-pre-line">
                        {point.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Take Quiz CTA */}
            <button
              onClick={() => {
                setQuizAnswers({});
                setCurrentQuizIndex(0);
                setScreen('QUIZ');
              }}
              className="neo-btn bg-yellow text-black text-lg py-4 w-full justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mt-4"
            >
              TEST YOUR KNOWLEDGE (TAKE QUIZ) ⚡
            </button>
          </div>
        )}

        {/* SCREEN D: INTERACTIVE QUIZ MODE */}
        {screen === 'QUIZ' && moduleData && moduleData.quiz && (
          <div className="w-full flex flex-col gap-6">
            {/* Header Badge */}
            <div className="flex justify-between items-center">
              <span className="neo-badge bg-violet text-black font-extrabold">
                QUESTION {currentQuizIndex + 1} OF 3
              </span>
              
              {/* Question progress pills */}
              <div className="flex gap-1.5">
                {[0, 1, 2].map((idx) => {
                  const isAnswered = quizAnswers[moduleData.quiz[idx].id] !== undefined;
                  const isActive = currentQuizIndex === idx;
                  let bg = 'bg-white';
                  if (isActive) bg = 'bg-blue';
                  else if (isAnswered) bg = 'bg-mint';

                  return (
                    <div 
                      key={idx} 
                      className={`w-3.5 h-3.5 border-2 border-black rounded-full ${bg}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Question Card */}
            <div className="neo-card bg-white p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black mb-6">
                {moduleData.quiz[currentQuizIndex].question}
              </h3>

              {/* 4 Clickable Options */}
              <div className="flex flex-col gap-3">
                {moduleData.quiz[currentQuizIndex].options.map((opt, optIdx) => {
                  const questionId = moduleData.quiz[currentQuizIndex].id;
                  const isSelected = quizAnswers[questionId] === optIdx;
                  
                  // Label prefix A, B, C, D
                  const letters = ['A', 'B', 'C', 'D'];

                  return (
                    <button
                      key={optIdx}
                      onClick={() => setQuizAnswers(prev => ({ ...prev, [questionId]: optIdx }))}
                      className={`border-4 border-black rounded-xl p-4 text-left font-bold transition-all flex items-center gap-4 ${
                        isSelected
                          ? 'bg-mint shadow-none translate-x-0.5 translate-y-0.5'
                          : 'bg-white hover:bg-slate-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center font-black ${
                        isSelected ? 'bg-white' : 'bg-yellow'
                      }`}>
                        {letters[optIdx]}
                      </span>
                      <span className="font-extrabold text-sm md:text-base leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center gap-4 mt-2">
              <button
                onClick={() => currentQuizIndex > 0 && setCurrentQuizIndex(prev => prev - 1)}
                disabled={currentQuizIndex === 0}
                className={`neo-btn bg-white py-3 px-5 text-sm ${
                  currentQuizIndex === 0 ? 'opacity-50 cursor-not-allowed shadow-none translate-x-0 translate-y-0 border-slate-300' : ''
                }`}
              >
                <ArrowLeft className="w-4 h-4" /> PREVIOUS
              </button>

              {currentQuizIndex < 2 ? (
                <button
                  onClick={() => setCurrentQuizIndex(prev => prev + 1)}
                  disabled={quizAnswers[moduleData.quiz[currentQuizIndex].id] === undefined}
                  className={`neo-btn bg-blue py-3 px-6 text-sm ${
                    quizAnswers[moduleData.quiz[currentQuizIndex].id] === undefined 
                      ? 'opacity-50 cursor-not-allowed shadow-none' 
                      : ''
                  }`}
                >
                  NEXT <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setScreen('RESULTS')}
                  disabled={quizAnswers[moduleData.quiz[currentQuizIndex].id] === undefined}
                  className={`neo-btn bg-pink py-3 px-6 text-sm ${
                    quizAnswers[moduleData.quiz[currentQuizIndex].id] === undefined 
                      ? 'opacity-50 cursor-not-allowed shadow-none' 
                      : ''
                  }`}
                >
                  SUBMIT QUIZ 🎉
                </button>
              )}
            </div>
          </div>
        )}

        {/* SCREEN E: RESULTS & DIAGNOSTIC OVERLAY */}
        {screen === 'RESULTS' && moduleData && moduleData.quiz && (
          <div className="w-full flex flex-col gap-6">
            {/* Score Card Banner */}
            {(() => {
              const score = calculateScore();
              let bannerColor = 'bg-red-200';
              let badgeText = 'OOF! Let\'s try that again! 🧠';
              if (score === 3) {
                bannerColor = 'bg-mint';
                badgeText = 'PERFECT SCORE! You\'re a Master! 🏆';
              } else if (score === 2) {
                bannerColor = 'bg-blue';
                badgeText = 'GREAT JOB! Almost perfect! 🌟';
              } else if (score === 1) {
                bannerColor = 'bg-yellow';
                badgeText = 'GOOD EFFORT! Keep learning! 📚';
              }

              return (
                <div className={`neo-card ${bannerColor} p-6 md:p-8 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative`}>
                  <div className="absolute top-2 right-2 text-3xl opacity-20">🎉</div>
                  <h3 className="text-4xl md:text-5xl font-black mb-3">
                    {score} / 3 CORRECT!
                  </h3>
                  <p className="text-lg font-black uppercase text-slate-800 tracking-wide mt-2">
                    {badgeText}
                  </p>
                </div>
              );
            })()}

            {/* Diagnostic review section */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-black uppercase text-slate-600 tracking-wider">
                Review & Diagnostics
              </h4>

              {moduleData.quiz.map((q) => {
                const selectedOptIdx = quizAnswers[q.id];
                const isCorrect = selectedOptIdx === q.correct_index;
                const letters = ['A', 'B', 'C', 'D'];

                return (
                  <div 
                    key={q.id} 
                    className={`neo-card bg-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-4 ${
                      isCorrect ? 'border-green-600' : 'border-red-500'
                    }`}
                  >
                    {/* Header showing correct/incorrect pill */}
                    <div className={`border-b-4 ${isCorrect ? 'border-green-600 bg-green-50' : 'border-red-500 bg-red-50'} px-4 py-2 flex items-center justify-between`}>
                      <span className="font-extrabold text-xs">Question {q.id}</span>
                      {isCorrect ? (
                        <span className="text-green-700 font-extrabold flex items-center gap-1 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" /> CORRECT
                        </span>
                      ) : (
                        <span className="text-red-700 font-extrabold flex items-center gap-1 text-xs">
                          <XCircle className="w-3.5 h-3.5 stroke-[3]" /> INCORRECT
                        </span>
                      )}
                    </div>

                    <div className="p-4 md:p-5">
                      <p className="font-black text-base mb-4">{q.question}</p>
                      
                      {/* Diagnostic details if incorrect */}
                      {!isCorrect && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div className="border-2 border-black p-3 bg-red-50 rounded-xl">
                            <span className="block text-xs font-black uppercase text-red-700 mb-1">❌ Your Selection:</span>
                            <span className="text-sm font-bold text-red-950">
                              {selectedOptIdx !== undefined 
                                ? `${letters[selectedOptIdx]}) ${q.options[selectedOptIdx]}` 
                                : 'No Answer'}
                            </span>
                          </div>
                          
                          <div className="border-2 border-black p-3 bg-green-50 rounded-xl">
                            <span className="block text-xs font-black uppercase text-green-700 mb-1">✅ Correct Answer:</span>
                            <span className="text-sm font-bold text-green-950">
                              {letters[q.correct_index]}) {q.options[q.correct_index]}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Explanation box */}
                      <div className="border-2 border-black p-4 bg-yellow bg-opacity-35 rounded-xl flex gap-3 items-start">
                        <HelpCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-xs font-black uppercase text-amber-800 mb-0.5">Explanation:</span>
                          <p className="text-sm font-semibold text-amber-950 leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => handleRetakeQuiz()}
                className="neo-btn bg-white py-3.5"
              >
                <RotateCcw className="w-4 h-4 stroke-[3]" /> RETAKE QUIZ
              </button>

              <button
                onClick={() => handleLearnNewTopic()}
                className="neo-btn bg-violet text-black py-3.5"
              >
                <RefreshCw className="w-4 h-4 stroke-[3]" /> LEARN NEW TOPIC
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-4xl text-center mt-12 py-4 border-t-4 border-black text-xs font-black uppercase text-slate-500">
        NuggetAI &copy; {new Date().getFullYear()} &bull; Knowledge, One Nugget at a Time
      </footer>
    </div>
  );
}
