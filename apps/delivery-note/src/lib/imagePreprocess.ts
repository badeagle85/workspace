/**
 * 이미지 전처리 유틸리티
 * OCR 정확도를 높이기 위한 이미지 처리 함수들
 */

/**
 * 이미지를 그레이스케일로 변환
 */
export function toGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  return imageData;
}

/**
 * 대비 향상 (Contrast Enhancement)
 * factor: 1.0 = 원본, >1.0 = 대비 증가
 */
export function enhanceContrast(imageData: ImageData, factor: number = 1.5): ImageData {
  const data = imageData.data;
  const intercept = 128 * (1 - factor);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * data[i] + intercept));
    data[i + 1] = Math.min(255, Math.max(0, factor * data[i + 1] + intercept));
    data[i + 2] = Math.min(255, Math.max(0, factor * data[i + 2] + intercept));
  }
  return imageData;
}

/**
 * 이진화 (Binarization) - Otsu's method
 * 손글씨 인식에 효과적
 */
export function binarize(imageData: ImageData, threshold?: number): ImageData {
  const data = imageData.data;

  // threshold가 없으면 Otsu's method로 자동 계산
  if (threshold === undefined) {
    threshold = calculateOtsuThreshold(imageData);
  }

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const value = gray > threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  return imageData;
}

/**
 * Otsu's threshold 계산
 */
function calculateOtsuThreshold(imageData: ImageData): number {
  const data = imageData.data;
  const histogram = new Array(256).fill(0);

  // 히스토그램 생성
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    histogram[gray]++;
  }

  const total = data.length / 4;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * 노이즈 제거 (간단한 median filter)
 */
export function removeNoise(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const values: number[] = [];

      // 3x3 neighborhood
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          values.push(data[idx]);
        }
      }

      values.sort((a, b) => a - b);
      const median = values[4]; // 중간값

      const idx = (y * width + x) * 4;
      output[idx] = median;
      output[idx + 1] = median;
      output[idx + 2] = median;
    }
  }

  for (let i = 0; i < data.length; i++) {
    data[i] = output[i];
  }

  return imageData;
}

/**
 * 샤프닝 (Sharpening)
 * 흐린 텍스트를 선명하게
 */
export function sharpen(imageData: ImageData, strength: number = 1): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);

  // 샤프닝 커널
  const kernel = [
    0, -strength, 0,
    -strength, 1 + 4 * strength, -strength,
    0, -strength, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      let k = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          sum += data[idx] * kernel[k];
          k++;
        }
      }

      const idx = (y * width + x) * 4;
      const value = Math.min(255, Math.max(0, sum));
      output[idx] = value;
      output[idx + 1] = value;
      output[idx + 2] = value;
    }
  }

  for (let i = 0; i < data.length; i++) {
    data[i] = output[i];
  }

  return imageData;
}

/**
 * 이미지 전처리 파이프라인
 * 손글씨 숫자 인식에 최적화된 순서로 처리
 */
export async function preprocessImage(
  imageSource: string,
  options: {
    grayscale?: boolean;
    contrast?: number;
    binarize?: boolean;
    removeNoise?: boolean;
    sharpen?: boolean;
  } = {}
): Promise<string> {
  const {
    grayscale = true,
    contrast = 1.8,
    binarize: doBinarize = true,
    removeNoise: doRemoveNoise = true,
    sharpen: doSharpen = false,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 전처리 파이프라인
      if (grayscale) {
        imageData = toGrayscale(imageData);
      }

      if (contrast && contrast !== 1) {
        imageData = enhanceContrast(imageData, contrast);
      }

      if (doRemoveNoise) {
        imageData = removeNoise(imageData);
      }

      if (doSharpen) {
        imageData = sharpen(imageData);
      }

      if (doBinarize) {
        imageData = binarize(imageData);
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSource;
  });
}

/**
 * 숫자 전용 전처리 (수량 영역에 사용)
 * 더 강한 이진화 적용
 */
export async function preprocessForNumbers(imageSource: string): Promise<string> {
  return preprocessImage(imageSource, {
    grayscale: true,
    contrast: 2.0,  // 더 강한 대비
    binarize: true,
    removeNoise: true,
    sharpen: true,
  });
}

/**
 * 텍스트 전용 전처리 (품명 영역에 사용)
 * 알파벳/한글 혼합 텍스트에 최적화 - 이진화를 하지 않음
 */
export async function preprocessForText(imageSource: string): Promise<string> {
  return preprocessImage(imageSource, {
    grayscale: true,
    contrast: 1.3,      // 약한 대비 향상
    binarize: false,    // 이진화 비활성화 (문자 형태 보존)
    removeNoise: false, // 노이즈 제거도 비활성화
    sharpen: false,
  });
}
