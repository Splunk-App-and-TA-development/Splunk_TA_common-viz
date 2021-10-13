Pictorial Chart Viz
Pictorial Chart Visualization
Version: 1.0.0
Created by Daniel Spavin (daniel@spavin.net)

Pictorial Chart Viz - v1.0.0
Version Support
7.3, 7.2, 7.1, 7.0, 6.6, 6.5, 6.4

Who is this app for?
This app is for dashboard designers who want to compare relative sizes of metrics in an infographic style pictorial chart.


How does the app work?
This app provides a visualization that you can use in your own apps and dashboards.

To use it in your dashboards, simply install the app, and create a search that provides the values you want to display.


Usecases for the Pictorial Chart Visualization:
Displaying server status based on CPU, Memory, I/O, and Disk usage
Showing user or customer ratings in a scale
Comparing the ratio of good vs bad results or outcomes
Showing the comparative size of events related to eachother

The following fields can be used in the search:
label (required, defaults to the first field): The label for a group of related items.
value (required, defaults to teh second field): The value for a unique group.
icon (optional): This selects the icon to use in the pictorial chart.
color (optional): Used to set the color of the icon in the chart.
Options can be overwritten, so if type or color is set multiple times in the search results, the last value will be used.


Example Search
| makeresults count=5
| streamstats count as id
| eval icon=case(id==1, "frown", id==2, "flushed", id==3, "grin", id==4, "grin-stars",id==5, "grin-hearts")
| eval label=case(id==1, "Unhappy", id==2, "Unsure", id==3, "Happy", id==4, "Amazing",id==5, "Love It")
| eval value = id + random()%5
| sort id
| table label, value, icon


Tokens
Tokens are generated each time you click an item. This can be useful if you want to populate another panel on the dashboard with a custom search, or link to a new dashboard with the tokens carying across.

Label text: This is the name of the selected group. Default value: $pc_label_token$
Value : This is the value of the selected group you clicked. Default value: $pc_value_token$

# Release Notes #
v 1.0.0
Initial version

Issues and Limitations
If you have a bug report or feature request, please contact daniel@spavin.net


Privacy and Legal
No personally identifiable information is logged or obtained in any way through this visualizaton.

For support
Send email to daniel@spavin.net

Support is not guaranteed and will be provided on a best effort basis.


3rd Party Libraries
Icons made by https://fontawesome.com