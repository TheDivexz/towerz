const { default: mongoose } = require('mongoose');

const StockOffLeaderboardSchema = new mongoose.Schema({
	playerid: { type: String },
	eloscore: {
		type: Number,
		default:1500,
	},
});

module.exports('StockOffLeaderboard', StockOffLeaderboardSchema);