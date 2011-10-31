var assert   = require('assert'),
    util     = require('util'),
    _        = require('underscore'),
    Backbone = require('backbone'),
    cradle   = require('cradle');

var db       = new(cradle.Connection)().database('backbone-cradle-test');
var Couch    = require('../backbone-cradle')(cradle, db);

// Global fatal error handler.
// ---------------------------
var error = function(db) {
    return function(result, error) {
        console.error(new Error(error).stack);
        //db.dbDel(function() {
        //    process.exit(0);
        //});
    }
};

// Some basic models and collections to test with
// ----------------------------------------------
var Todo = Couch.Model.extend({
  initialize: function() {
    this.set({type: "Todo"});
  }
});
var Task = Couch.Model.extend({
  initialize: function() {
    this.set({type: "Task"});
  }
});
var TaskCollection = Couch.Collection.extend({
  viewName: 'Tasks/all',
  model: Task
});
var TaskByNameCollection = Couch.Collection.extend({
  viewName: 'Tasks/by_name',
  model: Task
});
var Tasks = new TaskCollection;
var TasksByName = new TaskByNameCollection;


// Hope that the DB create is fast!
db.create(function() {
  // Create a Basic Design Doc for Todos
  db.save("_design/Tasks", {
    all: {
      map: function(d) {
        if (d['type'] == 'Task') emit(d._id, 1);
      }
    },
    by_name: {
      map: function(d) {
        if (d['type'] == 'Task' && d['name']) emit(d.name, 1);
      }
    }
  });
});

// Create db, save documents, load documents, destroy documents, destroy db.
// -------------------------------------------------------------------------
module.exports = {
  'creating a model': function() {
      var doc = new Todo({name: "Test Todo"});
      assert.equal(doc.get('name'), "Test Todo");
      assert.equal(doc.get('type'), "Todo");
      doc.save({}, {
        success: function() {
          assert.isDefined(doc.id);
          assert.isDefined(doc.get('_rev'));
        },
        error: function() {
          assert.isNotNull(null); // only call if test fails!
        }
      });
  },

  'creating a model with fixed id': function() {
      var doc = new Todo({_id: "test_todo", name: "Test Todo"});
      assert.equal(doc.id, "test_todo");
      doc.save({}, {
        success: function() {
          assert.equal(doc.id, 'test_todo');
        },
        error: function() {
          assert.isNotNull(null); // only call if test fails!
        }
      });
  },

  'loading a model': function() {
      var doc = new Todo({_id: "test_todo2", name: "Test Todo 2"});
      doc.save({}, {
        success: function() {
          // Now try to load the model again
          doc = new Todo({_id: "test_todo2"});
          doc.fetch({
            success: function() {
              assert.equal(doc.get('name'), "Test Todo 2");
            },
            error: function() {
              assert.isNotNull(null);
            }
          });
        },
        error: function() {
          assert.isNotNull(null);
        }
      });
  },

  'updating': function() {
      var doc = new Todo({_id: "test_todo3", name: "Test Todo 3"});
      doc.save({}, {
        success: function() {
          // Now try saving the model again, with a change
          doc.save({name: "Test Todo 3 Updated"}, {
            success: function() {
              assert.equal(doc.get('name'), "Test Todo 3 Updated");
            },
            error: function() {
              assert.isNotNull(null);
            }
          });
        },
        error: function() {
          assert.isNotNull(null);
        }
      });
  },

  'deleting a document': function() {
      var doc = new Todo({_id: "test_todo4", name: "Test Todo 4"});
      doc.save({}, {
        success: function() {
          // Now try deleting it!
          doc.destroy({
            success: function() {
              // try loading again
              doc = new Todo({_id: "test_todo4"});
              doc.fetch({
                success: function() {
                  assert.isNotNull(null);
                },
                error: function() {
                  assert.isNull(null);
                }
              });
            },
            error: function() {
              assert.isNotNull(null);
            }
          });
        },
        error: function() {
          assert.isNotNull(null);
        }
      });
  },

  /*
   * Using a collection class
   *
   * Assumes previous examples are still available.
   */
  'collection loading': function(beforeExit) {
    // Create a bunch of TodoTasks
    docs = [];
    for (var i = 0; i < 10; i++) {
      docs.push({
        _id: 'task_'+i, // Use fixed ids to avoid threading issues
        type: 'Task',
        name: "Task Item "+i,
      });
    }
    db.save(docs, function(e, r) {
      if (e) return assert.isNull(true, "Unable to save docs");
      Tasks.fetch({
        success: function() {
          assert.equal(Tasks.length, 10);
          assert.match(Tasks.first().get('name'), /Task Item/);
        },
        error: function() {
          assert.isNull(true, "Unable to fetch collection");
        }
      });

      TasksByName.fetch({
        success: function() {
          assert.equal(TasksByName.first().get('name'), "Task Item 0");
          assert.equal(TasksByName.last().get('name'), "Task Item 9");
        },
        error: function(err) {
          assert.isNull(true, err);
        }
      });
    });
    beforeExit(function() {
      // last one, so delete the db
      db.destroy()
    });
  }


};
