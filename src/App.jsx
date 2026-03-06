import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, updateDoc, addDoc, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  Brain, Shield, Zap, User, Lock, LogOut, 
  CheckCircle, Upload, Database, Activity, Target, AlertCircle, ArrowRight, MessageSquare
} from 'lucide-react';

// ------------------------------------------------------------------
// 🚨 [방어선 1] 시스템 초기화 및 하드코딩된 환경 변수 연동
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCZcl_uJxBTvkQpaMt2lCXCm7EKwNaiYkM",
  authDomain: "talkplan-os.firebaseapp.com",
  projectId: "talkplan-os",
  storageBucket: "talkplan-os.firebasestorage.app",
  messagingSenderId: "956840217394",
  appId: "1:956840217394:web:7cba16e3a04824ee2f252b"
};

const rawAppId = typeof __app_id !== 'undefined' ? String(__app_id) : 'talkplan-os-default';
const appId = rawAppId.replace(/[\/.]/g, '_'); 

let app, auth, db, functions;

try {
  app = initializeApp(firebaseConfig); 
  auth = getAuth(app); 
  db = getFirestore(app);
  functions = getFunctions(app);
} catch (error) { 
  console.error("Firebase 초기화 치명적 에러:", error); 
}

const MASTER_ADMIN_ID = "21030003"; 
const MASTER_ADMIN_PW = "admin777"; 
const DB_COLLECTION = 'user_profiles';
const WINNING_DATA_COLLECTION = 'winning_scripts'; 

// ------------------------------------------------------------------
// 🧠 [초거대 AI 엔진] 클라우드 백엔드 연동
// ------------------------------------------------------------------
const generateTacticalScript = async (userQuery, modeType, contextData = []) => {
  if (!app) return { text: "[시스템 마비] Firebase 앱이 초기화되지 않았습니다.", matches: [] };

  try {
    const generateTactic = httpsCallable(functions, 'generateTacticAI');
    const response = await generateTactic({ userQuery, modeType, contextData });
    return {
      text: response.data.text || "[오류] 백엔드 서버가 빈 응답을 반환했습니다.",
      matches: response.data.matches || []
    };
  } catch (err) {
    console.error("Backend Call Error:", err);
    return { text: `[서버 통신 장애] 클라우드 벙커와 연결되지 않았습니다. 상세: ${err.message}`, matches: [] }; 
  }
};

