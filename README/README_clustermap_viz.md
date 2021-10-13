# **Custom Cluster Map Visualization**

This app adds a custom cluster-map visualization to your Splunk instance. It shows styled radiation icons in different colors for each cluster of geographical results, including the numerical value as a label.

## **What does it do?**
The custom cluster map visualization displays numeric values on a map. Both cluster icon size and color are determined by the numeric value automatically.

## **Example Usage**
The visualization expects search results produced by the geostats search command. Results are postprocessed automatically using the geofilter command in order to retrieve results for the visible map area and zoom level.

Note: it does support a split-by clause, only a single numeric value by location can be processed.
```
sourcetype=access_combined | iplocation clientip | geostats count
sourcetype=gps_locations | fields lat lng signal_strength | geostats avg(signal_strength) latfield=lat longfield=lng maxzoomlevel=18
```


## **Release Notes**

#### Version 1.2
July 6, 2016
- Added support for custom map tiles