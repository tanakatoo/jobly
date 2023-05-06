"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");

const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    company_handle: "c3",
    title: "New",
    salary: 123,
    equity: 1
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      handle: "c3",
      title: "New",
      salary: 123,
      equity: "1"
    });

    const result = await db.query(
      `SELECT company_handle, title, salary, equity
           FROM jobs
           WHERE company_handle = 'c3'`);
    expect(result.rows).toEqual([
      {
        company_handle: "c3",
        title: "New",
        salary: 123,
        equity: "1"
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      //fail(); //((((((((((((((((((((((((********why do we want this to fail? why would it pass? */
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        handle: "c1",
        title: "title1",
        salary: 123,
        equity: "0.8"
      },
      {
        handle: "c2",
        title: "title2",
        salary: 234,
        equity: "0"
      }
    ]);
  });
  test("works: title only filter", async function () {
    let jobs = await Job.findAll("1", null, null);
    expect(jobs).toEqual([
      {
        handle: "c1",
        title: "title1",
        salary: 123,
        equity: "0.8"
      }])
  });

  test("works: minSalary only filter", async function () {
    let jobs = await Job.findAll('', 124, null);
    expect(jobs).toEqual([
      {
        handle: "c2",
        title: "title2",
        salary: 234,
        equity: "0"
      }])
  });

  test("works: hasequity only filter", async function () {
    let jobs = await Job.findAll('', null, true);
    expect(jobs).toEqual([
      {
        handle: "c1",
        title: "title1",
        salary: 123,
        equity: "0.8"
      }])
  });


  test("works: name and minSalary and hasFilter ", async function () {
    let jobs = await Job.findAll('2', 230, false);
    expect(jobs).toEqual([
      {
        handle: "c2",
        title: "title2",
        salary: 234,
        equity: "0"
      }])
  });
});


/************************************** get */

describe("get", function () {
  test("works for getting jobs for 1 company", async function () {
    let jobs = await Job.get("c1");

    expect(jobs[0]).toEqual({
      handle: "c1",
      title: "title1",
      salary: 123,
      equity: "0.8",
      id: jobs[0].id
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      // fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 100,
    equity: 0.1
  };

  test("works", async function () {
    const id = await db.query(`SELECT id FROM jobs WHERE title='title1'`)
    const theId = id.rows[0].id

    let job = await Job.update(theId, updateData);
    console.log('job in test is', job)
    expect(job).toEqual({
      handle: "c1",
      id: theId,
      title: "New",
      salary: 100,
      equity: "0.1"
    });

    const result = await db.query(
      `SELECT *
             FROM jobs
             WHERE id = ${theId}`);
    expect(result.rows).toEqual([{
      company_handle: "c1",
      title: "New",
      salary: 100,
      equity: "0.1",
      id: theId
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null

    };
    const id = await db.query(`SELECT id FROM jobs WHERE title='title1'`)
    const theId = id.rows[0].id

    let job = await Job.update(theId, updateDataSetNulls);
    expect(job).toEqual({
      handle: "c1",
      title: "New",
      salary: null,
      equity: null,
      id: theId
    });

    const result = await db.query(
      `SELECT *
             FROM jobs
             WHERE id = ${theId}`);
    expect(result.rows).toEqual([{
      company_handle: "c1",
      title: "New",
      salary: null,
      equity: null,
      id: theId
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      // fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      const id = await db.query(`SELECT id FROM jobs WHERE title='title1'`)
      const theId = id.rows[0].id
      await Job.update(theId, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const id = await db.query(`SELECT id FROM jobs WHERE title='title1'`)

    const theId = id.rows[0].id

    await Job.remove(theId);
    const res = await db.query(
      `SELECT ${theId} FROM jobs WHERE id=${theId}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
