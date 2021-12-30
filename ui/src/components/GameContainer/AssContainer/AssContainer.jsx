import React, { Component } from "react";
import Player from '../PlayerContainer/Player.jsx';
import GameModel from 'Model/Game';
import GameUtil from 'Utils/Game';
import Ass from 'Model/Ass';
import Card from '../CardContainer/StandardCard.jsx';

const GAME_NAME = 'ass';

class AssContainer extends Component {
    constructor() {
        super();

        this.state = _.assign({
            myIndexInPlayersInGame: -1,
            amIPresentInPlayersInGame: false,
        }, this.getInitialValues());

        this.animationTime = 1000;

        this.updateGameInfo = this.updateGameInfo.bind(this);
        this.updateReceived = this.updateReceived.bind(this);
        this.setChosenCard = this.setChosenCard.bind(this);
        this.submitChosenCard = this.submitChosenCard.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.handleError = GameUtil.handleError.bind(this);
    }

    getInitialValues() {
        return {
            submitFlag: false,
            chosenCard: null,
        }
    }

    startAnimi(animiobj) {
        return new Promise((resolve) => {
            setTimeout(() => {
                $('.game-player-selected-card').removeClass('game-player-selected-card-force');
                $('.game-player-selected-card').animate(animiobj, this.animationTime);
                setTimeout(() => {
                    $('.game-player-selected-card').addClass('game-player-selected-card-force');
                    resolve();
                }, this.animationTime + 100);
            }, 500);
        });
    }

    setCardsPosition() {
        document.querySelectorAll('.game-player-selected-card').forEach(ele => {
            const offset = $(ele).offset();
            $(ele).css({ position: 'fixed', top: offset.top, left: offset.left });
        });
    }

    checkAnime(gameData) {
        return new Promise((resolve) => {
            if (_.isEmpty(gameData.currentRoundPlayerCards) && gameData.lastRound) {
                switch (gameData.lastRound.type) {
                    case 'ALL_SUBMITTED':
                        this.props.updateGameInfo({ currentRoundPlayerCards: gameData.lastRound.playersCards }).then(() => {
                            this.setCardsPosition();
                            this.startAnimi({ left: '-100px' }).then(resolve);
                        });
                        break;
                    case 'HIT':
                        this.props.game.currentRoundPlayerCards[gameData.lastRound.hitBy._id] = gameData.lastRound.hitBy._id == this.props.me._id ?
                            this.state.chosenCard : {};
                        this.props.updateGameInfo({ currentRoundPlayerCards: this.props.game.currentRoundPlayerCards }).then(() => {
                            this.setCardsPosition();
                            const offset = $(`[data-player-id='${gameData.lastRound.playerGotHit._id}'] .game-player-selected-card`).offset();
                            this.startAnimi({ top: offset.top, left: offset.left }).then(resolve);
                        });
                        break;
                }
            } else {
                resolve();
            }
        });
    }

    updateGameInfo(gameData) {
        this.setState(this.getInitialValues(), () => this.props.updateGameInfo(gameData));
    }

    beforeUpdateInfo(gameData) {
        this.checkAnime(gameData).then(() => this.updateGameInfo(gameData));
    }

    isPlayerWon(player) {
        return this.props.game.status == 'STARTED' && _.find(this.props.game.players, { _id: player._id }) && !_.find(this.props.game.playersInGame, { _id: player._id });
    }

    listPlayers() {
        const { players, currentRoundPlayerCards } = this.props.game;
        return <div className="d-flex flex-wrap px-1 mt-2">
            {players.map((o, i) => <Player key={i}
                gameId={this.props.game._id}
                gameName={GAME_NAME}
                player={o}
                isMe={o._id == this.props.me._id}
                currentPlayer={this.props.game.currentPlayer}
                amIAdmin={this.props.state.amIAdmin}
                isPlayerWon={this.isPlayerWon(o)}
                CardComponent={Card}
                playerChosenCard={currentRoundPlayerCards[o._id]} />)}
        </div>;
    }

    submitChosenCard() {
        const { chosenCard } = this.state;
        this.setState({ submitFlag: true }, () => {
            Ass.submitChosenCard(this.props.game._id, { chosenCard: chosenCard })
                .then(resp => {
                    this.props.updateGameInfo({ myCards: resp.myCards })
                        .then(() => this.beforeUpdateInfo(resp));
                }).catch(this.handleError);
        });
    }

