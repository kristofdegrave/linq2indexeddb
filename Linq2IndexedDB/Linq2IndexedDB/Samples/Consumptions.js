/// <reference path="../Scripts/jquery-1.7.2.js" />
/// <reference path="../Scripts/jquery-ui-1.8.20.js" />
/// <reference path="../Scripts/Linq2IndexedDB.js" />
/// <reference path="../Scripts/modernizr-2.5.3.js" />

var consumptionTypes = [];
var indexedDBName = "Consumption database";
var applicationVersion = 1;
var CONSUMPTIONTYPE = "ConsumptionType";
var CONSUMPTION = "Consumption";

var databaseDefinition = [{
    version: 1,
    objectStores: [{ name: CONSUMPTIONTYPE, objectStoreOptions: { autoIncrement: false, keyPath: "Id" } },
        { name: CONSUMPTION, objectStoreOptions: { autoIncrement: true, keyPath: "Id" } }],
    indexes: [{ objectStoreName: CONSUMPTION, propertyName: "ConsumptionTypeId", indexOptions: { unique: false, multirow: false } }],
    defaultData: [{ objectStoreName: CONSUMPTIONTYPE, data: { Id: 1, Description: "Electricity", HasDay: true, hasNight: true }, remove: false },
        { objectStoreName: CONSUMPTIONTYPE, data: { Id: 2, Description: "Gas", HasDay: true, hasNight: false }, remove: false },
        { objectStoreName: CONSUMPTIONTYPE, data: { Id: 3, Description: "Water", HasDay: true, hasNight: false }, remove: false }]
}];

var dbConfig = new Object();
dbConfig.version = applicationVersion;
//dbConfig.objectStoreConfiguration = ObjStores;
dbConfig.definition = databaseDefinition;

var db = window.linq2indexedDB(indexedDBName, dbConfig, true);

$(function() {
    $("#tabs").tabs({
        tabTemplate: "<li><a href='#{href}'>#{label}</a></li>"
    });

    $('#cboTypeConsumption').empty();

    //db.deleteDatabase().then(function(){
    db.initialize().then(function() {
        db.linq.from(CONSUMPTIONTYPE).select().then(function() {
        }, handleError, function(data) {
            InitializeConsumptionType(data);
        });
    }, handleError);
    //});

    if (!Modernizr.inputtypes.date) {
        $('input[type=date]').datepicker();
    }

    var txtId = $("#txtId");
    var dtpDate = new $("#dtpDate");
    var cboTypeConsumption = $("#cboTypeConsumption");
    var txtDayValue = $("#txtDayValue");
    var txtNightValue = $("#txtNightValue");

    $("#dialog-form").dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true,
        buttons: {
            "Save": function() {
                var bValid = true;
                //allFields.removeClass("ui-state-error");

                if (bValid) {
                    var id = parseInt(txtId.val());
                    var consumption = { };
                    if (id != 0) {
                        consumption.Id = id;
                    }

                    if (Modernizr.inputtypes.date) {
                        consumption.Date = new Date(dtpDate.val());
                    } else {
                        consumption.Date = dtpDate.datepicker("getDate");
                    }
                    consumption.ConsumptionTypeId = parseInt(cboTypeConsumption.val());
                    consumption.DayValue = parseInt(txtDayValue.val());
                    consumption.NightValue = parseInt(txtNightValue.val());
                    consumption.SaveDate = new Date(Date.now());

                    saveConsumption(consumption);

                    $(this).dialog("close");
                }
            },
            Cancel: function() {
                $(this).dialog("close");
            }
        },
        close: function() {
        }
    });

    cboTypeConsumption.change(function() {
        ConsumptionChanged(cboTypeConsumption.val());
    });
});

function loadConsumptionType(id) {
    var consumptionType = GetConsumptionType(id);
    $('#consumptions-data-' + consumptionType.Description).empty();

    db.linq.from(CONSUMPTION).where("ConsumptionTypeId").equals(id).orderByDesc("Date").select().then(function() {
    }, handleError, function(data) {
        showConsumption(data, consumptionType);
    });
}

function saveConsumption(consumption) {
    if (consumption.Id && consumption.Id != 0) {
        db.linq.from(CONSUMPTION).update(consumption).then(function(data) {
            //loadConsumptionType(consumption.ConsumptionTypeId);
            showConsumption(data.object, GetConsumptionType(data.object.ConsumptionTypeId));
        }, handleError);
    } else {
        db.linq.from(CONSUMPTION).insert(consumption).then(function(data) {
            //loadConsumptionType(consumption.ConsumptionTypeId);
            showConsumption(data.object, GetConsumptionType(data.object.ConsumptionTypeId));
        }, handleError);
    }
}

function deleteConsumption(id) {
    db.linq.from(CONSUMPTION).remove(id).then(function() {
        //loadConsumptionType(consumptionTypeId);
        $('#consumptionId-' + id).remove();
    }, handleError);
}

