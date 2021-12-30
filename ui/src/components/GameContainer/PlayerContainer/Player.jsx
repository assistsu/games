import React, { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import GameModel from 'Model/Game';
import GameUtil from 'Utils/Game';
import 'styles/player.scss';

export default class Player extends Component {
    constructor() {
        super();
        this.handleError = GameUtil.handleError.bind(this);
    }

    nudgePlayer = () => {
        const { isMe, amIAdmin } = this.props;
        if (isMe || !amIAdmin) return;
        const { gameName, gameId, player } = this.props;
        GameModel.nudgePlayer(gameName, gameId, player._id).catch(this.handleError);
    }

    getPlayerBorderColor() {
        return `sg-border-${this.props.isMe ? 'warning' : 'primary'}`;
    }

    isPlayerCurrentPlayer() {
        const { currentPlayer, player } = this.props;
        return currentPlayer && currentPlayer._id == player._id;
    }

    getPlayerBtn() {
        return `sg-btn${this.isPlayerCurrentPlayer() ? '-light' : ''}`;
    }

    getPlayerBtnClassName() {
        return [
            'player-card',
            this.getPlayerBtn(),
            this.getPlayerBorderColor(),
        ].join(' ');
    }

    render() {
        const { player, isMe, playerChosenCard, CardComponent, hideInfo, isPlayerWon } = this.props;
        return <div className="player-card-outer"
            data-player-id={player._id}>
            <button className={this.getPlayerBtnClassName()}
                onClick={this.nudgePlayer}
                title={player.name}>
                <div className="flex-column">
                    <FontAwesomeIcon icon={'user'} className="player-icon" />
                    <div className="player-name">{isMe ? 'You' : player.name}</div>
                    {hideInfo != true && (isPlayerWon ?
                        <span className="px-2 m-auto bg-success rounded text-white">Won</span>
                        : <div>
                            <div className="text-center" style={{ fontSize: '10px' }}><b>({player.cardsCount})</b></div>
                            {CardComponent && <div className="game-player-selected-card-back">
                                {playerChosenCard && <CardComponent card={playerChosenCard}
                                    className={'game-player-selected-card game-player-selected-card-force'} />}
                            </div>}
                        </div>)}
                </div>
            </button>
        </div>;
    }
}