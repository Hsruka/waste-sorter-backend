// controllers/wasteController.js
const mysql = require('mysql2/promise');
const tf = require('@tensorflow/tfjs');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs').promises;

// --- Database Config (No changes) ---
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// --- Model and Metadata variables ---
let model;
let metadata;

// --- Model Loading (Updated) ---
const modelPath = path.join(__dirname, '../model/');
const modelURL = path.join(modelPath, 'model.json');
const metadataURL = path.join(modelPath, 'metadata.json');

const fileHandler = {
    load: async () => {
        const modelJson = JSON.parse(await fs.readFile(modelURL, 'utf8'));
        const modelWeights = await fs.readFile(path.join(modelPath, 'weights.bin'));
        return {
            modelTopology: modelJson.modelTopology,
            weightSpecs: modelJson.weightsManifest[0].weights,
            weightData: modelWeights.buffer,
        };
    }
};

async function loadModel() {
  if (model) return;
  try {
    console.log("Loading model from local files...");
    // Load the raw TensorFlow.js model
    model = await tf.loadLayersModel(fileHandler);
    // Load the metadata file which contains class names
    metadata = JSON.parse(await fs.readFile(metadataURL, 'utf8'));
    console.log("Model and metadata loaded successfully.");
    // Optional: Print model summary
    // model.summary();
  } catch (error) {
    console.error("Failed to load model:", error);
    process.exit(1);
  }
}
loadModel();

const analyzeImage = async (imagePath) => {
  try {
    if (!model || !metadata) {
      throw new Error("Model or metadata is not loaded yet.");
    }
    const image = await Jimp.read(imagePath);
    image.resize(224, 224);
    const pixels = [];
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
        pixels.push(image.bitmap.data[idx + 0] / 255); // Normalize to [0, 1]
        pixels.push(image.bitmap.data[idx + 1] / 255); // Normalize to [0, 1]
        pixels.push(image.bitmap.data[idx + 2] / 255); // Normalize to [0, 1]
    });
    
    // Create a tensor and add a batch dimension
    const imageTensor = tf.tensor3d(pixels, [224, 224, 3]).expandDims(0);
    
    // Predict using the raw TensorFlow.js model
    const predictions = model.predict(imageTensor);
    
    // Get the index of the highest probability
    const highestProbabilityIndex = predictions.argMax(1).dataSync()[0];
    
    // Get the class name from metadata using the index
    const className = metadata.labels[highestProbabilityIndex];

    console.log("Prediction result:", className);
    
    // Clean up tensors
    imageTensor.dispose();
    predictions.dispose();
    
    return className;

  } catch (error) {
    console.error("Error during image analysis:", error);
    return "General"; // Default value on error
  }
};

// --- Controllers (addWaste, getHistory - No changes) ---
exports.addWaste = async (req, res) => {
  const userId = req.user.id;
  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required.' });
  }
  try {
    const detectedType = await analyzeImage(req.file.path);
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO wastes (user_id, waste_type, imageUrl) VALUES (?, ?, ?)',
      [userId, detectedType, imageUrl]
    );
    await connection.end();
    res.status(201).json({ 
        message: 'Waste record added successfully.', 
        waste_type: detectedType,
        imageUrl 
    });
  } catch (error) {
    console.error("Server error on addWaste:", error);
    res.status(500).json({ error: 'Server error during waste processing.' });
  }
};

exports.getHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT id as _id, waste_type, imageUrl, createdAt FROM wastes WHERE user_id = ? ORDER BY createdAt DESC', 
      [userId]
    );
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};