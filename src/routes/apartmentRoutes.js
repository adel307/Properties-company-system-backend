import { Router } from 'express';
import * as controller from '../controllers/apartmentController.js';
import { validateBody, validateId, validateRequired } from '../middleware/validate.js';
const router = Router();
const fields = ['propertyId', 'floor', 'number'];
router.route('/').get(controller.listApartments).post(validateBody(fields), validateRequired(...fields), controller.createApartment);
router.route('/:id').get(validateId, controller.getApartment).put(validateId, validateBody(fields), controller.updateApartment).delete(validateId, controller.deleteApartment);
export default router;
