import { Router } from 'express';
import * as controller from '../controllers/LeaseController.js';
import { validateBody, validateId, validateRequired } from '../middleware/validate.js';

const router = Router();
const fields = ['apartmentId', 'tenantId', 'startDate', 'endDate', 'rentAmount', 'deposit', 'status'];

router.route('/')
  .get(controller.listLeases)
  .post(
    validateBody(fields),
    validateRequired('apartmentId', 'tenantId', 'startDate', 'rentAmount'),
    controller.createLease
  );

router.route('/:id')
  .get(validateId, controller.getLease)
  .put(validateId, validateBody(fields), controller.updateLease)
  .delete(validateId, controller.deleteLease);

export default router;
