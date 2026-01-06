declare module 'midtrans-client' {
    interface SnapConfig {
        isProduction: boolean
        serverKey: string
        clientKey: string
    }

    interface TransactionDetails {
        order_id: string
        gross_amount: number
    }

    interface ItemDetail {
        id: string
        price: number
        quantity: number
        name: string
    }

    interface CustomerDetails {
        first_name?: string
        last_name?: string
        email?: string
        phone?: string
    }

    interface SnapTransactionParams {
        transaction_details: TransactionDetails
        item_details?: ItemDetail[]
        customer_details?: CustomerDetails
    }

    interface SnapTransaction {
        token: string
        redirect_url: string
    }

    interface TransactionStatus {
        transaction_status: string
        fraud_status?: string
        order_id: string
        status_code: string
        gross_amount: string
    }

    class Snap {
        constructor(config: SnapConfig)
        createTransaction(params: SnapTransactionParams): Promise<SnapTransaction>
    }

    class CoreApi {
        constructor(config: SnapConfig)
        transaction: {
            status(orderId: string): Promise<TransactionStatus>
        }
    }

    export { Snap, CoreApi }
}
