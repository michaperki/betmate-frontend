import React from 'react';
import { createRoot } from 'react-dom/client';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import createSagaMiddleware from 'redux-saga';
import { Provider } from 'react-redux';

import App from 'components/app';
// Developer tool: Agentation overlay (harmless in prod if not used)
// If types are missing, see src/types/modules/agentation.d.ts
import Agentation from 'agentation';

import reducers from './store/reducers';
import rootSaga from './store/sagas';

import { logger } from './utils';
import version from './version';
import './style.scss';
import './styles/chessboard-global.css';
// Dev-only console noise filter for known third-party warnings
if (process.env.NODE_ENV === 'development') {
  const matchesFAWarning = (args: any[]): boolean => {
    try {
      const combined = args.map(a => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
      return combined.includes('FontAwesomeIcon') && combined.includes('defaultProps will be removed');
    } catch { return false; }
  };

  const origError = console.error;
  const origWarn = console.warn;

  console.error = (...args: any[]) => {
    if (matchesFAWarning(args)) return; // suppress noisy FA dev warning
    return (origError as any)(...args);
  };
  console.warn = (...args: any[]) => {
    if (matchesFAWarning(args)) return; // some builds emit as warn
    return (origWarn as any)(...args);
  };
}

const sagaMiddleware = createSagaMiddleware();

const store = createStore(
  reducers,
  {},
  composeWithDevTools(applyMiddleware(sagaMiddleware)),
);

sagaMiddleware.run(rootSaga);

// Initialize error tracking
logger.initErrorTracking();

// Log application startup once, include version date (not every log)
logger.info('app_start', 'Application starting', {
  version: version.packageVersion,
  build_time: version.buildTimeISO,
  environment: version.environment,
});

const container = document.getElementById('main');
if (container) {
  createRoot(container).render(
    <Provider store={store}>
      <>
        <App />
        <Agentation />
      </>
    </Provider>,
  );
}
