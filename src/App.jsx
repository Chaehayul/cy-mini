// src/App.jsx
import { useEffect, useState } from "react";
import "./App.css"; 
// [수정] db, storage 및 firestore/storage 함수들 추가
import { auth, provider, appleProvider, db, storage } from "./lib/firebase"; 
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Home from "./Home";

// -------------------------------------------------------------------
// [수정] 닉네임 및 프로필 사진 설정 컴포넌트
// -------------------------------------------------------------------
function NicknameSetup({ user, onNicknameSet }) {
  const [nickname, setNickname] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  // [수정] 구글/애플 프로필 사진으로 미리보기 초기화
  const [imagePreview, setImagePreview] = useState(user.photoURL || "https://placehold.co/150x150/e0e0e0/000?text=Profile");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // [신규] 이미지 파일 선택 시 미리보기 업데이트
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      // FileReader로 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // [신규] 이미지 제거 버튼 핸들러
  const handleRemoveImage = () => {
    setProfileImageFile(null); // 파일 선택 취소
    setImagePreview("https://placehold.co/150x150/e0e0e0/000?text=Profile"); // 기본 이미지로 변경
    // input 값 초기화 (같은 파일 다시 선택 가능하도록)
    const fileInput = document.getElementById("profile-image-input");
    if(fileInput) fileInput.value = "";
  }

  const handleSave = async () => {
    if (!nickname.trim()) return alert("닉네임을 입력하세요!");
    setIsSubmitting(true);
    try {
      // --- [수정] 프로필 사진 업로드 로직 ---
      let finalPhotoURL = user.photoURL; // 기본값은 구글/애플 프로필 사진

      if (profileImageFile) {
        // 1. 새 이미지를 선택한 경우: Firebase Storage에 업로드
        const storageRef = ref(storage, `profile_images/${user.uid}/${Date.now()}_${profileImageFile.name}`);
        await uploadBytes(storageRef, profileImageFile);
        finalPhotoURL = await getDownloadURL(storageRef); // 업로드된 이미지의 URL 가져오기
      } else if (imagePreview.includes('placehold.co')) {
        // 2. '사진 제거'를 누른 경우: URL을 빈 값으로 설정 (기본 이미지가 표시됨)
        finalPhotoURL = "";
      }
      // 3. 아무것도 안 건드린 경우: 기존 user.photoURL 유지
      // ------------------------------------

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: nickname.trim(),
        photoURL: finalPhotoURL, // [추가] 최종 프로필 사진 URL 저장
        nicknameSet: true
      });
      
      onNicknameSet({ 
        ...user, 
        displayName: nickname.trim(), 
        photoURL: finalPhotoURL, // [추가] App 상태에도 사진 URL 업데이트
        nicknameSet: true 
      });
    } catch (e) {
      alert("저장 오류: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="brand-title" style={{ fontSize: '28px' }}>🌸 프로필 설정 🌸</h2>
      
      {/* --- [신규] 프로필 사진 설정 UI --- */}
      <div className="profile-image-setup">
        <label htmlFor="profile-image-input" className="profile-image-label">
          <img src={imagePreview} alt="Profile Preview" className="profile-preview-img" />
          <span>사진 변경</span>
        </label>
        <input
            id="profile-image-input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
        />
      </div>
      <button className="btn-remove-image" onClick={handleRemoveImage}>사진 제거</button>
      {/* ------------------------------------ */}

      <input
        type="text"
        className="form-nickname-input"
        placeholder="닉네임 (예: 춘삼)"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <button 
        className="btn" 
        onClick={handleSave} 
        disabled={isSubmitting || !nickname.trim()}
      >
        {isSubmitting ? "저장 중..." : "다이어리 시작하기"}
      </button>
    </div>
  );
}


// -------------------------------------------------------------------
// 메인 App 컴포넌트 (로직 변경 없음, 이전과 동일)
// -------------------------------------------------------------------
export default function App() {
  const [user, setUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (authUser) => {
      try {
        if (authUser) {
          const userRef = doc(db, "users", authUser.uid);
          const userSnap = await getDoc(userRef);
          let userData;

          if (userSnap.exists()) {
            userData = userSnap.data();
          } else {
            userData = {
              email: authUser.email,
              // [수정] photoURL은 구글/애플의 것을 임시로 저장
              photoURL: authUser.photoURL, 
              coupleId: "choonsam_choondol_200502",
              nicknameSet: false
            };
            await setDoc(userRef, userData);
          }

          setUser({
            uid: authUser.uid,
            ...userData,
            photoURL: userSnap.exists() ? userData.photoURL : authUser.photoURL,
          });

        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("인증 처리 중 오류 발생:", error);
        alert("데이터를 불러오는 중 오류가 발생했습니다: " + error.message);
        setUser(null); 
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    try { await signInWithPopup(auth, provider); } 
    catch (e) { alert("Google 로그인 에러: " + e.message); }
  };

  const loginWithApple = async () => {
    try { await signInWithPopup(auth, appleProvider); } 
    catch (e) { if (e.code !== 'auth/cancelled-popup-request') { alert("Apple 로그인 에러: " + e.message); } }
  };

  const logout = async () => {
    if (confirm("로그아웃 하시겠어요?")) {
      await signOut(auth);
      setUser(null);
    }
  };

  const handleNicknameSet = (updatedUser) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="login-container" style={{ opacity: 0.7 }}>
        <h1 className="brand-title">🌸 Choonsam_Choondol's Diary 🌸</h1>
        <h2>로딩 중...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-container">
        <h1 className="brand-title">🌸 Choonsam_Choondol's Diary 🌸</h1>
        <button className="btn" onClick={loginWithGoogle}>Google 로그인</button>
        <button className="btn-dark" onClick={loginWithApple}>Apple로 로그인</button>
      </div>
    );
  }

  if (!user.nicknameSet) {
    return <NicknameSetup user={user} onNicknameSet={handleNicknameSet} />;
  }

  return <Home user={user} logout={logout} />;
}
