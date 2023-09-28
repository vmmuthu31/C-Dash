
import { createStore, combineReducers, applyMiddleware } from 'redux';
import userReducer from './userReducer';
import thunk from 'redux-thunk'; // You can add middleware if needed

// Combine reducers if you have more than one
const rootReducer = combineReducers({
  user: userReducer,
  // Add other reducers here if needed
});

// Create the Redux store with optional middleware
const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
