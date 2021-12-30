import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import RoomModal from './RoomModal.jsx';
import 'styles/home.scss';

const imagesPath = '/assets/images/';
const games = [
    { name: 'Uno', backgroundImage: imagesPath + 'uno.png', gameName: 'uno', style: { height: '150px', width: '200px' } },
    { name: 'Donkey / Ass', backgroundImage: imagesPath + 'ass.png', gameName: 'ass', style: { height: '150px', width: '200px' } },
    { name: 'Least Count / Show', backgroundImage: imagesPath + 'ass.png', gameName: 'leastcount', style: { height: '150px', width: '200px' } },
    // { name: 'Ludo', backgroundImage: imagesPath + 'ludo.png', gameName: 'ludo', style: { height: '200px', width: '200px' } },
];

class Home extends React.PureComponent {

    state = {
        selectedGame: null
    }

    goTo = (path) => {
        this.props.history.push(path);
    }

    setSelectedGame = (game) => {
        this.setState({ selectedGame: game });
    }

    getGameCard = (game, key) => {
        return <button key={key} className="sg-game-card" onClick={() => this.setSelectedGame(game)}>
            <img src={game.backgroundImage} className="game-img" style={game.style} />
            <p className="sg-game-card-footer"><b>{game.name}</b></p>
        </button>;
    }

    getGames() {
        return <div className="games-body">
            {games.map(this.getGameCard)}
        </div>
    }

    getHeader() {
        return <div>
            <Link to="/profile">
                <button className="profile-btn">
                    <FontAwesomeIcon style={{ fontSize: '20px' }} icon={'user'} />
                </button>
            </Link>
        </div>;
    }

    getRoomModal() {
        return <RoomModal selectedGame={this.state.selectedGame}
            goTo={this.goTo}
            onClose={() => this.setSelectedGame(null)} />
    }

    render() {
        return <div className="home-view">
            {this.getHeader()}
            {this.getGames()}
            {this.getRoomModal()}
        </div>;
    }
}

export default Home;