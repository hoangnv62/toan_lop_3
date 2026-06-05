import { validate } from './validate-handler.js';
import { generateQuestionsSchema } from './schema/question.schema.js';

export const validateGenerateQuestions = validate({ body: generateQuestionsSchema });
