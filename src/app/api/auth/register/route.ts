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

                // Give bonus to both users
                await prisma.user.update({
                    where: { id: referrer.id },
                    data: { coins: { increment: 50 } },
                })
                await prisma.user.update({
                    where: { id: user.id },
                    data: { coins: { increment: 50 } }, // Extra 50 coins for using referral
                })

                // Log transactions
                await prisma.transaction.createMany({
                    data: [
                        {
                            userId: referrer.id,
                            type: "REFERRAL_BONUS",
                            amount: 50,
                            status: "SUCCESS",
                            description: `Referral bonus for inviting ${user.email}`,
                        },
                        {
                            userId: user.id,
                            type: "REFERRAL_BONUS",
                            amount: 50,
                            status: "SUCCESS",
                            description: "Bonus for using referral code",
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
