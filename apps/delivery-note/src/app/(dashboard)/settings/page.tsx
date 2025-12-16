"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSettingsStore, type OcrProvider } from "@/stores/settingsStore";
import { Check, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const { ocrProvider, setOcrProvider } = useSettingsStore();

  const handleOcrProviderChange = (provider: OcrProvider) => {
    setOcrProvider(provider);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground mt-1">
          애플리케이션 설정을 관리합니다.
        </p>
      </div>

      {/* OCR Engine Settings */}
      <Card>
        <CardHeader>
          <CardTitle>OCR 엔진 설정</CardTitle>
          <CardDescription>
            이미지 텍스트 추출에 사용할 엔진을 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tesseract Option */}
          <button
            type="button"
            onClick={() => handleOcrProviderChange("tesseract")}
            className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
              ocrProvider === "tesseract"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">Tesseract.js</p>
                <p className="text-xs text-muted-foreground mt-1">
                  무료 / 무제한 / 로컬 처리 / API 키 불필요
                </p>
                <p className="text-xs text-orange-500 mt-1">
                  한글 손글씨 인식 성능 약함
                </p>
              </div>
              {ocrProvider === "tesseract" && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </button>

          {/* Google Cloud Vision Option */}
          <button
            type="button"
            onClick={() => handleOcrProviderChange("google")}
            className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
              ocrProvider === "google"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">Google Cloud Vision</p>
                <p className="text-xs text-muted-foreground mt-1">
                  월 1,000건 무료 / 높은 정확도 / API 키 필요
                </p>
                <p className="text-xs text-green-600 mt-1">
                  한글 손글씨 인식 우수
                </p>
              </div>
              {ocrProvider === "google" && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </button>

          {/* Google Cloud Vision API Key Guide */}
          {ocrProvider === "google" && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                Google Cloud Vision API 키 설정 방법
              </p>
              <ol className="mt-2 text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1"
                  >
                    Google Cloud Console <ExternalLink className="h-3 w-3" />
                  </a>
                  에 로그인
                </li>
                <li>새 프로젝트 생성 또는 기존 프로젝트 선택</li>
                <li>
                  <a
                    href="https://console.cloud.google.com/apis/library/vision.googleapis.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1"
                  >
                    Cloud Vision API <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}사용 설정
                </li>
                <li>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1"
                  >
                    사용자 인증 정보 <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}페이지에서 API 키 생성
                </li>
                <li>
                  프로젝트 루트의 <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">.env.local</code> 파일에 추가:
                </li>
              </ol>
              <pre className="mt-2 p-2 bg-blue-100 dark:bg-blue-900 rounded text-xs overflow-x-auto">
                GOOGLE_CLOUD_API_KEY=your_api_key_here
              </pre>
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                * 서버 재시작 후 적용됩니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card>
        <CardHeader>
          <CardTitle>내보내기 설정</CardTitle>
          <CardDescription>
            데이터 내보내기 형식 및 옵션
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">기본 내보내기 형식</label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                Excel (.xlsx)
              </Button>
              <Button variant="secondary" size="sm" className="flex-1">
                CSV
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">날짜 형식</label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                YYYY-MM-DD
              </Button>
              <Button variant="secondary" size="sm" className="flex-1">
                YYYY/MM/DD
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>데이터 관리</CardTitle>
          <CardDescription>
            저장된 데이터 관리 옵션
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">데이터 백업</p>
              <p className="text-sm text-muted-foreground">
                모든 매핑 규칙 및 거래 데이터를 백업합니다.
              </p>
            </div>
            <Button variant="outline">백업 생성</Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">데이터 복원</p>
              <p className="text-sm text-muted-foreground">
                백업 파일에서 데이터를 복원합니다.
              </p>
            </div>
            <Button variant="outline">복원</Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
            <div>
              <p className="font-medium text-destructive">데이터 초기화</p>
              <p className="text-sm text-muted-foreground">
                모든 데이터를 삭제하고 초기 상태로 되돌립니다.
              </p>
            </div>
            <Button variant="destructive">초기화</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
