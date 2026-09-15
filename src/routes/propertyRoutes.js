import { Router } from 'express';
import * as controller from '../controllers/propertyController.js';
import { validateBody, validateId, validateRequired } from '../middleware/validate.js';
const router = Router();
const fields = ['name', 'status', 'address', 'startedIn', 'endedIn', 'floorsNumber', 'area'];
router.route('/')
    .get(controller.listProperties)
    .post(validateBody(fields), validateRequired('name', 'status', 'address', 'startedIn', 'floorsNumber', 'area'), controller.createProperty);

router.route('/:id')
    .get(validateId, controller.getProperty)
    .put(validateId, validateBody(fields), controller.updateProperty)
    .delete(validateId, controller.deleteProperty);

router.get('/:id/employees', validateId, controller.getPropertyEmployees);

export default router;
