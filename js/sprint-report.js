
function visualizeData(url) {
  //url: "http://localhost/toomasr/sprint-analysis/input.xml",
  $.ajax({
        type: "GET",
        url: url,
        dataType: "text",
        success: function(data) {
          var issueData = parseData(data)
          var colors = ["#dc3912", "#3366cc", "#ff9900",
                        "#109618", "#b77322", "#8b0707"]
          drawIssueTypeCountChart(issueData['issueTypeCount'], colors)
          drawIssueTypeHoursChart(issueData['issueTypeHours'], colors)
          drawIssueTypeOHoursChart(issueData['issueTypeOHours'], colors)
          drawIssuesTable(issueData['issuesByType'], issueData['issueTypeOHours'], issueData['issueTypeHours'])
        }
  });
}

function parseData(xmlText) {
  xmlDoc = $.parseXML(xmlText)
  $xml = $( xmlDoc )

  var data = {'issueTypeCount':{}, 'issueTypeHours':{}, 'issueTypeOHours':{},
                'issuesByType':{}}
  var table = $("#general")
  $xml.find("rss channel item").each(
    function() {
      var title = $($(this).find("title")).text(); 
      var assignee = $($(this).find("assignee")).text(); 

      // Sometimes can be Nan, true for Epics for example 
      var oEstimateString = $($(this).find("timeoriginalestimate")).text(); 
      var oEstimateSeconds = $($(this).find("timeoriginalestimate")).attr("seconds"); 
      oEstimateSeconds = parseInt(oEstimateSeconds)
      if (isNaN(oEstimateSeconds))
        oEstimateSeconds = 0;


      // Sometimes can be NaN, especially when the sprint is actually in progress
      var timespentString = $($(this).find("timespent")).text(); 
      var timespentSeconds = $($(this).find("timespent")).attr("seconds"); 
      timespentSeconds = parseInt(timespentSeconds)
      if (isNaN(timespentSeconds))
        timespentSeconds = 0;

      var key = $($(this).find("key")).text(); 
      var type = $($(this).find("type")).text(); 
      var parentId = $($(this).find("parent")).attr("id")

      if (isNaN(parseInt(data['issueTypeCount'][type])))
        data['issueTypeCount'][type] = 1
      else
        data['issueTypeCount'][type]++;

      if (isNaN(parseInt(data['issueTypeHours'][type])))
        data['issueTypeHours'][type] = timespentSeconds
      else
        data['issueTypeHours'][type] += timespentSeconds;

      if (isNaN(parseInt(data['issueTypeOHours'][type])))
        data['issueTypeOHours'][type] = oEstimateSeconds
      else
        data['issueTypeOHours'][type] += oEstimateSeconds;

      // also lets add to the issues collection
      if (typeof data['issuesByType'][type] == "undefined") {
        data['issuesByType'][type] = new Array();
      }
      data['issuesByType'][type].push(
                { 'title':title, 'key': key, 'parentId':parentId,
                  'oEstimate':oEstimateSeconds, 'estimate':timespentSeconds,
                  'estimateDiff': (oEstimateSeconds-timespentSeconds)
                }
      );
    }
  )
  return data;
}

function drawIssueTypeCountChart(typeData, colors) {
  var data = new google.visualization.DataTable();
  data.addColumn("string", "Type")
  data.addColumn("number", "Number")

  for (item in typeData) {
    data.addRow([item, typeData[item]])
  }

  var options = {'title':'Sprint breakdown by issue count',
                  'width':400,
                  'height':400,
                  'colors': colors
                };
  //var chart = new google.visualization.PieChart($('#issue_count_chart')[0]);
  //chart.draw(data, options);
}

function drawIssueTypeHoursChart(typeData, colors) {
  var data = new google.visualization.DataTable();
  data.addColumn("string", "Type")
  data.addColumn("number", "Number")

  for (item in typeData) {
    data.addRow([item, typeData[item]])
  }

  var options = {'title':'Sprint breakdown by time invested',
                  'width':400,
                  'height':400,
                  'colors': colors
  };
  var chart = new google.visualization.PieChart($('#issue_hours_chart')[0]);
  chart.draw(data, options);
}

function drawIssueTypeOHoursChart(typeData, colors) {
  var data = new google.visualization.DataTable();
  data.addColumn("string", "Type")
  data.addColumn("number", "Number")

  for (item in typeData) {
    data.addRow([item, typeData[item]])
  }

  var options = {'title':'Sprint breakdown by original estimate',
                  'width':400,
                  'height':400,
                  'colors':colors
  };
  var chart = new google.visualization.PieChart($('#issue_o_hours_chart')[0]);
  chart.draw(data, options);
}

function drawIssuesTable(issues, byOHours, byHours) {
  for (var issueType in issues) {
    // cycle by issue
    var section = "<tr><td><h3>" + issueType;
    section = section + "s ("+ humanize.humanizeSeconds(byHours[issueType], 3) + " - ";
    section = section + humanize.humanizeSeconds(byOHours[issueType], 3) + ")";
    section = section + "</h3><table>";
    var subRows = new Array()

    var sortable = [];
    for (var key in issues[issueType]) {
      sortable.push([key, issues[issueType][key]['estimateDiff']]);
    }
    sortable = sortable.sort(function(a,b) {return a[1] - b[1];});

    for (var i = 0; i < sortable.length; i++) {
      var issue = issues[issueType][sortable[i][0]]
      var title = issue.title.replace('['+issue.key+']', '')
      var diff = issue.estimateDiff;
      var cssClass = "success";

      if (issue.oEstimate === 0) {
        cssClass = "notEstimated"
      }
      else if (diff < 0) {
        diff = Math.abs(diff)
        cssClass = 'fail';
      }
      else if (issue.estimateDiff === 0) {
        cssClass = 'success'
      }
      else {
        cssClass = "quicker"
      }

      var subRow = "<tr><td><a href='https://zeroturnaround.atlassian.net/browse/"+issue.key+"'>[" + issue.key + "]</a> <span class='"+cssClass+"'>" + title + "</span> ("+ humanize.humanizeSeconds(diff, 3) +")" + "</td></tr>";
      subRows.push(subRow)
    }
    section += subRows.join("\n")
    section += "</td></tr><table>";
    $('#issues').append(section)
  }
}
