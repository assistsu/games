import React from "react";
import { toast } from 'react-toastify';
import Player from 'Model/Player';
import { setPlayerAction } from '../redux';
import 'styles/login.scss';

class Login extends React.PureComponent {

    handleSubmit = (e) => {
        e.preventDefault();
        Player.login($('#playerName').val()).then(resp => {
            setPlayerAction(resp);
        }).catch(err => toast.error(err.message, { toastId: err.errCode }));
    }

    render() {
        return <div className="login-view d-flex">
            <div className="sg-card m-auto">
                <form className="sg-form login-form"
                    onSubmit={this.handleSubmit} autoComplete="off">
                    <label htmlFor="playerName">Player Name</label>
                    <input type="text" id="playerName" required placeholder="Eg : john" />
                    <button>Login</button>
                </form>
            </div>
        </div>;
    }
}

export default Login;