import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 닉네임 첫 글자 (사진 없을 때)
  const getInitial = () => {
    const name = userProfile?.nickname || currentUser?.displayName || currentUser?.email?.split('@')[0] || '?';
    return name.charAt(0).toUpperCase();
  };

  // 플래너 페이지에서는 헤더 숨김
  if (location.pathname === '/planner') return null;

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">✈</span>
          <span className="logo-text">AI 여행 플래너</span>
        </Link>

        <nav className="nav">
          <Link to="/" className="nav-link">홈</Link>
          {currentUser ? (
            <>
              <Link to="/my-trips" className="nav-link">내 여행</Link>
              <Link to="/planner" className="nav-cta">여행 만들기</Link>
              
              {/* 프로필 사진 클릭 → 프로필 페이지 */}
              <Link to="/profile" className="profile-btn-link" aria-label="프로필 설정">
                {userProfile?.photoBase64 ? (
                  <img src={userProfile.photoBase64} alt="프로필" className="profile-avatar" />
                ) : (
                  <div className="profile-avatar-placeholder">{getInitial()}</div>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">로그인</Link>
              <Link to="/signup" className="nav-cta">시작하기</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;