const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PersonSchema = new mongoose.Schema({
	phoneNumber: {
		type: String,
		required: true,
		unique: true,
	},
	// password: {
	// 	type: String,
	// 	required: true,
	// 	minlength: 6,
	// },
	role: {
		type: String,
		enum: ['client', 'executive'],
		required: true,
	},
	clientId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Client',
	},
	executiveId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Executive',
	},
	isActive: {
		type: Boolean,
		default: true,
	},
}, { timestamps: true });

PersonSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

PersonSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

const Person = mongoose.model('Person', PersonSchema);

module.exports = Person;
