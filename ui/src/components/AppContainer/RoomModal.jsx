import React from "react";
import { toast } from 'react-toastify';
import RoomModel from 'Model/Room';
import TabModal from 'UtilsContainer/TabModal.jsx';

class Room extends React.PureComponent {
    constructor() {
        super();
        this.tabNames = ['Create', 'Join'];
    }

    createRoom = (e) => {
        e.preventDefault();
        const { gameName } = this.props.selectedGame;
        RoomModel.createRoom($('#roomName').val(), gameName).then(resp => {
            this.props.goTo(`/game/${gameName}/${resp._id}`);
        }).catch(err => toast.error(err.message, { toastId: 'CANT_CREATE_ROOM' }));
    }

    renderCreateRoom = () => {
        return <form onSubmit={this.createRoom} autoComplete="off" className="sg-form">
            <label htmlFor="roomName">Room Name</label>
            <input type="text" id="roomName" required
                placeholder="Eg : Gaming Guys" />
            <button type="submit">Create</button>
        </form>;
    }

    joinRoom = (e) => {
        e.preventDefault();
        const roomID = $('#roomID').val();
        const { gameName } = this.props.selectedGame;
        RoomModel.joinRoom(gameName, roomID).then(resp => {
            this.props.goTo(`/game/${gameName}/${roomID}`);
        }).catch(err => toast.error(err.message, { toastId: 'CANT_JOIN_ROOM' }));
    }

    renderJoinRoom = () => {
        return <form onSubmit={this.joinRoom} autoComplete="off" className="sg-form">
            <label htmlFor="roomID">Room ID</label>
            <input type="text" id="roomID" required
                placeholder="Eg : 123412341234" />
            <button type="submit">Join</button>
        </form>;
    }

    render() {
        return <TabModal show={!_.isEmpty(this.props.selectedGame)} onClose={this.props.onClose}
            tabNames={this.tabNames} defaultTabIndex={0}
            tabs={[this.renderCreateRoom, this.renderJoinRoom]} />;
    }
}

export default Room;