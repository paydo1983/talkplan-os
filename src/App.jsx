import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, updateDoc, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  Brain, Shield, Zap, User, Lock, LogOut, CheckCircle, Upload, Database, Activity, Target, MessageSquare, Trash2, Star, ArrowRight, AlertCircle
} from 'lucide-react';

// ------------------------------------------------------------------
// 🛡️ [방어선 1] 보안 통신망 수복
// ------------------------------------------------------------------
let firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

try {
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  } else if (typeof import.meta !== 'undefined' && import.meta.env) {
    firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  }
} catch (e) {
  console.warn("Firebase config initialization warning:", e);
}

const rawAppId = typeof __app_id !== 'undefined' ? String(__app_id) : 'talkplan-os-default';
const appId = rawAppId.replace(/[\/.]/g, '_'); 

const app = initializeApp(firebaseConfig); 
const auth = getAuth(app); 
const db = getFirestore(app);
const functions = getFunctions(app);

const MASTER_ADMIN_ID = "21030003"; 
const MASTER_ADMIN_PW = "admin777"; 
const DB_COLLECTION = 'user_profiles';
const WINNING_DATA_COLLECTION = 'winning_scripts'; 
const POTENTIAL_SUCCESS_COLLECTION = 'potential_success_cases'; // 🚨 자율 학습 대기소

// 🧠 AI 전술 엔진 연동
const generateTacticalScript = async (userQuery, modeType, contextData = []) => {
  try {
    const generateTactic = httpsCallable(functions, 'generateTacticAI');
    const response = await generateTactic({ userQuery, modeType, contextData });
    return { text: response.data.text || "", matches: response.data.matches || [] };
  } catch (err) { return { text: `[사령부 통신 장애]`, matches: [] }; }
};

