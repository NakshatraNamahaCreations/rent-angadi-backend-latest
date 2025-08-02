const mongoose = require("mongoose");
require("dotenv").config();


async function checkIndexes() {
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

    // List all indexes
    const indexes = await collection.indexes();
    console.log("\nCurrent indexes:");
    indexes.forEach((index, i) => {
      console.log(`\nIndex `, i + 1);
      console.log(JSON.stringify(index, null, 2));
      console.log(`- Name: `, index.name);
      console.log(`- Keys: `, JSON.stringify(index.key));
      console.log(`- Unique: `, index.unique);
    });

    // Close connection
    await mongoose.connection.close();
    console.log("\nConnection closed successfully");
  } catch (error) {
    console.error("\nError occurred:", error.message);
    mongoose.connection.close();
  }
}

// Run the function
checkIndexes();

