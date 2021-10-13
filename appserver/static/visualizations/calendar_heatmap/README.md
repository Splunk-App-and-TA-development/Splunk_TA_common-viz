# Calendar Heat Map

Documentation:
http://docs.splunk.com/Documentation/CalendarHeatMap/1.2.0/CalendarHeatMapViz/CalendarHeatMapIntro

## Sample Queries

```
index=_internal | timechart span=1d count by sourcetype
```