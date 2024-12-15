import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function retryWithBackoff(fn, maxRetries = 3) {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, retries - 1) * 1000;
      console.log(`Retry ${retries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

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
    const result = await retryWithBackoff(async () => {
      const result = await model.generateContent(prompt);
      if (!result || !result.response) {
        throw new Error('No response from AI model');
      }
      return result;
    });

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

export async function generateFlashcards(noteContent) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }

  if (!noteContent || typeof noteContent !== 'string' || noteContent.trim().length === 0) {
    throw new Error('Invalid note content provided');
  }

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    },
  });

  const prompt = `
    Create comprehensive flashcards from this educational content. Each flashcard should test a key concept.

    Content to process:
    ${noteContent}

    IMPORTANT:
    1. Create 10-15 high-quality flashcards
    2. Cover key concepts, definitions, and principles
    3. Make questions clear and specific
    4. Keep answers concise but complete
    5. Include important formulas and their applications
    6. Ensure proper mathematical notation using LaTeX (e.g., $a^2 + b^2 = c^2$)

    The response must be a valid JSON array of objects with this structure:
    [
      {
        "front": "What is the question?",
        "back": "The complete answer"
      }
    ]

    Requirements for questions (front):
    - Clear and unambiguous
    - Test understanding, not just memorization
    - Use proper terminology
    - Include "what", "how", "why" questions

    Requirements for answers (back):
    - Concise but complete
    - Include key points
    - Use proper notation
    - Provide clear explanations

    Return ONLY the JSON array, no additional text.`;

  try {
    const result = await retryWithBackoff(async () => {
      const result = await model.generateContent(prompt);
      if (!result || !result.response) {
        throw new Error('No response from AI model');
      }
      return result;
    });

    const response = await result.response;
    const text = response.text();
    
    // Extract and validate JSON array
    const flashcardsMatch = text.match(/\[[\s\S]*\]/);
    if (!flashcardsMatch) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse flashcards from AI response');
    }
    
    let flashcards;
    try {
      flashcards = JSON.parse(flashcardsMatch[0]);
    } catch (error) {
      console.error('Invalid JSON in AI response:', flashcardsMatch[0]);
      throw new Error('Invalid flashcards format from AI');
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('No valid flashcards generated');
    }

    // Validate each flashcard
    flashcards.forEach((card, index) => {
      if (!card.front || !card.back || 
          typeof card.front !== 'string' || 
          typeof card.back !== 'string' ||
          card.front.trim().length === 0 ||
          card.back.trim().length === 0) {
        throw new Error(`Invalid flashcard at index ${index}`);
      }
    });

    return flashcards;
  } catch (error) {
    console.error('Error in generateFlashcards:', error);
    if (error.message.includes('Failed to parse') || 
        error.message.includes('Invalid flashcard') ||
        error.message.includes('No valid flashcards')) {
      throw error;
    }
    throw new Error('Failed to generate flashcards. Please try again.');
  }
}

export async function generateQuiz(noteContent, { numQuestions = 5, difficulty = 'medium' }) {
  if (!noteContent) {
    throw new Error('Note content is required');
  }

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.9,
    },
  });

  // Extract and format note content
  let formattedContent = '';
  try {
    if (typeof noteContent === 'object') {
      if (noteContent.chapters && Array.isArray(noteContent.chapters)) {
        formattedContent = noteContent.chapters
          .sort((a, b) => a.order - b.order)
          .map(chapter => `${chapter.title}\n${chapter.content}`)
          .join('\n\n');
      } else if (noteContent.content) {
        // Handle case where content is directly in the object
        formattedContent = noteContent.content;
      } else {
        // Try to stringify the object
        formattedContent = JSON.stringify(noteContent);
      }
    } else if (typeof noteContent === 'string') {
      formattedContent = noteContent;
    } else {
      throw new Error(`Invalid note content type: ${typeof noteContent}`);
    }

    if (!formattedContent.trim()) {
      throw new Error('Formatted content is empty');
    }

    console.log('Formatted content length:', formattedContent.length);
  } catch (error) {
    throw new Error(`Failed to format note content: ${error.message}`);
  }

  const prompt = `
    You are an expert educator creating a quiz based on study notes. Generate ${numQuestions} multiple-choice questions at ${difficulty} difficulty level from the following study notes:

    ${formattedContent}

    IMPORTANT: Generate challenging but fair questions that test understanding, not just memorization.
    Each question should have 4 options with only one correct answer.
    Include a mix of conceptual and application questions.
    DO NOT use LaTeX math delimiters ($). Instead, write mathematical expressions in plain text.

    The response must be a valid JSON array of question objects with this structure:
    [
      {
        "question": "The actual question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Detailed explanation of why this is the correct answer"
      }
    ]

    Guidelines for different difficulty levels:
    - Easy: Basic recall and simple concept application
    - Medium: Understanding relationships and moderate problem-solving
    - Hard: Complex analysis, evaluation, and advanced applications
  `;

  try {
    // Use retry logic for the API call
    const result = await retryWithBackoff(async () => {
      const result = await model.generateContent(prompt);
      if (!result || !result.response) {
        throw new Error('No response from AI model');
      }
      return result;
    });

    const response = result.response;
    const text = response.text();
    if (!text) {
      throw new Error('Empty response from AI model');
    }

    console.log('AI response:', text);
    
    // Find the JSON content within the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in response');
    }
    
    let questions;
    try {
      // Clean the JSON string by escaping any remaining $ characters
      const cleanJson = jsonMatch[0].replace(/\$/g, '\\$');
      questions = JSON.parse(cleanJson);
    } catch (error) {
      console.error('JSON parsing error. Raw JSON:', jsonMatch[0]);
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
    
    // Validate the questions format
    if (!Array.isArray(questions)) {
      throw new Error('Response is not an array');
    }

    if (questions.length === 0) {
      throw new Error('No questions generated');
    }
    
    questions.forEach((q, index) => {
      if (!q.question) throw new Error(`Question ${index} is missing question text`);
      if (!Array.isArray(q.options)) throw new Error(`Question ${index} options is not an array`);
      if (q.options.length !== 4) throw new Error(`Question ${index} does not have exactly 4 options`);
      if (typeof q.correctAnswer !== 'number') throw new Error(`Question ${index} has invalid correct answer type`);
      if (!q.explanation) throw new Error(`Question ${index} is missing explanation`);
    });
    
    return questions;
  } catch (error) {
    console.error('Error in quiz generation:', error);
    throw new Error(`Quiz generation failed: ${error.message}`);
  }
}