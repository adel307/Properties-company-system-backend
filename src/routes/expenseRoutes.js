import { Router } from 'express';
import * as controller from '../controllers/expenseController.js';
import { validateBody, validateId, validateRequired } from '../middleware/validate.js';
const router = Router();
const fields = ['sender', 'amount', 'expenseCategoryId', 'expenseDate', 'paidTo', 'paymentMethod', 'receiptNumber', 'receiptImageUrl', 'approvedBy', 'notes'];
router.route('/')
    .get(controller.listExpenses)
    .post(validateBody(fields), validateRequired('sender', 'amount', 'expenseCategoryId', 'expenseDate', 'paidTo'), controller.createExpense);

router.route('/:id')
    .get(validateId, controller.getExpense);

router.route('/:date(\\d{4}-\\d{2}-\\d{2})')
    .get(controller.getExpensesByDate);

export default router;
