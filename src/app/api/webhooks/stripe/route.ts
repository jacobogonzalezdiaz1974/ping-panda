import { db } from "@/db"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers" // Este import ya no es necesario si estás usando `req`
import Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()
  
  // Obtener la firma desde los headers de la solicitud
  const signature = req.headers.get("stripe-signature") // Usamos `req.headers.get()` en lugar de `headers()`

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    )

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const { userId } = session.metadata || { userId: null }

      if (!userId) {
        return new Response("Invalid metadata", { status: 400 })
      }

      await db.user.update({
        where: { id: userId },
        data: { plan: "PRO" },
      })
    }

    return new Response("OK")
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response("Webhook Error", { status: 500 })
  }
}
