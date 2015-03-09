var callqueue = []; //queue used to throttle API calls into Yammer
var dateRange = null; //the date range used to query

//initialize things when page fully loads
$(document).ready(function () {
    // convert txtDateRange text input into datepicker using jquery UI
    $("#txtDateRange").datepicker({
        defaultDate: "-1w",
        changeMonth: false,
        prevText: "<<",
        nextText: ">>",
        numberOfMonths: 1,
        onSelect: function (selectedDate) {
            $("#btnConfigExport").removeAttr("disabled");
            $("#ddFromDate").html($("#txtDateRange").val());
        }
    });

    //setup signalR stuff
    var hub = $.connection.tokenHub;

    // Create a function that the hub can call to broadcast Tokens
    hub.client.sendToken = function (token) {
        //use the token to establish yammer connection
        yam.platform.setAuthToken(token, function (setTokenResult) {
            if (setTokenResult.status == "connected") {
                //request all tokens for the user
                yam.platform.request({
                    url: "https://api.yammer.com/api/v1/oauth/tokens.json",
                    success: function (data) {
                        $("#authorizeModal").modal("hide");

                        //add empty option and then loop through data to add additional options
                        $("#cboNetwork").append($("<option>", { text: "", value: "" }));
                        $(data).each(function (i, e) {
                            $("#cboNetwork").append($("<option>", { text: e.network_permalink, value: e.token }));
                        });
                        $("#rowAuthorize").hide();
                        $("#rowConfigExport").show();
                        $("#step1").removeClass("active");
                        $("#step2").addClass("active");
                    },
                    error: function (err) {
                        $("#alert").html("Error getting network listing...");
                        $("#alert").show();
                    }
                });
            }
            else {
                $("#alert").html("Error connecting to Yammer...");
                $("#alert").show();
            }
        });
    };

    //get datasets the user works with
    $.ajax({
        url: "/api/PowerBI/GetDatasets",
        type: "GET",
        success: function (data) {
            //add empty option and then loop through data to add additional options
            $("#cboDataset").append($("<option>", { text: "", value: "" }));
            $(data).each(function (i, e) {
                if (e.name != null)
                    $("#cboDataset").append($("<option>", { text: e.name, value: e.id }));
            });
        },
        error: function (er) {
            $("#alert").html("Error retrieving Power BI datasets...");
            $("#alert").show();
        }
    });

    // Start the connection.
    $.connection.hub.start().done(function () {
        hub.server.initialize();
    });

    //wire up the authorize dialog
    $("#btnAuthorize").click(function () {
        var redirect = "/OAuth/Authorize?uid=" + $.connection.hub.id;
        window.open(redirect, "", "width=850, height=450, scrollbars=0, toolbar=0, menubar=0, resizable=0, status=0, titlebar=0");
        $("#authorizeModal").modal("show");
    });

    //wire up the btnExportConfig event
    $("#btnConfigExport").click(function () {
        $("#rowConfigExport").hide();
        $("#rowConfigDataset").show();
        $("#step2").removeClass("active");
        $("#step3").addClass("active");
    });

    //wire up the btnConfigDataset event
    $("#btnConfigDataset").click(function () {
        $("#rowConfigDataset").hide();
        $("#rowProcess").show();
        $("#step3").removeClass("active");
        $("#step4").addClass("active");
    });

    //wire change event on cboNetwork
    $("#cboNetwork").change(function () {
        $("#ddNetwork").html($("#cboNetwork option:selected" ).text());
        $("#btnConfigExport").attr("disabled", "disabled");
        $("#txtDateRange").attr("disabled", "disabled");
        $("#cboGroup").attr("disabled", "disabled");
        $("#cboGroup").html("");

        //make sure a network was selected
        if ($("#cboNetwork").val() != "") {
            //set network-specific token for user
            yam.platform.setAuthToken($("#cboNetwork").val(), function (setTokenResult) {
                if (setTokenResult.status == "connected") {
                    //get groups for this network
                    yam.platform.request({
                        url: "https://api.yammer.com/api/v1/groups/for_user/" + setTokenResult.access_token.user_id + ".json",
                        method: "GET",
                        success: function (groups) {
                            $("#cboGroup").removeAttr("disabled");

                            //add empty option and then loop through groups to add additional options
                            $("#cboGroup").append($("<option>", { text: "", value: "" }));
                            $(groups).each(function (i, e) {
                                $("#cboGroup").append($("<option>", { text: e.full_name, value: e.id }));
                            });
                        },
                        error: function (err) {
                            $("#alert").html("Error retrieving groups for network...");
                            $("#alert").show();
                        }
                    });
                }
                else {
                    $("#alert").html("Error connecting to Yammer...");
                    $("#alert").show();
                }
            });
        }
    });

    //wire change event on cboGroup
    $("#cboGroup").change(function () {
        $("#ddGroup").html($("#cboGroup option:selected").text());

        if ($("#cboGroup").val() != "") {
            $("#txtDateRange").removeAttr("disabled");
        }
        else {
            $("#txtDateRange").attr("disabled", "disabled");
        }

        if ($("#cboGroup").val() != "" && isDate($("#txtDateRange").val()))
            $("#btnConfigExport").removeAttr("disabled");
        else
            $("#btnConfigExport").attr("disabled", "disabled");
    });

    //wire up the logic for the dataset options
    $("#dsNew").click(function () {
        $("#ddDatasetType").html("Create New");
        $("#rowtxtDataset").show();
        $("#rowCboDataset").hide();
        $("#rowResetAppend").hide();
        $("#confirmClearAppend").hide();
        if ($("#dsNew")[0].checked && $("#txtDataset").val().length > 2)
            $("#btnConfigDataset").removeAttr("disabled");
        else
            $("#btnConfigDataset").attr("disabled", "disabled");
    });
    $("#dsExisting").click(function () {
        $("#ddDatasetType").html("Use Existing");
        $("#rowtxtDataset").hide();
        $("#rowCboDataset").show();
        $("#rowResetAppend").show();
        $("#confirmClearAppend").show();
        if ($("#dsExisting")[0].checked && $("#cboDataset").val().length > 2)
            $("#btnConfigDataset").removeAttr("disabled");
        else
            $("#btnConfigDataset").attr("disabled", "disabled");
    });
    $("#txtDataset").keyup(function () {
        $("#ddDatasetName").html($("#txtDataset").val());
        if ($("#dsNew")[0].checked && $("#txtDataset").val().length > 2)
            $("#btnConfigDataset").removeAttr("disabled");
        else
            $("#btnConfigDataset").attr("disabled", "disabled");
    });
    $("#cboDataset").change(function () {
        $("#ddDatasetName").html($("#cboDataset option:selected").text());
        if ($("#dsExisting")[0].checked && $("#cboDataset").val().length > 2)
            $("#btnConfigDataset").removeAttr("disabled");
        else
            $("#btnConfigDataset").attr("disabled", "disabled");
    });
    $("dsReset").click(function () {
        $("#ddClearAppend").html("Clear");
    });
    $("dsAppend").click(function () {
        $("#ddClearAppend").html("Append");
    });

    //wire up the process button
    $("#btnProcess").click(function () {
        //initialize the start date
        dateRange = new Date($('#txtDateRange').val()).getTime();

        //display dialog
        $("#processModal").modal("show");

        //check if this is a create new or now
        if ($("#dsNew")[0].checked) {
            $("#procStatus").html("Creating dataset " + $("#txtDataset").val());

            //create new dataset
            createDataset($("#txtDataset").val(), function (datasetId) {
                //start processing with the datasetId
                getActivity(0, datasetId);
            });
        }
        else if ($("#dsExisting")[0].checked) {
            $("#procStatus").html("Clearing dataset " + $("#cboDataset option:selected").text());

            //use existing dataset, but check if we should clear it first
            if ($("dsReset")[0].checked) {
                //clear and the load
                clearDataset(function () {
                    getActivity(0, $("#cboDataset").val());
                });
            }
            else if ($("dsAppend")[0].checked) {
                //append to existing
                getActivity(0, $("#cboDataset").val());
            }
        }
    });

    //hide alert
    $("#alert").click(function () { $("#alert").hide(); });
});

