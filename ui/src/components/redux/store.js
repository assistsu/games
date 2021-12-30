import { createStore } from 'redux';
import playerReducer from './player/reducers';

const store = createStore(playerReducer);
export default store;