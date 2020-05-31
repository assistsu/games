const Logger = require('./Logger');

function serverError(req, res, error) {
    res.status(500).json(responses.SERVER_ERROR);
    Logger.error500(req, error);
}

const responses = Object.freeze({
    INVALID_GAME_NAME: {
        message: 'Invalid game name', errCode: 'INVALID_GAME_NAME'
    },
    EMPTY_PLAYER_NAME: {
        message: 'Player name should not be empty', errCode: 'EMPTY_PLAYER_NAME'
    },
    EMPTY_MESSAGE: {
        message: 'Message should not be empty', errCode: 'EMPTY_MESSAGE'
    },
    EXCEEDED_PLAYER_NAME: {
        message: 'Player name cannot be more than 15 letters', errCode: 'EXCEEDED_PLAYER_NAME'
    },
    MESSAGE_LENGTH_EXCEED: {
        message: 'Message cannot have more than 200 letters', errCode: 'MESSAGE_LENGTH_EXCEED'
    },
    INVALID_PLAYER_TOKEN: {
        message: 'Invalid Player Token', errCode: 'INVALID_PLAYER_TOKEN'
    },
    SERVER_ERROR: {
        message: 'Server Error', errCode: 'SERVER_ERROR'
    },
    INVALID_ROOM_ID: {
        message: 'Invalid Room ID', errCode: 'INVALID_ROOM_ID'
    },
    ROOM_NOT_FOUND: {
        message: 'Room Not found', errCode: 'ROOM_NOT_FOUND'
    },
    PLAYER_NOT_FOUND_IN_ROOM: {
        message: 'Player not found in Room', errCode: 'PLAYER_NOT_FOUND_IN_ROOM'
    },
    PLAYER_NOT_FOUND_IN_GAME: {
        message: 'You are not present in playing users', errCode: 'PLAYER_NOT_FOUND_IN_GAME'
    },
    PLAYER_FOUND_IN_ROOM: {
        message: 'Player already in Room', errCode: 'PLAYER_FOUND_IN_ROOM'
    },
    ROOM_IS_FULL: {
        message: 'Room is Full', errCode: 'ROOM_IS_FULL'
    },
    NOT_YOUR_MOVE: {
        message: 'This is not your move', errCode: 'NOT_YOUR_MOVE'
    },
    GAME_STATUS_IS_NOT_CREATED: {
        message: "Game status should be created", errCode: 'GAME_STATUS_IS_NOT_CREATED'
    },
    GAME_STATUS_IS_NOT_STARTED: {
        message: 'Game status should be started', errCode: 'GAME_STATUS_IS_NOT_STARTED'
    },
    GAME_STATUS_IS_NOT_ENDED: {
        message: 'Game status should be ended', errCode: 'GAME_STATUS_IS_NOT_ENDED'
    },
    NOT_AN_ADMIN: {
        message: 'You are not a admin', errCode: 'NOT_AN_ADMIN'
    },
    INVALID_CARD: {
        message: 'Chosencard is invalid', errCode: 'INVALID_CARD'
    },
    CHOSEN_CARD_NOT_PRESENT: {
        message: 'Chosen card not present in your deck', errCode: 'CHOSEN_CARD_NOT_PRESENT'
    },
    CHOSEN_COLOR_NOT_PRESENT: {
        message: 'Chosen color should not be empty', errCode: 'CHOSEN_COLOR_NOT_PRESENT',
    },
    INVALID_CHOSEN_COLOR: {
        message: 'Chosen color is invalid', errCode: 'INVALID_CHOSEN_COLOR',
    },
    PLAYER_SPOOFING: {
        message: 'Spoofing not allowed', errCode: 'PLAYER_SPOOFING'
    },
    CANT_START_GAME: {
        message: 'Atleast 2 players needed to start a game', errCode: 'CANT_START_GAME'
    },
    NOT_SAME_NUMBERS: {
        message: 'Chosencards numbers are not same', errCode: 'NOT_SAME_NUMBERS'
    },
    PLAYER_ACTION_NOT_SUBMIT: {
        message: 'Your action should be submitting card', errCode: 'PLAYER_ACTION_NOT_SUBMIT'
    },
    PLAYER_ACTION_NOT_TAKE: {
        message: 'Your action should be taking card', errCode: 'PLAYER_ACTION_NOT_TAKE'
    },
    PLAYER_ACTION_NOT_DECIDE: {
        message: "You didn't taken card yet", errCode: 'PLAYER_ACTION_NOT_DECIDE'
    },
    INVALID_TAKE_FROM: {
        message: 'Invalid take from', errCode: 'INVALID_TAKE_FROM'
    },
    NUDGING_HIMSELF: {
        message: 'You cannot nudge yourself', errCode: 'NUDGING_HIMSELF'
    },
    NUDGE_PLAYER_NOT_IN_ROOM: {
        message: 'The player you are nudging not in your room', errCode: 'NUDGE_PLAYER_NOT_IN_ROOM'
    },
    INVALID_ROOM_NAME_TYPE: {
        errCode: 'INVALID_ROOM_NAME_TYPE', message: 'Room name is not string'
    },
    INVALID_PLAYER_NAME_TYPE: {
        errCode: 'INVALID_PLAYER_NAME_TYPE', message: 'Player name is not string'
    },
    INVALID_MESSAGE_TYPE: {
        errCode: 'INVALID_MESSAGE_TYPE', message: 'Message type is not string'
    },
    EMPTY_ROOM_NAME: {
        errCode: 'EMPTY_ROOM_NAME', message: 'Room name should not be Empty'
    },
    ROOM_NAME_LENGTH_EXCEEDED: {
        errCode: 'ROOM_NAME_LENGTH_EXCEEDED', message: 'Room name should be more than 15 characters'
    },
    CHOSEN_CARD_NOT_MATCHED: {
        message: 'Chosen card does not match with last card', errCode: 'CHOSEN_CARD_NOT_MATCHED'
    },
    PLAYER_TOOK_CARD_ALREADY: {
        message: 'You have taken a card from deck already', errCode: 'PLAYER_TOOK_CARD_ALREADY'
    },
    PLAYER_CANT_PASS: {
        message: 'Player can pass only when they take card from deck', errCode: 'PLAYER_CANT_PASS'
    },
    EMPTY_CHOSEN_CARDS: {
        message: "You didn't choose any cards", errCode: 'EMPTY_CHOSEN_CARDS'
    },
    GAME_STATUS_IS_NOT_PLAYER_SHOWED: {
        message: 'No Player has showed cards', errCode: 'GAME_STATUS_IS_NOT_PLAYER_SHOWED'
    },
    MIN_PLAYERS_NOT_PRESENT: (minPlayers = 2) => {
        return { message: `Atleast ${minPlayers} players needed`, errCode: 'MIN_PLAYERS_NOT_PRESENT' }
    }
});

module.exports = {
    serverError,
    responses,
}