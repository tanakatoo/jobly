"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token,
} = require("./_testCommon");


beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    company_handle: "c1",
    title: "New",
    salary: 100,
    equity: 0.2
  };

  test("ok for users who have admin account", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4Token}`);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        handle: "c1",
        title: "New",
        salary: 100,
        equity: "0.2"
      }
    });
  });

  test("fails for users without admin account", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);

  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        handle: null,
        title: "New",
        salary: 100,
        equity: 0.2
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        company_handle: "c1",
        title: "New",
        salary: 100,
        equity: 1.3
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {

    const resp = await request(app).get("/jobs");

    expect(resp.body).toEqual({
      jobs:
        [{
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
        ],
    });
  });

  test("filter: title, minSalary and hasEquity", async function () {
    const resp = await request(app).get("/jobs?minSalary=100&title=1&hasEquity=true");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            handle: "c1",
            title: "title1",
            salary: 123,
            equity: "0.8"
          }
        ],
    });
  });

  test("fail: minSalary is not an integer", async function () {
    const resp = await request(app).get("/jobs?minSalary=sdf&title=c1&hasEquity=true");
    console.log('response is')
    console.log(resp.body.error.message)
    expect(resp.statusCode).toBe(400)
    expect(resp.body.error.message).toEqual("Min salary must be an integer");
  });

  test("fail: hasequity is not boolean", async function () {
    const resp = await request(app).get("/jobs?minSalary=100&title=c1&hasEquity=2");
    console.log('response is')
    console.log(resp.body.error.message)
    expect(resp.statusCode).toBe(400)
    expect(resp.body.error.message).toEqual("hasEquity must be a boolean");
  });

  test("fail: query has invalid filter name", async function () {
    const resp = await request(app).get("/jobs?minSalary=100&title=c1&equity=true");
    console.log('response is')
    console.log(resp.body.error.message)
    expect(resp.statusCode).toBe(400)
    expect(resp.body.error.message).toEqual("equity is not a valid filter");
  });

  test("fail: filter appears more than once", async function () {
    const resp = await request(app).get("/jobs?minSalary=100&title=1&hasEquity=true&minSalary=200");
    console.log('response is')
    console.log(resp.body.error.message)
    expect(resp.statusCode).toBe(400)
    expect(resp.body.error.message).toEqual("minSalary appears more than once");
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:handle", function () {
  test("works for anon", async function () {
    const id = await db.query(`select id from jobs where company_handle='c1'`)
    const theId = id.rows[0].id

    const resp = await request(app).get(`/jobs/c1`);
    expect(resp.body).toEqual({
      jobs: [{
        id: theId,
        handle: "c1",
        title: "title1",
        salary: 123,
        equity: "0.8"

      }]
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/jobs/c3`);
    expect(resp.body).toEqual({ jobs: [] });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ jobs: [] });
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /companies/:handle", function () {
  test("works for admin users", async function () {
    const id = await db.query(`select id from jobs where company_handle='c1'`)
    const theId = id.rows[0].id

    const resp = await request(app)
      .patch(`/jobs/${theId}`)
      .send({
        title: "C1-new",
      })
      .set("authorization", `Bearer ${u4Token}`);

    console.log('jobs from back from get one company', resp.body)

    expect(resp.body).toEqual({
      job: {
        id: theId,
        handle: "c1",
        title: "C1-new",
        salary: 123,
        equity: "0.8"
      },
    });
  });

  test("fails for users without admin account", async function () {
    const id = await db.query(`select id from jobs where company_handle='c1'`)
    const theId = id.rows[0].id

    const resp = await request(app)
      .patch(`/jobs/${theId}`)
      .send({
        title: "C1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });


  // test("unauth for anon", async function () {
  //   const resp = await request(app)
  //     .patch(`/companies/c1`)
  //     .send({
  //       name: "C1-new",
  //     });
  //   expect(resp.statusCode).toEqual(401);
  // });

  // test("not found on no such company", async function () {
  //   const resp = await request(app)
  //     .patch(`/companies/nope`)
  //     .send({
  //       name: "new nope",
  //     })
  //     .set("authorization", `Bearer ${u4Token}`);
  //   expect(resp.statusCode).toEqual(404);
  // });

  // test("bad request on handle change attempt", async function () {
  //   const resp = await request(app)
  //     .patch(`/companies/c1`)
  //     .send({
  //       handle: "c1-new",
  //     })
  //     .set("authorization", `Bearer ${u4Token}`);
  //   expect(resp.statusCode).toEqual(400);
  // });

  // test("bad request on invalid data", async function () {
  //   const resp = await request(app)
  //     .patch(`/companies/c1`)
  //     .send({
  //       logoUrl: "not-a-url",
  //     })
  //     .set("authorization", `Bearer ${u4Token}`);
  //   expect(resp.statusCode).toEqual(400);
  // });
});

  // /************************************** DELETE /companies/:handle */

  // describe("DELETE /companies/:handle", function () {
  //   test("works for users", async function () {
  //     const resp = await request(app)
  //       .delete(`/companies/c1`)
  //       .set("authorization", `Bearer ${u4Token}`);
  //     expect(resp.body).toEqual({ deleted: "c1" });
  //   });

  //   test("fails for users without admin account", async function () {
  //     const resp = await request(app)
  //       .delete(`/companies/c1`)
  //       .set("authorization", `Bearer ${u1Token}`);
  //     expect(resp.statusCode).toEqual(401);
  //   });

  //   test("unauth for anon", async function () {
  //     const resp = await request(app)
  //       .delete(`/companies/c1`);
  //     expect(resp.statusCode).toEqual(401);
  //   });

  //   test("not found for no such company", async function () {
  //     const resp = await request(app)
  //       .delete(`/companies/nope`)
  //       .set("authorization", `Bearer ${u4Token}`);
  //     expect(resp.statusCode).toEqual(404);
  //   });
// });
