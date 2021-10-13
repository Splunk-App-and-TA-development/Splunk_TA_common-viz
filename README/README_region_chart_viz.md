![screenshot](https://raw.githubusercontent.com/ChrisYounger/region_chart_viz/master/appserver/static/demo.png)


# Region Chart Viz
A line chart visualization that supports data-driven, colored regions.

Can be used to show:
* configured thresholds
* the spread of data (for example using standard deviation/interquartile range)
* where data might be incomplete (because it is still arriving)
* maintenance periods
* business hours

Provide valuable context to your line charts. Built with D3.


![how-to-use](https://cdn.apps.splunk.com/media/public/docimages/15e20448-7339-11ea-8a78-0afc03cdee84.png)

## **Usage**
This visualisation should work with any data that works with the Splunk built-in line chart. The first column (which is often "_time") will be the X-axis and subsequent columns will be rendered as lines (so they should be numeric values). A column with the specific name "regions" should be supplied which defines the regions to draw behind the chart.

This is how the data should look:

![how-to-look](https://cdn.apps.splunk.com/media/public/docimages/8628f93e-6383-11ea-a800-0628ba56719c.png)

Regions are drawn per-column vertically, from bottom to top. Horizontal regions can be drawn by setting the same region value on multiple columns. See the examples below.

The format for the region field is comma-seperated key-value pairs and best explained with examples:

| "regions" field | Result |
| red | The most basic example that creates a region. A red column of data will be drawn from the bottom of the chart to the top of chart. Region colors can be specificed as valid HTML colours (RBG, Hex, named colours, etc..). |
| Out of hours=#ccccc | Create a named region in a grey color for the chart column. This name will be seen on the tooltip when hovering the chart. |
| green,1000,orange,1500,red | Create a green region from the bottom of the chart to 1000, an orange region from 1000 to 1500 and a red region from 1500 to the top of the chart. |
| ,1000,Warning=orange,1500,Critical=red | Create a orange region from 1000 to 1500 and a red region from 1500 to the top of the chart. |



## **Examples**
#### Charting ITSI Time-Based Policies
Especially useful for visualizing the adaptive thresholds that were set by ITSI (also works with ITSI static thresholds). Requires add-on Get ITSI Thresholds - custom command
```
index="itsi_summary" itsi_service_id=c2d8f443-fd65-4872-b3b8-1ac7757b57f6 kpiid=a672f70631ce28a0be31e1f2 indexed_is_service_max_severity_event=0 
| timechart span=1h avg(alert_value) as alert_value 
| getitsithresholds service=c2d8f443-fd65-4872-b3b8-1ac7757b57f6 kpi=a672f70631ce28a0be31e1f2
```

#### Show business hours
Over a 24 hour chart, show the hours that are important.
```
... search ...
| timechart span=1h avg(series1) as avg
| eval hour = strftime(_time, "%H")
| eval regions = if(hour > 17 OR hour < 9,"Out of hours=#009DD9","") 
| fields - hour
```

![show-business-hours](https://cdn.apps.splunk.com/media/public/docimages/03adf1dc-6386-11ea-8464-0a5ced90e458.png)


#### Show static thresholds
Hardcoded simple static thresholds.
```
... search ... 
| timechart span=1m avg(series1) as avg
| eval regions = "normal=#99D18B,5000,Warning=#FCB64E,7000,Error=#B50101"
```

![show-static-thresholds](https://cdn.apps.splunk.com/media/public/docimages/0f26fde2-6386-11ea-82f8-0a385577a33e.png)


#### Show that data might be incomplete
Add a gray region to highlight the area of the chart that is less than 15 minutes old. Can easily be adapted to show a maintinance window.
```
... search ... 
| timechart span=1h avg(series1) as avg
| eval regions = if(_time > (now() - 900),"Data still arriving=#aaaaaa","")
```

![show-incomplete-data](https://cdn.apps.splunk.com/media/public/docimages/11ba059a-6386-11ea-9c57-0a5ced90e458.png)


#### Show 2/3 standard deviations above/below the average, for same time last week
Calculate the historical average and standard deviation of the data. Then mark regions based on the standard deviations.
```
... search over 2 weeks of data ... 
| timechart span=1h avg(FIELD) as avg stdev(FIELD) as stddev 
| timewrap w series=short align=now 
| where _time > now() - 86400 
| eval regions = "3 standard deviations below=#B50101," + tostring(avg_s1 - stddev_s1 * 3) + ",2 standard deviations below=#FCB64E," + tostring(avg_s1 - stddev_s1 * 2) + ",normal=#99D18B," + tostring(avg_s1 + stddev_s1 * 2) + ",2 standard deviations above=#FCB64E," + tostring(avg_s1 + stddev_s1 * 3) + ",3 standard deviations above=#B50101" 
| table _time avg_s0 avg_s1 regions
```

![show-standard-deviations](https://cdn.apps.splunk.com/media/public/docimages/13d5d8e0-6386-11ea-97ed-0a5ced90e458.png)


### **Formatting options**
There are two modes of rendering the lines when there are multiple series of data. ***Lighter/Dashed*** is best suited when the data series are historical trend lines. E.g. Comparing CPU performance this week against last week and the week before. "Coloured" is best suited when the data series are peers. E.g. The average CPU of three servers in a cluster.

![show-formatting-1](https://cdn.apps.splunk.com/media/public/docimages/6c8b900c-6385-11ea-97ed-0a5ced90e458.png)

![show-formatting-2](https://cdn.apps.splunk.com/media/public/docimages/67015ee6-6385-11ea-94d4-0a5ced90e458.png)

There are some text overlays that can be enabled. Note that these overlays are only for the primary data series.

![show-formatting-3](https://cdn.apps.splunk.com/media/public/docimages/6278f2b2-6385-11ea-bf7d-0a5ced90e458.png)


### **Third party software**
The following third-party libraries are used by this app. Thank you!
jQuery - MIT - https://jquery.com/
D3 - BSD 3-Clause - https://d3js.org/
TinyColor - MIT - https://github.com/bgrins/TinyColor
Font Awesome - Creative Commons Attribution-ShareAlike 4.0 License - https://fontawesome.com/

## **Release Notes** 

#### Version 1.0.5
April 21, 2021

v1.0.5
* Can compare regions using >= or > using new option in format menu
* Fixes for dark mode

#### v1.0.4
* Minor bug fixes



See also [Get ITSI Thresholds - a custom command](https://splunkbase.splunk.com/app/4910/) to retrieve ITSI time-based thresholds.

Copyright (C) 2020 Chris Younger | [Splunkbase](https://splunkbase.splunk.com/app/4911/#/details) | [Source code](https://github.com/ChrisYounger/region_chart_viz) | [Questions, Bugs or Suggestions](https://answers.splunk.com/app/questions/4911.html) | [My Splunk apps](https://splunkbase.splunk.com/apps/#/author/chrisyoungerjds)

