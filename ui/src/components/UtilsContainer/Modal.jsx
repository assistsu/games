import React from "react";
import AbstractModal from './AbstractModal.jsx';

export default class Modal extends React.PureComponent {
    getHeader() {
        return <div>
            {this.props.title}
            <button className="close-btn"
                onClick={onClose}>&times;</button>
        </div>
    }
    render() {
        return <AbstractModal show={this.props.show}
            header={this.getHeader()}
            body={this.props.body} />;
    }
}