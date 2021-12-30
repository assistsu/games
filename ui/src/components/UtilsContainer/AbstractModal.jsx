import React from "react";
import 'styles/modals/abstract-modal.scss';

export default class AbstractModal extends React.PureComponent {
    getCloseButton(flag) {
        return <button className={`sg-modal-close-btn opacity-${flag ? 1 : 0}`}
            onClick={this.props.onClose}>&times;</button>
    }
    render() {
        const { header, body, show, hideClose } = this.props;
        return (
            <div className="sg-modal" data-show={show}>
                <div className="sg-modal-content-outer">
                    <div className="sg-modal-content">
                        <div className="sg-modal-header">
                            {this.getCloseButton(false)}
                            {header}
                            {this.getCloseButton(!hideClose)}
                        </div>
                        <div className="sg-modal-body">{body}</div>
                    </div>
                </div>
            </div>
        );
    }
}