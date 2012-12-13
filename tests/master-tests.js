var macros  = require('./macros');

//
// Our `master` tests
// should match `tests/fixtures/master.json`
//
macros.matchFixturesTest('master', function runTest(connection) {
  connection.increment('foo.bar');
  connection.decrement('foo.baz');
  connection.decrement(['uno', 'two', 'trezentos']);
  connection.count('boaz', 101);
});
