import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { generateItinerary } from '../services/gemini';
import GoogleMap from '../components/GoogleMap';
import './TripDetailPage.css';

const TripDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [activeMapDay, setActiveMapDay] = useState(1); // 지도에 표시할 일차

  const themeData = {
    'mountain': { label: '산', emoji: '⛰️', desc: '자연 속에서 힐링' },
    'indoor': { label: '실내 여행지', emoji: '🏛️', desc: '날씨 걱정 없는 실내 명소' },
    'activity': { label: '액티비티', emoji: '🪂', desc: '짜릿한 모험과 도전' },
    'culture': { label: '문화·역사', emoji: '🎨', desc: '시대를 넘나드는 여정' },
    'theme-park': { label: '테마파크', emoji: '🎡', desc: '신나는 놀이공원' },
    'cafe': { label: '카페', emoji: '☕', desc: '여유로운 한 잔의 시간' },
    'market': { label: '전통시장', emoji: '🏮', desc: '지역의 맛과 정' },
    'festival': { label: '축제', emoji: '🎆', desc: '잊지 못할 추억' }
  };

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      const docRef = doc(db, 'trips', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.userId !== currentUser.uid) {
          alert('접근 권한이 없습니다');
          navigate('/my-trips');
          return;
        }
        setTrip({ id: docSnap.id, ...data });
      } else {
        alert('여행 일정을 찾을 수 없습니다');
        navigate('/my-trips');
      }
    } catch (error) {
      console.error('불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm('AI에게 새로운 일정을 다시 받으시겠습니까? 기존 일정은 사라져요.')) return;
    
    setRegenerating(true);
    try {
      const aiResult = await generateItinerary({
        regions: trip.regions,
        duration: trip.duration,
        themes: trip.themes
      });

      if (aiResult.success) {
        const docRef = doc(db, 'trips', id);
        await updateDoc(docRef, {
          aiItinerary: aiResult.data,
          aiError: null
        });
        setTrip({ ...trip, aiItinerary: aiResult.data, aiError: null });
      } else {
        alert('재생성에 실패했습니다: ' + aiResult.error);
      }
    } catch (error) {
      console.error('재생성 실패:', error);
      alert('재생성 중 오류가 발생했습니다');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('이 여행 일정을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'trips', id));
      navigate('/my-trips');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const periodIcons = {
    '오전': '🌅', '점심': '🍽️', '오후': '☀️', '저녁': '🌆', '밤': '🌙'
  };

  const getCategoryIcon = (category) => {
    if (category?.includes('식당') || category?.includes('맛집')) return '🍴';
    if (category?.includes('카페')) return '☕';
    if (category?.includes('관광') || category?.includes('명소')) return '📸';
    if (category?.includes('체험') || category?.includes('액티비티')) return '🎯';
    if (category?.includes('숙소')) return '🏨';
    if (category?.includes('쇼핑') || category?.includes('시장')) return '🛍️';
    return '📍';
  };

  // 구글 지도에서 길찾기 열기
// 구글 지도에서 장소 검색 열기
  const openGoogleMap = (item) => {
    // 주소가 있으면 주소로, 없으면 장소명으로 검색
    const searchQuery = item.address || item.place;
    if (searchQuery) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="trip-detail-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const itinerary = trip.aiItinerary;
  const currentDaySchedule = itinerary?.days?.find(d => d.day === activeMapDay)?.schedule || [];

  return (
    <div className="trip-detail-page">
      <div className="container">
        <div className="back-nav">
          <Link to="/my-trips" className="back-link">← 내 여행 목록</Link>
        </div>

        {/* 헤더 */}
        <div className="trip-hero">
          <div className="trip-hero-content">
            <span className="trip-hero-badge">{trip.durationLabel}</span>
            <h1 className="trip-hero-title">{trip.title}</h1>
            {itinerary?.summary && (
              <p className="trip-hero-summary">{itinerary.summary}</p>
            )}
            <p className="trip-hero-date">생성일: {formatDate(trip.createdAt)}</p>
          </div>
          <div className="trip-hero-decoration">
            {trip.themes?.slice(0, 3).map((themeId, idx) => (
              <span 
                key={idx} 
                className="floating-emoji"
                style={{ animationDelay: `${idx * 0.3}s` }}
              >
                {themeData[themeId]?.emoji}
              </span>
            ))}
          </div>
        </div>

        {/* 정보 그리드 */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-card-header">
              <span className="info-icon">📍</span>
              <h2>여행 지역</h2>
            </div>
            <div className="regions-list">
              {trip.regions?.map((region, idx) => (
                <div key={idx} className="region-item">
                  <span className="region-num">{idx + 1}</span>
                  <span className="region-name">{region}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <span className="info-icon">🎨</span>
              <h2>선택한 테마</h2>
            </div>
            <div className="themes-mini-list">
              {trip.themes?.map((themeId, idx) => {
                const theme = themeData[themeId];
                if (!theme) return null;
                return (
                  <div key={idx} className="theme-mini-item">
                    <span className="theme-mini-emoji">{theme.emoji}</span>
                    <span className="theme-mini-label">{theme.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI 일정 */}
        {itinerary ? (
          <div className="ai-itinerary-section">
            <div className="ai-section-header">
              <div>
                <span className="ai-badge">✨ AI 추천 일정</span>
                <h2>맞춤 여행 일정</h2>
              </div>
              <button 
                onClick={handleRegenerate} 
                className="btn-regenerate"
                disabled={regenerating}
              >
                {regenerating ? (
                  <><span className="spinner-mini"></span>재생성 중...</>
                ) : (
                  <>🔄 다시 추천받기</>
                )}
              </button>
            </div>

            {/* 하이라이트 */}
            {itinerary.highlights?.length > 0 && (
              <div className="highlights-card">
                <h3>🌟 이 여행의 하이라이트</h3>
                <ul className="highlights-list">
                  {itinerary.highlights.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 🗺️ 지도 섹션 */}
            {itinerary.days?.length > 0 && (
              <div className="map-section">
                <div className="map-section-header">
                  <h3>🗺️ 여행 동선 지도</h3>
                  
                  {itinerary.days.length > 1 && (
                    <div className="map-day-tabs">
                      {itinerary.days.map((day) => (
                        <button
                          key={day.day}
                          className={`map-day-tab ${activeMapDay === day.day ? 'active' : ''}`}
                          onClick={() => setActiveMapDay(day.day)}
                        >
                          DAY {day.day}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <GoogleMap 
                  schedule={currentDaySchedule}
                  dayNumber={activeMapDay}
                />
                
                <p className="map-hint">
                  💡 마커를 클릭하면 장소 정보를 볼 수 있어요
                </p>
              </div>
            )}

            {/* 날짜별 일정 */}
            <div className="days-timeline">
              {itinerary.days?.map((dayPlan) => (
                <div key={dayPlan.day} className="day-card">
                  <div className="day-header">
                    <div className="day-number-big">DAY {dayPlan.day}</div>
                    <h3 className="day-title">{dayPlan.title}</h3>
                  </div>
                  
                  <div className="schedule-timeline">
                    {dayPlan.schedule?.map((item, idx) => (
                      <div key={idx} className="schedule-item">
                        <div className="schedule-time-col">
                          <div className="schedule-time">{item.time}</div>
                          <div className="schedule-period">
                            {periodIcons[item.period] || '🕐'} {item.period}
                          </div>
                        </div>
                        <div className="schedule-line">
                          <div className="schedule-dot"></div>
                          {idx < dayPlan.schedule.length - 1 && <div className="schedule-vertical"></div>}
                        </div>
                        <div className="schedule-content">
                          <div className="schedule-place">
                            <span className="schedule-icon">{getCategoryIcon(item.category)}</span>
                            <h4>{item.place}</h4>
                            {item.category && (
                              <span className="schedule-category">{item.category}</span>
                            )}
                          </div>
                          <p className="schedule-description">{item.description}</p>
                          {item.address && (
                            <p className="schedule-address">
                              📍 {item.address}
                            </p>
                          )}
                          {item.reason && (
                            <p className="schedule-reason">💡 {item.reason}</p>
                          )}
                         {(item.address || item.place) && (
                            <button 
                              className="schedule-map-btn"
                              onClick={() => openGoogleMap(item)}
                            >
                              🗺️ 구글 지도에서 보기
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 여행 팁 */}
            {itinerary.tips?.length > 0 && (
              <div className="tips-card">
                <h3>💡 여행 팁</h3>
                <ul className="tips-list">
                  {itinerary.tips.map((tip, idx) => (
                    <li key={idx}>
                      <span className="tip-num">{idx + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="ai-error-card">
            <div className="ai-error-icon">😢</div>
            <h3>AI 일정 생성에 실패했어요</h3>
            <p>{trip.aiError || 'Gemini API 설정을 확인해주세요'}</p>
            <button onClick={handleRegenerate} className="btn-create" disabled={regenerating}>
              {regenerating ? '재생성 중...' : '🔄 다시 시도하기'}
            </button>
          </div>
        )}

        <div className="trip-actions">
          <button onClick={handleDelete} className="btn-delete">🗑️ 여행 삭제</button>
          <Link to="/planner" className="btn-create">✨ 새 여행 만들기</Link>
        </div>
      </div>
    </div>
  );
};

export default TripDetailPage;
