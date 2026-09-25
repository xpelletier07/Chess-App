import express from "express";
import cors from "cors";


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Importation des routes


// Route de base
app.get("/", (req, res) => {
  res.json({ message: "Chess-App API en ligne" });
});

// Route de santé simple (utilisée par le CI / healthchecks)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});