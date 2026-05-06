import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { generateItinerary } from '../services/gemini';
import { REGIONS, SUB_REGIONS } from '../data/regions';
import './PlannerPage.css';

const DURATIONS = [
  { id: 'day', label: '당일여행', icon: '📘', maxRegions: 1 },
  { id: '1n2d', label: '1박 2일', icon: '📗', maxRegions: 1 },
  { id: '2n3d', label: '2박 3일', icon: '📙', maxRegions: 2 }
];

const THEMES = [
  { id: 'mountain', label: '산', emoji: '⛰️', gradient: 'linear-gradient(135deg, #4a7c59 0%, #8fbc8f 100%)' },
  { id: 'indoor', label: '실내 여행지', emoji: '🏛️', gradient: 'linear-gradient(135deg, #d4a574 0%, #f5deb3 100%)' },
  { id: 'activity', label: '액티비티', emoji: '🪂', gradient: 'linear-gradient(135deg, #5b8cff 0%, #87ceeb 100%)' },
  { id: 'culture', label: '문화·역사', emoji: '🎨', gradient: 'linear-gradient(135deg, #c84b6b 0%, #ffa3bc 100%)' },
  { id: 'theme-park', label: '테마파크', emoji: '🎡', gradient: 'linear-gradient(135deg, #f4a261 0%, #fcd29f 100%)' },
  { id: 'cafe', label: '카페', emoji: '☕', gradient: 'linear-gradient(135deg, #8b5e3c 0%, #d2a679 100%)' },
  { id: 'market', label: '전통시장', emoji: '🏮', gradient: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)' },
  { id: 'festival', label: '축제', emoji: '🎆', gradient: 'linear-gradient(135deg, #6b46c1 0%, #c084fc 100%)' }
];

const LOADING_MESSAGES = [
  'AI가 여행 정보를 분석하고 있어요...',
  '최적의 동선을 계획하는 중...',
  '맛집과 명소를 찾고 있어요...',
  '당신만의 특별한 일정을 만드는 중...',
  '거의 완성됐어요! ✨'
];

const PlannerPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [step, setStep] = useState(1);
  // selectedRegions 구조: [{ region: '경기', subRegion: '수원시' }, ...]
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [tripTitle, setTripTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  
  // 시·군 선택 모달 상태
  const [subRegionModal, setSubRegionModal] = useState(null); // { id, name } 또는 null

  // 최대 선택 가능 지역 수
  const getMaxRegions = () => {
    return selectedDuration 
      ? DURATIONS.find(d => d.id === selectedDuration)?.maxRegions || 1
      : 2;
  };

  // 광역시도 클릭 시
  const handleRegionClick = (region) => {
    if (region.hasSubRegions) {
      // 도(道) → 시·군 선택 모달 열기
      setSubRegionModal(region);
    } else {
      // 광역시 → 바로 추가/제거
      toggleRegion(region.name, null);
    }
  };

  // 지역 토글 (실제 추가/제거 로직)
  const toggleRegion = (regionName, subRegionName) => {
    const fullName = subRegionName ? `${regionName} ${subRegionName}` : regionName;
    const exists = selectedRegions.find(r => r.fullName === fullName);
    
    if (exists) {
      // 이미 선택된 걸 다시 누르면 해제
      setSelectedRegions(selectedRegions.filter(r => r.fullName !== fullName));
    } else {
      // 새로 선택하면 기존 것 모두 지우고 이것만 선택
      const newRegion = { region: regionName, subRegion: subRegionName, fullName };
      setSelectedRegions([newRegion]);
    }
  };

  // 시·군 모달에서 선택 시
  const handleSubRegionSelect = (subRegionName) => {
    toggleRegion(subRegionModal.name, subRegionName);
  };

  // 광역시도가 선택된 상태인지 (하위 시군 중 하나라도 선택되어 있는지)
  const isRegionSelected = (region) => {
    if (region.hasSubRegions) {
      return selectedRegions.some(r => r.region === region.name);
    }
    return selectedRegions.some(r => r.fullName === region.name);
  };

  // 특정 광역시도에 선택된 시·군 개수
  const getSelectedSubCount = (regionName) => {
    return selectedRegions.filter(r => r.region === regionName).length;
  };

  // 시·군 모달 내에서 해당 시·군이 선택됐는지
  const isSubRegionSelected = (regionName, subRegionName) => {
    return selectedRegions.some(r => r.fullName === `${regionName} ${subRegionName}`);
  };

  const handleThemeToggle = (themeId) => {
    if (selectedThemes.includes(themeId)) {
      setSelectedThemes(selectedThemes.filter(t => t !== themeId));
    } else {
      if (selectedThemes.length < 4) {
        setSelectedThemes([...selectedThemes, themeId]);
      }
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedRegions.length === 0) {
      alert('지역을 1개 이상 선택해주세요');
      return;
    }
    if (step === 2 && !selectedDuration) {
      alert('여행 기간을 선택해주세요');
      return;
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
    else navigate('/');
  };

  const cycleLoadingMessages = () => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[idx]);
    }, 1800);
    return interval;
  };

  const handleComplete = async () => {
    if (selectedThemes.length < 2) {
      alert('테마를 2개 이상 선택해주세요');
      return;
    }

    setSaving(true);
    setLoadingMessage(LOADING_MESSAGES[0]);
    const messageInterval = cycleLoadingMessages();

    try {
      // AI에 보낼 지역 이름 (예: "경기 수원시")
      const regionNames = selectedRegions.map(r => r.fullName);
      
      const aiResult = await generateItinerary({
        regions: regionNames,
        duration: selectedDuration,
        themes: selectedThemes
      });

      const finalTitle = tripTitle.trim() || 
        `${regionNames.join(', ')} ${DURATIONS.find(d => d.id === selectedDuration)?.label}`;

      const tripData = {
        userId: currentUser.uid,
        title: finalTitle,
        regions: regionNames,
        regionsDetailed: selectedRegions, // 상세 정보도 저장
        duration: selectedDuration,
        durationLabel: DURATIONS.find(d => d.id === selectedDuration)?.label,
        themes: selectedThemes,
        themeLabels: selectedThemes.map(id => THEMES.find(t => t.id === id)?.label),
        aiItinerary: aiResult.success ? aiResult.data : null,
        aiError: aiResult.success ? null : aiResult.error,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'trips'), tripData);
      clearInterval(messageInterval);
      navigate(`/trip/${docRef.id}`);
    } catch (error) {
      clearInterval(messageInterval);
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      setSaving(false);
    }
  };

  // AI 생성 중 로딩 화면
  if (saving) {
    return (
      <div className="planner-page">
        <div className="ai-loading-screen">
          <div className="ai-loading-animation">
            <div className="ai-orb">
              <div className="ai-orb-inner"></div>
              <div className="ai-orb-ring ai-orb-ring-1"></div>
              <div className="ai-orb-ring ai-orb-ring-2"></div>
              <div className="ai-orb-ring ai-orb-ring-3"></div>
            </div>
          </div>
          <h2 className="ai-loading-title">✨ AI가 여행 일정을 만드는 중</h2>
          <p className="ai-loading-message">{loadingMessage}</p>
          <div className="ai-loading-progress">
            <div className="ai-loading-bar"></div>
          </div>
          <p className="ai-loading-hint">최대 30초 정도 소요됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="planner-page">
      <div className="planner-container">
        <div className="planner-header">
          <button onClick={() => navigate('/')} className="planner-logo">
            <span className="logo-icon">✈</span>
            AI 여행 플래너
          </button>
          <div className="step-indicator">
            <span className={step === 1 ? 'active' : step > 1 ? 'completed' : ''}>01</span>
            <span className={`step-line ${step >= 2 ? 'active' : ''}`}></span>
            <span className={step === 2 ? 'active' : step > 2 ? 'completed' : ''}>02</span>
            <span className={`step-line ${step >= 3 ? 'active' : ''}`}></span>
            <span className={step === 3 ? 'active' : ''}>03</span>
          </div>
        </div>

        {/* Step 1: 지역 선택 */}
        {step === 1 && (
          <div className="step-content fade-in">
            <p className="step-subtitle">이번 여행, 어디로 떠나볼까요?</p>
            <h1 className="step-title">
              여행을 떠나고 싶은 지역을<br/>
              선택해 주세요.
            </h1>
            <p className="step-hint">📍 도(경기/강원/전남 등)를 누르면 시·군을 선택할 수 있어요</p>
            
            <div className="regions-grid">
              {REGIONS.map((region) => (
                <button
                  key={region.id}
                  className={`region-circle ${isRegionSelected(region) ? 'selected' : ''} ${region.hasSubRegions ? 'has-sub' : ''}`}
                  onClick={() => handleRegionClick(region)}
                >
                  {region.name}
                  {region.hasSubRegions && (
                    <span className="sub-indicator">
                      {getSelectedSubCount(region.name) > 0 
                        ? `${getSelectedSubCount(region.name)}` 
                        : '+'}
                    </span>
                  )}
                  {!region.hasSubRegions && isRegionSelected(region) && (
                    <span className="check-mark">✓</span>
                  )}
                </button>
              ))}
            </div>

            {selectedRegions.length > 0 && (
              <div className="selected-info">
                <div className="selected-tags">
                  {selectedRegions.map((r, idx) => (
                    <span key={idx} className="selected-tag">
                      📍 {r.fullName}
                      <button 
                        className="tag-remove"
                        onClick={() => toggleRegion(r.region, r.subRegion)}
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: 기간 선택 */}
        {step === 2 && (
          <div className="step-content fade-in">
            <p className="step-subtitle"> 며칠 동안 떠나시나요?</p>
            <h1 className="step-title">
              여행 기간을<br/>
              선택해 주세요.
            </h1>
            <div className="durations-grid">
              {DURATIONS.map((duration) => (
                <button
                  key={duration.id}
                  className={`duration-card ${selectedDuration === duration.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDuration(duration.id)}
                >
                  <div className="duration-icon">
                    <CalendarIcon variant={duration.id} />
                  </div>
                  <span className="duration-label">{duration.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: 테마 선택 */}
        {step === 3 && (
          <div className="step-content fade-in">
            <p className="step-subtitle">마지막으로 이번 여행의 테마를 정해볼까요?</p>
            <h1 className="step-title">
              원하는 여행 테마를 <span className="highlight">2개 이상</span><br/>
              선택해 주세요. <span className="step-title-sub">(최대 4개)</span>
            </h1>
            <div className="themes-grid">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-card ${selectedThemes.includes(theme.id) ? 'selected' : ''}`}
                  onClick={() => handleThemeToggle(theme.id)}
                  disabled={!selectedThemes.includes(theme.id) && selectedThemes.length >= 4}
                >
                  <div className="theme-image" style={{ background: theme.gradient }}>
                    <span className="theme-emoji">{theme.emoji}</span>
                    {selectedThemes.includes(theme.id) && (
                      <span className="theme-check">✓</span>
                    )}
                  </div>
                  <span className="theme-label">{theme.label}</span>
                </button>
              ))}
            </div>

            <div className="trip-title-input">
              <label htmlFor="tripTitle">여행 제목 (선택)</label>
              <input
                id="tripTitle"
                type="text"
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                placeholder={`${selectedRegions.map(r => r.fullName).join(', ')} ${DURATIONS.find(d => d.id === selectedDuration)?.label || ''}`}
                maxLength={50}
              />
            </div>

            <div className="ai-notice">
              <span className="ai-notice-icon">✨</span>
              <div>
                <strong>AI가 자동으로 여행 일정을 만들어드려요!</strong>
                <p>완료 버튼을 누르면 Gemini AI가 맞춤 일정을 생성합니다</p>
              </div>
            </div>
          </div>
        )}

        <div className="planner-footer">
          {step > 1 && (
            <button onClick={handlePrev} className="btn-prev">이전</button>
          )}
          {step < 3 ? (
            <button 
              onClick={handleNext} 
              className="btn-next"
              disabled={
                (step === 1 && selectedRegions.length === 0) ||
                (step === 2 && !selectedDuration)
              }
            >
              다음
            </button>
          ) : (
            <button 
              onClick={handleComplete} 
              className="btn-next btn-ai-generate"
              disabled={selectedThemes.length < 2}
            >
              ✨ AI 일정 생성하기
            </button>
          )}
        </div>
      </div>

      {/* 시·군 선택 모달 */}
      {subRegionModal && (
        <div className="modal-overlay" onClick={() => setSubRegionModal(null)}>
          <div className="modal-content sub-region-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="modal-region-name">{subRegionModal.name}</span>
                <span className="modal-subtitle">시·군을 선택하세요</span>
              </h3>
              <button 
                className="modal-close"
                onClick={() => setSubRegionModal(null)}
                aria-label="닫기"
              >×</button>
            </div>
            
            <div className="sub-regions-grid">
              {SUB_REGIONS[subRegionModal.id]?.map((subRegion) => (
                <button
                  key={subRegion}
                  className={`sub-region-pill ${
                    isSubRegionSelected(subRegionModal.name, subRegion) ? 'selected' : ''
                  }`}
                  onClick={() => handleSubRegionSelect(subRegion)}
                >
                  {subRegion}
                  {isSubRegionSelected(subRegionModal.name, subRegion) && (
                    <span className="pill-check">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="modal-footer">
              <p className="modal-info">
                선택한 지역: {selectedRegions.length}/{getMaxRegions()}개
              </p>
              <button 
                className="modal-confirm-btn"
                onClick={() => setSubRegionModal(null)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CalendarIcon = ({ variant }) => {
  const colors = { 'day': '#5B8CFF', '1n2d': '#00C4A7', '2n3d': '#10B981' };
  const color = colors[variant] || '#5B8CFF';
  
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="10" width="36" height="32" rx="3" stroke={color} strokeWidth="2.5" fill="white"/>
      <path d="M6 18H42" stroke={color} strokeWidth="2.5"/>
      <line x1="14" y1="6" x2="14" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="34" y1="6" x2="34" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      {variant === 'day' && <rect x="20" y="24" width="8" height="8" rx="1" fill={color}/>}
      {variant === '1n2d' && (<>
        <rect x="13" y="24" width="7" height="6" rx="1" fill={color}/>
        <rect x="22" y="24" width="7" height="6" rx="1" fill={color} opacity="0.4"/>
      </>)}
      {variant === '2n3d' && (<>
        <rect x="11" y="24" width="6" height="6" rx="1" fill={color} opacity="0.4"/>
        <rect x="19" y="24" width="6" height="6" rx="1" fill={color}/>
        <rect x="27" y="24" width="6" height="6" rx="1" fill={color} opacity="0.7"/>
      </>)}
    </svg>
  );
};

export default PlannerPage;
