var path   = require('path')
  , dgram  = require('dgram')
  , test   = require('tap').test
  , lynx   = require('lynx')
  , macros = exports
  ;

//
// set the server port
//
macros.udp_server_port = 9753;

//
// create a connection
//
macros.connection = new lynx('localhost', macros.udp_server_port);

//
// ### function udp_server(on_message)
//
// #### @on_message {function} function to be run on each message
//
// start a `udp` server.
//
macros.udp_server = function udp_server(on_message) {
  var socket = dgram.createSocket('udp4', on_message);

  //
  // listen in some (not so) random port
  //
  socket.bind(macros.udp_server_port, 'localhost');

  return socket;
};

//
// ### function udp_fixtures_server(test_name, on_test)
//
// #### @test_name {string} the test that is calling this, so we can load
//      the respective fixture
// #### @on_test   {function} function that returns the result of a specific
//      test
//
// start a `udp` server that will expect an event that is
// mocked in `fixtures`
//
macros.udp_fixtures_server = function (test_name, t, on_test) {
  //
  // set the path for the fixture we want to load
  //
  var fixture_path = path.join('fixtures', test_name + '.json');

  //
  // try to load the fixture.
  // this will break your program if you delete by mistake
  //
  var fixture = require('./' + fixture_path);

  //
  // the number of requests we expect to get
  //
  var nr_requests = fixture.length
    , i_requests  = 0
    ;

  //
  // create a udp socket
  //
  var socket = macros.udp_server(function (message, remote) {
    //
    // we got another one
    //
    i_requests++;

    //
    // `remote.address` for remote address
    // `remote.port` for remote port
    // `remote.size` for data lenght
    // `message.toString('ascii', 0, remote.size)` for textual contents
    //
    var actual     = macros.parse_message(message, remote.size)
      , i_expected = fixture.indexOf(actual)
      ;

    //
    // found it
    //
    if (~i_expected) {
      var expected = fixture[i_expected];

      //
      // remove the found item from fixture to test
      //
      fixture.splice(i_expected, 1);

      //
      // return our test results
      //
      on_test(true, {expected: expected, actual: actual, remaining: fixture});
    }
    //
    // we didn't find that response in the response array
    //
    else {
      on_test(false, { expected: null, actual: actual, remaining: fixture});
    }

    //
    // if we are done
    //
    if(i_requests === nr_requests) {
      //
      // close the server
      //
      socket.close();

      //
      // tests are complete
      //
      t.end();
    }
  });
};

//
// ### function match_fixtures_test(resource, f)
//
// #### @resource {string} the resource we are testing
// #### @f        {function} the actual udp client calls to be received by
//      our mock server
//
// 1.   loads fixtures for this resource and checks how many client requests
//      are going to exist
// 2.   runs a tests that:
// 2.1. start a `udp` server that will expect a event that
//      is mocked in `fixtures`
// 2.2. runs client code that should match what has been mocked
//
macros.match_fixtures_test = function match_fixtures_test(resource, f) {
  var current_fixture = require('./fixtures/' + resource);

  //
  // all of our counting tests
  //
  test(resource + ' test', function (t) {
    //
    // setup our server
    //
    macros.udp_fixtures_server(resource, t, function (err, info) {
      //
      // just treat it like any other thing.
      // but hey, that fixture is wrong dude!
      //
      if(typeof info.expected === 'string') {
        t.equal(info.expected, info.actual, 
          'equality check for ' + info.actual);
      }
      //
      // this failed, let's show the array of possibilities that could
      // have matched
      //
      else {
        t.equal(info.remaining, [info.actual],
          "didn't find value " + info.actual + 
          ' in array of possible fixtures');
      }
    });

    //
    // run our client code
    //
    if(resource === 'scopes') {
      macros.connection.close();
      macros.connection = new lynx('localhost', macros.udp_server_port, {
        scope: 'scope' });
    }
    f(macros.connection);
  });
};

//
// ### function parse_message(message, size)
//
// #### @message {string} message to decode
//
// parses a message
//
macros.parse_message = function parse_message(message, size) {
  return message.toString('ascii', 0, size);
};

//
// export simple `tap` tests
//
macros.test = test;

//
// export `lynx`
//
macros.lynx = lynx;