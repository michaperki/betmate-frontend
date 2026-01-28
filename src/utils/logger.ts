/**
 * Logging utility for the frontend
 *
 * Provides consistent logging across the application with options to:
 * - Log to console in development
 * - Send important events to Axiom in production
 * - Track errors and user actions
 */

import { ROOT_URL } from './index';

// Environment detection
const isDev = process.env.NODE_ENV === 'development';
const AXIOM_ENDPOINT = '/api/log'; // Backend proxy endpoint for Axiom

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log event structure (matches backend)
export interface LogEvent {
  level: LogLevel;
  message?: string;
  event: string;
  service?: string;
  trace_id?: string;
  context?: Record<string, any>;
}

/**
 * Generate a random trace ID for correlation
 */
export function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Send log to backend for Axiom processing
 * Backend will handle authentication and proper formatting
 */
async function sendToAxiom(event: LogEvent): Promise<void> {
  try {
    // Skip debug logs in production
    if (event.level === 'debug' && !isDev) {
      return;
    }

    // Add timestamp and service info
    // Attach a persistent session trace id and last request id for correlation
    const SESSION_TRACE_ID = (window as any).__bmSessionTraceId
      || ((window as any).__bmSessionTraceId = Math.random().toString(36).slice(2, 10));
    const lastRequestId = (window as any).__bmLastRequestId || '';

    const payload = {
      ...event,
      service: event.service || 'frontend',
      trace_id: event.trace_id || SESSION_TRACE_ID,
      ts: new Date().toISOString(),
      context: {
        ...(event.context || {}),
        request_id: (event.context && (event.context as any).request_id) || lastRequestId || undefined,
        session_trace_id: SESSION_TRACE_ID,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    } as LogEvent & { ts: string };

    // In development, just log to console
    if (isDev) {
      console[event.level]('[LOGGER]', payload);
      return;
    }

    // In production, send to backend proxy
    const response = await fetch(`${ROOT_URL}${AXIOM_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Log locally if failed
      console.error('Failed to send log to Axiom:', response.status, response.statusText);
    }
  } catch (error) {
    // Failsafe - don't let logging break the app
    console.error('Logging error:', error);
  }
}

/**
 * Main logging function
 */
export function log(event: LogEvent): void {
  // Always log to console in development
  if (isDev) {
    const {
      level, message, event: eventName, context,
    } = event;
    console[level](`[${eventName}]${message ? ` ${message}` : ''}`, context || '');
  }

  // Only send logs to Axiom in production
  if (!isDev) {
    void sendToAxiom(event);
  } else if (event.level === 'error') {
    // In development, just log errors to console with a note that they would be sent to Axiom in production
    console.warn('[DEV] In production, this error would be sent to Axiom');
  }
}

/**
 * Log error with additional context
 * Ensures errors are always sent to Axiom
 */
export function logError(
  error: Error | string,
  context?: Record<string, any>,
  eventName = 'frontend_error',
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;

  log({
    level: 'error',
    event: eventName,
    message: errorMessage,
    context: {
      ...context,
      stack,
      url: window.location.href,
    },
  });
}

/**
 * Log user interactions
 */
export function logUserAction(
  action: string,
  context?: Record<string, any>,
): void {
  log({
    level: 'info',
    event: 'user_action',
    message: action,
    context,
  });
}

/**
 * Initialize error tracking
 * Catches unhandled errors and sends them to Axiom
 */
export function initErrorTracking(): void {
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError(`Unhandled Promise rejection: ${event.reason}`, {
      reason: event.reason,
    });
  });
}

// Export default logger object with convenience methods
export default {
  debug: (event: string, message?: string, context?: Record<string, any>) => log({
    level: 'debug', event, message, context,
  }),

  info: (event: string, message?: string, context?: Record<string, any>) => log({
    level: 'info', event, message, context,
  }),

  warn: (event: string, message?: string, context?: Record<string, any>) => log({
    level: 'warn', event, message, context,
  }),

  error: (event: string, message?: string, context?: Record<string, any>) => log({
    level: 'error', event, message, context,
  }),

  logError,
  logUserAction,
  initErrorTracking,
};
