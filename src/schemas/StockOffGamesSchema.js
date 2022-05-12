const { default: mongoose } = require('mongoose');

const StockOffGamesSchema = new mongoose.Schema({
	// Name of the Game
	gameName: mongoose.SchemaTypes.String,
	// Who Started this game?
	host: mongoose.SchemaTypes.String,
	// What date did the game start?
	startDate: {
		type: Date,
		default: new Date(),
	},
	// What day does the game end?
	endDate: mongoose.SchemaTypes.Date,
	// How much does everyone start with?
	startingCash: mongoose.SchemaTypes.Number,
	// Is the Game still going?
	isOngoing: mongoose.SchemaTypes.Boolean,
	// Who is playing?
	players: [{
		// Player ID
		playerid: { type: String },
		// How Much Money do they Have?
		currentValue: { type: Number },
		// What's their portfolio looking like?
		stocks: [{
			// The Name of the stock
			code: { type: String },
			// How Much was the stock worth when they bought it
			stockvalue: { type: Number },
			// number of stocks held
			amountheld: { type: Number },
		}],
		// Are they still Playing the game?
		isStillPlaying: {
			type: Boolean,
			default: true,
		},
	}],
});

module.exports = mongoose.model('StockOffGames', StockOffGamesSchema);