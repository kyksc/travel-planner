import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import './MyTripsPage.css';

const MyTripsPage = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, [currentUser]);

  const fetchTrips = async () => {
    if (!currentUser) return;
    
    try {
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const tripsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrips(tripsData);
    } catch (error) {
      console.error('여행 목록 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tripId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('이 여행 일정을 삭제하시겠습니까?')) return;
    
    try {
      await deleteDoc(doc(db, 'trips', tripId));
      setTrips(trips.filter(t => t.id !== tripId));
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다');
    }
  };

  const themeEmojis = {
    'mountain': '⛰️', 'indoor': '🏛️', 'activity': '🪂',
    'culture': '🎨', 'theme-park': '🎡', 'cafe': '☕',
    'market': '🏮', 'festival': '🎆'
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const displayName = userProfile?.nickname || currentUser?.displayName || currentUser?.email?.split('@')[0] || '여행자';

  if (loading) {
    return (
      <div className="my-trips-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>여행 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-trips-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>{displayName}님의 여행</h1>
            <p>저장된 여행 일정 {trips.length}개</p>
          </div>
          <Link to="/planner" className="new-trip-btn">
            <span>+</span> 새 여행 만들기
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <h2>아직 만든 여행이 없어요</h2>
            <p>첫 여행 일정을 만들어볼까요?</p>
            <Link to="/planner" className="btn-primary">
              여행 만들기 시작하기
            </Link>
          </div>
        ) : (
          <div className="trips-grid">
            {trips.map((trip) => (
              <Link to={`/trip/${trip.id}`} key={trip.id} className="trip-card">
                <div className="trip-card-header">
                  <span className="trip-duration">{trip.durationLabel}</span>
                  <button 
                    className="trip-delete"
                    onClick={(e) => handleDelete(trip.id, e)}
                    aria-label="삭제"
                  >🗑️</button>
                </div>
                
                <h3 className="trip-title">{trip.title}</h3>
                
                <div className="trip-regions">
                  {trip.regions?.map((region, idx) => (
                    <span key={idx} className="region-badge">📍 {region}</span>
                  ))}
                </div>

                <div className="trip-themes">
                  {trip.themes?.slice(0, 4).map((themeId, idx) => (
                    <span key={idx} className="theme-emoji-badge">
                      {themeEmojis[themeId]}
                    </span>
                  ))}
                </div>

                <div className="trip-meta">
                  <span className="trip-date">{formatDate(trip.createdAt)}</span>
                  <span className="trip-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTripsPage;
