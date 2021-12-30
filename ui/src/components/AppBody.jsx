import React, { lazy } from "react";
import { useSelector } from "react-redux";
import { Switch, Route, Redirect } from "react-router-dom";
import { getComponent } from 'Utils/Loader';
import Login from './AppContainer/Login.jsx';

const links = [
    { path: '/game', component: lazy(() => import('./GameContainer')) },
    { path: '/', component: lazy(() => import('./AppContainer')) },
];

function AppBody() {
    const { player } = useSelector(state => state);
    return <div className="app-body">
        {player && player._id ?
            <Switch>
                {links.map((o, i) => <Route key={i}
                    path={o.path}
                    render={getComponent(o.component)} />)}
                <Redirect to="/"></Redirect>
            </Switch>
            : <Login />}
    </div>;
}

export default AppBody;