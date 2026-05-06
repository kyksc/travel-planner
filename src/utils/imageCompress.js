// 이미지 압축 유틸리티
// Canvas API를 사용해서 이미지를 작게 리사이즈하고 Base64로 변환

/**
 * 이미지 파일을 압축해서 Base64 문자열로 변환
 * @param {File} file - 업로드된 이미지 파일
 * @param {Object} options - { maxWidth, maxHeight, quality }
 * @returns {Promise<string>} Base64 데이터 URL
 */
export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 400,    // 최대 너비 (프로필용)
    maxHeight = 400,   // 최대 높이
    quality = 0.8      // JPEG 품질 (0~1)
  } = options;

  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('파일이 없습니다'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('이미지 파일만 업로드 가능합니다'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 비율 유지하면서 리사이즈
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Canvas에 그려서 압축
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // 부드러운 이미지 보간
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG로 변환 (PNG보다 용량 작음)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // 사이즈 체크 (Firestore 제한 고려)
        const sizeInKB = (compressedBase64.length * 0.75) / 1024;
        
        if (sizeInKB > 700) {
          // 너무 크면 더 압축
          const moreCompressed = canvas.toDataURL('image/jpeg', 0.6);
          resolve(moreCompressed);
        } else {
          resolve(compressedBase64);
        }
      };
      
      img.onerror = () => reject(new Error('이미지 로딩 실패'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
};
