// INTERACTIVE FINANCIAL LITERACY & UPI SAFETY CENTRE
// Combines interactive safety quizzes, compound interest calculators, and safety guides.

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, ShieldAlert, Award, ArrowRight, HelpCircle, AlertOctagon, TrendingUp, Landmark, Calculator, CheckCircle2, XCircle
} from 'lucide-react';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    scenario: "A customer calls you on the phone, sends a QR code, and says: 'Scan this QR code and enter your UPI PIN to receive ₹2,000 for your work.' What will happen?",
    options: [
      { text: "Money will be added to your account instantly.", correct: false },
      { text: "Money will be deducted from your account. You NEVER enter a PIN to receive money!", correct: true }
    ],
    explanation: "This is a very common UPI scam! A UPI PIN is only entered to send money or authorize debits. You do not need to scan a code or enter a PIN to receive payment."
  },
  {
    id: 2,
    scenario: "Someone claiming to be an administrator from Labour Connect calls and asks for your 6-digit OTP to verify a bonus payment. What should you do?",
    options: [
      { text: "Give them the OTP so they can process the payment.", correct: false },
      { text: "Refuse and hang up. Labour Connect staff will NEVER ask for your OTP.", correct: true }
    ],
    explanation: "OTP (One-Time Password) is a secure key. Sharing it allows attackers to compromise your profile or wallet. Never share your OTP with anyone."
  },
  {
    id: 3,
    scenario: "You want to start saving ₹1,000 every month for your children's education. What is the safest, most reliable option?",
    options: [
      { text: "Invest in high-interest daily lottery or informal local savings committee (Bisi).", correct: false },
      { text: "Open a Post Office Savings Scheme or Recurring Deposit (RD) at a government bank.", correct: true }
    ],
    explanation: "Government-backed Post Office schemes and bank RDs have guaranteed returns and are completely safe. Informal committees or lotteries have no legal protections and carry a high risk of fraud."
  }
];