// determines if the string is in a date format that matches mm/dd/yyyy
function isDate(str) {
    var pattern = new RegExp(/^(0?[1-9]|1[012])[\/\-\.](0?[1-9]|[12][0-9]|3[01])[\/\-\.](\d{4})$/);
    return pattern.exec(str);
}

// sets up the dataset for loading
function createDataset(name, callback) {
    var data = { name: name, tables: [{ name: "Messages", columns: [{ name: "Id", dataType: "string" }, { name: "Thread", dataType: "string" }, { name: "Created", dataType: "DateTime" }, { name: "Client", dataType: "string" }, { name: "User", dataType: "string" }, { name: "UserPic", dataType: "string" }, { name: "Attachments", dataType: "Int64" }, { name: "Likes", dataType: "Int64" }, { name: "Url", dataType: "string" }] }] };
    $.ajax({
        url: "/api/PowerBI/CreateDataset",
        type: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (datasetId) {
            callback(datasetId);
        },
        error: function (er) {
            $("#alert").html("Error creating dataset...");
            $("#alert").show();
        }
    });
}

// clear rows from existing dataset
function clearDataset(datasetId, callback) {
    var data = { datasetId: datasetId, tableName: "Messages" };
    $.ajax({
        url: "/api/PowerBI/ClearTable",
        type: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (data) {
            callback();
        },
        error: function (er) {
            $("#alert").html(("Error clearing rows in dataset {0}...").replace("{0}", $("#cboDataset option:selected").text()));
            $("#alert").show();
        }
    });
}

