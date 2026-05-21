// MULTILINGUAL GOVERNMENT WELFARE PORTAL & ELIGIBILITY CHECKER
// Integrates multilingual translation arrays, category filters, and form wizards.

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Landmark, CheckCircle, HelpCircle, FileText, Globe, Award, ShieldAlert, Check, ArrowRight
} from 'lucide-react';

// Multilingual text translations dictionary
const TRANSLATIONS = {
  en: {
    title: 'Government Welfare Schemes',
    subtitle: 'Understand central and state benefits, calculate eligibility, and apply directly.',
    eligibilityTitle: 'Welfare Eligibility Calculator',
    eligibilityDesc: 'Fill in details to scan which central programs you match.',
    ageLabel: 'Enter Your Age',
    organizedLabel: 'Organized Sector Worker? (PF/Gratuity)',
    taxpayerLabel: 'Are you an Income Taxpayer?',
    incomeLabel: 'Your Monthly Income (₹)',
    calcBtn: 'Analyze Matching Benefits',
    loading: 'Analyzing datasets...',
    eligibleTitle: 'Welfare Matches Found',
    allSchemes: 'All Welfare Schemes',
    yes: 'Yes',
    no: 'No',
    benefits: 'Key Benefits',
    applyBtn: 'Apply Online',
    docsRequired: 'Documents Required',
    categoryAll: 'All Categories',
    categoryPension: 'Pension & Savings',
    categoryHealth: 'Health & Protection',
    categoryCredit: 'Credit & Loans',
    categorySkill: 'Artisans & Skills'
  },
  hi: {
    title: 'सरकारी कल्याणकारी योजनाएं',
    subtitle: 'केंद्र और राज्य के लाभों को समझें, पात्रता की गणना करें और सीधे आवेदन करें।',
    eligibilityTitle: 'कल्याण पात्रता कैलकुलेटर',
    eligibilityDesc: 'यह जानने के लिए विवरण भरें कि आप किन केंद्रीय कार्यक्रमों के पात्र हैं।',
    ageLabel: 'अपनी आयु दर्ज करें',
    organizedLabel: 'संगठित क्षेत्र के कर्मचारी? (PF/ग्रेच्युटी)',
    taxpayerLabel: 'क्या आप आयकर दाता हैं?',
    incomeLabel: 'आपकी मासिक आय (₹)',
    calcBtn: 'पात्र योजनाओं का विश्लेषण करें',
    loading: 'डेटासेट का विश्लेषण किया जा रहा है...',
    eligibleTitle: 'पात्र योजनाएं मिलीं',
    allSchemes: 'सभी कल्याणकारी योजनाएं',
    yes: 'हाँ',
    no: 'नहीं',
    benefits: 'मुख्य लाभ',
    applyBtn: 'ऑनलाइन आवेदन करें',
    docsRequired: 'आवश्यक दस्तावेज',
    categoryAll: 'सभी श्रेणियां',
    categoryPension: 'पेंशन और बचत',
    categoryHealth: 'स्वास्थ्य और सुरक्षा',
    categoryCredit: 'ऋण और ऋण',
    categorySkill: 'कारीगर और कौशल'
  },
  mr: {
    title: 'शासकीय कल्याणकारी योजना',
    subtitle: 'केंद्र आणि राज्य सरकारचे फायदे समजून घ्या, पात्रता मोजा आणि थेट अर्ज करा.',
    eligibilityTitle: 'कल्याणकारी पात्रता मोजणी',
    eligibilityDesc: 'तुम्ही कोणत्या केंद्रीय योजनांचे पात्र आहात हे तपासण्यासाठी माहिती भरा.',
    ageLabel: 'तुमचे वय टाका',
    organizedLabel: 'संघटित क्षेत्रातील कामगार? (PF/ग्रेच्युटी)',
    taxpayerLabel: 'तुम्ही आयकर भरता का?',
    incomeLabel: 'तुमचे मासिक उत्पन्न (₹)',
    calcBtn: 'पात्र योजना तपासा',
    loading: 'डेटाचे विश्लेषण करत आहे...',
    eligibleTitle: 'पात्र योजना आढळल्या',
    allSchemes: 'सर्व कल्याणकारी योजना',
    yes: 'होय',
    no: 'नाही',
    benefits: 'प्रमुख फायदे',
    applyBtn: 'ऑनलाइन अर्ज करा',
    docsRequired: 'आवश्यक कागदपत्रे',
    categoryAll: 'सर्व श्रेणी',
    categoryPension: 'पेन्शन आणि बचत',
    categoryHealth: 'आरोग्य आणि संरक्षण',
    categoryCredit: 'कर्ज आणि पत',
    categorySkill: 'कारागीर आणि कौशल्ये'
  }
};

