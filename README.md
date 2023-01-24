# tier-node-demo

A demo of using [tier](https://tier.run) to implement pricing in
an application.

Code for the [Tier Hello World Demo (now with Stripe
Checkout!)](https://github.com/tierrun/tier/wiki/Tier-Hello-World-Demo-(now-with-Stripe-Checkout!))
blog post.

## Running this demo locally

1. [Install tier](https://tier.run/docs/install)
2. [Connect tier to Stripe](https://tier.run/docs/cli/connect).
   Note: it's best to run this demo using a Stripe account with
   an empty test mode data set, so you can more easily see what's
   going on.
3. Run `tier push pricing.json`.  Later, to see changes to the
   pricing model, you can run `tier push pricing-2.json`, or just
   edit the first `pricing.json` file and push that file again.
4. Run `npm install`
5. Run `npm start`
6. Open <http://localhost:8300> and poke around.

## Notes On This Demo App

The initial commit is "the app, without any Tier".  It's
basically a stub, many things have intentionally not been
implemented, or implemented so laughably naively as to be a joke.

The `tier-integration` branch is a step-by-step integration of
Tier into the app.  You can walk through it bit by bit, or view
the final merge commit to see it all together at once.

Most of the tier-related parts are in `lib/routes.js`, and the
templates in `lib/templates/*.ejs` for the various pricing/plan
related pages.
