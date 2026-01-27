/**
 * Enhanced logging utility for the frontend
 * 
 * Provides consistent logging with the backend with improved features:
 * - Better integration with Redux actions
 * - Improved error tracking
 * - Performance logging
 * - Configurable verbosity
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

// Configuration for the logger
interface LoggerConfig {
  // Basic configuration
  minLevel: LogLevel;
  service: string;
  
  // Development experience
  enableConsoleColors: boolean;
  groupSimilarMessages: boolean;
  
  // Filtering and sampling
  mutedEvents: string[];
  verboseEvents: string[];
  samplingRate: number;
  
  // Backend integration
  sendToBackend: boolean;
  includePerformanceMetrics: boolean;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel: 'info',
  service: 'frontend',
  enableConsoleColors: true,
  groupSimilarMessages: true,
  mutedEvents: [],
  verboseEvents: [],
  samplingRate: 0.1,
  sendToBackend: true,
  includePerformanceMetrics: true
};

// Development configuration
const devConfig: Partial<LoggerConfig> = {
  minLevel: 'debug',
  enableConsoleColors: true,
  groupSimilarMessages: true,
  mutedEvents: [
    'redux_action',
    'http_request',
    'http_response'
  ],
  samplingRate: 0.25,
  sendToBackend: false
};

// Production configuration
const prodConfig: Partial<LoggerConfig> = {
  minLevel: 'info',
  enableConsoleColors: false,
  groupSimilarMessages: false,
  mutedEvents: [],
  samplingRate: 0.05,
  sendToBackend: true
};

// Create the config based on environment
const config: LoggerConfig = {
  ...defaultConfig,
  ...(isDev ? devConfig : prodConfig)
};

/**
 * Tracks groups of similar logs to reduce console noise
 */
const messageGroups: Record<string, {count: number, lastTime: number}> = {};

/**
 * Generate a random trace ID for correlation with backend
 */
export function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Get performance metrics for the current page
 */
function getPerformanceMetrics() {
  if (!config.includePerformanceMetrics) return null;

  try {
    if (window.performance) {
      const navigation = window.performance.timing;
      const memory = (window.performance as any).memory;
      
      return {
        pageLoad: navigation.loadEventEnd - navigation.navigationStart,
        domReady: navigation.domComplete - navigation.domLoading,
        networkLatency: navigation.responseEnd - navigation.requestStart,
        memory: memory ? {
          usedJSHeapSize: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
          totalJSHeapSize: Math.round(memory.totalJSHeapSize / (1024 * 1024))
        } : undefined
      };
    }
  } catch (e) {
    // Ignore errors from accessing performance metrics
  }
  
  return null;
}

/**
 * Send log to backend for Axiom processing
 */
async function sendToBackend(event: LogEvent): Promise<void> {
  try {
    // Skip debug logs in production
    if (event.level === 'debug' && !isDev) {
      return;
    }

    // Skip if backend integration is disabled
    if (!config.sendToBackend) {
      return;
    }

    // Add timestamp, service info and performance metrics
    const payload = {
      ...event,
      service: event.service || config.service,
      ts: new Date().toISOString(),
      context: {
        ...event.context,
        url: window.location.pathname,
        performance: getPerformanceMetrics(),
      }
    };

    // In development, log that we would send to backend
    if (isDev) {
      console.debug('[BACKEND-LOG]', payload);
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
      console.error('Failed to send log to backend:', response.status, response.statusText);
    }
  } catch (error) {
    // Failsafe - don't let logging break the app
    console.error('Logging error:', error);
  }
}

/**
 * Check if an event should be muted based on config
 */
function shouldMuteEvent(eventName: string): boolean {
  // Always log verbose events
  if (config.verboseEvents.includes(eventName)) {
    return false;
  }
  
  // Mute specified events
  return config.mutedEvents.includes(eventName);
}

/**
 * Handle message grouping for similar logs
 */
function handleMessageGrouping(event: LogEvent, consoleMethod: 'log' | 'debug' | 'info' | 'warn' | 'error'): boolean {
  if (!config.groupSimilarMessages) {
    return false;
  }
  
  const key = `${event.event}:${event.message || ''}:${JSON.stringify(event.context || {})}`;
  const now = Date.now();
  
  // Check if we've seen this message recently
  if (messageGroups[key]) {
    messageGroups[key].count++;
    
    // Only log once per second for grouped messages
    if (now - messageGroups[key].lastTime < 1000) {
      return true; // Skip logging
    }
    
    // Update last time and log with count
    messageGroups[key].lastTime = now;
    
    // Log with count information
    console[consoleMethod](`[${event.event}] ${event.message || ''} (${messageGroups[key].count}x)`);
    return true;
  }
  
  // First time seeing this message
  messageGroups[key] = { count: 1, lastTime: now };
  return false;
}

