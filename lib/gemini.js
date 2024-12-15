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
    You are a professional educator creating concise but comprehensive study notes about "${topic}" for ${subject} at ${difficulty} level.
    
    IMPORTANT GUIDELINES:
    1. Keep content clear and concise - each chapter should be around 300-400 words maximum
    2. Use markdown formatting for better readability:
       - ## for subheadings
       - Bullet points for key points
       - \`code\` for terms/equations
       - > for important notes
       - **bold** for key terms
    3. Include 2-3 practical examples per chapter
    4. End each chapter with 3-4 key takeaways

    The response must be a valid JSON object with this exact structure:
    {
      "title": "Main title",
      "chapters": [
        {
          "title": "Chapter title",
          "content": "Content with markdown formatting",
          "order": chapter_number
        }
      ]
    }

    Required Chapter Structure (5 chapters total):
    1. Fundamentals
       - Core concepts
       - Key definitions
       - Basic principles
       - Examples
       - Key takeaways

    2. Key Components
       - Main elements
       - Relationships
       - Examples
       - Key takeaways

    3. Applications
       - Real-world uses
       - Common scenarios
       - Examples
       - Key takeaways

    4. Problem Solving
       - Methods
       - Strategies
       - Examples
       - Key takeaways

    5. Advanced Topics
       - Complex concepts
       - Extensions
       - Examples
       - Key takeaways

    Keep content focused and concise while maintaining clarity and engagement.
  `;

  try {
    const result = await retryWithBackoff(async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Remove markdown code blocks if present
      text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Find the JSON object
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd <= jsonStart) {
        throw new Error('No valid JSON object found in response');
      }
      
      // Extract and parse JSON
      try {
        const jsonText = text.slice(jsonStart, jsonEnd);
        const parsedData = JSON.parse(jsonText);
        
        // Validate structure
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
            throw new Error(`Invalid or missing title in chapter ${index + 1}`);
          }
          if (!chapter.content || typeof chapter.content !== 'string') {
            throw new Error(`Invalid or missing content in chapter ${index + 1}`);
          }
          if (typeof chapter.order !== 'number' || chapter.order < 0) {
            throw new Error(`Invalid order in chapter ${index + 1}`);
          }
        });

        // Return clean data structure
        return {
          title: parsedData.title,
          chapters: parsedData.chapters.map((chapter) => ({
            title: chapter.title,
            content: chapter.content,
            order: chapter.order
          }))
        };
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('JSON Text:', text.slice(jsonStart, jsonEnd));
        throw new Error('Failed to parse generated content. Retrying...');
      }
    }, 5); // Increase max retries to 5

    return result;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate study notes. Please try again.');
  }
}

export async function generateFlashcards(content) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Create flashcards from the following study content. Format your response as a JSON array of objects, where each object has a "front" and "back" property. The front should be a question or concept, and the back should be the answer or explanation. Do not include any text outside of the JSON array.

Content to create flashcards from:
${content}

Remember:
1. Return ONLY the JSON array
2. Each flashcard should have exactly two fields: "front" and "back"
3. No additional text or formatting outside the JSON
4. Keep answers concise but informative
5. Include 10-15 flashcards`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in response');
    }

    const flashcards = JSON.parse(jsonMatch[0]);

    // Validate flashcards format
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('Invalid flashcards format: not an array or empty array');
    }

    const validFlashcards = flashcards.filter(card => {
      return (
        card &&
        typeof card === 'object' &&
        typeof card.front === 'string' &&
        typeof card.back === 'string' &&
        card.front.trim() !== '' &&
        card.back.trim() !== ''
      );
    });

    if (validFlashcards.length === 0) {
      throw new Error('No valid flashcards found after filtering');
    }

    return validFlashcards;
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw new Error('Failed to generate flashcards: ' + error.message);
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