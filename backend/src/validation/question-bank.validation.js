import { validate } from './validate-handler.js';
import { questionBankSchema } from './schema/question-bank.schema.js';

export const validateQuestionBank = validate({ body: questionBankSchema });
