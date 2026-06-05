import { BadRequestError } from "../utils/error.utils.js";

export const validate = ({ body, params, query } = {}) => (req, res, next) => {
    if (body) {
        const parsed = body.safeParse(req.body);
        if (!parsed.success) return next(new BadRequestError(parsed.error.errors[0].message));
        req.body = parsed.data;
    }

    if (params) {
        const parsed = params.safeParse(req.params);
        if (!parsed.success) return next(new BadRequestError(parsed.error.errors[0].message));
        req.params = parsed.data;
    }

    if (query) {
        const parsed = query.safeParse(req.query);
        if (!parsed.success) return next(new BadRequestError(parsed.error.errors[0].message));
        req.query = parsed.data;
    }

    next();
};
