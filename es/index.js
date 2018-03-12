import { createSelector } from 'reselect';
import { createStore, combineReducers } from 'redux';

const defaultStoreName = 'reselect-lens';

const createReducer = setAction =>
  (state = null, action) =>
    (action.type === setAction ? action.payload : state);

const createReselector = (dispatch, selector, setAction) =>
  createSelector(
    [selector],
    selectorVal => dispatch({ type: setAction, payload: selectorVal })
  );

export default (store, selectors, storeName = defaultStoreName) => {
  // if tools are not available, don't do anything. This should not
  // prevent the application from running.
  const composeWithDevTools = window && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__; // eslint-disable-line

  if (!composeWithDevTools) {
    return;
  }

  // for each given selector, build a reselector and a reducer
  const reselectors =
    Object
      .keys(selectors)
      .map((key) => {
        const setAction = `${storeName}/SET_${key}`;

        return {
          key,
          reselector: createReselector(rlStore.dispatch, selectors[key], setAction), // eslint-disable-line
          reducer: createReducer(setAction)
        };
      });

  // sort in alphabetical order
  reselectors.sort((a, b) => (a.key > b.key ? 1 : -1));

  // subscribe to store, and call all reselectors when the store is updated
  store.subscribe(() => {
    const state = store.getState();
    reselectors.forEach(({ reselector }) => reselector(state));
  });

  // build a new root reducer for the rlStore
  const reducers = {};
  reselectors.forEach(({ key, reducer }) => reducers[key] = reducer);

  // create a new store in which to house the computed values of the reselectors
  const composeEnhancers = composeWithDevTools({ name: storeName });
  const rlStore = createStore(combineReducers(reducers), composeEnhancers());
};