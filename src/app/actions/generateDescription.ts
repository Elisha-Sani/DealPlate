"use server";

interface GenerateDescriptionParams {
    title: string;
    originalPrice: number;
    dealPrice: number;
    dietaryTags: string;
    allergens: string;
    mainIngredients: string;
    isMysteryBag?: boolean; // NEW
}

export async function generateDealDescription(
    params: GenerateDescriptionParams,
) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error(
                "GEMINI_API_KEY is missing from environment variables.",
            );
        }

        const ingredientsSection = params.isMysteryBag
            ? `This is a "Mystery Bag" deal. The customer will NOT know the exact contents until they collect it — that's the whole point.
         Do NOT mention, list, or hint at specific main ingredients, dishes, or what's actually inside.
         Instead, build excitement around the surprise, variety, and value of the unknown contents.
         IMPORTANT EXCEPTION: You MUST still reference the allergen info below if provided — this is a food safety requirement, not a spoiler.`
            : `Main Ingredients: ${params.mainIngredients || "Unknown"}`;

        const prompt = `
      Act as a food marketing expert writing copy for a student-focused food surplus marketplace called DealPlate.
      You need to write two descriptions for the following meal deal:

      Title: ${params.title}
      Original Price: Ksh ${params.originalPrice}
      Deal Price: Ksh ${params.dealPrice}
      Dietary Info/Tags: ${params.dietaryTags || "None specified"}
      Allergens: ${params.allergens || "None specified"}
      ${ingredientsSection}

      Output ONLY a raw JSON object (do not wrap in markdown \`\`\`json block) with the following format:
      {
        "briefDescription": "A single, punchy, mouth-watering sentence (max 100 characters) designed to grab a hungry student's attention.",
        "detailedDescription": "A detailed 2-3 sentence paragraph ${
            params.isMysteryBag
                ? "building excitement around the surprise nature of the bag (without revealing contents), emphasizing the great value, and noting any allergen information provided."
                : "explaining what the meal contains, emphasizing the great value, and noting any dietary/allergen information provided."
        }"
      }
    `;

        let response;
        let data;
        const maxRetries = 3;
        let delay = 1500; // start with 1.5s delay

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                    }),
                },
            );

            if (response.ok) {
                data = await response.json();
                break;
            }

            const errText = await response.text();
            console.error(
                `Gemini API Error (Attempt ${attempt + 1}/${maxRetries}):`,
                errText,
            );

            // Only retry on 503 (Service Unavailable) or 429 (Too Many Requests)
            if (
                (response.status === 503 || response.status === 429) &&
                attempt < maxRetries - 1
            ) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
                continue;
            }

            throw new Error(
                `Gemini API returned an error: ${response.status} ${response.statusText}`,
            );
        }
        const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textOutput) {
            throw new Error("No response generated");
        }

        let parsed;
        try {
            let rawText = textOutput.trim();
            if (rawText.startsWith("```json")) {
                rawText = rawText
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .trim();
            }
            parsed = JSON.parse(rawText);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", textOutput);
            throw new Error("Failed to parse Gemini output as JSON.");
        }

        return {
            success: true,
            briefDescription: parsed.briefDescription,
            detailedDescription: parsed.detailedDescription,
        };
    } catch (error: any) {
        console.error("Gemini Generation Error:", error);
        return {
            success: false,
            error: error.message || "Failed to generate description.",
        };
    }
}
