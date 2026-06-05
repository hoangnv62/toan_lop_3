import * as authService from "../services/auth.service.js";
import {ForbiddenError} from "../utils/error.utils.js";

export const isTeacher = (req, res, next) => {
    if (!authService.isTeacher(req.user)) throw new ForbiddenError();
    next();
};

export const isStudent = (req, res, next) => {
    if (!authService.isStudent(req.user)) throw new ForbiddenError();
    next();
};
