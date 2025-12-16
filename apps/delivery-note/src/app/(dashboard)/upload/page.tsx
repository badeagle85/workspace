"use client";

import Link from "next/link";
import { Cpu, Cloud, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">거래명세서 업로드</h1>
        <p className="text-muted-foreground mt-2">
          OCR 엔진을 선택하세요
        </p>
      </div>

      {/* OCR Engine Selection */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Tesseract.js Option */}
        <Link href="/upload/tesseract">
          <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-md group">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                <Cpu className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Tesseract.js</CardTitle>
              <CardDescription>무료 · 로컬 처리</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="text-sm text-muted-foreground">
                <p>템플릿 기반 OCR</p>
                <p>API 키 불필요</p>
                <p>무제한 사용</p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                  선택하기 <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Google Vision Option */}
        <Link href="/upload/google">
          <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-md group">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Google Vision</CardTitle>
              <CardDescription>유료 · 클라우드</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="text-sm text-muted-foreground">
                <p>자동 인식</p>
                <p>높은 정확도</p>
                <p>월 1,000건 무료</p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                  선택하기 <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          설정에서 기본 OCR 엔진을 변경할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
