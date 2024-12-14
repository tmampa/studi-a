import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateStudyNotes({ topic, subject, difficulty }) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
    You are a professional educator creating study notes. Generate comprehensive study notes about "${topic}" for ${subject} at ${difficulty} level.
    
    IMPORTANT: Respond ONLY with a valid JSON object. Do not include any explanations or additional text.
    The response must be a single, valid JSON object with this exact structure:
    {
      "title": "Main title for the notes",
      "chapters": [
        {
          "title": "Chapter 1: [Topic]",
          "content": "Content for chapter 1",
          "order": 1
        }
      ]
    }

    Rules:
    1. Create exactly 3 chapters
    2. Each chapter should be 2-3 paragraphs long
    3. Use only plain text in content (no special characters)
    4. Chapter titles must be numbered (e.g., "Chapter 1: Introduction")
    5. Content should be appropriate for ${difficulty} level
    6. Include examples and explanations
    7. Do not use line breaks in content
    8. Keep paragraphs in a single line, separated by spaces
    9. Do not use any special characters that would break JSON
    10. Make sure the JSON is properly formatted and valid

    Remember: The entire response must be a single, valid JSON object with no additional text.
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

    // Clean the text
    text = text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\r/g, ' ') // Replace carriage returns with spaces
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/\\/g, '') // Remove backslashes
      .replace(/\\"/g, '"') // Fix escaped quotes
      .replace(/"{2,}/g, '"') // Fix multiple quotes
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

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

      if (parsedData.chapters.length !== 3) {
        throw new Error('Expected exactly 3 chapters');
      }

      // Validate each chapter
      parsedData.chapters.forEach((chapter, index) => {
        if (!chapter.title || typeof chapter.title !== 'string') {
          throw new Error(`Invalid title in chapter ${index + 1}`);
        }
        if (!chapter.content || typeof chapter.content !== 'string' || chapter.content.length < 100) {
          throw new Error(`Invalid or too short content in chapter ${index + 1}`);
        }
        if (!chapter.order || typeof chapter.order !== 'number') {
          throw new Error(`Invalid order in chapter ${index + 1}`);
        }
      });

      // Clean and validate the data
      return {
        title: String(parsedData.title).trim(),
        chapters: parsedData.chapters.map((chapter, index) => ({
          title: String(chapter.title).trim(),
          content: String(chapter.content).trim().replace(/\s+/g, ' '),
          order: Number(chapter.order),
        })),
      };
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Cleaned Text:', text);
      
      // Try to generate a more meaningful fallback response
      return {
        title: `${subject}: ${topic}`,
        chapters: [
          {
            title: 'Chapter 1: Introduction',
            content: `Let's explore ${topic} in ${subject}. This topic is important for students at the ${difficulty} level. We'll cover the fundamental concepts and provide clear examples to help you understand the material.`,
            order: 1,
          },
          {
            title: 'Chapter 2: Core Concepts',
            content: `The main concepts of ${topic} include several key points that we'll explore in detail. Understanding these concepts is crucial for mastering this subject area. We'll break down each concept step by step.`,
            order: 2,
          },
          {
            title: 'Chapter 3: Applications and Examples',
            content: `Now let's look at how ${topic} is applied in real-world situations. We'll examine practical examples and solve problems together. This will help reinforce your understanding of the material.`,
            order: 3,
          }
        ],
      };
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate study notes. Please try again.');
  }
} 