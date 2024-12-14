import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateStudyNotes({ topic, subject, difficulty }) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    },
  });

  const prompt = `
    You are a professional educator creating comprehensive study notes. Generate detailed, educational study notes about "${topic}" for ${subject} at ${difficulty} level.
    
    IMPORTANT: Generate a complete, detailed study guide. DO NOT use placeholders. Write out actual content, terms, examples, and explanations.
    Keep each chapter concise but informative (around 500 words).

    The response must be a valid JSON object with this structure:
    {
      "title": "Main title for the notes",
      "chapters": [
        {
          "title": "Chapter 1: [Topic]",
          "content": "Actual detailed content here...",
          "order": 1
        }
      ]
    }

    Required Chapter Structure:
    Chapter 1: Core Concepts and Definitions
    - Clear introduction to the topic
    - Key terms with examples
    - Fundamental principles
    - Basic formulas with explanations
    - Common misconceptions
    Example: "The Pythagorean theorem states that in a right triangle, $a^2 + b^2 = c^2$, where $c$ is the hypotenuse..."

    Chapter 2: Detailed Explanations and Examples
    - Thorough explanations
    - Step-by-step examples
    - Real-world applications
    Example: "Let's solve a practical example: If a ladder is 10 meters long..."

    Chapter 3: Problem-Solving Techniques
    - Specific methods
    - Example problems with solutions
    - Common errors and corrections
    Example: "When solving right triangle problems, follow these steps..."

    Chapter 4: Practice Problems and Solutions
    - Mix of practice problems
    - Complete solutions
    - Step-by-step explanations
    Example: "Problem 1: Find the hypotenuse when the legs are 3 and 4..."

    Chapter 5: Advanced Topics and Extensions
    - Advanced applications
    - Connections to other topics
    - Study strategies
    Example: "This concept extends to trigonometry when..."

    Requirements:
    1. Each chapter should be around 500 words
    2. Use proper mathematical notation:
       Inline: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$
       Display: $$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$
    3. Include worked examples
    4. Use clear language
    5. Make content appropriate for ${difficulty} level
    6. NO placeholders or [brackets]

    CRITICAL: Write actual content. NO placeholders.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Remove any non-JSON content
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON object found in response');
    }
    text = text.slice(jsonStart, jsonEnd);

    // Clean the text while preserving LaTeX
    text = text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\\/g, '\\\\') // First, escape all backslashes
      .replace(/\n/g, '\\n') // Replace newlines with escaped newlines
      .replace(/\r/g, '') // Remove carriage returns
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/"{2,}/g, '"') // Fix multiple quotes
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    // Additional cleanup for any remaining problematic characters
    text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    try {
      // Try to parse the cleaned JSON
      const parsedData = JSON.parse(text);

      // Validate the structure and content
      if (!parsedData.title || typeof parsedData.title !== 'string') {
        throw new Error('Invalid or missing title');
      }

      if (!Array.isArray(parsedData.chapters) || parsedData.chapters.length === 0) {
        throw new Error('Invalid or missing chapters array');
      }

      if (parsedData.chapters.length !== 5) {
        throw new Error('Expected exactly 5 chapters');
      }

      // Validate each chapter
      parsedData.chapters.forEach((chapter, index) => {
        if (!chapter.title || typeof chapter.title !== 'string') {
          throw new Error(`Invalid title in chapter ${index + 1}`);
        }
        if (!chapter.content || typeof chapter.content !== 'string' || chapter.content.length < 200) {
          throw new Error(`Invalid or too short content in chapter ${index + 1}`);
        }
        if (!chapter.order || typeof chapter.order !== 'number') {
          throw new Error(`Invalid order in chapter ${index + 1}`);
        }
        // Check for placeholder content
        if (chapter.content.includes('[') && chapter.content.includes(']')) {
          throw new Error(`Chapter ${index + 1} contains placeholder content`);
        }
      });

      // Clean and validate the data
      return {
        title: String(parsedData.title).trim(),
        chapters: parsedData.chapters.map((chapter) => ({
          title: String(chapter.title).trim(),
          content: String(chapter.content).trim(),
          order: Number(chapter.order),
        })),
      };
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Cleaned Text:', text);
      throw new Error('Failed to generate valid study notes. Please try again.');
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate study notes. Please try again.');
  }
} 