import React from "react";
import { connect } from 'react-redux';
import { setPlayerAction } from '../redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'styles/profile.scss';

class Profile extends React.PureComponent {

    gotoHome = () => {
        this.props.history.replace('/');
    }

    signout = () => {
        setPlayerAction(null);
        this.gotoHome();
    }

    render() {
        const { player } = this.props;
        return <div className="profile-view">
            <div className="profile-card">
                <FontAwesomeIcon icon='user' style={{ fontSize: '50px' }} />
                <h5 className="card-title text-center text-truncate">{player.name}</h5>
            </div>
            <div className="flex-column">
                <button className="home-btn" onClick={this.gotoHome}>Home</button>
                <button className="signout-btn" onClick={this.signout}>Sign-out</button>
            </div>
        </div>;
    }
}

export default connect(state => state)(Profile);