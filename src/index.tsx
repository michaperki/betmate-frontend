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

// Log application startup
logger.info('app_start', 'Application starting', {
  version: process.env.npm_package_version || 'unknown',
  environment: process.env.NODE_ENV,
  target: process.env.TARGET_ENV,
});

const container = document.getElementById('main');
if (container) {
  createRoot(container).render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
}
