import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob hero-blob-1"></div>
          <div className="hero-blob hero-blob-2"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <span className="hero-badge">✨ AI 여행 플래너</span>
            <h1 className="hero-title">
              완벽한 여행을<br/>
              <span className="hero-title-accent">콕콕</span> 찍어드립니다
            </h1>
            <p className="hero-description">
              지역, 기간, 테마를 선택하면 당신만을 위한<br/>
              맞춤 여행 일정이 완성됩니다
            </p>
            <div className="hero-cta">
              <Link to={currentUser ? "/planner" : "/signup"} className="btn-primary">
                여행 계획 시작하기
                <span className="btn-arrow">→</span>
              </Link>
              {currentUser && (
                <Link to="/my-trips" className="btn-secondary">
                  내 여행 보기
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">FEATURES</span>
            <h2>3단계로 끝내는 여행 계획</h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-number">01</div>
              <div className="feature-icon">📍</div>
              <h3>지역 선택</h3>
              <p>전국 17개 시도 중 가고 싶은 지역을 자유롭게 선택하세요</p>
            </div>

            <div className="feature-card">
              <div className="feature-number">02</div>
              <div className="feature-icon">📅</div>
              <h3>여행 기간</h3>
              <p>당일치기부터 2박 3일까지, 일정에 맞춰 선택해보세요</p>
            </div>

            <div className="feature-card">
              <div className="feature-number">03</div>
              <div className="feature-icon">🎨</div>
              <h3>테마 결정</h3>
              <p>산, 카페, 액티비티 등 원하는 테마를 골라 맞춤 여행을 완성</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2>지금 바로 시작해보세요</h2>
            <p>회원가입 후 나만의 여행 일정을 저장하고 관리할 수 있어요</p>
            <Link to={currentUser ? "/planner" : "/signup"} className="btn-primary">
              {currentUser ? "여행 만들기" : "무료로 시작하기"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
