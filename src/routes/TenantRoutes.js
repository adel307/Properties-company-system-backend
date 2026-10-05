import { Router } from 'express';
import * as controller from '../controllers/TenantController.js';
import { validateBody, validateId, validateRequired } from '../middleware/validate.js';

const router = Router();
const fields = ['name', 'nationalId', 'phone', 'email'];

router.route('/')
  .get(controller.listTenants)
  .post(
    validateBody(fields),
    validateRequired('name', 'phone'),
    controller.createTenant
  );

router.route('/:id')
  .get(validateId, controller.getTenant)
  .put(validateId, validateBody(fields), controller.updateTenant)
  .delete(validateId, controller.deleteTenant);

export default router;
