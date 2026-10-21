import { validate } from './validate-handler.js';
import {
  submitExamSchema, saveCommentSchema, saveAttemptAnswerSchema,
} from './schema/exam.schema.js';

export const validateSubmitExam = validate({ body: submitExamSchema });
export const validateSaveComment = validate({ body: saveCommentSchema });
export const validateSaveAttemptAnswer = validate({ body: saveAttemptAnswerSchema });
