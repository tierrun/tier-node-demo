import tier from 'tier'
import express from 'express'
const routes = express.Router()
export default routes
import {
  addUserToDatabase,
  validateSignin,
  mustLogin,
  setSecureLoginCookies,
  isAuthenticated,
  validateNewUser,
} from './users.mjs'

import {
  defaultTemplateData,
  showPage,
} from './templates.js'

// log all requests
const log = async (req, _, next) => {
  console.error(req.method, req.url)
  next()
}

defaultTemplateData.title = 'Tier.run Node.js Demo'

// return [{plan},...] but with the id attached to each one.
// This is experimental and will be improved soon!
const pullPricingPage = async () => {
  const latest = await tier.pullLatest()
  return {
    plans: Object.entries(latest.plans)
      .sort(([a], [b]) => a.localeCompare(b, 'en'))
      .map(([id, plan]) => ({ id, ...plan }))
  }
}

routes.get('/pricing', log, async (req, res) => {
  const pricingPage = await pullPricingPage()
  showPage(req, res, 'pricing.ejs', {
    header: 'Pricing Plans',
    plans: pricingPage.plans,
  })
})


// This is the application endpoint, where we convert temperatures
const fToC = (F) => (F - 32) * (5/9)
const cToF = (C) => C * (9/5) + 32
routes.post('/convert', log, mustLogin, async (req, res) => {
  const { C, F } = req.body
  const user = req.cookies.user

  if (!await userIsAuthorized(user, 'feature:convert')) {
    return res.status(402).send({ error: 'not allowed by plan' })
  }

  if (C === undefined && F === undefined) {
    return res.status(400).send({ error: 'bad request, temp required' })
  }
  if (C !== undefined) {
    return res.send({ F: cToF(C) })
  } else {
    return res.send({ C: fToC(F) })
  }
})

const signupNewUser = async (res, user) => {
  console.error('signup new user', user)
  await addUserToDatabase(user)
  await setSecureLoginCookies(res, user)
}

const loginUser = async (res, user) => {
  if (!validateSignin(user)) {
    return null
  }

  await setSecureLoginCookies(res, user)
  return user
}

const userIsAuthorized = async (user, feature) => {
  // placeholder for when we actually check feature entitlement
  if (!user || !feature) {
    throw new Error('invalid authZ check')
  }
  return true
}

routes.get('/', log, (req, res) => {
  res.redirect(isAuthenticated(req) ? '/app' : '/login')
})

routes.get('/logout', log, (_, res) => {
  res.cookie('user', '', { maxAge: 0, httpOnly: true })
  res.cookie('plan', '', { maxAge: 0, httpOnly: true })
  res.redirect('/login')
})

routes.get('/signup', log, (req, res) => {
  return showPage(req, res, 'signup.ejs', {
    header: 'sign up',
    errors: {},
    user: '',
    pass: '',
  })
})

routes.post('/signup', log, async (req, res) => {
  console.error('POST SIGNUP')
  const {user, pass} = req.body
  const validate = validateNewUser(user, pass)
  if (validate.errors) {
    showPage(req, res, 'signup.ejs', {
      header: 'sign up',
      errors: validate.errors,
      user,
      pass,
    })
  } else {
    await signupNewUser(res, { id: user, pass })
    res.redirect(303, '/app')
  }
})

routes.get('/login', log, (req, res) => {
  return showPage(req, res, 'login.ejs', { header: 'please log in' })
})

routes.post('/login', log, async (req, res) => {
  const {user, pass} = req.body
  const requestUser = { id: user, pass }
  const userLogin = await loginUser(res, requestUser)
  if (!userLogin) {
    return showPage(req, res, 'login.ejs', {
      header: 'please log in',
      error: 'incorrect',
    })
  }
  return res.redirect('/app')
})

routes.get('/app', log, mustLogin, (req, res) => {
  showPage(req, res, 'app.ejs', { header: 'temp converter', req })
})

routes.use('/ping', log, (req, res) => {
  console.error(req.method, req.url, req.headers)
  res.send('pong')
})
