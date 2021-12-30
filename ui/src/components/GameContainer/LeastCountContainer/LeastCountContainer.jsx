import React, { Component } from "react";
import Player from '../PlayerContainer/Player.jsx';
import GameModel from 'Model/Game';
import LeastCount from 'Model/LeastCount';
import Card from '../CardContainer/StandardCard.jsx';
import GameUtil from 'Utils/Game';

const GAME_NAME = 'leastcount';

class LeastCountContainer extends Component {
    constructor() {
        super();

        this.state = _.assign({}, _.cloneDeep(this.getInitialValues()));

        this.updateReceived = this.updateReceived.bind(this);
        this.handleChosenCard = this.handleChosenCard.bind(this);
        this.submitChosenCards = this.submitChosenCards.bind(this);
        this.takeCard = this.takeCard.bind(this);
        this.noShow = this.noShow.bind(this);
        this.continueGame = this.continueGame.bind(this);
        this.showCards = this.showCards.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.resetStateGetGameInfo = GameUtil.resetStateGetGameInfo.bind(this);
        this.handleError = GameUtil.handleError.bind(this);
    }

    getInitialValues() {
        return {
            chosenCards: [],
            submitFlag: false,
            decideFlag: false,
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

    takeCard(takeFrom) {
        LeastCount.takeCard(this.props.game._id, { takeFrom })
            .then(this.props.getGameInfo)
            .catch(this.handleError);
    }

    getBorderedCard(card, onClick, disabled) {
        return <div className={`border-white rounded-circle m-auto d-flex`} style={{ height: '120px', width: '120px', borderWidth: '2px', borderStyle: 'solid' }}>
            <Card card={card} className={`m-auto ${disabled ? '' : 'zoom-animi'}`} disabled={disabled} onClick={onClick} />
        </div>;
    }

    getDeckAndLastCard() {
        const { lastCards, currentPlayerAction } = this.props.game;
        return <div className="d-flex my-2">
            {this.getBorderedCard({ color: 'info', type: '' }, () => this.takeCard('DECK'), !this.props.state.isMyMove || currentPlayerAction != 'TAKE')}
            {this.getBorderedCard(lastCards.length ? lastCards[0] : {}, () => this.takeCard('LASTCARD'), !this.props.state.isMyMove || currentPlayerAction != 'TAKE')}
        </div>
    }

    showCards() {
        this.setState({ decideFlag: true }, () => {
            LeastCount.showCards(this.props.game._id)
                .then(this.props.getGameInfo)
                .catch(this.handleError);
        });
    }

    noShow() {
        this.setState({ decideFlag: true }, () => {
            LeastCount.noShow(this.props.game._id)
                .then(this.props.getGameInfo)
                .catch(this.handleError);
        });
    }

    submitChosenCards() {
        let data = {
            chosenCards: this.state.chosenCards
        }
        this.setState({ submitFlag: true }, () => {
            LeastCount.submitChosenCards(this.props.game._id, data)
                .then(this.resetStateGetGameInfo)
                .catch(this.handleError);
        });
    }

    handleChosenCard(chosenCard) {
        const ind = _.findIndex(this.state.chosenCards, chosenCard);
        ind == -1 ? this.state.chosenCards.push(chosenCard) : this.state.chosenCards.splice(ind, 1);
        this.setState({ chosenCards: this.state.chosenCards });
    }

    getCurrentPlayerDroppedCards() {
        const { currentPlayerDroppedCards, currentPlayerAction, currentPlayer } = this.props.game;
        return currentPlayerAction == "TAKE" && <div className="d-flex flex-column mt-2 border border-white rounded">
            <div className="alert alert-primary text-center py-0 rounded-0">{this.props.state.isMyMove ? 'Your' : currentPlayer.name} Dropped Cards</div>
            <div className="d-flex flex-wrap p-2">{_.sortBy(currentPlayerDroppedCards, ['number', 'type']).map((o, i) =>
                <Card key={i} disabled={true} chosenCards={[]} card={o} className="mx-auto" />)}</div>
        </div>
    }

    isChosenCard(card) {
        const { chosenCards } = this.state;
        return _.find(chosenCards, card);
    }

    getMyCards() {
        const { myCards, currentPlayerAction } = this.props.game;
        return <div className="d-flex flex-wrap p-2 mt-2">
            {_.sortBy(myCards, ['point', 'number', 'type']).map((o, i) =>
                <Card onClick={this.handleChosenCard} key={i}
                    disabled={!this.props.state.isMyMove || currentPlayerAction != 'SUBMIT'}
                    isChosenCard={this.isChosenCard(o)}
                    card={_.assign(o, { ind: i })} />)}
        </div>
    }

    getActionText() {
        switch (this.props.game.currentPlayerAction) {
            case 'SUBMIT': return 'Drop card';
            case 'TAKE': return 'Take card';
            case 'DECIDE': return 'Choose Show or Play';
        }
    }

    getPlayerTurnAlert() {
        const { isMyMove } = this.props.state, { currentPlayer } = this.props.game;
        return <div className="d-flex py-2">
            <span style={{ boxShadow: '0 0 5px white' }}
                className={`m-auto px-3 rounded text-white bg-${this.props.state.isMyMove ? 'danger' : 'secondary'} `}>
                <div className="text-center">
                    {isMyMove ? <b>Your turn</b>
                        : <span>Player <b>{currentPlayer.name}</b> turn</span>}
                </div>
                <div className="text-center">{!isMyMove && <span><b>{currentPlayer.name}</b> has to</span>} {this.getActionText()}</div>
            </span>
        </div>;
    }

    getGameButtons() {
        const isMyMove = this.props.state.isMyMove,
            { currentPlayerAction } = this.props.game,
            { submitFlag, decideFlag } = this.state;
        const isMyActionDecide = !decideFlag && isMyMove && currentPlayerAction == 'DECIDE';
        const isMyActionSubmit = !submitFlag && isMyMove && currentPlayerAction == 'SUBMIT' && this.state.chosenCards.length;
        return (<div className="d-flex my-2">
            <button disabled={!isMyActionSubmit}
                style={{ boxShadow: '5px 5px 10px black' }}
                className={`btn btn-success m-auto font-weight-bold btn-shadow ${isMyActionSubmit && 'zoom-animi'}`} onClick={this.submitChosenCards}>Submit</button>
            <button disabled={!isMyActionDecide}
                style={{ boxShadow: '5px 5px 10px black' }}
                className={`btn btn-danger m-auto font-weight-bold btn-shadow ${isMyActionDecide && 'zoom-animi'}`} onClick={this.showCards}>Show</button>
            <button disabled={!isMyActionDecide}
                style={{ boxShadow: '5px 5px 10px black' }}
                className={`btn btn-primary m-auto font-weight-bold btn-shadow ${isMyActionDecide && 'zoom-animi'}`} onClick={this.noShow}>Play</button>
        </div>);
    }

    getMyPoints() {
        return this.props.state.amIPresentInPlayers && <div className="my-2 text-center text-white">
            Points : {this.props.game.myPoints}
        </div>
    }

    renderGame() {
        return <div className="d-flex flex-column">
            {this.getPlayerTurnAlert()}
            {this.listPlayers()}
            {this.getCurrentPlayerDroppedCards()}
            {this.getDeckAndLastCard()}
            {this.getGameButtons()}
            {this.getMyPoints()}
            {this.getMyCards()}
        </div>
    }

    continueGame() {
        LeastCount.continueGame(this.props.game._id)
            .then(this.props.getGameInfo)
            .catch(this.handleError);
    }

    restartGame() {
        GameModel.restartGame(GAME_NAME, this.props.game._id)
            .then(this.props.getGameInfo)
            .catch(this.handleError);
    }

    renderGameResults() {
        const { players, playersTotalPoints, status, rounds } = this.props.game;
        const { showResult, playersPoints, showedBy } = _.nth(rounds, -1);
        return <div className="game-result text-center">
            <div className="alert alert-success text-center m-0 rounded-top rounded-bottom-0"
                style={{ boxShadow: '0 0 5px white' }}>
                <b className="text-underline">{status == 'ENDED' ? 'Final' : 'Current Round'} Results</b>
                <div><b>{showedBy._id == this.props.me._id ? 'You' : showedBy.name}</b> showed cards and its <b>{showResult}</b> show</div>
            </div>
            <div className="game-result-table">
                <table className="table table-hover table-light table-striped rounded-bottom" style={{ boxShadow: '0 0 5px white' }}>
                    <thead>
                        <tr>
                            <th scope="col">Rank</th>
                            <th scope="col">Name</th>
                            <th scope="col">Points</th>
                            {status == 'ENDED' && <th scope="col">Status</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {_.sortBy(players, o => playersTotalPoints[o._id]).map((o, i) => {
                            return <tr key={i}>
                                <td scope="row">{i + 1}</td>
                                <td>{o._id == this.props.me._id ? 'You' : o.name}</td>
                                <td><b>{playersTotalPoints[o._id]}</b> (+{playersPoints[o._id]})</td>
                                {status == 'ENDED' && <td>{i == players.length - 1 ? 'LOST' : 'WON'}</td>}
                            </tr>;
                        })}
                    </tbody>
                </table>
            </div>
            {this.props.state.amIAdmin && <div className="d-flex">
                <button className="btn btn-primary m-auto btn-shadow"
                    onClick={status == 'ENDED' ? this.restartGame : this.continueGame}>
                    {status == 'ENDED' ? 'Restart' : 'Continue'}</button>
            </div>}
        </div>;
    }

    render() {
        switch (this.props.game.status) {
            case 'STARTED': return this.renderGame();
            case 'PLAYER_SHOWED':
            case 'ENDED': return this.renderGameResults();
        }
    }

    updateReceived(data) {
        return this.props.getGameInfo();
    }
}

export default LeastCountContainer;