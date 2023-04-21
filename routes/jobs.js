"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, authenticateJWT, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");


const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { handle, title, salary, equity }
 *
 * Returns { handle, title, salary, equity, id }
 *
 * Authorization required: login and admin
 */

router.post("/", ensureLoggedIn, authenticateJWT, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    console.log('we are in postig jobs')
    if (!validator.valid) {

      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    } else {
      console.log('validator ok for adding jobs')
      console.log(req.body)
      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    }
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { handle, title, salary, equity }] }
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity (whether equity is > 0 )
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {

    //validate query string

    const allowedFilters = ["title", "minSalary", "hasEquity"]
    for (let q in req.query) {
      //make sure it is not an array (no duplicate query strings)
      //make sure it is only one of the 3 filters defined in allwedFilters
      if (Array.isArray(req.query[q])) {
        throw new BadRequestError(`${q} appears more than once`)
      }
      if (!allowedFilters.includes(q)) {
        throw new BadRequestError(`${q} is not a valid filter`)
      }
    }

    let { title = '', minSalary = null, hasEquity = "false" } = req.query;

    if (minSalary) {
      //check if minSalary is an integer
      if (!parseInt(minSalary)) {
        throw new BadRequestError("Min salary must be an integer")
      }
    }
    if (hasEquity === 'false' || hasEquity === 'true') {
      hasEquity == "false" ? hasEquity = false : hasEquity = true;
    } else {
      throw new BadRequestError("hasEquity must be a boolean")
    }

    const jobs = await Job.findAll(title, minSalary, hasEquity);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { job }
 *
 *  Job is { handle, title, salary, equity  }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    console.log('handle is', req.params.handle)
    const jobs = await Job.get(req.params.handle);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:id", ensureLoggedIn, authenticateJWT, ensureAdmin, async function (req, res, next) {
  try {

    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:id", ensureLoggedIn, authenticateJWT, ensureAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
