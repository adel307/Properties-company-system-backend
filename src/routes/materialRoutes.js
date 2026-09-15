import { Router } from 'express';
import * as controller from '../controllers/materialController.js';
import { validateBody, validateId, validateRequired } from '../middleware/validate.js';
const router = Router();
const fields = ['name', 'totalPrice', 'paidPrice', 'status', 'quantity', 'arriveDate', 'paymentDate', 'supplierId', 'propertyId'];

router.route('/')
    .get(controller.listMaterials)
    .post(validateBody(fields), validateRequired('name', 'totalPrice', 'paidPrice', 'status', 'quantity', 'arriveDate', 'supplierId', 'propertyId'), controller.createMaterial);

router.route('/:id')
    .get(validateId, controller.getMaterial)
    .put(validateId, validateBody(fields), controller.updateMaterial)
    .delete(validateId, controller.deleteMaterial);

export default router;
