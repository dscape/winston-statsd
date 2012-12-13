var macros  = require('./macros');

//
// Our `master` tests
// should match `tests/fixtures/master.json`
//
macros.match_fixtures_test('core', function runTest(logger) {
  macros.args_for_fixtures('core').forEach(function (arg) {
    arg.length = 3;
    logger.log.apply(logger, [].slice.call(arg, 0));
  });
});
