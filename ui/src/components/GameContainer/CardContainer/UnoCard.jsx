import React, { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default class UnoCard extends Component {
    constructor() {
        super();
    }

    getText(text, isIcon) {
        return text && <div className="bg-white mt-auto mb-auto p-2 d-flex" style={text != "+4" ? { width: '120%', marginLeft: '-10%', borderRadius: '10px', borderBottomLeftRadius: '100%', borderTopRightRadius: '100%' }:{}}>
            <span className="position-relative m-auto font-weight-bold" style={{ fontSize: isIcon ? '25px' : '30px', letterSpacing: '-3px' }}>{text}</span>
        </div>;
    }

    getBlackCard(value) {
        return <div className="position-relative w-100 h-100">
            <div className="position-absolute d-flex flex-column flex-wrap h-100 w-100">
                <div className="card bg-warning h-50 w-50 rounded-0"></div>
                <div className="card bg-danger h-50 w-50 rounded-0"></div>
                <div className="card bg-primary h-50 w-50 rounded-0"></div>
                <div className="card bg-success h-50 w-50 rounded-0"></div>
            </div>
            {this.getText(value)}
        </div>;
    }

    getCardDisplayValue(type) {
        if (type.match(/[0-9]/) != null || type == '') {
            return this.getText(type);
        }
        switch (type) {
            case 'DRAW_TWO_CARDS': return this.getText('+2', true);
            case 'REVERSE_CARD': return this.getText(<FontAwesomeIcon icon={'sync-alt'} fontSize="50px" />, true);
            case 'SKIP_CARD': return this.getText(<FontAwesomeIcon icon={'ban'} />, true);
            case 'WILD_CARD': return this.getBlackCard(null);
            case 'WILD_CARD_DRAW_FOUR_CARDS': return this.getBlackCard('+4', true);
        }
    }

    render() {
        const { card, className, onClick, disabled } = this.props;
        return <div onClick={(disabled != true && typeof onClick == "function") ? () => onClick(card) : () => { }}
            className={`btn mb-2 d-flex card p-1 bg-${card.color} text-${card.color != 'dark' ? card.color : 'white'} overflow-hidden ${className}`}
            style={{ height: '70px', width: '50px', lineHeight: 1, marginRight: '-5px', boxShadow: '-5px 5px 15px black' }}>
            {this.getCardDisplayValue(card.type)}
        </div>;
    }
}