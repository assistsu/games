import React, { Suspense } from "react";
import socketIOClient from "socket.io-client";
import { connect } from 'react-redux';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import GameConfig from 'Config/Game';
import GameModel from 'Model/Game';
import RoomModel from 'Model/Room';
import GameUtil from 'Utils/Game';
import ConfirmModal from 'UtilsContainer/ConfirmModal.jsx';
import Player from './PlayerContainer/Player.jsx';
import 'styles/game-layout.scss';
import ChatContainer from './ChatContainer.jsx';
import { getLoader } from 'Utils/Loader';

class GameLayout extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = _.assign({
            game: {
                _id: this.props.match.params.id,
                status: 'LOADING',
            },
            myIndexInPlayers: -1,
            amIPresentInPlayers: false,
            amIAdmin: false,
            leaveConfirmModalShowFlag: false,
            chatboxShowFlag: false,
            emojisTabShowFlag: false,
            newMessagesCount: 0,
        }, this.getInitialValues());

        this.me = _.pick(this.props.player, ['name', '_id']);

        this.socket = socketIOClient();
        this.isSocketListensOnGameUpdate = false;

        this.getGameInfo = this.getGameInfo.bind(this);
        this.updateGameInfo = this.updateGameInfo.bind(this);
        this.errorOnGetGameInfo = this.errorOnGetGameInfo.bind(this);
        this.startGame = this.startGame.bind(this);
        this.joinGame = this.joinGame.bind(this);
        this.leaveGame = this.leaveGame.bind(this);
        this.gotoHome = this.gotoHome.bind(this);
        this.handleError = GameUtil.handleError.bind(this);
    }

    getInitialValues() {
        return {
            isGameStatusFetching: false,
            error: null,
        }
    }

    getGameInfo() {
        this.setState({ isGameStatusFetching: true });
        GameModel.getGameInfo(this.props.gameName, this.state.game._id)
            .then(this.updateGameInfo)
            .catch(this.errorOnGetGameInfo);
    }

    errorOnGetGameInfo(error) {
        this.state.error = error;
        this.setState(_.assign(this.getInitialValues(), { error }));
    }

    updateGameInfo(data) {
        return new Promise((resolve) => {
            let updateObj = _.assign({ game: _.cloneDeep(this.state.game) }, this.getInitialValues());
            _.assign(updateObj.game, _.pick(data, GameConfig.gameFieldsMap[this.props.gameName]));
            updateObj.myIndexInPlayers = _.findIndex(updateObj.game.players || [], this.me);
            updateObj.amIPresentInPlayers = updateObj.myIndexInPlayers != -1;
            updateObj.amIAdmin = updateObj.game.admin._id == this.me._id;
            updateObj.isMyMove = updateObj.game.currentPlayer && updateObj.game.currentPlayer._id == this.me._id;
            this.setState(updateObj, resolve);
        });
    }

    getAudios() {
        return <div>
            {GameUtil.audios.map((o, i) => <audio id={o} key={i}>
                <source src={`/assets/music/${o}.mp3`} type="audio/mpeg" />
            </audio>)}
        </div>;
    }

    renderLoader() {
        return getLoader("Fetching game data... Please wait...");
    }

    renderError() {
        return <div className="sg-alert-danger">{this.state.error.message}</div>;
    }

    getRefreshButton() {
        return <button className={`sg-btn-primary refresh-game-btn`}
            onClick={this.getGameInfo} disabled={this.state.isGameStatusFetching}>
            <FontAwesomeIcon icon={'sync-alt'} className="refresh-icon" />
        </button>;
    }

    getLeaveButton() {
        return <button className={`sg-btn-primary leave-btn`}
            onClick={() => this.setLeaveConfirmModalShowFlag(true)}><FontAwesomeIcon icon="sign-out-alt" /></button>;
    }

    getChatBoxButton() {
        const { amIPresentInPlayers, chatboxShowFlag, newMessagesCount } = this.state;
        return amIPresentInPlayers && <button onClick={() => this.toggleChatboxShowFlag()}
            className={`chatbox-btn btn-shadow ${chatboxShowFlag ? 'chatbox-hide-btn' : 'chatbox-show-btn'}`}>
            {chatboxShowFlag ?
                <span>&times;</span> :
                <span>
                    {newMessagesCount > 0 && <span className="chatbox-new-message-count">{newMessagesCount}</span>}
                    <FontAwesomeIcon icon="comment-alt" />
                </span>}
        </button>;
    }

    gotoHome() {
        this.props.history.replace('/');
    }

    setLeaveConfirmModalShowFlag(flag) {
        this.setState({ leaveConfirmModalShowFlag: flag });
    }

    toggleChatboxShowFlag() {
        this.setState({ chatboxShowFlag: !this.state.chatboxShowFlag, newMessagesCount: 0 });
    }

    leaveGame() {
        GameModel.leaveGame(this.props.gameName, this.state.game._id)
            .then(this.gotoHome)
            .catch(this.handleError);
    }

    getLeaveConfirmModal() {
        const { amIPresentInPlayers } = this.state;
        return <ConfirmModal id="leaveConfirmModal"
            show={this.state.leaveConfirmModalShowFlag}
            onYes={amIPresentInPlayers ? this.leaveGame : this.gotoHome}
            onNo={() => this.setLeaveConfirmModalShowFlag(false)} />;
    }

    getGameHeader() {
        return this.state.game.roomName && <div className="game-layout-header">
            {this.getRefreshButton()}
            {this.getLeaveButton()}
            {this.getLeaveConfirmModal()}
        </div>;
    }

    getRoomID() {
        return <div className="room-id-box">
            <span className="sg-btn m-auto">
                <span>Room ID : {this.state.game._id}</span>
                <span>&nbsp;</span>
                <CopyToClipboard text={this.state.game._id}
                    onCopy={() => toast.info('Room ID copied to clipboard')}>
                    <button>
                        <FontAwesomeIcon className="text-white" icon={'copy'} />
                    </button>
                </CopyToClipboard>
            </span>
        </div>;
    }

    listPlayers() {
        const { players } = this.state.game;
        return <div className="flex-wrap">
            {players.map((o, i) => <Player key={i}
                gameId={this.state.game._id}
                gameName={this.props.gameName}
                isMe={o._id == this.me._id}
                amIAdmin={this.state.amIAdmin}
                player={o}
                hideInfo={true} />)}
        </div>;
    }

    joinGame() {
        RoomModel.joinRoom(this.props.gameName, this.state.game._id)
            .then(() => {
                this.state.game.players.push(this.me);
                this.updateGameInfo({ players: this.state.game.players })
            }).catch(this.handleError);
    }

    getJoinButton() {
        return !this.state.amIPresentInPlayers && <button
            className="sg-btn-primary m-auto"
            onClick={this.joinGame}>Join</button>;
    }

    startGame() {
        GameModel.startGame(this.props.gameName, this.state.game._id)
            .then(this.updateGameInfo)
            .catch(this.handleError);
    }

    getStartButton() {
        return <button className="sg-btn-primary m-auto"
            onClick={this.startGame} >Start</button>;
    }

    getButton() {
        return <div className="d-flex">
            {this.state.amIAdmin ? this.getStartButton() : this.getJoinButton()}
        </div>;
    }

    getWaitForPlayersLayout() {
        return <div className="flex-column">
            {this.getRoomID()}
            {this.listPlayers()}
            {this.getButton()}
        </div>
    }

    getGameLoader() {
        return getLoader("Fetching game assets...");
    }

    getGameBody() {
        // if (this.state.chatboxShowFlag) return;
        const { GameComponent } = this.props;
        switch (this.state.game.status) {
            case 'CREATED':
                return this.getWaitForPlayersLayout();
            default:
                return <div className="game-component">
                    <Suspense fallback={this.getGameLoader()}>
                        <GameComponent ref={"gameObj"}
                            state={_.omit(this.state, 'game')}
                            game={this.state.game}
                            me={this.me}
                            socket={this.socket}
                            getGameInfo={this.getGameInfo}
                            updateGameInfo={this.updateGameInfo} />
                    </Suspense>
                </div>
        }
    }

    incNewMessageCount = () => {
        this.setState({ newMessagesCount: this.state.newMessagesCount + 1 });
    }

    sendMessage = (messageText) => {
        return new Promise((resolve, reject) => {
            GameModel.sendMessage(this.props.gameName, this.state.game._id, messageText)
                .then(message => {
                    resolve(message);
                }).catch(this.handleError);
        });
    }

    getChatbox() {
        return <div className={`chatbox-outer chatbox-${this.state.chatboxShowFlag && 'show'}`}>
            <ChatContainer me={this.me}
                ref="chatbox"
                messages={this.state.game.messages}
                onSend={this.sendMessage} />
        </div>;
    }

    renderGameLayout() {
        return <div>
            {this.getAudios()}
            {this.getGameHeader()}
            {this.getGameBody()}
            {this.getChatbox()}
            {this.getChatBoxButton()}
        </div>;
    }

    getRoomBody() {
        if (this.state.error) return this.renderError();
        switch (this.state.game.status) {
            case 'LOADING':
                return this.renderLoader();
            default:
                return this.renderGameLayout();
        }
    }

    // getBg() {
    //     return <div className="game-layout-bg">
    //         {Array(70).fill().map((o, i) => <div className="game-layout-bg-box" key={i}></div>)}
    //     </div>;
    // }

    getGameName() {
        return <span className="sg-btn game-name">Game : {this.props.gameDisplayName}</span>
    }

    getRoomName() {
        return this.state.game.status != 'LOADING' && <span className="sg-btn room-name ml-auto">Room : {this.state.game.roomName}</span>;
    }

    getRoomHeader() {
        return <div className="room-header">
            {this.getGameName()}
            {this.getRoomName()}
        </div>;
    }

    render() {
        return <div className="game-layout">
            {/* {this.getBg()} */}
            <div className="game-layout-body">
                {this.getRoomHeader()}
                {this.getRoomBody()}
            </div>
        </div>;
    }

    nudgedMe(nudgedBy) {
        toast.info(`You are nudged by ${nudgedBy.name}`, { toastId: 'PLAYER_NUDGED' });
        GameUtil.vibrate();
        GameUtil.playBuzzNotify();
    }

    updateReceivedForPlayer = (data) => {
        switch (data.event) {
            case 'NUDGED':
                this.nudgedMe(data.nudgedBy);
                break;
            case 'NEW_MESSAGE':
                toast.info(`New message from ${data.message.name}`);
                this.refs["chatbox"].pushMessage(data.message);
                this.incNewMessageCount();
                GameUtil.playLightNotify();
                break;
        }
    }

    componentDidMount() {
        this.getGameInfo();
        this.socket.on(this.me._id, this.updateReceivedForPlayer);
        this.socket.on('connect', () => {
            if (this.state.isGameStatusFetching) return;
            this.getGameInfo();
        });
    }

    updateReceivedForGame = (data) => {
        if (data.gameData.updatedBy._id == this.me._id) return;
        switch (data.event) {
            case 'NEW_PLAYER_JOINED':
                toast.info(`${data.gameData.player.name} joined the game`, { toastId: 'NEW_PLAYER_JOINED' + data.gameData.player._id })
                this.state.game.players.push(data.gameData.player);
                this.updateGameInfo({ players: this.state.game.players }).then(GameUtil.playNewNotify);
                break;
            case 'PLAYER_LEFT_ROOM':
                const leftPlayer = this.state.game.players[data.gameData.leftPlayerIndex];
                toast.info(`${leftPlayer.name} is left the game`, { toastId: 'PLAYER_LEFT_GAME_' + leftPlayer._id });
            case 'GAME_STARTED':
                GameUtil.playNewNotify();
                this.getGameInfo();
                break;
            case 'GAME_RESTARTED':
                GameUtil.playNewNotify();
                this.updateGameInfo(data.gameData).then(GameUtil.playNewAudio);
                break;
            default:
                return this.refs.gameObj.updateReceived(data);
        }
    }

    componentDidUpdate() {
        if (!this.isSocketListensOnGameUpdate) {
            switch (this.state.game.status) {
                case 'LOADING':
                case 'ERROR':
                    break;
                default:
                    this.isSocketListensOnGameUpdate = true;
                    this.socket.on(this.state.game._id, this.updateReceivedForGame);
                    break;
            }
        }
    }

    componentWillUnmount() {
        this.socket.disconnect();
    }
}

export default connect(state => state)(GameLayout);