import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateStudyNotes({ topic, subject, difficulty }) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
    You are a professional educator creating comprehensive study notes. Generate detailed, educational study notes about "${topic}" for ${subject} at ${difficulty} level.
    
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
    1. Create exactly 5 chapters that thoroughly cover the topic
    2. Each chapter should be 4-6 paragraphs long with detailed explanations
    3. Use only plain text in content (no special characters)
    4. Chapter titles must be numbered and descriptive (e.g., "Chapter 1: Introduction to [Topic]")
    5. Content should be appropriate for ${difficulty} level
    6. Include plenty of examples, explanations, and real-world applications
    7. Do not use line breaks in content (use spaces between paragraphs)
    8. Each chapter should follow this structure:
       - Introduction to the concept
       - Detailed explanation with examples
       - Common misconceptions or challenges
       - Practice problems or applications
       - Summary and key points
    9. Make content engaging and easy to understand
    10. Include memory aids and study tips where relevant
    11. Make sure the JSON is properly formatted and valid

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

      if (parsedData.chapters.length !== 5) {
        throw new Error('Expected exactly 5 chapters');
      }

      // Validate each chapter
      parsedData.chapters.forEach((chapter, index) => {
        if (!chapter.title || typeof chapter.title !== 'string') {
          throw new Error(`Invalid title in chapter ${index + 1}`);
        }
        if (!chapter.content || typeof chapter.content !== 'string' || chapter.content.length < 500) {
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
      
      // Generate a comprehensive fallback response
      return {
        title: `${subject}: ${topic}`,
        chapters: [
          {
            title: 'Chapter 1: Introduction and Fundamentals',
            content: `Welcome to our comprehensive study of ${topic} in ${subject}. This topic is crucial for students at the ${difficulty} level, and we'll explore it in detail. Let's begin by understanding the basic concepts and their importance in ${subject}. First, we'll cover the fundamental principles that form the foundation of ${topic}. These concepts will help you build a strong understanding of the subject matter. We'll also address common misconceptions that students often have when first learning about ${topic}. Throughout this chapter, we'll use simple examples to illustrate these concepts clearly. Remember to take notes and try to relate these concepts to things you already know - this will help with retention and understanding.`,
            order: 1,
          },
          {
            title: 'Chapter 2: Core Concepts and Principles',
            content: `Now that we have a solid foundation, let's dive deeper into the core concepts of ${topic}. We'll examine each principle in detail and understand how they work together. This chapter will break down complex ideas into manageable pieces, making them easier to understand and remember. We'll use step-by-step explanations and clear examples to illustrate each point. Pay special attention to the relationships between different concepts - understanding these connections is key to mastering ${topic}. We'll also look at some common applications to see how these principles work in practice. Remember to practice with the examples provided and try to create your own variations to test your understanding.`,
            order: 2,
          },
          {
            title: 'Chapter 3: Advanced Concepts and Applications',
            content: `With a strong grasp of the basics, we can now explore more advanced aspects of ${topic}. This chapter will challenge you to think more deeply about the subject matter. We'll examine complex scenarios and learn how to apply our knowledge to solve real-world problems. You'll learn advanced techniques and strategies specific to ${subject} at the ${difficulty} level. We'll also discuss how these concepts connect to other areas of ${subject}. Understanding these connections will help you see the bigger picture and appreciate the importance of ${topic} in your studies. Practice problems will help you build confidence in applying these advanced concepts.`,
            order: 3,
          },
          {
            title: 'Chapter 4: Problem-Solving and Practical Applications',
            content: `This chapter focuses on developing your problem-solving skills in ${topic}. We'll work through various examples and scenarios, starting with simple cases and progressing to more complex ones. You'll learn effective strategies for approaching different types of problems related to ${topic}. We'll analyze common mistakes and learn how to avoid them. Each example will be broken down step by step, with detailed explanations of the thinking process. You'll also learn how to check your work and verify your solutions. By the end of this chapter, you should feel confident in applying your knowledge to solve real-world problems in ${subject}.`,
            order: 4,
          },
          {
            title: 'Chapter 5: Review and Advanced Practice',
            content: `In this final chapter, we'll consolidate everything we've learned about ${topic}. We'll start with a comprehensive review of key concepts from previous chapters. Then, we'll work through advanced practice problems that combine multiple concepts. You'll learn how to approach complex questions and develop strategies for exam success. We'll also discuss common areas where students typically need more practice. Pay special attention to the study tips and memory aids provided throughout this chapter. Finally, we'll look at how ${topic} connects to future topics you'll study in ${subject}. Remember to regularly review these notes and practice the examples to maintain your understanding.`,
            order: 5,
          }
        ],
      };
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate study notes. Please try again.');
  }
} 