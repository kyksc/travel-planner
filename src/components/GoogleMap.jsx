import { useEffect, useRef, useState } from 'react';
import './GoogleMap.css';

const GoogleMap = ({ schedule = [], dayNumber = 1 }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);

  const dayColors = {
    1: '#00C4A7',
    2: '#5B8CFF',
    3: '#F59E0B',
  };

  // 구글 지도 스크립트 로드
  useEffect(() => {
    const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAP_API_KEY;

    if (!GOOGLE_API_KEY) {
      setError('구글 지도 API 키가 설정되지 않았어요');
      return;
    }

    if (window.google && window.google.maps) {
      setMapReady(true);
      return;
    }

    if (document.getElementById('google-map-script')) {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          setMapReady(true);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    const script = document.createElement('script');
    script.id = 'google-map-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&language=ko&region=KR`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        setMapReady(true);
      } else {
        setError('구글 지도를 불러올 수 없어요');
      }
    };

    script.onerror = () => {
      setError('구글 지도 스크립트 로딩 실패');
    };

    document.head.appendChild(script);
  }, []);

  // 지도 초기화 + 마커 표시
  useEffect(() => {
    if (!mapReady || !mapRef.current || schedule.length === 0) return;

    const google = window.google;
    const validSchedule = schedule.filter(s => s.latitude && s.longitude);

    if (validSchedule.length === 0) {
      setError('표시할 위치 정보가 없어요');
      return;
    }

    const firstPoint = validSchedule[0];
    const center = { lat: firstPoint.latitude, lng: firstPoint.longitude };

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    } else {
      mapInstanceRef.current.setCenter(center);
    }

    // 기존 마커 제거
    markersRef.current.forEach(item => {
      if (item.setMap) item.setMap(null);
    });
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    const color = dayColors[dayNumber] || dayColors[1];
    const pathCoords = [];

    validSchedule.forEach((item, idx) => {
      const position = { lat: item.latitude, lng: item.longitude };
      pathCoords.push(position);

      // 번호가 들어간 커스텀 마커 SVG
      const markerSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="${color}" stroke="white" stroke-width="3"/>
          <text x="18" y="23" text-anchor="middle" fill="white" font-size="14" font-weight="800" font-family="sans-serif">${idx + 1}</text>
        </svg>
      `;

      const marker = new google.maps.Marker({
        position: position,
        map: mapInstanceRef.current,
        title: item.place,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        }
      });

      // 정보창 (말풍선)
      const infoContent = `
        <div style="padding: 8px 4px; min-width: 200px; max-width: 280px; font-family: 'Pretendard', sans-serif;">
          <div style="font-size: 11px; color: ${color}; font-weight: 700; margin-bottom: 4px;">
            ${item.time || ''} · ${item.period || ''}
          </div>
          <div style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px;">
            ${item.place}
          </div>
          ${item.category ? `
            <div style="display: inline-block; font-size: 11px; padding: 2px 8px; background: #f4f4f5; color: #666; border-radius: 999px; margin-bottom: 6px;">
              ${item.category}
            </div>
          ` : ''}
          ${item.address ? `
            <div style="font-size: 12px; color: #999; margin-top: 4px;">
              📍 ${item.address}
            </div>
          ` : ''}
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // 경로 점선 연결
    if (pathCoords.length > 1) {
      const polyline = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0,
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 0.7,
            strokeWeight: 3,
            scale: 4,
          },
          offset: '0',
          repeat: '15px',
        }],
      });
      polyline.setMap(mapInstanceRef.current);
      markersRef.current.push(polyline);
    }

    // 모든 마커가 보이도록 줌 조정
    if (validSchedule.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, 60);
    }
  }, [schedule, mapReady, dayNumber]);

  useEffect(() => {
    return () => {
      markersRef.current.forEach(item => {
        if (item.setMap) item.setMap(null);
      });
      markersRef.current = [];
    };
  }, []);

  if (error) {
    return (
      <div className="map-error">
        <div className="map-error-icon">🗺️</div>
        <p className="map-error-msg">{error}</p>
        <p className="map-error-hint">
          관리자에게 문의하거나 구글 지도 API 설정을 확인해주세요
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

export default GoogleMap;