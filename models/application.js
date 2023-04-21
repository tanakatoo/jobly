"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for applications. */

class Application {
  /** Allow users to apply for jobs
   *
   * Returns { jobId }
   *
   * Throws UnauthorizedError is user not found or job id not found.
   **/

  static async apply(username, jobId) {
    // check if user exists
    const result = await db.query(
      `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
      [username],
    );

    const user = result.rows[0];

    if (user) {

      //check if jobId exists
      const jobResult = await db.query(
        `SELECT id
             FROM jobs
             WHERE id = $1`,
        [jobId],
      );

      if (jobResult) {

        //insert into table
        const insertResult = await db.query(
          `INSERT INTO applications
           (username,
            job_id)
           VALUES ($1, $2)
           RETURNING job_id as "jobId"`,
          [
            username,
            jobId
          ],
        )
        const jobApplied = insertResult.rows[0]

        return jobApplied
      }
      throw new BadRequestError("Invalid jobId");
    }
    throw new BadRequestError("Invalid username");
  }

  /** Gets all the job Id the user has applied for
   *
   * Returns { jobs:[jobId, jobId...] }
   *
   * Throws UnauthorizedError if user not found or job id not found.
   **/

  static async getAll(username) {
    // check if user exists
    const result = await db.query(
      `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
      [username],
    );

    const user = result.rows[0];

    if (user) {
      //get all the jobs they applied for
      const jobsResult = await db.query(
        `SELECT job_id
             FROM applications
             WHERE username = $1`,
        [username],
      );

      return jobsResult.rows
    }
  }

}
module.exports = Application;
