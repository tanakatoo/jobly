const { BadRequestError } = require("../expressError");

/** Parses incoming json data and returns the values and parameterized query string ready to be injected into SQL statements 
 * 
 * dataToUpdate is the data to update
 * jsToSql is an object that contains the data to map key from dataToUpdate -> column name
 * 
 * Returns:
 * setCols = string used to set the data in the SQL statement
 * values = takes only the values from dataToUpdate and returns it in an array
 *
 **/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
