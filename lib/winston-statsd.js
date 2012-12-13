/*
 * winston-statsd.js
 *
 * `winston` transport for statsd
 * for more information about winston please check flatiron.org
 *
 * warning: this module is used internally at nodejitsu, it might not be
 *          adequate for you and your team — use at your own risk
 *
 * © nuno job
 * 
 * mit license
 */
var inherits = require('util').inherits
  , winston  = require('winston')
  , lynx     = require('lynx')
  , Stream   = require('stream').Stream
  ;

//
// ### function Statsd (options)
//
// #### @options {object} options for this instance.
//
// constructor function for the statsd transport object responsible
// sending metric information to `statsd`
//
var Statsd = exports.Statsd = function (options) {
  //
  // some object oriented crap
  //
  winston.Transport.call(this, options);

  //
  // hostname is required
  //
  if (typeof options.hostname !== 'string') {
    throw new Error('hostname is a required option to use winston-statsd');
  }

  //
  // port is required
  //
  if (typeof options.port !== number) {
    throw new Error('port is a required option to use winston-statsd');
  }

  //
  // choose separator to be used, e.g. if `:`
  //   `foo:bar` becomes `foo.bar`
  // which has a special meaning for statsd
  //
  this.sep = typeof options.sep === 'string' && options.sep.length === 1
           ? options.sep
           : ':'
           ;

  //
  // escape our separator, damn you javascript
  //
  this.sep = this.sep.replace(/[\-\/\\\^$*+?.()|\[\]{}]/, '\\$&');

  //
  // check for seps with a regex
  //
  this.sep_regexp = new RegExp(this.sep, 'g');

  //
  // defines what a valid key looks like as a regular expression
  //
  this.is_valid_key = 
    new RegExp('^[a-z\\d]+([' + this.sep + '\\.\\-_][a-z\\d]+)*$', 'i');

  //
  // creates a new client connection to `statsd`
  //
  this.client = new lynx('localhost', 8125, options);

  //
  // we are now ready to go
  //
  this.emit('ready');
};

//
// inherit from `winston.Transport`.
//
inherits(Statsd, winston.Transport);

//
// define a getter so that `winston.transports.Statsd`
// is available and thus backwards compatible.
//
winston.transports.Statsd = Statsd;

//
// expose the name of this transport on the prototype
//
Statsd.prototype.name = 'statsd';

//
// ### function log (level, msg, [meta], callback)
//
// #### @level    {string} level at which to log the message
// #### @msg      {string} message to log
// #### @meta     {object} **optional** additional metadata to attach
// #### @callback {function} continuation to respond to when complete
//
// core logging method exposed to winston. metadata is optional
//
Statsd.prototype.log = function (level, msg, meta, callback) {
  //
  // js quirks
  //
  if(typeof meta === 'function') {
    callback = meta;
    meta = {};
  }

  //
  // ignore message if we are silent
  //
  if (this.silent) {
    return callback(null, true);
  }

  //
  // test for valid message events
  //
  // a logger gets hundreds of stuff which are just logs, we cant do
  // anything with those. hence we need to weed those out
  //
  if (!this.is_valid_key.test(msg)) {
    //
    // no statsd for you
    //
    return;
  }

  var metrics = {}
    , err_code
    //
    // value if specified, else defaults to one
    //
    , value   = typeof meta.statsd_v === 'number' ? meta.statsd_v : 1
    //
    // stat if specified, else defaults to count
    //
    , stat    = typeof meta.statsd_s === 'string' ? meta.statsd_s : 'c'
    ;

  //
  // if 1 and c this becomes `1|c` which is was lynx expects
  //
  value = value + '|' + stat;

  //
  // replace the separator by `.`
  // replace dashes with underscores
  // lowercase it all
  //
  msg = msg
      .replace(this.sep_regexp, '.')
      .replace(/\-/g, '_')
      .toLowerCase()
      ;

  //
  // prefix log level always gets added
  //
  msg = level + '.' + msg;

  //
  // we send out a generic metric
  // info.foo.bar:1|c
  //
  metrics[msg] = value;

  //
  // if this seems like an error
  //
  if(typeof meta.message === 'string' || typeof meta.error === 'string') {
    //
    // replace spaces with underscores
    // remove non alpha numeric chars
    // replace double underscores with single underscores
    // lowercase it all
    //
    err_code = (meta.message || meta.error)
      .replace(/ /g, '_')
      .replace(/[^a-zA-Z\d_]/g, '')
      .replace(/_+/, '_')
      .toLowerCase()
      ;

    //
    // add our metric
    // i.e. error.trying.econnrefused
    //
    metrics[msg + '.' + err_code] = value;
  }

  //
  // fixme: while this is convenient for nodejitsu this would need to be
  // generalized for wider audience consumption.
  //
  // probably needs to be in the constructor options and then do some kind
  // of generic walk here
  //
  if(meta.user || meta.username) {
    //
    // if we have information about a user
    // users.dscape.get_user = '1|c';
    //
    metrics['users.' + (meta.user || meta.username) + '.' + msg] = value;

    if(meta.app || meta.application) {
      //
      // if we have info about an app
      // apps.dscape.myapp.worked = '1|c';
      //
      metrics['apps.' + (meta.user || meta.username) + '.' + 
       (meta.app || meta.application) + '.' + msg] = value;

      if(err_code) {
        //
        // if we also detected an error
        // log it for the user
        // errors.dscape.myawesomeapp.connect_econnreset = '-1|c';
        //
        metrics['errors.' + (meta.user || meta.username) + '.' + 
         (meta.app || meta.application) + '.' + err_code + '.' + msg] = value;
      }
    }
  }

  //
  // support custom sample rate, if specified
  //
  if(typeof meta.statsd_sample_rate === 'number') {
    this.client.send(metrics, meta.statsd_sample_rate);
  }
  else {
    this.client.send(metrics);
  }
  
  this.emit('logged');
};