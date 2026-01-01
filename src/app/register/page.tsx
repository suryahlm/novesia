"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { BookOpen, Mail, Lock, User, Chrome, ArrowRight, Eye, EyeOff, Check, AlertCircle } from "lucide-react"

export default function RegisterPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        referralCode: "",
    })

    const passwordRequirements = [
        { text: "Minimal 8 karakter", met: formData.password.length >= 8 },
        { text: "Mengandung huruf besar", met: /[A-Z]/.test(formData.password) },
        { text: "Mengandung angka", met: /\d/.test(formData.password) },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        // Check password requirements
        if (formData.password.length < 8) {
            setError("Password minimal 8 karakter")
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || "Registrasi gagal")
                setIsLoading(false)
                return
            }

            setSuccess(true)

            // Auto login after successful registration
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            })

            if (!result?.error) {
                router.push("/")
                router.refresh()
            } else {
                // Registration succeeded but login failed, redirect to login
                router.push("/login?registered=true")
            }
        } catch {
            setError("Terjadi kesalahan, silakan coba lagi")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleRegister = async () => {
        setIsLoading(true)
        await signIn("google", { callbackUrl: "/" })
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <BookOpen className="w-10 h-10 text-[var(--color-primary)]" />
                        <span className="text-2xl font-bold gradient-text">Novesia</span>
                    </Link>
                    <h1 className="text-2xl font-bold mb-2">Buat Akun Baru</h1>
                    <p className="text-[var(--text-secondary)]">
                        Daftar gratis dan mulai baca ribuan novel menarik
                    </p>
                </div>

                {/* Register Form */}
                <div className="card p-6 sm:p-8">
                    {error && (
                        <div className="flex items-center gap-2 p-3 mb-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 p-3 mb-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm">
                            <Check className="w-5 h-5 flex-shrink-0" />
                            <span>Registrasi berhasil! Mengalihkan...</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Nama</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="Nama lengkapmu"
                                    className="input pl-10"
                                    required
                                />
                            </div>
                        </div>

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
                            <label className="block text-sm font-medium mb-2">Password</label>
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
                            {/* Password Requirements */}
                            {formData.password && (
                                <div className="mt-2 space-y-1">
                                    {passwordRequirements.map((req, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-center gap-2 text-xs ${req.met ? "text-green-500" : "text-[var(--text-muted)]"
                                                }`}
                                        >
                                            <Check className={`w-3 h-3 ${req.met ? "" : "opacity-30"}`} />
                                            {req.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Referral Code (Optional) */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Kode Referral{" "}
                                <span className="text-[var(--text-muted)] font-normal">
                                    (opsional)
                                </span>
                            </label>
                            <input
                                type="text"
                                value={formData.referralCode}
                                onChange={(e) =>
                                    setFormData({ ...formData, referralCode: e.target.value })
                                }
                                placeholder="Masukkan kode referral"
                                className="input"
                            />
                        </div>

                        {/* Terms */}
                        <p className="text-xs text-[var(--text-muted)]">
                            Dengan mendaftar, kamu menyetujui{" "}
                            <Link href="/terms" className="text-[var(--color-primary)] hover:underline">
                                Syarat & Ketentuan
                            </Link>{" "}
                            dan{" "}
                            <Link href="/privacy" className="text-[var(--color-primary)] hover:underline">
                                Kebijakan Privasi
                            </Link>{" "}
                            kami.
                        </p>

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
                                    Daftar Sekarang
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
                        onClick={handleGoogleRegister}
                        disabled={isLoading}
                        className="btn btn-secondary w-full py-3"
                    >
                        <Chrome className="w-5 h-5 mr-2" />
                        Daftar dengan Google
                    </button>
                </div>

                {/* Login Link */}
                <p className="text-center mt-6 text-[var(--text-secondary)]">
                    Sudah punya akun?{" "}
                    <Link
                        href="/login"
                        className="text-[var(--color-primary)] font-medium hover:underline"
                    >
                        Masuk di sini
                    </Link>
                </p>
            </div>
        </div>
    )
}
