import React from 'react';
import { createRoot } from 'react-dom/client';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import createSagaMiddleware from 'redux-saga';
import { Provider } from 'react-redux';

import App from 'components/app';

import reducers from './store/reducers';
import rootSaga from './store/sagas';

import './style.scss';

const sagaMiddleware = createSagaMiddleware();

const store = createStore(
  reducers,
  {},
  composeWithDevTools(applyMiddleware(sagaMiddleware)),
);

sagaMiddleware.run(rootSaga);

const container = document.getElementById('main');
if (container) {
  createRoot(container).render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
}
