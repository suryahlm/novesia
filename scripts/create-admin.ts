import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createAdminUser() {
    console.log("🔧 Creating admin user...")

    try {
        // Check if admin exists
        const existing = await prisma.user.findUnique({
            where: { email: "admin@novesia.com" }
        })

        if (existing) {
            console.log("✅ Admin user already exists")
            return
        }

        // Create admin
        const hashedPassword = await bcrypt.hash("admin123", 10)

        const admin = await prisma.user.create({
            data: {
                email: "admin@novesia.com",
                password: hashedPassword,
                name: "Admin Novesia",
                role: "ADMIN",
                coins: 10000,
                isVip: true,
            }
        })

        console.log("✅ Admin user created successfully!")
        console.log("   Email: admin@novesia.com")
        console.log("   Password: admin123")

    } catch (error) {
        console.error("❌ Error creating admin:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

createAdminUser()
