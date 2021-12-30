import React, { Component } from "react";
import 'styles/standard-card.scss';

export default class extends Component {
    constructor() {
        super();
    }

    getOnClick() {
        const { card, onClick, disabled } = this.props;
        return (disabled != true && typeof onClick == "function") ? () => onClick(card) : () => { }
    }

    getTextColorClass() {
        switch (this.props.card.type) {
            case 'SPADE':
            case 'CLUB':
                return 'text-dark';
            default:
                return 'text-danger';
        }
    }

    getCardClass() {
        const { isChosenCard, className } = this.props;
        return [
            'game-card',
            isChosenCard ? 'game-chosen-card' : '',
            this.getTextColorClass(),
            className
        ].join(' ');
    }

    getJokerCard() {
        const jokerText = _.toArray('JOKER').map((o, i) => <div key={i}>{o}</div>);
        return <div className="d-flex joker-card text-danger">
            <div className="left">{jokerText}</div>
            <div className="center"><img src='/assets/images/joker.png' /></div>
            <div className="right">{jokerText}</div>
        </div>;
    }

    getLayer(tag1, tag2, className) {
        return <div className={`d-flex flex-column ${className}`}>
            {tag1}
            {tag2}
        </div>
    }

    getNumberCard(card) {
        const numberTag = <div className="game-card-corner-text">{card.number}</div>;
        return <div className="position-relative h-100 w-100 d-flex flex-column game-card-body">
            {this.getLayer(numberTag, <div className={`${card.type}-icon game-card-corner-icon`} />, 'mbr-auto')}
            {this.getLayer('', <div className={`${card.type}-icon game-card-center-icon`} />, '')}
            {this.getLayer(<div className={`${card.type}-icon game-card-corner-icon`} />, numberTag, 'mlt-auto')}
        </div>
    }


    getGameCardBody() {
        const { card } = this.props;
        switch (card.type) {
            case 'JOKER': return this.getJokerCard();
            default: return this.getNumberCard(card);
        }
    }

    render() {
        return <div onClick={this.getOnClick()}
            className={this.getCardClass()}>
            {this.getGameCardBody()}
        </div>;
    }
}