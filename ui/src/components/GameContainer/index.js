import React, { lazy } from 'react';
import { Switch, Route, Redirect } from "react-router-dom";
import { getComponent } from 'Utils/Loader';

const LayoutType1 = lazy(() => import('./GameLayout.jsx'));

export default class GameContainer extends React.PureComponent {
    constructor() {
        super();

        this.links = [
            {
                path: '/uno/:id',
                GameLayout: LayoutType1,
                args: {
                    GameComponent: lazy(() => import('./UnoContainer/UnoContainer.jsx')),
                    gameDisplayName: "Uno",
                    gameName: "uno"
                }
            },
            {
                path: '/ass/:id',
                GameLayout: LayoutType1,
                args: {
                    GameComponent: lazy(() => import('./AssContainer/AssContainer.jsx')),
                    gameDisplayName: "Ass",
                    gameName: "ass"
                }
            },
            {
                path: '/leastcount/:id',
                GameLayout: LayoutType1,
                args: {
                    GameComponent: lazy(() => import('./LeastCountContainer/LeastCountContainer.jsx')),
                    gameDisplayName: "LeastCount",
                    gameName: "leastcount"
                }
            },
        ];
    }

    render() {
        const basePath = this.props.match.path;
        const LOADING_TEXT = "Fetching common assets...";
        return <Switch>
            {this.links.map((o, i) => <Route key={i}
                path={basePath + o.path}
                render={getComponent(o.GameLayout, o.args, LOADING_TEXT)} />)}
            <Redirect to="/"></Redirect>
        </Switch>;
    }
}