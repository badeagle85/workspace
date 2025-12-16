import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // 환경변수에서 비밀번호 확인
    const validPasswords = [
      process.env.ADMIN_PASSWORD,
      process.env.MASTER_PASSWORD,
      process.env.STAFF_PASSWORD,
    ].filter(Boolean)

    if (validPasswords.includes(password)) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 })
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
