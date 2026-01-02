"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { BookOpen, Mail, Lock, Chrome, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react"

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/"

    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            })

            if (result?.error) {
                setError("Email atau password salah")
            } else {
                // Redirect to callbackUrl or homepage
                router.push(callbackUrl)
                router.refresh()
            }
        } catch {
            setError("Terjadi kesalahan, silakan coba lagi")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        await signIn("google", { callbackUrl })
    }

    return (
        <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-6">
                    <BookOpen className="w-10 h-10 text-[var(--color-primary)]" />
                    <span className="text-2xl font-bold gradient-text">Novesia</span>
                </Link>
                <h1 className="text-2xl font-bold mb-2">Selamat Datang Kembali</h1>
                <p className="text-[var(--text-secondary)]">
                    Masuk untuk melanjutkan membaca novel favoritmu
                </p>
            </div>

            {/* Login Form */}
            <div className="card p-6 sm:p-8">
                {error && (
                    <div className="flex items-center gap-2 p-3 mb-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                placeholder="nama@email.com"
                                className="input pl-10"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">Password</label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-[var(--color-primary)] hover:underline"
                            >
                                Lupa password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                placeholder="••••••••"
                                className="input pl-10 pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary w-full py-3 text-base"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                Masuk
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[var(--bg-tertiary)]" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[var(--bg-primary)] text-[var(--text-muted)]">
                            atau
                        </span>
                    </div>
                </div>

                {/* Social Login */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="btn btn-secondary w-full py-3"
                >
                    <Chrome className="w-5 h-5 mr-2" />
                    Masuk dengan Google
                </button>
            </div>

            {/* Register Link */}
            <p className="text-center mt-6 text-[var(--text-secondary)]">
                Belum punya akun?{" "}
                <Link
                    href="/register"
                    className="text-[var(--color-primary)] font-medium hover:underline"
                >
                    Daftar sekarang
                </Link>
            </p>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
            <Suspense fallback={
                <div className="w-full max-w-md text-center">
                    <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    )
}
