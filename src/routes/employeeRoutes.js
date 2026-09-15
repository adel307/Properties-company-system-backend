import { Router } from 'express';
import * as controller from '../controllers/employeeController.js';
import { validateBody, validateId, validateRequired } from '../middleware/validate.js';
const router = Router();
const fields = ['name', 'salary', 'experienceYears', 'age', 'phone'];

router.route('/')
    .get(controller.listEmployees)
    .post(validateBody(fields), validateRequired('name', 'salary', 'experienceYears', 'age'), controller.createEmployee);

router.route('/:id')
    .get(validateId, controller.getEmployee)
    .put(validateId, validateBody(fields), controller.updateEmployee)
    .delete(validateId, controller.deleteEmployee);
    
export default router;
