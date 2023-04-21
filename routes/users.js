"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn,
  authenticateJWT,
  ensureAdmin,
  ensureAdminorOwn
} = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const Application = require("../models/application")

const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");


const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login,admin
 **/

router.post("/", ensureLoggedIn, authenticateJWT, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login, admin
 **/

router.get("/", ensureLoggedIn, authenticateJWT, ensureAdmin, async function (req, res, next) {
  try {
    const usersOnly = await User.findAll();

    let users = []

    // for (const u of usersOnly) {
    //   let applications = await Application.getAll(u.username)
    //   console.log('app for this user is', applications.map(a => a.job_id))
    //   users.push({ user: u, jobs: applications.map(a => a.job_id) })
    //   console.log('users with job is now', users)
    // }


    await Promise.all(usersOnly.map(async u => {
      let applications = await Application.getAll(u.username)
      users.push({ user: u, jobs: applications.map(a => a.job_id) })
    }))


    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /{jobID} => { applied: jobId }
 *
 * Returns { applied:jobId }
 *
 * Authorization required: login
 **/

router.post("/:username/jobs/:id", ensureLoggedIn, authenticateJWT, ensureAdminorOwn, async function (req, res, next) {
  try {

    const application = await Application.apply(req.params.username,
      req.params.id);

    return res.json({ applied: application.jobId });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin, jobs:[jobId...] }
 *
 * Authorization required: login
 **/

router.get("/:username", ensureLoggedIn, authenticateJWT, ensureAdminorOwn, async function (req, res, next) {
  try {

    const user = await User.get(req.params.username);

    const jobs = await Application.getAll(req.params.username);
    return res.json({ user, jobs });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login
 **/

router.patch("/:username", ensureLoggedIn, authenticateJWT, ensureAdminorOwn, async function (req, res, next) {
  try {

    //check if user is this user or admin

    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login
 **/

router.delete("/:username", ensureLoggedIn, authenticateJWT, ensureAdminorOwn, async function (req, res, next) {
  try {

    //check if user is admin or this user
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
