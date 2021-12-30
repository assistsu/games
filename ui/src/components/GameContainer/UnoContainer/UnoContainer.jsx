import React, { Component } from "react";
import Player from '../PlayerContainer/Player.jsx';
import AbstractModal from 'UtilsContainer/AbstractModal.jsx';
import GameModel from 'Model/Game';
import GameUtil from 'Utils/Game';
import Uno from 'Model/Uno';
import Card from '../CardContainer/UnoCard.jsx';

const GAME_NAME = 'uno';

class UnoContainer extends Component {
    constructor() {
        super();

        this.state = _.assign({}, this.getInitialValues());

        this.updateReceived = this.updateReceived.bind(this);
        this.setUnoButtonClicked = this.setUnoButtonClicked.bind(this);
        this.setChosenCard = this.setChosenCard.bind(this);
        this.submitChosenCard = this.submitChosenCard.bind(this);
        this.takeCard = this.takeCard.bind(this);
        this.passCard = this.passCard.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.hideColorChooseModal = this.hideColorChooseModal.bind(this);
        this.resetStateUpdateGameInfo = GameUtil.resetStateUpdateGameInfo.bind(this);
        this.handleError = GameUtil.handleError.bind(this);
    }

    getInitialValues() {
        return {
            showColorChooseModal: false,
            isUnoClicked: false,
            chosenCard: null,
        }
    }

    listPlayers() {
        const { players } = this.props.game;
        return <div className="d-flex flex-wrap px-1 mt-2">
            {players.map((o, i) => <Player key={i}
                gameId={this.props.game._id}
                gameName={GAME_NAME}
                player={o}
                isMe={o._id == this.props.me._id}
                currentPlayer={this.props.game.currentPlayer}
                amIAdmin={this.props.state.amIAdmin} />)}
        </div>;
    }

    takeCard() {
        Uno.takeCard(this.props.game._id)
            .then(this.props.updateGameInfo)
            .catch(this.handleError);
    }

    getBorderedCard(card, onClick, color, disabled) {
        return <div className={`border-${color} rounded-circle m-auto d-flex`} style={{ height: '120px', width: '120px', borderWidth: '2px', borderStyle: 'solid' }}>
            <Card card={card} className="m-auto" disabled={disabled} onClick={onClick} />
        </div>;
    }

    getDeckAndLastCard() {
        const { lastCard, currentPlayer } = this.props.game;
        return <div className="d-flex my-2">
            {this.getBorderedCard({ color: 'info', type: '' }, this.takeCard, 'info', !this.props.state.isMyMove || currentPlayer.pass)}
            {this.getBorderedCard(lastCard, null, lastCard.chosenColor || lastCard.color, true)}
        </div>
    }

    passCard() {
        Uno.passCard(this.props.game._id)
            .then(this.resetStateUpdateGameInfo)
            .catch(this.handleError);
    }

    setUnoButtonClicked() {
        this.setState({ isUnoClicked: true });
    }

    showPassAndUnoButtons() {
        const { isMyMove } = this.props.state;
        return (<div className="d-flex my-2">
            <button disabled={!isMyMove || !this.props.game.currentPlayer.pass}
                style={{ boxShadow: '5px 5px 10px black' }}
                className="btn btn-success m-auto font-weight-bold btn-shadow" onClick={this.passCard}>Pass</button>
            <button disabled={!isMyMove || this.props.game.myCards.length != 2 || this.state.isUnoClicked}
                style={{ boxShadow: '5px 5px 10px black' }}
                className="btn btn-danger m-auto font-weight-bold btn-shadow" onClick={this.setUnoButtonClicked}>UNO</button>
        </div>
        );
    }

    submitChosenCard(chosenColorCard) {
        let chosenCard = this.state.chosenCard;
        let data = {
            chosenCard: _.assign(chosenCard, { chosenColor: chosenColorCard ? chosenColorCard.color : null }),
            isUnoClicked: this.state.isUnoClicked,
        }
        Uno.submitChosenCard(this.props.game._id, data)
            .then(this.resetStateUpdateGameInfo)
            .catch(this.handleError);
    }

