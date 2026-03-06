import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, updateDoc, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  Brain, Shield, Zap, User, LogOut, CheckCircle, Upload, Database, Activity, Target, Trash2, Star 
} from 'lucide-react';

// ------------------------------------------------------------------
// 🛡️ 보안 통신망 및 시스템 초기화
// ------------------------------------------------------------------
let firebaseConfig = { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" };
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
} catch (e) { console.warn("Firebase config warning:", e); }

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
const POTENTIAL_SUCCESS_COLLECTION = 'potential_success_cases';

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
function AuthScreen({ onLogin, onSignUp }) {
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
      <div className="mb-10 flex flex-col items-center z-10">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-3xl shadow-[0_0_30px_rgba(37,99,235,0.5)] mb-4 text-white">TP</div>
        <h1 className="text-4xl font-black text-white tracking-tighter">Talk Plan OS</h1>
        <p className="text-xs font-bold text-blue-400 mt-2 uppercase tracking-[0.3em]">Tactical Interface</p>
      </div>
      <div className="max-w-md w-full bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl relative z-10">
        <h2 className="text-2xl font-black text-white mb-2 text-center">{isAdminMode ? '지휘관 보안 접속' : '전술 사번 인증'}</h2>
        <form className="space-y-5 mt-6" onSubmit={handleSubmit}>
          {!isAdminMode && mode === 'signup' && (
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">User Name</label><input type="text" placeholder="성함 입력" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 transition-all" value={localName} onChange={e => setLocalName(e.target.value)} /></div>
          )}
          <div><label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">{isAdminMode ? "Master ID" : "Gaia ID"}</label><input type="text" placeholder="사번 8자리" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 transition-all font-mono" value={localId} onChange={e => setLocalId(e.target.value)} /></div>
          <div><label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Access Key</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} placeholder="••••••••" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 pr-14 text-sm text-white outline-none focus:border-blue-500 transition-all font-mono" value={localPw} onChange={e => setLocalPw(e.target.value)} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-blue-400 uppercase">{showPw ? "Hide" : "Show"}</button>
            </div>
          </div>
          {mode === 'signup' && (
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Confirm Key</label><input type="password" placeholder="비밀번호 재입력" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 transition-all font-mono" value={localPwConfirm} onChange={e => setLocalPwConfirm(e.target.value)} /></div>
          )}
          {authError && <div className="text-xs text-red-400 font-bold text-center bg-red-900/30 p-3 rounded-lg border border-red-800">{authError}</div>}
          {authSuccess && <div className="text-xs text-emerald-400 font-bold text-center bg-emerald-900/30 p-3 rounded-lg border border-emerald-800 animate-pulse">{authSuccess}</div>}
          <button type="submit" className={`w-full py-4 rounded-xl font-black text-white shadow-lg transition-all active:scale-95 mt-4 ${isAdminMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{isAdminMode ? '시스템 통제권 확보' : (mode === 'login' ? '시스템 진입' : '권한 승인 요청')}</button>
        </form>
        <div className="mt-8 text-center flex flex-col gap-3">
          {!isAdminMode && (<button onClick={() => {setMode(mode === 'login' ? 'signup' : 'login'); setAuthError(''); setAuthSuccess('');}} className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-4">{mode === 'login' ? '신규 설계사 권한 요청' : '기존 설계사 로그인'}</button>)}
          <button onClick={() => {setIsAdminMode(!isAdminMode); setAuthError(''); setAuthSuccess('');}} className="text-[10px] text-slate-600 mt-2 hover:text-slate-400 transition-colors uppercase font-bold">[ Toggle Command Center Auth ]</button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 2. 지휘관 통제소 
// ------------------------------------------------------------------
function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [rawTranscript, setRawTranscript] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION), (snapshot) => {
      const userList = []; snapshot.forEach(doc => userList.push({ id: doc.id, ...doc.data() }));
      setUsers(userList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });
    return () => unsubscribe();
  }, []);

  const toggleApproval = async (userId, currentStatus) => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION, userId), { isApproved: !currentStatus }); } catch (e) { console.error(e); }
  };
  const toggleTrainingPass = async (userId, currentStatus) => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION, userId), { hasPassedTraining: !currentStatus }); } catch (e) { console.error(e); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('파일 데이터 추출 중...');
    const reader = new FileReader();
    reader.onload = (event) => {
      setRawTranscript(prev => prev ? prev + '\n\n[신규 파일]\n' + event.target.result : event.target.result);
      setStatus(`✅ 파일 로드 완료: ${file.name}`);
    };
    reader.readAsText(file, "UTF-8"); 
  };

  const handleInject = async () => {
    if (!rawTranscript.trim()) { setStatus('주입할 데이터가 없습니다.'); return; }
    setStatus('AI 학습 데이터 전송 및 각인 중...');
    try {
      const injectVector = httpsCallable(functions, 'injectVectorData');
      const vecResult = await injectVector({ text: rawTranscript });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', WINNING_DATA_COLLECTION), {
        raw_transcript: rawTranscript, vector: vecResult.data.vector, timestamp: new Date().toISOString(), type: 'core_sop'
      });
      setRawTranscript(''); setStatus('✅ 전술 데이터 각인 완료.');
      setTimeout(() => setStatus(''), 3000);
    } catch (e) { setStatus(`❌ 각인 실패: ${e.message}`); }
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">지휘관 통제소 (Command Center)</h2><p className="text-sm text-slate-500 font-bold mt-1">설계사 권한 통제 및 전술 무기고 관리</p></div>
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-black text-sm border border-red-200 shadow-sm flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div> MASTER OVERRIDE ACTIVE</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2"><User className="text-blue-600" size={20}/><h3 className="text-lg font-black text-slate-800">요원 접근 제어</h3></div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs uppercase font-black tracking-wider">
                <th className="p-4 pl-6">사번</th><th className="p-4">성함</th><th className="p-4 text-center">시스템 승인</th><th className="p-4 text-center">훈련 수료 (실전 권한)</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-800 font-medium">
              {users.map(user => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 font-mono font-bold text-blue-700">{user.gaiaId}</td><td className="p-4">{user.name}</td>
                  <td className="p-4 text-center"><button onClick={() => toggleApproval(user.id, user.isApproved)} className={`px-4 py-1.5 rounded-full font-bold text-xs ${user.isApproved ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{user.isApproved ? '승인됨' : '대기중'}</button></td>
                  <td className="p-4 text-center"><button onClick={() => toggleTrainingPass(user.id, user.hasPassedTraining)} disabled={!user.isApproved} className={`px-4 py-1.5 rounded-full font-bold text-xs ${!user.isApproved ? 'opacity-30 cursor-not-allowed bg-slate-100' : (user.hasPassedTraining ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-amber-100 text-amber-700 border border-amber-200')}`}>{user.hasPassedTraining ? '수료 완료' : '미수료'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div><h3 className="text-2xl font-black flex items-center gap-3"><Brain size={28} className="text-blue-400"/> 전술 교리 주입기 (Vector DB)</h3><p className="text-sm text-slate-400 mt-2">성공 사례(CSV/Text)를 주입하여 AI의 기본 수학적 좌표를 세팅합니다.</p></div>
            <label className="bg-slate-800 border border-slate-600 px-5 py-3 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-700 transition-all shadow-md flex items-center gap-2"><Upload size={16}/> CSV 업로드<input type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} /></label>
          </div>
          <textarea value={rawTranscript} onChange={e => setRawTranscript(e.target.value)} className="w-full h-48 bg-slate-950 border border-slate-700 rounded-2xl p-5 text-sm font-mono text-slate-300 outline-none focus:border-blue-500 mb-6 shadow-inner" placeholder="이곳에 텍스트를 직접 복사해서 붙여넣어도 됩니다..."></textarea>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-xs font-bold text-emerald-400">{status}</span>
            <button onClick={handleInject} className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-black text-sm active:scale-95 shadow-lg transition-all flex items-center gap-2"><Database size={18}/> 전술 좌표(Vector) 주입</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 3. 설계사 전술 대시보드 (훈련 및 실전 모드)
// ------------------------------------------------------------------
function AgentDashboard({ sessionProfile }) {
  const [currentMode, setCurrentMode] = useState('menu'); 
  const [toastMsg, setToastMsg] = useState('');
  
  // 훈련 로직 상태
  const [trainingStage, setTrainingStage] = useState(1);
  const [trainingInput, setTrainingInput] = useState('');
  const [trainingFeedback, setTrainingFeedback] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [scenarioIndices, setScenarioIndices] = useState([0,0,0,0,0]);

  // 실전 로직 상태
  const [actualInput, setActualInput] = useState('');
  const [actualFeedback, setActualFeedback] = useState(null); 
  const [feedbackSent, setFeedbackSent] = useState(false);

  // 훈련 5단계 x 10개 시나리오
  const scenarioDB = {
    1: ["[시스템: 뱅크샐러드 유입] 고객이 5분째 침묵 중입니다.", "[시스템: 카카오페이 유입] 점검 리포트 확인 후 진입했습니다.", "고객: 암보험 5천만원 맞추면 월 얼마 정도 하나요?", "고객: 보험료가 너무 많이 나와서 줄여보고 싶어요.", "[시스템: 보맵 유입] 부족한 보장 채우기 추천 요청입니다.", "고객: 기존 보험 해지하고 새로 하고 싶어요.", "고객: 실비 청구 하려고 왔는데 분석도 가능한가요?", "[시스템: 유료 상담 결제] 고객이 패키지 구매 후 대기 중입니다.", "고객: 지인 추천 받고 들어왔습니다.", "고객: 가입된 건 많은데 정작 보장 받을 게 없다고 나옵니다."],
    2: ["데이터: CI 종신 월 25만원. 10년차. 주계약만 있음.", "데이터: 3세대 실손이 건강보험에 묶여 있음. 암 1천 부족.", "데이터: 모든 만기 60세 설정됨. 고객 나이 55세.", "데이터: 건강보험 5건 전부 3년 갱신형. 월 45만.", "데이터: 사망 목적 아닌데 종신만 3건 가입됨. 저축 오인.", "데이터: 진단비 없는 '입원/수술비 전용'만 유지 중.", "데이터: 1세대 실비 유지 중이나 월 18만원 부담.", "데이터: 무해지형 보험의 해지 환급금 0원 리스크 모름.", "데이터: 유병자 보험을 일반체보다 30% 비싸게 가입 중.", "데이터: 가입 내역상 '뇌출혈' 담보만 있어 범위 좁음."],
    3: ["고객: '영끌 대출 이자 때문에 5만원도 사치인 것 같아요.'", "고객: '지금까지 낸 돈이 너무 아까워요. 해지 못해요.'", "고객: '갱신형은 나중에 비싸지잖아요. 무조건 비갱신 할래요.'", "고객: '심사 본다고 해서 가입해야 하는 건 아니죠? 부담돼요.'", "고객: '보장 알겠는데 가격만 딱 절반으로 깎아주세요.'", "고객: '지금 주식에 돈이 다 묶여 있어서 여윳돈 없어요.'", "고객: '보험은 나중에 아플 때 가입해도 되지 않나요?'", "고객: '다른 데서 물어보니까 훨씬 싸던데 여긴 왜 비싸요?'", "고객: '가족들이 보험은 다 사기라고 하지 말라네요.'", "고객: '카톡으로만 상담받는 게 좀 불안해요.'"],
    4: ["고객: '제안서 잘 봤고 남편이랑 상의 후 연락드릴게요.'", "고객: 'A사 말고 B사랑 C사 비교표 엑셀로 보내주세요.'", "고객: '이거 오늘 꼭 해야 하나요? 다음 달에 해도 되죠?'", "고객: '내용은 좋은데 가입 절차가 너무 복잡하네요.'", "고객: '상령일이 며칠 안 남았다고요? 차이가 얼마나 나죠?'", "고객: '운전 중이라 저녁에 다시 톡 드릴게요.'", "고객: '설계사님 믿고 하고 싶은데 사은품 없나요?'", "고객: '3개월 전에 위염 약 처방받은 거 고지해야 하나요?'", "고객: '보장 금액 2천만원만 더 높여서 다시 보여주세요.'", "고객: '고민이 좀 되네요. 내일 오전에 확답 드려도 될까요?'"],
    5: ["고객: '죄송해요. 아내가 지인한테 들기로 해서 취소할게요.'", "고객: '이전 관리하던 설계사가 특약 빼면 안 된다고 난리네요.'", "고객: '유튜브 보니까 이 상품보다 더 좋은 게 나왔다던데요?'", "고객: '다른 데서 더 싼 조건으로 방금 가입했습니다.'", "고객: '계약 직전인데 비대면 상담은 신뢰가 안 가네요.'", "현상: 고객이 제안서 확인 후 48시간째 읽씹 중입니다.", "고객: '보험 카페에서 이 설계 비효율적이라네요. 해지 안 해요.'", "고객: '부모님이 관리해주시기로 해서 제가 결정 못 해요.'", "고객: '좀 더 공부하고 비교해 본 다음에 직접 가입할게요.'", "고객: '보험료 납입 기간 바꾸면 너무 손해인 것 같아 안 할래요.'"]
  };

  const startTraining = () => {
    setScenarioIndices([
      Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)
    ]);
    setCurrentMode('training'); setTrainingStage(1); setTrainingInput(''); setTrainingFeedback('');
  };

  const submitTrainingResponse = () => {
    if(!trainingInput.trim()) return;
    setIsAiProcessing(true); setTrainingFeedback('');
    
    // 단순 모의 판정 로직 (향후 AI 연결)
    setTimeout(() => {
      setIsAiProcessing(false);
      const isPassed = Math.random() > 0.3; // 70% 확률로 임시 통과
      if (isPassed) {
        if (trainingStage < 5) {
          setTrainingStage(prev => prev + 1); setTrainingInput(''); setTrainingFeedback(`✅ [통과] 전술적 대응이 훌륭합니다. 다음 ${trainingStage + 1}단계로 진입합니다.`);
        } else {
          setTrainingFeedback(`🏆 [훈련 수료] 완벽합니다! 모든 관문을 통과했습니다. 지휘관에게 실전 권한 승인을 요청하십시오.`);
        }
      } else {
        setTrainingFeedback(`❌ [불합격] 해당 상황의 핵심 돌파 로직이 누락되었습니다. 다시 시도하십시오.`);
      }
    }, 1500);
  };

  const submitActualChat = async () => {
    if (!actualInput.trim()) return;
    setIsAiProcessing(true); setActualFeedback(null); setFeedbackSent(false);
    try {
      const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', WINNING_DATA_COLLECTION));
      let context = []; snap.forEach(doc => { if (doc.data().vector) context.push(doc.data()); });
      const res = await generateTacticalScript(actualInput, "ACTUAL", context);
      setActualFeedback({ text: res.text }); 
    } catch (e) { setActualFeedback({ text: "[서버 통신 장애] 텍스트를 불러올 수 없습니다." }); }
    finally { setIsAiProcessing(false); }
  };

  const handleReportSuccess = async (successStatus) => {
    if (!actualFeedback || feedbackSent) return;
    setFeedbackSent(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', POTENTIAL_SUCCESS_COLLECTION), {
        original_query: actualInput, winning_response: actualFeedback.text, agent_id: sessionProfile.gaiaId, status: successStatus, timestamp: new Date().toISOString()
      });
    } catch (e) { console.error(e); }
  };

  // ---------------- [ 훈련 시뮬레이터 렌더링 ] ----------------
  if (currentMode === 'training') {
    const currentScenarioText = scenarioDB[trainingStage][scenarioIndices[trainingStage - 1]];
    return (
      <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden text-white">
        <div className="bg-slate-950 px-6 py-4 flex justify-between items-center z-10 shadow-lg border-b border-slate-800">
           <button onClick={() => setCurrentMode('menu')} className="text-xs font-bold text-slate-400 hover:text-white transition-colors">← 작전 목록 복귀</button>
           <h2 className="text-lg font-black text-amber-500 flex items-center gap-2"><Target size={20}/> 훈련 시뮬레이터 <span className="text-white ml-2">Phase {trainingStage}/5</span></h2>
           <div className="w-16"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
          <div className="max-w-2xl w-full flex flex-col h-full space-y-6">
            <div className="flex justify-between relative px-4 mt-4">
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-800 -z-10 -translate-y-1/2 rounded-full"></div>
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-lg ${step < trainingStage ? 'bg-amber-500 text-white' : step === trainingStage ? 'bg-slate-900 border-2 border-amber-500 text-amber-500 scale-110' : 'bg-slate-800 text-slate-500'}`}>{step}</div>
              ))}
            </div>
            
            <div className="flex flex-col gap-4 mt-8">
               <div className="flex items-start gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-black shadow-lg">AI</div>
                 <div className="p-4 rounded-2xl rounded-tl-none bg-slate-800 border border-slate-700 shadow-xl max-w-md">
                   <p className="text-sm leading-relaxed text-slate-200">{currentScenarioText}</p>
                 </div>
               </div>
               {trainingFeedback && (
                 <div className={`p-4 rounded-xl shadow-lg mt-4 text-center text-sm font-bold border ${trainingFeedback.includes('불합격') ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-emerald-900/30 text-emerald-400 border-emerald-800'}`}>
                   {trainingFeedback}
                 </div>
               )}
            </div>
            <div className="mt-auto bg-slate-800 p-3 rounded-2xl shadow-2xl flex gap-3 items-end border border-slate-700">
               <textarea value={trainingInput} onChange={(e) => setTrainingInput(e.target.value)} className="flex-1 max-h-32 min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none resize-none focus:border-amber-500 transition-colors" placeholder="상황을 타개할 최적의 스크립트 입력..."></textarea>
               <button onClick={submitTrainingResponse} disabled={isAiProcessing || !trainingInput.trim()} className={`h-11 px-6 rounded-xl font-black text-sm transition-all flex items-center justify-center ${isAiProcessing || !trainingInput.trim() ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-lg'}`}>{isAiProcessing ? '평가중..' : '전송'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- [ 실전 분석 모드 렌더링 ] ----------------
  if (currentMode === 'actual') {
    return (
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        <div className="bg-white border-b px-10 py-5 flex justify-between items-center shadow-sm">
          <button onClick={() => setCurrentMode('menu')} className="text-xs font-black text-slate-400 hover:text-slate-900 transition-all">← 작전 목록 복귀</button>
          <h2 className="text-xl font-black flex items-center gap-3"><Activity className="text-blue-600" size={24}/> 실전 스크립트 렌더링 (RAG)</h2>
          <div className="w-20"></div>
        </div>
        <div className="flex-1 p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[3rem] border shadow-xl flex flex-col h-[600px]">
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><MessageSquare size={20} className="text-slate-400"/> 1. 고객 거절 문구 입력</h3>
              <textarea value={actualInput} onChange={e => setActualInput(e.target.value)} className="w-full flex-1 bg-slate-50 border-none rounded-[2rem] p-8 text-sm outline-none focus:bg-slate-100 transition-all shadow-inner font-medium resize-none" placeholder="고객의 카톡 텍스트를 그대로 복사해서 붙여넣으십시오..." />
              <button onClick={submitActualChat} disabled={isAiProcessing || !actualInput.trim()} className="w-full py-5 rounded-2xl font-black text-white mt-6 transition-all shadow-lg bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-slate-300">{isAiProcessing ? '지식 DB 검색 및 분석 중...' : '돌파 스크립트 추출'}</button>
            </div>
            <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col h-[600px] relative overflow-hidden">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-4 z-10"><Zap className="text-emerald-400" size={28}/> AI 생성 전술</h3>
              <div className="flex-1 relative z-10 flex flex-col">
                {actualFeedback ? (
                  <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-[2rem] p-8 mb-6 overflow-y-auto shadow-inner"><p className="text-sm leading-loose whitespace-pre-wrap text-slate-300">{actualFeedback.text}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => handleReportSuccess('SUCCESS')} disabled={feedbackSent} className={`py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${feedbackSent ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>{feedbackSent ? '보고 완료' : <><Star size={18}/> 🎯 타격 성공 보고</>}</button>
                      <button onClick={() => handleReportSuccess('FAIL')} disabled={feedbackSent} className="py-4 rounded-xl font-black text-sm bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700">💀 거절당함 (오답노트)</button>
                    </div>
                  </div>
                ) : ( <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-30"><Brain size={100} className="mb-6"/><p className="text-lg font-black uppercase tracking-[0.2em]">Ready for Generation</p></div> )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- [ 요원 대시보드 메뉴 (초기화면) ] ----------------
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 relative font-sans text-slate-900">
      {toastMsg && <div className="absolute top-8 bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-2xl z-50 animate-bounce">{toastMsg}</div>}
      <div className="max-w-5xl w-full text-center space-y-16">
        <h2 className="text-5xl font-black tracking-tight text-slate-900">전술 작전 개시</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
          
          <div className="bg-white p-12 rounded-[3rem] border shadow-xl flex flex-col">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6"><Target size={32}/></div>
            <h3 className="text-3xl font-black mb-4">훈련 시뮬레이터</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-10 flex-1">지휘관의 50개 하드코어 시나리오 무작위 돌파. 5단계를 모두 통과해야 실전 투입이 가능합니다.</p>
            <button onClick={startTraining} className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-amber-600 active:scale-95 transition-all">훈련 가동 시작 →</button>
          </div>

          <div className={`bg-white p-12 rounded-[3rem] border shadow-xl flex flex-col relative overflow-hidden transition-all ${(sessionProfile.hasPassedTraining || sessionProfile.isAdmin) ? '' : 'opacity-70'}`}>
            {(!sessionProfile.hasPassedTraining && !sessionProfile.isAdmin) && (
              <div className="absolute top-0 left-0 w-full h-full bg-slate-100/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                <Lock size={48} className="text-slate-400 mb-4"/>
                <p className="font-black text-slate-500">기초 훈련 수료 및 지휘관 승인 필요</p>
              </div>
            )}
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><Zap size={32}/></div>
            <h3 className="text-3xl font-black mb-4">실전 분석 및 진화</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-10 flex-1">현장 거절 텍스트를 입력하면 AI가 지휘관의 Core SOP를 검색하여 최적의 돌파구를 즉시 렌더링합니다.</p>
            <button onClick={() => setCurrentMode('actual')} disabled={!sessionProfile.hasPassedTraining && !sessionProfile.isAdmin} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all">실전 전술 가동 →</button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 4. 메인 컴포넌트 라우팅
// ------------------------------------------------------------------
export default function App() {
  const [sessionProfile, setSessionProfile] = useState(null);
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

  if (isAuthChecking) return <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center"><div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-8"></div></div>;
  if (!sessionProfile) return <AuthScreen onLogin={handleLogin} onSignUp={handleSignUp} />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <header className="bg-white px-8 py-5 border-b flex justify-between items-center shadow-sm z-50 shrink-0 relative">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md ${sessionProfile.isAdmin ? 'bg-red-600' : 'bg-blue-600'}`}>TP</div>
          <h1 className="text-xl font-black text-slate-900 tracking-tighter">Talk Plan OS</h1>
        </div>
        {sessionProfile.isAdmin && (
          <div className="absolute left-1/2 -translate-x-1/2 bg-slate-100 p-1.5 rounded-2xl border flex shadow-inner">
            <button onClick={() => setAdminViewMode('command')} className={`px-10 py-2.5 text-xs font-black rounded-xl transition-all ${adminViewMode === 'command' ? 'bg-white shadow text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>지휘관 통제소</button>
            <button onClick={() => setAdminViewMode('agent')} className={`px-10 py-2.5 text-xs font-black rounded-xl transition-all ${adminViewMode === 'agent' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>현장 대시보드</button>
          </div>
        )}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className={`text-[10px] font-black uppercase tracking-widest ${sessionProfile.isAdmin ? 'text-red-500' : 'text-blue-600'}`}>{sessionProfile.isAdmin ? 'Commander Center' : 'Field Operator'}</p>
            <p className="text-sm font-bold text-slate-600">{sessionProfile.name}</p>
          </div>
          <button onClick={() => {sessionStorage.clear(); window.location.reload();}} className="text-slate-400 hover:text-red-600 transition-all p-2 rounded-xl hover:bg-red-50"><LogOut size={24}/></button>
        </div>
      </header>
      {(sessionProfile.isAdmin && adminViewMode === 'command') ? <AdminDashboard /> : <AgentDashboard sessionProfile={sessionProfile} />}
    </div>
  );
}