function getConsumption(id) {
    db.linq.from(CONSUMPTION).get(id).then(InitializeUpdate, handleError);
}

function InitializeConsumptionType(consumptionType) {
    var option = '<option value="' + consumptionType.Id + '">' + consumptionType.Description + '</option>';
    $('#cboTypeConsumption').append(option);
    consumptionTypes.push(consumptionType);

    $("#tabs").tabs("add", '#tab-' + consumptionType.Description, consumptionType.Description);

    var content = $('#tab-' + consumptionType.Description);
    $('#consumptios-contain').append(content);

    var table = $('<table id="consumptions-' + consumptionType.Description + '" class="ui-widget ui-widget-content"></table>');
    content.append(table);
    var thead = $('<thead></thead>');
    table.append(thead);
    var tr = $('<tr class="ui-widget-header"></tr>');
    thead.append(tr);
    tr.append('<th>Date</th>');
    if (consumptionType.HasDay) {
        tr.append('<th>Day</th>');
    }
    if (consumptionType.hasNight) {
        tr.append('<th>Night</th>');
    }
    tr.append('<th>Actions</th>');

    var tbody = $('<tbody id="consumptions-data-' + consumptionType.Description + '"></tbody>');
    table.append(tbody);

    var button = $('<button id="AddConsumption' + consumptionType.Description + '" value="' + consumptionType.Id + '">Add consumption</button>');
    button.button()
        .click(function() {
            InitializeInput($(this).val());
        });

    content.append(button);

    loadConsumptionType(consumptionType.Id);
}

function InitializeInput(id) {
    var txtId = $("#txtId");
    var dtpDate = new $("#dtpDate");
    var cboTypeConsumption = $("#cboTypeConsumption");
    var txtDayValue = $("#txtDayValue");
    var txtNightValue = $("#txtNightValue");

    txtId.val(0);
    dtpDate.datepicker("setDate", Date.now());
    cboTypeConsumption.val(id);
    txtDayValue.val(0);
    txtNightValue.val(0);

    ConsumptionChanged(id);

    $("#dialog-form").dialog("open");
}

function InitializeUpdate(consumption) {
    var txtId = $("#txtId");
    var dtpDate = new $("#dtpDate");
    var cboTypeConsumption = $("#cboTypeConsumption");
    var txtDayValue = $("#txtDayValue");
    var txtNightValue = $("#txtNightValue");

    txtId.val(consumption.Id);
    dtpDate.datepicker("setDate", consumption.Date);
    cboTypeConsumption.val(consumption.ConsumptionTypeId);
    txtDayValue.val(consumption.DayValue);
    txtNightValue.val(consumption.NightValue);

    ConsumptionChanged(consumption.ConsumptionTypeId);

    $("#dialog-form").dialog("open");
}

function ConsumptionChanged(id) {
    var txtDayValue = $("#txtDayValue");
    var txtNightValue = $("#txtNightValue");
    var lblDayValue = $("#lblDayValue");
    var lblNightValue = $("#lblNightValue");

    var consumptionType = GetConsumptionType(id);
    if (consumptionType.HasDay) {
        txtDayValue.removeClass('invisible');
        lblDayValue.removeClass('invisible');
    } else {
        txtDayValue.addClass('invisible');
        lblDayValue.addClass('invisible');
    }

    if (consumptionType.hasNight) {
        txtNightValue.removeClass('invisible');
        lblNightValue.removeClass('invisible');
    } else {
        txtNightValue.addClass('invisible');
        lblNightValue.addClass('invisible');
    }
}

function showConsumption(data, consumptionType) {
    var row = $('#consumptionId-' + data.Id);
    if (row.length > 0) {
        row.empty();
    } else {
        row = $('<tr id="consumptionId-' + data.Id + '">');
    }
    row.append('<td>' + data.Date.toLocaleString() + '</td>');
    if (consumptionType.HasDay) {
        row.append('<td>' + data.DayValue + '</td>');
    }
    if (consumptionType.hasNight) {
        row.append('<td>' + data.NightValue + '</td>');
    }

    var upd = $('<button type="button" value="' + data.Id + '">Update</button>');
    upd.button()
        .click(function() {
            getConsumption(parseInt($(this).val()));
        });

    var del = $('<button type="button" value="' + data.Id + '">Delete</button>');
    del.button()
        .click(function() {
            deleteConsumption(parseInt($(this).val()));
        });
    var col = $('<td></td>');
    col.append(upd);
    col.append(del);
    row.append(col);
    $('#consumptions-data-' + consumptionType.Description).append(row);
}

function GetConsumptionType(id) {
    for (var i = 0; i < consumptionTypes.length; i++) {
        if (consumptionTypes[i].Id == id) {
            return consumptionTypes[i];
        }
    }
    return null;
}

function handleError(error) {
    alert(error);
}