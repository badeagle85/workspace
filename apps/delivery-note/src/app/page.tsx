import Link from "next/link";
import { ArrowRight, Upload, FileText, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Delivery Note</h1>
          <Link
            href="/upload"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            시작하기
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            거래명세서를
            <br />
            <span className="text-primary">자동으로 변환</span>하세요
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            거래명세서 이미지를 업로드하면 제조사별로 다른 품명을
            <br />
            통일된 ERP 품명으로 자동 변환합니다.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors"
          >
            이미지 업로드하기
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Example Card */}
        <div className="max-w-2xl mx-auto mt-16 bg-white rounded-xl shadow-lg border p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">변환 예시</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">거래명세서</p>
                <p className="font-mono text-sm">CBR 100AF 2P (SEC-102 60A)</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 bg-primary/5 rounded-lg p-4 border border-primary/20">
                <p className="text-xs text-primary mb-1">ERP 품명</p>
                <p className="font-mono text-sm text-primary font-medium">
                  누전차단기 2P100AF[小] 60A
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">이미지 업로드</h3>
            <p className="text-sm text-muted-foreground">
              거래명세서 이미지를 드래그 앤 드롭으로 간편하게 업로드
            </p>
          </div>
          <div className="bg-white rounded-xl border p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">OCR 텍스트 추출</h3>
            <p className="text-sm text-muted-foreground">
              AI 기반 OCR로 정확하게 품명 정보를 추출
            </p>
          </div>
          <div className="bg-white rounded-xl border p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">품명 자동 변환</h3>
            <p className="text-sm text-muted-foreground">
              제조사별 품명을 통일된 ERP 품명으로 자동 변환
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 Delivery Note. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
