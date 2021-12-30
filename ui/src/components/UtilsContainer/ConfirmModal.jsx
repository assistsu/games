import React from "react";
import AbstractModal from './AbstractModal.jsx';
import 'styles/modals/confirm-modal.scss';

export default class ConfirmModal extends React.PureComponent {
    getHeader() {
        return this.props.title || 'Are you sure?';
    }
    getBody() {
        return <div className="sg-confirm-modal-body">
            <button className="sg-btn-danger" onClick={this.props.onYes}>Yes</button>
            <button className="sg-btn-primary" onClick={this.props.onNo}>No</button>
        </div>;
    }
    render() {
        return <AbstractModal show={this.props.show} onClose={this.props.onClose} hideClose={true}
            header={this.getHeader()}
            body={this.getBody()} />;
    }
}