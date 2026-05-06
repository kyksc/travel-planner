import { useEffect, useRef, useState } from 'react';
import './NaverMap.css';

/**
 * 네이버 지도 컴포넌트
 * @param {Array} schedule - [{ place, latitude, longitude, time, ... }] 형태의 일정
 * @param {Number} dayNumber - 일차 번호 (마커 색상 구분용)
 */
const NaverMap = ({ schedule = [], dayNumber = 1 }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);

  // 일차별 색상
  const dayColors = {
    1: '#00C4A7', // 민트
    2: '#5B8CFF', // 블루
    3: '#F59E0B', // 오렌지
  };

  // 네이버 지도 스크립트 로드
  useEffect(() => {
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
    
    if (!NAVER_CLIENT_ID) {
      setError('네이버 지도 Client ID가 설정되지 않았어요');
      return;
    }

    // 이미 로드된 경우
    if (window.naver && window.naver.maps) {
      setMapReady(true);
      return;
    }

    // 스크립트가 이미 추가된 경우
    if (document.getElementById('naver-map-script')) {
      const checkLoaded = setInterval(() => {
        if (window.naver && window.naver.maps) {
          clearInterval(checkLoaded);
          setMapReady(true);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    const script = document.createElement('script');
    script.id = 'naver-map-script';
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`;
    script.async = true;
    
    script.onload = () => {
      if (window.naver && window.naver.maps) {
        setMapReady(true);
      } else {
        setError('네이버 지도를 불러올 수 없어요');
      }
    };
    
    script.onerror = () => {
      setError('네이버 지도 스크립트 로딩 실패');
    };

    document.head.appendChild(script);
  }, []);

  // 지도 초기화 + 마커 표시
  useEffect(() => {
    if (!mapReady || !mapRef.current || schedule.length === 0) return;

    const naver = window.naver;
    const validSchedule = schedule.filter(s => s.latitude && s.longitude);
    
    if (validSchedule.length === 0) {
      setError('표시할 위치 정보가 없어요');
      return;
    }

    // 첫 번째 좌표를 중심으로 지도 생성
    const firstPoint = validSchedule[0];
    const center = new naver.maps.LatLng(firstPoint.latitude, firstPoint.longitude);

    // 지도 인스턴스가 이미 있으면 재사용
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new naver.maps.Map(mapRef.current, {
        center: center,
        zoom: 13,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.TOP_RIGHT,
          style: naver.maps.ZoomControlStyle.SMALL
        }
      });
    } else {
      mapInstanceRef.current.setCenter(center);
    }

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new naver.maps.LatLngBounds();
    const color = dayColors[dayNumber] || dayColors[1];
    
    // 폴리라인용 좌표 배열
    const pathCoords = [];

    validSchedule.forEach((item, idx) => {
      const position = new naver.maps.LatLng(item.latitude, item.longitude);
      pathCoords.push(position);

      // 커스텀 마커 (번호 표시)
      const markerHTML = `
        <div style="
          position: relative;
          width: 36px;
          height: 36px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ${idx + 1}
        </div>
      `;

      const marker = new naver.maps.Marker({
        position: position,
        map: mapInstanceRef.current,
        icon: {
          content: markerHTML,
          size: new naver.maps.Size(36, 36),
          anchor: new naver.maps.Point(18, 18)
        }
      });

      // 정보창 (말풍선)
      const infoContent = `
        <div style="
          padding: 12px 14px;
          min-width: 200px;
          max-width: 280px;
          font-family: 'Pretendard', sans-serif;
        ">
          <div style="
            font-size: 11px;
            color: ${color};
            font-weight: 700;
            margin-bottom: 4px;
          ">
            ${item.time || ''} · ${item.period || ''}
          </div>
          <div style="
            font-size: 15px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 6px;
          ">
            ${item.place}
          </div>
          ${item.category ? `
            <div style="
              display: inline-block;
              font-size: 11px;
              padding: 2px 8px;
              background: #f4f4f5;
              color: #666;
              border-radius: 999px;
              margin-bottom: 6px;
            ">
              ${item.category}
            </div>
          ` : ''}
          ${item.address ? `
            <div style="
              font-size: 12px;
              color: #999;
              margin-top: 4px;
            ">
              📍 ${item.address}
            </div>
          ` : ''}
        </div>
      `;

      const infoWindow = new naver.maps.InfoWindow({
        content: infoContent,
        borderColor: color,
        borderWidth: 2,
        anchorSize: new naver.maps.Size(10, 10),
        pixelOffset: new naver.maps.Point(0, -8)
      });

      // 마커 클릭 이벤트
      naver.maps.Event.addListener(marker, 'click', () => {
        if (infoWindow.getMap()) {
          infoWindow.close();
        } else {
          infoWindow.open(mapInstanceRef.current, marker);
        }
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // 경로 라인 그리기 (점선)
    if (pathCoords.length > 1) {
      const polyline = new naver.maps.Polyline({
        map: mapInstanceRef.current,
        path: pathCoords,
        strokeColor: color,
        strokeOpacity: 0.6,
        strokeWeight: 3,
        strokeStyle: 'shortdash'
      });
      markersRef.current.push(polyline);
    }

    // 모든 마커가 보이도록 줌 조정
    if (validSchedule.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, {
        top: 50, right: 50, bottom: 50, left: 50
      });
    }

    return () => {
      // cleanup은 다음 effect에서 처리
    };
  }, [schedule, mapReady, dayNumber]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap?.(null));
      markersRef.current = [];
    };
  }, []);

  if (error) {
    return (
      <div className="map-error">
        <div className="map-error-icon">🗺️</div>
        <p className="map-error-msg">{error}</p>
        <p className="map-error-hint">
          관리자에게 문의하거나 네이버 지도 API 설정을 확인해주세요
        </p>
      </div>
    );
  }

  if (!mapReady) {
    return (
      <div className="map-loading">
        <div className="map-loading-spinner"></div>
        <p>지도를 불러오는 중...</p>
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className="map-empty">
        <p>표시할 위치가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="naver-map-container">
      <div ref={mapRef} className="naver-map"></div>
      <div className="map-legend">
        <span className="legend-dot" style={{ background: dayColors[dayNumber] || dayColors[1] }}></span>
        <span>DAY {dayNumber}의 동선</span>
      </div>
    </div>
  );
};

export default NaverMap;
