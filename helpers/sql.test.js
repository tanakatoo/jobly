const { sqlForPartialUpdate } = require("../helpers/sql");
const { BadRequestError } = require("../expressError");
const express = require("express");

describe("sqlForPartialUpdate", function () {
  test("error: data to update is empty", function () {
    const data = {};
    const JSdata = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };

    expect(() => sqlForPartialUpdate(data, JSdata)).toThrow('No data')

  });

  test("valid", function () {
    const data = {
      firstName: "BB",
      lastName: "CC",
      isAdmin: true,
      email: "hello@what.com"
    };
    const JSdata = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin"
    };

    const { setCols, values } = sqlForPartialUpdate(data, JSdata)
    expect(setCols).toEqual('\"first_name\"=$1, \"last_name\"=$2, \"is_admin\"=$3, \"email\"=$4')
    expect(values).toEqual(["BB", "CC", true, "hello@what.com"])
  });

  test("data invalid", function () {
    const data = {
      firstName: 23,
      lastName: 34,
      isAdmin: "true",
      email: 65
    };
    const JSdata = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin"
    };

    const { setCols, values } = sqlForPartialUpdate(data, JSdata)
    expect(setCols).toEqual('\"first_name\"=$1, \"last_name\"=$2, \"is_admin\"=$3, \"email\"=$4')
    expect(values).toEqual([23, 34, "true", 65])
  });

});
