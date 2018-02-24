(function() {
    // Create the connector object
    var myConnector = tableau.makeConnector();

    // Define the schema
    myConnector.getSchema = function(schemaCallback) {
        var cols = [{
            id: "timestamp",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "agent_gender",
            alias: "agent_gender",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "status",
            alias: "status",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "subzone",
            alias: "subzone",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "hyperUnique_unique_agents",
            alias: "hyperUnique_unique_agents",
            dataType: tableau.dataTypeEnum.float
        }];

        var tableSchema = {
            id: "dataSpark",
            alias: "Dataspark realtimefootfall",
            columns: cols
        };

        schemaCallback([tableSchema]);
    };

    // Download the data
    myConnector.getData = function(table, doneCallback) {

      var data = {
        "location": {
          "locationType": "locationHierarchyLevel",
          "levelType": "subzone",
          "id": "OTSZ02"
        },
        "dimensionFacets": [
              "agent_year_of_birth", "agent_gender", "agent_nationality", "status"
          ],
        "period": 1440,
         "aggregations": [
          {
            "metric": "unique_agents",
            "type": "hyperUnique"
          }
        ]
      };

      var key =  "qGGqjQqT_5XUaQvfFEfCascG9zka";
      var secret = "CDfaRvgeJOwUoSNhMFf0JSFELkYa";
      var token = null;
      $.ajax({
        type: "POST",
        async:false,
        data: { 'grant_type': 'client_credentials' },
        beforeSend: function (xhr) {
            xhr.setRequestHeader ("Authorization", "Basic " + btoa(key + ":" + secret));
        },
        url : "https://apistore.datasparkanalytics.com/token",
        success: function(data){
          token = data["access_token"];
        }
      });


      $.ajax({
        type: "POST",
        data: JSON.stringify(data),
        contentType: 'application/json',
        beforeSend: function (xhr) {
          console.log(token);
          xhr.setRequestHeader ("Authorization", "Bearer " + token);
          xhr.setRequestHeader ("Content-Type", "application/json");
        },
        url : "https://apistore.datasparkanalytics.com/realtimefootfall/v2/query",
        success: function(data){
          var tableData = [];
          for (var i = 0, len = data.length; i < len; i++) {
            tableData.push({
              "timestamp": Date.parse(data[i].timestamp).toString(),
              "agent_gender": data[i]["event"].agent_gender,
              "hyperUnique_unique_agents": data[i]["event"].hyperUnique_unique_agents,
              "status": data[i]["event"].status,
              "subzone": data[i]["event"].subzone,
            });
          }
          table.appendRows(tableData);
          doneCallback();
        }
      });

/*
        $.getJSON("http://apistore.datasparkanalytics.com:8280/realtimefootfall/v2/query", function(resp) {
            var feat = resp.features, tableData = [];

            // Iterate over the JSON object
            for (var i = 0, len = feat.length; i < len; i++) {
                tableData.push({
                    "id": feat[i].id,
                    "mag": feat[i].properties.mag,
                    "title": feat[i].properties.title,
                    "location": feat[i].geometry
                });
            }

            table.appendRows(tableData);
            doneCallback();
        });
        */
    };

    tableau.registerConnector(myConnector);

    // Create event listeners for when the user submits the form
    $(document).ready(function() {
        $("#submitButton").click(function() {
            tableau.connectionName = "DataSpark Real Time Data"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    });
})();
