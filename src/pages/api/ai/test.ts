/**
 * OpenRouter Service Test Endpoint
 *
 * GET /api/ai/test
 *
 * Tests the connection to OpenRouter API and returns service configuration status.
 * Requires authentication via Supabase session.
 * Intended for diagnostic and development purposes.
 */

import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/openrouter';
import { OpenRouterError } from '@/lib/openrouter/errors';

export const prerender = false;

/**
 * GET handler for testing OpenRouter connection
 */
export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

  // Check authentication
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'You must be logged in to test the AI service',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Check if API key is configured
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          configured: false,
          error: 'API key not configured',
          message: 'OPENROUTER_API_KEY environment variable is not set',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize service
    const openRouterService = new OpenRouterService({
      apiKey,
    });

    // Test connection
    const startTime = Date.now();
    const connectionSuccess = await openRouterService.testConnection();
    const responseTime = Date.now() - startTime;

    // Get usage stats
    const stats = await openRouterService.getUsageStats();

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        configured: true,
        connection: {
          status: connectionSuccess ? 'connected' : 'failed',
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        },
        service: {
          model: openRouterService.model,
          maxInputLength: openRouterService.maxInputLength,
          isInitialized: openRouterService.isInitialized,
        },
        stats: {
          totalRequests: stats.totalRequests,
          totalTokens: stats.totalTokens,
          totalErrors: stats.totalErrors,
          averageResponseTime: `${Math.round(stats.averageResponseTime)}ms`,
          lastRequestTime: stats.lastRequestTime
            ? new Date(stats.lastRequestTime).toISOString()
            : null,
        },
        message: 'OpenRouter service is configured and operational',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('OpenRouter test connection error:', error);

    // Handle OpenRouter-specific errors
    if (error instanceof OpenRouterError) {
      return new Response(
        JSON.stringify({
          success: false,
          configured: true,
          connection: {
            status: 'error',
            timestamp: new Date().toISOString(),
          },
          error: {
            code: error.code,
            message: error.getUserMessage(),
            statusCode: error.statusCode,
            retryable: error.isRetryable(),
          },
        }),
        {
          status: error.statusCode || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        success: false,
        configured: true,
        connection: {
          status: 'error',
          timestamp: new Date().toISOString(),
        },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * POST handler for testing with custom input
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  // Check authentication
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'You must be logged in to test the AI service',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const testInput = body.input || 'Hello, this is a test message.';

    // Check if API key is configured
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API key not configured',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize service
    const openRouterService = new OpenRouterService({
      apiKey,
    });

    // Test with actual generation
    const startTime = Date.now();
    const result = await openRouterService.generateFlashcards(testInput, {
      count: 1,
    });
    const responseTime = Date.now() - startTime;

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        test: {
          input: testInput,
          inputLength: testInput.length,
          truncated: result.truncated,
          responseTime: `${responseTime}ms`,
        },
        result: {
          flashcardsGenerated: result.flashcards.length,
          tokensUsed: result.tokensUsed,
          modelUsed: result.modelUsed,
        },
        sample: result.flashcards[0] || null,
        message: 'Test generation completed successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('OpenRouter test generation error:', error);

    if (error instanceof OpenRouterError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: error.code,
            message: error.getUserMessage(),
            statusCode: error.statusCode,
            retryable: error.isRetryable(),
          },
        }),
        {
          status: error.statusCode || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
