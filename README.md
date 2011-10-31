Backbone Cradle
---------------
Extension for [Backbone](http://documentcloud.github.com/backbone/) to use
[Cradle](https://github.com/cloudhead/cradle) as an interface to a 
[CouchDB](http://couchdb.apache.org/) database for Model persistence. 
Intended for server-side use of Backbone, but should work if accessing the
database directly.

View creation is not supported as cradle already handles this very gracefully.

This library was originally based on Development Seeds' 
[backbone-couch](https://github.com/developmentseed/backbone-couch), but
in the end takes quite a different approach.

To ensure compatibility with Ruby's CouchRest Model (also maintained by Sam Lown),
ensure the 'type' column, is always set in your models.

### Changes

* 2011-10-31 - 0.1.1
 * Upgraded to Cradle 0.5.7

### Installation

    npm install backbone-cradle

### Usage

    // Prepare Backbone and Cradle along with a default database
    // called 'documents'
    var Backbone = require('backbone'),
        cradle   = require('cradle'),
        db       = new (cradle.Connection)().database('documents')

    // Create a new backbone-cradle handler
    var Couch = require('backbone-cradle')(cradle, db);

    // Create your backbone Models using the new handler
    var Document = Couch.Model.extend({
      initialize: function() {
        // always set the type for CouchRest Compatibility
        this.set({type: 'Document'});
      }
    });

    // Do the same for your collections
    var DocumentList = Couch.Collection.extend({
      // Name of view to use is always required!
      viewName: 'Document/all'
    });


### Run tests

Requires [Expresso](http://visionmedia.github.com/expresso/). Tested with version 0.7.6.

    cd backbone-cradle/
    npm test

### Todos

Add support for dynamic collections with a similar implementation
to Jan Monschke's [backbone-couchdb](https://github.com/janmonschke/backbone-couchdb) library.

