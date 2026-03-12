import express from 'express';
import HealthIssue from '../controllers/health_issue.controller.js';

const router = express.Router();

//get all
router.get('/issues', HealthIssue.getAllHealthIssues);

//get issue by id
router.get('/issue/:id', HealthIssue.getHealthIssueById);

//add
router.post('/issue', HealthIssue.addHealthIssue);

//update
router.put('/issue/:id', HealthIssue.updateHealthIssue);

//delete
router.delete('/issue/:id', HealthIssue.deleteHealthIssue);


export default router;