    setChosenCard(chosenCard) {
        const isWildCard = chosenCard.type.match(/WILD_CARD/) != null;
        this.setState({ chosenCard: chosenCard, showColorChooseModal: isWildCard }, !isWildCard ? this.submitChosenCard : () => { });
    }

    showMyCards() {
        const { myCards } = this.props.game, disabled = !this.props.state.isMyMove;
        return <div className="d-flex flex-wrap p-2 mt-2">
            {_.sortBy(myCards, ['color', 'type']).map((o, i) => <Card onClick={this.setChosenCard} card={o} key={i} disabled={disabled} />)}
        </div>
    }

    hideColorChooseModal() {
        this.setState({ showColorChooseModal: false });
    }

    getColorChooseModalBody() {
        return <div className="d-flex">
            {['warning', 'danger', 'primary', 'success'].map((o, i) =>
                <Card card={{ color: o, type: '' }}
                    onClick={(card) => { this.hideColorChooseModal(); this.submitChosenCard(card) }}
                    key={i} className="m-auto" />)}
        </div>
    }

    getColorChooseModal() {
        return <AbstractModal id="colorChooseModal" header={'Choose Color'}
            show={this.state.showColorChooseModal} onClose={this.hideColorChooseModal}
            body={this.getColorChooseModalBody()}
        />;
    }

    getPlayerTurnAlert() {
        return <div className="d-flex py-2">
            <span className={`m-auto sg-btn-${this.props.state.isMyMove ? 'danger' : 'trans'} `}>
                {this.props.state.isMyMove ? <b>Your turn</b> : <span><b>{this.props.game.currentPlayer.name}</b> turn</span>}
            </span>
        </div>;
    }

    renderGame() {
        return <div className="d-flex flex-column">
            {this.getPlayerTurnAlert()}
            {this.listPlayers(true)}
            {this.getDeckAndLastCard()}
            {this.showPassAndUnoButtons()}
            {this.showMyCards()}
            {this.getColorChooseModal()}
        </div>
    }

    renderGameResults() {
        return <div className="game-result text-center">
            <div className="alert alert-success text-center m-0 rounded-top rounded-bottom-0"
                style={{ boxShadow: '0 0 5px white' }}><b>Game Results</b></div>
            <div className="game-result-table">
                <table className="table table-hover table-light table-striped rounded-bottom" style={{ boxShadow: '0 0 5px white' }}>
                    <thead>
                        <tr>
                            <th scope="col">Rank</th>
                            <th scope="col">Name</th>
                            <th scope="col">Status</th>
                            <th scope="col">Bal Cards</th>
                        </tr>
                    </thead>
                    <tbody>
                        {_.sortBy(this.props.game.players, 'cardsCount').map((o, i) => {
                            return <tr key={i}>
                                <td scope="row">{i + 1}</td>
                                <td>{o.name}</td>
                                <td>{i == 0 ? 'Won' : 'Lost'}</td>
                                <td>{o.cardsCount}</td>
                            </tr>;
                        })}
                    </tbody>
                </table>
            </div>
            {this.props.state.amIAdmin && <div className="d-flex">
                <button className="btn btn-primary m-auto btn-shadow" onClick={this.restartGame}>Restart</button>
            </div>}
        </div>;
    }

    restartGame() {
        GameModel.restartGame(GAME_NAME, this.props.game._id)
            .then(this.props.updateGameInfo)
            .catch(this.handleError);
    }

    render() {
        switch (this.props.game.status) {
            case 'STARTED': return this.renderGame();
            case 'ENDED': return this.renderGameResults();
        }
    }

    updateReceived(data) {
        switch (data.event) {
            case 'PLAYER_SUBMITTED_CARD':
                const ind = this.props.state.myIndexInPlayers;
                if (ind != -1 && data.gameData.players[ind].cardsCount != this.props.game.players[ind].cardsCount) {
                    this.props.getGameInfo();
                    break;
                }
            case 'PLAYER_TOOK_CARD':
                this.props.updateGameInfo(data.gameData).then(GameUtil.playLightNotify);
                break;
            case 'PLAYER_PASSED':
                this.props.updateGameInfo(data.gameData).then(this.props.state.isMyMove ? GameUtil.playNewNotify : GameUtil.playLightNotify);
                break;
        }
    }
}

export default UnoContainer;