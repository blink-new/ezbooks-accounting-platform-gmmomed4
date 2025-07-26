import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: false
});

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { frequency, userId } = await req.json();
    
    // Get user's notification settings
    const settings = await blink.db.notificationSchedules.list({
      where: { userId, frequency, isActive: true }
    });

    if (settings.length === 0) {
      return new Response(JSON.stringify({ message: 'No active notifications for this frequency' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Trigger notifications for each active setting
    const results = [];
    for (const setting of settings) {
      try {
        // Call the notification scheduler function
        const response = await fetch('https://gmmomed4-s53psddp0j8k.deno.dev', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: setting.userId,
            reportType: setting.reportType,
            frequency: setting.frequency,
            email: setting.email,
            currency: setting.currency,
            includeCharts: setting.includeCharts
          })
        });

        const result = await response.json();
        results.push({
          reportType: setting.reportType,
          success: response.ok,
          result
        });
      } catch (error) {
        results.push({
          reportType: setting.reportType,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      message: 'Notification trigger completed',
      results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Notification trigger error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to trigger notifications',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});