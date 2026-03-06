const { onCall, HttpsError } = require("firebase-functions/v2/https");
const fetch = require("node-fetch");

// 🚨 지휘관의 API 키
const GEMINI_API_KEY = "AIzaSyDSXaSQjepkchEbBECY5SGIZ_TZJmniPxQ"; 
const EMBEDDING_MODEL = "text-embedding-004"; 
const GENERATIVE_MODEL = "gemini-2.5-flash";

function getCosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedding(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] }
    })
  });
  const json = await response.json();
  return json.embedding.values;
}

exports.injectVectorData = onCall(async (request) => {
  const { text } = request.data;
  if (!text) throw new HttpsError("invalid-argument", "텍스트가 없습니다.");

  try {
    const vector = await getEmbedding(text);
    return { vector }; 
  } catch (e) {
    throw new HttpsError("internal", `임베딩 생성 실패: ${e.message}`);
  }
});

exports.generateTacticAI = onCall(async (request) => {
  const { userQuery, modeType, contextData } = request.data;
  
  const systemInstruction = `
    당신은 상위 1% 비대면 보험 전술가입니다. 
    제시된 [유사 성공 사례]는 현재 상황과 수학적으로 가장 유사한 과거 데이터입니다.
    이를 기반으로 톤앤매너를 복제하여 최상의 스크립트를 도출하십시오.
  `;

  try {
    let referenceData = "참고 데이터 없음";
    let topMatches = [];

    if (modeType === "ACTUAL" && userQuery && contextData.length > 0) {
      const queryVector = await getEmbedding(userQuery);
      
      const scoredData = contextData.map(doc => ({
        ...doc,
        score: doc.vector ? getCosineSimilarity(queryVector, doc.vector) : 0
      }));

      topMatches = scoredData
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      referenceData = topMatches.map((m, i) => `[유사 사례 ${i+1} / 일치율 ${(m.score*100).toFixed(1)}%]\n${m.raw_transcript}`).join('\n\n');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GENERATIVE_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const promptText = `상황: "${userQuery || '훈련 중'}"\n\n[유사 성공 사례]\n${referenceData}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });

    const result = await response.json();
    
    // AI 텍스트와 함께 벡터 매칭 데이터(matches)를 프론트엔드로 리턴
    return { 
      text: result.candidates?.[0]?.content?.parts?.[0]?.text || "AI 생성 실패",
      matches: topMatches.map(m => ({ score: m.score, text: m.raw_transcript }))
    };
    
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});