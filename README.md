# winston-statsd

generates `statsd` from winston logs — extremely tailored to nodejitsu internal needs, use accordingly

## don't use this unless you know what you are doing

don't use this module unless you read all the code — it's documented well enough. if you end up using it please feel free to add to this read-me file and make it so others can to

if you don't work at nodejitsu, you probably don't want to use this

## installation

1. install [npm][1]
2. `npm install winston winston-statsd --save`

## setup

just require it as any other transport and use the logger:

``` js
var winston = require('winston');

require('winston-statsd');

new (winston.Logger)(
  { transports:
    [ new (winston.transports.Statsd)(
      { hostname: 'localhost', port: 8125 })
    ]
  });
```

refer to the [`lynx`](https://github.com/dscape/lynx) documentation for more configuration parameters you might wish to use, e.g. `scope` to prefix all messages you send with your package name

``` js
var winston = require('winston')
  , scope   = require('./package.json').name.replace(/[^a-zA-Z\d_]/, '')
  ;

require('winston-statsd');

new (winston.Logger)(
  { transports:
    [ new (winston.transports.Statsd)(
      { hostname: 'localhost', port: 8125, scope: scope })
    ]
  });
```

you can also define a separator in the options. by default this will ignore any log message that does not respond to the following regex:

``` js
/^[a-z\d]+([:\.\-_][a-z\d]+)*$/
```

the `:` is the separator, and will be replaced by something else if you specify your own separator

## usage

just log something that has no spaces and uses the separator you defined:

``` js
logger.log('info', 'foo:bar');
```

the default operation is to increment `info.foo.bar` by one.

### specifying other stats and sample rate

counts are just a subset of what `statsd` supports. here is how you can change your log message from a count to something else:

``` js
logger.log('info', 'baz',
  { "statsd_v"          : 1     // any number
  , "statsd_s"          : "c"   // /c|ms|g|s/
  , "statsd_sample_rate": 1     // number between 0—1
  });
```

### nodejitsu specific

if you specify `user`, `app`, `message`, or `error` in your metadata we will send more stuff to statsd:

``` js
logger.log('error', 'app:slave:tell', 
  { app: "test"
  , username: "marak"
  , error: "connect ECONNREFUSED"
  });
```

will produce the following metrics:

```
error.app.slave.tell.connect_econnrefused:1|c
users.marak.error.app.slave.tell:1|c
apps.marak.test.error.app.slave.tell:1|c
errors.marak.test.connect_econnrefused.error.app.slave.tell:1|c
```

you are right, this should be generalized and specified at setup time. feel free to send a pull request if you care that much

## tests

to run (and configure) the test suite simply:

``` sh
cd nano
npm install
npm test
```

## meta

```
       ／l、  ＜ STATSD NAO!
     (ﾟ､ ｡ ７
＿＿＿ l、 ~ヽ＿＿
      じしf_, )ノ ＼
＿＿＿＿＿＿＿＿＿＿＿ ＼
￣￣￣￣￣￣￣￣￣| |￣
＿＿＿＿＿＿＿＿＿| |
￣￣￣￣￣￣￣￣￣| |

credit: http://dis.4chan.org/read/sjis/1223854889
```

* code: `git clone git://github.com/dscape/winston-statsd.git`
* home: <http://github.com/dscape/winston-statsd>
* bugs: <http://github.com/dscape/winston-statsd/issues>
* build: [![build status](https://secure.travis-ci.org/dscape/winston-statsd.png)](http://travis-ci.org/dscape/winston-statsd)

`(oo)--',-` in [caos][3]

[1]: http://npmjs.org
[3]: http://caos.di.uminho.pt/

## the mit license

copyright 2012 nuno job <nunojob.com> (oo)--',--

permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "software"), to deal in the software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, and to permit persons to whom the software is furnished to do so, subject to the following conditions:

the above copyright notice and this permission notice shall be included in all copies or substantial portions of the software.

the software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and non-infringement. in no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.
