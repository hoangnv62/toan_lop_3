import { validate } from './validate-handler.js';
import {
  questionBankSchema,
  questionBankBulkDeleteSchema,
  questionBankGenerateSchema,
  questionBankBatchSchema,
} from './schema/question-bank.schema.js';

export const validateQuestionBank = validate({ body: questionBankSchema });
export const validateQuestionBankBulkDelete = validate({ body: questionBankBulkDeleteSchema });
export const validateQuestionBankGenerate = validate({ body: questionBankGenerateSchema });
export const validateQuestionBankBatch = validate({ body: questionBankBatchSchema });
