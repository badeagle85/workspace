import { NextRequest, NextResponse } from "next/server";

interface GoogleVisionResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    fullTextAnnotation?: {
      text: string;
      pages: Array<{
        blocks: Array<{
          paragraphs: Array<{
            words: Array<{
              symbols: Array<{
                text: string;
                confidence: number;
              }>;
              confidence: number;
            }>;
            confidence: number;
          }>;
          confidence: number;
        }>;
        confidence: number;
      }>;
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

export interface TextAnnotation {
  text: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OcrApiResponse {
  success: boolean;
  data?: {
    text: string;
    confidence: number;
    lines: Array<{
      text: string;
      confidence: number;
    }>;
    annotations?: TextAnnotation[];
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<OcrApiResponse>> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Google Cloud API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "이미지 데이터가 필요합니다." },
        { status: 400 }
      );
    }

    // Data URL에서 base64 부분만 추출
    let base64Image = image;
    if (image.startsWith("data:")) {
      base64Image = image.split(",")[1];
    }

    // Google Cloud Vision API 호출
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: "DOCUMENT_TEXT_DETECTION",
                  maxResults: 1,
                },
              ],
              imageContext: {
                languageHints: ["ko", "en"],
              },
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error("Google Vision API error:", errorText);
      return NextResponse.json(
        { success: false, error: `Google Vision API 오류: ${visionResponse.status}` },
        { status: visionResponse.status }
      );
    }

    const visionData: GoogleVisionResponse = await visionResponse.json();
    const response = visionData.responses[0];

    if (response.error) {
      return NextResponse.json(
        { success: false, error: response.error.message },
        { status: 400 }
      );
    }

    // 결과 파싱
    const fullText = response.fullTextAnnotation?.text ?? "";
    const pages = response.fullTextAnnotation?.pages ?? [];

    // 평균 신뢰도 계산
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const page of pages) {
      if (page.confidence) {
        totalConfidence += page.confidence;
        confidenceCount++;
      }
      for (const block of page.blocks ?? []) {
        if (block.confidence) {
          totalConfidence += block.confidence;
          confidenceCount++;
        }
      }
    }

    const avgConfidence = confidenceCount > 0 ? (totalConfidence / confidenceCount) * 100 : 0;

    // 라인별 텍스트 추출
    const lines: Array<{ text: string; confidence: number }> = [];
    const textLines = fullText.split("\n");

    for (const line of textLines) {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        lines.push({
          text: trimmed,
          confidence: avgConfidence,
        });
      }
    }

    // textAnnotations에서 좌표 정보 추출 (첫 번째는 전체 텍스트이므로 제외)
    const textAnnotations = response.textAnnotations ?? [];
    const annotations: TextAnnotation[] = [];

    for (let i = 1; i < textAnnotations.length; i++) {
      const annotation = textAnnotations[i];
      const vertices = annotation.boundingPoly.vertices;

      // bounding box 계산
      const xs = vertices.map(v => v.x ?? 0);
      const ys = vertices.map(v => v.y ?? 0);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      annotations.push({
        text: annotation.description,
        bounds: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        text: fullText,
        confidence: avgConfidence,
        lines,
        annotations,
      },
    });
  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "OCR 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