// ------------------------------------------------------------------
// 1. 인증 화면 (AuthScreen)
// ------------------------------------------------------------------
function AuthScreen({ onLogin, onSignUp, isAuthReady }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [mode, setMode] = useState('login');
  const [localId, setLocalId] = useState(''); 
  const [localPw, setLocalPw] = useState('');
  const [localPwConfirm, setLocalPwConfirm] = useState(''); 
  const [localName, setLocalName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setAuthError(''); 
    setAuthSuccess('');
    
    if (!isAuthReady) {
      setAuthError('시스템 통신망(Firebase)이 아직 준비되지 않았습니다. 잠시 후 다시 시도하십시오.');
      return;
    }

    setIsLoading(true);

    try {
      if (isAdminMode) { 
        const err = await onLogin({ gaiaId: localId.trim(), password: localPw.trim(), isMasterAttempt: true }); 
        if (err) setAuthError(err);
      } else if (mode === 'signup') {
        if (localPw !== localPwConfirm) { 
          setAuthError('비밀번호가 일치하지 않습니다.'); 
          setIsLoading(false);
          return; 
        }
        
        const response = await onSignUp({ gaiaId: localId.trim(), password: localPw.trim(), userName: localName.trim() });
        
        if (response.success) {
          setAuthSuccess(response.msg);
          setLocalId(''); setLocalPw(''); setLocalPwConfirm(''); setLocalName('');
          setTimeout(() => {
            setMode('login');
            setAuthSuccess('');
          }, 3000);
        } else {
          setAuthError(response.msg);
        }
      } else { 
        const err = await onLogin({ gaiaId: localId.trim(), password: localPw.trim() }); 
        if (err) setAuthError(err);
      }
    } catch (err) {
      setAuthError("통신 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        {isAdminMode && <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600 animate-pulse"></div>}
        
        <div className="flex flex-col items-center mb-10 z-10 relative">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg text-white ${isAdminMode ? 'bg-red-600 shadow-red-900/40' : 'bg-blue-600 shadow-blue-900/40'}`}>
            <Shield size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">TALK PLAN OS</h1>
          <p className="text-slate-500 mt-2 font-medium tracking-widest text-xs uppercase">{isAdminMode ? 'Command Center' : 'Tactical Interface'}</p>
        </div>
        
        <form className="space-y-4 relative z-10" onSubmit={handleSubmit}>
          {!isAdminMode && mode === 'signup' && (
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-500" size={20} />
              <input type="text" placeholder="성함 입력" required disabled={isLoading} value={localName} onChange={e => setLocalName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-600 transition-all disabled:opacity-50" />
            </div>
          )}
          <div className="relative">
            <User className="absolute left-4 top-4 text-slate-500" size={20} />
            <input type="text" placeholder={isAdminMode ? "Master ID" : "가이아 사번 8자리"} required disabled={isLoading} value={localId} onChange={e => setLocalId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-600 transition-all font-mono disabled:opacity-50" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
            <input type={showPw ? "text" : "password"} placeholder="비밀번호" required disabled={isLoading} value={localPw} onChange={e => setLocalPw(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-14 text-white outline-none focus:border-blue-600 transition-all font-mono disabled:opacity-50" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-4 text-xs font-bold text-slate-500 hover:text-blue-400">{showPw ? "HIDE" : "SHOW"}</button>
          </div>
          {mode === 'signup' && !isAdminMode && (
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
              <input type="password" placeholder="비밀번호 재입력" required disabled={isLoading} value={localPwConfirm} onChange={e => setLocalPwConfirm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-600 transition-all font-mono disabled:opacity-50" />
            </div>
          )}
          
          {authError && <p className="text-red-500 text-xs font-bold text-center bg-red-900/30 py-2 rounded-lg border border-red-800/50">{authError}</p>}
          {authSuccess && <p className="text-emerald-400 text-xs font-bold text-center bg-emerald-900/30 py-2 rounded-lg border border-emerald-800/50 animate-pulse">{authSuccess}</p>}
          
          <button type="submit" disabled={isLoading || !isAuthReady} className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-[0.98] ${isAdminMode ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'} disabled:opacity-50 disabled:cursor-not-allowed mt-2`}>
            {isLoading || !isAuthReady ? '통신망 접속 중...' : (isAdminMode ? '시스템 통제권 확보' : (mode === 'login' ? '시스템 진입' : '권한 승인 요청'))}
          </button>
        </form>

        <div className="mt-8 text-center flex flex-col gap-3 relative z-10">
          {!isAdminMode && (
            <button onClick={() => {setMode(mode === 'login' ? 'signup' : 'login'); setAuthError(''); setAuthSuccess('');}} className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-4">
              {mode === 'login' ? '신규 설계사 권한 요청' : '기존 설계사 로그인'}
            </button>
          )}
          <button onClick={() => {setIsAdminMode(!isAdminMode); setAuthError(''); setAuthSuccess(''); setMode('login');}} className="text-[10px] text-slate-600 mt-2 hover:text-slate-400 transition-colors uppercase font-bold">
            [ Toggle Command Center Auth ]
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 2. 지휘관 통제실 (AdminDashboard) - 🚨 구조 복구 완료
// ------------------------------------------------------------------
function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [dbError, setDbError] = useState(''); 
  const [rawTranscript, setRawTranscript] = useState(''); 
  const [injectStatus, setInjectStatus] = useState('');

  useEffect(() => {
    if (!db) {
      setDbError("로컬 DB 인스턴스가 존재하지 않습니다.");
      return;
    }
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION);
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const userList = [];
      snapshot.forEach((doc) => { userList.push({ id: doc.id, ...doc.data() }); });
      userList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setUsers(userList);
      setDbError('');
    }, (error) => {
      console.error("Firestore Admin Error:", error);
      setDbError("DB 연동 실패: Firebase 설정 또는 권한 문제가 발생했습니다.");
    });
    return () => unsubscribe();
  }, []);

  const toggleApproval = async (userId, currentStatus) => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION, userId), { isApproved: !currentStatus }); } 
    catch (e) { console.error('승인 상태 변경 실패', e); }
  };
  const toggleTrainingPass = async (userId, currentStatus) => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION, userId), { hasPassedTraining: !currentStatus }); } 
    catch (e) { console.error('훈련 수료 상태 변경 실패', e); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setInjectStatus('파일 데이터 추출 중...');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setRawTranscript(prev => prev ? prev + '\n\n[신규 파일 추가됨]\n' + text : text);
      setInjectStatus(`✅ 파일 로드 완료: ${file.name}`);
    };
    reader.onerror = () => setInjectStatus('❌ 파일 읽기 실패');
    reader.readAsText(file, "UTF-8"); 
  };

  const handleInjectTactic = async () => {
    if (!rawTranscript.trim()) { setInjectStatus("주입할 데이터가 없습니다."); return; }
    setInjectStatus("🧠 AI가 전술 좌표(Vector) 계산 및 DB 전송 중...");
    
    try {
      const injectVector = httpsCallable(functions, 'injectVectorData');
      const vecResult = await injectVector({ text: rawTranscript });
      const vectorValue = vecResult.data.vector;

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', WINNING_DATA_COLLECTION), {
        raw_transcript: rawTranscript,
        vector: vectorValue, 
        agentId: "COMMANDER_MANUAL_INJECT",
        timestamp: new Date().toISOString()
      });
      
      setInjectStatus("✅ 벡터 좌표 생성 및 성공 대화록 시스템 흡수 완료.");
      setRawTranscript('');
      setTimeout(() => setInjectStatus(''), 4000);
    } catch (e) {
      setInjectStatus("❌ 주입 실패: " + e.message);
    }
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">지휘관 통제소 (Command Center)</h2>
              <p className="text-sm text-slate-500 font-bold mt-1">설계사 권한 통제 및 전술 지식 베이스 관리</p>
            </div>
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-black text-sm border border-red-200 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div> MASTER OVERRIDE ACTIVE
            </div>
          </div>
          
          {dbError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-4 rounded-xl mb-6 font-bold shadow-sm flex items-center gap-3">
              <AlertCircle size={20} />
              <div>
                ⚠️ {dbError} <br />
                <span className="text-xs font-normal">파이어베이스 설정(.env 하드코딩)을 다시 확인하십시오.</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <User className="text-blue-600" size={24}/>
              <h3 className="text-xl font-black text-slate-800">요원 접근 제어</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                  <th className="p-4 pl-6">가이아 사번</th> 
                  <th className="p-4">성함</th> 
                  <th className="p-4 text-center">시스템 접근 승인</th>
                  <th className="p-4 text-center">기초 훈련 수료 (실전 권한)</th> 
                  <th className="p-4 pr-6">가입 일자</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-800 font-medium">
                {users.map(user => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 pl-6 font-mono font-bold text-slate-600">{user.gaiaId}</td> 
                    <td className="p-4 font-bold">{user.name}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => toggleApproval(user.id, user.isApproved)} className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all active:scale-95 ${user.isApproved ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                        {user.isApproved ? '승인됨 (차단)' : '대기중 (승인)'}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => toggleTrainingPass(user.id, user.hasPassedTraining)} disabled={!user.isApproved} className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all active:scale-95 ${!user.isApproved ? 'opacity-30 cursor-not-allowed bg-slate-100' : (user.hasPassedTraining ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-amber-100 text-amber-700 border border-amber-200')}`}>
                        {user.hasPassedTraining ? '수료 완료 (실전 허용)' : '미수료 (훈련만 가능)'}
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-[10px] text-slate-400 font-mono tracking-tighter">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
                {users.length === 0 && !dbError && (<tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">등록된 요원이 없습니다.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 border border-slate-800 overflow-hidden p-8 relative text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-3xl pointer-events-none rounded-full"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h3 className="text-2xl font-black flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50"><Brain size={24}/></div>
                전술 교리 주입기 (Vector DB)
              </h3>
              <p className="text-sm text-slate-400 mt-2 font-medium">조직의 성공 사례(CSV/Text)를 주입하여 AI의 수학적 좌표를 업데이트합니다.</p>
            </div>
            
            <label className="bg-slate-800 border border-slate-700 px-5 py-3 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-700 transition-all text-slate-200 shadow-md flex items-center gap-2 active:scale-95">
              <Upload size={16}/> CSV 파일 업로드
              <input type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <textarea 
            value={rawTranscript}
            onChange={(e) => setRawTranscript(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl p-5 text-sm text-slate-300 outline-none focus:border-blue-500 transition-all h-48 resize-y font-mono leading-relaxed mb-4 relative z-10 shadow-inner"
            placeholder="[성공 사례 직접 입력]&#13;&#10;고객 거절: 보험료가 너무 비싸서 유지가 힘들 것 같아요.&#13;&#10;나의 전술: 고객님, 당장 비용이 부담되시는 마음 충분히 이해합니다. 하지만 지금 월 5만 원을 아끼려다...&#13;&#10;..."
          />
            
          <div className="flex items-center justify-between relative z-10">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${injectStatus.includes('✅') ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : injectStatus.includes('❌') ? 'bg-red-900/30 text-red-400 border border-red-800/50' : injectStatus ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50 animate-pulse' : ''}`}>
              {injectStatus}
            </span>
            <button 
              onClick={handleInjectTactic}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-blue-900/40 flex items-center gap-2"
            >
              <Database size={18}/> 전술 좌표(Vector) 주입
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 6. 헬퍼 컴포넌트: 통계 카드 (StatCard) - 🚨 올바른 위치로 분리 완료
// ------------------------------------------------------------------
function StatCard({ iconType, label, value, color }) {
  const colors = { blue: 'text-blue-600 bg-blue-50', orange: 'text-orange-600 bg-orange-50', slate: 'text-slate-600 bg-slate-100' };
  
  const renderIcon = () => {
    if (iconType === 'zap') return <Zap size={20} />;
    if (iconType === 'activity') return <Activity size={20} />;
    if (iconType === 'database') return <Database size={20} />;
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
        {renderIcon()}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 3. 설계사 전술 대시보드 (AgentDashboard) 
// ------------------------------------------------------------------
function AgentDashboard({ sessionProfile }) {
  const [currentMode, setCurrentMode] = useState('menu'); 
  const [toastMsg, setToastMsg] = useState('');
  
  // 훈련 모드 상태
  const [trainingStage, setTrainingStage] = useState(1);
  const [maxUnlockedStage, setMaxUnlockedStage] = useState(1); 
  const [trainingInput, setTrainingInput] = useState('');
  const [trainingFeedback, setTrainingFeedback] = useState('');
  const [isStagePassed, setIsStagePassed] = useState(false); 
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [scenarioIndices, setScenarioIndices] = useState([0,0,0,0,0]);

  // 실전 모드(벡터 검색) 상태
  const [actualInput, setActualInput] = useState('');
  const [actualFeedback, setActualFeedback] = useState(null); 
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [vectorMatches, setVectorMatches] = useState([]); 

  const stageTitles = [
    "1단계: 상담방 생성 후 첫 대응",
    "2단계: 니즈 환기 및 문제 제기",
    "3단계: 1차 거절(비용/우선순위) 극복",
    "4단계: 솔루션 제시 및 클로징 유도",
    "5단계: 하드코어 거절(변심/지인) 돌파"
  ];

  const scenarioDB = {
    1: [
      "[시스템 알림: 뱅크샐러드 유입] 고객이 입장했으나 챗봇 메뉴를 누르지 않고 5분째 침묵 중입니다.",
      "[시스템 알림: 카카오페이 유입] 고객이 '내 보험 점검' 리포트를 확인하고 상담방에 진입했습니다.",
      "고객 채팅: 보맵에서 보고 왔는데, 암보험 5천만원 맞추면 월 얼마 정도 하나요?",
      "고객 채팅: 보험료가 너무 많이 나오는 것 같아서 줄여보고 싶어요.",
      "[시스템 알림: 보맵 유입] 고객이 '부족한 보장 채우기'를 통해 추천 설계를 요청했습니다.",
      "고객 채팅: 상담원 연결 부탁드립니다. 기존 보험 해지하고 새로 하고 싶어서요.",
      "고객 채팅: 실비 청구 하려고 들어왔는데, 보장 분석도 같이 해주실 수 있나요?",
      "[시스템 알림: 유료 상담 결제] 고객이 심층 보장 분석 패키지를 구매하고 대기 중입니다.",
      "고객 채팅: 주변 지인이 여기서 점검받았다고 해서 추천받고 들어왔습니다.",
      "고객 채팅: 가입된 건 많은데 정작 아플 때 받을 게 없다고 나와서 문의합니다."
    ],
    2: [
      "데이터: CI 종신보험 월 25만원 유지 중. 주계약 1억, 특약 없음. 가입 10년차.",
      "데이터: 3세대 실손이 건강보험과 묶여 있음. 암 진단비는 1천만원으로 매우 부족.",
      "데이터: 모든 보장 만기가 60세로 설정됨. 고객 현재 나이 55세.",
      "데이터: 건강보험 5건이 모두 3년 갱신형. 현재 총 납입액 월 45만원.",
      "데이터: 사망 보장 목적이 아닌데 종신보험만 3건 가입됨. 저축으로 오인 중.",
      "데이터: 주요 진단비(암, 뇌, 심장)가 아예 없는 '입원/수술비 전용' 보험만 유지 중.",
      "데이터: 1세대 실비 유지 중이나 보험료가 월 18만원까지 치솟아 부담을 느낌.",
      "데이터: 무해지형 보험이나 납입 기간 중 해지 환급금 0원에 대해 전혀 모름.",
      "데이터: 유병자 보험을 일반체보다 30% 비싸게 가입함. 현재 건강 상태는 완치 수준.",
      "데이터: 가입 내역 스캔 결과, 뇌출혈 담보만 있어 실제 보장 범위가 매우 좁음."
    ],
    3: [
      "고객 채팅: '영끌해서 대출 이자 내기도 바빠요. 5만원도 지금은 사치인 것 같아요.'",
      "고객 채팅: '지금까지 낸 돈이 너무 아까워요. 해지하면 돌려받는 돈도 거의 없잖아요.'",
      "고객 채팅: '갱신형은 나중에 비싸진다면서요? 전 무조건 비갱신 아니면 안 할래요.'",
      "고객 채팅: '심사 본다고 해서 무조건 가입해야 하는 건 아니죠? 부담스러워서요.'",
      "고객 채팅: '보장 내용은 알겠는데, 가격만 딱 절반으로 깎아서 다시 짜주시면 안 되나요?'",
      "고객 채팅: '지금 주식에 돈이 다 묶여 있어서 여윳돈이 생기면 그때 다시 연락할게요.'",
      "고객 채팅: '솔직히 보험은 나중에 아플 때 가입해도 늦지 않은 거 아닌가요?'",
      "고객 채팅: '다른 데서 물어보니까 이거보다 훨씬 싸게 된다던데 왜 여긴 비싼가요?'",
      "고객 채팅: '가족들이 보험은 다 사기라고 하지 말라고 하네요. 일단 보류할게요.'",
      "고객 채팅: '카톡으로만 상담받는 게 좀 불안하네요. 얼굴 보고 할 수 있는 분 없나요?'"
    ],
    4: [
      "고객 채팅: '제안서는 잘 봤습니다. 일단 주말에 남편이랑 상의해보고 담주에 연락드릴게요.'",
      "고객 채팅: 'A사 말고 B사랑 C사 비교표도 엑셀로 정리해서 보내주실 수 있나요?'",
      "고객 채팅: '이거 오늘 당장 가입해야 하나요? 다음 달에 해도 조건은 똑같은 거죠?'",
      "고객 채팅: '내용은 좋은데 가입 절차가 너무 복잡하네요. 나중에 안 바쁠 때 할게요.'",
      "고객 채팅: '상령일이 며칠 안 남았다고요? 하루 차이로 보험료가 얼마나 차이 나나요?'",
      "고객 채팅: '가입 의사는 있는데, 제가 지금 운전 중이라 저녁에 다시 톡 드릴게요.'",
      "고객 채팅: '설계사님 믿고 진행하고 싶은데, 뭐 사은품 같은 건 따로 없나요?'",
      "고객 채팅: '아 제가 깜빡했는데, 3개월 전에 위염으로 약 처방받은 거 고지해야 하나요?'",
      "고객 채팅: '괜찮은 것 같네요. 근데 보장 금액을 2천만원만 더 높여서 다시 보여주세요.'",
      "고객 채팅: '고민이 좀 되네요. 내일 오전 중에 제가 다시 확답 드려도 될까요?'"
    ],
    5: [
      "고객 채팅: '설계사님 죄송해요. 아내가 지인한테 들기로 했다고 해서 취소해야겠어요.'",
      "고객 채팅: '이전 관리하던 설계사가 이 특약은 절대 빼면 안 된다고 난리네요.'",
      "고객 채팅: '유튜브 찾아보니까 이 상품보다 더 좋은 게 나왔다고 하던데 확인 좀 해주세요.'",
      "고객 채팅: '다른 데서 더 싼 조건으로 방금 가입 완료했습니다. 고생하셨어요.'",
      "고객 채팅: '(계약 직전 돌연) 아무리 생각해도 비대면 상담은 신뢰가 안 가네요.'",
      "현상: 고객이 제안서를 확인하고 48시간째 '읽씹' 상태로 답변이 없습니다.",
      "고객 채팅: '보험 카페에 물어봤더니 이 설계는 비효율적이라고 하네요. 해지 안 하려고요.'",
      "고객 채팅: '부모님이 관리해주시기로 해서 제가 직접 결정하기 힘들게 됐습니다.'",
      "고객 채팅: '상담은 감사한데, 제가 좀 더 공부하고 비교해 본 다음에 직접 가입할게요.'",
      "고객 채팅: '보험료 납입 기간을 20년에서 30년으로 바꾸면 너무 손해인 것 같아서 안 할래요.'"
    ]
  };

  const handleActualClick = () => {
    if (!sessionProfile.isAdmin && !sessionProfile.hasPassedTraining) {
      setToastMsg("지휘관의 기초 훈련 수료 승인이 필요합니다."); 
      setTimeout(() => setToastMsg(''), 3000); 
      return;
    }
    setCurrentMode('actual');
  };

  const startTraining = () => {
    const indices = [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10)
    ];
    setScenarioIndices(indices);
    setCurrentMode('training');
    setTrainingStage(1);
    setMaxUnlockedStage(1);
    setTrainingFeedback('');
    setTrainingInput('');
    setIsStagePassed(false);
  };

  const submitTrainingResponse = async () => {
    if(!trainingInput.trim()) return;
    setIsAiProcessing(true);
    setTrainingFeedback('');
    setIsStagePassed(false); 
    
    try {
      const currentScenario = scenarioDB[trainingStage][scenarioIndices[trainingStage - 1]];
      const contextData = { stage: stageTitles[trainingStage - 1], scenario: currentScenario, agentInput: trainingInput };
      
      const response = await generateTacticalScript("", "TRAINING", contextData);
      setTrainingFeedback(response.text);

      if (response.text.includes('[합격]')) {
        setIsStagePassed(true); 
        setMaxUnlockedStage(prev => Math.max(prev, trainingStage + 1));
      }
    } catch (e) {
      setTrainingFeedback("[오류] AI 통신 실패. 백엔드 서버를 확인하십시오.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleNextStage = () => {
    if (trainingStage < 5) {
      setTrainingStage(prev => prev + 1); 
      setTrainingInput('');
      setTrainingFeedback('');
      setIsStagePassed(false); 
    } else {
      setToastMsg('기초 훈련 5단계를 모두 수료했습니다. 지휘관에게 실전 권한을 요청하십시오.');
      setTimeout(() => setToastMsg(''), 3000);
      setCurrentMode('menu');
    }
  };

  const handleNavClick = (step) => {
    if (step > maxUnlockedStage) return;
    setTrainingStage(step);
    setTrainingInput('');
    setTrainingFeedback('');
    setIsStagePassed(false);
  };
  
  const submitActualChat = async () => {
      if (!actualInput.trim()) return;
      setIsAiProcessing(true); 
      setActualFeedback(null); 
      setFeedbackGiven(false);
      setVectorMatches([]);
      
      try {
        const collRef = collection(db, 'artifacts', appId, 'public', 'data', WINNING_DATA_COLLECTION);
        const snapshot = await getDocs(collRef);
        let fetchedData = [];
        snapshot.forEach(doc => {
          const d = doc.data();
          if (d.vector && Array.isArray(d.vector)) {
            fetchedData.push(d); 
          }
        });
        
        if (fetchedData.length === 0) {
          setActualFeedback({ type: 'warning', title: '경고: 지식 데이터베이스 부족', text: '서버에 주입된 벡터 좌표(성공 사례)가 없습니다. 지휘관 통제소에서 전술을 주입하십시오.' });
          setIsAiProcessing(false);
          return;
        }

        const response = await generateTacticalScript(actualInput, "ACTUAL", fetchedData);
        
        setActualFeedback({
            type: 'success', 
            title: 'AI 전술 스크립트 도출 완료',
            text: response.text
        });
        
        if (response.matches) {
          setVectorMatches(response.matches);
        }

      } catch (e) {
        setActualFeedback({ type: 'warning', title: '시스템 오류', text: 'AI 서버 통신 실패: ' + e.message });
      } finally {
        setIsAiProcessing(false);
      }
  };

  const handleFeedback = (success) => {
    setFeedbackGiven(true);
  };

  if (currentMode === 'training') {
    const currentScenarioText = scenarioDB[trainingStage][scenarioIndices[trainingStage - 1]];

    return (
      <div className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden animate-in fade-in duration-500">
        <div className="bg-white px-6 py-4 flex justify-between items-center z-10 shadow-sm border-b border-slate-200">
           <button onClick={() => setCurrentMode('menu')} className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"><span className="text-lg leading-none mb-0.5">←</span> 작전 목록 복귀</button>
           <h2 className="text-lg font-black text-slate-800">훈련 시뮬레이터 <span className="text-amber-500 ml-2 bg-amber-50 px-2 py-0.5 rounded-md">Phase {trainingStage}/5</span></h2>
           <div className="w-20"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
          <div className="max-w-2xl w-full flex flex-col h-full">
            <div className="flex justify-between mb-8 relative px-2">
              <div className="absolute top-1/2 left-6 right-6 h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
              {[1, 2, 3, 4, 5].map((step) => (
                <button 
                  key={step} 
                  disabled={step > maxUnlockedStage}
                  onClick={() => handleNavClick(step)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all shadow-sm
                    ${step === trainingStage ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 scale-110' : 
                      step <= maxUnlockedStage ? 'bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50' : 
                      'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}`}
                >
                  {step}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col gap-6 pb-6">
               <div className="text-center">
                 <span className="bg-slate-800 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">{stageTitles[trainingStage - 1]} 시작</span>
               </div>
               
               <div className="flex items-start gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20"><Target size={20}/></div>
                 <div className="flex flex-col flex-1">
                   <span className="text-xs text-slate-500 font-bold mb-1.5 ml-1">상황 / 가상 고객</span>
                   <div className={`p-4 rounded-2xl rounded-tl-none shadow-sm border ${currentScenarioText.includes('[상황:') || currentScenarioText.includes('[시스템') ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'}`}>
                     <p className={`text-sm leading-relaxed font-medium ${currentScenarioText.includes('[상황:') || currentScenarioText.includes('[시스템') ? 'text-slate-600' : 'text-slate-800'}`}>
                        {currentScenarioText}
                     </p>
                   </div>
                 </div>
               </div>

               {trainingFeedback && (
                 <div className="flex justify-center mt-2 animate-in slide-in-from-bottom-4 duration-500">
                   <div className={`p-6 rounded-[2rem] shadow-xl w-full border ${trainingFeedback.includes('[불합격]') ? 'bg-white border-red-200' : 'bg-slate-900 border-slate-800 text-white'}`}>
                     <div className="flex items-center gap-2 mb-3">
                       {trainingFeedback.includes('[불합격]') ? <AlertCircle size={18} className="text-red-500"/> : <CheckCircle size={18} className="text-emerald-400"/>}
                       <span className={`text-xs font-black uppercase tracking-widest ${trainingFeedback.includes('[불합격]') ? 'text-red-600' : 'text-emerald-400'}`}>AI 판독 결과</span>
                     </div>
                     <p className={`font-bold text-sm leading-relaxed whitespace-pre-wrap ${trainingFeedback.includes('[불합격]') ? 'text-slate-700' : 'text-slate-200'}`}>
                       {trainingFeedback}
                     </p>
                     
                     {isStagePassed && (
                       <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
                         <button onClick={handleNextStage} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95">
                           {trainingStage < 5 ? '다음 단계로 진격' : '훈련 수료 및 복귀'} <ArrowRight size={16}/>
                         </button>
                       </div>
                     )}
                   </div>
                 </div>
               )}
            </div>

            <div className={`bg-white p-4 rounded-[2rem] shadow-xl flex flex-col gap-3 border transition-all ${isStagePassed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
               <textarea 
                  value={trainingInput}
                  onChange={(e) => setTrainingInput(e.target.value)}
                  disabled={isStagePassed}
                  className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm outline-none resize-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={isStagePassed ? "목표를 달성했습니다. 다음 단계로 이동하십시오." : "지휘관의 SOP를 상기하고 카톡/채팅 스크립트를 입력하십시오..."}
               ></textarea>
               <div className="flex justify-end">
                 <button 
                    onClick={submitTrainingResponse}
                    disabled={isAiProcessing || !trainingInput.trim() || isStagePassed}
                    className={`px-8 py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${isAiProcessing || !trainingInput.trim() || isStagePassed ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-black shadow-lg active:scale-95'}`}
                 >
                    {isAiProcessing ? <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin"></div> : <Brain size={18}/>}
                    {isAiProcessing ? 'AI 정밀 분석 중...' : '전술 스크립트 렌더링'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentMode === 'actual') {
    return (
      <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden animate-in fade-in duration-500">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
           <button onClick={() => {setCurrentMode('menu'); setActualFeedback(null); setActualInput(''); setVectorMatches([]);}} className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"><span className="text-lg leading-none mb-0.5">←</span> 작전 목록 복귀</button>
           <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
             <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
             실전 텍스트 분석 및 진화 엔진
           </h2>
           <div className="w-20"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 h-full">
              <div className="lg:col-span-5 flex flex-col gap-6 h-full">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 flex flex-col flex-1 shadow-sm">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600"><MessageSquare size={20}/></div>
                     <div>
                       <h3 className="text-base font-black text-slate-800">타겟 데이터 입력 (Target Data)</h3>
                       <p className="text-[10px] text-slate-500 font-medium">고객의 카톡 거절 문구를 그대로 붙여넣으십시오.</p>
                     </div>
                   </div>
                   
                   <textarea 
                      value={actualInput}
                      onChange={(e) => setActualInput(e.target.value)}
                      className="w-full flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-700 outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all resize-none mb-4 font-mono shadow-inner"
                      placeholder="[입력 예시] 보험료가 너무 비싸서 유지가 힘들 것 같아요. 다음에 할게요."
                   ></textarea>

                   <button 
                      onClick={submitActualChat}
                      disabled={isAiProcessing || !actualInput.trim()}
                      className={`w-full py-4.5 rounded-2xl font-black text-white transition-all shadow-lg flex justify-center items-center gap-2 h-14 ${isAiProcessing || !actualInput.trim() ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-black active:scale-[0.98] hover:shadow-xl'}`}
                   >
                      {isAiProcessing ? (
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                      ) : <><Brain size={18}/> SOP 기반 돌파 스크립트 렌더링</>}
                   </button>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col h-full gap-6">
                {vectorMatches.length > 0 && (
                  <div className="animate-in slide-in-from-right-8 duration-700">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3 pl-2">
                      <Database size={14} className="text-blue-500"/> Vector Search Engine Matches
                    </h4>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {vectorMatches.map((m, idx) => (
                        <div key={idx} className="min-w-[260px] max-w-[300px] bg-white border border-blue-100 p-4 rounded-2xl shadow-sm flex-shrink-0 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-slate-500">참고 사례 {idx + 1}</span>
                            <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
                              일치율 {(m.score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium">{m.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col flex-1 relative overflow-hidden shadow-2xl">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
                   
                   <div className="flex items-center gap-3 mb-6 z-10">
                     <div className="w-10 h-10 rounded-2xl bg-emerald-900/50 flex items-center justify-center text-emerald-400 shadow-inner border border-emerald-800/30">
                       <Zap size={20}/>
                     </div>
                     <div>
                       <h3 className="text-xl font-black text-white">AI 전술 스크립트</h3>
                       <p className="text-[10px] text-slate-400 mt-0.5">생성된 멘트를 복사하여 고객에게 전송하십시오.</p>
                     </div>
                   </div>

                   <div className="flex-1 flex flex-col relative z-10">
                      {!actualFeedback && !isAiProcessing && (
                        <div className="m-auto flex flex-col items-center justify-center text-slate-600">
                          <Brain size={48} className="mb-4 opacity-20" strokeWidth={1}/>
                          <p className="text-sm font-bold text-center">대기 중... 좌측에 타겟 텍스트를 입력하십시오.</p>
                        </div>
                      )}

                      {actualFeedback && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col h-full">
                          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-3xl p-6 mb-6 shadow-inner overflow-y-auto">
                            <p className="text-sm leading-loose whitespace-pre-wrap text-slate-200 font-medium">
                              {actualFeedback.text}
                            </p>
                          </div>
                          
                          <div className="mt-auto bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50">
                             <button onClick={() => alert('클립보드에 복사되었습니다. (실제 환경에서는 navigator.clipboard 적용)')} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-sm font-black text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 active:scale-[0.98] mb-4">
                               이 스크립트 복사하기
                             </button>

                             <div className="pt-4 border-t border-slate-700/50">
                               <p className="text-[10px] font-bold text-slate-400 text-center mb-3 uppercase tracking-widest">AI 자가 학습을 위한 실전 결과 보고</p>
                               <div className="flex gap-3">
                                 <button disabled={feedbackGiven} onClick={() => handleFeedback(true)} className="flex-1 py-3 bg-slate-800 border border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/40 rounded-xl text-xs font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                   🎯 타격 성공 (학습)
                                 </button>
                                 <button disabled={feedbackGiven} onClick={() => handleFeedback(false)} className="flex-1 py-3 bg-slate-800 border border-red-900/50 text-red-400 hover:bg-red-900/40 rounded-xl text-xs font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                   💀 거절당함
                                 </button>
                               </div>
                               {feedbackGiven && <p className="text-[10px] text-emerald-500 font-bold text-center mt-3 animate-pulse">DB 전송 완료. 시스템이 진화합니다.</p>}
                             </div>
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 relative">
      {toastMsg && (
        <div className="absolute top-8 bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-2xl z-50 animate-bounce">
          {toastMsg}
        </div>
      )}

      <div className="max-w-4xl w-full">
        <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">전술 작전 선택</h2>
        <p className="text-slate-500 text-center mb-12 font-bold">현재 상태에 맞는 작전을 선택하십시오.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden group flex flex-col h-full hover:border-amber-300 transition-colors cursor-pointer" onClick={startTraining}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex-1">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 transition-colors">
                <Target size={32}/>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">훈련 시뮬레이터</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">플랫폼 유입 고객의 다양한 초기 패턴에 대응하는 5단계 메신저 모의 상담을 진행합니다.</p>
            </div>
            <div className="mt-auto text-amber-600 font-black text-sm flex items-center gap-2 group-hover:translate-x-2 transition-transform">
              훈련 가동 <ArrowRight size={16}/>
            </div>
          </div>

          <div className={`bg-white p-8 rounded-3xl border shadow-xl relative overflow-hidden flex flex-col h-full transition-all ${(sessionProfile.hasPassedTraining || sessionProfile.isAdmin) ? 'border-slate-200 group hover:border-blue-300 cursor-pointer' : 'border-red-100 opacity-80 cursor-not-allowed grayscale'}`} onClick={handleActualClick}>
            {(!sessionProfile.hasPassedTraining && !sessionProfile.isAdmin) && (
              <div className="absolute top-6 right-6 bg-red-100 text-red-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-red-200 flex items-center gap-1 z-10 shadow-sm">
                <Lock size={12}/> LOCKED
              </div>
            )}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex-1">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${(sessionProfile.hasPassedTraining || sessionProfile.isAdmin) ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <Zap size={32}/>
              </div>
              <h3 className={`text-2xl font-black mb-3 ${(sessionProfile.hasPassedTraining || sessionProfile.isAdmin) ? 'text-slate-800' : 'text-slate-500'}`}>실전 채팅 분석 모드</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">고객의 실제 거절 문구를 입력하면, 중앙 Vector DB에 축적된 조직의 성공 사례를 바탕으로 돌파 스크립트를 추출합니다.</p>
            </div>
            <div className={`mt-auto relative z-10 flex items-center gap-2 font-black text-sm transition-transform ${(sessionProfile.hasPassedTraining || sessionProfile.isAdmin) ? 'text-blue-600 group-hover:translate-x-2' : 'text-slate-400'}`}>
              실전 가동 <ArrowRight size={16}/>
            </div>
            {(!sessionProfile.hasPassedTraining && !sessionProfile.isAdmin) && <div className="absolute inset-0 bg-white/40 z-0"></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 메인 어플리케이션 컴포넌트 (App)
// ------------------------------------------------------------------
export default function App() {
  const [sessionProfile, setSessionProfile] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [adminViewMode, setAdminViewMode] = useState('command'); // 'command' or 'agent'

  useEffect(() => {
    const saved = sessionStorage.getItem('gaia_session');
    if (saved) setSessionProfile(JSON.parse(saved));

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth); 
        }
      } catch(e) {
        console.error("인증 초기화 실패", e);
        setIsAuthChecking(false); 
      }
    };
    
    if (auth) {
      initAuth();
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setFirebaseUser(currentUser);
        setIsAuthChecking(false); 
      });
      return () => unsubscribe();
    } else {
      setIsAuthChecking(false);
    }
  }, []);

  const handleLogin = async ({ gaiaId, password, isMasterAttempt }) => {
    if (gaiaId === MASTER_ADMIN_ID && password === MASTER_ADMIN_PW) {
      const profile = { gaiaId, name: "지휘관", isApproved: true, isAdmin: true, hasPassedTraining: true };
      setSessionProfile(profile);
      sessionStorage.setItem('gaia_session', JSON.stringify(profile));
      return null;
    }
    
    if (!db) return '통신 장애: 하드코딩된 Firebase Config를 확인하십시오.';

    try {
      const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION, gaiaId));
      if (snap.exists() && snap.data().password === password) {
        if (!snap.data().isApproved) return '관리자가 승인처리 중입니다. (대기상태)';
        setSessionProfile(snap.data());
        sessionStorage.setItem('gaia_session', JSON.stringify(snap.data()));
        return null;
      } else {
        return '사번 또는 Access Key가 일치하지 않습니다.';
      }
    } catch (e) { 
      return 'DB 통신 장애 (보안 규칙 또는 경로 오류): ' + e.message; 
    }
  };

  const handleSignUp = async ({ gaiaId, password, userName }) => {
    if (!db) return { success: false, msg: 'DB 연결 불가' };
    
    let currentUser = auth.currentUser;
    if (!currentUser) {
      try {
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
        setFirebaseUser(currentUser);
      } catch (e) {
        console.error("강제 익명 인증 실패", e);
        return { success: false, msg: 'Firebase 보안 통신망을 열 수 없습니다. (인증 서버 장애)' };
      }
    }

    try {
      const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION, gaiaId));
      if (snap.exists()) return { success: false, msg: '이미 존재하는 사번입니다.' };

      const profile = { gaiaId, name: userName, password, isApproved: false, hasPassedTraining: false, createdAt: new Date().toISOString(), isAdmin: false };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', DB_COLLECTION, gaiaId), profile);
      
      return { success: true, msg: '승인 요청이 전송되었습니다. 관리자 승인을 대기하십시오.' };
    } catch (e) { 
      return { success: false, msg: '요청 전송 실패: ' + e.message }; 
    }
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-xs font-black tracking-widest uppercase">Initializing Security Protocol...</p>
      </div>
    );
  }

  if (!sessionProfile) return <AuthScreen onLogin={handleLogin} onSignUp={handleSignUp} isAuthReady={!!firebaseUser || !isAuthChecking} />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <header className="bg-white px-8 py-3 border-b border-slate-200 flex justify-between items-center shadow-sm z-50 relative shrink-0">
        <div className={`absolute top-0 left-0 w-full h-1 ${sessionProfile.isAdmin ? 'bg-red-600' : 'bg-blue-600'}`}></div>
        
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md transition-colors ${sessionProfile.isAdmin ? 'bg-red-600 shadow-red-900/20' : 'bg-blue-600 shadow-blue-900/20'}`}>TP</div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-none">Talk Plan OS</h1>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{sessionProfile.isAdmin ? 'Command Center' : 'Operator Mode'}</p>
            </div>
        </div>

        {sessionProfile.isAdmin && (
          <div className="absolute left-1/2 -translate-x-1/2 bg-slate-100 p-1 rounded-xl border border-slate-200 flex shadow-inner">
            <button 
              onClick={() => setAdminViewMode('command')}
              className={`px-8 py-2 text-xs font-black rounded-lg transition-all ${adminViewMode === 'command' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              지휘관 통제소 (권한/주입)
            </button>
            <button 
              onClick={() => setAdminViewMode('agent')}
              className={`px-8 py-2 text-xs font-black rounded-lg transition-all ${adminViewMode === 'agent' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              전술 대시보드 (현장 테스트)
            </button>
          </div>
        )}

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
              <User size={16} className="text-slate-500"/>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-700 leading-none mb-1">{sessionProfile.name}</span>
              <span className="text-[10px] font-bold text-slate-400 font-mono leading-none">{sessionProfile.gaiaId}</span>
            </div>
          </div>
          <button onClick={() => {sessionStorage.clear(); window.location.reload();}} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50">
            <LogOut size={20}/>
          </button>
        </div>
      </header>
      
      {(sessionProfile.isAdmin && adminViewMode === 'command') ? (
        <AdminDashboard sessionProfile={sessionProfile} />
      ) : (
        <AgentDashboard sessionProfile={sessionProfile} />
      )}
    </div>
  );
}