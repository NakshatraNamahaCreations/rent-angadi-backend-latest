const mongoose = require("mongoose");
require("dotenv").config();

async function removeIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("=============MongoDb Database connected successfully");

    // Get the executives collection
    const db = mongoose.connection.db;
    const collection = db.collection('executives');

    // Remove the username index
    const result = await collection.dropIndex("phoneNumber_1");
    console.log("\nIndex removed successfully:");
    console.log(JSON.stringify(result, null, 2));

    // Close connection
    await mongoose.connection.close();
    console.log("\nConnection closed successfully");
  } catch (error) {
    console.error("\nError occurred:", error.message);
    mongoose.connection.close();
  }
}

// Run the function
removeIndex();
