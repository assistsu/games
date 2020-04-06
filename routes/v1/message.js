const mongodb = require('../../model/mongodb');

exports.message = async function (req, res) {
    try {
        const { text, roomID } = req.body;
        if (typeof text != "string" || text.trim().length == 0) {
            return res.status(400).json({ message: 'text should not be empty' });
        }
        if (typeof roomID != "string" || roomID.trim().length == 0) {
            return res.status(400).json({ message: 'roomID should not be empty' });
        }
        const result = await mongodb.findById('rooms', roomID);
        if (result.length == 0) {
            return res.status(400).json({ message: 'Invalid Room ID' });
        }
        if (result[0].players.filter(o => o._id == req.session.user._id).length == 0) {
            return res.json({ message: 'Joined players only can chat' });
        }
        const message = { text: text, ...req.session.user, createdAt: new Date() };
        const result1 = await mongodb.updateOne('rooms', { _id: mongodb.getId(roomID) }, { $push: { messages: message } });
        let room = result[0];
        room.messages = room.messages.push(message);
        room.myCards = room.playersCards ? room.playersCards[req.session.user._id] || [] : [];
        if (room.playersCards)
            room.players = room.players.map(o => Object.assign(o, { cards: room.playersCards[o._id].length }));
        delete room.playersCards;
        delete room.deck;
        res.json(room);
        io.emit(req.body.roomID, 'some event');
    } catch (err) {
        console.log("ERR::" + req.path, err);
        res.status(500).json({ message: err.message });
    }
}