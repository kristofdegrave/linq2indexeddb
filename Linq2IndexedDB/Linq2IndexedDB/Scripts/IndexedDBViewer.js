/// <reference path="../Scripts/jquery-1.7.1.js" />
/// <reference path="../Scripts/Linq2IndexedDB.js" />
/// <reference path="../Scripts/jquery-ui-1.8.17.js" />

$(function () {
    $('#tabs').hide();

    $('#tabs').tabs({
        tabTemplate: "<li><a href='#{href}'>#{label}</a></li>"
    });

    $('#btnViewDatabase').click(function(){
        viewDatabase($('#txtDatabaseName').val());
    });

    function viewDatabase(dbName) {
        $('#tabs').show();

        for (var i = $('#tabs').tabs('length') - 1; i >= 0; i--) {
            $('#tabs').tabs("remove", i);
        }

        linq2indexedDB.core.db(dbName).then(function (args) {
            // Definitions
            $("#tabs").tabs("add", '#tab-Definition', 'Definition');
            var definitionTab = $('#tab-Definition');
            viewDefinition(definitionTab, args[0]);
        },
        function () {
            // TODO implement error
        });              
    }

    function viewDefinition(view, connection) {
        // Objectstores
        view.append($('<h3>Object stores: </h3>'));
        var tableObjectStores = $('<table id="tblObjectStores"></table>');
        var rowObjectStores = $('<tr></tr>');
        rowObjectStores.append($('<th>name</th>'));
        rowObjectStores.append($('<th>keyPath</th>'));
        rowObjectStores.append($('<th>autoIncrement</th>'));
        tableObjectStores.append(rowObjectStores);
        view.append(tableObjectStores);

        view.append($('<h3>Indexes: </h3>'));
        var tableIndexes = $('<table id="tblIndexes"></table>');
        var rowIndexes = $('<tr></tr>');
        rowIndexes.append('<th>name</th>');
        rowIndexes.append('<th>keyPath</th>');
        rowIndexes.append('<th>objectStore</th>');
        rowIndexes.append('<th>multiEntry</th>');
        rowIndexes.append('<th>unique</th>');
        tableIndexes.append(rowIndexes);
        view.append(tableIndexes);

        for (var i = 0; i < connection.objectStoreNames.length ; i++) {
            var storeName = connection.objectStoreNames[i];
            $("#tabs").tabs("add", '#tab-' + storeName, storeName);

            linq2indexedDB.core.objectStore(linq2indexedDB.core.transaction(connection, storeName, IDBTransaction.READ_ONLY, false), storeName).then(function (args) {
                var store = args[1];

                objectStoreDefinition(tableObjectStores, store);
                for (var i = 0; i < store.indexNames.length; i++) {
                    linq2indexedDB.core.index(store, store.indexNames[i], false).then(function (args1) {
                        indexDefinitions(tableIndexes, args1[1]);
                    });
                }

                linq2indexedDB.core.cursor(store).then(function (args1) {

                }
                , function (args1) { }
                , function (args1) {
                    var storeTab = $('#tab-' + args1[1].source.name);
                    var tableData = $('<table></table>');
                    var rowData = $('<tr></tr>');
                    rowData.append('<th>key</th>');
                    rowData.append('<th>value</th>');
                    tableData.append(rowData);
                    storeTab.append(tableData);

                    storeData(tableData, args1)
                });
            });
        }
    }

    function objectStoreDefinition(table, store) {
        var row = $('<tr></tr>');
        row.append('<td>' + store.name + '</td>');
        row.append('<td>' + store.keyPath + '</td>');
        row.append('<td>' + store.autoIncrement + '</td>');
        table.append(row);
    }

    function indexDefinitions(table, index) {
        var multiEntry = index.multiEntry || index.multiRow
        var row = $('<tr></tr>');
        row.append('<td>' + index.name + '</td>');
        row.append('<td>' + index.keyPath + '</td>');
        row.append('<td>' + index.objectStore.name + '</td>');
        row.append('<td>' + multiEntry + '</td>');
        row.append('<td>' + index.unique + '</td>');
        table.append(row);
    }

    function storeData(table, data) {
        var row = $('<tr></tr>');
        row.append('<td>' + data[1].key + '</td>');
        if (typeof data[0] == "object") {
            row.append('<td>' + JSON.stringify(data[0]) + '</td>');
        }
        else {
            row.append('<td>' + data[0] + '</td>');
        }
        table.append(row);
    }
});