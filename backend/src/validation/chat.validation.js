import { validate } from './validate-handler.js';
import {
  chatSchema, confirmActionParamsSchema, confirmActionBodySchema, a2uiActionSchema,
  sessionParamsSchema, renameSessionBodySchema,
} from './schema/chat.schema.js';

export const validateChat = validate({ body: chatSchema });

export const validateConfirmAction = validate({
  params: confirmActionParamsSchema,
  body: confirmActionBodySchema,
});

export const validateA2uiAction = validate({ body: a2uiActionSchema });

export const validateSessionParams = validate({ params: sessionParamsSchema });

export const validateRenameSession = validate({
  params: sessionParamsSchema,
  body: renameSessionBodySchema,
});
