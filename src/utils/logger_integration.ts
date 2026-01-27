/**
 * Logger integration file for gradual adoption
 * 
 * This file provides a compatibility layer between the original logger
 * and the enhanced logger, allowing gradual adoption without breaking changes.
 */

import originalLogger from './logger';
import enhancedLogger from './enhanced_logger';

// The flag to determine which logger to use - defaults to enhanced in dev
const useEnhancedLogger = process.env.USE_ENHANCED_LOGGER === 'true' 
  || process.env.NODE_ENV === 'development';

// Create a proxy to forward calls to the appropriate logger
const logger = new Proxy({} as typeof originalLogger, {
  get(target, prop, receiver) {
    if (useEnhancedLogger) {
      return Reflect.get(enhancedLogger, prop, receiver);
    } else {
      return Reflect.get(originalLogger, prop, receiver);
    }
  }
});

// Export enhanced logger interface for specific uses
export type { LogEvent, LogLevel } from './enhanced_logger';
export { default as enhancedLogger } from './enhanced_logger';
export { default as originalLogger } from './logger';
export default logger;