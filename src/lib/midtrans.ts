import Midtrans from "midtrans-client"

// Snap client untuk membuat transaksi
const snap = new Midtrans.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
})

// Core API untuk transaksi langsung
const coreApi = new Midtrans.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
})

export interface CreateTransactionParams {
    orderId: string
    grossAmount: number
    customerName: string
    customerEmail: string
    itemName: string
    itemId: string
    quantity?: number
}

export async function createSnapTransaction(params: CreateTransactionParams) {
    const { orderId, grossAmount, customerName, customerEmail, itemName, itemId, quantity = 1 } = params

    const transaction = await snap.createTransaction({
        transaction_details: {
            order_id: orderId,
            gross_amount: grossAmount,
        },
        item_details: [
            {
                id: itemId,
                price: grossAmount,
                quantity: quantity,
                name: itemName,
            },
        ],
        customer_details: {
            first_name: customerName,
            email: customerEmail,
        },
    })

    return {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
    }
}

export async function getTransactionStatus(orderId: string) {
    try {
        const status = await coreApi.transaction.status(orderId)
        return status
    } catch (error) {
        console.error("Error getting transaction status:", error)
        return null
    }
}

export { snap, coreApi }
