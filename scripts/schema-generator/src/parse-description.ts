import * as fs from "fs";
import * as path from "path";

interface JsonObject {
  [key: string]: any;
  description?: string;
}

/**
 * Processes all JSON files in a directory and adds a description field to each object
 * @param directoryPath Path to the directory containing JSON files
 */
async function processJsonFiles(directoryPath: string): Promise<void> {
  try {
    // Check if directory exists
    if (!fs.existsSync(directoryPath)) {
      throw new Error(`Directory ${directoryPath} does not exist`);
    }

    // Read all files in the directory
    const files = fs.readdirSync(directoryPath);

    // Filter for JSON files
    const jsonFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".json"
    );

    for (const file of jsonFiles) {
      const filePath = path.join(directoryPath, file);

      try {
        // Read and parse JSON file
        const jsonContent = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(jsonContent);

        // Check if the content is an array
        if (!Array.isArray(jsonData)) {
          console.warn(`Skipping ${file}: Content is not an array`);
          continue;
        }

        // Add description field to each object
        const updatedData = jsonData.map((item: JsonObject) => ({
          ...item,
          description: "",
        }));

        // Write back to file with pretty formatting
        fs.writeFileSync(
          filePath,
          JSON.stringify(updatedData, null, 2),
          "utf8"
        );

        console.log(`Successfully processed ${file}`);
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
      }
    }

    console.log("All JSON files processed");
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Example usage
const directoryPath = "./generated"; // Replace with your directory path
processJsonFiles(directoryPath)
  .then(() => console.log("Processing complete"))
  .catch((error) => console.error("Processing failed:", error));
