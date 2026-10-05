import { Router } from 'express';
import * as controller from '../controllers/LeasePaymentController.js';
import { validateBody, validateId, validateRequired } from '../middleware/validate.js';

const router = Router();
const fields = ['leaseId', 'dueDate', 'totalAmount', 'paidAmount', 'remainingAmount', 'status', 'notes'];

router.route('/')
  .get(controller.listLeasePayments)
  .post(
    validateBody(fields),
    validateRequired('leaseId', 'dueDate', 'totalAmount', 'remainingAmount'),
    controller.createLeasePayment
  );

router.route('/:id')
  .get(validateId, controller.getLeasePayment)
  .put(validateId, validateBody(fields), controller.updateLeasePayment)
  .delete(validateId, controller.deleteLeasePayment);

export default router;
