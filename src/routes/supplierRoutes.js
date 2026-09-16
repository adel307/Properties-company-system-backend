import { Router } from 'express';
import * as controller from '../controllers/supplierController.js';

import {
  validateBody,
  validateId,
  validateRequired
} from '../middleware/validate.js';

const router = Router();

const uuidPattern = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}';

router.route('/')
  .get(controller.listSuppliers)
  .post(
    validateBody(['name']),
    validateRequired('name'),
    controller.createSupplier
  );

router.get('/total_debt', controller.totalDebt);

router.get('/details', controller.supplierDetails);

router.route(`/:id(${uuidPattern})`)
  .get(validateId, controller.getSupplier)
  .put(
    validateId,
    validateBody(['name']),
    controller.updateSupplier
  )
  .delete(validateId, controller.deleteSupplier);

router.get(
  '/:id/total_debt',
  validateId,
  controller.supplierDebt
);

export default router;