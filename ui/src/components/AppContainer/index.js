import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import Home from './Home.jsx';
import Profile from './Profile.jsx';

const links = [
    { path: '/profile', component: Profile },
    { path: '/', component: Home },
];

export default function AppContainer() {
    return <Switch>
        {links.map((o, i) => <Route path={o.path} key={i} component={o.component} />)}
        <Redirect to="/"></Redirect>
    </Switch>;
}