import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: false
});

serve(async (req) => {
  // Handle CORS for frontend calls
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return new Response('Missing Stripe signature', { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Parse the event
    let event;
    try {
      // For now, we'll parse the JSON directly
      // In production, you'd want to verify the signature properly
      event = JSON.parse(body);
    } catch (err) {
      console.error('Invalid JSON:', err);
      return new Response('Invalid JSON', { status: 400 });
    }

    console.log('Received webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 500 });
  }
});

async function handleSubscriptionChange(subscription: any) {
  try {
    const userId = subscription.metadata?.user_id;
    const plan = subscription.metadata?.plan;
    
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    // Update user subscription in database
    await blink.db.users.update(userId, {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPlan: plan,
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log(`Updated subscription for user ${userId}: ${plan} (${subscription.status})`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionCancellation(subscription: any) {
  try {
    const userId = subscription.metadata?.user_id;
    
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    // Update user subscription status
    await blink.db.users.update(userId, {
      subscriptionStatus: 'canceled',
      updatedAt: new Date().toISOString()
    });

    console.log(`Canceled subscription for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSuccess(invoice: any) {
  try {
    const subscriptionId = invoice.subscription;
    
    if (subscriptionId) {
      // You could log successful payments, send confirmation emails, etc.
      console.log(`Payment succeeded for subscription ${subscriptionId}`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(invoice: any) {
  try {
    const subscriptionId = invoice.subscription;
    
    if (subscriptionId) {
      // Handle failed payments - could send notification emails, etc.
      console.log(`Payment failed for subscription ${subscriptionId}`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}