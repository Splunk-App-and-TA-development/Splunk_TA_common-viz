# **Heat Map Viz**

This app gives you a new way to visualize your data, allowing you to better communicate information in dashboards and reports. After installing this app you will see Heat Map Viz as an additional item in the visualization picker in Search and Dashboards.

The Heat Map Viz shows a grid of related measurements, with the color intensity relative to the metric value. You can use the Heat Map Viz to provide information at a glance, in a dashboard panel.

![heatmap-viz](https://cdn.apps.splunk.com/media/public/docimages/333c95fa-5ab0-11e9-a7a1-0ac68166e81e.png)


### **Version Support**
8.0, 7.3, 7.2, 7.1, 7.0, 6.6, 6.5, 6.4

## **Who is this app for?**
This app is for anyone who wants to display several metrics on a small area of a dashboard.

## **How does the app work?**
This app provides a visualization that you can use in your own apps and dashboards.

To use it in your dashboards, simply install the app, and create a search that provides the values you want to display.

## **Usecases for the Heat Map Visualization**
- Displaying server metrics like CPU, Memory, I/O, and Disk usage over time
- Comparing sales volume by category over time
- Showing related application metrics in a discreet dashboard panel
- Highlighting any metrics relative to other entities

The following fields can be used in the search:
- _time (required): The easiest way to construct a search is to use the | timechart command, with a by clause.
- category fields (required): Each field name will become a label on the side, with the values being used to set the color based on thresholds. The order of the fields determines the order shown in the viz.

## **Example Search**
```
| gentimes start=-7 increment=4h
| eval "Server Availability"=random()%100, "Customer Satisfaction"=random()%100,"Server Performance"=random()%100, _time=starttime
| table _time, "Server Availability","Customer Satisfaction","Server Performance"
```

### **Tokens**
Tokens are generated each time you click a cell. This can be useful if you want to populate another panel on the dashboard with a custom search, or link to a new dashboard with the tokens carrying across.

- **Value:** This is the numeric field for the cell you clicked. Default value: $hm_token_value$
- **Label:** This is the field name for the cell you clicked. Default value: $hm_token_label$
- **Time:** This is the '_time' field for the selection. Default value: $hm_token_time$


### **Save to Desktop**
If you click the hamburger menu at the top right, you can download a screenshot or CSV export to your desktop:

![save-to-desk](https://cdn.apps.splunk.com/media/public/docimages/4b6ec342-1bf6-11eb-8116-0665ab672ae3.png)

### **Rounded Squares with Values**
In additon to squares you can choose round cells. You also have the option of including the value in the cell:

![rounded-values](https://cdn.apps.splunk.com/media/public/docimages/61d306c2-5ab2-11e9-863a-0213ea3922fc.png)

### **Limits**
The visualization is bound by the following limits:
Total results: 50,000

## **Release Notes**
Version 1.3.1<br>
Nov. 5, 2020

#### v 1.3.1
- Added option to convert time to UTC. This is off by default to allow timechart results to match the visualization timestamps.

#### v 1.3.0
- Updated Apex Charts to version 3.22.0
- Fixed label colors in dark mode
- Added ability to download a CSV Export in addition to image exports
- Set the low/medium/high/critical text labels to a custom value - Legend: Low/Medium/High/Critical
- Fix for shading negative values in charts - Colors: Reverse Negative Shade
- Optionally hide the white border on cells - General: Hide Cell Borders
- Reorganized options menu