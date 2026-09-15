import { Router } from 'express';
import * as controller from '../controllers/expenseCategoryController.js';
import { validateBody, validateId, validateRequired } from '../middleware/validate.js';
const router = Router();

router.route('/')
    .get(controller.listExpenseCategories)
    .post(validateBody(['name']), validateRequired('name'), controller.createExpenseCategory);

router.route('/:id')
    .get(validateId, controller.getExpenseCategory)
    .put(validateId, validateBody(['name']), controller.updateExpenseCategory)
    .delete(validateId, controller.deleteExpenseCategory);

export default router;
