import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompress';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null); // 업로드 전 미리보기
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 프로필 정보 로드
  useEffect(() => {
    if (userProfile) {
      setNickname(userProfile.nickname || '');
      setBio(userProfile.bio || '');
      setPhotoBase64(userProfile.photoBase64 || null);
    }
  }, [userProfile]);

  // 사진 선택 시
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('파일 크기는 5MB 이하여야 합니다');
      }

      // 이미지 압축 + Base64 변환
      const compressed = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8
      });

      setPreviewPhoto(compressed);
      setPhotoBase64(compressed);
      setSuccess('사진이 선택되었어요. 저장 버튼을 눌러주세요!');
    } catch (err) {
      setError(err.message || '이미지 처리 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
      // 같은 파일 다시 선택 가능하게 reset
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 사진 제거
  const handleRemovePhoto = () => {
    if (window.confirm('프로필 사진을 제거하시겠습니까?')) {
      setPhotoBase64(null);
      setPreviewPhoto(null);
      setSuccess('사진이 제거되었어요. 저장 버튼을 눌러주세요!');
    }
  };

  // 프로필 저장
  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요');
      return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setError('닉네임은 2~20자로 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({
        nickname: nickname.trim(),
        bio: bio.trim(),
        photoBase64: photoBase64
      });
      
      setSuccess('✓ 프로필이 저장되었습니다!');
      setPreviewPhoto(null);
      
      // 3초 후 메시지 사라지게
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('저장 실패: ' + (err.message || '다시 시도해주세요'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return;
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 닉네임 첫 글자 (사진 없을 때 표시용)
  const getInitial = () => {
    return nickname?.charAt(0)?.toUpperCase() || '?';
  };

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="container">
          <p>로그인이 필요합니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>프로필 설정</h1>
          <p>나만의 프로필을 꾸며보세요</p>
        </div>

        <div className="profile-card">
          {/* 프로필 사진 영역 */}
          <div className="photo-section">
            <div className="photo-wrapper">
              {photoBase64 ? (
                <img src={photoBase64} alt="프로필" className="profile-photo" />
              ) : (
                <div className="profile-photo-placeholder">
                  {getInitial()}
                </div>
              )}
              
              {uploading && (
                <div className="photo-loading">
                  <div className="photo-spinner"></div>
                </div>
              )}
            </div>

            <div className="photo-actions">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="btn-photo-upload"
                disabled={uploading || saving}
              >
                📷 {photoBase64 ? '사진 변경' : '사진 업로드'}
              </button>
              
              {photoBase64 && (
                <button 
                  onClick={handleRemovePhoto}
                  className="btn-photo-remove"
                  disabled={uploading || saving}
                >
                  🗑️ 제거
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
            </div>
            
            <p className="photo-hint">
              JPG, PNG 권장 · 자동으로 압축돼요
            </p>
          </div>

          {/* 정보 입력 영역 */}
          <div className="info-section">
            {/* 이메일 (수정 불가) */}
            <div className="info-field">
              <label>이메일</label>
              <div className="email-display">
                <span>{currentUser.email}</span>
                <span className="badge">변경 불가</span>
              </div>
            </div>

            {/* 닉네임 */}
            <div className="info-field">
              <label htmlFor="nickname">
                닉네임 <span className="required">*</span>
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="2~20자로 입력"
                maxLength={20}
                disabled={saving}
              />
              <span className="char-count">{nickname.length}/20</span>
            </div>

            {/* 자기소개 */}
            <div className="info-field">
              <label htmlFor="bio">자기소개</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="간단한 자기소개를 입력해주세요 (선택)"
                maxLength={100}
                rows={3}
                disabled={saving}
              />
              <span className="char-count">{bio.length}/100</span>
            </div>

            {/* 메시지 */}
            {error && <div className="message error">⚠️ {error}</div>}
            {success && <div className="message success">{success}</div>}

            {/* 액션 버튼 */}
            <div className="action-buttons">
              <button
                onClick={handleSave}
                className="btn-save"
                disabled={saving || uploading}
              >
                {saving ? (
                  <>
                    <span className="btn-spinner"></span>
                    저장 중...
                  </>
                ) : (
                  '✓ 프로필 저장'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 계정 관리 */}
        <div className="account-section">
          <h2>계정 관리</h2>
          <div className="account-actions">
            <button onClick={handleLogout} className="btn-logout">
              🚪 로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
