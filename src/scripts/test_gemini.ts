const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    console.log("Gemini 3 initialized. Testing content generation...");
    const result = await model.generateContent("test");
    console.log("Success:", result.response.text());
  } catch (e) {
    console.error("Error:", e.message);
  }
}

listModels();
