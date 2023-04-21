"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { company_handle, title, salary, equity }
   *
   * Returns { handle, title, salary, equity, id}
   *
   * */

  static async create({ company_handle, title, salary, equity }) {

    const result = await db.query(
      `INSERT INTO jobs
           (company_handle, title, salary, equity )
           VALUES ($1, $2, $3, $4)
           RETURNING company_handle as "handle", title, salary, equity`,
      [
        company_handle,
        title,
        salary,
        equity
      ], //*************************why is there a comma here? */
    );

    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ handle, title, salary, equity, id }, ...]
   * */

  static async findAll(title, minSalary, hasEquity) {
    let where = ""
    let parameters = []
    let added = false
    let n = 1;
    if (title != '' && title != null) {
      where = `WHERE title ILIKE $${n}`
      parameters.push(`%${title}%`)
      added = true
      n++;
    }
    if (minSalary) {
      if (added) {
        where += " AND "
      } else {
        where = "WHERE "
      }
      where += `salary >= $${n}`
      parameters.push(minSalary)
      n++
      added = true
    }
    if (hasEquity) {
      if (added) {
        where += " AND "
      } else {
        where = "WHERE "
      }
      where += `equity > 0`
    }
    console.log('where statement', where)
    console.log('parameters', parameters)
    const jobsRes = await db.query(
      `SELECT company_handle as "handle",
                  title,
                  salary,
                  equity
           FROM jobs
           ${where}
           ORDER BY handle `, parameters);
    return jobsRes.rows;
  }

  /** Given a company handle, return data about jobs.
   *
   * Returns [{ companyHandle, title, salary, equity, id }]
   *
   **/

  static async get(company_handle) {
    const jobsRes = await db.query(
      `SELECT company_handle as "handle",
                  title,
                  salary,
                  equity,
                  id
           FROM jobs
           WHERE company_handle = $1`,
      [company_handle]);


    const jobs = jobsRes.rows;

    return jobs;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, equity, salary}
   *
   * Returns {company_handle, title, salary, equity, id }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING company_handle AS "handle", 
                                title, 
                                salary, 
                                equity, 
                                id`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];
    console.log('jobs from update is', job)
    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING company_handle`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