/**
 * Format console logs with colors based on level
 */
function formatConsoleLog(event: LogEvent): void {
  const { level, message, event: eventName, context } = event;
  
  // Skip muted events
  if (shouldMuteEvent(eventName)) {
    return;
  }
  
  // Map level to console method
  const consoleMethod = level === 'debug' 
    ? 'debug' 
    : level === 'info' 
      ? 'info' 
      : level === 'warn' 
        ? 'warn' 
        : 'error';
  
  // Handle message grouping
  if (handleMessageGrouping(event, consoleMethod)) {
    return;
  }
  
  // Apply colors in development if enabled
  if (isDev && config.enableConsoleColors) {
    // Format differently based on level
    if (level === 'error') {
      console.error(
        `%c[${eventName}]%c ${message || ''}`, 
        'color: #ff5252; font-weight: bold', 
        'color: inherit', 
        context || ''
      );
    } else if (level === 'warn') {
      console.warn(
        `%c[${eventName}]%c ${message || ''}`, 
        'color: #fb8c00; font-weight: bold', 
        'color: inherit', 
        context || ''
      );
    } else if (level === 'info') {
      console.info(
        `%c[${eventName}]%c ${message || ''}`, 
        'color: #29b6f6; font-weight: bold', 
        'color: inherit', 
        context || ''
      );
    } else {
      console.debug(
        `%c[${eventName}]%c ${message || ''}`, 
        'color: #9e9e9e;', 
        'color: inherit', 
        context || ''
      );
    }
  } else {
    // Standard console logging without colors
    console[consoleMethod](`[${eventName}] ${message || ''}`, context || '');
  }
}

/**
 * Main logging function
 */
export function log(event: LogEvent): void {
  // Check minimum log level
  const levelOrder = { debug: 0, info: 1, warn: 2, error: 3 };
  if (levelOrder[event.level] < levelOrder[config.minLevel]) {
    return;
  }
  
  // Apply sampling for non-error events
  if (event.level !== 'error' && Math.random() > config.samplingRate) {
    return;
  }
  
  // Always log to console in development with formatting
  if (isDev) {
    formatConsoleLog(event);
  }
  
  // Send errors and warnings to backend
  if (event.level === 'error' || event.level === 'warn' || !isDev) {
    sendToBackend(event);
  }
}

/**
 * Log error with additional context
 */
export function logError(
  error: Error | string,
  context?: Record<string, any>,
  eventName = 'frontend_error'
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
  context?: Record<string, any>
): void {
  log({
    level: 'info',
    event: 'user_action',
    message: action,
    context,
  });
}

/**
 * Log Redux action for debugging
 */
export function logReduxAction(
  type: string,
  payload?: any,
  meta?: any
): void {
  log({
    level: 'debug',
    event: 'redux_action',
    message: type,
    context: {
      payload,
      meta
    }
  });
}

/**
 * Log performance metrics for key interactions
 */
export function logPerformance(
  name: string,
  durationMs: number,
  context?: Record<string, any>
): void {
  log({
    level: 'info',
    event: 'performance',
    message: name,
    context: {
      ...context,
      duration_ms: durationMs
    }
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
  
  // Track page load performance
  window.addEventListener('load', () => {
    // Wait a bit to ensure metrics are available
    setTimeout(() => {
      log({
        level: 'info',
        event: 'page_loaded',
        context: {
          page: window.location.pathname,
          performance: getPerformanceMetrics()
        }
      });
    }, 1000);
  });
}

// Export default logger object with convenience methods
export default {
  debug: (event: string, message?: string, context?: Record<string, any>) => 
    log({ level: 'debug', event, message, context }),
  
  info: (event: string, message?: string, context?: Record<string, any>) => 
    log({ level: 'info', event, message, context }),
  
  warn: (event: string, message?: string, context?: Record<string, any>) => 
    log({ level: 'warn', event, message, context }),
  
  error: (event: string, message?: string, context?: Record<string, any>) => 
    log({ level: 'error', event, message, context }),
  
  logError,
  logUserAction,
  logReduxAction,
  logPerformance,
  initErrorTracking,
  generateTraceId,
};