import { Router } from 'express'
import { duplicatePost } from '../controllers/newsController.js'
const router = Router()

router
  .route('/')
  .get((req, res) => {
    res.json({ msg: 'hello from news route...' })
  })
  .post(duplicatePost)

export default router
