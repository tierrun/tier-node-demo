import tier from 'tier'
import { year } from './time.mjs'
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
  const { plan } = req.cookies
  showPage(req, res, 'pricing.ejs', {
    header: 'Pricing Plans',
    plans: pricingPage.plans,
    plan,
  })
})

// change a user's plan by calling tier.subscribe
// This will dictate what they're allowed to do, and
// how much they're charged when they do it.
routes.post('/plan', log, mustLogin, async (req, res) => {
  const { plan } = req.body
  const user = req.cookies.user
  await tier.subscribe(`org:${user}`, plan)
  res.cookie('plan', plan, { httpOnly: true })
  res.send({ ok: 'updated plan' })
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

  // new user, call subscribe to put them on our default "free" plan
  //
  // Note: this is strictly optional!  You could also just
  // not have them on a plan (though it means that any
  // entitlement checks will be rejected, and there will
  // not be a "customer" to attach payment info to).
  // Or, you could take them to a pricing page as part of the
  // initial sign-up flow.  It really is up to you how you want
  // your app to handle it.
  const pricingPage = await pullPricingPage()
  const plan = pricingPage.plans[0].id
  await tier.subscribe(`org:${user.id}`, plan)

  // also optional, store it in a cookie so we don't have to look
  // it up every time.  Other than showing the pricing page, there
  // are really no cases where it should matter to your app what
  // "plan" a user is on.  Even there, if you have a lot of custom
  // add-ons and customer-specific negotiated plans, it might not
  // make sense to show it there, since each one will be different.
  res.cookie('plan', plan, { maxAge: 10 * year })

  await setSecureLoginCookies(res, user)
}

const loginUser = async (res, user) => {
  if (!validateSignin(user)) {
    return null
  }

  // get the user's current plan
  // We don't need this for much, but it's handy when we show
  // the pricing page to be able to highlight their current plan.
  const phase = await tier.phase(`org:${user.id}`)
  res.cookie('plan', phase.plans[0])

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
