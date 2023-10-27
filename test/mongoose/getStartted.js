import mongoose from 'mongoose';

main().catch(err => console.log( err ) );

async function main()
{
	await mongoose.connect( 'mongodb://127.0.0.1:27017/metabeem' );

	const kittySchema = new mongoose.Schema({
		name: String,
		dueDate: { type: Date, default: Date.now },
	});
	// NOTE: methods must be added to the schema before compiling it with mongoose.model()
	kittySchema.methods.speak = function speak() {
		const greeting = this.name
				 ? 'Meow name is ' + this.name
				 : 'I don\'t have a name';
		console.log(greeting);
	};
	const Kitten = mongoose.model('Kitten', kittySchema);
	const fluffy = new Kitten({ name: 'fluffy' });
	fluffy.speak(); // "Meow name is fluffy"

	await fluffy.save();
	fluffy.speak();



	// use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}
