import React from 'react';
import { createRoot } from 'react-dom/client';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import createSagaMiddleware from 'redux-saga';
import { Provider } from 'react-redux';

import App from 'components/app';

import reducers from './store/reducers';
import rootSaga from './store/sagas';

import { logger } from './utils';
import version from './version';
import './style.scss';
import './styles/chessboard-global.css';

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
      <App />
    </Provider>,
  );
}