// adds rows to the dataset
function addRows(datasetId, rows, callback) {
    var data = { datasetId: datasetId, tableName: "Messages", rows: rows };
    $.ajax({
        url: "/api/PowerBI/AddTableRows",
        type: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (data) {
            callback();
        },
        error: function (er) {
            $("#alert").html("Error adding rows to dataset");
            $("#alert").show();
        }
    });
}

// recursively gets the activity for the selected group and date range
function getActivity(cnt, datasetId, last) {
    $("#procStatus").html("Processing messages...");
    var delay = 0;
    var url = "https://api.yammer.com/api/v1/messages/in_group/" + $("#cboGroup").val() + ".json";
    if (cnt > 0) {
        url += "?older_than=" + last;

        // remove anything from the queue over 30 second old
        var now = new Date();
        while ((now.getTime() - callqueue[callqueue.length - 1].getTime()) >= 30000)
            callqueue.pop();

        // check if the queue is full and delay accordingly
        if (callqueue.length == 10) {
            delay = (30000 - (now.getTime() - callqueue[callqueue.length - 1].getTime()));
            //$("#procTitle").html("Request Queued...");
        }
    }

    // execute the API request on a delay
    window.setTimeout(function (url, cnt) {
        // mark the call in the calling queue
        callqueue.unshift(new Date());
        //$("#procTitle").html("Processing Group...");

        // get messages
        yam.platform.request({
            url: url,
            merthod: "GET",
            success: function (data) {
                // function for looking up message references
                var getRef = function (id) {
                    for (i = 0; i < data.references.length; i++) {
                        if (data.references[i].id == id)
                            return data.references[i];
                    }
                    return null;
                };

                // function for formatting the date in a mm/dd/yyyy hh:mm:ss format
                var formatDate = function (dateString) {
                    var yyyy = dateString.substring(0, 4);
                    var mm = dateString.substring(5, 7);
                    var dd = dateString.substring(8, 10);
                    var time = dateString.substring(11, 19);
                    return mm + "/" + dd + "/" + yyyy + " " + time;
                };

                // loop through messages
                var lastDate = 0;
                var lastID = null;
                var rows = [];
                $(data.messages).each(function (i, e) {
                    lastDate = new Date(e.created_at).getTime();
                    lastID = e.id;
                    if (lastDate >= dateRange) {
                        var sender = getRef(e.sender_id);
                        rows.push({ Id: e.id, Thread: e.thread_id, Created: formatDate(e.created_at), Client: e.client_type, User: sender.full_name, UserPic: sender.mugshot_url, Attachments: e.attachments.length, Likes: e.liked_by.count, Url: e.web_url });
                        cnt++;
                    }
                });

                //write the rows to the dataset
                addRows(datasetId, rows, function () {
                    $("#procProcessed").html(cnt + " messages processed");
                });

                //determine if there are more items to retrieve
                if (data.meta.older_available && lastDate >= dateRange)
                    getActivity(cnt, datasetId, lastID);
                else {
                    //we are complete...move to final step
                    $("#processModal").modal("hide");
                    $("#rowProcess").hide();
                    $("#rowPowerBI").show();
                    $("#step4").removeClass("active");
                    $("#step5").addClass("active");
                }
            },
            error: function (err) {
                $("#alert").html("Error querying group data...");
                $("#alert").show();
            }
        });
    }, delay, url, cnt);
}