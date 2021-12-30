
import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import 'emoji-mart/css/emoji-mart.css';
// import { Picker } from 'emoji-mart';
import 'styles/chatbox.scss';

class ChatContainer extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            messages: props.messages || [],
            messageText: '',
            emojisTabShowFlag: false
        };
    }

    setEmojiTabShowFlag = (flag = !this.state.emojisTabShowFlag) => {
        this.setState({ emojisTabShowFlag: flag });
    }

    appendEmojiToText = (emoji) => {
        const { messageText } = this.state;
        if (messageText == 200) return;
        this.setState({ messageText: messageText + emoji.native });
    }

    getChatMessage = (message, key) => {
        const me = this.props.me || {};
        return <div key={key} className="chatbox-message-box-outer" ref={(el) => this.messagesEnd = el}>
            <div className={`chatbox-message-box chatbox-message-align-${message._id == me._id ? 'right' : 'left'}`}>
                <div className="chatbox-message-from">
                    <b>{message._id == me._id ? 'You' : message.name}</b>
                    <span className="chatbox-message-time">{moment(message.createdAt).format('h:mm a')}</span>
                </div>
                <span className="chatbox-message-text">{message.text}</span>
            </div >
        </div>;
    }

    setMessageText = (e) => {
        let value = e.target.value;
        if (value.length > 200) value = value.substr(0, 200);
        this.setState({ messageText: value })
    }

    pushMessage = (message, flag) => {
        this.state.messages.push(message);
        if (flag) {
            this.state.messageText = '';
        }
        this.forceUpdate(() => {
            if (flag) this.scrollToBottom();
        });
    }

    sendMessage = (e) => {
        e.preventDefault();
        let messageText = this.state.messageText.trim();
        if (messageText.length == 0) return;
        this.props.onSend(messageText).then(message => {
            this.pushMessage(message, true);
        });
    }

    render() {
        const { messages } = this.state;
        return <div className={`chatbox`}>
            <div className="chatbox-header sg-bg-primary">
                <span className="chatbox-title">Messages</span>
            </div>
            <div className="chatbox-body">{messages.map(this.getChatMessage)}</div>
            <div className="chatbox-footer">
                <form onSubmit={this.sendMessage}>
                    <div className="d-flex">
                        {/* <button className="sg-btn-primary emoji-button" type="button"
                            onClick={() => this.setEmojiTabShowFlag()}>😄</button> */}
                        <input id="message-text"
                            autoComplete="off"
                            autoFocus={true}
                            onChange={this.setMessageText}
                            onFocus={() => this.setEmojiTabShowFlag(false)}
                            value={this.state.messageText} />
                        <button className="sg-btn-primary send-button"
                            type="submit"><FontAwesomeIcon icon="paper-plane" /></button>
                    </div>
                    {/* <div className={`emojis emojis-${this.state.emojisTabShowFlag}`}>
                        <Picker onSelect={this.appendEmojiToText}></Picker>
                    </div> */}
                </form>
            </div>
        </div>;
    }

    scrollToBottom() {
        if (this.messagesEnd) {
            var scroll = $('.chatbox-body');
            scroll.animate({ scrollTop: scroll.prop("scrollHeight") }, 500);
        }
    }

    componentDidMount() {
        this.scrollToBottom();
    }
}

export default ChatContainer;