import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { isValidEmail } from "@/lib/utils"

// POST /api/auth/register - Register new user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password, name, referralCode } = body

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            )
        }

        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            )
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
                coins: 50, // Welcome bonus
            },
        })

        // Handle referral
        if (referralCode) {
            const referrer = await prisma.user.findFirst({
                where: { id: referralCode },
            })

            if (referrer) {
                // Create referral record
                await prisma.referral.create({
                    data: {
                        referrerId: referrer.id,
                        referredId: user.id,
                    },
                })

                // Calculate VIP expiry (extend 3 days from now or from current expiry)
                const now = new Date()
                const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

                // For referrer: extend VIP if already VIP, or set new expiry
                const referrerNewExpiry = referrer.vipExpiresAt && referrer.vipExpiresAt > now
                    ? new Date(referrer.vipExpiresAt.getTime() + 3 * 24 * 60 * 60 * 1000)
                    : threeDaysLater

                // Give bonus to referrer: 50 coins + 3 days VIP
                await prisma.user.update({
                    where: { id: referrer.id },
                    data: {
                        coins: { increment: 50 },
                        isVip: true,
                        vipExpiresAt: referrerNewExpiry,
                    },
                })

                // Give bonus to referred user: 50 coins + 3 days VIP
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        coins: { increment: 50 },
                        isVip: true,
                        vipExpiresAt: threeDaysLater,
                    },
                })

                // Log transactions
                await prisma.transaction.createMany({
                    data: [
                        {
                            userId: referrer.id,
                            type: "REFERRAL_BONUS",
                            amount: 50,
                            status: "SUCCESS",
                            description: `Referral bonus (50 koin + 3 hari VIP) for inviting ${user.email}`,
                        },
                        {
                            userId: user.id,
                            type: "REFERRAL_BONUS",
                            amount: 50,
                            status: "SUCCESS",
                            description: "Bonus pendaftaran dengan referral (50 koin + 3 hari VIP)",
                        },
                    ],
                })
            }
        }

        return NextResponse.json(
            {
                message: "Registration successful",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    coins: user.coins,
                },
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "Registration failed" },
            { status: 500 }
        )
    }
}
