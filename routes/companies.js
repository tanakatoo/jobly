"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, authenticateJWT, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");
const Job = require("../models/job");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, authenticateJWT, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {

    //validate query string
    const allowedFilters = ["name", "minEmployees", "maxEmployees"]
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

    const { name = '', minEmployees = null, maxEmployees = null } = req.query;

    if (minEmployees && maxEmployees) {
      //check if minEmployees is an integer
      if (!parseInt(minEmployees)) {
        throw new BadRequestError("Min employees must be an integer")
      }
      if (!parseInt(maxEmployees)) {
        throw new BadRequestError("Max employees must be an integer")
      }
      if (parseInt(minEmployees) > parseInt(maxEmployees)) {
        throw new BadRequestError("Min employees is greater than max employees");
      }
    }


    const companies = await Company.findAll(name, minEmployees, maxEmployees);
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    const jobs = await Job.get(req.params.handle);
    // return res.json({ jobs });
    return res.json({ company, jobs });
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

router.patch("/:handle", ensureLoggedIn, authenticateJWT, ensureAdmin, async function (req, res, next) {
  try {

    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedIn, authenticateJWT, ensureAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
