import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import store from './components/redux/store';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/tab';
import 'styles/common.scss';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons/faSyncAlt';
import { faBan } from '@fortawesome/free-solid-svg-icons/faBan';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { faCopy } from '@fortawesome/free-solid-svg-icons/faCopy';
import { faStar } from '@fortawesome/free-solid-svg-icons/faStar';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons/faSignOutAlt';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';
import { faCommentAlt } from '@fortawesome/free-solid-svg-icons/faCommentAlt';
import App from "./App.jsx";

library.add(faUser, faSyncAlt, faBan, faBars, faCopy, faStar, faSignOutAlt, faPaperPlane, faCommentAlt);

ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById("container"));