import React, { Suspense } from 'react';

export function getLoader(text = "loading...") {
    return <div className="sg-loader">
        <div className="sg-loader-icon"></div>
        <div className="sg-loader-text">{text}</div>
    </div>;
}

export function getComponent(Component, args = {}, text = "Fetching assets...") {
    return (props) => <Suspense fallback={getLoader(text)}>
        <Component {...props} {...args} />
    </Suspense>;
}