import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "카드박스 - 소리가 나는 카드를 보내보세요",
  description: "눈이 내리고, 음악이 흐르는 특별한 카드를 만들어보세요. 무료로 감성 가득한 e-card를 보낼 수 있습니다.",
  keywords: ["e-card", "전자카드", "크리스마스카드", "생일카드", "무료카드"],
  openGraph: {
    title: "카드박스 - 소리가 나는 카드를 보내보세요",
    description: "눈이 내리고, 음악이 흐르는 특별한 카드를 만들어보세요.",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