const FinancialLiteracyPage = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Quiz State
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOptIdx, setSelectedOptIdx] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showQuizResult, setShowQuizResult] = useState(false);

  // Calculator State
  const [monthlySave, setMonthlySave] = useState('1000');
  const [years, setYears] = useState('3');
  const [interestRate, setInterestRate] = useState('7.1'); // Post office RD rate
  const [calcResult, setCalcResult] = useState({ totalInvested: 0, interestEarned: 0, maturityVal: 0 });

  useEffect(() => {
    fetchLessons();
    calculateSavings();
  }, []);

  useEffect(() => {
    calculateSavings();
  }, [monthlySave, years, interestRate]);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/schemes/lessons');
      setLessons(res.data);
    } catch (err) {
      console.error('Failed to load learning lessons:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateSavings = () => {
    const P = parseFloat(monthlySave);
    const t = parseFloat(years);
    const r = parseFloat(interestRate) / 100;
    
    if (isNaN(P) || isNaN(t) || isNaN(r) || P <= 0) return;

    // Recurring deposit compound formula
    // M = P * ((1 + r/4)^(4*t) - 1) / (1 - (1 + r/4)^(-1/3)) approx
    // Simplified monthly compound interest for ease:
    const n = 12; // monthly contribution
    const totalMonths = n * t;
    let maturity = 0;
    
    for (let i = 1; i <= totalMonths; i++) {
      maturity += P * Math.pow(1 + r/n, totalMonths - i + 1);
    }

    const totalInvested = P * totalMonths;
    const interestEarned = maturity - totalInvested;

    setCalcResult({
      totalInvested: Math.round(totalInvested),
      interestEarned: Math.round(interestEarned),
      maturityVal: Math.round(maturity)
    });
  };

  const handleQuizAnswer = (optIdx, isCorrect) => {
    setSelectedOptIdx(optIdx);
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    setSelectedOptIdx(null);
    if (currentQuizIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
    } else {
      setShowQuizResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIdx(0);
    setSelectedOptIdx(null);
    setQuizScore(0);
    setShowQuizResult(false);
  };

  return (
    <div className="w-full flex flex-col gap-8 text-left">
      
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-brand-500" />
          Financial Literacy E-Learning
        </h1>
        <p className="text-dark-300 text-sm mt-1">
          Protect your earnings from UPI fraud, master micro-savings systems, and build generational security.
        </p>
      </div>

      {/* DANGEROUS UPI WARNING HUB BANNER */}
      <div className="glass-panel p-6 rounded-3xl border-red-500/20 bg-red-500/[0.02] flex flex-col md:flex-row gap-5 items-center justify-between text-left">
        <div className="flex gap-4 items-start">
          <div className="bg-red-500/10 p-3 rounded-2xl text-red-500 shrink-0 mt-0.5 animate-pulse">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-extrabold text-white text-base">⚠️ Critical Payment Safety Warning</h3>
            <ul className="text-xs text-dark-200 mt-2 list-disc pl-4 flex flex-col gap-1">
              <li><strong className="text-red-400">NO PIN TO RECEIVE:</strong> You do NOT need to enter your UPI PIN to receive money. If someone tells you to enter PIN, they are stealing your funds.</li>
              <li><strong className="text-red-400">NEVER SHARE OTPs:</strong> No company admin, bank clerk, or support executive will ever call you to ask for your verification OTP.</li>
              <li><strong className="text-red-400">SCANNING SCAMS:</strong> Do not scan unknown QR codes sent on WhatsApp to settle work charges.</li>
            </ul>
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-2xl text-[10px] font-bold text-red-400 uppercase tracking-widest shrink-0 text-center">
          Zero PIN = Safe Payments
        </div>
      </div>

      {/* CORE DOUBLE COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMN 1: INTERACTIVE SCENARIO SAFETY QUIZ */}
        <div className="flex flex-col gap-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5.5 h-5.5 text-brand-500" />
            Digital Safety Interactive Quiz
          </h2>

          <div className="glass-panel p-6 rounded-3xl border-white/5 bg-brand-500/[0.01] flex flex-col justify-between min-h-[360px] text-left">
            
            <AnimatePresence mode="wait">
              {!showQuizResult ? (
                <motion.div
                  key={currentQuizIdx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex flex-col gap-4 text-xs font-bold text-dark-200"
                >
                  <div className="flex justify-between items-center text-[10px] text-dark-400 uppercase tracking-wider">
                    <span>Safety Training Scenario {currentQuizIdx + 1} of {QUIZ_QUESTIONS.length}</span>
                    <span>Score: {quizScore}/{currentQuizIdx}</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-white leading-relaxed mt-1">
                    {QUIZ_QUESTIONS[currentQuizIdx].scenario}
                  </h3>

                  {/* Options List */}
                  <div className="flex flex-col gap-2.5 mt-3 text-xs">
                    {QUIZ_QUESTIONS[currentQuizIdx].options.map((opt, idx) => {
                      const selected = selectedOptIdx === idx;
                      const hasSelected = selectedOptIdx !== null;
                      
                      let style = "bg-white/5 border-white/5 hover:border-white/10 text-white";
                      if (hasSelected) {
                        if (opt.correct) {
                          style = "bg-green-500/20 border-green-500/30 text-green-400";
                        } else if (selected) {
                          style = "bg-red-500/20 border-red-500/30 text-red-400";
                        } else {
                          style = "bg-white/5 border-white/5 text-dark-400 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={hasSelected}
                          onClick={() => handleQuizAnswer(idx, opt.correct)}
                          className={`w-full p-4 rounded-2xl border text-left font-semibold transition-all flex items-center justify-between gap-3 ${style}`}
                        >
                          <span>{opt.text}</span>
                          {hasSelected && opt.correct && <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />}
                          {hasSelected && selected && !opt.correct && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation card */}
                  {selectedOptIdx !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-brand-500/5 border border-brand-500/10 p-3.5 rounded-xl text-[11px] text-dark-300 font-medium leading-relaxed mt-2"
                    >
                      <strong className="text-white block mb-0.5">📚 Learn Why:</strong>
                      {QUIZ_QUESTIONS[currentQuizIdx].explanation}
                    </motion.div>
                  )}

                  {/* Navigation */}
                  {selectedOptIdx !== null && (
                    <button
                      onClick={handleNextQuiz}
                      className="mt-3 py-2.5 px-6 bg-brand-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 self-end transition-colors"
                    >
                      <span>{currentQuizIdx === QUIZ_QUESTIONS.length - 1 ? 'Show Certification' : 'Next Scenario'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center gap-4 py-8"
                >
                  <Award className="w-16 h-16 text-brand-500 animate-bounce" />
                  <h3 className="text-xl font-extrabold text-white">Digital Safety Certificate Unlocked!</h3>
                  <p className="text-xs text-dark-300 max-w-sm">
                    Amazing! You scored **{quizScore} out of {QUIZ_QUESTIONS.length}** correct scenario actions. You are now fully trained in UPI payment protection.
                  </p>
                  <div className="bg-brand-500/10 border border-brand-500/15 py-2 px-5 rounded-full font-bold text-[10px] text-brand-400 uppercase tracking-widest">
                    Verified Digital Safety Earner
                  </div>
                  <button
                    onClick={resetQuiz}
                    className="mt-2 py-2 px-6 border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl text-xs"
                  >
                    Retake Quiz Scenario
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* COLUMN 2: SMART MICRO-SAVINGS CALCULATOR */}
        <div className="flex flex-col gap-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-5.5 h-5.5 text-brand-500" />
            Micro-Savings Compound Calculator
          </h2>

          <div className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col justify-between min-h-[360px] text-left">
            <div>
              <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider block mb-1">Guaranteed Welfare RD Model</span>
              <p className="text-xs text-dark-300 leading-relaxed mb-4">
                Calculate guaranteed compounding dividends under Government Bank RDs or Post Office Recurring Savings programs.
              </p>

              {/* Calculator Inputs */}
              <div className="grid grid-cols-3 gap-3.5 text-xs font-bold text-dark-200">
                <div className="flex flex-col gap-1.5">
                  <label>Monthly (₹)</label>
                  <input 
                    type="number" 
                    value={monthlySave}
                    onChange={e => setMonthlySave(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Interest Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={interestRate}
                    onChange={e => setInterestRate(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label>Duration (Years)</label>
                  <select 
                    value={years}
                    onChange={e => setYears(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-white"
                  >
                    {[1, 2, 3, 5, 7, 10].map(y => (
                      <option key={y} value={y} className="bg-dark-950 text-white">{y} Years</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Compound outputs */}
              <div className="grid grid-cols-3 gap-2.5 border-t border-b border-white/5 py-4 my-4 text-center">
                <div>
                  <span className="text-[10px] text-dark-400 font-semibold block uppercase">Total Invested</span>
                  <p className="text-base font-extrabold text-white mt-1">₹{calcResult.totalInvested.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] text-dark-400 font-semibold block uppercase">Interest Earned</span>
                  <p className="text-base font-extrabold text-green-400 mt-1">₹{calcResult.interestEarned.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] text-dark-400 font-semibold block uppercase">Maturity Value</span>
                  <p className="text-base font-extrabold text-brand-400 mt-1">₹{calcResult.maturityVal.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Smart Microtip banner */}
            <div className="bg-green-500/5 border border-green-500/10 p-3.5 rounded-xl flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-400 shrink-0" />
              <p className="text-[10px] text-dark-300 leading-relaxed font-semibold">
                💡 <strong className="text-white">Micro-Saving Tip:</strong> Saving just ₹33 a day builds a ₹1,000 monthly contribution. In 3 years, you accumulate ₹40,000+!
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* CORE DATABASE DRIVEN LESSON COURSES */}
      <div className="flex flex-col gap-5 text-left">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Landmark className="w-6 h-6 text-brand-500" />
          Interactive Banking E-Learning Lessons
        </h2>

        {loading ? (
          <div className="py-12 flex justify-center"><span className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : lessons.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center border-white/5 text-dark-400 flex flex-col items-center gap-3 max-w-lg mx-auto">
            <HelpCircle className="w-8 h-8 text-brand-400" />
            <p>Supplementary digital lessons are offline.</p>
            <p className="text-xs text-dark-500">Local seeds fallbacks are loaded. Standard microtip scenarios remain fully interactive.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lessons.map((ls, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={ls.id}
                className="glass-panel p-5 rounded-2xl border-white/5 hover:border-brand-500/15 transition-colors flex flex-col justify-between gap-4 text-left"
              >
                <div>
                  <span className="text-[10px] bg-brand-500/10 border border-brand-500/15 px-2.5 py-0.5 rounded-full text-brand-400 uppercase tracking-wider font-extrabold w-fit block mb-3">
                    {ls.category}
                  </span>
                  <h4 className="font-extrabold text-white text-sm leading-snug">{ls.title}</h4>
                  <p className="text-xs text-dark-300 mt-2 line-clamp-3 leading-relaxed">
                    {ls.content || 'Mastering safety protocols on public messaging networks.'}
                  </p>
                </div>
                
                {/* Learn button link */}
                <a 
                  href={ls.video_url || 'https://www.rbi.org.in'} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[11px] font-bold text-brand-400 hover:text-white mt-2 flex items-center gap-1 hover:underline"
                >
                  Start Reading Lesson <ArrowRight className="w-3 h-3" />
                </a>

              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default FinancialLiteracyPage;