    getSubmitButton() {
        const { chosenCard, submitFlag } = this.state;
        return <div className="d-flex my-2">
            <button className="btn btn-primary m-auto btn-shadow"
                onClick={this.submitChosenCard}
                disabled={chosenCard == null || submitFlag}>Submit</button>
        </div>
    }

    setChosenCard(chosenCard) {
        this.setState({ chosenCard: this.isChosenCard(chosenCard) ? null : chosenCard });
    }

    sortMyCards(cards) {
        return _.reverse(_.sortBy(cards, ['type', 'point']));
    }

    isChosenCard(card) {
        const { chosenCard } = this.state;
        return chosenCard && chosenCard.number == card.number && chosenCard.type == card.type;
    }

    showMyCards() {
        const { myCards } = this.props.game, disabled = !this.props.state.isMyMove;
        return <div className="my-cards">
            {this.sortMyCards(myCards).map((o, i) => <Card onClick={this.setChosenCard}
                isChosenCard={this.isChosenCard(o)}
                card={o} key={i} disabled={disabled} />)}
        </div>
    }

    getPlayerTurnAlert() {
        return <div className="d-flex py-2">
            <span className={`m-auto sg-btn-${this.props.state.isMyMove ? 'danger' : 'trans'} `}>
                {this.props.state.isMyMove ? <b>Your turn</b> : <span><b>{this.props.game.currentPlayer.name}</b> turn</span>}
            </span>
        </div>;
    }

    amISpectating() {
        const { amIPresentInPlayers } = this.props.state;
        return !amIPresentInPlayers && <div className={`alert alert-warning text-center`}>
            <b>You are spectaing the Game</b>
        </div>
    }

    renderGame() {
        return <div className="d-flex flex-column">
            {this.getPlayerTurnAlert()}
            {this.listPlayers()}
            {this.getSubmitButton()}
            {this.showMyCards()}
            {this.amISpectating()}
        </div>
    }

    restartGame() {
        GameModel.restartGame(GAME_NAME, this.props.game._id)
            .then(this.props.updateGameInfo)
            .catch(this.handleError);
    }

    renderGameResults() {
        const { playersInGame, players } = this.props.game;
        return <div className="game-result text-center">
            <div className="alert alert-success text-center m-0 rounded-top rounded-bottom-0"
                style={{ boxShadow: '0 0 5px white' }}><b>Game Results</b></div>
            <div className="game-result-table">
                <table className="table table-hover table-light table-striped rounded-bottom" style={{ boxShadow: '0 0 5px white' }}>
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Status</th>
                            <th scope="col">Bal Cards</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.filter(o => _.findIndex(playersInGame, { _id: o._id }) == -1).map((o, i) => {
                            return <tr key={i}>
                                <td>{o._id == this.props.me._id ? 'You' : o.name}</td>
                                <td>Won</td>
                                <td>-</td>
                            </tr>;
                        })}
                        {playersInGame.map((o, i) => {
                            return <tr key={i}>
                                <td>{o._id == this.props.me._id ? 'You' : o.name}</td>
                                <td>Lost</td>
                                <td>{_.find(players, { _id: o._id }).cardsCount}</td>
                            </tr>;
                        })}
                    </tbody>
                </table>
            </div>
            {this.amISpectating()}
            {this.props.state.amIAdmin && <div className="d-flex">
                <button className="btn btn-primary m-auto btn-shadow" onClick={this.restartGame}>Restart</button>
            </div>}
        </div>;
    }

    prepareFields(props) {
        const myIndexInPlayersInGame = _.findIndex(props.game.playersInGame, { _id: props.me._id });
        this.setState({ myIndexInPlayersInGame, amIPresentInPlayersInGame: myIndexInPlayersInGame != -1 });
    }

    render() {
        switch (this.props.game.status) {
            case 'STARTED': return this.renderGame();
            case 'ENDED': return this.renderGameResults();
        }
    }

    componentDidMount() {
        this.prepareFields(this.props);
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        this.prepareFields(newProps);
    }

    updateReceived(data) {
        switch (data.event) {
            case 'PLAYER_SUBMITTED_CARD':
                this.checkAnime(data.gameData).then(() => {
                    const { lastRound } = data.gameData;
                    if (lastRound && lastRound.playerGotHit && lastRound.playerGotHit._id == this.props.me._id) {
                        return this.props.getGameInfo();
                    }
                    this.updateGameInfo(data.gameData);
                });
                break;
        }
    }
}

export default AssContainer;