Ext.define('Aura.util.SyncGrid', {
  extend: 'Ext.grid.Panel'
, model: null
, baseViewConfig: {
    markDirty: false
  , forceFit: true
  }
, insertIdx: 0 // 1
, baseColumns: [
    /*{ xtype: 'checkcolumn'
    , dataIndex: 'checked'
    , width: 20
    , stopSelection: false
    }
  ,*/
    { xtype: 'actioncolumn'
    , width: 24
    , sortable: false
    , items: [
        { iconCls: 'wif-grid-row-delete'
        , tooltip: 'Delete'
        , handler: function(grid, rowIndex, colIndex) {
            grid.store.remoteDelete(grid.store.getAt(rowIndex));
            grid.store.removeAt(rowIndex);
          }
        }
      ]
    }
  ]
, selModel: {
    selType: 'cellmodel'
  }
, border: 0
, baseTbar: [
    { text: 'Add New Item'
    , handler: function() {
        var grid = this.findParentByType('grid')
          , record = Ext.create(grid.model, grid.modelDefault || {})
          , store = grid.getStore()
          , gridCount = store.getCount();

        store.add(record);
        grid.cellEditor.startEditByPosition({
          row: gridCount
        , column: grid.insertIdx
        });
      }
    }
  ]
, preconstruct: function () {
    this.viewConfig = Ext.clone(this.baseViewConfig);
    this.columns = Ext.clone(this.baseColumns);
    this.tbar = Ext.clone(this.baseTbar);
  }

, constructor: function (config) {
    Ext.apply(this, config);

    this.cellEditor = Ext.create('Ext.grid.plugin.CellEditing', {
      clicksToEdit: 1
    });
    this.plugins = [
      this.cellEditor
    ];

    this.callParent(arguments);
  }

, build: function () {
    var me = this;

    me.mask = Ext.create('Ext.LoadMask', this, {msg: "Please wait while the remote data is updated..."});

    me.store.on('remotechanged', function () {
      if (me.sortKey) {
        me.store.sort(me.sortKey, 'ASC');
      }
      me.mask.hide();
    });
    me.store.on('remoteerror', function () {
      me.mask.hide();
      alert('Some problem occur in the server.');
    });
    me.store.remoteList();
    me.mask.show();

    me.on('beforeedit', function(editor, e) {
      _.log(this, 'beforeedit', editor, e);
      return true;
    });

    me.on('edit', function(editor, e) {
      _.log(this, 'edit', editor, e);
      var record = e.record;

      if (record.phantom) { // need to add new record (POST)
        me.mask.show();
        _.log(this, 'call remoteAdd', Ext.clone(record), Ext.clone(record.data));
        me.store.remoteAdd(record);
      } else if (record.dirty) { // need to update record (PUT)
        me.mask.show();
        _.log(this, 'call remoteUpdate', Ext.clone(record), Ext.clone(record.data));
        me.store.remoteUpdate(record);
      }

      return true;
    });
  }

});