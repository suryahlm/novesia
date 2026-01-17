import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: "Email and password required" },
                { status: 400 }
            )
        }

        // Find admin user (by role)
        const admin = await prisma.user.findFirst({
            where: { role: "ADMIN" }
        })

        if (!admin) {
            return NextResponse.json(
                { success: false, error: "Admin user not found" },
                { status: 404 }
            )
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Update admin credentials
        const updated = await prisma.user.update({
            where: { id: admin.id },
            data: {
                email: email,
                password: hashedPassword,
            }
        })

        return NextResponse.json({
            success: true,
            message: "Admin credentials updated successfully!",
            email: updated.email,
        })
    } catch (error: any) {
        console.error("Update error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
