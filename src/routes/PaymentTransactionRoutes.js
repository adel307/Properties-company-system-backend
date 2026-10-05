import { Router } from 'express';
import * as controller from '../controllers/PaymentTransactionController.js';
import { validateBody, validateId, validateRequired } from '../middleware/validate.js';

const router = Router();
const fields = ['leasePaymentId', 'amountPaid', 'paymentDate', 'paymentMethod', 'receiptNumber', 'receiptImageUrl', 'receivedBy', 'notes'];

router.route('/')
  .get(controller.listPaymentTransactions)
  .post(
    validateBody(fields),
    validateRequired('leasePaymentId', 'amountPaid'),
    controller.createPaymentTransaction
  );

router.route('/:id')
  .get(validateId, controller.getPaymentTransaction)
  .put(validateId, validateBody(fields), controller.updatePaymentTransaction)
  .delete(validateId, controller.deletePaymentTransaction);

export default router;
