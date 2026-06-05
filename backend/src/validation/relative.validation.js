import { validate } from './validate-handler.js';
import { relativeSchema } from './schema/relative.schema.js';

export const validateRelative = validate({ body: relativeSchema });
