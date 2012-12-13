var macros  = require('./macros');

//
// Our `balancers` tests
// should match `tests/fixtures/balancers.json`
//
macros.match_fixtures_test('balancers', function runTest(logger) {
  macros.args_for_fixtures('balancers').forEach(function (arg) {
    arg.length = 3;
    logger.log.apply(logger, [].slice.call(arg, 0));
  });
});