const SCHEME_TRANSLATIONS = {
  en: {
    "e-Shram Card Registration": {
      title: "e-Shram Card Registration",
      desc: "National registry of unorganized workers offering free accidental death insurance and direct benefit transfers during emergencies.",
      benefits: "₹2 Lakh Accidental Death Cover, direct government aid transfers during crises.",
      docs: "Aadhaar Card, Active Mobile Number, Savings Bank Account Details."
    },
    "Ayushman Bharat PM-JAY": {
      title: "Ayushman Bharat PM-JAY",
      desc: "The world's largest government-funded healthcare program providing cashless medical treatment cover per family per year.",
      benefits: "₹5 Lakh Cashless Family Hospitalization per year, covers 1400+ premium surgeries.",
      docs: "Ration Card, Aadhaar Card, Active PM-JAY Letter."
    },
    "PM Shram Yogi Maan-dhan": {
      title: "PM Shram Yogi Maan-dhan (PM-SYM)",
      desc: "Voluntary pension program for unorganized sector workers that pays monthly pension post retirement age of 60.",
      benefits: "₹3,000 Monthly Assured Pension post age 60, 50% family co-pension.",
      docs: "Aadhaar Card, Savings Bank Passbook, Consent Form."
    },
    "PM-SVANidhi Scheme": {
      title: "PM-SVANidhi Scheme",
      desc: "Micro-credit support scheme for street vendors to restart livelihood after pandemics with interest subsidies.",
      benefits: "₹10,000 Collateral-free First Loan, ₹20k & ₹50k subsequent cycles, 7% subsidy.",
      docs: "Vendor ID Card, Aadhaar Card, Local Body Recommendation Certificate."
    },
    "PM-Vishwakarma Yojana": {
      title: "PM-Vishwakarma Yojana",
      desc: "Comprehensive support for traditional craftsmen and artisans providing toolkits, skill training, and interest-free loans.",
      benefits: "₹15,000 Free Toolkit Grant, ₹3 Lakh Collateral-free loan at 5% interest.",
      docs: "Aadhaar Card, Caste Certificate (if applicable), Bank account."
    }
  },
  hi: {
    "e-Shram Card Registration": {
      title: "ई-श्रम कार्ड पंजीकरण",
      desc: "असंगठित कामगारों का राष्ट्रीय रजिस्टर जो आपातकाल के दौरान मुफ्त दुर्घटना मृत्यु बीमा और प्रत्यक्ष लाभ हस्तांतरण प्रदान करता है।",
      benefits: "₹2 लाख का दुर्घटना मृत्यु कवर, संकट के दौरान प्रत्यक्ष सरकारी सहायता।",
      docs: "आधार कार्ड, सक्रिय मोबाइल नंबर, बचत बैंक खाता विवरण।"
    },
    "Ayushman Bharat PM-JAY": {
      title: "आयुष्मान भारत पीएम-जय (PM-JAY)",
      desc: "कैशलेस चिकित्सा उपचार प्रदान करने वाला दुनिया का सबसे बड़ा सरकार द्वारा वित्त पोषित स्वास्थ्य कार्यक्रम।",
      benefits: "₹5 लाख का कैशलेस पारिवारिक चिकित्सा बीमा प्रति वर्ष, 1400+ सर्जरी कवर।",
      docs: "राशन कार्ड, आधार कार्ड, सक्रिय पीएम-जय पत्र।"
    },
    "PM Shram Yogi Maan-dhan": {
      title: "प्रधानमंत्री श्रम योगी मान-धन (PM-SYM)",
      desc: "असंगठित क्षेत्र के कामगारों के लिए स्वैच्छिक पेंशन कार्यक्रम जो 60 वर्ष की सेवानिवृत्ति की आयु के बाद मासिक पेंशन देता है।",
      benefits: "60 वर्ष के बाद ₹3,000 मासिक सुनिश्चित पेंशन, 50% पारिवारिक पेंशन।",
      docs: "आधार कार्ड, बचत बैंक पासबुक, सहमति पत्र।"
    },
    "PM-SVANidhi Scheme": {
      title: "पीएम-स्वनिधि योजना (PM-SVANidhi)",
      desc: "ब्याज सब्सिडी के साथ महामारी के बाद आजीविका फिर से शुरू करने के लिए स्ट्रीट वेंडरों के लिए सूक्ष्म ऋण योजना।",
      benefits: "₹10,000 का संपार्श्विक-मुक्त पहला ऋण, 7% ब्याज सब्सिडी।",
      docs: "विक्रेता पहचान पत्र, आधार कार्ड, स्थानीय निकाय सिफारिश पत्र।"
    },
    "PM-Vishwakarma Yojana": {
      title: "प्रधानमंत्री विश्वकर्मा योजना",
      desc: "पारंपरिक शिल्पकारों और कारीगरों को टूलकिट, कौशल प्रशिक्षण और रियायती ऋण प्रदान करने वाला कार्यक्रम।",
      benefits: "₹15,000 का मुफ्त टूलकिट अनुदान, 5% ब्याज पर ₹3 लाख का बिना गारंटी ऋण।",
      docs: "आधार कार्ड, जाति प्रमाण पत्र, बैंक खाता।"
    }
  },
  mr: {
    "e-Shram Card Registration": {
      title: "ई-श्रम कार्ड नोंदणी",
      desc: "असंघटित कामगारांची राष्ट्रीय नोंदणी जी अपघात विमा आणि आपत्कालीन थेट बँक खात्यात मदत देते.",
      benefits: "₹२ लाख अपघात मृत्यू विमा संरक्षण, आपत्तीच्या काळात थेट सरकारी मदत.",
      docs: "आधार कार्ड, मोबाईल क्रमांक, बचत बँक खाते."
    },
    "Ayushman Bharat PM-JAY": {
      title: "आयुष्मान भारत पीएम-जय (PM-JAY)",
      desc: "कॅशलेस वैद्यकीय उपचार देणारा जगातील सर्वात मोठा शासकीय आरोग्य विमा कार्यक्रम.",
      benefits: "प्रति वर्ष ₹५ लाख कॅशलेस फॅमिली हॉस्पिटल संरक्षण, १४००+ शस्त्रक्रिया मोफत.",
      docs: "रेशन कार्ड, आधार कार्ड, पीएम-जय पत्र."
    },
    "PM Shram Yogi Maan-dhan": {
      title: "पंतप्रधान श्रम योगी मान-धन (PM-SYM)",
      desc: "असंघटित कामगारांसाठी मासिक पेन्शन योजना ६० वर्ष पूर्ण झाल्यानंतर लागू होणारी योजना.",
      benefits: "६० वर्ष पूर्ण झाल्यावर दरमहा ₹३,००0 खात्रीशीर पेन्शन, कुटुंब सुरक्षा.",
      docs: "आधार कार्ड, बचत बँक पासबुक, संमती पत्र."
    },
    "PM-SVANidhi Scheme": {
      title: "पीएम-स्वनिधी योजना (PM-SVANidhi)",
      desc: "फेरीवाल्यांसाठी व्यवसाय पुन्हा सुरू करण्यासाठी ७% व्याज सबसिडीसह विनातारण कर्ज योजना.",
      benefits: "₹१०,००० विनातारण पहिले कर्ज, त्यानंतर ₹२०हजार आणि ₹५०हजार टप्प्याटप्प्याने.",
      docs: "फेरीवाला ओळखपत्र, आधार कार्ड, स्थानिक स्वराज्य संस्थेचे प्रमाणपत्र."
    },
    "PM-Vishwakarma Yojana": {
      title: "पंतप्रधान विश्वकर्मा योजना",
      desc: "पारंपारिक कारागीर आणि शिल्पकारांसाठी मोफत टूलकिट आणि कर्ज देणारी विशेष योजना.",
      benefits: "₹१५,००० मोफत टूलकिट अनुदान, ५% व्याजावर ₹३ लाख विनातारण कर्ज.",
      docs: "आधार कार्ड, जातीचे प्रमाणपत्र, बँक खाते."
    }
  }
};

