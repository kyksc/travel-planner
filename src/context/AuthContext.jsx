import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth는 AuthProvider 안에서 사용되어야 합니다');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Firestore에 저장된 추가 프로필 정보
  const [loading, setLoading] = useState(true);

  // Firestore에서 사용자 프로필 정보 가져오기
  const fetchUserProfile = async (user) => {
    if (!user) return null;
    
    try {
      const profileRef = doc(db, 'users', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        return profileSnap.data();
      } else {
        // 프로필이 없으면 기본 프로필 생성
        const defaultProfile = {
          uid: user.uid,
          email: user.email,
          nickname: user.displayName || user.email?.split('@')[0] || '여행자',
          photoBase64: null, // 프로필 사진 (Base64)
          bio: '',
          createdAt: new Date().toISOString()
        };
        await setDoc(profileRef, defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error('프로필 불러오기 실패:', error);
      return null;
    }
  };

  // 회원가입
  const signup = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    
    // Firestore에도 프로필 생성
    const profileRef = doc(db, 'users', result.user.uid);
    await setDoc(profileRef, {
      uid: result.user.uid,
      email: result.user.email,
      nickname: displayName || email.split('@')[0],
      photoBase64: null,
      bio: '',
      createdAt: new Date().toISOString()
    });
    
    return result;
  };

  // 이메일/비밀번호 로그인
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 구글 로그인
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    
    // 구글 로그인 시에도 프로필이 없으면 생성
    const profileRef = doc(db, 'users', result.user.uid);
    const profileSnap = await getDoc(profileRef);
    
    if (!profileSnap.exists()) {
      await setDoc(profileRef, {
        uid: result.user.uid,
        email: result.user.email,
        nickname: result.user.displayName || result.user.email?.split('@')[0] || '여행자',
        photoBase64: null,
        bio: '',
        createdAt: new Date().toISOString()
      });
    }
    
    return result;
  };

  // 로그아웃
  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  // 프로필 업데이트 (닉네임, 사진, 자기소개)
  const updateUserProfile = async (updates) => {
    if (!currentUser) throw new Error('로그인이 필요합니다');
    
    const profileRef = doc(db, 'users', currentUser.uid);
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    // Firebase Auth의 displayName도 업데이트 (닉네임 변경 시)
    if (updates.nickname) {
      await updateProfile(currentUser, { displayName: updates.nickname });
    }
    
    // 로컬 상태 업데이트
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const profile = await fetchUserProfile(user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
    refreshProfile: () => fetchUserProfile(currentUser).then(setUserProfile)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
