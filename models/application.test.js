"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");

const Application = require("./application.js");
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

/************************************** apply */

describe("apply", function () {
  test("works", async function () {

    const id = await db.query(`SELECT id FROM jobs WHERE title='title1'`)
    const theId = id.rows[0].id

    const newApplication = {
      username: "u1",
      job_id: theId
    };

    expect(newApplication).toEqual({
      username: "u1",
      job_id: theId
    });

    const result = await db.query(
      `SELECT *
           FROM applications
           WHERE username = 'u1'`);
    expect(result.rows).toEqual([
      {
        username: "u1",
        job_id: theId
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {

      const id = await db.query(`SELECT id FROM jobs WHERE title='title1'`)
      const theId = id.rows[0].id

      const newApplication = {
        username: "u1",
        job_id: theId
      };

      await Application.apply(newApplication);
      await Application.apply(newApplication);
      //fail(); //************************************why do we want this to fail? why would it pass? */
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("getAll", function () {
  test("works", async function () {
    const id = await db.query(`SELECT id FROM jobs WHERE title='title1'`)
    const theId = id.rows[0].id

    let applications = await Application.getAll("u1");
    expect(applications).toEqual([
      {
        job_id: theId
      },

    ]);
  });
})
//   test("works: title only filter", async function () {
//     let jobs = await Job.findAll("1", null, null);
//     expect(jobs).toEqual([
//       {
//         handle: "c1",
//         title: "title1",
//         salary: 123,
//         equity: "0.8"
//       }])
//   });

//   test("works: minSalary only filter", async function () {
//     let jobs = await Job.findAll('', 124, null);
//     expect(jobs).toEqual([
//       {
//         handle: "c2",
//         title: "title2",
//         salary: 234,
//         equity: "0"
//       }])
//   });

//   test("works: hasequity only filter", async function () {
//     let jobs = await Job.findAll('', null, true);
//     expect(jobs).toEqual([
//       {
//         handle: "c1",
//         title: "title1",
//         salary: 123,
//         equity: "0.8"
//       }])
//   });


//   test("works: name and minSalary and hasFilter ", async function () {
//     let jobs = await Job.findAll('2', 230, false);
//     expect(jobs).toEqual([
//       {
//         handle: "c2",
//         title: "title2",
//         salary: 234,
//         equity: "0"
//       }])
//   });
// });


// /************************************** get */

// describe("get", function () {
//   test("works for getting jobs for 1 company", async function () {
//     let jobs = await Job.get("c1");

//     expect(jobs[0]).toEqual({
//       handle: "c1",
//       title: "title1",
//       salary: 123,
//       equity: "0.8",
//       id: jobs[0].id
//     });
//   });

//   test("not found if no such job", async function () {
//     try {
//       await Job.get("nope");
//       // fail();
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });
// });

// /************************************** update */

// describe("update", function () {
//   const updateData = {
//     title: "New",
//     salary: 100,
//     equity: 0.1
//   };

//   test("works", async function () {
//     const id = await db.query(`SELECT id FROM jobs WHERE title='title1'`)
//     const theId = id.rows[0].id

//     let job = await Job.update(theId, updateData);
//     console.log('job in test is', job)
//     expect(job).toEqual({
//       handle: "c1",
//       id: theId,
//       title: "New",
//       salary: 100,
//       equity: "0.1"
//     });

//     const result = await db.query(
//       `SELECT *
//              FROM jobs
//              WHERE id = ${theId}`);
//     expect(result.rows).toEqual([{
//       company_handle: "c1",
//       title: "New",
//       salary: 100,
//       equity: "0.1",
//       id: theId
//     }]);
//   });

//   test("works: null fields", async function () {
//     const updateDataSetNulls = {
//       title: "New",
//       salary: null,
//       equity: null

//     };
//     const id = await db.query(`SELECT id FROM jobs WHERE title='title1'`)
//     const theId = id.rows[0].id

//     let job = await Job.update(theId, updateDataSetNulls);
//     expect(job).toEqual({
//       handle: "c1",
//       title: "New",
//       salary: null,
//       equity: null,
//       id: theId
//     });

//     const result = await db.query(
//       `SELECT *
//              FROM jobs
//              WHERE id = ${theId}`);
//     expect(result.rows).toEqual([{
//       company_handle: "c1",
//       title: "New",
//       salary: null,
//       equity: null,
//       id: theId
//     }]);
//   });

//   test("not found if no such job", async function () {
//     try {
//       await Job.update(0, updateData);
//       // fail();
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });

//   test("bad request with no data", async function () {
//     try {
//       const id = await db.query(`SELECT id FROM jobs WHERE title='title1'`)
//       const theId = id.rows[0].id
//       await Job.update(theId, {});
//       fail();
//     } catch (err) {
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   });
// });

// /************************************** remove */

// describe("remove", function () {
//   test("works", async function () {
//     const id = await db.query(`SELECT id FROM jobs WHERE title='title1'`)

//     const theId = id.rows[0].id

//     await Job.remove(theId);
//     const res = await db.query(
//       `SELECT ${theId} FROM jobs WHERE id=${theId}`);
//     expect(res.rows.length).toEqual(0);
//   });

//   test("not found if no such job", async function () {
//     try {
//       await Job.remove(0);
//       fail();
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });
// });