const GovSchemesPage = () => {
  const [lang, setLang] = useState('en'); // en, hi, mr
  const [schemes, setSchemes] = useState([]);
  const [eligibleResult, setEligibleResult] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Checker form state
  const [age, setAge] = useState('28');
  const [organizedSector, setOrganizedSector] = useState(false);
  const [taxpayer, setTaxpayer] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('12000');

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    setLoadingList(true);
    try {
      const res = await axios.get('/api/schemes');
      setSchemes(res.data);
    } catch (err) {
      console.error('Failed to load government schemes:', err.message);
    } finally {
      setLoadingList(false);
    }
  };

  const handleEligibilitySubmit = async (e) => {
    e.preventDefault();
    setCalcLoading(true);
    setEligibleResult(null);

    try {
      const payload = {
        age: parseInt(age),
        organizedSector,
        taxpayer,
        monthlyIncome: parseFloat(monthlyIncome || 0.00)
      };

      const res = await axios.post('/api/schemes/eligibility', payload);
      setEligibleResult(res.data.schemes);
    } catch (err) {
      alert(err.response?.data?.error || 'Eligibility check failed.');
    } finally {
      setCalcLoading(false);
    }
  };

  // Helper function to translate scheme content dynamically
  const getSchemeContent = (title, key) => {
    const defaultVal = '';
    // Find matching key inside our static local scheme translation
    const rootKey = Object.keys(SCHEME_TRANSLATIONS.en).find(
      k => title.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(title.toLowerCase())
    );
    if (rootKey && SCHEME_TRANSLATIONS[lang][rootKey]) {
      return SCHEME_TRANSLATIONS[lang][rootKey][key];
    }
    return defaultVal;
  };

  // Display filter
  const displayedSchemes = eligibleResult || schemes;
  
  const filteredSchemes = selectedCategory === 'all' 
    ? displayedSchemes 
    : displayedSchemes.filter(s => s.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="w-full flex flex-col gap-8 text-left">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Landmark className="w-8 h-8 text-brand-500" />
            {t.title}
          </h1>
          <p className="text-dark-300 text-sm mt-1">{t.subtitle}</p>
        </div>
        
        {/* Language selector toggle */}
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shrink-0">
          <Globe className="w-5 h-5 text-brand-500 shrink-0" />
          <div className="flex gap-2">
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिन्दी' },
              { code: 'mr', label: 'मराठी' }
            ].map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`text-xs font-bold px-2.5 py-1 rounded-md transition-all ${lang === l.code ? 'bg-brand-500 text-white font-extrabold shadow-glass' : 'text-dark-300 hover:text-white'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CORE MATRIX: WIZARD & SCHEMES LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: FORM ELIGIBILITY WIZARD */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl border-white/5 bg-brand-500/[0.01] flex flex-col gap-5 text-left sticky top-24">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-500" /> {t.eligibilityTitle}
              </h3>
              <p className="text-xs text-dark-300 mt-1">{t.eligibilityDesc}</p>
            </div>

            <form onSubmit={handleEligibilitySubmit} className="flex flex-col gap-4 text-xs font-bold text-dark-200">
              
              {/* Question 1: Age */}
              <div className="flex flex-col gap-1.5">
                <label>{t.ageLabel}</label>
                <input 
                  type="number"
                  required 
                  min={14}
                  max={80}
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                />
              </div>

              {/* Question 2: Monthly Income */}
              <div className="flex flex-col gap-1.5">
                <label>{t.incomeLabel}</label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g. 15000"
                  value={monthlyIncome}
                  onChange={e => setMonthlyIncome(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                />
              </div>

              {/* Question 3: Organized Sector Toggle */}
              <div className="flex flex-col gap-1.5">
                <label>{t.organizedLabel}</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setOrganizedSector(true)}
                    className={`py-2 rounded-xl border transition-all ${organizedSector ? 'bg-brand-500 border-brand-500 text-white' : 'bg-transparent border-white/10 text-dark-200'}`}
                  >
                    {t.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrganizedSector(false)}
                    className={`py-2 rounded-xl border transition-all ${!organizedSector ? 'bg-brand-500 border-brand-500 text-white' : 'bg-transparent border-white/10 text-dark-200'}`}
                  >
                    {t.no}
                  </button>
                </div>
              </div>

              {/* Question 4: Taxpayer Toggle */}
              <div className="flex flex-col gap-1.5">
                <label>{t.taxpayerLabel}</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTaxpayer(true)}
                    className={`py-2 rounded-xl border transition-all ${taxpayer ? 'bg-brand-500 border-brand-500 text-white' : 'bg-transparent border-white/10 text-dark-200'}`}
                  >
                    {t.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxpayer(false)}
                    className={`py-2 rounded-xl border transition-all ${!taxpayer ? 'bg-brand-500 border-brand-500 text-white' : 'bg-transparent border-white/10 text-dark-200'}`}
                  >
                    {t.no}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={calcLoading}
                className="mt-2 w-full py-3 rounded-xl bg-orange-gradient text-white neon-glow-orange flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                {calcLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t.calcBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: WELFARE SCHEMES RESULTS GRID */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Categories Tab selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: t.categoryAll },
              { id: 'pension', label: t.categoryPension },
              { id: 'health', label: t.categoryHealth },
              { id: 'credit', label: t.categoryCredit },
              { id: 'skill', label: t.categorySkill }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${selectedCategory === cat.id ? 'bg-brand-500 border-brand-500 text-white neon-glow-orange' : 'bg-white/5 border-white/5 text-dark-200 hover:border-white/10'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Heading dynamic details */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {eligibleResult ? `${t.eligibleTitle} (${filteredSchemes.length})` : `${t.allSchemes} (${filteredSchemes.length})`}
            </h3>
            {eligibleResult && (
              <button 
                onClick={() => {
                  setEligibleResult(null);
                  fetchSchemes();
                }}
                className="text-xs text-brand-500 hover:underline font-bold"
              >
                Clear Filters / Show All
              </button>
            )}
          </div>

          {/* CATALOG GRID */}
          {loadingList ? (
            <div className="py-12 flex justify-center"><span className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredSchemes.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center border-white/5 text-dark-400 flex flex-col items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-brand-400 animate-bounce" />
              <p className="font-bold text-white">No Schemes Match the Selected Criteria</p>
              <p className="text-xs text-dark-500">Try toggling different options in the checker or selecting a different category tab.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredSchemes.map((s, idx) => {
                // Get multilingual content or fallback to DB record details
                const transTitle = getSchemeContent(s.title, 'title') || s.title;
                const transDesc = getSchemeContent(s.title, 'desc') || s.description;
                const transBenefits = getSchemeContent(s.title, 'benefits') || s.benefits;
                const transDocs = getSchemeContent(s.title, 'docs') || s.documents_required;

                return (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={s.id}
                    className="glass-panel p-6 rounded-3xl border-white/5 hover:border-brand-500/10 transition-colors flex flex-col gap-4 text-left"
                  >
                    
                    {/* Header info */}
                    <div className="flex gap-4 items-start">
                      <div className="bg-brand-500/10 p-3.5 rounded-2xl text-brand-500 shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <h4 className="font-extrabold text-white text-base leading-snug">{transTitle}</h4>
                        <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full w-fit mt-1.5 tracking-wider">
                          {s.category}
                        </span>
                        <p className="text-xs text-dark-300 mt-2.5 leading-relaxed">{transDesc}</p>
                      </div>
                    </div>

                    {/* Breakdown grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs font-medium">
                      
                      {/* Benefits box */}
                      <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                        <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider block mb-1">
                          🎁 {t.benefits}
                        </span>
                        <p className="text-white font-semibold leading-normal">{transBenefits}</p>
                      </div>

                      {/* Documents Box */}
                      <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                        <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider block mb-1">
                          📄 {t.docsRequired}
                        </span>
                        <p className="text-white font-semibold leading-normal">{transDocs}</p>
                      </div>

                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-3 text-xs mt-1">
                      <span className="text-green-400 flex items-center gap-1 font-bold">
                        <Check className="w-4 h-4 shrink-0 text-green-400" /> Matches Your Criteria
                      </span>
                      <a 
                        href={s.apply_link || 'https://eshram.gov.in'} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="bg-brand-500 hover:bg-brand-600 font-bold text-white py-2 px-4 rounded-xl flex items-center gap-1 transition-colors shrink-0"
                      >
                        {t.applyBtn} <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default GovSchemesPage;
