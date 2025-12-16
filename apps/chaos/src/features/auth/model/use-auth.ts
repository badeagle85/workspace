"use client"

import { useState, useCallback, useEffect } from "react"

const AUTH_STORAGE_KEY = "wc3-chaos-auth"

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 초기 로드 시 저장된 인증 상태 확인
  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (stored === "true") {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        setIsAuthenticated(true)
        sessionStorage.setItem(AUTH_STORAGE_KEY, "true")
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  }, [])

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}
