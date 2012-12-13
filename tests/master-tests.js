var macros  = require('./macros');

//
// Our `master` tests
// should match `tests/fixtures/master.json`
//
macros.match_fixtures_test('master', function runTest(logger) {
  macros.args_for_fixtures('master').forEach(function (arg) {
    arg.length = 3;
    logger.log.apply(logger, [].slice.call(arg, 0));
  });
});
