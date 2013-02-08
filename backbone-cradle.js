// Provides a `Backbone.sync` or `Model.sync` method for the server-side
// context. Uses CouchDB for model persistence.
var _        = require('underscore'),
    Backbone = require('backbone');

module.exports = function(cradle, database) {

    // Determine a useable database from the provided object. Accepts
    // either a function, a string which will be converted into a database
    // using cradle's default configuration, or an already prepared database
    // object.
    //
    // If no useable database is found, the default database provided
    // on initialisation will be used instead.
    var getDatabase = function(object) {
      var db;
      if (object) {
        if (object instanceof Function) {
          db = object.call(this);
        } else if (typeof object === 'string') {
          db = new(cradle.Connection)().database(object);
        } else {
          db = object;
        }
      } else {
        db = database;
      }
      return db;
    };

    // Used with collections, determines the name of the view from
    // either a function call or a simple string.
    var getViewName = function(object) {
      if (object instanceof Function) {
        return object();
      } else if (typeof object === 'string') {
        return object;
      }
    };

    // Prepare model for saving / deleting.
    var toJSON = function(model) {
        var doc = model.toJSON();
        return doc;
    };


    // Backbone sync method.
    var sync = function(method, model, options) {
        var success = options.success || function() {};
        var error = options.error || function() {};
        var db = getDatabase.call(model, model.database);
        if (!db) return error(new Error("Model or Collection must have a database!"));
        switch (method) {
        case 'read':

            if (model.id) {
              db.get(model.id, function(err, doc) {
                err ? error(new Error('No results')) : success(doc);
              });
            } else {
              if (model.viewName) {
                  //return error(new Error({ error: "Collection must have a viewName property!"}));
                  var url = getViewName(model.viewName);
                  // ensure that the include_docs option is always set
                  var data = (options || {})['data'] || { };
                  data.include_docs = true;
                  db.view(url, data, function(err, res) {
                    if (err) return error(err);
                    data = [];
                    res.forEach(function(row) {
                      data.push(row);
                    });
                    success(data);
                  });
              } else {
                  // ensure that the include_docs option is always set
                  var data = (options || {})['data'] || { };
                  data.include_docs = true;
                  db.all(data, function(err, res) {
                    if (err) {
                        return error(err);
                    }
                    data = [];
                    res.forEach(function(row) {
                      data.push(row);
                    });
                    success(data);
                  });
              }

            }
            break;
        case 'create':
            db.save(toJSON(model), function(err, res) {
              if (err) return error(err);
              success({'_rev': res.rev, '_id': res.id});
            });
            break;
        case 'update':
            // Ensure that partial updates work by retrieving the model
            // and merging its attributes.
            db.save(model.id, toJSON(model), function(err, res) {
              if (err) return error(err);
              success({'_rev': res.rev});
            });
            break;
        case 'delete':
            db.remove(model.id, function(err, res) {
              if (err) return error(err);
              success({'_rev': res.rev});
            });
            break;
        }
    };

    // The Model class that should be used as the base of all Cradle based
    // models. Automatically sets reasonable defaults and uses the 
    // correct sync library without overriding the Backbone defaults.
    var Model = Backbone.Model.extend({

      // CouchDB documents always use _id
      idAttribute: '_id',

      // Database to use, null by default so that the default is used.
      database: null,

      // Backbone will always use the sync model provided.
      sync: sync

    });

    var Collection = Backbone.Collection.extend({

      // Database to use, should be overriden if the default
      // is not provided or not wanted.
      database: null,

      // The view name should be overriden with either a simple
      // string used by cradle, or a method that will 
      // return an appropriate string.
      viewName: '',

      // Ensure the sync is set
      sync: sync

    });

    return {
      sync: sync,
      Model: Model,
      Collection: Collection
    };
};
