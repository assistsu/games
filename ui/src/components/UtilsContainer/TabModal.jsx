import React from "react";
import AbstractModal from './AbstractModal.jsx';
import 'styles/modals/tab-modal.scss';

export default class TabModal extends React.PureComponent {
    constructor(props) {
        super();
        this.state = {
            selectedTabIndex: props.defaultTabIndex,
        }
    }

    setSelectedTabIndex = (selectedTabIndex) => {
        this.setState({ selectedTabIndex });
    }

    getHeader() {
        return <div className="tab-modal-header">
            {this.props.tabNames.map((o, i) => <button key={i}
                disabled={this.state.selectedTabIndex == i}
                onClick={() => this.setSelectedTabIndex(i)}>{o}</button>)}
        </div>;
    }

    getBody() {
        const selectedTab = this.props.tabs[this.state.selectedTabIndex];
        return _.isFunction(selectedTab) ? selectedTab() : selectedTab;
    }

    render() {
        return <AbstractModal show={this.props.show} onClose={this.props.onClose}
            header={this.getHeader()}
            body={this.getBody()} />;
    }
}