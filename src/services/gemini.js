// Gemini 2.5 Flash를 활용한 여행 일정 자동 생성 서비스
// 각 장소의 위도/경도까지 받아와서 지도에 표시 가능

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const themeLabels = {
  'mountain': '산/자연',
  'indoor': '실내 여행지',
  'activity': '액티비티',
  'culture': '문화·역사',
  'theme-park': '테마파크',
  'cafe': '카페',
  'market': '전통시장',
  'festival': '축제'
};

const durationDays = {
  'day': 1,
  '1n2d': 2,
  '2n3d': 3
};

/**
 * 구글 Geocoding API로 주소 → 실제 좌표 변환
 */
async function getCoordinatesFromAddress(address) {
  if (!address) return null;
  
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
  if (!GOOGLE_API_KEY) {
    console.warn('구글 지도 API 키가 없어 정확한 좌표를 가져올 수 없어요');
    return null;
  }
  
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=kr&language=ko&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address
      };
    }
    
    if (data.status !== 'OK') {
      console.warn(`Geocoding 실패: ${data.status} for "${address}"`);
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding API 오류:', error);
    return null;
  }
}

/**
 * Gemini 2.5 Flash로 여행 일정 + 좌표 생성
 */
export async function generateItinerary(tripInfo) {
  const { regions, duration, themes } = tripInfo;
  const days = durationDays[duration] || 1;
  const themeText = themes.map(t => themeLabels[t] || t).join(', ');
  const regionText = regions.join(', ');

  const prompt = `너는 한국 여행 전문가야. 아래 조건에 맞는 ${days}일 여행 일정을 짜줘.

[여행 조건]
- 여행 지역: ${regionText}
- 여행 기간: ${days}일 (${duration === 'day' ? '당일치기' : duration === '1n2d' ? '1박 2일' : '2박 3일'})
- 관심 테마: ${themeText}

[요구사항]
1. 반드시 실제 존재하는 한국의 명소, 식당, 카페만 추천해줘
2. 각 날짜별로 오전/점심/오후/저녁 시간대로 나눠서 일정을 구성해줘 (하루 4~5개 장소)
3. 이동 동선을 고려해서 효율적으로 짜줘
4. 각 장소의 정확한 위도(latitude)와 경도(longitude)를 한국 좌표로 반드시 포함해줘
   - 좌표는 반드시 한국 영토 내여야 함 (위도 33~38, 경도 124~132 사이)
5. 각 장소마다 간단한 설명과 추천 이유를 포함해줘
6. address 필드에는 도로명주소나 지번주소를 정확히 넣어줘

[응답 형식]
반드시 아래 JSON 형식으로만 응답해. 마크다운 코드 블록 없이 순수 JSON만:

{
  "summary": "이 여행의 한 줄 요약 (50자 이내)",
  "highlights": ["하이라이트1", "하이라이트2", "하이라이트3"],
  "days": [
    {
      "day": 1,
      "title": "1일차 제목",
      "schedule": [
        {
          "time": "09:00",
          "period": "오전",
          "place": "장소명",
          "address": "정확한 주소 (예: 서울특별시 종로구 사직로 161)",
          "latitude": 37.5796,
          "longitude": 126.9770,
          "category": "관광지/식당/카페 등",
          "description": "설명 (40자 이내)",
          "reason": "추천 이유 (50자 이내)"
        }
      ]
    }
  ],
  "tips": ["여행 팁1", "여행 팁2", "여행 팁3"]
}`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // 마크다운 코드 블록 제거
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const itinerary = JSON.parse(text);
    
    // 실제 좌표를 구글 Geocoding API로 가져와서 정확도 향상
    if (itinerary.days && Array.isArray(itinerary.days)) {
      for (const day of itinerary.days) {
        if (day.schedule && Array.isArray(day.schedule)) {
          for (const item of day.schedule) {
            try {
              const realCoords = await getCoordinatesFromAddress(
                item.address || item.place
              );
              
              if (realCoords) {
                item.latitude = realCoords.lat;
                item.longitude = realCoords.lng;
                item.formattedAddress = realCoords.formattedAddress;
              }
            } catch (geoErr) {
              console.warn('좌표 변환 실패:', item.place, geoErr);
            }
          }
          
          // 좌표가 없거나 잘못된 항목 제거
          day.schedule = day.schedule.filter(item => {
            return item.latitude >= 33 && item.latitude <= 39 
              && item.longitude >= 124 && item.longitude <= 132;
          });
        }
      }
    }
    
    return { success: true, data: itinerary };
} catch (error) {
    console.error('Gemini API 오류:', error);
    
    // 에러 메시지를 쉬운 한국어로 변환
    const rawMessage = error.message || '';
    let friendlyMessage = 'AI 일정 생성에 실패했어요';
    
    if (rawMessage.includes('503')) {
      friendlyMessage = '😅 AI 서버가 잠시 바빠요. 1~2분 후 다시 시도해주세요!';
    } else if (rawMessage.includes('429')) {
      friendlyMessage = '⏰ 너무 많은 요청이 있었어요. 잠시 후 다시 시도해주세요.';
    } else if (rawMessage.includes('API key not valid') || rawMessage.includes('400')) {
      friendlyMessage = '🔑 API 키 설정에 문제가 있어요. 관리자에게 문의해주세요.';
    } else if (rawMessage.includes('quota') || rawMessage.includes('limit')) {
      friendlyMessage = '📊 오늘의 무료 사용량을 모두 썼어요. 내일 다시 시도해주세요.';
    } else if (rawMessage.includes('network') || rawMessage.includes('fetch')) {
      friendlyMessage = '🌐 인터넷 연결을 확인해주세요.';
    } else if (rawMessage.includes('JSON') || rawMessage.includes('parse')) {
      friendlyMessage = '🤖 AI가 답변을 잘못 만들었어요. 다시 시도해주세요!';
    } else if (rawMessage.includes('SAFETY') || rawMessage.includes('blocked')) {
      friendlyMessage = '🛡️ AI가 답변을 거절했어요. 다른 조건으로 시도해주세요.';
    } else if (rawMessage.includes('timeout')) {
      friendlyMessage = '⏱️ 응답 시간이 초과됐어요. 다시 시도해주세요.';
    }
    
    return { 
      success: false, 
      error: friendlyMessage,
      detail: rawMessage // 개발자용 상세 정보 (선택)
    };
  }
}