// ------------------------------------------------------------------
// 1. 인증 화면
// ------------------------------------------------------------------
function AuthScreen({ onLogin, onSignUp, isAuthReady }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [mode, setMode] = useState('login');
  const [localId, setLocalId] = useState(''); const [localPw, setLocalPw] = useState('');
  const [localPwConfirm, setLocalPwConfirm] = useState(''); const [localName, setLocalName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setAuthError(''); setAuthSuccess('');
    if (isAdminMode) { 
      const err = await onLogin({ gaiaId: localId.trim(), password: localPw.trim(), isMasterAttempt: true }); 
      if(err) setAuthError(err);
      return; 
    }
    if (mode === 'signup') {
      if (localPw !== localPwConfirm) { setAuthError('비밀번호가 일치하지 않습니다.'); return; }
      const res = await onSignUp({ gaiaId: localId.trim(), password: localPw.trim(), userName: localName.trim() });
      if(res.success) setAuthSuccess(res.msg); else setAuthError(res.msg);
    } else { 
      const err = await onLogin({ gaiaId: localId.trim(), password: localPw.trim() }); 
      if(err) setAuthError(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-6 w-full font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-700"></div>

      <div className="mb-10 flex flex-col items-center z-10">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-3xl shadow-[0_0_30px_rgba(37,99,235,0.5)] mb-4 text-white">TP</div>
        <h1 className="text-4xl font-black text-white tracking-tighter shadow-black drop-shadow-md">Talk Plan OS</h1>
        <p className="text-xs font-bold text-blue-400 mt-2 uppercase tracking-[0.3em]">Tactical Interface</p>
      </div>
      
      <div className="max-w-md w-full bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl relative z-10">
        {isAdminMode && <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600 animate-pulse rounded-t-3xl"></div>}
        <h2 className="text-2xl font-black text-white mb-2 text-center">{isAdminMode ? '지휘관 보안 접속' : '전술 사번 인증'}</h2>
        
        <form className="space-y-5 mt-6" onSubmit={handleSubmit}>
          {!isAdminMode && mode === 'signup' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">User Name</label>
              <input type="text" placeholder="성함 입력" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" value={localName} onChange={e => setLocalName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">{isAdminMode ? "Master ID" : "Gaia ID"}</label>
            <input type="text" placeholder="사번 8자리" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono" value={localId} onChange={e => setLocalId(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Access Key</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} placeholder="••••••••" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 pr-14 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono" value={localPw} onChange={e => setLocalPw(e.target.value)} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-blue-400 uppercase">{showPw ? "Hide" : "Show"}</button>
            </div>
          </div>
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Confirm Key</label>
              <input type="password" placeholder="비밀번호 재입력" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono" value={localPwConfirm} onChange={e => setLocalPwConfirm(e.target.value)} />
            </div>
          )}
          {authError && <div className="text-xs text-red-400 font-bold text-center bg-red-900/30 p-3 rounded-lg border border-red-800">{authError}</div>}
          {authSuccess && <div className="text-xs text-emerald-400 font-bold text-center bg-emerald-900/30 p-3 rounded-lg border border-emerald-800 animate-pulse">{authSuccess}</div>}
          
          <button type="submit" className={`w-full py-4 rounded-xl font-black text-white shadow-lg transition-all active:scale-95 mt-4 ${isAdminMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {isAdminMode ? '시스템 통제권 확보' : (mode === 'login' ? '시스템 진입' : '권한 승인 요청')}
          </button>
        </form>

        <div className="mt-8 text-center flex flex-col gap-3">
          {!isAdminMode && (
            <button onClick={() => {setMode(mode === 'login' ? 'signup' : 'login'); setAuthError(''); setAuthSuccess('');}} className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-4">
              {mode === 'login' ? '신규 설계사 권한 요청' : '기존 설계사 로그인'}
            </button>
          )}
          <button onClick={() => {setIsAdminMode(!isAdminMode); setAuthError(''); setAuthSuccess('');}} className="text-[10px] text-slate-600 mt-2 hover:text-slate-400 transition-colors uppercase font-bold">
            [ Toggle Command Center Auth ]
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 2. 지휘관 통제실 (AdminDashboard) - 자율 고도화 제어 UI
// ------------------------------------------------------------------
function AdminDashboard() {
  const [winningScripts, setWinningScripts] = useState([]);
  const [potentialCases, setPotentialCases] = useState([]); 
  const [users, setUsers] = useState([]);
  const [injectStatus, setInjectStatus] = useState('');

  useEffect(() => {
    if (!db) return;
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION), snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', WINNING_DATA_COLLECTION), snap => {
      setWinningScripts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)));
    });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', POTENTIAL_SUCCESS_COLLECTION), snap => {
      setPotentialCases(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)));
    });
  }, []);

  const handleApproveCase = async (caseData) => {
    setInjectStatus("🧠 AI 전술 각인 중...");
    try {
      const injectVector = httpsCallable(functions, 'injectVectorData');
      const vecResult = await injectVector({ text: caseData.winning_response });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', WINNING_DATA_COLLECTION), {
        raw_transcript: caseData.winning_response, vector: vecResult.data.vector, timestamp: new Date().toISOString(), type: 'auto_learned'
      });
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', POTENTIAL_SUCCESS_COLLECTION, caseData.id));
      setInjectStatus("✅ 지능 진화 성공.");
      setTimeout(()=>setInjectStatus(''), 3000);
    } catch (e) { setInjectStatus("❌ 각인 실패"); }
  };

  return (
    <div className="flex-1 p-10 bg-slate-50 overflow-y-auto font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Shield size={32}/></div>
            <div><h2 className="text-4xl font-black tracking-tighter">통제 사령부</h2><p className="text-sm text-slate-500 font-bold">자가 진화 알고리즘 및 요원 관리</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          <div className="bg-white rounded-[3rem] border border-orange-200 p-10 flex flex-col h-[550px] shadow-xl relative overflow-hidden">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-orange-600"><Activity size={28}/> 현장 보고 학습 대기소 ({potentialCases.length})</h3>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {potentialCases.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300"><Target size={64} className="mb-4 opacity-20"/><p className="text-sm font-black text-center">보고된 지능 데이터가 없습니다.</p></div>
              ) : (
                potentialCases.map(c => (
                  <div key={c.id} className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100 group transition-all hover:bg-white hover:shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-orange-500 bg-white px-3 py-1 rounded-full border border-orange-100">AGENT SUCCESS REPORT</span>
                      <div className="flex gap-2">
                        <button onClick={()=>deleteDoc(doc(db,'artifacts',appId,'public', 'data', POTENTIAL_SUCCESS_COLLECTION, c.id))} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                        <button onClick={()=>handleApproveCase(c)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-900/20">지능 각인</button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[11px] text-slate-500 italic"><span className="font-black text-orange-400 mr-2">Q:</span>{c.original_query}</p>
                      <p className="text-sm text-slate-800 font-bold"><span className="text-blue-600 mr-2">A:</span>{c.winning_response}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 text-white border border-slate-800 flex flex-col h-[550px] shadow-2xl relative overflow-hidden">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-blue-400"><Database size={28}/> 영구 지식 무기고 ({winningScripts.length})</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {winningScripts.map(s => (
                <div key={s.id} className="p-5 bg-slate-950/50 border border-slate-800 rounded-3xl group relative hover:border-blue-500/50 transition-all">
                  <button onClick={async()=>await deleteDoc(doc(db,'artifacts',appId,'public','data',WINNING_DATA_COLLECTION,s.id))} className="absolute top-6 right-6 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                  <div className="flex items-center gap-2 mb-3"><div className={`w-1.5 h-1.5 rounded-full ${s.type === 'auto_learned' ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]' : 'bg-blue-500'}`}></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{s.type === 'auto_learned' ? 'Learned Experience' : 'Core SOP'}</span></div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-3">{s.raw_transcript}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {injectStatus && <div className="fixed bottom-12 right-12 bg-slate-950 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-2xl border border-blue-600 animate-in slide-in-from-right-10">{injectStatus}</div>}
    </div>
  );
}

// ------------------------------------------------------------------
// 3. 설계사 전술 대시보드 (AgentDashboard) - 50개 시나리오 탑재
// ------------------------------------------------------------------
function AgentDashboard({ sessionProfile }) {
  const [currentMode, setCurrentMode] = useState('menu'); 
  const [actualInput, setActualInput] = useState('');
  const [actualFeedback, setActualFeedback] = useState(null); 
  const [vectorMatches, setVectorMatches] = useState([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [trainingStage, setTrainingStage] = useState(1);
  const [trainingInput, setTrainingInput] = useState('');
  const [trainingFeedback, setTrainingFeedback] = useState('');
  const [isStagePassed, setIsStagePassed] = useState(false);
  const [scenarioIndices, setScenarioIndices] = useState([0,0,0,0,0]);

  // 🚨 지휘관이 요구한 5단계 x 10개 완벽 시나리오
  const scenarioDB = {
    1: ["[시스템: 뱅크샐러드 유입] 고객이 5분째 침묵 중입니다.", "[시스템: 카카오페이 유입] 점검 리포트 확인 후 진입했습니다.", "고객: 암보험 5천만원 맞추면 월 얼마 정도 하나요?", "고객: 보험료가 너무 많이 나와서 줄여보고 싶어요.", "[시스템: 보맵 유입] 부족한 보장 채우기 추천 요청입니다.", "고객: 기존 보험 해지하고 새로 하고 싶어요.", "고객: 실비 청구 하려고 왔는데 분석도 가능한가요?", "[시스템: 유료 상담 결제] 고객이 패키지 구매 후 대기 중입니다.", "고객: 지인 추천 받고 들어왔습니다.", "고객: 가입된 건 많은데 정작 보장 받을 게 없다고 나옵니다."],
    2: ["데이터: CI 종신 월 25만원. 10년차. 주계약만 있음.", "데이터: 3세대 실손이 건강보험에 묶여 있음. 암 1천 부족.", "데이터: 모든 만기 60세 설정됨. 고객 나이 55세.", "데이터: 건강보험 5건 전부 3년 갱신형. 월 45만.", "데이터: 사망 목적 아닌데 종신만 3건 가입됨. 저축 오인.", "데이터: 진단비 없는 '입원/수술비 전용'만 유지 중.", "데이터: 1세대 실비 유지 중이나 월 18만원 부담.", "데이터: 무해지형 보험의 해지 환급금 0원 리스크 모름.", "데이터: 유병자 보험을 일반체보다 30% 비싸게 가입 중.", "데이터: 가입 내역상 '뇌출혈' 담보만 있어 범위 좁음."],
    3: ["고객: '영끌 대출 이자 때문에 5만원도 사치인 것 같아요.'", "고객: '지금까지 낸 돈이 너무 아까워요. 해지 못해요.'", "고객: '갱신형은 나중에 비싸지잖아요. 무조건 비갱신 할래요.'", "고객: '심사 본다고 해서 가입해야 하는 건 아니죠? 부담돼요.'", "고객: '보장 알겠는데 가격만 딱 절반으로 깎아주세요.'", "고객: '지금 주식에 돈이 다 묶여 있어서 여윳돈 없어요.'", "고객: '보험은 나중에 아플 때 가입해도 되지 않나요?'", "고객: '다른 데서 물어보니까 훨씬 싸던데 여긴 왜 비싸요?'", "고객: '가족들이 보험은 다 사기라고 하지 말라네요.'", "고객: '카톡으로만 상담받는 게 좀 불안해요.'"],
    4: ["고객: '제안서 잘 봤고 남편이랑 상의 후 연락드릴게요.'", "고객: 'A사 말고 B사랑 C사 비교표 엑셀로 보내주세요.'", "고객: '이거 오늘 꼭 해야 하나요? 다음 달에 해도 되죠?'", "고객: '내용은 좋은데 가입 절차가 너무 복잡하네요.'", "고객: '상령일이 며칠 안 남았다고요? 차이가 얼마나 나죠?'", "고객: '운전 중이라 저녁에 다시 톡 드릴게요.'", "고객: '설계사님 믿고 하고 싶은데 사은품 없나요?'", "고객: '3개월 전에 위염 약 처방받은 거 고지해야 하나요?'", "고객: '보장 금액 2천만원만 더 높여서 다시 보여주세요.'", "고객: '고민이 좀 되네요. 내일 오전에 확답 드려도 될까요?'"],
    5: ["고객: '죄송해요. 아내가 지인한테 들기로 해서 취소할게요.'", "고객: '이전 관리하던 설계사가 특약 빼면 안 된다고 난리네요.'", "고객: '유튜브 보니까 이 상품보다 더 좋은 게 나왔다던데요?'", "고객: '다른 데서 더 싼 조건으로 방금 가입했습니다.'", "고객: '계약 직전인데 비대면 상담은 신뢰가 안 가네요.'", "현상: 고객이 제안서 확인 후 48시간째 읽씹 중입니다.", "고객: '보험 카페에서 이 설계 비효율적이라네요. 해지 안 해요.'", "고객: '부모님이 관리해주시기로 해서 제가 결정 못 해요.'", "고객: '좀 더 공부하고 비교해 본 다음에 직접 가입할게요.'", "고객: '보험료 납입 기간 바꾸면 너무 손해인 것 같아 안 할래요.'"]
  };

  const startTraining = () => {
    setScenarioIndices([Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)]);
    setCurrentMode('training'); setTrainingStage(1); setTrainingInput(''); setTrainingFeedback(''); setIsStagePassed(false);
  };

  const handleReportSuccess = async () => {
    if (!actualFeedback || feedbackSent) return;
    setFeedbackSent(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', POTENTIAL_SUCCESS_COLLECTION), {
        original_query: actualInput, winning_response: actualFeedback.text, agent_id: sessionProfile.gaiaId, timestamp: new Date().toISOString()
      });
    } catch (e) { console.error(e); }
  };

  const submitActualChat = async () => {
    if (!actualInput.trim()) return;
    setIsAiProcessing(true); setActualFeedback(null); setFeedbackSent(false); setVectorMatches([]);
    try {
      const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', WINNING_DATA_COLLECTION));
      let context = []; snap.forEach(doc => { if (doc.data().vector) context.push(doc.data()); });
      const res = await generateTacticalScript(actualInput, "ACTUAL", context);
      setActualFeedback({ text: res.text }); setVectorMatches(res.matches || []);
    } catch (e) { setActualFeedback({ text: "[서버 장애]" }); }
    finally { setIsAiProcessing(false); }
  };

  if (currentMode === 'actual') {
    return (
      <div className="flex-1 flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
        <div className="bg-white border-b px-10 py-5 flex justify-between items-center shadow-sm">
          <button onClick={() => setCurrentMode('menu')} className="text-xs font-black text-slate-400 hover:text-slate-900 transition-all">← OPERATION ABORT</button>
          <h2 className="text-xl font-black flex items-center gap-3"><Activity className="text-orange-500 animate-pulse" size={24}/> 실전 분석 및 진화 엔진 가동</h2>
          <div className="w-20"></div>
        </div>
        <div className="flex-1 p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5"><div className="bg-white p-10 rounded-[3.5rem] border shadow-xl flex flex-col h-full"><textarea value={actualInput} onChange={e => setActualInput(e.target.value)} className="w-full h-96 bg-slate-50 border-none rounded-[2.5rem] p-8 text-sm outline-none focus:bg-white transition-all shadow-inner font-medium" placeholder="고객 채팅 복사..." /><button onClick={submitActualChat} disabled={isAiProcessing || !actualInput.trim()} className="w-full py-6 rounded-2xl font-black text-white mt-8 transition-all shadow-lg bg-slate-900 hover:bg-black text-lg active:scale-95">{isAiProcessing ? '분석 중...' : '최적 돌파구 렌더링'}</button></div></div>
            <div className="lg:col-span-7 space-y-8 flex flex-col h-full">
              {vectorMatches.length > 0 && (<div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">{vectorMatches.map((m, i) => (<div key={i} className="min-w-[300px] bg-white border-l-[6px] border-blue-600 p-6 rounded-[2rem] shadow-lg border hover:-translate-y-1 transition-all"><p className="text-[11px] font-black text-blue-600 mb-2 uppercase">Match {(m.score*100).toFixed(1)}%</p><p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-4">{m.text}</p></div>))}</div>)}
              <div className="bg-slate-900 p-12 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col flex-1 min-h-[500px]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-4 relative z-10"><Zap className="text-emerald-400" size={32}/> AI Tactical Report</h3>
                <div className="flex-1 relative z-10">
                  {actualFeedback ? (
                    <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-700">
                      <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-10 mb-8 overflow-y-auto shadow-inner"><p className="text-lg leading-loose whitespace-pre-wrap text-slate-200 font-medium">{actualFeedback.text}</p></div>
                      <div className="grid grid-cols-2 gap-6">
                        <button onClick={handleReportSuccess} disabled={feedbackSent} className={`py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl ${feedbackSent ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/30'}`}>{feedbackSent ? <><CheckCircle size={22}/> 보고 완료</> : <><Star size={22}/> 🎯 타격 성공 (성적 보고)</>}</button>
                        <button className="py-5 rounded-2xl font-black text-sm bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700">💀 거절당함</button>
                      </div>
                    </div>
                  ) : ( <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-20"><Brain size={120} className="mb-8"/><p className="text-xl font-black uppercase tracking-[0.4em] text-center">Ready for Combat</p></div> )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 relative font-sans text-slate-900">
      <div className="max-w-5xl w-full text-center space-y-16">
        <h2 className="text-6xl font-black tracking-tight text-slate-900">전술 작전 개시</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
          <div onClick={startTraining} className="bg-white p-14 rounded-[4rem] border shadow-2xl hover:border-amber-400 transition-all cursor-pointer active:scale-95 group"><Target size={48} className="text-amber-600 mb-8 group-hover:rotate-12 transition-all"/><h3 className="text-3xl font-black mb-6">훈련 시뮬레이터</h3><p className="text-slate-500 text-base mb-12">지휘관의 50개 하드코어 시나리오 무작위 돌파.</p><span className="text-amber-600 font-black text-sm flex items-center gap-2 group-hover:translate-x-3 transition-all">TRAINING INITIATE →</span></div>
          <div onClick={() => setCurrentMode('actual')} className={`bg-white p-14 rounded-[4rem] border shadow-2xl transition-all group active:scale-95 ${sessionProfile.hasPassedTraining || sessionProfile.isAdmin ? 'border-slate-200 hover:border-blue-400 cursor-pointer shadow-slate-200/50' : 'opacity-60 grayscale cursor-not-allowed'}`}><Zap size={48} className={`${sessionProfile.hasPassedTraining || sessionProfile.isAdmin ? 'text-blue-600' : 'text-slate-400'} mb-8 group-hover:-rotate-12 transition-all`}/><h3 className="text-3xl font-black mb-6">실전 분석 및 진화</h3><p className="text-slate-500 text-base mb-12">성공 데이터 각인을 통한 실시간 지능 고도화.</p><span className={`font-black text-sm flex items-center gap-2 transition-all ${sessionProfile.hasPassedTraining || sessionProfile.isAdmin ? 'text-blue-600 group-hover:translate-x-3' : 'text-slate-400'}`}>ANALYSIS START →</span></div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 4. 메인 앱 컴포넌트 (App)
// ------------------------------------------------------------------
export default function App() {
  const [sessionProfile, setSessionProfile] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [adminViewMode, setAdminViewMode] = useState('command'); 

  useEffect(() => {
    const saved = sessionStorage.getItem('gaia_session');
    if (saved) setSessionProfile(JSON.parse(saved));
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch(e) { console.error("인증 실패", e); } 
      finally { setIsAuthChecking(false); }
    };
    initAuth();
    onAuthStateChanged(auth, u => setFirebaseUser(u));
  }, []);

  const handleLogin = async ({ gaiaId, password }) => {
    if (gaiaId === MASTER_ADMIN_ID && password === MASTER_ADMIN_PW) {
      const p = { gaiaId, name: "지휘관", isApproved: true, isAdmin: true, hasPassedTraining: true };
      setSessionProfile(p); sessionStorage.setItem('gaia_session', JSON.stringify(p)); return null;
    }
    try {
      const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION, gaiaId));
      if (snap.exists() && snap.data().password === password) {
        if (!snap.data().isApproved) return '승인 대기 상태입니다.';
        setSessionProfile(snap.data()); sessionStorage.setItem('gaia_session', JSON.stringify(snap.data())); return null;
      } else return '사번 또는 비밀번호 불일치.';
    } catch (e) { return 'DB 장애: ' + e.message; }
  };

  const handleSignUp = async ({ gaiaId, password, userName }) => {
    try {
      const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION, gaiaId));
      if (snap.exists()) return { success: false, msg: '이미 존재하는 사번입니다.' };
      const profile = { gaiaId, name: userName, password, isApproved: false, hasPassedTraining: false, createdAt: new Date().toISOString(), isAdmin: false };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION, gaiaId), profile);
      return { success: true, msg: '관리자에게 승인 요청이 전송되었습니다.' };
    } catch (e) { return { success: false, msg: '요청 전송 실패: ' + e.message }; }
  };

  if (isAuthChecking) return <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center font-sans"><div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-8"></div><p className="text-slate-500 text-xs font-black tracking-[0.4em] uppercase animate-pulse">Establishing Secure Uplink...</p></div>;
  if (!sessionProfile) return <AuthScreen onLogin={handleLogin} onSignUp={handleSignUp} isAuthReady={!!firebaseUser} />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <header className="bg-white px-10 py-5 border-b flex justify-between items-center shadow-md z-50 relative shrink-0">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${sessionProfile.isAdmin ? 'bg-red-600' : 'bg-blue-600'}`}></div>
        
        <div className="flex items-center gap-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-xl ${sessionProfile.isAdmin ? 'bg-red-600' : 'bg-blue-600'}`}>TP</div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Talk Plan OS</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{sessionProfile.isAdmin ? 'Commander Center' : 'Field Operator'}</p>
              <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-black">v1.0.1</span>
            </div>
          </div>
        </div>

        {sessionProfile.isAdmin && (
          <div className="absolute left-1/2 -translate-x-1/2 bg-slate-100 p-1.5 rounded-2xl border flex shadow-inner">
            <button onClick={() => setAdminViewMode('command')} className={`px-12 py-3 text-xs font-black rounded-xl transition-all ${adminViewMode === 'command' ? 'bg-white shadow-lg text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>사령부 통제소</button>
            <button onClick={() => setAdminViewMode('agent')} className={`px-12 py-3 text-xs font-black rounded-xl transition-all ${adminViewMode === 'agent' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>현장 대시보드</button>
          </div>
        )}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4 bg-slate-100 px-6 py-2.5 rounded-2xl border border-slate-200">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-black text-sm text-slate-500 uppercase">{sessionProfile.name[0]}</div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-700 leading-none mb-1.5">{sessionProfile.name}</span>
              <span className="text-[11px] font-bold text-slate-400 font-mono leading-none tracking-tighter">{sessionProfile.gaiaId}</span>
            </div>
          </div>
          <button onClick={() => {sessionStorage.clear(); window.location.reload();}} className="text-slate-400 hover:text-red-600 transition-all p-3 rounded-2xl hover:bg-red-50"><LogOut size={28}/></button>
        </div>
      </header>
      {(sessionProfile.isAdmin && adminViewMode === 'command') ? <AdminDashboard /> : <AgentDashboard sessionProfile={sessionProfile} />}
    </div>
  );
}